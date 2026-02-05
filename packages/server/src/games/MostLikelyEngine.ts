/**
 * Wer würde am ehesten? - Spiellogik
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  MostLikelyGameState,
  MostLikelyQuestion,
  GameType,
} from '@playtogether/shared';
import {
  MOST_LIKELY_QUESTIONS,
  getRandomQuestions,
} from '@playtogether/shared';

export class MostLikelyEngine extends BaseGameEngine {
  private questions: MostLikelyQuestion[] = [];
  private currentQuestion?: MostLikelyQuestion;
  private votes: Map<string, string | null> = new Map(); // voterId -> votedForPlayerId
  private votingComplete: boolean = false;
  private results?: Record<string, number>; // playerId -> vote count

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.questions = getRandomQuestions(
      MOST_LIKELY_QUESTIONS,
      config.settings.roundCount
    );
  }

  getGameType(): GameType {
    return 'mostlikely';
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
      const votedFor = (action.data as { playerId: string }).playerId;

      // Prüfen ob gültiger Spieler
      if (this.playerIds.includes(votedFor)) {
        this.votes.set(action.playerId, votedFor);

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

  getState(): MostLikelyGameState {
    return {
      type: 'mostlikely',
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

    // Stimmen zählen
    const voteCounts: Record<string, number> = {};
    for (const playerId of this.playerIds) {
      voteCounts[playerId] = 0;
    }

    for (const votedFor of this.votes.values()) {
      if (votedFor) {
        voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
      }
    }
    this.results = voteCounts;

    // Gewinner ermitteln (meiste Stimmen)
    let maxVotes = 0;
    let winner: string | null = null;
    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = playerId;
      }
    }

    // Punkte vergeben
    // Spieler der am meisten gewählt wurde bekommt Punkte pro Stimme
    if (winner && maxVotes > 0) {
      this.addScore(winner, maxVotes * 50);
    }

    // Spieler die den "Gewinner" gewählt haben, bekommen auch Punkte
    for (const [voterId, votedFor] of this.votes) {
      if (votedFor === winner) {
        this.addScore(voterId, 25);
      }
    }

    this.emit('game_state', { state: this.getState() });

    // Nach kurzer Pause zur nächsten Runde
    this.startTimer(() => {
      this.nextRound();
    }, 5000);
  }
}
