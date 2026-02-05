/**
 * Gluecksrad (Wheel of Fortune) - Spiellogik
 *
 * Features:
 * - Rundenbasiert: Spieler drehen abwechselnd das Rad
 * - Jede Runde = ein Satz/Phrase zum Erraten
 * - Rad-Ergebnisse: Geldbetraege, Bankrott, Freidrehen
 * - Konsonanten raten, Vokale kaufen, Phrase loesen
 * - 90 Sekunden pro Zug
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  GluecksradGameState,
  GluecksradSpinResult,
  GameType,
} from '@playtogether/shared';
import { shuffleArray } from '@playtogether/shared';

// Phrasen-Daten (lokal, da nicht in shared exportiert)
interface GluecksradPhrase {
  phrase: string;
  category: string;
}

const GLUECKSRAD_PHRASES: GluecksradPhrase[] = [
  { phrase: 'DER FRÜHE VOGEL FÄNGT DEN WURM', category: 'Sprichwort' },
  { phrase: 'ÜBUNG MACHT DEN MEISTER', category: 'Sprichwort' },
  { phrase: 'WER WAGT GEWINNT', category: 'Sprichwort' },
  { phrase: 'STILLE WASSER SIND TIEF', category: 'Sprichwort' },
  { phrase: 'ALLER ANFANG IST SCHWER', category: 'Sprichwort' },
  { phrase: 'DIE WÜRFEL SIND GEFALLEN', category: 'Redewendung' },
  { phrase: 'MORGENSTUND HAT GOLD IM MUND', category: 'Sprichwort' },
  { phrase: 'VIELE KÖCHE VERDERBEN DEN BREI', category: 'Sprichwort' },
  { phrase: 'WER ZULETZT LACHT LACHT AM BESTEN', category: 'Sprichwort' },
  { phrase: 'DAS LEBEN IST KEIN PONYHOF', category: 'Redewendung' },
  { phrase: 'REDEN IST SILBER SCHWEIGEN IST GOLD', category: 'Sprichwort' },
  { phrase: 'HOCHMUT KOMMT VOR DEM FALL', category: 'Sprichwort' },
  { phrase: 'KLEIDER MACHEN LEUTE', category: 'Sprichwort' },
  { phrase: 'DER APFEL FÄLLT NICHT WEIT VOM STAMM', category: 'Sprichwort' },
  { phrase: 'MAN SOLL DEN TAG NICHT VOR DEM ABEND LOBEN', category: 'Sprichwort' },
  { phrase: 'IN DER RUHE LIEGT DIE KRAFT', category: 'Sprichwort' },
  { phrase: 'OHNE FLEISS KEIN PREIS', category: 'Sprichwort' },
  { phrase: 'WISSEN IST MACHT', category: 'Zitat' },
  { phrase: 'DIE ZEIT HEILT ALLE WUNDEN', category: 'Sprichwort' },
  { phrase: 'LACHEN IST DIE BESTE MEDIZIN', category: 'Sprichwort' },
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü']);
const SPIN_AMOUNTS = [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
// 14 slots: 10 amounts + 2 bankrott + 1 freidrehen + 1 extra amount
const WHEEL_SLOTS: GluecksradSpinResult[] = [
  ...SPIN_AMOUNTS,
  'bankrott',
  'bankrott',
  'freidrehen',
  500, // extra slot to reach 14
];

export class GluecksradEngine extends BaseGameEngine {
  private phrases: GluecksradPhrase[] = [];
  private currentPhrase: GluecksradPhrase | null = null;
  private revealedLetters: Set<string> = new Set();
  private playerOrder: string[] = [];
  private currentPlayerIndex: number = 0;
  private lastSpinResult?: GluecksradSpinResult;
  private roundMoney: Map<string, number> = new Map();
  private canSpin: boolean = false;
  private canGuessLetter: boolean = false;
  private canSolve: boolean = false;
  private canBuyVowel: boolean = false;
  private solved: boolean = false;
  private solvedBy?: string;
  private wrongGuesses: number = 0;
  private currentSpinAmount: number = 0;
  private turnTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.phrases = shuffleArray([...GLUECKSRAD_PHRASES]).slice(
      0,
      config.settings.roundCount
    );
    this.playerOrder = shuffleArray([...config.playerIds]);
  }

  getGameType(): GameType {
    return 'gluecksrad';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentPhrase = this.phrases[this.currentRound - 1];
    this.revealedLetters.clear();
    this.solved = false;
    this.solvedBy = undefined;
    this.wrongGuesses = 0;
    this.lastSpinResult = undefined;
    this.currentSpinAmount = 0;

    // Rundengeld zuruecksetzen
    this.roundMoney.clear();
    for (const playerId of this.playerIds) {
      this.roundMoney.set(playerId, 0);
    }

    // Leerzeichen und Satzzeichen sind immer aufgedeckt
    // (werden nicht als Buchstaben behandelt)

    this.phase = 'active';
    this.setTurnState('spin');
    this.emitGameState();
    this.startTurnTimer();
  }

  handleAction(action: GameAction): void {
    const { playerId, action: actionType, data } = action;

    // Nur der aktuelle Spieler darf agieren
    if (playerId !== this.getCurrentPlayerId()) return;
    if (this.phase !== 'active' || this.solved) return;

    switch (actionType) {
      case 'spin':
        this.handleSpin(playerId);
        break;
      case 'guess_letter':
        this.handleGuessLetter(playerId, data as { letter: string });
        break;
      case 'buy_vowel':
        this.handleBuyVowel(playerId, data as { letter: string });
        break;
      case 'solve':
        this.handleSolve(playerId, data as { solution: string });
        break;
    }
  }

  getState(): GluecksradGameState {
    return {
      type: 'gluecksrad',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      phrase: this.getDisplayPhrase(),
      category: this.currentPhrase?.category ?? '',
      revealedLetters: [...this.revealedLetters],
      currentPlayerId: this.getCurrentPlayerId(),
      playerOrder: this.playerOrder,
      currentPlayerIndex: this.currentPlayerIndex,
      lastSpinResult: this.lastSpinResult,
      roundMoney: Object.fromEntries(this.roundMoney),
      canSpin: this.canSpin,
      canGuessLetter: this.canGuessLetter,
      canSolve: this.canSolve,
      canBuyVowel: this.canBuyVowel,
      wrongGuesses: this.wrongGuesses,
      solved: this.solved,
      solvedBy: this.solvedBy,
    };
  }

  // ---- Private Methoden ----

  private getCurrentPlayerId(): string {
    return this.playerOrder[this.currentPlayerIndex % this.playerOrder.length];
  }

  private getDisplayPhrase(): string {
    if (!this.currentPhrase) return '';

    return this.currentPhrase.phrase
      .split('')
      .map((ch) => {
        const upper = ch.toUpperCase();
        // Leerzeichen und Satzzeichen immer zeigen
        if (!this.isLetter(upper)) return ch;
        // Aufgedeckte Buchstaben zeigen
        if (this.revealedLetters.has(upper)) return upper;
        // Versteckte Buchstaben als _
        return '_';
      })
      .join('');
  }

  private isLetter(ch: string): boolean {
    return /[A-ZÄÖÜ]/i.test(ch);
  }

  private setTurnState(state: 'spin' | 'guess' | 'vowel_or_action'): void {
    switch (state) {
      case 'spin':
        this.canSpin = true;
        this.canGuessLetter = false;
        this.canSolve = true; // Kann immer loesen versuchen
        this.canBuyVowel = false;
        break;
      case 'guess':
        this.canSpin = false;
        this.canGuessLetter = true;
        this.canSolve = true;
        this.canBuyVowel = false;
        break;
      case 'vowel_or_action':
        this.canSpin = true;
        this.canGuessLetter = false;
        this.canSolve = true;
        this.canBuyVowel = this.canAffordVowel() && this.hasUnrevealedVowels();
        break;
    }
  }

  private canAffordVowel(): boolean {
    const playerId = this.getCurrentPlayerId();
    const money = this.roundMoney.get(playerId) ?? 0;
    return money >= 250;
  }

  private hasUnrevealedVowels(): boolean {
    if (!this.currentPhrase) return false;
    const phraseLetters = new Set(
      this.currentPhrase.phrase.toUpperCase().split('').filter((ch) => this.isLetter(ch))
    );
    for (const letter of phraseLetters) {
      if (VOWELS.has(letter) && !this.revealedLetters.has(letter)) {
        return true;
      }
    }
    return false;
  }

  private hasUnrevealedConsonants(): boolean {
    if (!this.currentPhrase) return false;
    const phraseLetters = new Set(
      this.currentPhrase.phrase.toUpperCase().split('').filter((ch) => this.isLetter(ch))
    );
    for (const letter of phraseLetters) {
      if (!VOWELS.has(letter) && !this.revealedLetters.has(letter)) {
        return true;
      }
    }
    return false;
  }

  private startTurnTimer(): void {
    this.clearAllTimers();
    this.startCountdownTimer(this.settings.timePerRound, () => {
      // Timeout: Zug geht zum naechsten Spieler
      this.emit('turn_timeout', { playerId: this.getCurrentPlayerId() });
      this.passTurn();
    });
  }

  private handleSpin(playerId: string): void {
    if (!this.canSpin) return;

    // Rad drehen
    const result = WHEEL_SLOTS[Math.floor(Math.random() * WHEEL_SLOTS.length)];
    this.lastSpinResult = result;

    this.emit('spin_result', { playerId, result });

    if (result === 'bankrott') {
      // Rundengeld auf 0
      this.roundMoney.set(playerId, 0);
      this.emit('bankrott', { playerId });
      this.emitGameState();
      // Kurze Pause, dann naechster Spieler
      this.clearAllTimers();
      this.startTimer(() => {
        this.passTurn();
      }, 2000);
      return;
    }

    if (result === 'freidrehen') {
      // Nochmal drehen
      this.emit('freidrehen', { playerId });
      this.setTurnState('spin');
      this.emitGameState();
      // Timer laeuft weiter
      return;
    }

    // Geldbetrag: Spieler muss Konsonant raten
    this.currentSpinAmount = result;

    if (!this.hasUnrevealedConsonants()) {
      // Keine Konsonanten mehr -> kann nur Vokal kaufen oder loesen
      this.setTurnState('vowel_or_action');
    } else {
      this.setTurnState('guess');
    }
    this.emitGameState();
  }

  private handleGuessLetter(playerId: string, data: { letter: string }): void {
    if (!this.canGuessLetter) return;
    if (!this.currentPhrase) return;

    const letter = data.letter.toUpperCase();

    // Muss ein Konsonant sein
    if (VOWELS.has(letter)) {
      this.emit('invalid_action', { playerId, reason: 'Vokale muessen gekauft werden' });
      return;
    }

    if (!this.isLetter(letter)) return;

    // Bereits aufgedeckt?
    if (this.revealedLetters.has(letter)) {
      this.emit('invalid_action', { playerId, reason: 'Buchstabe bereits aufgedeckt' });
      return;
    }

    this.revealedLetters.add(letter);

    // Vorkommen zaehlen
    const occurrences = this.countLetterInPhrase(letter);

    if (occurrences > 0) {
      // Richtig: Geld verdienen
      const earned = this.currentSpinAmount * occurrences;
      const currentMoney = this.roundMoney.get(playerId) ?? 0;
      this.roundMoney.set(playerId, currentMoney + earned);

      this.emit('letter_correct', {
        playerId,
        letter,
        occurrences,
        earned,
      });

      // Pruefen ob Phrase vollstaendig aufgedeckt
      if (this.isPhraseFullyRevealed()) {
        this.solvePhraseSuccess(playerId);
        return;
      }

      // Spieler bleibt dran - kann drehen, Vokal kaufen oder loesen
      this.clearAllTimers();
      this.setTurnState('vowel_or_action');
      this.emitGameState();
      this.startTurnTimer();
    } else {
      // Falsch: Zug geht weiter
      this.wrongGuesses++;
      this.emit('letter_wrong', { playerId, letter });
      this.emitGameState();
      this.clearAllTimers();
      this.startTimer(() => {
        this.passTurn();
      }, 1500);
    }
  }

  private handleBuyVowel(playerId: string, data: { letter: string }): void {
    if (!this.canBuyVowel) return;
    if (!this.currentPhrase) return;

    const letter = data.letter.toUpperCase();

    // Muss ein Vokal sein
    if (!VOWELS.has(letter)) {
      this.emit('invalid_action', { playerId, reason: 'Nur Vokale koennen gekauft werden' });
      return;
    }

    // Bereits aufgedeckt?
    if (this.revealedLetters.has(letter)) {
      this.emit('invalid_action', { playerId, reason: 'Buchstabe bereits aufgedeckt' });
      return;
    }

    // Kosten abziehen
    const currentMoney = this.roundMoney.get(playerId) ?? 0;
    if (currentMoney < 250) {
      this.emit('invalid_action', { playerId, reason: 'Nicht genug Geld (250 benoetigt)' });
      return;
    }

    this.roundMoney.set(playerId, currentMoney - 250);
    this.revealedLetters.add(letter);

    const occurrences = this.countLetterInPhrase(letter);

    if (occurrences > 0) {
      this.emit('vowel_correct', {
        playerId,
        letter,
        occurrences,
        cost: 250,
      });

      // Pruefen ob Phrase vollstaendig aufgedeckt
      if (this.isPhraseFullyRevealed()) {
        this.solvePhraseSuccess(playerId);
        return;
      }

      // Spieler bleibt dran
      this.clearAllTimers();
      this.setTurnState('vowel_or_action');
      this.emitGameState();
      this.startTurnTimer();
    } else {
      // Falscher Vokal: Zug geht weiter
      this.wrongGuesses++;
      this.emit('vowel_wrong', { playerId, letter, cost: 250 });
      this.emitGameState();
      this.clearAllTimers();
      this.startTimer(() => {
        this.passTurn();
      }, 1500);
    }
  }

  private handleSolve(playerId: string, data: { solution: string }): void {
    if (!this.canSolve) return;
    if (!this.currentPhrase) return;

    const guess = data.solution.toUpperCase().trim();
    const correct = this.currentPhrase.phrase.toUpperCase().trim();

    if (guess === correct) {
      this.solvePhraseSuccess(playerId);
    } else {
      // Falsch: Zug geht zum naechsten Spieler
      this.emit('solve_wrong', { playerId, guess });
      this.wrongGuesses++;
      this.emitGameState();
      this.clearAllTimers();
      this.startTimer(() => {
        this.passTurn();
      }, 1500);
    }
  }

  private solvePhraseSuccess(playerId: string): void {
    this.solved = true;
    this.solvedBy = playerId;
    this.clearAllTimers();

    // Alle Buchstaben aufdecken
    if (this.currentPhrase) {
      for (const ch of this.currentPhrase.phrase.toUpperCase()) {
        if (this.isLetter(ch)) {
          this.revealedLetters.add(ch);
        }
      }
    }

    // Rundengeld als Punkte gutschreiben
    const money = this.roundMoney.get(playerId) ?? 0;
    this.addScore(playerId, money);

    this.phase = 'reveal';

    this.emit('phrase_solved', {
      playerId,
      phrase: this.currentPhrase?.phrase ?? '',
      moneyWon: money,
    });

    this.emitGameState();

    // Nach 3 Sekunden naechste Runde
    this.startTimer(() => {
      if (this.currentRound >= this.settings.roundCount) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, 3000);
  }

  private passTurn(): void {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.playerOrder.length;
    this.lastSpinResult = undefined;
    this.currentSpinAmount = 0;

    this.setTurnState('spin');
    this.emitGameState();

    this.emit('turn_changed', {
      currentPlayerId: this.getCurrentPlayerId(),
    });

    this.startTurnTimer();
  }

  private countLetterInPhrase(letter: string): number {
    if (!this.currentPhrase) return 0;
    const upper = letter.toUpperCase();
    let count = 0;
    for (const ch of this.currentPhrase.phrase.toUpperCase()) {
      if (ch === upper) count++;
    }
    return count;
  }

  private isPhraseFullyRevealed(): boolean {
    if (!this.currentPhrase) return false;
    for (const ch of this.currentPhrase.phrase.toUpperCase()) {
      if (this.isLetter(ch) && !this.revealedLetters.has(ch)) {
        return false;
      }
    }
    return true;
  }
}
