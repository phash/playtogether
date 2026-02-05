/**
 * Authentication Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { userService, type UserWithMoody } from '../services/UserService.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserWithMoody;
      userId?: string;
    }
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check for token in cookies
  return req.cookies?.token || null;
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }

  const user = await userService.validateToken(token);

  if (!user) {
    res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    return;
  }

  req.user = user;
  req.userId = user.id;
  next();
}

/**
 * Optional authentication - attaches user if authenticated, continues otherwise
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (token) {
    const user = await userService.validateToken(token);
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  }

  next();
}

/**
 * Socket.io authentication middleware
 */
export async function socketAuth(
  socket: any,
  next: (err?: Error) => void
): Promise<void> {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    // Allow connection without auth (guest mode)
    return next();
  }

  try {
    const user = await userService.validateToken(token);
    if (user) {
      socket.user = user;
      socket.userId = user.id;
    }
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
}
