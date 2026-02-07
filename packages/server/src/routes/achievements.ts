/**
 * Achievement Routes - API for achievements
 */

import { Router, type Router as RouterType } from 'express';
import { achievementService } from '../services/AchievementService.js';
import { requireAuth } from '../middleware/auth.js';

const router: RouterType = Router();

/**
 * GET /api/achievements
 * Get all achievements with unlock status
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const achievements = await achievementService.getAchievements(req.userId!);
    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * POST /api/achievements/check
 * Check and unlock new achievements
 */
router.post('/check', requireAuth, async (req, res) => {
  try {
    const newlyUnlocked = await achievementService.checkAchievements(req.userId!);
    res.json({ newlyUnlocked });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen' });
  }
});

export default router;
