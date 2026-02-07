/**
 * Wort-Raten - Erkläre Wörter und lass andere raten!
 *
 * Ein Spieler erklärt ein Wort, die anderen raten.
 * Rater: 100 base + Speed-Bonus. Erklärer: 50 wenn geraten.
 * Round-Robin für Erklärer-Rolle.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  WordGuessGameState,
  WordGuessEntry,
  GameType,
} from '@playtogether/shared';
import { getRandomWordGuessWords } from '@playtogether/shared';
import type { WordGuessWordEntry } from '@playtogether/shared';

export class WordGuessEngine extends BaseGameEngine {
  private words: WordGuessWordEntry[] = [];
  private currentWord?: WordGuessWordEntry;
  private explainerIndex: number = 0;
  private playerOrder: string[];
  private guesses: WordGuessEntry[] = [];
  private solved: boolean = false;
  private solvedBy?: string;
  private skipped: boolean = false;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.words = getRandomWordGuessWords(config.settings.roundCount);
    this.playerOrder = [...config.playerIds];
  }

  getGameType(): GameType {
    return 'word_guess';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentWord = this.words[this.currentRound - 1];
    this.guesses = [];
    this.solved = false;
    this.solvedBy = undefined;
    this.skipped = false;

    // Round-robin: each player gets a turn as explainer
    this.explainerIndex = (this.currentRound - 1) % this.playerOrder.length;

    this.phase = 'active';
    this.emitGameState();

    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.finishRound();
    });
  }

  handleAction(action: GameAction): void {
    if (this.phase !== 'active') return;

    if (action.action === 'guess') {
      this.handleGuess(action.playerId, action.data as { text: string });
    } else if (action.action === 'skip') {
      this.handleSkip(action.playerId);
    }
  }

  private handleGuess(playerId: string, data: { text: string }): void {
    const explainerId = this.playerOrder[this.explainerIndex];

    // Explainer can't guess
    if (playerId === explainerId) return;
    if (this.solved) return;

    const guessText = data.text.trim();
    if (!guessText) return;

    const correct = guessText.toLowerCase() === this.currentWord!.word.toLowerCase();

    const entry: WordGuessEntry = {
      playerId,
      guess: guessText,
      correct,
      timestamp: Date.now(),
    };
    this.guesses.push(entry);

    if (correct) {
      this.solved = true;
      this.solvedBy = playerId;

      // Score for guesser: 100 + speed bonus
      const timeLeftMs = this.getTimeLeftMs();
      const maxTimeMs = this.settings.timePerRound * 1000;
      const points = this.calculateSpeedScore(100, timeLeftMs, maxTimeMs);
      this.addScore(playerId, points);

      // Score for explainer: 50 points
      this.addScore(explainerId, 50);

      this.clearAllTimers();
      this.emitGameState();

      // Move to reveal after a moment
      this.startTimer(() => {
        this.finishRound();
      }, 2000);
    } else {
      this.emitGameState();
    }
  }

  private handleSkip(playerId: string): void {
    const explainerId = this.playerOrder[this.explainerIndex];
    if (playerId !== explainerId) return;

    this.skipped = true;
    this.clearAllTimers();
    this.finishRound();
  }

  private finishRound(): void {
    this.phase = 'reveal';
    this.clearAllTimers();
    this.emitGameState();

    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  getState(): WordGuessGameState {
    const explainerId = this.playerOrder[this.explainerIndex] || this.playerOrder[0];

    return {
      type: 'word_guess',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      explainerId,
      word: this.currentWord?.word ?? '',
      wordLength: this.currentWord?.word.length ?? 0,
      category: this.currentWord?.category ?? '',
      guesses: this.guesses,
      solved: this.solved,
      solvedBy: this.solvedBy,
      playerOrder: this.playerOrder,
      skipped: this.skipped,
    };
  }
}
