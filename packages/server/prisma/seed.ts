/**
 * Database Seed Script
 * Populates initial data (achievements, etc.)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  // Games
  {
    code: 'first_game',
    name: 'Erster Schritt',
    description: 'Spiele dein erstes Spiel',
    icon: '🎮',
    rarity: 'common',
    condition: { type: 'games_played', count: 1 },
    xpReward: 10,
  },
  {
    code: 'games_10',
    name: 'Anfänger',
    description: 'Spiele 10 Spiele',
    icon: '🎯',
    rarity: 'common',
    condition: { type: 'games_played', count: 10 },
    xpReward: 25,
  },
  {
    code: 'games_50',
    name: 'Erfahrener Spieler',
    description: 'Spiele 50 Spiele',
    icon: '⭐',
    rarity: 'uncommon',
    condition: { type: 'games_played', count: 50 },
    xpReward: 50,
  },
  {
    code: 'games_100',
    name: 'Veteran',
    description: 'Spiele 100 Spiele',
    icon: '🏆',
    rarity: 'rare',
    condition: { type: 'games_played', count: 100 },
    xpReward: 100,
  },

  // Wins
  {
    code: 'first_win',
    name: 'Erster Sieg',
    description: 'Gewinne dein erstes Spiel',
    icon: '🥇',
    rarity: 'common',
    condition: { type: 'games_won', count: 1 },
    xpReward: 15,
  },
  {
    code: 'wins_10',
    name: 'Gewinner',
    description: 'Gewinne 10 Spiele',
    icon: '🏅',
    rarity: 'uncommon',
    condition: { type: 'games_won', count: 10 },
    xpReward: 50,
  },
  {
    code: 'wins_50',
    name: 'Champion',
    description: 'Gewinne 50 Spiele',
    icon: '👑',
    rarity: 'rare',
    condition: { type: 'games_won', count: 50 },
    xpReward: 150,
    cosmeticReward: 'acc_crown',
  },

  // Streaks
  {
    code: 'streak_3',
    name: 'Auf einer Rolle',
    description: '3 Tage in Folge gespielt',
    icon: '🔥',
    rarity: 'common',
    condition: { type: 'streak', days: 3 },
    xpReward: 20,
  },
  {
    code: 'streak_7',
    name: 'Wochenstreak',
    description: '7 Tage in Folge gespielt',
    icon: '📅',
    rarity: 'uncommon',
    condition: { type: 'streak', days: 7 },
    xpReward: 50,
  },
  {
    code: 'streak_30',
    name: 'Monatsstreak',
    description: '30 Tage in Folge gespielt',
    icon: '🌟',
    rarity: 'epic',
    condition: { type: 'streak', days: 30 },
    xpReward: 200,
  },

  // Reactions
  {
    code: 'reactions_10',
    name: 'Kommunikativ',
    description: 'Sende 10 Reactions',
    icon: '👋',
    rarity: 'common',
    condition: { type: 'reactions_sent', count: 10 },
    xpReward: 10,
  },
  {
    code: 'reactions_100',
    name: 'Social Butterfly',
    description: 'Sende 100 Reactions',
    icon: '🦋',
    rarity: 'uncommon',
    condition: { type: 'reactions_sent', count: 100 },
    xpReward: 50,
  },
  {
    code: 'reactions_received_100',
    name: 'Beliebt',
    description: 'Erhalte 100 Reactions',
    icon: '❤️',
    rarity: 'rare',
    condition: { type: 'reactions_received', count: 100 },
    xpReward: 75,
    cosmeticReward: 'acc_halo',
  },

  // Level
  {
    code: 'level_5',
    name: 'Level 5',
    description: 'Erreiche Level 5',
    icon: '5️⃣',
    rarity: 'common',
    condition: { type: 'level', level: 5 },
    xpReward: 25,
  },
  {
    code: 'level_10',
    name: 'Level 10',
    description: 'Erreiche Level 10',
    icon: '🔟',
    rarity: 'uncommon',
    condition: { type: 'level', level: 10 },
    xpReward: 50,
  },
  {
    code: 'level_25',
    name: 'Level 25',
    description: 'Erreiche Level 25',
    icon: '💪',
    rarity: 'rare',
    condition: { type: 'level', level: 25 },
    xpReward: 100,
  },
  {
    code: 'level_50',
    name: 'Level 50',
    description: 'Erreiche Level 50',
    icon: '🚀',
    rarity: 'epic',
    condition: { type: 'level', level: 50 },
    xpReward: 250,
  },
  {
    code: 'level_100',
    name: 'Legende',
    description: 'Erreiche Level 100',
    icon: '🌈',
    rarity: 'legendary',
    condition: { type: 'level', level: 100 },
    xpReward: 500,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert achievements
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ Created/updated ${achievements.length} achievements`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
