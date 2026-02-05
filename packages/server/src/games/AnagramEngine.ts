/**
 * Anagramme - Spiellogik
 * Bilde so viele Wörter wie möglich aus den Buchstaben
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type { AnagramGameState, GameType } from '@playtogether/shared';
import {
  ANAGRAM_PUZZLES,
  canFormWord,
  shuffleArray,
} from '@playtogether/shared';

interface AnagramPuzzle {
  letters: string[];
  validWords: string[];
  bonusWord: string;
}

export class AnagramEngine extends BaseGameEngine {
  private puzzles: AnagramPuzzle[] = [];
  private currentPuzzle?: AnagramPuzzle;
  private letters: string[] = [];
  private foundWords: Map<string, Set<string>> = new Map(); // playerId -> found words
  private allValidWords: Set<string> = new Set();
  private bonusWord: string = '';
  private minWordLength: number = 3;
  private roundTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.puzzles = shuffleArray([...ANAGRAM_PUZZLES]).slice(
      0,
      config.settings.roundCount
    );
    this.minWordLength = 3;
  }

  getGameType(): GameType {
    return 'anagram';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentPuzzle = this.puzzles[this.currentRound - 1];
    this.letters = shuffleArray([...this.currentPuzzle.letters]);
    this.allValidWords = new Set(this.currentPuzzle.validWords);
    this.bonusWord = this.currentPuzzle.bonusWord;

    // Found words zurücksetzen
    this.foundWords.clear();
    for (const playerId of this.playerIds) {
      this.foundWords.set(playerId, new Set());
    }

    this.phase = 'active';
    this.emit('game_state', { state: this.getState() });

    // Timer für Rundenende
    this.roundTimer = this.startTimer(() => {
      this.finishRound();
    }, this.settings.timePerRound * 1000);
  }

  handleAction(action: GameAction): void {
    if (action.action === 'submit_word' && this.phase === 'active') {
      const word = (action.data as { word: string }).word.toLowerCase().trim();
      const playerId = action.playerId;

      const validation = this.validateWord(word, playerId);

      if (validation.valid) {
        // Wort gefunden
        const playerWords = this.foundWords.get(playerId)!;
        playerWords.add(word);

        // Punkte berechnen
        let points = word.length * 10;
        const isBonus = word === this.bonusWord;
        if (isBonus) {
          points += 50; // Bonus für Hauptwort
        }

        // Erste Person die ein Wort findet bekommt extra Punkte
        const isFirstToFind = this.isFirstToFindWord(word, playerId);
        if (isFirstToFind) {
          points += 20;
        }

        this.addScore(playerId, points);

        this.emit('word_found', {
          playerId,
          word,
          points,
          isBonus,
          isFirstToFind,
          totalFound: playerWords.size,
        });
      } else {
        this.emit('word_invalid', {
          playerId,
          word,
          reason: validation.reason,
        });
      }
    } else if (action.action === 'shuffle_letters' && this.phase === 'active') {
      // Spieler kann Buchstaben neu mischen
      this.letters = shuffleArray([...this.letters]);
      this.emit('letters_shuffled', {
        playerId: action.playerId,
        letters: this.letters,
      });
    }
  }

  getState(): AnagramGameState {
    const foundWordsObj: Record<string, string[]> = {};
    for (const [playerId, words] of this.foundWords) {
      foundWordsObj[playerId] = [...words];
    }

    return {
      type: 'anagram',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      letters: this.letters,
      foundWords: foundWordsObj,
      allValidWords: this.phase === 'reveal' ? [...this.allValidWords] : [],
      minWordLength: this.minWordLength,
      bonusWord: this.phase === 'reveal' ? this.bonusWord : undefined,
    };
  }

  private validateWord(
    word: string,
    playerId: string
  ): { valid: boolean; reason?: string } {
    if (word.length < this.minWordLength) {
      return { valid: false, reason: `Mindestens ${this.minWordLength} Buchstaben` };
    }

    // Prüfen ob Spieler das Wort schon gefunden hat
    const playerWords = this.foundWords.get(playerId);
    if (playerWords?.has(word)) {
      return { valid: false, reason: 'Bereits gefunden' };
    }

    // Prüfen ob Wort aus Buchstaben gebildet werden kann
    if (!canFormWord(word, this.letters)) {
      return { valid: false, reason: 'Buchstaben nicht verfügbar' };
    }

    // Prüfen ob gültiges Wort
    if (!this.allValidWords.has(word)) {
      return { valid: false, reason: 'Kein gültiges Wort' };
    }

    return { valid: true };
  }

  private isFirstToFindWord(word: string, excludePlayerId: string): boolean {
    for (const [playerId, words] of this.foundWords) {
      if (playerId !== excludePlayerId && words.has(word)) {
        return false;
      }
    }
    return true;
  }

  private finishRound(): void {
    this.phase = 'reveal';

    // Timer aufräumen
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
    }

    // Statistiken berechnen
    const stats: Record<string, number> = {};
    for (const [playerId, words] of this.foundWords) {
      stats[playerId] = words.size;
    }

    // Spieler mit den meisten Wörtern bekommt Bonus
    let maxWords = 0;
    let roundWinner: string | null = null;
    for (const [playerId, count] of Object.entries(stats)) {
      if (count > maxWords) {
        maxWords = count;
        roundWinner = playerId;
      }
    }

    if (roundWinner && maxWords > 0) {
      this.addScore(roundWinner, 50);
    }

    this.emit('round_ended', {
      stats,
      roundWinner,
      allValidWords: [...this.allValidWords],
      bonusWord: this.bonusWord,
    });

    this.emit('game_state', { state: this.getState() });

    // Nach Pause zur nächsten Runde
    this.startTimer(() => {
      this.nextRound();
    }, 5000);
  }
}
