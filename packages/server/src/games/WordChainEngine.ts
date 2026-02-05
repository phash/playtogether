/**
 * Wortkette - Spiellogik
 * Der letzte Buchstabe wird zum ersten des nächsten Worts
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type { WordChainGameState, GameType } from '@playtogether/shared';
import {
  WORD_CHAIN_START_WORDS,
  isValidWordChainWord,
  shuffleArray,
} from '@playtogether/shared';

export class WordChainEngine extends BaseGameEngine {
  private currentWord: string = '';
  private currentPlayerIndex: number = 0;
  private playerOrder: string[] = [];
  private usedWords: Set<string> = new Set();
  private lastLetter: string = '';
  private turnTimeLimit: number = 15; // Sekunden pro Zug
  private eliminatedPlayers: Set<string> = new Set();
  private turnTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.playerOrder = shuffleArray([...config.playerIds]);
    this.turnTimeLimit = Math.min(config.settings.timePerRound, 20);
  }

  getGameType(): GameType {
    return 'wordchain';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 1;

    // Zufälliges Startwort
    const startWord = WORD_CHAIN_START_WORDS[
      Math.floor(Math.random() * WORD_CHAIN_START_WORDS.length)
    ];
    this.currentWord = startWord.toLowerCase();
    this.usedWords.add(this.currentWord);
    this.lastLetter = this.currentWord[this.currentWord.length - 1];

    this.emit('game_state', { state: this.getState() });
    this.startTurn();
  }

  protected startRound(): void {
    // Bei Wortkette gibt es keine Runden im klassischen Sinn
    // Das Spiel läuft bis nur noch ein Spieler übrig ist
    this.startTurn();
  }

  private startTurn(): void {
    // Nächsten aktiven Spieler finden
    this.findNextActivePlayer();

    if (this.getActivePlayers().length <= 1) {
      this.endGame();
      return;
    }

    this.emit('turn_started', {
      currentPlayerId: this.getCurrentPlayerId(),
      lastLetter: this.lastLetter,
      currentWord: this.currentWord,
      timeLimit: this.turnTimeLimit,
    });

    this.emit('game_state', { state: this.getState() });

    // Timer starten
    this.turnTimer = this.startTimer(() => {
      this.handleTimeout();
    }, this.turnTimeLimit * 1000);
  }

  handleAction(action: GameAction): void {
    const currentPlayerId = this.getCurrentPlayerId();

    if (action.action === 'submit_word' && action.playerId === currentPlayerId) {
      const word = (action.data as { word: string }).word.toLowerCase().trim();

      // Timer stoppen
      if (this.turnTimer) {
        clearTimeout(this.turnTimer);
      }

      // Wort validieren
      const validation = this.validateWord(word);

      if (validation.valid) {
        // Wort akzeptiert
        this.usedWords.add(word);
        this.currentWord = word;
        this.lastLetter = word[word.length - 1];

        // Punkte für gültiges Wort
        const points = word.length * 10;
        this.addScore(action.playerId, points);

        this.emit('word_accepted', {
          playerId: action.playerId,
          word,
          points,
          nextLetter: this.lastLetter,
        });

        // Nächster Spieler
        this.currentPlayerIndex++;
        this.startTurn();
      } else {
        // Wort abgelehnt
        this.emit('word_rejected', {
          playerId: action.playerId,
          word,
          reason: validation.reason,
        });

        // Spieler eliminieren
        this.eliminatePlayer(action.playerId);
      }
    }
  }

  getState(): WordChainGameState {
    return {
      type: 'wordchain',
      currentRound: this.currentRound,
      totalRounds: 1, // Kontinuierliches Spiel
      phase: this.phase,
      timeRemaining: this.turnTimeLimit,
      scores: this.getScoresObject(),
      currentWord: this.currentWord,
      currentPlayerIndex: this.currentPlayerIndex % this.playerOrder.length,
      currentPlayerId: this.getCurrentPlayerId(),
      playerOrder: this.playerOrder,
      usedWords: [...this.usedWords],
      lastLetter: this.lastLetter,
      turnTimeLimit: this.turnTimeLimit,
      eliminatedPlayers: [...this.eliminatedPlayers],
    };
  }

  private getCurrentPlayerId(): string {
    return this.playerOrder[this.currentPlayerIndex % this.playerOrder.length];
  }

  private validateWord(word: string): { valid: boolean; reason?: string } {
    if (word.length < 2) {
      return { valid: false, reason: 'Wort zu kurz' };
    }

    if (word[0] !== this.lastLetter) {
      return { valid: false, reason: `Muss mit "${this.lastLetter.toUpperCase()}" beginnen` };
    }

    if (this.usedWords.has(word)) {
      return { valid: false, reason: 'Wort wurde bereits verwendet' };
    }

    if (!isValidWordChainWord(word, this.lastLetter)) {
      return { valid: false, reason: 'Kein gültiges deutsches Wort' };
    }

    return { valid: true };
  }

  private handleTimeout(): void {
    const playerId = this.getCurrentPlayerId();

    this.emit('timeout', {
      playerId,
    });

    this.eliminatePlayer(playerId);
  }

  private eliminatePlayer(playerId: string): void {
    this.eliminatedPlayers.add(playerId);

    this.emit('player_eliminated', {
      playerId,
      remainingPlayers: this.getActivePlayers().length,
    });

    // Prüfen ob Spiel vorbei
    if (this.getActivePlayers().length <= 1) {
      this.endGame();
    } else {
      this.currentPlayerIndex++;
      this.startTurn();
    }
  }

  private findNextActivePlayer(): void {
    const maxAttempts = this.playerOrder.length;
    let attempts = 0;

    while (
      this.eliminatedPlayers.has(this.getCurrentPlayerId()) &&
      attempts < maxAttempts
    ) {
      this.currentPlayerIndex++;
      attempts++;
    }
  }

  private getActivePlayers(): string[] {
    return this.playerOrder.filter((id) => !this.eliminatedPlayers.has(id));
  }

  protected endGame(): void {
    this.phase = 'end';

    // Timer aufräumen
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
    }

    // Gewinner ist der letzte aktive Spieler oder der mit den meisten Punkten
    const activePlayers = this.getActivePlayers();
    let winner: string | null = null;

    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      // Bonus für Überleben
      this.addScore(winner, 200);
    } else {
      winner = this.getWinner();
    }

    this.emit('game_ended', {
      finalScores: this.getScoresObject(),
      winner,
      totalWords: this.usedWords.size,
    });
  }
}
