/**
 * Socket.io Event Handler
 */

import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import { gameManager } from '../games/GameManager.js';
import { VoteManager } from '../games/VoteManager.js';
import type {
  ClientMessage,
  ServerMessage,
  MoodLevel,
  EquippedCosmetics,
  ReactionType,
  MoodyReaction,
  PlaylistItem,
  GameType,
} from '@playtogether/shared';
import { generateId, getGameInfo } from '@playtogether/shared';

interface SocketData {
  playerId?: string;
  roomId?: string;
  mood?: MoodLevel;
  cosmetics?: EquippedCosmetics;
}

// Track active vote managers per room
const voteManagers: Map<string, VoteManager> = new Map();

// Track disconnect timers for grace period (playerId -> timer)
const disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

// Track disconnected players' room info for reconnection (playerId -> { roomId, playerName })
const disconnectedPlayers: Map<string, { roomId: string; roomCode: string; playerName: string }> = new Map();

// Grace period before removing a disconnected player (30 seconds)
const DISCONNECT_GRACE_PERIOD_MS = 30_000;

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
        case 'game_vote':
          handleGameVote(message.payload);
          break;
        case 'end_session':
          handleEndSession();
          break;
        case 'moody_update':
          handleMoodyUpdate(message.payload);
          break;
        case 'moody_reaction':
          handleMoodyReaction(message.payload);
          break;
        case 'reconnect':
          handleReconnect(message.payload);
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
              isReady: player.isReady,
            },
          },
        });
      } catch (error) {
        sendError('JOIN_FAILED', (error as Error).message);
      }
    }

    function handleLeaveRoom() {
      if (!socketData.playerId || !socketData.roomId) return;

      // Cancel any pending disconnect timer
      const timer = disconnectTimers.get(socketData.playerId);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(socketData.playerId);
      }
      disconnectedPlayers.delete(socketData.playerId);

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
        const vm = voteManagers.get(roomId);
        if (vm) {
          vm.destroy();
          voteManagers.delete(roomId);
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

      // Persist the ready state
      player.isReady = payload.ready;

      broadcastToRoom(socketData.roomId, {
        type: 'player_updated',
        payload: {
          player: {
            id: player.id,
            name: player.name,
            avatarColor: player.avatarColor,
            isHost: player.isHost,
            score: player.score,
            isReady: player.isReady,
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

        // Set up VoteManager for session scoring
        const playerNames: Record<string, string> = {};
        for (const [id, player] of currentRoom.players) {
          playerNames[id] = player.name;
        }
        const vm = new VoteManager(
          roomId,
          [...currentRoom.players.keys()],
          playerNames,
          (event, data) => {
            broadcastToRoom(roomId, { type: event as any, payload: data as any });
            // When vote_result is emitted, start the next game after a short delay
            if (event === 'vote_result') {
              const voteResult = data as { chosenGame: { type: GameType; name: string; icon: string } };
              startNextGameAfterVote(roomId, voteResult.chosenGame.type);
            }
          }
        );
        voteManagers.set(roomId, vm);

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

        // Start the first game from playlist or room gameType
        const firstItem = currentRoom.playlist[0];
        if (firstItem) {
          vm.setLastPlayedGame(firstItem.gameType);
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
          vm.setLastPlayedGame(currentRoom.gameType);
          const engine = gameManager.createGame(currentRoom, onGameEvent);
          if (engine) {
            engine.start();
          }
        }
      }, 3000);
    }

    function handleGameEnded(roomId: string, data: { finalScores: Record<string, number>; winner: string }) {
      const vm = voteManagers.get(roomId);

      // End the game engine
      gameManager.endGame(roomId);

      if (vm) {
        // Add scores to cumulative
        vm.addGameScores(data.finalScores);

        // Switch to results phase
        roomManager.updateRoomStatus(roomId, 'results');

        // Send game_results with cumulative rankings
        vm.emitGameResults(data.finalScores, data.winner);

        // After 7 seconds, start voting
        setTimeout(() => {
          const currentRoom = roomManager.getRoom(roomId);
          if (!currentRoom) return;

          const currentVm = voteManagers.get(roomId);
          if (!currentVm) return;

          // Check if only 1 player — skip voting, pick random game
          if (currentRoom.players.size <= 1) {
            // Auto-pick a random game
            roomManager.updateRoomStatus(roomId, 'voting');
            currentVm.startVoting(1); // Resolve almost immediately
            return;
          }

          roomManager.updateRoomStatus(roomId, 'voting');
          currentVm.startVoting(30);
        }, 7000);
      } else {
        // No VoteManager (shouldn't happen normally) — fallback to finished
        broadcastToRoom(roomId, {
          type: 'game_ended',
          payload: data,
        });
        roomManager.updateRoomStatus(roomId, 'finished');
      }
    }

    function handleGameVote(payload: { gameType: GameType }) {
      if (!socketData.roomId || !socketData.playerId) return;

      const vm = voteManagers.get(socketData.roomId);
      if (!vm) return;

      vm.castVote(socketData.playerId, payload.gameType);
    }

    function handleEndSession() {
      if (!socketData.roomId || !socketData.playerId) return;

      const room = roomManager.getRoom(socketData.roomId);
      if (!room) return;

      // Only host can end session
      if (room.hostId !== socketData.playerId) {
        sendError('NOT_HOST', 'Nur der Host kann die Session beenden');
        return;
      }

      const vm = voteManagers.get(socketData.roomId);
      const rankings = vm ? vm.getRankings() : [];
      const gamesPlayed = vm ? vm.getGamesPlayed() : 0;

      // Send session_ended to all players
      broadcastToRoom(socketData.roomId, {
        type: 'session_ended',
        payload: {
          finalRankings: rankings,
          gamesPlayed,
        },
      });

      // Clean up
      gameManager.endGame(socketData.roomId);
      if (vm) {
        vm.destroy();
        voteManagers.delete(socketData.roomId);
      }
      roomManager.updateRoomStatus(socketData.roomId, 'finished');
    }

    function startNextGameAfterVote(roomId: string, chosenGameType: GameType) {
      // 3 second pause to show vote result, then countdown, then start
      setTimeout(() => {
        const currentRoom = roomManager.getRoom(roomId);
        if (!currentRoom) return;

        const vm = voteManagers.get(roomId);
        if (!vm) return;

        roomManager.updateRoomStatus(roomId, 'starting');

        broadcastToRoom(roomId, {
          type: 'game_starting',
          payload: { countdown: 3 },
        });

        setTimeout(() => {
          const room = roomManager.getRoom(roomId);
          if (!room) return;

          roomManager.updateRoomStatus(roomId, 'playing');
          room.gameType = chosenGameType;

          const gameInfo = getGameInfo(chosenGameType);
          const onGameEvent = (event: string, eventData: unknown) => {
            if (event === 'game_ended') {
              handleGameEnded(roomId, eventData as { finalScores: Record<string, number>; winner: string });
            } else {
              broadcastToRoom(roomId, { type: event as any, payload: eventData as any });
            }
          };

          const engine = gameManager.createGameWithSettings(
            roomId,
            chosenGameType,
            [...room.players.keys()],
            {
              roundCount: gameInfo?.defaultRounds || 5,
              timePerRound: gameInfo?.defaultTime || 30,
            },
            onGameEvent
          );
          if (engine) {
            engine.start();
          }
        }, 3000);
      }, 3000);
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
    // RECONNECT HANDLER
    // ============================================

    function handleReconnect(payload: { code: string; playerName: string }) {
      try {
        const room = roomManager.getRoomByCode(payload.code.toUpperCase());
        if (!room) {
          sendError('ROOM_NOT_FOUND', 'Raum nicht gefunden');
          return;
        }

        // Find disconnected player by name in this room
        let reconnectedPlayerId: string | null = null;
        for (const [pid, player] of room.players) {
          if (player.name.toLowerCase() === payload.playerName.toLowerCase() && !player.isConnected) {
            reconnectedPlayerId = pid;
            break;
          }
        }

        if (!reconnectedPlayerId) {
          // No disconnected player found with this name - treat as normal join
          sendError('RECONNECT_FAILED', 'Kein getrennter Spieler gefunden');
          return;
        }

        // Cancel the disconnect timer
        const timer = disconnectTimers.get(reconnectedPlayerId);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(reconnectedPlayerId);
        }
        disconnectedPlayers.delete(reconnectedPlayerId);

        // Restore the player's connection
        const player = room.players.get(reconnectedPlayerId)!;
        player.isConnected = true;

        socketData.playerId = reconnectedPlayerId;
        socketData.roomId = room.id;

        socket.join(room.id);

        console.log(`🔄 ${player.name} hat sich in Raum ${room.code} wiederverbunden`);

        send({
          type: 'room_joined',
          payload: {
            room: roomManager.getRoomState(room),
            playerId: reconnectedPlayerId,
          },
        });

        // Notify others
        socket.to(room.id).emit('message', {
          type: 'player_reconnected',
          payload: {
            playerId: reconnectedPlayerId,
            playerName: player.name,
          },
        });

        // Re-send voting state if in voting phase
        if (room.status === 'voting') {
          const vm = voteManagers.get(room.id);
          if (vm) {
            const candidates = vm.getCandidates();
            if (candidates.length > 0) {
              send({
                type: 'vote_start',
                payload: {
                  candidates,
                  countdownSeconds: 30, // Approximate remaining
                },
              });
              send({
                type: 'vote_update',
                payload: vm.getVoteUpdate(),
              });
            }
          }
        }
      } catch (error) {
        sendError('RECONNECT_FAILED', (error as Error).message);
      }
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

    // Verbindung getrennt - Grace Period für Reconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Verbindung getrennt: ${socket.id}`);

      if (socketData.playerId && socketData.roomId) {
        const room = roomManager.getRoom(socketData.roomId);
        const player = room?.players.get(socketData.playerId);

        if (room && player) {
          // Mark player as disconnected but keep them in the room
          player.isConnected = false;

          const playerId = socketData.playerId;
          const roomId = socketData.roomId;

          // Store reconnection info
          disconnectedPlayers.set(playerId, {
            roomId: room.id,
            roomCode: room.code,
            playerName: player.name,
          });

          console.log(`⏳ ${player.name} getrennt von Raum ${room.code} - ${DISCONNECT_GRACE_PERIOD_MS / 1000}s Grace Period`);

          // Notify other players about the disconnection
          broadcastToRoom(roomId, {
            type: 'player_disconnected',
            payload: {
              playerId,
              playerName: player.name,
            },
          });

          // If in voting phase, remove their vote and recheck
          if (room.status === 'voting') {
            const vm = voteManagers.get(roomId);
            if (vm) {
              // Vote is removed when player is fully removed (after grace period)
            }
          }

          // Start grace period timer
          const timer = setTimeout(() => {
            disconnectTimers.delete(playerId);
            disconnectedPlayers.delete(playerId);

            // Check if player is still disconnected
            const currentRoom = roomManager.getRoom(roomId);
            const currentPlayer = currentRoom?.players.get(playerId);
            if (currentPlayer && !currentPlayer.isConnected) {
              console.log(`⌛ Grace Period abgelaufen für ${currentPlayer.name} in Raum ${currentRoom!.code}`);
              const result = roomManager.leaveRoom(playerId);

              if (result) {
                broadcastToRoom(roomId, {
                  type: 'player_left',
                  payload: {
                    playerId,
                    newHostId: result.newHostId,
                  },
                });

                // Remove from VoteManager
                const vm = voteManagers.get(roomId);
                if (vm) {
                  vm.removePlayer(playerId);
                }
              } else {
                // Room was deleted (no players left)
                gameManager.endGame(roomId);
                const vm = voteManagers.get(roomId);
                if (vm) {
                  vm.destroy();
                  voteManagers.delete(roomId);
                }
              }
            }
          }, DISCONNECT_GRACE_PERIOD_MS);

          disconnectTimers.set(playerId, timer);
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
