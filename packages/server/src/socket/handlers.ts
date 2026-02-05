/**
 * Socket.io Event Handler
 */

import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import { gameManager } from '../games/GameManager.js';
import type {
  ClientMessage,
  ServerMessage,
  ErrorCodes,
  MoodLevel,
  EquippedCosmetics,
  ReactionType,
  MoodyReaction,
  AnyGameState,
} from '@playtogether/shared';
import { generateId } from '@playtogether/shared';

interface SocketData {
  playerId?: string;
  roomId?: string;
  mood?: MoodLevel;
  cosmetics?: EquippedCosmetics;
}

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Neue Verbindung: ${socket.id}`);

    const socketData: SocketData = {};

    // Hilfsfunktion zum Senden von Nachrichten
    const send = (message: ServerMessage) => {
      socket.emit('message', message);
    };

    const sendError = (code: string, message: string) => {
      send({ type: 'error', payload: { code, message } });
    };

    const broadcastToRoom = (roomId: string, message: ServerMessage) => {
      io.to(roomId).emit('message', message);
    };

    // Nachricht vom Client verarbeiten
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

        // Socket dem Raum hinzufügen
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

        // Socket dem Raum hinzufügen
        socket.join(room.id);

        // Dem neuen Spieler die Rauminformationen senden
        send({
          type: 'room_joined',
          payload: {
            room: roomManager.getRoomState(room),
            playerId,
          },
        });

        // Anderen Spielern mitteilen
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
        // Anderen Spielern mitteilen
        broadcastToRoom(roomId, {
          type: 'player_left',
          payload: {
            playerId: socketData.playerId,
            newHostId: result.newHostId,
          },
        });
      } else {
        // Raum wurde gelöscht, Spiel auch beenden
        gameManager.endGame(roomId);
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

      // Player-Update an alle senden
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

      // Nur Host kann starten
      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann das Spiel starten');
        return;
      }

      // Mindestspielerzahl prüfen
      if (room.players.size < room.minPlayers) {
        sendError(
          'NOT_ENOUGH_PLAYERS',
          `Mindestens ${room.minPlayers} Spieler benötigt`
        );
        return;
      }

      // Countdown starten
      roomManager.updateRoomStatus(socketData.roomId, 'starting');

      broadcastToRoom(socketData.roomId, {
        type: 'game_starting',
        payload: { countdown: 3 },
      });

      const roomId = socketData.roomId;

      // Nach Countdown das Spiel starten
      setTimeout(() => {
        if (!roomId) return;
        roomManager.updateRoomStatus(roomId, 'playing');

        // Event Callback für Spiel-Events
        const onGameEvent = (event: string, data: unknown) => {
          broadcastToRoom(roomId, {
            type: event as any,
            payload: data,
          });
        };

        // Prüfen ob Spieltyp unterstützt wird
        if (gameManager.isGameTypeSupported(room.gameType)) {
          // Spiel-Engine erstellen und starten
          const engine = gameManager.createGame(room, onGameEvent);
          if (engine) {
            engine.start();
          }
        } else {
          // Fallback für nicht implementierte Spiele
          broadcastToRoom(roomId, {
            type: 'game_state',
            payload: {
              state: {
                type: room.gameType,
                currentRound: 1,
                totalRounds: room.settings.roundCount,
                phase: 'active',
                timeRemaining: room.settings.timePerRound,
                scores: Object.fromEntries(
                  [...room.players.keys()].map((id) => [id, 0])
                ),
              },
            },
          });
        }
      }, 3000);
    }

    function handleGameAction(payload: { action: string; data: unknown }) {
      if (!socketData.roomId || !socketData.playerId) return;

      // Spielaktion an GameManager weiterleiten
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

      // Nur Host kann Einstellungen ändern
      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann Einstellungen ändern');
        return;
      }

      // Einstellungen aktualisieren
      room.settings = { ...room.settings, ...payload };

      // Allen Spielern mitteilen
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

      // Lokalen State aktualisieren
      socketData.mood = payload.mood;
      socketData.cosmetics = payload.cosmetics;

      // Allen anderen Spielern im Raum mitteilen
      socket.to(socketData.roomId).emit('message', {
        type: 'moody_updated',
        payload: {
          playerId: socketData.playerId,
          mood: payload.mood,
          cosmetics: payload.cosmetics,
        },
      });

      console.log(`😊 ${socketData.playerId} ist jetzt: ${payload.mood}`);
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

      // An alle im Raum senden (oder nur an Ziel, wenn spezifiziert)
      if (payload.toPlayerId) {
        // Gezielte Reaction - an alle senden, damit sie die Animation sehen
        broadcastToRoom(socketData.roomId, {
          type: 'moody_reaction_received',
          payload: { reaction },
        });
      } else {
        // Broadcast-Reaction an alle
        broadcastToRoom(socketData.roomId, {
          type: 'moody_reaction_received',
          payload: { reaction },
        });
      }

      console.log(`🎉 Reaction von ${socketData.playerId}: ${payload.reactionType}`);
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
