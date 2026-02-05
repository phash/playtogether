/**
 * Stats Routes - API for game statistics and history
 */

import { Router } from 'express';
import { z } from 'zod';
import { statsService } from '../services/StatsService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/stats
 * Get own statistics
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const stats = await statsService.getUserStats(req.userId!);

    if (!stats) {
      res.status(404).json({ error: 'Statistiken nicht gefunden' });
      return;
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * GET /api/stats/history
 * Get game history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await statsService.getGameHistory(req.userId!, limit, offset);

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * GET /api/stats/leaderboard
 * Get leaderboard
 */
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const type = (req.query.type as string) || 'gamesWon';

    if (!['gamesWon', 'gamesPlayed', 'level'].includes(type)) {
      res.status(400).json({ error: 'Ungültiger Leaderboard-Typ' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const leaderboard = await statsService.getLeaderboard(
      type as 'gamesWon' | 'gamesPlayed' | 'level',
      limit
    );

    // Add own rank if authenticated
    let ownRank: number | null = null;
    if (req.userId && type !== 'level') {
      ownRank = await statsService.getUserRank(
        req.userId,
        type as 'gamesWon' | 'gamesPlayed'
      );
    }

    res.json({
      leaderboard,
      ownRank,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * GET /api/stats/summary
 * Get summary statistics (for profile display)
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const stats = await statsService.getUserStats(req.userId!);

    if (!stats) {
      res.status(404).json({ error: 'Statistiken nicht gefunden' });
      return;
    }

    // Calculate derived stats
    const winRate = stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

    const quizAccuracy = stats.quizTotalAnswers > 0
      ? Math.round((stats.quizCorrectAnswers / stats.quizTotalAnswers) * 100)
      : 0;

    res.json({
      overview: {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        winRate,
        totalPlayTimeMinutes: stats.totalPlayTimeMinutes,
      },
      social: {
        reactionsSent: stats.reactionsSent,
        reactionsReceived: stats.reactionsReceived,
      },
      quiz: {
        correctAnswers: stats.quizCorrectAnswers,
        totalAnswers: stats.quizTotalAnswers,
        accuracy: quizAccuracy,
        fastestAnswerMs: stats.quizFastestAnswerMs,
      },
      reaction: {
        gamesWon: stats.reactionGamesWon,
        bestTimeMs: stats.reactionBestTimeMs,
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

export default router;
