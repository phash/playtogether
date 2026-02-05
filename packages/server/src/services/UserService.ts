/**
 * User Service - Handles user management and authentication
 */

import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, Moody, UserStats, Session } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
const SESSION_EXPIRY_DAYS = 30;

export interface AuthResult {
  user: UserWithMoody;
  token: string;
}

export type UserWithMoody = User & {
  moody: Moody | null;
  stats: UserStats | null;
};

export class UserService {
  /**
   * Create a guest user (no email/password)
   */
  async createGuestUser(username: string): Promise<AuthResult> {
    // Generate unique username if taken
    let finalUsername = username;
    let suffix = 1;
    while (await this.usernameExists(finalUsername)) {
      finalUsername = `${username}${suffix}`;
      suffix++;
    }

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        displayName: username,
        isGuest: true,
        moody: {
          create: {
            currentMood: 'neutral',
            level: 1,
            xp: 0,
          },
        },
        stats: {
          create: {},
        },
      },
      include: {
        moody: true,
        stats: true,
      },
    });

    const token = await this.createSession(user.id);

    return { user, token };
  }

  /**
   * Register a new user with email/password
   */
  async registerUser(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResult> {
    // Check if email exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new Error('Email bereits registriert');
    }

    // Check if username exists
    if (await this.usernameExists(username)) {
      throw new Error('Username bereits vergeben');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        isGuest: false,
        moody: {
          create: {
            currentMood: 'neutral',
            level: 1,
            xp: 0,
          },
        },
        stats: {
          create: {},
        },
      },
      include: {
        moody: true,
        stats: true,
      },
    });

    const token = await this.createSession(user.id);

    return { user, token };
  }

  /**
   * Login with email/password
   */
  async loginUser(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        moody: true,
        stats: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Ungültige Anmeldedaten');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Ungültige Anmeldedaten');
    }

    const token = await this.createSession(user.id);

    return { user, token };
  }

  /**
   * Convert guest to full account
   */
  async convertGuestToUser(
    userId: string,
    email: string,
    password: string
  ): Promise<UserWithMoody> {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new Error('Email bereits registriert');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.update({
      where: { id: userId },
      data: {
        email,
        passwordHash,
        isGuest: false,
      },
      include: {
        moody: true,
        stats: true,
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithMoody | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        moody: true,
        stats: true,
      },
    });
  }

  /**
   * Get user by session token
   */
  async getUserByToken(token: string): Promise<UserWithMoody | null> {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            moody: true,
            stats: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  }

  /**
   * Validate JWT and return user
   */
  async validateToken(token: string): Promise<UserWithMoody | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
      return this.getUserById(decoded.userId);
    } catch {
      return null;
    }
  }

  /**
   * Create a session for user
   */
  private async createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const session = await prisma.session.create({
      data: {
        userId,
        token: this.generateSessionToken(),
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Create JWT that includes session ID
    const token = jwt.sign(
      { userId, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: `${SESSION_EXPIRY_DAYS}d` }
    );

    // Update session with JWT token
    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    return token;
  }

  /**
   * Invalidate a session (logout)
   */
  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Check if username exists
   */
  private async usernameExists(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { username } });
    return !!user;
  }

  /**
   * Generate random session token
   */
  private generateSessionToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}

export const userService = new UserService();
