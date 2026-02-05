/**
 * Anagramme - Entwirre das verwürfelte Wort!
 *
 * Jede Runde wird ein zufälliges Wort aus der WORD_LIST gewählt und verwürfelt.
 * Spieler haben timePerRound Sekunden um das Wort zu erraten.
 * Erster Löser: 100 * Speed-Bonus, weitere Löser: 50 * Speed-Bonus.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type { AnagrammeGameState, GameType } from '@playtogether/shared';
import {
  getRandomWords,
  scrambleWord,
} from '@playtogether/shared';
import type { WordEntry } from '@playtogether/shared';

export class AnagrammeEngine extends BaseGameEngine {
  private words: WordEntry[] = [];
  private currentWord?: WordEntry;
  private scrambledWord: string = '';
  private attempts: Map<string, string[]> = new Map(); // playerId -> attempted words
  private solved: Map<string, boolean> = new Map(); // playerId -> solved?
  private firstSolverId: string | null = null;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.words = getRandomWords(config.settings.roundCount);
  }

  getGameType(): GameType {
    return 'anagramme';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentWord = this.words[this.currentRound - 1];
    this.scrambledWord = scrambleWord(this.currentWord.word);
    this.firstSolverId = null;

    // Attempts und solved zurücksetzen
    this.attempts.clear();
    this.solved.clear();
    for (const playerId of this.playerIds) {
      this.attempts.set(playerId, []);
      this.solved.set(playerId, false);
    }

    this.phase = 'active';
    this.emitGameState();

    // Countdown-Timer starten
    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.finishRound();
    });
  }

  handleAction(action: GameAction): void {
    if (action.action === 'guess' && this.phase === 'active') {
      this.handleGuess(action.playerId, action.data as { word: string });
    }
  }

  private handleGuess(playerId: string, data: { word: string }): void {
    // Bereits gelöst -> ignorieren
    if (this.solved.get(playerId)) return;

    const guess = data.word.trim().toLowerCase();
    if (!guess) return;

    const playerAttempts = this.attempts.get(playerId) || [];
    playerAttempts.push(guess);
    this.attempts.set(playerId, playerAttempts);

    const correctWord = this.currentWord!.word.toLowerCase();

    if (guess === correctWord) {
      // Richtig gelöst!
      this.solved.set(playerId, true);

      const timeLeftMs = this.getTimeLeftMs();
      const maxTimeMs = this.settings.timePerRound * 1000;
      const isFirst = this.firstSolverId === null;

      if (isFirst) {
        this.firstSolverId = playerId;
      }

      // Erster Löser: 100 Basispunkte, weitere: 50
      const basePoints = isFirst ? 100 : 50;
      const points = this.calculateSpeedScore(basePoints, timeLeftMs, maxTimeMs);
      this.addScore(playerId, points);

      this.emit('word_solved', {
        playerId,
        word: correctWord,
        points,
        isFirst,
        attempts: playerAttempts.length,
      });

      // Prüfen ob alle gelöst haben
      if (this.allSolved()) {
        this.clearAllTimers();
        this.finishRound();
        return;
      }
    } else {
      this.emit('guess_wrong', {
        playerId,
        guess,
        attempts: playerAttempts.length,
      });
    }

    this.emitGameState();
  }

  private allSolved(): boolean {
    for (const solved of this.solved.values()) {
      if (!solved) return false;
    }
    return true;
  }

  private finishRound(): void {
    this.phase = 'reveal';
    this.clearAllTimers();

    this.emit('round_ended', {
      word: this.currentWord!.word,
      solved: Object.fromEntries(this.solved),
      firstSolver: this.firstSolverId,
    });

    this.emitGameState();

    // Nach 3 Sekunden zur nächsten Runde
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  getState(): AnagrammeGameState {
    const showWord = this.phase === 'reveal' || this.phase === 'end';

    const attemptsObj: Record<string, string[]> = {};
    for (const [playerId, words] of this.attempts) {
      attemptsObj[playerId] = [...words];
    }

    const solvedObj: Record<string, boolean> = {};
    for (const [playerId, isSolved] of this.solved) {
      solvedObj[playerId] = isSolved;
    }

    return {
      type: 'anagramme',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      scrambledWord: this.scrambledWord,
      wordLength: this.currentWord?.word.length ?? 0,
      category: this.currentWord?.category ?? '',
      difficulty: this.currentWord?.difficulty ?? 'easy',
      attempts: attemptsObj,
      solved: solvedObj,
      revealedWord: showWord ? this.currentWord?.word : undefined,
    };
  }
}
