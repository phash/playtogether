/**
 * Moody Avatar System - Typen und Definitionen
 *
 * Moody ist das zentrale Kommunikationsmittel der Plattform.
 * Spieler können ausschließlich über ihren Moody-Avatar kommunizieren.
 */

// ============================================
// MOODY ZUSTÄNDE (Moods)
// ============================================

/**
 * Die 7 Grundstimmungen von negativ bis positiv
 */
export type MoodLevel =
  | 'furious'    // Wütend/Sauer
  | 'sad'        // Traurig
  | 'worried'    // Besorgt/Nervös
  | 'neutral'    // Neutral/Normal
  | 'pleased'    // Zufrieden
  | 'happy'      // Fröhlich
  | 'ecstatic';  // Überglücklich/Begeistert

/**
 * Mood-Definition mit visuellen Eigenschaften
 */
export interface MoodDefinition {
  level: MoodLevel;
  name: string;
  emoji: string;
  color: string;
  bgGradient: [string, string];
  animation?: 'bounce' | 'shake' | 'pulse' | 'wiggle' | 'spin';
}

/**
 * Alle verfügbaren Moods
 */
export const MOODS: Record<MoodLevel, MoodDefinition> = {
  furious: {
    level: 'furious',
    name: 'Wütend',
    emoji: '😤',
    color: '#DC2626',
    bgGradient: ['#FEE2E2', '#FECACA'],
    animation: 'shake',
  },
  sad: {
    level: 'sad',
    name: 'Traurig',
    emoji: '😢',
    color: '#3B82F6',
    bgGradient: ['#DBEAFE', '#BFDBFE'],
  },
  worried: {
    level: 'worried',
    name: 'Besorgt',
    emoji: '😟',
    color: '#F59E0B',
    bgGradient: ['#FEF3C7', '#FDE68A'],
    animation: 'wiggle',
  },
  neutral: {
    level: 'neutral',
    name: 'Neutral',
    emoji: '😐',
    color: '#6B7280',
    bgGradient: ['#F3F4F6', '#E5E7EB'],
  },
  pleased: {
    level: 'pleased',
    name: 'Zufrieden',
    emoji: '🙂',
    color: '#10B981',
    bgGradient: ['#D1FAE5', '#A7F3D0'],
  },
  happy: {
    level: 'happy',
    name: 'Fröhlich',
    emoji: '😄',
    color: '#F59E0B',
    bgGradient: ['#FEF9C3', '#FDE047'],
    animation: 'bounce',
  },
  ecstatic: {
    level: 'ecstatic',
    name: 'Begeistert',
    emoji: '🤩',
    color: '#EC4899',
    bgGradient: ['#FCE7F3', '#FBCFE8'],
    animation: 'spin',
  },
};

/**
 * Mood-Level Array für Slider-Navigation
 */
export const MOOD_LEVELS: MoodLevel[] = [
  'furious',
  'sad',
  'worried',
  'neutral',
  'pleased',
  'happy',
  'ecstatic',
];

// ============================================
// REACTIONS
// ============================================

/**
 * Reaction-Typen - schnelle einmalige Ausdrücke
 */
export type ReactionType =
  | 'celebrate'  // 🎉 Feiern
  | 'love'       // ❤️ Herz
  | 'laugh'      // 😂 Lachen
  | 'wow'        // 😮 Staunen
  | 'think'      // 🤔 Nachdenken
  | 'clap'       // 👏 Applaus
  | 'fire'       // 🔥 Feuer/Hot
  | 'cry';       // 😭 Weinen

export interface ReactionDefinition {
  type: ReactionType;
  emoji: string;
  name: string;
  sound?: string;
}

export const REACTIONS: Record<ReactionType, ReactionDefinition> = {
  celebrate: { type: 'celebrate', emoji: '🎉', name: 'Feiern' },
  love: { type: 'love', emoji: '❤️', name: 'Liebe' },
  laugh: { type: 'laugh', emoji: '😂', name: 'Lachen' },
  wow: { type: 'wow', emoji: '😮', name: 'Wow' },
  think: { type: 'think', emoji: '🤔', name: 'Hmm' },
  clap: { type: 'clap', emoji: '👏', name: 'Applaus' },
  fire: { type: 'fire', emoji: '🔥', name: 'Fire' },
  cry: { type: 'cry', emoji: '😭', name: 'Weinen' },
};

export const REACTION_TYPES: ReactionType[] = Object.keys(REACTIONS) as ReactionType[];

// ============================================
// COSMETICS (Skins, Items, Accessoires)
// ============================================

/**
 * Kategorien von Cosmetics
 */
export type CosmeticCategory =
  | 'background'   // Hintergrund des Avatars
  | 'border'       // Rahmen
  | 'accessory'    // Accessoire (Hut, Brille, etc.)
  | 'effect'       // Partikel-Effekte
  | 'trail';       // Bewegungs-Trail bei Reactions

/**
 * Seltenheit von Items
 */
export type CosmeticRarity =
  | 'common'     // Häufig (grau)
  | 'uncommon'   // Ungewöhnlich (grün)
  | 'rare'       // Selten (blau)
  | 'epic'       // Episch (lila)
  | 'legendary'; // Legendär (gold)

export const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

/**
 * Ein Cosmetic-Item
 */
export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  preview: string;           // Emoji oder URL
  unlockCondition: UnlockCondition;
  css?: CosmeticCSS;         // CSS-Eigenschaften für das Styling
}

/**
 * CSS-Eigenschaften für Cosmetics
 */
export interface CosmeticCSS {
  background?: string;
  border?: string;
  boxShadow?: string;
  filter?: string;
  transform?: string;
  animation?: string;
}

/**
 * Bedingung zum Freischalten
 */
export type UnlockCondition =
  | { type: 'default' }                          // Von Anfang an verfügbar
  | { type: 'games_played'; count: number }      // X Spiele gespielt
  | { type: 'games_won'; count: number }         // X Spiele gewonnen
  | { type: 'reactions_sent'; count: number }    // X Reactions gesendet
  | { type: 'reactions_received'; count: number } // X Reactions erhalten
  | { type: 'streak'; days: number }             // X Tage in Folge gespielt
  | { type: 'achievement'; achievementId: string }// Bestimmtes Achievement
  | { type: 'level'; level: number }             // Level erreicht
  | { type: 'special'; code: string };           // Spezialcode/Event

// ============================================
// SPIELER MOODY STATE
// ============================================

/**
 * Der aktuelle Moody-Zustand eines Spielers
 */
export interface MoodyState {
  mood: MoodLevel;
  lastMoodChange: number;           // Timestamp
  equippedCosmetics: EquippedCosmetics;
  reactionCooldown: number;         // Timestamp wann nächste Reaction möglich
}

/**
 * Ausgerüstete Cosmetics
 */
export interface EquippedCosmetics {
  background?: string;  // Item ID
  border?: string;
  accessory?: string;
  effect?: string;
  trail?: string;
}

/**
 * Spieler-Profil mit Moody-Daten
 */
export interface MoodyProfile {
  userId: string;
  unlockedCosmetics: string[];     // Array von Item IDs
  stats: MoodyStats;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

/**
 * Statistiken für Unlock-Bedingungen
 */
export interface MoodyStats {
  gamesPlayed: number;
  gamesWon: number;
  reactionsSent: number;
  reactionsReceived: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedAt: number;
  achievements: string[];
}

// ============================================
// REACTION EVENT
// ============================================

/**
 * Eine gesendete Reaction
 */
export interface MoodyReaction {
  id: string;
  fromPlayerId: string;
  toPlayerId?: string;     // Optional: gerichtet an jemanden
  type: ReactionType;
  timestamp: number;
}

// ============================================
// MOODY KONFIGURATION
// ============================================

export const MOODY_CONFIG = {
  /** Cooldown zwischen Reactions in Millisekunden */
  reactionCooldownMs: 3000,

  /** Maximale Reactions pro Minute */
  maxReactionsPerMinute: 10,

  /** Dauer der Reaction-Animation in ms */
  reactionAnimationDurationMs: 2000,

  /** XP pro gesendeter Reaction */
  xpPerReactionSent: 1,

  /** XP pro erhaltener Reaction */
  xpPerReactionReceived: 2,

  /** XP pro gespieltem Spiel */
  xpPerGamePlayed: 10,

  /** XP pro gewonnenem Spiel */
  xpPerGameWon: 25,

  /** XP für Level-Berechnung: XP = baseXp * (level ^ exponent) */
  levelXpBase: 100,
  levelXpExponent: 1.5,
};

/**
 * Berechnet benötigtes XP für ein Level
 */
export function getXpForLevel(level: number): number {
  return Math.floor(MOODY_CONFIG.levelXpBase * Math.pow(level, MOODY_CONFIG.levelXpExponent));
}

/**
 * Berechnet Level aus XP
 */
export function getLevelFromXp(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let totalXpNeeded = 0;

  while (true) {
    const xpForThisLevel = getXpForLevel(level);
    if (totalXpNeeded + xpForThisLevel > xp) {
      return {
        level,
        currentXp: xp - totalXpNeeded,
        nextLevelXp: xpForThisLevel,
      };
    }
    totalXpNeeded += xpForThisLevel;
    level++;
  }
}
