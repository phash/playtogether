/**
 * Friend Routes - API for friendship system
 */

import { Router, type Router as RouterType } from 'express';
import { friendshipService } from '../services/FriendshipService.js';
import { requireAuth } from '../middleware/auth.js';

const router: RouterType = Router();

/**
 * GET /api/friends
 * Get friend list
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const friends = await friendshipService.getFriends(req.userId!);
    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * GET /api/friends/requests
 * Get pending incoming friend requests
 */
router.get('/requests', requireAuth, async (req, res) => {
  try {
    const requests = await friendshipService.getPendingRequests(req.userId!);
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

/**
 * POST /api/friends/request
 * Send a friend request
 */
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      res.status(400).json({ error: 'Benutzername fehlt' });
      return;
    }

    await friendshipService.sendRequest(req.userId!, username);
    res.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({ error: message });
  }
});

/**
 * PUT /api/friends/accept/:friendId
 * Accept a friend request
 */
router.put('/accept/:friendId', requireAuth, async (req, res) => {
  try {
    await friendshipService.acceptRequest(req.userId!, req.params.friendId);
    res.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/friends/decline/:friendId
 * Decline a friend request
 */
router.delete('/decline/:friendId', requireAuth, async (req, res) => {
  try {
    await friendshipService.declineRequest(req.userId!, req.params.friendId);
    res.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/friends/:friendId
 * Remove a friend
 */
router.delete('/:friendId', requireAuth, async (req, res) => {
  try {
    await friendshipService.removeFriend(req.userId!, req.params.friendId);
    res.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({ error: message });
  }
});

export default router;
