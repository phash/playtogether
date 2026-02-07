/**
 * Friendship Service - Handles friend requests and friend lists
 */

import { prisma } from '../db/prisma.js';

export interface FriendInfo {
  userId: string;
  username: string;
  displayName: string | null;
  since: Date;
}

export interface FriendRequestInfo {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string | null;
  sentAt: Date;
}

export class FriendshipService {
  /**
   * Send a friend request
   */
  async sendRequest(userId: string, friendUsername: string): Promise<void> {
    const friend = await prisma.user.findUnique({
      where: { username: friendUsername },
    });

    if (!friend) {
      throw new Error('Benutzer nicht gefunden');
    }

    if (friend.id === userId) {
      throw new Error('Du kannst dir nicht selbst eine Anfrage senden');
    }

    // Check if friendship already exists (in either direction)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: friend.id },
          { userId: friend.id, friendId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('Ihr seid bereits befreundet');
      }
      if (existing.status === 'pending') {
        throw new Error('Anfrage bereits gesendet');
      }
      if (existing.status === 'blocked') {
        throw new Error('Anfrage kann nicht gesendet werden');
      }
    }

    await prisma.friendship.create({
      data: {
        userId,
        friendId: friend.id,
        status: 'pending',
      },
    });
  }

  /**
   * Accept a friend request
   */
  async acceptRequest(userId: string, friendId: string): Promise<void> {
    const request = await prisma.friendship.findFirst({
      where: {
        userId: friendId,
        friendId: userId,
        status: 'pending',
      },
    });

    if (!request) {
      throw new Error('Anfrage nicht gefunden');
    }

    await prisma.friendship.update({
      where: { id: request.id },
      data: { status: 'accepted' },
    });
  }

  /**
   * Decline a friend request
   */
  async declineRequest(userId: string, friendId: string): Promise<void> {
    const request = await prisma.friendship.findFirst({
      where: {
        userId: friendId,
        friendId: userId,
        status: 'pending',
      },
    });

    if (!request) {
      throw new Error('Anfrage nicht gefunden');
    }

    await prisma.friendship.delete({
      where: { id: request.id },
    });
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' },
        ],
      },
    });

    if (!friendship) {
      throw new Error('Freundschaft nicht gefunden');
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });
  }

  /**
   * Get friends list
   */
  async getFriends(userId: string): Promise<FriendInfo[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
    });

    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    if (friendIds.length === 0) return [];

    const users = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, username: true, displayName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return friendships.map((f) => {
      const friendUserId = f.userId === userId ? f.friendId : f.userId;
      const user = userMap.get(friendUserId);
      return {
        userId: friendUserId,
        username: user?.username || 'Unbekannt',
        displayName: user?.displayName || null,
        since: f.createdAt,
      };
    });
  }

  /**
   * Get pending incoming friend requests
   */
  async getPendingRequests(userId: string): Promise<FriendRequestInfo[]> {
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
    });

    if (requests.length === 0) return [];

    const senderIds = requests.map((r) => r.userId);
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, username: true, displayName: true },
    });

    const senderMap = new Map(senders.map((s) => [s.id, s]));

    return requests.map((r) => {
      const sender = senderMap.get(r.userId);
      return {
        id: r.id,
        fromUserId: r.userId,
        fromUsername: sender?.username || 'Unbekannt',
        fromDisplayName: sender?.displayName || null,
        sentAt: r.createdAt,
      };
    });
  }
}

export const friendshipService = new FriendshipService();
