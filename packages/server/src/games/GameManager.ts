/**
 * GameManager - Verwaltet aktive Spielinstanzen
 */

import type { GameType, Room, AnyGameState } from '@playtogether/shared';
import {
  BaseGameEngine,
  GameEngineConfig,
  GameEventCallback,
} from './BaseGameEngine.js';
import { WouldYouRatherEngine } from './WouldYouRatherEngine.js';
import { MostLikelyEngine } from './MostLikelyEngine.js';
import { EitherOrEngine } from './EitherOrEngine.js';
import { WordChainEngine } from './WordChainEngine.js';
import { AnagramEngine } from './AnagramEngine.js';
import { QuizEngine } from './QuizEngine.js';

type GameEngineConstructor = new (
  config: GameEngineConfig,
  onEvent: GameEventCallback
) => BaseGameEngine;

const GAME_ENGINES: Partial<Record<GameType, GameEngineConstructor>> = {
  quiz: QuizEngine,
  wouldyourather: WouldYouRatherEngine,
  mostlikely: MostLikelyEngine,
  eitheror: EitherOrEngine,
  wordchain: WordChainEngine,
  anagram: AnagramEngine,
};

export class GameManager {
  private activeGames: Map<string, BaseGameEngine> = new Map();

  /**
   * Erstellt ein neues Spiel für einen Raum
   */
  createGame(
    room: Room,
    onEvent: GameEventCallback
  ): BaseGameEngine | null {
    const EngineClass = GAME_ENGINES[room.gameType];

    if (!EngineClass) {
      console.warn(`Keine Engine für Spieltyp: ${room.gameType}`);
      return null;
    }

    const config: GameEngineConfig = {
      roomId: room.id,
      playerIds: [...room.players.keys()],
      settings: {
        roundCount: room.settings.roundCount,
        timePerRound: room.settings.timePerRound,
      },
    };

    const engine = new EngineClass(config, onEvent);
    this.activeGames.set(room.id, engine);

    console.log(`🎮 Spiel erstellt: ${room.gameType} für Raum ${room.code}`);

    return engine;
  }

  /**
   * Startet ein Spiel
   */
  startGame(roomId: string): boolean {
    const engine = this.activeGames.get(roomId);
    if (!engine) return false;

    engine.start();
    return true;
  }

  /**
   * Verarbeitet eine Spielaktion
   */
  handleAction(
    roomId: string,
    playerId: string,
    action: string,
    data: unknown
  ): boolean {
    const engine = this.activeGames.get(roomId);
    if (!engine) return false;

    engine.handleAction({ playerId, action, data });
    return true;
  }

  /**
   * Gibt den aktuellen Spielzustand zurück
   */
  getGameState(roomId: string): AnyGameState | null {
    const engine = this.activeGames.get(roomId);
    if (!engine) return null;

    return engine.getState();
  }

  /**
   * Beendet ein Spiel
   */
  endGame(roomId: string): void {
    const engine = this.activeGames.get(roomId);
    if (engine) {
      engine.destroy();
      this.activeGames.delete(roomId);
      console.log(`🛑 Spiel beendet für Raum ${roomId}`);
    }
  }

  /**
   * Prüft ob ein Spieltyp unterstützt wird
   */
  isGameTypeSupported(gameType: GameType): boolean {
    return gameType in GAME_ENGINES;
  }

  /**
   * Gibt alle unterstützten Spieltypen zurück
   */
  getSupportedGameTypes(): GameType[] {
    return Object.keys(GAME_ENGINES) as GameType[];
  }

  /**
   * Gibt Statistiken zurück
   */
  getStats() {
    return {
      activeGames: this.activeGames.size,
    };
  }
}

export const gameManager = new GameManager();
