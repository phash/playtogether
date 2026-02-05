/**
 * Socket.io Event Handler
 */

import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import { gameManager } from '../games/GameManager.js';
import { PlaylistManager } from '../games/PlaylistManager.js';
import type {
  ClientMessage,
  ServerMessage,
  MoodLevel,
  EquippedCosmetics,
  ReactionType,
  MoodyReaction,
  PlaylistItem,
} from '@playtogether/shared';
import { generateId } from '@playtogether/shared';

interface SocketData {
  playerId?: string;
  roomId?: string;
  mood?: MoodLevel;
  cosmetics?: EquippedCosmetics;
}

// Track active playlist managers per room
const playlistManagers: Map<string, PlaylistManager> = new Map();

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Neue Verbindung: ${socket.id}`);

    const socketData: SocketData = {};

    const send = (message: ServerMessage) => {
      socket.emit('message', message);
    };

    const sendError = (code: string, message: string) => {
      send({ type: 'error', payload: { code, message } });
    };

    const broadcastToRoom = (roomId: string, message: ServerMessage) => {
      io.to(roomId).emit('message', message);
    };

    socket.on('message', (message: ClientMessage) => {
      try {
        handleMessage(message);
      } catch (error) {
        console.error('Fehler bei Nachrichtenverarbeitung:', error);
        sendError('INTERNAL_ERROR', 'Ein Fehler ist aufgetreten');
      }
    });

    function handleMessage(message: ClientMessage) {
      switch (message.type) {
        case 'create_room':
          handleCreateRoom(message.payload);
          break;
        case 'join_room':
          handleJoinRoom(message.payload);
          break;
        case 'leave_room':
          handleLeaveRoom();
          break;
        case 'set_ready':
          handleSetReady(message.payload);
          break;
        case 'start_game':
          handleStartGame();
          break;
        case 'game_action':
          handleGameAction(message.payload);
          break;
        case 'update_settings':
          handleUpdateSettings(message.payload);
          break;
        case 'playlist_update':
          handlePlaylistUpdate(message.payload);
          break;
        case 'moody_update':
          handleMoodyUpdate(message.payload);
          break;
        case 'moody_reaction':
          handleMoodyReaction(message.payload);
          break;
        default:
          sendError('INVALID_ACTION', 'Unbekannte Aktion');
      }
    }

    function handleCreateRoom(payload: {
      playerName: string;
      gameType: any;
      settings?: any;
    }) {
      try {
        const { room, playerId } = roomManager.createRoom(
          payload.playerName,
          payload.gameType,
          payload.settings
        );

        socketData.playerId = playerId;
        socketData.roomId = room.id;

        socket.join(room.id);

        send({
          type: 'room_created',
          payload: {
            room: roomManager.getRoomState(room),
            playerId,
          },
        });
      } catch (error) {
        sendError('ROOM_CREATE_FAILED', (error as Error).message);
      }
    }

    function handleJoinRoom(payload: { code: string; playerName: string }) {
      try {
        const result = roomManager.joinRoom(
          payload.code.toUpperCase(),
          payload.playerName
        );

        if (!result) {
          sendError('ROOM_NOT_FOUND', 'Raum nicht gefunden');
          return;
        }

        const { room, playerId } = result;

        socketData.playerId = playerId;
        socketData.roomId = room.id;

        socket.join(room.id);

        send({
          type: 'room_joined',
          payload: {
            room: roomManager.getRoomState(room),
            playerId,
          },
        });

        const player = room.players.get(playerId)!;
        socket.to(room.id).emit('message', {
          type: 'player_joined',
          payload: {
            player: {
              id: player.id,
              name: player.name,
              avatarColor: player.avatarColor,
              isHost: player.isHost,
              score: player.score,
              isReady: false,
            },
          },
        });
      } catch (error) {
        sendError('JOIN_FAILED', (error as Error).message);
      }
    }

    function handleLeaveRoom() {
      if (!socketData.playerId || !socketData.roomId) return;

      const roomId = socketData.roomId;
      const result = roomManager.leaveRoom(socketData.playerId);

      if (result) {
        broadcastToRoom(roomId, {
          type: 'player_left',
          payload: {
            playerId: socketData.playerId,
            newHostId: result.newHostId,
          },
        });
      } else {
        gameManager.endGame(roomId);
        const pm = playlistManagers.get(roomId);
        if (pm) {
          pm.destroy();
          playlistManagers.delete(roomId);
        }
      }

      socket.leave(roomId);
      socketData.playerId = undefined;
      socketData.roomId = undefined;
    }

    function handleSetReady(payload: { ready: boolean }) {
      if (!socketData.roomId || !socketData.playerId) return;

      const room = roomManager.getRoom(socketData.roomId);
      if (!room) return;

      const player = room.players.get(socketData.playerId);
      if (!player) return;

      broadcastToRoom(socketData.roomId, {
        type: 'player_updated',
        payload: {
          player: {
            id: player.id,
            name: player.name,
            avatarColor: player.avatarColor,
            isHost: player.isHost,
            score: player.score,
            isReady: payload.ready,
          },
        },
      });
    }

    function handleStartGame() {
      if (!socketData.roomId || !socketData.playerId) return;

      const room = roomManager.getRoom(socketData.roomId);
      if (!room) return;

      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann das Spiel starten');
        return;
      }

      if (room.players.size < room.minPlayers) {
        sendError(
          'NOT_ENOUGH_PLAYERS',
          `Mindestens ${room.minPlayers} Spieler benötigt`
        );
        return;
      }

      roomManager.updateRoomStatus(socketData.roomId, 'starting');

      broadcastToRoom(socketData.roomId, {
        type: 'game_starting',
        payload: { countdown: 3 },
      });

      const roomId = socketData.roomId;

      setTimeout(() => {
        if (!roomId) return;
        const currentRoom = roomManager.getRoom(roomId);
        if (!currentRoom) return;

        roomManager.updateRoomStatus(roomId, 'playing');

        const onGameEvent = (event: string, data: unknown) => {
          if (event === 'game_ended') {
            handleGameEnded(roomId, data as { finalScores: Record<string, number>; winner: string });
          } else {
            broadcastToRoom(roomId, {
              type: event as any,
              payload: data as any,
            });
          }
        };

        // Set up playlist manager if playlist has more than 1 item
        if (currentRoom.playlist.length > 1) {
          const playerNames: Record<string, string> = {};
          for (const [id, player] of currentRoom.players) {
            playerNames[id] = player.name;
          }
          const pm = new PlaylistManager(
            roomId,
            [...currentRoom.players.keys()],
            playerNames,
            currentRoom.playlist,
            gameManager,
            (event, data) => broadcastToRoom(roomId, { type: event as any, payload: data as any })
          );
          playlistManagers.set(roomId, pm);
        }

        // Start the first game
        const firstItem = currentRoom.playlist[0];
        if (firstItem) {
          const engine = gameManager.createGameWithSettings(
            roomId,
            firstItem.gameType,
            [...currentRoom.players.keys()],
            { roundCount: firstItem.roundCount, timePerRound: firstItem.timePerRound },
            onGameEvent
          );
          if (engine) {
            engine.start();
          }
        } else {
          // Fallback: use room's gameType
          const engine = gameManager.createGame(currentRoom, onGameEvent);
          if (engine) {
            engine.start();
          }
        }
      }, 3000);
    }

    function handleGameEnded(roomId: string, data: { finalScores: Record<string, number>; winner: string }) {
      const pm = playlistManagers.get(roomId);

      if (pm) {
        // Playlist mode: add scores and check for next game
        pm.addGameScores(data.finalScores);

        // Broadcast game_ended for current game
        broadcastToRoom(roomId, {
          type: 'game_ended',
          payload: data,
        });

        gameManager.endGame(roomId);

        if (pm.advance()) {
          // More games to play - intermission
          roomManager.updateRoomStatus(roomId, 'intermission');
          pm.startIntermission(10);

          // After intermission, start next game
          setTimeout(() => {
            const currentRoom = roomManager.getRoom(roomId);
            if (!currentRoom) return;

            const nextItem = pm.getCurrentItem();
            if (!nextItem) {
              pm.endPlaylist();
              pm.destroy();
              playlistManagers.delete(roomId);
              roomManager.updateRoomStatus(roomId, 'finished');
              return;
            }

            roomManager.updateRoomStatus(roomId, 'playing');
            currentRoom.gameType = nextItem.gameType;
            currentRoom.currentPlaylistIndex = pm.currentPlaylistIndex;

            const onGameEvent = (event: string, eventData: unknown) => {
              if (event === 'game_ended') {
                handleGameEnded(roomId, eventData as { finalScores: Record<string, number>; winner: string });
              } else {
                broadcastToRoom(roomId, { type: event as any, payload: eventData as any });
              }
            };

            const engine = gameManager.createGameWithSettings(
              roomId,
              nextItem.gameType,
              [...currentRoom.players.keys()],
              { roundCount: nextItem.roundCount, timePerRound: nextItem.timePerRound },
              onGameEvent
            );
            if (engine) {
              engine.start();
            }
          }, 10000); // 10s intermission
        } else {
          // Playlist complete
          pm.endPlaylist();
          pm.destroy();
          playlistManagers.delete(roomId);
          roomManager.updateRoomStatus(roomId, 'finished');
        }
      } else {
        // Single game mode
        broadcastToRoom(roomId, {
          type: 'game_ended',
          payload: data,
        });
        gameManager.endGame(roomId);
        roomManager.updateRoomStatus(roomId, 'finished');
      }
    }

    function handleGameAction(payload: { action: string; data: unknown }) {
      if (!socketData.roomId || !socketData.playerId) return;

      const handled = gameManager.handleAction(
        socketData.roomId,
        socketData.playerId,
        payload.action,
        payload.data
      );

      if (!handled) {
        console.log(
          `🎮 Unbehandelte Spielaktion von ${socketData.playerId}: ${payload.action}`
        );
      }
    }

    function handleUpdateSettings(payload: any) {
      if (!socketData.roomId || !socketData.playerId) return;

      const room = roomManager.getRoom(socketData.roomId);
      if (!room) return;

      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann Einstellungen ändern');
        return;
      }

      room.settings = { ...room.settings, ...payload };

      broadcastToRoom(socketData.roomId, {
        type: 'room_updated',
        payload: {
          room: roomManager.getRoomState(room),
        },
      });
    }

    function handlePlaylistUpdate(payload: { playlist: PlaylistItem[] }) {
      if (!socketData.roomId || !socketData.playerId) return;

      const room = roomManager.getRoom(socketData.roomId);
      if (!room) return;

      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann die Playlist ändern');
        return;
      }

      if (room.status !== 'waiting') {
        sendError('GAME_ALREADY_STARTED', 'Playlist kann nur vor Spielstart geändert werden');
        return;
      }

      room.playlist = payload.playlist;

      // Update gameType to first item in playlist
      if (payload.playlist.length > 0) {
        room.gameType = payload.playlist[0].gameType;
      }

      broadcastToRoom(socketData.roomId, {
        type: 'room_updated',
        payload: {
          room: roomManager.getRoomState(room),
        },
      });
    }

    // ============================================
    // MOODY HANDLERS
    // ============================================

    function handleMoodyUpdate(payload: { mood: MoodLevel; cosmetics: EquippedCosmetics }) {
      if (!socketData.roomId || !socketData.playerId) return;

      socketData.mood = payload.mood;
      socketData.cosmetics = payload.cosmetics;

      socket.to(socketData.roomId).emit('message', {
        type: 'moody_updated',
        payload: {
          playerId: socketData.playerId,
          mood: payload.mood,
          cosmetics: payload.cosmetics,
        },
      });
    }

    function handleMoodyReaction(payload: { reactionType: ReactionType; toPlayerId?: string }) {
      if (!socketData.roomId || !socketData.playerId) return;

      const reaction: MoodyReaction = {
        id: generateId(),
        fromPlayerId: socketData.playerId,
        toPlayerId: payload.toPlayerId,
        type: payload.reactionType,
        timestamp: Date.now(),
      };

      broadcastToRoom(socketData.roomId, {
        type: 'moody_reaction_received',
        payload: { reaction },
      });
    }

    // Verbindung getrennt
    socket.on('disconnect', () => {
      console.log(`🔌 Verbindung getrennt: ${socket.id}`);

      if (socketData.playerId && socketData.roomId) {
        const result = roomManager.leaveRoom(socketData.playerId);

        if (result) {
          broadcastToRoom(socketData.roomId, {
            type: 'player_left',
            payload: {
              playerId: socketData.playerId,
              newHostId: result.newHostId,
            },
          });
        }
      }
    });
  });

  // Periodische Aufräumarbeiten
  setInterval(() => {
    const stats = roomManager.getStats();
    console.log(
      `📊 Stats: ${stats.totalRooms} Räume, ${stats.totalPlayers} Spieler`
    );
  }, 60000);
}
