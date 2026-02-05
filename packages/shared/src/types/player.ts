/**
 * Spieler-Typen für die PlayTogether-Plattform
 */

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  joinedAt: number;
}

export interface PlayerCreate {
  name: string;
  avatarColor?: string;
}

export interface PlayerState {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  score: number;
  isReady: boolean;
}

// Vordefinierte Avatarfarben
export const AVATAR_COLORS = [
  '#FF6B6B', // Rot
  '#4ECDC4', // Türkis
  '#45B7D1', // Blau
  '#96CEB4', // Grün
  '#FFEAA7', // Gelb
  '#DDA0DD', // Lila
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Violett
  '#85C1E9', // Hellblau
] as const;

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
