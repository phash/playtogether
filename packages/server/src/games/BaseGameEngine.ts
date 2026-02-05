/**
 * Basis-Klasse für alle Spiel-Engines
 */

import type { GameType, GamePhase, AnyGameState } from '@playtogether/shared';
import { calculateSpeedBonus } from '@playtogether/shared';

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
  protected intervals: NodeJS.Timeout[] = [];
  protected onEvent: GameEventCallback;
  protected roundStartTime: number = 0;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    this.roomId = config.roomId;
    this.playerIds = config.playerIds;
    this.settings = config.settings;
    this.onEvent = onEvent;

    // Scores initialisieren
    for (const playerId of this.playerIds) {
      this.scores.set(playerId, 0);
    }
  }

  abstract start(): void;
  abstract handleAction(action: GameAction): void;
  abstract getState(): AnyGameState;
  abstract getGameType(): GameType;

  destroy(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.timers = [];
    this.intervals = [];
  }

  protected startTimer(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(callback, delay);
    this.timers.push(timer);
    return timer;
  }

  /**
   * Startet einen Server-Timer mit timer:tick Events jede Sekunde
   */
  protected startCountdownTimer(durationSeconds: number, onExpire: () => void): void {
    this.roundStartTime = Date.now();
    let remaining = durationSeconds;

    // Emit initial tick
    this.emit('timer_tick', { timeRemaining: remaining });

    const interval = setInterval(() => {
      remaining--;
      this.emit('timer_tick', { timeRemaining: Math.max(0, remaining) });

      if (remaining <= 0) {
        clearInterval(interval);
        this.intervals = this.intervals.filter(i => i !== interval);
        onExpire();
      }
    }, 1000);

    this.intervals.push(interval);
  }

  protected clearAllTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.timers = [];
    this.intervals = [];
  }

  /**
   * Berechnet Speed-Score: basePoints * speedBonus
   */
  protected calculateSpeedScore(basePoints: number, timeLeftMs: number, maxTimeMs: number): number {
    const bonus = calculateSpeedBonus(timeLeftMs, maxTimeMs);
    return Math.round(basePoints * bonus);
  }

  protected addScore(playerId: string, points: number): void {
    const current = this.scores.get(playerId) || 0;
    this.scores.set(playerId, current + points);
  }

  protected getScoresObject(): Record<string, number> {
    return Object.fromEntries(this.scores);
  }

  protected emit(event: string, data: unknown): void {
    this.onEvent(event, data);
  }

  protected emitGameState(): void {
    this.emit('game_state', { state: this.getState() });
  }

  protected nextRound(): void {
    this.currentRound++;

    if (this.currentRound > this.settings.roundCount) {
      this.endGame();
    } else {
      this.startRound();
    }
  }

  protected abstract startRound(): void;

  protected endGame(): void {
    this.phase = 'end';
    this.clearAllTimers();
    this.emitGameState();
    this.emit('game_ended', {
      finalScores: this.getScoresObject(),
      winner: this.getWinner(),
    });
  }

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

  /**
   * Gibt die verbleibende Zeit seit Rundenstart in ms zurück
   */
  protected getTimeLeftMs(): number {
    const elapsed = Date.now() - this.roundStartTime;
    const maxMs = this.settings.timePerRound * 1000;
    return Math.max(0, maxMs - elapsed);
  }
}
