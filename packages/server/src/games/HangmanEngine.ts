/**
 * Galgenmännchen (Hangman) - Kooperatives Wortraten
 * Alle Spieler arbeiten zusammen, um das Wort zu erraten.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  HangmanGameState,
  GameType,
} from '@playtogether/shared';
import type { WordEntry } from '@playtogether/shared';
import {
  getRandomWords,
} from '@playtogether/shared';

const MAX_WRONG_GUESSES = 8;

export class HangmanEngine extends BaseGameEngine {
  private words: WordEntry[] = [];
  private currentWord: string = '';
  private currentCategory: string = '';
  private guessedLetters: Set<string> = new Set();
  private correctLetters: Set<string> = new Set();
  private wrongLetters: Set<string> = new Set();
  private letterGuessedBy: Map<string, string> = new Map(); // letter -> playerId
  private solved: boolean = false;
  private solvedBy?: string;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.words = getRandomWords(config.settings.roundCount);
  }

  getGameType(): GameType {
    return 'hangman';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    const wordEntry = this.words[this.currentRound - 1];
    this.currentWord = wordEntry.word.toUpperCase();
    this.currentCategory = wordEntry.category;
    this.guessedLetters.clear();
    this.correctLetters.clear();
    this.wrongLetters.clear();
    this.letterGuessedBy.clear();
    this.solved = false;
    this.solvedBy = undefined;

    this.phase = 'active';
    this.emitGameState();

    // Timer starten (settings.timePerRound, Standard 60s)
    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.roundLost();
    });
  }

  handleAction(action: GameAction): void {
    if (this.phase !== 'active') return;

    if (action.action === 'guess_letter') {
      const data = action.data as { letter: string };
      const letter = data.letter.toUpperCase().trim();

      // Validierung: einzelner Buchstabe, noch nicht geraten
      if (letter.length !== 1 || !/[A-ZÄÖÜ]/.test(letter)) return;
      if (this.guessedLetters.has(letter)) return;

      this.guessedLetters.add(letter);
      this.letterGuessedBy.set(letter, action.playerId);

      if (this.currentWord.includes(letter)) {
        // Richtiger Buchstabe
        this.correctLetters.add(letter);

        // Punkte: 20 pro Vorkommen des Buchstabens
        const occurrences = this.currentWord.split('').filter(c => c === letter).length;
        this.addScore(action.playerId, 20 * occurrences);

        this.emit('letter_correct', {
          playerId: action.playerId,
          letter,
          occurrences,
          points: 20 * occurrences,
        });

        // Prüfen ob das Wort vollständig erraten wurde
        if (this.isWordComplete()) {
          this.roundWon(action.playerId);
          return;
        }
      } else {
        // Falscher Buchstabe
        this.wrongLetters.add(letter);

        this.emit('letter_wrong', {
          playerId: action.playerId,
          letter,
          wrongCount: this.wrongLetters.size,
          maxWrong: MAX_WRONG_GUESSES,
        });

        // Prüfen ob zu viele Fehler
        if (this.wrongLetters.size >= MAX_WRONG_GUESSES) {
          this.roundLost();
          return;
        }
      }

      this.emitGameState();

    } else if (action.action === 'solve') {
      const data = action.data as { word: string };
      const guess = data.word.toUpperCase().trim();

      if (guess === this.currentWord) {
        // Richtig gelöst! Bonus: 50 * verbleibende Fehlerversuche
        const remainingWrong = MAX_WRONG_GUESSES - this.wrongLetters.size;
        const bonus = 50 * remainingWrong;
        this.addScore(action.playerId, bonus);

        this.emit('word_solved', {
          playerId: action.playerId,
          word: this.currentWord,
          bonus,
        });

        this.roundWon(action.playerId);
      } else {
        // Falsch geraten zählt als Fehlversuch
        this.wrongLetters.add('*'); // Platzhalter für fehlgeschlagenen Lösungsversuch

        this.emit('solve_wrong', {
          playerId: action.playerId,
          guess,
          wrongCount: this.wrongLetters.size,
          maxWrong: MAX_WRONG_GUESSES,
        });

        if (this.wrongLetters.size >= MAX_WRONG_GUESSES) {
          this.roundLost();
          return;
        }

        this.emitGameState();
      }
    }
  }

  getState(): HangmanGameState {
    return {
      type: 'hangman',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      wordDisplay: this.getWordDisplay(),
      wordLength: this.currentWord.length,
      category: this.currentCategory,
      guessedLetters: [...this.guessedLetters],
      correctLetters: [...this.correctLetters],
      wrongLetters: [...this.wrongLetters],
      wrongCount: this.wrongLetters.size,
      maxWrong: MAX_WRONG_GUESSES,
      letterGuessedBy: Object.fromEntries(this.letterGuessedBy),
      solved: this.solved,
      solvedBy: this.solvedBy,
      revealedWord: this.phase === 'reveal' ? this.currentWord : undefined,
    };
  }

  /**
   * Erzeugt die Wortanzeige im Format "_ A _ _ E"
   */
  private getWordDisplay(): string {
    return this.currentWord
      .split('')
      .map(char => {
        if (char === ' ' || char === '-') return char;
        if (this.correctLetters.has(char) || this.solved) return char;
        return '_';
      })
      .join(' ');
  }

  /**
   * Prüft ob alle Buchstaben des Worts erraten wurden
   */
  private isWordComplete(): boolean {
    for (const char of this.currentWord) {
      if (char === ' ' || char === '-') continue;
      if (!this.correctLetters.has(char)) return false;
    }
    return true;
  }

  /**
   * Runde gewonnen - Wort wurde erraten
   */
  private roundWon(solvedByPlayerId: string): void {
    this.clearAllTimers();
    this.phase = 'reveal';
    this.solved = true;
    this.solvedBy = solvedByPlayerId;

    this.emit('round_won', {
      word: this.currentWord,
      solvedBy: solvedByPlayerId,
      scores: this.getScoresObject(),
    });

    this.emitGameState();

    // 3 Sekunden Reveal, dann nächste Runde
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  /**
   * Runde verloren - zu viele Fehler oder Zeit abgelaufen
   */
  private roundLost(): void {
    this.clearAllTimers();
    this.phase = 'reveal';
    this.solved = false;

    this.emit('round_lost', {
      word: this.currentWord,
      wrongCount: this.wrongLetters.size,
    });

    this.emitGameState();

    // 3 Sekunden Reveal, dann nächste Runde
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }
}
