/**
 * Authentication Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { userService } from '../services/UserService.js';
import { moodyService } from '../services/MoodyService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const guestSchema = z.object({
  username: z.string().min(2).max(20),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(2).max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const convertSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/auth/guest
 * Create a guest account
 */
router.post('/guest', async (req, res) => {
  try {
    const { username } = guestSchema.parse(req.body);
    const result = await userService.createGuestUser(username);

    res.json({
      user: sanitizeUser(result.user),
      token: result.token,
      moody: await moodyService.getMoodyState(result.user.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültige Eingabe', details: error.errors });
      return;
    }
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Accounts' });
  }
});

/**
 * POST /api/auth/register
 * Register a new account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = registerSchema.parse(req.body);
    const result = await userService.registerUser(email, password, username);

    res.json({
      user: sanitizeUser(result.user),
      token: result.token,
      moody: await moodyService.getMoodyState(result.user.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültige Eingabe', details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await userService.loginUser(email, password);

    res.json({
      user: sanitizeUser(result.user),
      token: result.token,
      moody: await moodyService.getMoodyState(result.user.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültige Eingabe' });
      return;
    }
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Fehler beim Login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate session)
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await userService.logout(token);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Fehler beim Logout' });
  }
});

/**
 * POST /api/auth/convert
 * Convert guest account to full account
 */
router.post('/convert', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isGuest) {
      res.status(400).json({ error: 'Account ist bereits ein vollständiger Account' });
      return;
    }

    const { email, password } = convertSchema.parse(req.body);
    const user = await userService.convertGuestToUser(req.userId!, email, password);

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Ungültige Eingabe', details: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Fehler beim Konvertieren' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const moody = await moodyService.getMoodyState(req.userId!);

    res.json({
      user: sanitizeUser(req.user!),
      moody,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Benutzers' });
  }
});

/**
 * Remove sensitive fields from user object
 */
function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
