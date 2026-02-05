/**
 * Monthly Score Service - Handles monthly highscores and crown rewards
 */

import { prisma } from '../db/prisma.js';
import { moodyService } from './MoodyService.js';

// Crown cosmetic ID
const CROWN_ACCESSORY_ID = 'acc_monthly_crown';

export class MonthlyScoreService {
  /**
   * Get current month string (YYYY-MM)
   */
  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get previous month string (YYYY-MM)
   */
  getPreviousMonth(): string {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Record a game played together
   * Call this when a game session ends
   */
  async recordGamePlayed(playerIds: string[], winnerId: string | null): Promise<void> {
    const month = this.getCurrentMonth();

    // Update player connections (who played with whom)
    await this.updatePlayerConnections(playerIds);

    // Update monthly scores for all players
    await Promise.all(
      playerIds.map(async (playerId) => {
        const isWinner = playerId === winnerId;
        await this.updateMonthlyScore(playerId, month, isWinner);
      })
    );
  }

  /**
   * Update player connections (track who plays together)
   */
  private async updatePlayerConnections(playerIds: string[]): Promise<void> {
    // Create connections between all pairs of players
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        // Always store smaller ID first for consistency
        const [playerAId, playerBId] = [playerIds[i], playerIds[j]].sort();

        await prisma.playerConnection.upsert({
          where: {
            playerAId_playerBId: { playerAId, playerBId },
          },
          update: {
            gamesPlayedTogether: { increment: 1 },
            lastPlayedAt: new Date(),
          },
          create: {
            playerAId,
            playerBId,
            gamesPlayedTogether: 1,
          },
        });
      }
    }
  }

  /**
   * Update monthly score for a player
   */
  private async updateMonthlyScore(
    userId: string,
    month: string,
    won: boolean
  ): Promise<void> {
    await prisma.monthlyScore.upsert({
      where: {
        month_userId: { month, userId },
      },
      update: {
        gamesPlayed: { increment: 1 },
        wins: won ? { increment: 1 } : undefined,
        totalScore: { increment: won ? 10 : 1 }, // 10 points for win, 1 for participation
      },
      create: {
        month,
        userId,
        gamesPlayed: 1,
        wins: won ? 1 : 0,
        totalScore: won ? 10 : 1,
      },
    });
  }

  /**
   * Get monthly leaderboard for a player's group
   * (Only shows players who have played together)
   */
  async getMonthlyLeaderboard(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    userId: string;
    username: string;
    wins: number;
    gamesPlayed: number;
    totalScore: number;
    rank: number;
    hasCrown: boolean;
  }>> {
    const month = this.getCurrentMonth();

    // Get all players who have played with this user
    const connections = await prisma.playerConnection.findMany({
      where: {
        OR: [{ playerAId: userId }, { playerBId: userId }],
      },
    });

    // Get unique player IDs (including the requesting user)
    const connectedPlayerIds = new Set<string>([userId]);
    connections.forEach((conn) => {
      connectedPlayerIds.add(conn.playerAId);
      connectedPlayerIds.add(conn.playerBId);
    });

    // Get monthly scores for these players
    const scores = await prisma.monthlyScore.findMany({
      where: {
        month,
        userId: { in: Array.from(connectedPlayerIds) },
      },
      orderBy: [{ wins: 'desc' }, { totalScore: 'desc' }],
      take: limit,
    });

    // Get usernames
    const users = await prisma.user.findMany({
      where: { id: { in: scores.map((s) => s.userId) } },
      select: { id: true, username: true },
    });
    const usernameMap = new Map(users.map((u) => [u.id, u.username]));

    // Check who has the crown
    const crownHolder = await this.getCurrentCrownHolder();

    return scores.map((score, index) => ({
      userId: score.userId,
      username: usernameMap.get(score.userId) || 'Unknown',
      wins: score.wins,
      gamesPlayed: score.gamesPlayed,
      totalScore: score.totalScore,
      rank: index + 1,
      hasCrown: crownHolder?.userId === score.userId,
    }));
  }

  /**
   * Get current crown holder
   */
  async getCurrentCrownHolder(): Promise<{
    userId: string;
    username: string;
    wonMonth: string;
    wins: number;
    expiresAt: Date;
  } | null> {
    const now = new Date();

    const holder = await prisma.crownHolder.findFirst({
      where: {
        expiresAt: { gt: now },
      },
      orderBy: { awardedAt: 'desc' },
    });

    if (!holder) return null;

    const user = await prisma.user.findUnique({
      where: { id: holder.userId },
      select: { username: true },
    });

    return {
      userId: holder.userId,
      username: user?.username || 'Unknown',
      wonMonth: holder.wonMonth,
      wins: holder.wins,
      expiresAt: holder.expiresAt,
    };
  }

  /**
   * Check if a user has the crown
   */
  async userHasCrown(userId: string): Promise<boolean> {
    const holder = await this.getCurrentCrownHolder();
    return holder?.userId === userId;
  }

  /**
   * Process monthly reset - call this on the 1st of each month
   * Awards crown to the winner and resets for new month
   */
  async processMonthlyReset(): Promise<{
    winnerId: string | null;
    winnerUsername: string | null;
    wins: number;
  }> {
    const previousMonth = this.getPreviousMonth();
    const currentMonth = this.getCurrentMonth();

    // Find the winner of last month (most wins)
    const topScorer = await prisma.monthlyScore.findFirst({
      where: { month: previousMonth },
      orderBy: [{ wins: 'desc' }, { totalScore: 'desc' }],
    });

    if (!topScorer || topScorer.wins === 0) {
      console.log(`📊 No winner for ${previousMonth} - no games played`);
      return { winnerId: null, winnerUsername: null, wins: 0 };
    }

    // Calculate crown expiration (end of current month)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    expiresAt.setDate(1);
    expiresAt.setHours(0, 0, 0, 0);

    // Award the crown
    await prisma.crownHolder.upsert({
      where: { wonMonth: previousMonth },
      update: {
        userId: topScorer.userId,
        wins: topScorer.wins,
        gamesPlayed: topScorer.gamesPlayed,
        expiresAt,
      },
      create: {
        wonMonth: previousMonth,
        userId: topScorer.userId,
        wins: topScorer.wins,
        gamesPlayed: topScorer.gamesPlayed,
        expiresAt,
      },
    });

    // Unlock the crown cosmetic for the winner
    await moodyService.unlockCosmetic(topScorer.userId, CROWN_ACCESSORY_ID);

    // Auto-equip the crown
    await prisma.moody.update({
      where: { userId: topScorer.userId },
      data: { equippedAccessory: CROWN_ACCESSORY_ID },
    });

    // Get winner username
    const winner = await prisma.user.findUnique({
      where: { id: topScorer.userId },
      select: { username: true },
    });

    console.log(
      `👑 Crown awarded to ${winner?.username} for ${previousMonth} with ${topScorer.wins} wins!`
    );

    return {
      winnerId: topScorer.userId,
      winnerUsername: winner?.username || null,
      wins: topScorer.wins,
    };
  }

  /**
   * Get user's monthly stats
   */
  async getUserMonthlyStats(userId: string): Promise<{
    month: string;
    wins: number;
    gamesPlayed: number;
    totalScore: number;
    rank: number;
    hasCrown: boolean;
  } | null> {
    const month = this.getCurrentMonth();

    const score = await prisma.monthlyScore.findUnique({
      where: { month_userId: { month, userId } },
    });

    if (!score) {
      return {
        month,
        wins: 0,
        gamesPlayed: 0,
        totalScore: 0,
        rank: 0,
        hasCrown: await this.userHasCrown(userId),
      };
    }

    // Calculate rank
    const higherRanked = await prisma.monthlyScore.count({
      where: {
        month,
        OR: [
          { wins: { gt: score.wins } },
          {
            wins: score.wins,
            totalScore: { gt: score.totalScore },
          },
        ],
      },
    });

    return {
      month,
      wins: score.wins,
      gamesPlayed: score.gamesPlayed,
      totalScore: score.totalScore,
      rank: higherRanked + 1,
      hasCrown: await this.userHasCrown(userId),
    };
  }
}

export const monthlyScoreService = new MonthlyScoreService();
