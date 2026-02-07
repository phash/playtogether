/**
 * Moody Service - Handles Moody avatar persistence
 */

import { prisma } from '../db/prisma.js';
import type { Moody, UserStats } from '@prisma/client';
import type { MoodLevel, EquippedCosmetics } from '@playtogether/shared';
import { getLevelFromXp, MOODY_CONFIG, COSMETICS, canUnlockCosmetic } from '@playtogether/shared';
import { achievementService } from './AchievementService.js';

export class MoodyService {
  /**
   * Get user's Moody data
   */
  async getMoody(userId: string): Promise<Moody | null> {
    return prisma.moody.findUnique({
      where: { userId },
    });
  }

  /**
   * Update user's current mood
   */
  async updateMood(userId: string, mood: MoodLevel): Promise<Moody> {
    // Also increment mood change stat
    await prisma.userStats.update({
      where: { userId },
      data: { moodChanges: { increment: 1 } },
    });

    return prisma.moody.update({
      where: { userId },
      data: { currentMood: mood },
    });
  }

  /**
   * Update equipped cosmetics
   */
  async updateEquippedCosmetics(
    userId: string,
    cosmetics: Partial<EquippedCosmetics>
  ): Promise<Moody> {
    const moody = await this.getMoody(userId);
    if (!moody) {
      throw new Error('Moody not found');
    }

    // Verify all cosmetics are unlocked
    for (const [key, cosmeticId] of Object.entries(cosmetics)) {
      if (cosmeticId && !moody.unlockedCosmetics.includes(cosmeticId)) {
        throw new Error(`Cosmetic ${cosmeticId} not unlocked`);
      }
    }

    return prisma.moody.update({
      where: { userId },
      data: {
        equippedBackground: cosmetics.background ?? undefined,
        equippedBorder: cosmetics.border ?? undefined,
        equippedAccessory: cosmetics.accessory ?? undefined,
        equippedEffect: cosmetics.effect ?? undefined,
        equippedTrail: cosmetics.trail ?? undefined,
      },
    });
  }

  /**
   * Add XP and check for level up
   */
  async addXp(userId: string, amount: number): Promise<{ moody: Moody; leveledUp: boolean; newUnlocks: string[] }> {
    const moody = await this.getMoody(userId);
    if (!moody) {
      throw new Error('Moody not found');
    }

    const oldLevel = getLevelFromXp(moody.xp).level;
    const newXp = moody.xp + amount;
    const { level: newLevel } = getLevelFromXp(newXp);

    const leveledUp = newLevel > oldLevel;

    // Check for new cosmetic unlocks
    const newUnlocks = await this.checkAndUnlockCosmetics(userId, newXp);

    const updatedMoody = await prisma.moody.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });

    return { moody: updatedMoody, leveledUp, newUnlocks };
  }

  /**
   * Check and unlock cosmetics based on current stats
   */
  async checkAndUnlockCosmetics(userId: string, xp?: number): Promise<string[]> {
    const [moody, stats] = await Promise.all([
      this.getMoody(userId),
      prisma.userStats.findUnique({ where: { userId } }),
    ]);

    if (!moody || !stats) return [];

    const currentXp = xp ?? moody.xp;
    const { level } = getLevelFromXp(currentXp);

    const newUnlocks: string[] = [];

    for (const item of COSMETICS) {
      // Skip if already unlocked
      if (moody.unlockedCosmetics.includes(item.id)) continue;

      const unlockedAchievements = await achievementService.getUnlockedAchievementCodes(userId);
      const canUnlock = canUnlockCosmetic(item, {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        reactionsSent: stats.reactionsSent,
        reactionsReceived: stats.reactionsReceived,
        currentStreak: moody.currentStreak,
        level,
        achievements: unlockedAchievements,
      });

      if (canUnlock) {
        newUnlocks.push(item.id);
      }
    }

    // Update unlocked cosmetics
    if (newUnlocks.length > 0) {
      await prisma.moody.update({
        where: { userId },
        data: {
          unlockedCosmetics: {
            push: newUnlocks,
          },
        },
      });
    }

    return newUnlocks;
  }

  /**
   * Unlock a specific cosmetic for a user
   */
  async unlockCosmetic(userId: string, cosmeticId: string): Promise<boolean> {
    const moody = await this.getMoody(userId);
    if (!moody) return false;

    // Already unlocked
    if (moody.unlockedCosmetics.includes(cosmeticId)) return true;

    await prisma.moody.update({
      where: { userId },
      data: {
        unlockedCosmetics: {
          push: cosmeticId,
        },
      },
    });

    return true;
  }

  /**
   * Record a sent reaction
   */
  async recordReactionSent(userId: string): Promise<void> {
    await Promise.all([
      prisma.userStats.update({
        where: { userId },
        data: { reactionsSent: { increment: 1 } },
      }),
      this.addXp(userId, MOODY_CONFIG.xpPerReactionSent),
    ]);
  }

  /**
   * Record a received reaction
   */
  async recordReactionReceived(userId: string): Promise<void> {
    await Promise.all([
      prisma.userStats.update({
        where: { userId },
        data: { reactionsReceived: { increment: 1 } },
      }),
      this.addXp(userId, MOODY_CONFIG.xpPerReactionReceived),
    ]);
  }

  /**
   * Update daily streak
   */
  async updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const moody = await this.getMoody(userId);
    if (!moody) {
      throw new Error('Moody not found');
    }

    const now = new Date();
    const lastPlayed = moody.lastPlayedAt;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let newStreak = moody.currentStreak;

    if (!lastPlayed) {
      // First time playing
      newStreak = 1;
    } else {
      const timeSinceLastPlay = now.getTime() - lastPlayed.getTime();

      if (timeSinceLastPlay < oneDayMs * 2) {
        // Within 2 days
        if (timeSinceLastPlay >= oneDayMs) {
          // New day - increment streak
          newStreak = moody.currentStreak + 1;
        }
        // Same day - keep current streak
      } else {
        // More than 2 days - reset streak
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(moody.longestStreak, newStreak);

    await prisma.moody.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPlayedAt: now,
      },
    });

    // Check for streak-based unlocks
    await this.checkAndUnlockCosmetics(userId);

    return { currentStreak: newStreak, longestStreak: newLongestStreak };
  }

  /**
   * Get full Moody state for client
   */
  async getMoodyState(userId: string): Promise<{
    mood: MoodLevel;
    level: number;
    xp: number;
    xpToNextLevel: number;
    equippedCosmetics: EquippedCosmetics;
    unlockedCosmetics: string[];
    currentStreak: number;
    longestStreak: number;
  } | null> {
    const moody = await this.getMoody(userId);
    if (!moody) return null;

    const { level, currentXp, nextLevelXp } = getLevelFromXp(moody.xp);

    return {
      mood: moody.currentMood as MoodLevel,
      level,
      xp: currentXp,
      xpToNextLevel: nextLevelXp,
      equippedCosmetics: {
        background: moody.equippedBackground || undefined,
        border: moody.equippedBorder || undefined,
        accessory: moody.equippedAccessory || undefined,
        effect: moody.equippedEffect || undefined,
        trail: moody.equippedTrail || undefined,
      },
      unlockedCosmetics: moody.unlockedCosmetics,
      currentStreak: moody.currentStreak,
      longestStreak: moody.longestStreak,
    };
  }
}

export const moodyService = new MoodyService();
