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
} from '@playtogether/shared';

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

  // Actions
  createRoom: (gameType: GameType, settings?: Partial<RoomSettings>) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  sendGameAction: (action: string, data: unknown) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
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

  connect: () => {
    if (get().socket) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Verbunden mit Server');
      set({ isConnected: true });
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
    set({ room: null, playerId: null, gameState: null });
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

        // Host aktualisieren falls nötig
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

    case 'game_starting':
      set({ countdown: message.payload.countdown });
      // Countdown runter zählen
      const countdownInterval = setInterval(() => {
        const current = get().countdown;
        if (current && current > 1) {
          set({ countdown: current - 1 });
        } else {
          clearInterval(countdownInterval);
          set({ countdown: null });
        }
      }, 1000);
      break;

    case 'game_state':
      set({ gameState: message.payload.state, countdown: null });
      // Room Status aktualisieren
      const { room } = get();
      if (room) {
        set({ room: { ...room, status: 'playing' } });
      }
      break;

    case 'game_ended':
      set({ gameState: null });
      const currentRoom = get().room;
      if (currentRoom) {
        set({ room: { ...currentRoom, status: 'finished' } });
      }
      break;

    case 'error':
      set({ error: message.payload.message });
      console.error('Server error:', message.payload);
      break;
  }
}
