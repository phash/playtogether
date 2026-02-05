/**
 * Entweder/Oder - Schnelles Entscheidungsspiel
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  EitherOrGameState,
  EitherOrQuestion,
  GameType,
} from '@playtogether/shared';
import {
  EITHER_OR_QUESTIONS,
  getRandomQuestions,
} from '@playtogether/shared';

export class EitherOrEngine extends BaseGameEngine {
  private questions: EitherOrQuestion[] = [];
  private currentQuestion?: EitherOrQuestion;
  private votes: Map<string, 'A' | 'B' | null> = new Map();
  private streak: number = 0;
  private speedRound: boolean = false;
  private roundTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    // Mehr Fragen für Entweder/Oder (schnelleres Spiel)
    this.questions = getRandomQuestions(
      EITHER_OR_QUESTIONS,
      Math.min(config.settings.roundCount * 2, EITHER_OR_QUESTIONS.length)
    );
  }

  getGameType(): GameType {
    return 'eitheror';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.streak = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentQuestion = this.questions[this.currentRound - 1];
    this.votes.clear();

    // Votes initialisieren
    for (const playerId of this.playerIds) {
      this.votes.set(playerId, null);
    }

    // Speed Round nach 5 aufeinanderfolgenden Runden
    this.speedRound = this.streak >= 5;
    const timeLimit = this.speedRound ? 5 : 10; // 5s für Speed, 10s normal

    this.phase = 'active';
    this.emit('game_state', { state: this.getState() });

    // Timer für automatische Beendigung
    this.roundTimer = this.startTimer(() => {
      this.finishRound();
    }, timeLimit * 1000);
  }

  handleAction(action: GameAction): void {
    if (action.action === 'vote' && this.phase === 'active') {
      const vote = (action.data as { choice: 'A' | 'B' }).choice;
      if (vote === 'A' || vote === 'B') {
        // Nur wenn noch nicht gestimmt
        if (this.votes.get(action.playerId) === null) {
          this.votes.set(action.playerId, vote);

          // Schnelle Antwort = Bonus Punkte
          const answeredCount = this.countVotes();
          const bonus = Math.max(0, this.playerIds.length - answeredCount) * 10;
          this.addScore(action.playerId, 10 + bonus);

          // Update senden
          this.emit('vote_received', {
            playerId: action.playerId,
            choice: vote,
            totalVotes: answeredCount,
            totalPlayers: this.playerIds.length,
          });

          // Prüfen ob alle abgestimmt haben
          if (this.allVotesIn()) {
            if (this.roundTimer) {
              clearTimeout(this.roundTimer);
            }
            this.finishRound();
          }
        }
      }
    }
  }

  getState(): EitherOrGameState {
    return {
      type: 'eitheror',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount * 2, // Mehr Runden
      phase: this.phase,
      timeRemaining: this.speedRound ? 5 : 10,
      scores: this.getScoresObject(),
      currentQuestion: this.currentQuestion,
      votes: Object.fromEntries(this.votes),
      streak: this.streak,
      speedRound: this.speedRound,
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

  private finishRound(): void {
    this.phase = 'reveal';

    // Ergebnisse berechnen
    let a = 0;
    let b = 0;
    for (const vote of this.votes.values()) {
      if (vote === 'A') a++;
      else if (vote === 'B') b++;
    }

    // Streak erhöhen wenn alle geantwortet haben
    if (this.allVotesIn()) {
      this.streak++;
    } else {
      this.streak = 0;
    }

    this.emit('round_results', {
      results: { a, b },
      streak: this.streak,
      speedRound: this.speedRound,
    });

    // Schneller zur nächsten Runde
    this.startTimer(() => {
      // Prüfen ob Spiel zu Ende
      if (this.currentRound >= this.questions.length) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, 2000);
  }

  protected nextRound(): void {
    this.currentRound++;

    // Bei Entweder/Oder mehr Runden
    if (this.currentRound > this.questions.length) {
      this.endGame();
    } else {
      this.startRound();
    }
  }
}
