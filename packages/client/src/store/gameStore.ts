/**
 * Zentraler State Store für PlayTogether
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  RoomState,
  PlayerState,
  GameState,
  ClientMessage,
  ServerMessage,
  GameType,
  RoomSettings,
  PlaylistItem,
} from '@playtogether/shared';

interface GameResultsData {
  finalScores: Record<string, number>;
  winner: string;
  winnerName: string;
  rankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
  gamesPlayed: number;
}

interface VoteData {
  candidates: Array<{ type: GameType; name: string; icon: string; description: string }>;
  countdownSeconds: number;
  votes: Record<string, number>;
  totalVoters: number;
  votedCount: number;
}

interface VoteResultData {
  chosenGame: { type: GameType; name: string; icon: string };
  voteTally: Record<string, number>;
  wasTiebreak: boolean;
}

interface SessionEndedData {
  finalRankings: Array<{ playerId: string; playerName: string; score: number; rank: number }>;
  gamesPlayed: number;
}

interface GameStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;

  // Player
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;

  // Room
  room: RoomState | null;
  error: string | null;
  clearError: () => void;

  // Game
  gameState: GameState | null;
  countdown: number | null;
  timerValue: number | null;

  // Voting system
  gameResultsData: GameResultsData | null;
  voteData: VoteData | null;
  voteResultData: VoteResultData | null;
  sessionEndedData: SessionEndedData | null;
  myVote: GameType | null;

  // Legacy (kept for type compat)
  intermissionData: null;
  playlistEndedData: null;

  // Actions
  createRoom: (gameType: GameType, settings?: Partial<RoomSettings>) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  sendGameAction: (action: string, data: unknown) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  updatePlaylist: (playlist: PlaylistItem[]) => void;
  submitVote: (gameType: GameType) => void;
  endSession: () => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  playerId: null,
  playerName: localStorage.getItem('playerName') || '',
  room: null,
  error: null,
  gameState: null,
  countdown: null,
  timerValue: null,
  gameResultsData: null,
  voteData: null,
  voteResultData: null,
  sessionEndedData: null,
  myVote: null,
  intermissionData: null,
  playlistEndedData: null,

  connect: () => {
    if (get().socket) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Verbunden mit Server');
      set({ isConnected: true });

      // Auto-reconnect: if we had a room, try to rejoin
      const { room, playerName } = get();
      if (room && playerName) {
        console.log(`🔄 Versuche Reconnect zu Raum ${room.code}...`);
        const message: ClientMessage = {
          type: 'reconnect',
          payload: {
            code: room.code,
            playerName,
          },
        };
        socket.emit('message', message);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Verbindung getrennt');
      set({ isConnected: false });
    });

    socket.on('message', (message: ServerMessage) => {
      handleServerMessage(message, set, get);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  setPlayerName: (name: string) => {
    localStorage.setItem('playerName', name);
    set({ playerName: name });
  },

  clearError: () => set({ error: null }),

  createRoom: (gameType: GameType, settings?: Partial<RoomSettings>) => {
    const { socket, playerName } = get();
    if (!socket || !playerName) return;

    const message: ClientMessage = {
      type: 'create_room',
      payload: {
        playerName,
        gameType,
        settings,
      },
    };
    socket.emit('message', message);
  },

  joinRoom: (code: string) => {
    const { socket, playerName } = get();
    if (!socket || !playerName) return;

    const message: ClientMessage = {
      type: 'join_room',
      payload: {
        code: code.toUpperCase(),
        playerName,
      },
    };
    socket.emit('message', message);
  },

  leaveRoom: () => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = { type: 'leave_room' };
    socket.emit('message', message);
    set({
      room: null,
      playerId: null,
      gameState: null,
      timerValue: null,
      gameResultsData: null,
      voteData: null,
      voteResultData: null,
      sessionEndedData: null,
      myVote: null,
      intermissionData: null,
      playlistEndedData: null,
    });
  },

  setReady: (ready: boolean) => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = {
      type: 'set_ready',
      payload: { ready },
    };
    socket.emit('message', message);
  },

  startGame: () => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = { type: 'start_game' };
    socket.emit('message', message);
  },

  sendGameAction: (action: string, data: unknown) => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = {
      type: 'game_action',
      payload: { action, data },
    };
    socket.emit('message', message);
  },

  updateSettings: (settings: Partial<RoomSettings>) => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = {
      type: 'update_settings',
      payload: settings,
    };
    socket.emit('message', message);
  },

  updatePlaylist: (playlist: PlaylistItem[]) => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = {
      type: 'playlist_update',
      payload: { playlist },
    };
    socket.emit('message', message);
  },

  submitVote: (gameType: GameType) => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = {
      type: 'game_vote',
      payload: { gameType },
    };
    socket.emit('message', message);
    set({ myVote: gameType });
  },

  endSession: () => {
    const { socket } = get();
    if (!socket) return;

    const message: ClientMessage = { type: 'end_session' };
    socket.emit('message', message);
  },
}));

function handleServerMessage(
  message: ServerMessage,
  set: (state: Partial<GameStore>) => void,
  get: () => GameStore
) {
  switch (message.type) {
    case 'room_created':
    case 'room_joined':
      set({
        room: message.payload.room,
        playerId: message.payload.playerId,
        error: null,
        gameResultsData: null,
        voteData: null,
        voteResultData: null,
        sessionEndedData: null,
        myVote: null,
      });
      break;

    case 'room_updated':
      set({ room: message.payload.room });
      break;

    case 'player_joined': {
      const { room } = get();
      if (room) {
        set({
          room: {
            ...room,
            players: [...room.players, message.payload.player],
          },
        });
      }
      break;
    }

    case 'player_left': {
      const { room } = get();
      if (room) {
        const updatedPlayers = room.players.filter(
          (p) => p.id !== message.payload.playerId
        );

        if (message.payload.newHostId) {
          const hostIndex = updatedPlayers.findIndex(
            (p) => p.id === message.payload.newHostId
          );
          if (hostIndex !== -1) {
            updatedPlayers[hostIndex] = {
              ...updatedPlayers[hostIndex],
              isHost: true,
            };
          }
        }

        set({
          room: {
            ...room,
            players: updatedPlayers,
            hostId: message.payload.newHostId || room.hostId,
          },
        });
      }
      break;
    }

    case 'player_updated': {
      const { room } = get();
      if (room) {
        set({
          room: {
            ...room,
            players: room.players.map((p) =>
              p.id === message.payload.player.id ? message.payload.player : p
            ),
          },
        });
      }
      break;
    }

    case 'player_disconnected': {
      console.log(`⏳ Spieler ${(message.payload as any).playerName} getrennt`);
      break;
    }

    case 'player_reconnected': {
      console.log(`🔄 Spieler ${(message.payload as any).playerName} wiederverbunden`);
      break;
    }

    case 'game_starting':
      set({
        countdown: message.payload.countdown,
        gameResultsData: null,
        voteData: null,
        voteResultData: null,
        myVote: null,
      });
      {
        const countdownInterval = setInterval(() => {
          const current = get().countdown;
          if (current && current > 1) {
            set({ countdown: current - 1 });
          } else {
            clearInterval(countdownInterval);
            set({ countdown: null });
          }
        }, 1000);
      }
      break;

    case 'game_state':
      set({ gameState: message.payload.state, countdown: null, gameResultsData: null });
      {
        const { room } = get();
        if (room && room.status !== 'playing') {
          set({ room: { ...room, status: 'playing' } });
        }
      }
      break;

    case 'game_ended':
      // Just clear game state, don't set finished — results screen will follow
      set({ gameState: null, timerValue: null });
      break;

    case 'game_results':
      set({
        gameResultsData: message.payload,
        gameState: null,
        timerValue: null,
      });
      {
        const currentRoom = get().room;
        if (currentRoom) {
          set({ room: { ...currentRoom, status: 'results' } });
        }
      }
      break;

    case 'vote_start':
      set({
        voteData: {
          candidates: message.payload.candidates,
          countdownSeconds: message.payload.countdownSeconds,
          votes: {},
          totalVoters: 0,
          votedCount: 0,
        },
        gameResultsData: null,
        myVote: null,
      });
      {
        const currentRoom = get().room;
        if (currentRoom) {
          set({ room: { ...currentRoom, status: 'voting' } });
        }
      }
      break;

    case 'vote_update': {
      const { voteData } = get();
      if (voteData) {
        set({
          voteData: {
            ...voteData,
            votes: message.payload.votes,
            totalVoters: message.payload.totalVoters,
            votedCount: message.payload.votedCount,
          },
        });
      }
      break;
    }

    case 'vote_result':
      set({
        voteResultData: message.payload,
        voteData: null,
      });
      break;

    case 'session_ended':
      set({
        sessionEndedData: message.payload,
        gameResultsData: null,
        voteData: null,
        voteResultData: null,
        gameState: null,
        timerValue: null,
      });
      {
        const currentRoom = get().room;
        if (currentRoom) {
          set({ room: { ...currentRoom, status: 'finished' } });
        }
      }
      break;

    case 'timer_tick':
      set({ timerValue: message.payload.timeRemaining });
      break;

    case 'answer_result':
      // Individual answer feedback - can be used by game components
      break;

    case 'answer_confirmed':
      // Player answer confirmed
      break;

    case 'intermission':
      // Legacy — no longer used
      break;

    case 'playlist_ended':
      // Legacy — no longer used
      break;

    case 'error':
      set({ error: message.payload.message });
      console.error('Server error:', message.payload);
      break;

    // Moody-Nachrichten
    case 'moody_updated': {
      import('./moodyStore').then(({ useMoodyStore }) => {
        useMoodyStore.getState().setPlayerMood(
          message.payload.playerId,
          message.payload.mood,
          message.payload.cosmetics
        );
      });
      break;
    }

    case 'moody_reaction_received': {
      import('./moodyStore').then(({ useMoodyStore }) => {
        useMoodyStore.getState().addIncomingReaction(message.payload.reaction);
      });
      break;
    }
  }
}
