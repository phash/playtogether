/**
 * Moody Store - Verwaltet Avatar-Zustände, Cosmetics und Reactions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MoodLevel,
  ReactionType,
  EquippedCosmetics,
  MoodyStats,
  MoodyReaction,
} from '@playtogether/shared';
import {
  MOODY_CONFIG,
  getLevelFromXp,
  COSMETICS,
  canUnlockCosmetic,
} from '@playtogether/shared';
import { useGameStore } from './gameStore';

interface MoodyStore {
  // Aktueller Mood
  mood: MoodLevel;
  setMood: (mood: MoodLevel) => void;

  // Cosmetics
  equippedCosmetics: EquippedCosmetics;
  unlockedCosmetics: string[];
  equipCosmetic: (category: keyof EquippedCosmetics, itemId: string | undefined) => void;
  checkAndUnlockCosmetics: () => string[]; // Gibt neu freigeschaltete IDs zurück

  // Reactions
  reactionCooldownUntil: number;
  canSendReaction: () => boolean;
  sendReaction: (type: ReactionType, toPlayerId?: string) => void;

  // Eingehende Reactions von anderen Spielern
  incomingReactions: MoodyReaction[];
  addIncomingReaction: (reaction: MoodyReaction) => void;
  clearOldReactions: () => void;

  // Stats & Level
  stats: MoodyStats;
  xp: number;
  getLevel: () => { level: number; currentXp: number; nextLevelXp: number };
  addXp: (amount: number) => void;
  incrementStat: (stat: keyof Pick<MoodyStats, 'gamesPlayed' | 'gamesWon' | 'reactionsSent' | 'reactionsReceived'>) => void;
  updateStreak: () => void;

  // Andere Spieler Moods (für Anzeige)
  playerMoods: Record<string, { mood: MoodLevel; cosmetics: EquippedCosmetics }>;
  setPlayerMood: (playerId: string, mood: MoodLevel, cosmetics: EquippedCosmetics) => void;
  removePlayerMood: (playerId: string) => void;
}

// Standard-Ausrüstung
const DEFAULT_EQUIPPED: EquippedCosmetics = {
  background: 'bg_default',
  border: 'border_default',
  accessory: 'acc_none',
  effect: 'effect_none',
  trail: 'trail_none',
};

// Standard-Stats
const DEFAULT_STATS: MoodyStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  reactionsSent: 0,
  reactionsReceived: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedAt: 0,
  achievements: [],
};

export const useMoodyStore = create<MoodyStore>()(
  persist(
    (set, get) => ({
      // Initial State
      mood: 'neutral',
      equippedCosmetics: DEFAULT_EQUIPPED,
      unlockedCosmetics: ['bg_default', 'border_default', 'acc_none', 'effect_none', 'trail_none'],
      reactionCooldownUntil: 0,
      incomingReactions: [],
      stats: DEFAULT_STATS,
      xp: 0,
      playerMoods: {},

      // Mood ändern
      setMood: (mood) => {
        set({ mood });

        // Mood an Server senden
        const socket = useGameStore.getState().socket;
        const playerId = useGameStore.getState().playerId;
        if (socket && playerId) {
          socket.emit('message', {
            type: 'moody_update',
            payload: {
              mood,
              cosmetics: get().equippedCosmetics,
            },
          });
        }
      },

      // Cosmetic ausrüsten
      equipCosmetic: (category, itemId) => {
        const { unlockedCosmetics, equippedCosmetics } = get();

        // Prüfen ob freigeschaltet oder undefined (zum Entfernen)
        if (itemId && !unlockedCosmetics.includes(itemId)) {
          console.warn(`Cosmetic ${itemId} nicht freigeschaltet`);
          return;
        }

        set({
          equippedCosmetics: {
            ...equippedCosmetics,
            [category]: itemId,
          },
        });

        // An Server senden
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('message', {
            type: 'moody_update',
            payload: {
              mood: get().mood,
              cosmetics: {
                ...equippedCosmetics,
                [category]: itemId,
              },
            },
          });
        }
      },

      // Cosmetics prüfen und freischalten
      checkAndUnlockCosmetics: () => {
        const { stats, xp, unlockedCosmetics } = get();
        const { level } = getLevelFromXp(xp);
        const newlyUnlocked: string[] = [];

        for (const item of COSMETICS) {
          if (unlockedCosmetics.includes(item.id)) continue;

          const canUnlock = canUnlockCosmetic(item, {
            ...stats,
            level,
          });

          if (canUnlock) {
            newlyUnlocked.push(item.id);
          }
        }

        if (newlyUnlocked.length > 0) {
          set({
            unlockedCosmetics: [...unlockedCosmetics, ...newlyUnlocked],
          });
        }

        return newlyUnlocked;
      },

      // Reaction senden möglich?
      canSendReaction: () => {
        return Date.now() >= get().reactionCooldownUntil;
      },

      // Reaction senden
      sendReaction: (type, toPlayerId) => {
        if (!get().canSendReaction()) {
          console.warn('Reaction noch im Cooldown');
          return;
        }

        const socket = useGameStore.getState().socket;
        const playerId = useGameStore.getState().playerId;

        if (!socket || !playerId) return;

        // Cooldown setzen
        set({
          reactionCooldownUntil: Date.now() + MOODY_CONFIG.reactionCooldownMs,
        });

        // Stat erhöhen
        get().incrementStat('reactionsSent');

        // XP hinzufügen
        get().addXp(MOODY_CONFIG.xpPerReactionSent);

        // An Server senden
        socket.emit('message', {
          type: 'moody_reaction',
          payload: {
            reactionType: type,
            toPlayerId,
          },
        });
      },

      // Eingehende Reaction hinzufügen
      addIncomingReaction: (reaction) => {
        set((state) => ({
          incomingReactions: [...state.incomingReactions, reaction],
        }));

        // Stat erhöhen
        get().incrementStat('reactionsReceived');

        // XP hinzufügen
        get().addXp(MOODY_CONFIG.xpPerReactionReceived);

        // Nach Animation-Dauer entfernen
        setTimeout(() => {
          set((state) => ({
            incomingReactions: state.incomingReactions.filter(
              (r) => r.id !== reaction.id
            ),
          }));
        }, MOODY_CONFIG.reactionAnimationDurationMs);
      },

      // Alte Reactions aufräumen
      clearOldReactions: () => {
        const cutoff = Date.now() - MOODY_CONFIG.reactionAnimationDurationMs;
        set((state) => ({
          incomingReactions: state.incomingReactions.filter(
            (r) => r.timestamp > cutoff
          ),
        }));
      },

      // Level berechnen
      getLevel: () => {
        return getLevelFromXp(get().xp);
      },

      // XP hinzufügen
      addXp: (amount) => {
        const oldLevel = getLevelFromXp(get().xp).level;
        const newXp = get().xp + amount;
        const newLevel = getLevelFromXp(newXp).level;

        set({ xp: newXp });

        // Level Up Check
        if (newLevel > oldLevel) {
          console.log(`🎉 Level Up! Jetzt Level ${newLevel}`);
          // Cosmetics prüfen
          get().checkAndUnlockCosmetics();
        }
      },

      // Stat erhöhen
      incrementStat: (stat) => {
        set((state) => ({
          stats: {
            ...state.stats,
            [stat]: state.stats[stat] + 1,
          },
        }));

        // Cosmetics prüfen
        get().checkAndUnlockCosmetics();
      },

      // Streak aktualisieren
      updateStreak: () => {
        const { stats } = get();
        const now = Date.now();
        const lastPlayed = stats.lastPlayedAt;
        const oneDayMs = 24 * 60 * 60 * 1000;

        let newStreak = stats.currentStreak;

        if (lastPlayed === 0) {
          // Erstes Spiel
          newStreak = 1;
        } else if (now - lastPlayed < oneDayMs * 2) {
          // Innerhalb von 2 Tagen gespielt
          if (now - lastPlayed >= oneDayMs) {
            // Neuer Tag
            newStreak = stats.currentStreak + 1;
          }
          // Gleicher Tag - Streak bleibt
        } else {
          // Mehr als 2 Tage vergangen - Streak zurücksetzen
          newStreak = 1;
        }

        set({
          stats: {
            ...stats,
            currentStreak: newStreak,
            longestStreak: Math.max(stats.longestStreak, newStreak),
            lastPlayedAt: now,
          },
        });

        // Cosmetics prüfen
        get().checkAndUnlockCosmetics();
      },

      // Anderer Spieler Mood setzen
      setPlayerMood: (playerId, mood, cosmetics) => {
        set((state) => ({
          playerMoods: {
            ...state.playerMoods,
            [playerId]: { mood, cosmetics },
          },
        }));
      },

      // Spieler Mood entfernen (wenn Spieler geht)
      removePlayerMood: (playerId) => {
        set((state) => {
          const { [playerId]: _, ...rest } = state.playerMoods;
          return { playerMoods: rest };
        });
      },
    }),
    {
      name: 'moody-storage',
      partialize: (state) => ({
        mood: state.mood,
        equippedCosmetics: state.equippedCosmetics,
        unlockedCosmetics: state.unlockedCosmetics,
        stats: state.stats,
        xp: state.xp,
      }),
    }
  )
);
