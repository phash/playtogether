/**
 * Entweder/Oder - Mehrheitsabstimmung
 * Spieler stimmen für Option A oder B ab, die Mehrheit gewinnt Punkte.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  EntwederOderGameState,
  EntwederOderQuestion,
  GameType,
} from '@playtogether/shared';
import {
  ENTWEDER_ODER_QUESTIONS,
  shuffleArray,
  getRandomQuestions,
} from '@playtogether/shared';

export class EntwederOderEngine extends BaseGameEngine {
  private questions: EntwederOderQuestion[] = [];
  private currentQuestion?: EntwederOderQuestion;
  private votes: Map<string, 'A' | 'B' | null> = new Map();
  private votingComplete: boolean = false;
  private results?: { a: number; b: number; total: number; percentA: number; percentB: number };
  private roundTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.questions = getRandomQuestions(
      ENTWEDER_ODER_QUESTIONS,
      Math.min(config.settings.roundCount, ENTWEDER_ODER_QUESTIONS.length)
    );
  }

  getGameType(): GameType {
    return 'entweder_oder';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentQuestion = this.questions[this.currentRound - 1];
    this.votes.clear();
    this.votingComplete = false;
    this.results = undefined;

    // Votes initialisieren
    for (const playerId of this.playerIds) {
      this.votes.set(playerId, null);
    }

    this.phase = 'active';
    this.emitGameState();

    // Timer starten (settings.timePerRound, Standard 15s)
    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.finishVoting();
    });
  }

  handleAction(action: GameAction): void {
    if (action.action === 'vote' && this.phase === 'active') {
      const data = action.data as { choice: 'A' | 'B' };
      const choice = data.choice;

      if (choice !== 'A' && choice !== 'B') return;

      // Nur wenn noch nicht abgestimmt
      if (this.votes.get(action.playerId) !== null) return;

      this.votes.set(action.playerId, choice);

      // Update senden
      this.emit('vote_received', {
        playerId: action.playerId,
        totalVotes: this.countVotes(),
        totalPlayers: this.playerIds.length,
      });

      // Prüfen ob alle abgestimmt haben
      if (this.allVotesIn()) {
        this.clearAllTimers();
        this.finishVoting();
      }
    }
  }

  getState(): EntwederOderGameState {
    return {
      type: 'entweder_oder',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      currentQuestion: this.currentQuestion,
      votes: Object.fromEntries(this.votes),
      votingComplete: this.votingComplete,
      results: this.results,
    };
  }

  private allVotesIn(): boolean {
    for (const vote of this.votes.values()) {
      if (vote === null) return false;
    }
    return true;
  }

  private countVotes(): number {
    let count = 0;
    for (const vote of this.votes.values()) {
      if (vote !== null) count++;
    }
    return count;
  }

  private finishVoting(): void {
    this.phase = 'reveal';
    this.votingComplete = true;

    // Ergebnisse berechnen
    let a = 0;
    let b = 0;
    for (const vote of this.votes.values()) {
      if (vote === 'A') a++;
      else if (vote === 'B') b++;
    }
    const total = a + b;
    const percentA = total > 0 ? Math.round((a / total) * 100) : 0;
    const percentB = total > 0 ? Math.round((b / total) * 100) : 0;

    this.results = { a, b, total, percentA, percentB };

    // Punkte vergeben: Mehrheit bekommt 100, Minderheit 0, Gleichstand 50
    for (const [playerId, vote] of this.votes) {
      if (vote === null) continue;

      if (a === b) {
        // Gleichstand: alle bekommen 50
        this.addScore(playerId, 50);
      } else if ((vote === 'A' && a > b) || (vote === 'B' && b > a)) {
        // Mehrheit: 100 Punkte
        this.addScore(playerId, 100);
      }
      // Minderheit: 0 Punkte
    }

    this.emit('round_results', {
      results: this.results,
      scores: this.getScoresObject(),
    });

    this.emitGameState();

    // 3 Sekunden Reveal-Phase, dann nächste Runde
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }
}
