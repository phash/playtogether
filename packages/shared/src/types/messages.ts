/**
 * WebSocket-Nachrichten-Typen für die PlayTogether-Plattform
 */

import type { RoomState, RoomSettings, PlaylistItem } from './room.js';
import type { PlayerState } from './player.js';
import type { GameType, GameState } from './game.js';
import type { MoodLevel, ReactionType, EquippedCosmetics, MoodyReaction } from './moody.js';

// === Client -> Server Nachrichten ===

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | ReconnectMessage
  | SetReadyMessage
  | StartGameMessage
  | GameActionMessage
  | UpdateSettingsMessage
  | PlaylistUpdateMessage
  | GameVoteMessage
  | EndSessionMessage
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

export interface ReconnectMessage {
  type: 'reconnect';
  payload: {
    code: string;
    playerName: string;
  };
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

export interface PlaylistUpdateMessage {
  type: 'playlist_update';
  payload: {
    playlist: PlaylistItem[];
  };
}

export interface GameVoteMessage {
  type: 'game_vote';
  payload: {
    gameType: GameType;
  };
}

export interface EndSessionMessage {
  type: 'end_session';
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
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | GameStartingMessage
  | GameStateMessage
  | GameEndedMessage
  | TimerTickMessage
  | AnswerResultMessage
  | AnswerConfirmedMessage
  | IntermissionMessage
  | PlaylistEndedMessage
  | GameResultsMessage
  | VoteStartMessage
  | VoteUpdateMessage
  | VoteResultMessage
  | SessionEndedMessage
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

export interface PlayerDisconnectedMessage {
  type: 'player_disconnected';
  payload: {
    playerId: string;
    playerName: string;
  };
}

export interface PlayerReconnectedMessage {
  type: 'player_reconnected';
  payload: {
    playerId: string;
    playerName: string;
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

export interface TimerTickMessage {
  type: 'timer_tick';
  payload: {
    timeRemaining: number;
  };
}

export interface AnswerResultMessage {
  type: 'answer_result';
  payload: {
    playerId: string;
    correct: boolean;
    points: number;
    streak?: number;
  };
}

export interface AnswerConfirmedMessage {
  type: 'answer_confirmed';
  payload: {
    playerId: string;
  };
}

export interface IntermissionMessage {
  type: 'intermission';
  payload: {
    rankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
    nextGame?: { type: GameType; name: string; icon: string };
    currentPlaylistIndex: number;
    totalPlaylistItems: number;
    countdownSeconds: number;
  };
}

export interface PlaylistEndedMessage {
  type: 'playlist_ended';
  payload: {
    finalRankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
  };
}

export interface GameResultsMessage {
  type: 'game_results';
  payload: {
    finalScores: Record<string, number>;
    winner: string;
    winnerName: string;
    rankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
    gamesPlayed: number;
  };
}

export interface VoteStartMessage {
  type: 'vote_start';
  payload: {
    candidates: Array<{ type: GameType; name: string; icon: string; description: string }>;
    countdownSeconds: number;
  };
}

export interface VoteUpdateMessage {
  type: 'vote_update';
  payload: {
    votes: Record<string, number>;
    totalVoters: number;
    votedCount: number;
  };
}

export interface VoteResultMessage {
  type: 'vote_result';
  payload: {
    chosenGame: { type: GameType; name: string; icon: string };
    voteTally: Record<string, number>;
    wasTiebreak: boolean;
  };
}

export interface SessionEndedMessage {
  type: 'session_ended';
  payload: {
    finalRankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
    gamesPlayed: number;
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
