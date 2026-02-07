/**
 * RoomManager - Verwaltet alle Spielräume
 */

import {
  Room,
  RoomSettings,
  RoomState,
  RoomStatus,
  DEFAULT_ROOM_SETTINGS,
  generateRoomCode,
  Player,
  PlayerState,
  GameType,
  getGameInfo,
  generateRoomId,
  generatePlayerId,
  getRandomAvatarColor,
  PlaylistItem,
} from '@playtogether/shared';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private codeToRoomId: Map<string, string> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * Erstellt einen neuen Raum
   */
  createRoom(
    hostName: string,
    gameType: GameType,
    settings?: Partial<RoomSettings>,
    playlist?: PlaylistItem[]
  ): { room: Room; playerId: string } {
    const gameInfo = getGameInfo(gameType);
    if (!gameInfo) {
      throw new Error(`Unbekannter Spieltyp: ${gameType}`);
    }

    const roomId = generateRoomId();
    const code = this.generateUniqueCode();
    const playerId = generatePlayerId();

    const host: Player = {
      id: playerId,
      name: hostName,
      avatarColor: getRandomAvatarColor(),
      isHost: true,
      isConnected: true,
      isReady: false,
      score: 0,
      joinedAt: Date.now(),
    };

    const roomSettings = { ...DEFAULT_ROOM_SETTINGS, ...settings };

    // Default playlist: single game with room settings
    const defaultPlaylist: PlaylistItem[] = playlist || [{
      gameType,
      roundCount: roomSettings.roundCount,
      timePerRound: roomSettings.timePerRound,
    }];

    const room: Room = {
      id: roomId,
      code,
      hostId: playerId,
      gameType,
      status: 'waiting',
      players: new Map([[playerId, host]]),
      maxPlayers: gameInfo.maxPlayers,
      minPlayers: gameInfo.minPlayers,
      createdAt: Date.now(),
      settings: roomSettings,
      playlist: defaultPlaylist,
      currentPlaylistIndex: 0,
    };

    this.rooms.set(roomId, room);
    this.codeToRoomId.set(code, roomId);
    this.playerToRoom.set(playerId, roomId);

    console.log(`🏠 Raum erstellt: ${code} (${gameType}) von ${hostName}`);

    return { room, playerId };
  }

  /**
   * Spieler tritt einem Raum bei
   */
  joinRoom(
    code: string,
    playerName: string
  ): { room: Room; playerId: string } | null {
    const room = this.getRoomByCode(code);
    if (!room) return null;

    if (room.status !== 'waiting' && !room.settings.allowLateJoin) {
      throw new Error('Das Spiel hat bereits begonnen');
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error('Der Raum ist voll');
    }

    // Prüfen ob Name bereits vergeben (nur durch verbundene Spieler)
    for (const player of room.players.values()) {
      if (player.name.toLowerCase() === playerName.toLowerCase() && player.isConnected) {
        throw new Error('Dieser Name ist bereits vergeben');
      }
    }

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      avatarColor: getRandomAvatarColor(),
      isHost: false,
      isConnected: true,
      isReady: false,
      score: 0,
      joinedAt: Date.now(),
    };

    room.players.set(playerId, player);
    this.playerToRoom.set(playerId, room.id);

    console.log(`👤 ${playerName} ist Raum ${code} beigetreten`);

    return { room, playerId };
  }

  /**
   * Spieler verlässt einen Raum
   */
  leaveRoom(playerId: string): { room: Room; newHostId?: string } | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    console.log(`👤 ${player.name} hat Raum ${room.code} verlassen`);

    // Raum löschen wenn leer
    if (room.players.size === 0) {
      this.deleteRoom(room.id);
      return null;
    }

    // Neuen Host wählen wenn Host geht
    let newHostId: string | undefined;
    if (player.isHost) {
      const newHost = [...room.players.values()].sort(
        (a, b) => a.joinedAt - b.joinedAt
      )[0];
      if (newHost) {
        newHost.isHost = true;
        room.hostId = newHost.id;
        newHostId = newHost.id;
        console.log(`👑 ${newHost.name} ist jetzt Host von Raum ${room.code}`);
      }
    }

    return { room, newHostId };
  }

  /**
   * Raum löschen
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Alle Spieler-Zuordnungen entfernen
    for (const playerId of room.players.keys()) {
      this.playerToRoom.delete(playerId);
    }

    this.codeToRoomId.delete(room.code);
    this.rooms.delete(roomId);

    console.log(`🗑️ Raum ${room.code} gelöscht`);
  }

  /**
   * Raum per Code abrufen
   */
  getRoomByCode(code: string): Room | undefined {
    const roomId = this.codeToRoomId.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  /**
   * Raum per ID abrufen
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Raum eines Spielers abrufen
   */
  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  /**
   * Spieler im Raum abrufen
   */
  getPlayer(roomId: string, playerId: string): Player | undefined {
    return this.rooms.get(roomId)?.players.get(playerId);
  }

  /**
   * Raum-Status aktualisieren
   */
  updateRoomStatus(roomId: string, status: RoomStatus): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
    }
  }

  /**
   * Room in transferierbaren State umwandeln
   */
  getRoomState(room: Room): RoomState {
    const players: PlayerState[] = [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      isHost: p.isHost,
      score: p.score,
      isReady: p.isReady,
    }));

    return {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      gameType: room.gameType,
      status: room.status,
      players,
      maxPlayers: room.maxPlayers,
      minPlayers: room.minPlayers,
      settings: room.settings,
      playlist: room.playlist,
      currentPlaylistIndex: room.currentPlaylistIndex,
    };
  }

  /**
   * Generiert einen eindeutigen Raumcode
   */
  private generateUniqueCode(): string {
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
      if (attempts > 100) {
        throw new Error('Konnte keinen eindeutigen Code generieren');
      }
    } while (this.codeToRoomId.has(code));
    return code;
  }

  /**
   * Statistiken abrufen
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerToRoom.size,
    };
  }
}
