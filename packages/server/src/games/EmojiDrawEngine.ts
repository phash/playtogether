/**
 * Emoji Malen - Male mit Emojis und lass andere raten!
 *
 * Ein Spieler platziert Emojis auf einem 4x4 Grid, die anderen raten das Wort.
 * Rater: 100 base + Speed-Bonus. Zeichner: 50 wenn geraten.
 * Round-Robin für Zeichner-Rolle.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  EmojiDrawGameState,
  WordGuessEntry,
  GameType,
} from '@playtogether/shared';
import { getRandomEmojiDrawWords, ALL_EMOJIS } from '@playtogether/shared';

export class EmojiDrawEngine extends BaseGameEngine {
  private words: { word: string; category: string }[] = [];
  private currentWord?: { word: string; category: string };
  private drawerIndex: number = 0;
  private playerOrder: string[];
  private emojiBoard: (string | null)[] = new Array(16).fill(null);
  private guesses: WordGuessEntry[] = [];
  private solved: boolean = false;
  private solvedBy?: string;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.words = getRandomEmojiDrawWords(config.settings.roundCount);
    this.playerOrder = [...config.playerIds];
  }

  getGameType(): GameType {
    return 'emoji_draw';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentWord = this.words[this.currentRound - 1];
    this.emojiBoard = new Array(16).fill(null);
    this.guesses = [];
    this.solved = false;
    this.solvedBy = undefined;

    this.drawerIndex = (this.currentRound - 1) % this.playerOrder.length;

    this.phase = 'active';
    this.emitGameState();

    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.finishRound();
    });
  }

  handleAction(action: GameAction): void {
    if (this.phase !== 'active') return;

    switch (action.action) {
      case 'place_emoji':
        this.handlePlaceEmoji(action.playerId, action.data as { emoji: string; position: number });
        break;
      case 'remove_emoji':
        this.handleRemoveEmoji(action.playerId, action.data as { position: number });
        break;
      case 'guess':
        this.handleGuess(action.playerId, action.data as { text: string });
        break;
    }
  }

  private handlePlaceEmoji(playerId: string, data: { emoji: string; position: number }): void {
    const drawerId = this.playerOrder[this.drawerIndex];
    if (playerId !== drawerId) return;

    if (data.position < 0 || data.position >= 16) return;

    this.emojiBoard[data.position] = data.emoji;
    this.emitGameState();
  }

  private handleRemoveEmoji(playerId: string, data: { position: number }): void {
    const drawerId = this.playerOrder[this.drawerIndex];
    if (playerId !== drawerId) return;

    if (data.position < 0 || data.position >= 16) return;

    this.emojiBoard[data.position] = null;
    this.emitGameState();
  }

  private handleGuess(playerId: string, data: { text: string }): void {
    const drawerId = this.playerOrder[this.drawerIndex];
    if (playerId === drawerId) return;
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

      const timeLeftMs = this.getTimeLeftMs();
      const maxTimeMs = this.settings.timePerRound * 1000;
      const points = this.calculateSpeedScore(100, timeLeftMs, maxTimeMs);
      this.addScore(playerId, points);
      this.addScore(drawerId, 50);

      this.clearAllTimers();
      this.emitGameState();

      this.startTimer(() => {
        this.finishRound();
      }, 2000);
    } else {
      this.emitGameState();
    }
  }

  private finishRound(): void {
    this.phase = 'reveal';
    this.clearAllTimers();
    this.emitGameState();

    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  getState(): EmojiDrawGameState {
    const drawerId = this.playerOrder[this.drawerIndex] || this.playerOrder[0];

    return {
      type: 'emoji_draw',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      drawerId,
      word: this.currentWord?.word ?? '',
      category: this.currentWord?.category ?? '',
      emojiBoard: [...this.emojiBoard],
      guesses: this.guesses,
      solved: this.solved,
      solvedBy: this.solvedBy,
      playerOrder: this.playerOrder,
      availableEmojis: ALL_EMOJIS,
    };
  }
}
