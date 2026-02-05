/**
 * WebSocket-Nachrichten-Typen für die PlayTogether-Plattform
 */

import type { RoomState, RoomSettings } from './room.js';
import type { PlayerState } from './player.js';
import type { GameType, GameState, QuizAnswer } from './game.js';
import type { MoodLevel, ReactionType, EquippedCosmetics, MoodyReaction } from './moody.js';

// === Client -> Server Nachrichten ===

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | SetReadyMessage
  | StartGameMessage
  | GameActionMessage
  | UpdateSettingsMessage
  | MoodyUpdateMessage
  | MoodyReactionMessage;

export interface CreateRoomMessage {
  type: 'create_room';
  payload: {
    playerName: string;
    gameType: GameType;
    settings?: Partial<RoomSettings>;
  };
}

export interface JoinRoomMessage {
  type: 'join_room';
  payload: {
    code: string;
    playerName: string;
  };
}

export interface LeaveRoomMessage {
  type: 'leave_room';
}

export interface SetReadyMessage {
  type: 'set_ready';
  payload: {
    ready: boolean;
  };
}

export interface StartGameMessage {
  type: 'start_game';
}

export interface GameActionMessage {
  type: 'game_action';
  payload: {
    action: string;
    data: unknown;
  };
}

export interface UpdateSettingsMessage {
  type: 'update_settings';
  payload: Partial<RoomSettings>;
}

// Moody-Nachrichten vom Client
export interface MoodyUpdateMessage {
  type: 'moody_update';
  payload: {
    mood: MoodLevel;
    cosmetics: EquippedCosmetics;
  };
}

export interface MoodyReactionMessage {
  type: 'moody_reaction';
  payload: {
    reactionType: ReactionType;
    toPlayerId?: string;
  };
}

// === Server -> Client Nachrichten ===

export type ServerMessage =
  | RoomCreatedMessage
  | RoomJoinedMessage
  | RoomUpdatedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerUpdatedMessage
  | GameStartingMessage
  | GameStateMessage
  | GameEndedMessage
  | ErrorMessage
  | MoodyUpdatedMessage
  | MoodyReactionReceivedMessage;

export interface RoomCreatedMessage {
  type: 'room_created';
  payload: {
    room: RoomState;
    playerId: string;
  };
}

export interface RoomJoinedMessage {
  type: 'room_joined';
  payload: {
    room: RoomState;
    playerId: string;
  };
}

export interface RoomUpdatedMessage {
  type: 'room_updated';
  payload: {
    room: RoomState;
  };
}

export interface PlayerJoinedMessage {
  type: 'player_joined';
  payload: {
    player: PlayerState;
  };
}

export interface PlayerLeftMessage {
  type: 'player_left';
  payload: {
    playerId: string;
    newHostId?: string;
  };
}

export interface PlayerUpdatedMessage {
  type: 'player_updated';
  payload: {
    player: PlayerState;
  };
}

export interface GameStartingMessage {
  type: 'game_starting';
  payload: {
    countdown: number;
  };
}

export interface GameStateMessage {
  type: 'game_state';
  payload: {
    state: GameState;
  };
}

export interface GameEndedMessage {
  type: 'game_ended';
  payload: {
    finalScores: Record<string, number>;
    winner: string;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
  };
}

// Moody-Nachrichten vom Server
export interface MoodyUpdatedMessage {
  type: 'moody_updated';
  payload: {
    playerId: string;
    mood: MoodLevel;
    cosmetics: EquippedCosmetics;
  };
}

export interface MoodyReactionReceivedMessage {
  type: 'moody_reaction_received';
  payload: {
    reaction: MoodyReaction;
  };
}

// Error Codes
export const ErrorCodes = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  NOT_HOST: 'NOT_HOST',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
  INVALID_ACTION: 'INVALID_ACTION',
  NAME_TAKEN: 'NAME_TAKEN',
} as const;
