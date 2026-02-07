/**
 * Achievement Service - Handles achievement checking and unlocking
 */

import { prisma } from '../db/prisma.js';
import type { Achievement, UserAchievement } from '@prisma/client';
import { getLevelFromXp } from '@playtogether/shared';

// Achievement definitions - will be seeded into DB on first check
const ACHIEVEMENT_DEFINITIONS = [
  // Games played
  { code: 'first_game', name: 'Erste Schritte', description: 'Spiele dein erstes Spiel', icon: '🎮', rarity: 'common', condition: { type: 'games_played', count: 1 }, xpReward: 50 },
  { code: 'games_10', name: 'Spieler', description: 'Spiele 10 Spiele', icon: '🕹️', rarity: 'common', condition: { type: 'games_played', count: 10 }, xpReward: 100 },
  { code: 'games_50', name: 'Veteran', description: 'Spiele 50 Spiele', icon: '🎖️', rarity: 'uncommon', condition: { type: 'games_played', count: 50 }, xpReward: 250 },
  { code: 'games_100', name: 'Enthusiast', description: 'Spiele 100 Spiele', icon: '🏅', rarity: 'rare', condition: { type: 'games_played', count: 100 }, xpReward: 500 },
  { code: 'games_500', name: 'Legende', description: 'Spiele 500 Spiele', icon: '👑', rarity: 'legendary', condition: { type: 'games_played', count: 500 }, xpReward: 1000 },

  // Games won
  { code: 'first_win', name: 'Erster Sieg', description: 'Gewinne dein erstes Spiel', icon: '🏆', rarity: 'common', condition: { type: 'games_won', count: 1 }, xpReward: 75 },
  { code: 'wins_10', name: 'Champion', description: 'Gewinne 10 Spiele', icon: '⭐', rarity: 'uncommon', condition: { type: 'games_won', count: 10 }, xpReward: 200 },
  { code: 'wins_50', name: 'Meister', description: 'Gewinne 50 Spiele', icon: '💫', rarity: 'rare', condition: { type: 'games_won', count: 50 }, xpReward: 500 },
  { code: 'wins_100', name: 'Unbesiegbar', description: 'Gewinne 100 Spiele', icon: '🌟', rarity: 'epic', condition: { type: 'games_won', count: 100 }, xpReward: 1000 },

  // Streaks
  { code: 'streak_3', name: 'Treu', description: 'Spiele 3 Tage hintereinander', icon: '🔥', rarity: 'common', condition: { type: 'streak', days: 3 }, xpReward: 100 },
  { code: 'streak_7', name: 'Wochenspieler', description: 'Spiele 7 Tage hintereinander', icon: '🔥🔥', rarity: 'uncommon', condition: { type: 'streak', days: 7 }, xpReward: 250 },
  { code: 'streak_30', name: 'Monatsmarathon', description: 'Spiele 30 Tage hintereinander', icon: '🔥🔥🔥', rarity: 'epic', condition: { type: 'streak', days: 30 }, xpReward: 750 },

  // Reactions
  { code: 'reactions_sent_10', name: 'Kommunikativ', description: 'Sende 10 Reaktionen', icon: '💬', rarity: 'common', condition: { type: 'reactions_sent', count: 10 }, xpReward: 50 },
  { code: 'reactions_sent_100', name: 'Expressiv', description: 'Sende 100 Reaktionen', icon: '🗣️', rarity: 'uncommon', condition: { type: 'reactions_sent', count: 100 }, xpReward: 200 },
  { code: 'reactions_received_50', name: 'Beliebt', description: 'Erhalte 50 Reaktionen', icon: '❤️', rarity: 'uncommon', condition: { type: 'reactions_received', count: 50 }, xpReward: 200 },

  // Levels
  { code: 'level_5', name: 'Aufsteiger', description: 'Erreiche Level 5', icon: '📈', rarity: 'common', condition: { type: 'level', level: 5 }, xpReward: 100 },
  { code: 'level_10', name: 'Erfahren', description: 'Erreiche Level 10', icon: '📊', rarity: 'uncommon', condition: { type: 'level', level: 10 }, xpReward: 300 },
  { code: 'level_25', name: 'Profi', description: 'Erreiche Level 25', icon: '💎', rarity: 'rare', condition: { type: 'level', level: 25 }, xpReward: 750 },
];

export interface AchievementWithStatus {
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface UnlockedAchievement {
  code: string;
  name: string;
  icon: string;
  xpReward: number;
}

export class AchievementService {
  private seeded = false;

  /**
   * Ensure achievements are seeded in DB
   */
  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievement.upsert({
        where: { code: def.code },
        update: {
          name: def.name,
          description: def.description,
          icon: def.icon,
          rarity: def.rarity,
          condition: def.condition,
          xpReward: def.xpReward,
        },
        create: {
          code: def.code,
          name: def.name,
          description: def.description,
          icon: def.icon,
          rarity: def.rarity,
          condition: def.condition,
          xpReward: def.xpReward,
        },
      });
    }

    this.seeded = true;
  }

  /**
   * Get all achievements with unlock status for a user
   */
  async getAchievements(userId: string): Promise<AchievementWithStatus[]> {
    await this.ensureSeeded();

    const [achievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { code: 'asc' } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

    const unlockedMap = new Map<string, Date>();
    for (const ua of userAchievements) {
      unlockedMap.set(ua.achievementId, ua.unlockedAt);
    }

    return achievements.map((a) => ({
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      rarity: a.rarity,
      xpReward: a.xpReward,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id),
    }));
  }

  /**
   * Check and unlock achievements for a user
   * Returns newly unlocked achievements
   */
  async checkAchievements(userId: string): Promise<UnlockedAchievement[]> {
    await this.ensureSeeded();

    const [stats, moody, existingUnlocks, achievements] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.moody.findUnique({ where: { userId } }),
      prisma.userAchievement.findMany({ where: { userId } }),
      prisma.achievement.findMany(),
    ]);

    if (!stats || !moody) return [];

    const unlockedIds = new Set(existingUnlocks.map((u) => u.achievementId));
    const { level } = getLevelFromXp(moody.xp);
    const newlyUnlocked: UnlockedAchievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const condition = achievement.condition as Record<string, any>;
      let met = false;

      switch (condition.type) {
        case 'games_played':
          met = stats.gamesPlayed >= condition.count;
          break;
        case 'games_won':
          met = stats.gamesWon >= condition.count;
          break;
        case 'streak':
          met = moody.currentStreak >= condition.days;
          break;
        case 'reactions_sent':
          met = stats.reactionsSent >= condition.count;
          break;
        case 'reactions_received':
          met = stats.reactionsReceived >= condition.count;
          break;
        case 'level':
          met = level >= condition.level;
          break;
      }

      if (met) {
        // Unlock achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Award XP
        if (achievement.xpReward > 0) {
          await prisma.moody.update({
            where: { userId },
            data: { xp: { increment: achievement.xpReward } },
          });
        }

        // Unlock cosmetic reward if any
        if (achievement.cosmeticReward) {
          const currentMoody = await prisma.moody.findUnique({ where: { userId } });
          if (currentMoody && !currentMoody.unlockedCosmetics.includes(achievement.cosmeticReward)) {
            await prisma.moody.update({
              where: { userId },
              data: {
                unlockedCosmetics: {
                  push: achievement.cosmeticReward,
                },
              },
            });
          }
        }

        newlyUnlocked.push({
          code: achievement.code,
          name: achievement.name,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
        });
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get unlocked achievement codes for a user
   */
  async getUnlockedAchievementCodes(userId: string): Promise<string[]> {
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    return unlocked.map((u) => u.achievement.code);
  }
}

export const achievementService = new AchievementService();
