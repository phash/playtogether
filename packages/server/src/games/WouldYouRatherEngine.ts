/**
 * Würdest du eher? - Spiellogik
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  WouldYouRatherGameState,
  WouldYouRatherQuestion,
  GameType,
} from '@playtogether/shared';
import {
  WOULD_YOU_RATHER_QUESTIONS,
  getRandomQuestions,
} from '@playtogether/shared';

export class WouldYouRatherEngine extends BaseGameEngine {
  private questions: WouldYouRatherQuestion[] = [];
  private currentQuestion?: WouldYouRatherQuestion;
  private votes: Map<string, 'A' | 'B' | null> = new Map();
  private votingComplete: boolean = false;
  private results?: { a: number; b: number };

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.questions = getRandomQuestions(
      WOULD_YOU_RATHER_QUESTIONS,
      config.settings.roundCount
    );
  }

  getGameType(): GameType {
    return 'wouldyourather';
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
    this.emit('game_state', { state: this.getState() });

    // Timer für automatische Beendigung
    this.startTimer(() => {
      this.finishVoting();
    }, this.settings.timePerRound * 1000);
  }

  handleAction(action: GameAction): void {
    if (action.action === 'vote' && this.phase === 'active') {
      const vote = (action.data as { choice: 'A' | 'B' }).choice;
      if (vote === 'A' || vote === 'B') {
        this.votes.set(action.playerId, vote);

        // Prüfen ob alle abgestimmt haben
        if (this.allVotesIn()) {
          this.finishVoting();
        } else {
          // Update senden
          this.emit('vote_received', {
            playerId: action.playerId,
            totalVotes: this.countVotes(),
            totalPlayers: this.playerIds.length,
          });
        }
      }
    }
  }

  getState(): WouldYouRatherGameState {
    return {
      type: 'wouldyourather',
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
    this.votingComplete = true;
    this.phase = 'reveal';

    // Ergebnisse berechnen
    let a = 0;
    let b = 0;
    for (const vote of this.votes.values()) {
      if (vote === 'A') a++;
      else if (vote === 'B') b++;
    }
    this.results = { a, b };

    // Punkte vergeben (basierend auf Mehrheit)
    const majority = a > b ? 'A' : b > a ? 'B' : null;
    if (majority) {
      for (const [playerId, vote] of this.votes) {
        if (vote === majority) {
          this.addScore(playerId, 100);
        }
      }
    } else {
      // Unentschieden - alle bekommen Punkte
      for (const playerId of this.votes.keys()) {
        if (this.votes.get(playerId) !== null) {
          this.addScore(playerId, 50);
        }
      }
    }

    this.emit('game_state', { state: this.getState() });

    // Nach kurzer Pause zur nächsten Runde
    this.startTimer(() => {
      this.nextRound();
    }, 5000);
  }
}
