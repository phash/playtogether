/**
 * Raum/Lobby-Typen für die PlayTogether-Plattform
 */

import type { Player, PlayerState } from './player.js';
import type { GameType, GameState } from './game.js';

export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'intermission' | 'finished';

// Playlist-Item für mehrere Spiele hintereinander
export interface PlaylistItem {
  gameType: GameType;
  roundCount: number;
  timePerRound: number;
}

export interface Room {
  id: string;
  code: string; // 4-6 stelliger Code zum Beitreten
  hostId: string;
  gameType: GameType;
  status: RoomStatus;
  players: Map<string, Player>;
  maxPlayers: number;
  minPlayers: number;
  createdAt: number;
  settings: RoomSettings;
  gameState?: GameState;
  playlist: PlaylistItem[];
  currentPlaylistIndex: number;
}

export interface RoomSettings {
  isPrivate: boolean;
  allowLateJoin: boolean;
  roundCount: number;
  timePerRound: number; // in Sekunden
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  isPrivate: true,
  allowLateJoin: false,
  roundCount: 5,
  timePerRound: 30,
};

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  gameType: GameType;
  status: RoomStatus;
  players: PlayerState[];
  maxPlayers: number;
  minPlayers: number;
  settings: RoomSettings;
  playlist: PlaylistItem[];
  currentPlaylistIndex: number;
}

export interface RoomCreate {
  gameType: GameType;
  settings?: Partial<RoomSettings>;
}

export interface RoomJoin {
  code: string;
  playerName: string;
}

// Generiert einen zufälligen 4-stelligen Raumcode
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne verwechselbare Zeichen (0,O,1,I)
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
