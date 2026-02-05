/**
 * Basis-Klasse für alle Spiel-Engines
 */

import type { GameType, GamePhase, AnyGameState } from '@playtogether/shared';

export interface GameEngineConfig {
  roomId: string;
  playerIds: string[];
  settings: {
    roundCount: number;
    timePerRound: number;
  };
}

export interface GameAction {
  playerId: string;
  action: string;
  data: unknown;
}

export type GameEventCallback = (event: string, data: unknown) => void;

export abstract class BaseGameEngine {
  protected roomId: string;
  protected playerIds: string[];
  protected settings: GameEngineConfig['settings'];
  protected currentRound: number = 0;
  protected phase: GamePhase = 'preparation';
  protected scores: Map<string, number> = new Map();
  protected timers: NodeJS.Timeout[] = [];
  protected onEvent: GameEventCallback;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    this.roomId = config.roomId;
    this.playerIds = config.playerIds;
    this.settings = config.settings;
    this.onEvent = onEvent;

    // Scores initialisieren
    for (const playerId of playerIds) {
      this.scores.set(playerId, 0);
    }
  }

  /**
   * Startet das Spiel
   */
  abstract start(): void;

  /**
   * Verarbeitet eine Spielaktion
   */
  abstract handleAction(action: GameAction): void;

  /**
   * Gibt den aktuellen Spielzustand zurück
   */
  abstract getState(): AnyGameState;

  /**
   * Gibt den Spieltyp zurück
   */
  abstract getGameType(): GameType;

  /**
   * Beendet das Spiel und räumt auf
   */
  destroy(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }

  /**
   * Startet einen Timer
   */
  protected startTimer(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(callback, delay);
    this.timers.push(timer);
    return timer;
  }

  /**
   * Fügt Punkte hinzu
   */
  protected addScore(playerId: string, points: number): void {
    const current = this.scores.get(playerId) || 0;
    this.scores.set(playerId, current + points);
  }

  /**
   * Gibt die Scores als Object zurück
   */
  protected getScoresObject(): Record<string, number> {
    return Object.fromEntries(this.scores);
  }

  /**
   * Sendet ein Event an alle Spieler
   */
  protected emit(event: string, data: unknown): void {
    this.onEvent(event, data);
  }

  /**
   * Startet die nächste Runde oder beendet das Spiel
   */
  protected nextRound(): void {
    this.currentRound++;

    if (this.currentRound > this.settings.roundCount) {
      this.endGame();
    } else {
      this.startRound();
    }
  }

  /**
   * Startet eine einzelne Runde
   */
  protected abstract startRound(): void;

  /**
   * Beendet das Spiel
   */
  protected endGame(): void {
    this.phase = 'end';
    this.emit('game_ended', {
      finalScores: this.getScoresObject(),
      winner: this.getWinner(),
    });
  }

  /**
   * Ermittelt den Gewinner
   */
  protected getWinner(): string | null {
    let maxScore = -1;
    let winner: string | null = null;

    for (const [playerId, score] of this.scores) {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    }

    return winner;
  }
}
