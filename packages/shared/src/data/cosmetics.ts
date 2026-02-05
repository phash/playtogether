/**
 * Cosmetics Katalog - Alle verfügbaren Items
 */

import type { CosmeticItem } from '../types/moody.js';

export const COSMETICS: CosmeticItem[] = [
  // ============================================
  // BACKGROUNDS - Hintergründe
  // ============================================

  // Common
  {
    id: 'bg_default',
    name: 'Standard',
    category: 'background',
    rarity: 'common',
    preview: '⬜',
    unlockCondition: { type: 'default' },
    css: { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' },
  },
  {
    id: 'bg_sky',
    name: 'Himmelblau',
    category: 'background',
    rarity: 'common',
    preview: '🔵',
    unlockCondition: { type: 'games_played', count: 1 },
    css: { background: 'linear-gradient(135deg, #87CEEB 0%, #4A90D9 100%)' },
  },
  {
    id: 'bg_sunset',
    name: 'Sonnenuntergang',
    category: 'background',
    rarity: 'common',
    preview: '🟠',
    unlockCondition: { type: 'games_played', count: 3 },
    css: { background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)' },
  },
  {
    id: 'bg_forest',
    name: 'Waldgrün',
    category: 'background',
    rarity: 'common',
    preview: '🟢',
    unlockCondition: { type: 'games_played', count: 5 },
    css: { background: 'linear-gradient(135deg, #2D5016 0%, #4A7C23 100%)' },
  },

  // Uncommon
  {
    id: 'bg_galaxy',
    name: 'Galaxie',
    category: 'background',
    rarity: 'uncommon',
    preview: '🌌',
    unlockCondition: { type: 'games_played', count: 10 },
    css: { background: 'linear-gradient(135deg, #1a1a2e 0%, #4a148c 50%, #1a1a2e 100%)' },
  },
  {
    id: 'bg_ocean',
    name: 'Ozean',
    category: 'background',
    rarity: 'uncommon',
    preview: '🌊',
    unlockCondition: { type: 'games_played', count: 15 },
    css: { background: 'linear-gradient(135deg, #006994 0%, #40E0D0 100%)' },
  },
  {
    id: 'bg_candy',
    name: 'Zuckerwatte',
    category: 'background',
    rarity: 'uncommon',
    preview: '🍭',
    unlockCondition: { type: 'reactions_sent', count: 20 },
    css: { background: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 50%, #87CEEB 100%)' },
  },

  // Rare
  {
    id: 'bg_rainbow',
    name: 'Regenbogen',
    category: 'background',
    rarity: 'rare',
    preview: '🌈',
    unlockCondition: { type: 'games_won', count: 10 },
    css: {
      background: 'linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8F00FF)',
      animation: 'rainbow-shift 3s linear infinite',
    },
  },
  {
    id: 'bg_neon',
    name: 'Neon City',
    category: 'background',
    rarity: 'rare',
    preview: '🏙️',
    unlockCondition: { type: 'streak', days: 7 },
    css: {
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a0a2e 100%)',
      boxShadow: 'inset 0 0 20px #ff00ff, inset 0 0 40px #00ffff',
    },
  },

  // Epic
  {
    id: 'bg_aurora',
    name: 'Nordlicht',
    category: 'background',
    rarity: 'epic',
    preview: '✨',
    unlockCondition: { type: 'games_won', count: 25 },
    css: {
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      animation: 'aurora 5s ease-in-out infinite',
    },
  },
  {
    id: 'bg_fire',
    name: 'Inferno',
    category: 'background',
    rarity: 'epic',
    preview: '🔥',
    unlockCondition: { type: 'streak', days: 14 },
    css: {
      background: 'linear-gradient(135deg, #1a0000 0%, #4a0000 50%, #ff4500 100%)',
      animation: 'fire-flicker 0.5s ease-in-out infinite',
    },
  },

  // Legendary
  {
    id: 'bg_holographic',
    name: 'Holographisch',
    category: 'background',
    rarity: 'legendary',
    preview: '💎',
    unlockCondition: { type: 'level', level: 25 },
    css: {
      background: 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #ff0080)',
      animation: 'holographic 3s linear infinite',
      filter: 'brightness(1.2)',
    },
  },

  // ============================================
  // BORDERS - Rahmen
  // ============================================

  {
    id: 'border_default',
    name: 'Standard',
    category: 'border',
    rarity: 'common',
    preview: '⭕',
    unlockCondition: { type: 'default' },
    css: { border: '3px solid #6366f1' },
  },
  {
    id: 'border_gold',
    name: 'Gold',
    category: 'border',
    rarity: 'uncommon',
    preview: '🥇',
    unlockCondition: { type: 'games_won', count: 5 },
    css: { border: '3px solid #FFD700', boxShadow: '0 0 10px #FFD70066' },
  },
  {
    id: 'border_rainbow',
    name: 'Regenbogen',
    category: 'border',
    rarity: 'rare',
    preview: '🌈',
    unlockCondition: { type: 'reactions_sent', count: 50 },
    css: {
      border: '3px solid transparent',
      background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff) border-box',
    },
  },
  {
    id: 'border_glow',
    name: 'Neon Glow',
    category: 'border',
    rarity: 'epic',
    preview: '💫',
    unlockCondition: { type: 'games_played', count: 50 },
    css: {
      border: '3px solid #00ffff',
      boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
      animation: 'glow-pulse 2s ease-in-out infinite',
    },
  },
  {
    id: 'border_legendary',
    name: 'Legendär',
    category: 'border',
    rarity: 'legendary',
    preview: '👑',
    unlockCondition: { type: 'level', level: 30 },
    css: {
      border: '4px solid #FFD700',
      boxShadow: '0 0 15px #FFD700, inset 0 0 15px #FFD70033',
      animation: 'legendary-shimmer 2s linear infinite',
    },
  },

  // ============================================
  // ACCESSORIES - Accessoires
  // ============================================

  {
    id: 'acc_none',
    name: 'Keins',
    category: 'accessory',
    rarity: 'common',
    preview: '➖',
    unlockCondition: { type: 'default' },
  },
  {
    id: 'acc_party_hat',
    name: 'Partyhut',
    category: 'accessory',
    rarity: 'common',
    preview: '🎉',
    unlockCondition: { type: 'games_played', count: 1 },
  },
  {
    id: 'acc_sunglasses',
    name: 'Sonnenbrille',
    category: 'accessory',
    rarity: 'common',
    preview: '😎',
    unlockCondition: { type: 'games_won', count: 1 },
  },
  {
    id: 'acc_crown',
    name: 'Krone',
    category: 'accessory',
    rarity: 'uncommon',
    preview: '👑',
    unlockCondition: { type: 'games_won', count: 10 },
  },
  {
    id: 'acc_halo',
    name: 'Heiligenschein',
    category: 'accessory',
    rarity: 'rare',
    preview: '😇',
    unlockCondition: { type: 'reactions_received', count: 100 },
  },
  {
    id: 'acc_devil_horns',
    name: 'Teufelshörner',
    category: 'accessory',
    rarity: 'rare',
    preview: '😈',
    unlockCondition: { type: 'reactions_sent', count: 100 },
  },
  {
    id: 'acc_wizard_hat',
    name: 'Zauberhut',
    category: 'accessory',
    rarity: 'epic',
    preview: '🧙',
    unlockCondition: { type: 'level', level: 20 },
  },
  {
    id: 'acc_astronaut',
    name: 'Astronautenhelm',
    category: 'accessory',
    rarity: 'legendary',
    preview: '👨‍🚀',
    unlockCondition: { type: 'games_played', count: 100 },
  },
  {
    id: 'acc_monthly_crown',
    name: 'Monatskrone',
    category: 'accessory',
    rarity: 'legendary',
    preview: '👑',
    unlockCondition: { type: 'special', code: 'monthly_winner' },
    css: {
      filter: 'drop-shadow(0 0 8px gold) drop-shadow(0 0 12px #FFD700)',
      animation: 'crown-glow 2s ease-in-out infinite',
    },
  },

  // ============================================
  // EFFECTS - Partikel-Effekte
  // ============================================

  {
    id: 'effect_none',
    name: 'Keiner',
    category: 'effect',
    rarity: 'common',
    preview: '➖',
    unlockCondition: { type: 'default' },
  },
  {
    id: 'effect_sparkle',
    name: 'Funken',
    category: 'effect',
    rarity: 'uncommon',
    preview: '✨',
    unlockCondition: { type: 'games_played', count: 20 },
  },
  {
    id: 'effect_hearts',
    name: 'Herzen',
    category: 'effect',
    rarity: 'uncommon',
    preview: '💕',
    unlockCondition: { type: 'reactions_received', count: 50 },
  },
  {
    id: 'effect_stars',
    name: 'Sterne',
    category: 'effect',
    rarity: 'rare',
    preview: '⭐',
    unlockCondition: { type: 'games_won', count: 20 },
  },
  {
    id: 'effect_confetti',
    name: 'Konfetti',
    category: 'effect',
    rarity: 'rare',
    preview: '🎊',
    unlockCondition: { type: 'streak', days: 10 },
  },
  {
    id: 'effect_flames',
    name: 'Flammen',
    category: 'effect',
    rarity: 'epic',
    preview: '🔥',
    unlockCondition: { type: 'games_won', count: 50 },
  },
  {
    id: 'effect_lightning',
    name: 'Blitze',
    category: 'effect',
    rarity: 'legendary',
    preview: '⚡',
    unlockCondition: { type: 'level', level: 40 },
  },

  // ============================================
  // TRAILS - Bewegungs-Trails
  // ============================================

  {
    id: 'trail_none',
    name: 'Keiner',
    category: 'trail',
    rarity: 'common',
    preview: '➖',
    unlockCondition: { type: 'default' },
  },
  {
    id: 'trail_sparkle',
    name: 'Glitzer',
    category: 'trail',
    rarity: 'uncommon',
    preview: '✨',
    unlockCondition: { type: 'reactions_sent', count: 30 },
  },
  {
    id: 'trail_rainbow',
    name: 'Regenbogen',
    category: 'trail',
    rarity: 'rare',
    preview: '🌈',
    unlockCondition: { type: 'streak', days: 5 },
  },
  {
    id: 'trail_fire',
    name: 'Feuer',
    category: 'trail',
    rarity: 'epic',
    preview: '🔥',
    unlockCondition: { type: 'level', level: 15 },
  },
  {
    id: 'trail_galaxy',
    name: 'Galaxie',
    category: 'trail',
    rarity: 'legendary',
    preview: '🌌',
    unlockCondition: { type: 'level', level: 50 },
  },
];

/**
 * Cosmetics nach Kategorie gruppiert
 */
export const COSMETICS_BY_CATEGORY = COSMETICS.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, CosmeticItem[]>);

/**
 * Cosmetic nach ID finden
 */
export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETICS.find((item) => item.id === id);
}

/**
 * Prüft ob ein Item freigeschaltet werden kann
 */
export function canUnlockCosmetic(
  item: CosmeticItem,
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    reactionsSent: number;
    reactionsReceived: number;
    currentStreak: number;
    level: number;
    achievements: string[];
  }
): boolean {
  const condition = item.unlockCondition;

  switch (condition.type) {
    case 'default':
      return true;
    case 'games_played':
      return stats.gamesPlayed >= condition.count;
    case 'games_won':
      return stats.gamesWon >= condition.count;
    case 'reactions_sent':
      return stats.reactionsSent >= condition.count;
    case 'reactions_received':
      return stats.reactionsReceived >= condition.count;
    case 'streak':
      return stats.currentStreak >= condition.days;
    case 'level':
      return stats.level >= condition.level;
    case 'achievement':
      return stats.achievements.includes(condition.achievementId);
    case 'special':
      return false; // Special codes müssen separat geprüft werden
    default:
      return false;
  }
}

/**
 * Berechnet Fortschritt zum Freischalten (0-100)
 */
export function getUnlockProgress(
  item: CosmeticItem,
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    reactionsSent: number;
    reactionsReceived: number;
    currentStreak: number;
    level: number;
  }
): number {
  const condition = item.unlockCondition;

  switch (condition.type) {
    case 'default':
      return 100;
    case 'games_played':
      return Math.min(100, (stats.gamesPlayed / condition.count) * 100);
    case 'games_won':
      return Math.min(100, (stats.gamesWon / condition.count) * 100);
    case 'reactions_sent':
      return Math.min(100, (stats.reactionsSent / condition.count) * 100);
    case 'reactions_received':
      return Math.min(100, (stats.reactionsReceived / condition.count) * 100);
    case 'streak':
      return Math.min(100, (stats.currentStreak / condition.days) * 100);
    case 'level':
      return Math.min(100, (stats.level / condition.level) * 100);
    default:
      return 0;
  }
}
