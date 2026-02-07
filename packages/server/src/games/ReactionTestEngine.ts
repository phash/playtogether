/**
 * Reaktions-Test - Reagiere so schnell wie möglich!
 *
 * Spieler warten auf ein Signal (2-5s zufällige Verzögerung).
 * Wer zu früh tippt bekommt 0 Punkte.
 * Schnellste Reaktion bekommt die meisten Punkte.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  ReactionTestGameState,
  ReactionTestRoundResult,
  GameType,
} from '@playtogether/shared';

export class ReactionTestEngine extends BaseGameEngine {
  private signalActive: boolean = false;
  private signalTime: number = 0;
  private reactionTimes: Map<string, number | null> = new Map();
  private falseStarts: Map<string, boolean> = new Map();
  private roundResults: ReactionTestRoundResult[] = [];
  private signalTimer: NodeJS.Timeout | null = null;
  private roundEndTimer: NodeJS.Timeout | null = null;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
  }

  getGameType(): GameType {
    return 'reaction_test';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    // Reset round state
    this.signalActive = false;
    this.signalTime = 0;
    this.reactionTimes.clear();
    this.falseStarts.clear();
    this.roundResults = [];

    for (const playerId of this.playerIds) {
      this.reactionTimes.set(playerId, null);
      this.falseStarts.set(playerId, false);
    }

    this.phase = 'preparation';
    this.emitGameState();

    // Random delay before signal: 2-5 seconds
    const delay = 2000 + Math.random() * 3000;

    this.signalTimer = this.startTimer(() => {
      this.signalActive = true;
      this.signalTime = Date.now();
      this.phase = 'active';
      this.emitGameState();

      // 5 second window to react
      this.roundEndTimer = this.startTimer(() => {
        this.finishRound();
      }, 5000);
    }, delay);
  }

  handleAction(action: GameAction): void {
    if (action.action === 'tap') {
      this.handleTap(action.playerId);
    }
  }

  private handleTap(playerId: string): void {
    // Already reacted or false-started
    if (this.reactionTimes.get(playerId) !== null || this.falseStarts.get(playerId)) return;

    if (!this.signalActive) {
      // False start!
      this.falseStarts.set(playerId, true);
      this.emitGameState();
      return;
    }

    // Record reaction time
    const reactionTimeMs = Date.now() - this.signalTime;
    this.reactionTimes.set(playerId, reactionTimeMs);
    this.emitGameState();

    // Check if all players have reacted
    if (this.allReacted()) {
      this.clearAllTimers();
      this.finishRound();
    }
  }

  private allReacted(): boolean {
    for (const playerId of this.playerIds) {
      if (!this.falseStarts.get(playerId) && this.reactionTimes.get(playerId) === null) {
        return false;
      }
    }
    return true;
  }

  private finishRound(): void {
    this.phase = 'reveal';
    this.clearAllTimers();

    // Calculate scores for this round
    const validReactions: { playerId: string; time: number }[] = [];

    for (const playerId of this.playerIds) {
      const time = this.reactionTimes.get(playerId);
      const falsed = this.falseStarts.get(playerId);

      if (falsed || time == null) {
        this.roundResults.push({ playerId, reactionTimeMs: null, points: 0 });
      } else {
        validReactions.push({ playerId, time });
      }
    }

    // Sort by reaction time (fastest first)
    validReactions.sort((a, b) => a.time - b.time);

    // Assign points: 1st=100, 2nd=75, 3rd=50, rest=25
    const pointTiers = [100, 75, 50, 25];
    for (let i = 0; i < validReactions.length; i++) {
      const points = pointTiers[Math.min(i, pointTiers.length - 1)];
      this.addScore(validReactions[i].playerId, points);
      this.roundResults.push({
        playerId: validReactions[i].playerId,
        reactionTimeMs: validReactions[i].time,
        points,
      });
    }

    // Sort results: valid reactions first (by time), then false starts
    this.roundResults.sort((a, b) => {
      if (a.reactionTimeMs === null && b.reactionTimeMs === null) return 0;
      if (a.reactionTimeMs === null) return 1;
      if (b.reactionTimeMs === null) return -1;
      return a.reactionTimeMs - b.reactionTimeMs;
    });

    this.emitGameState();

    // Next round after 3 seconds
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  getState(): ReactionTestGameState {
    const reactionTimesObj: Record<string, number | null> = {};
    for (const [playerId, time] of this.reactionTimes) {
      reactionTimesObj[playerId] = time;
    }

    const falseStartsObj: Record<string, boolean> = {};
    for (const [playerId, falsed] of this.falseStarts) {
      falseStartsObj[playerId] = falsed;
    }

    return {
      type: 'reaction_test',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      signalActive: this.signalActive,
      reactionTimes: reactionTimesObj,
      falseStarts: falseStartsObj,
      roundResults: this.roundResults,
      allReacted: this.allReacted(),
    };
  }
}
