/**
 * Moody Routes - API for Moody avatar management
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { moodyService } from '../services/MoodyService.js';
import { requireAuth } from '../middleware/auth.js';
import type { MoodLevel, CosmeticCategory } from '@playtogether/shared';
import { MOOD_LEVELS, COSMETICS_BY_CATEGORY } from '@playtogether/shared';

const router: RouterType = Router();

// All routes require authentication
router.use(requireAuth);

// Validation schemas
const updateMoodSchema = z.object({
  mood: z.enum(MOOD_LEVELS as [string, ...string[]]),
});

const updateCosmeticsSchema = z.object({
  background: z.string().optional(),
  border: z.string().optional(),
  accessory: z.string().optional(),
  effect: z.string().optional(),
  trail: z.string().optional(),
});

/**
 * GET /api/moody
 * Get current Moody state
 */
router.get('/', async (req, res) => {
  try {
    const moody = await moodyService.getMoodyState(req.userId!);

    if (!moody) {
      res.status(404).json({ error: 'Moody nicht gefunden' });
      return;
    }

    res.json(moody);
  } catch (error) {
    console.error('Get moody error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * PUT /api/moody/mood
 * Update current mood
 */
router.put('/mood', async (req, res) => {
  try {
    const { mood } = updateMoodSchema.parse(req.body);
    await moodyService.updateMood(req.userId!, mood as MoodLevel);

    res.json({ success: true, mood });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültiger Mood-Wert' });
      return;
    }
    console.error('Update mood error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

/**
 * PUT /api/moody/cosmetics
 * Update equipped cosmetics
 */
router.put('/cosmetics', async (req, res) => {
  try {
    const cosmetics = updateCosmeticsSchema.parse(req.body);
    await moodyService.updateEquippedCosmetics(req.userId!, cosmetics);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültige Cosmetic-Daten' });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Update cosmetics error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

/**
 * GET /api/moody/cosmetics
 * Get all cosmetics with unlock status
 */
router.get('/cosmetics', async (req, res) => {
  try {
    const moody = await moodyService.getMoody(req.userId!);

    if (!moody) {
      res.status(404).json({ error: 'Moody nicht gefunden' });
      return;
    }

    // Return cosmetics grouped by category with unlock status
    const result: Record<string, any[]> = {};

    for (const [category, items] of Object.entries(COSMETICS_BY_CATEGORY)) {
      result[category] = items.map((item) => ({
        ...item,
        unlocked: moody.unlockedCosmetics.includes(item.id),
        equipped: isEquipped(moody, category as CosmeticCategory, item.id),
      }));
    }

    res.json(result);
  } catch (error) {
    console.error('Get cosmetics error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * POST /api/moody/check-unlocks
 * Check for new cosmetic unlocks
 */
router.post('/check-unlocks', async (req, res) => {
  try {
    const newUnlocks = await moodyService.checkAndUnlockCosmetics(req.userId!);

    res.json({
      newUnlocks,
      hasNew: newUnlocks.length > 0,
    });
  } catch (error) {
    console.error('Check unlocks error:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen' });
  }
});

/**
 * Helper: Check if cosmetic is equipped
 */
function isEquipped(moody: any, category: CosmeticCategory, itemId: string): boolean {
  switch (category) {
    case 'background':
      return moody.equippedBackground === itemId;
    case 'border':
      return moody.equippedBorder === itemId;
    case 'accessory':
      return moody.equippedAccessory === itemId;
    case 'effect':
      return moody.equippedEffect === itemId;
    case 'trail':
      return moody.equippedTrail === itemId;
    default:
      return false;
  }
}

export default router;
