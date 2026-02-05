/**
 * Monthly Leaderboard Routes
 */

import { Router, type Router as RouterType } from 'express';
import { monthlyScoreService } from '../services/MonthlyScoreService.js';
import { requireAuth } from '../middleware/auth.js';

const router: RouterType = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/monthly/leaderboard
 * Get monthly leaderboard for the user's group
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const leaderboard = await monthlyScoreService.getMonthlyLeaderboard(
      req.userId!,
      limit
    );

    res.json({
      month: monthlyScoreService.getCurrentMonth(),
      leaderboard,
    });
  } catch (error) {
    console.error('Get monthly leaderboard error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rangliste' });
  }
});

/**
 * GET /api/monthly/stats
 * Get user's monthly stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await monthlyScoreService.getUserMonthlyStats(req.userId!);
    res.json(stats);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

/**
 * GET /api/monthly/crown
 * Get current crown holder
 */
router.get('/crown', async (req, res) => {
  try {
    const crownHolder = await monthlyScoreService.getCurrentCrownHolder();
    const userHasCrown = crownHolder?.userId === req.userId;

    res.json({
      crownHolder,
      userHasCrown,
    });
  } catch (error) {
    console.error('Get crown holder error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * POST /api/monthly/process-reset (Admin only - for testing/manual trigger)
 * Process monthly reset
 */
router.post('/process-reset', async (req, res) => {
  try {
    // In production, this should be protected by admin auth
    const result = await monthlyScoreService.processMonthlyReset();
    res.json(result);
  } catch (error) {
    console.error('Process monthly reset error:', error);
    res.status(500).json({ error: 'Fehler beim Verarbeiten' });
  }
});

export default router;
