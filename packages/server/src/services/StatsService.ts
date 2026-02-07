/**
 * Stats Service - Handles game statistics and history
 */

import { prisma } from '../db/prisma.js';
import type { GameSession, GameParticipant, UserStats } from '@prisma/client';
import type { GameType } from '@playtogether/shared';
import { MOODY_CONFIG } from '@playtogether/shared';
import { moodyService } from './MoodyService.js';
import { monthlyScoreService } from './MonthlyScoreService.js';
import { achievementService } from './AchievementService.js';

export interface GameResult {
  userId: string;
  score: number;
  rank: number;
  stats?: Record<string, any>;
}

export class StatsService {
  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    return prisma.userStats.findUnique({
      where: { userId },
    });
  }

  /**
   * Start a new game session
   */
  async startGameSession(
    roomCode: string,
    gameType: GameType,
    playerIds: string[],
    settings: Record<string, any>
  ): Promise<GameSession> {
    const session = await prisma.gameSession.create({
      data: {
        roomCode,
        gameType,
        settings,
        participants: {
          create: playerIds.map((userId) => ({
            userId,
            score: 0,
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    // Update streak for all players
    await Promise.all(
      playerIds.map((userId) => moodyService.updateStreak(userId))
    );

    return session;
  }

  /**
   * End a game session and record results
   */
  async endGameSession(
    sessionId: string,
    results: GameResult[],
    durationMinutes: number
  ): Promise<void> {
    // Sort by score to determine ranks
    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    const winnerId = sortedResults[0]?.userId;

    // Update session
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        winnerId,
        durationMinutes,
        finalScores: Object.fromEntries(
          results.map((r) => [r.userId, r.score])
        ),
      },
    });

    // Update participants
    await Promise.all(
      sortedResults.map((result, index) =>
        prisma.gameParticipant.updateMany({
          where: {
            gameSessionId: sessionId,
            userId: result.userId,
          },
          data: {
            score: result.score,
            rank: index + 1,
            stats: result.stats,
          },
        })
      )
    );

    // Update user stats
    await Promise.all(
      results.map(async (result, index) => {
        const isWinner = index === 0;
        await this.updateUserStats(result.userId, isWinner, durationMinutes);

        // Add XP
        const xp = isWinner
          ? MOODY_CONFIG.xpPerGameWon
          : MOODY_CONFIG.xpPerGamePlayed;
        await moodyService.addXp(result.userId, xp);
      })
    );

    // Record monthly scores
    const playerIds = results.map((r) => r.userId);
    await monthlyScoreService.recordGamePlayed(playerIds, winnerId);

    // Check achievements for all participants
    await Promise.all(
      playerIds.map((id) => achievementService.checkAchievements(id).catch(console.error))
    );
  }

  /**
   * Update user stats after a game
   */
  private async updateUserStats(
    userId: string,
    won: boolean,
    durationMinutes: number
  ): Promise<void> {
    await prisma.userStats.update({
      where: { userId },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon: won ? { increment: 1 } : undefined,
        totalPlayTimeMinutes: { increment: durationMinutes },
      },
    });
  }

  /**
   * Update game-specific stats (stored as JSON)
   */
  async updateGameSpecificStats(
    userId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const currentStats = await this.getUserStats(userId);
    const existing = (currentStats?.gameSpecificStats as Record<string, any>) || {};

    await prisma.userStats.update({
      where: { userId },
      data: {
        gameSpecificStats: { ...existing, ...updates },
      },
    });
  }

  /**
   * Get user's game history
   */
  async getGameHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    games: Array<{
      id: string;
      gameType: string;
      score: number;
      rank: number | null;
      playedAt: Date;
      won: boolean;
    }>;
    total: number;
  }> {
    const [participants, total] = await Promise.all([
      prisma.gameParticipant.findMany({
        where: { userId },
        include: {
          gameSession: true,
        },
        orderBy: {
          gameSession: {
            createdAt: 'desc',
          },
        },
        take: limit,
        skip: offset,
      }),
      prisma.gameParticipant.count({ where: { userId } }),
    ]);

    return {
      games: participants.map((p) => ({
        id: p.gameSession.id,
        gameType: p.gameSession.gameType,
        score: p.score,
        rank: p.rank,
        playedAt: p.gameSession.createdAt,
        won: p.gameSession.winnerId === userId,
      })),
      total,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'gamesWon' | 'gamesPlayed' | 'level',
    limit: number = 10
  ): Promise<Array<{
    userId: string;
    username: string;
    value: number;
    rank: number;
  }>> {
    if (type === 'level') {
      const moodies = await prisma.moody.findMany({
        orderBy: [{ level: 'desc' }, { xp: 'desc' }],
        take: limit,
        include: {
          user: {
            select: { username: true },
          },
        },
      });

      return moodies.map((m, i) => ({
        userId: m.userId,
        username: m.user.username,
        value: m.level,
        rank: i + 1,
      }));
    }

    const stats = await prisma.userStats.findMany({
      orderBy: { [type]: 'desc' },
      take: limit,
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    return stats.map((s, i) => ({
      userId: s.userId,
      username: s.user.username,
      value: s[type],
      rank: i + 1,
    }));
  }

  /**
   * Get user's rank in a leaderboard
   */
  async getUserRank(
    userId: string,
    type: 'gamesWon' | 'gamesPlayed'
  ): Promise<number> {
    const userStats = await this.getUserStats(userId);
    if (!userStats) return 0;

    const higherCount = await prisma.userStats.count({
      where: {
        [type]: { gt: userStats[type] },
      },
    });

    return higherCount + 1;
  }
}

export const statsService = new StatsService();
