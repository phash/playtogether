/**
 * Schere Stein Papier - Spiellogik
 *
 * Features:
 * - Turnier-Paarungen
 * - Best-of-1 oder Best-of-3 (basierend auf settings.roundCount)
 * - 5 Sekunden pro Wahl, Timeout = zufaellige Wahl
 * - Ungerade Spieleranzahl: ein Spieler bekommt Bye
 * - 100 Punkte fuer Match-Sieg, 25 Punkte fuer Bye
 * - Unentschieden: Runde wird wiederholt
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  RockPaperScissorsGameState,
  RPSMatch,
  RPSChoice,
  GameType,
} from '@playtogether/shared';
import { shuffleArray } from '@playtogether/shared';

const CHOICES: RPSChoice[] = ['rock', 'paper', 'scissors'];

function getWinner(
  choice1: RPSChoice,
  choice2: RPSChoice
): 'player1' | 'player2' | 'draw' {
  if (choice1 === choice2) return 'draw';
  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'scissors' && choice2 === 'paper') ||
    (choice1 === 'paper' && choice2 === 'rock')
  ) {
    return 'player1';
  }
  return 'player2';
}

export class RockPaperScissorsEngine extends BaseGameEngine {
  private matches: RPSMatch[] = [];
  private currentMatchIndex: number = 0;
  private bracket: string[][] = [];
  private tournamentRound: number = 1;
  private eliminated: string[] = [];
  private bestOf: 1 | 3 = 1;
  private byePlayer?: string;
  private choiceTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.bestOf = config.settings.roundCount >= 3 ? 3 : 1;
  }

  getGameType(): GameType {
    return 'rock_paper_scissors';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 1;
    this.tournamentRound = 1;

    this.generateBracket(this.playerIds);
    this.startTournamentRound();
  }

  protected startRound(): void {
    this.startTournamentRound();
  }

  handleAction(action: GameAction): void {
    const { playerId, action: actionType, data } = action;

    if (actionType !== 'choose' || this.phase !== 'active') return;

    const match = this.matches[this.currentMatchIndex];
    if (!match || match.finished) return;

    // Nur Spieler im aktuellen Match duerfen waehlen
    if (playerId !== match.player1 && playerId !== match.player2) return;

    // Schon gewaehlt?
    if (match.choices[playerId] !== null) return;

    const { choice } = data as { choice: RPSChoice };
    if (!CHOICES.includes(choice)) return;

    this.makeChoice(match, playerId, choice);
  }

  getState(): RockPaperScissorsGameState {
    // Wahlen verbergen, bis beide gewaehlt haben
    const safeMatches = this.matches.map((match) => {
      const bothChosen =
        match.choices[match.player1] !== null &&
        match.choices[match.player2] !== null;

      if (bothChosen || match.finished) {
        return match;
      }

      // Wahlen verbergen
      return {
        ...match,
        choices: {
          [match.player1]: match.choices[match.player1] !== null ? ('hidden' as unknown as RPSChoice) : null,
          [match.player2]: match.choices[match.player2] !== null ? ('hidden' as unknown as RPSChoice) : null,
        },
      };
    });

    return {
      type: 'rock_paper_scissors',
      currentRound: this.currentRound,
      totalRounds: this.bestOf,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      matches: safeMatches,
      currentMatchIndex: this.currentMatchIndex,
      bracket: this.bracket.length > 0 ? this.bracket : undefined,
      tournamentRound: this.tournamentRound,
      eliminated: this.eliminated,
      bestOf: this.bestOf,
      bye: this.byePlayer,
    };
  }

  // ---- Private Methoden ----

  private generateBracket(players: string[]): void {
    const shuffled = shuffleArray([...players]);
    this.bracket = [];
    this.byePlayer = undefined;

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        this.bracket.push([shuffled[i], shuffled[i + 1]]);
      } else {
        // Bye
        this.bracket.push([shuffled[i]]);
        this.byePlayer = shuffled[i];
      }
    }
  }

  private startTournamentRound(): void {
    this.matches = [];
    this.currentMatchIndex = 0;

    const roundWinners: string[] = [];

    for (const pair of this.bracket) {
      if (pair.length === 1) {
        // Bye
        roundWinners.push(pair[0]);
        this.addScore(pair[0], 25);
        this.emit('bye', { playerId: pair[0] });
        continue;
      }

      // Neues Match erstellen
      const match: RPSMatch = {
        player1: pair[0],
        player2: pair[1],
        choices: {
          [pair[0]]: null,
          [pair[1]]: null,
        },
        round: 1,
        maxRounds: this.bestOf,
        scores: {
          [pair[0]]: 0,
          [pair[1]]: 0,
        },
        finished: false,
      };
      this.matches.push(match);
    }

    if (this.matches.length === 0) {
      // Nur Byes - naechste Runde oder Ende
      if (roundWinners.length <= 1) {
        this.endGame();
      } else {
        this.advanceTournament(roundWinners);
      }
      return;
    }

    this.emitGameState();
    this.startChoiceTimer();
  }

  private makeChoice(match: RPSMatch, playerId: string, choice: RPSChoice): void {
    match.choices[playerId] = choice;

    this.emit('choice_made', {
      playerId,
      matchIndex: this.currentMatchIndex,
    });

    // Pruefen ob beide gewaehlt haben
    if (
      match.choices[match.player1] !== null &&
      match.choices[match.player2] !== null
    ) {
      this.clearAllTimers();
      this.resolveRound(match);
    } else {
      this.emitGameState();
    }
  }

  private resolveRound(match: RPSMatch): void {
    const choice1 = match.choices[match.player1]!;
    const choice2 = match.choices[match.player2]!;

    const result = getWinner(choice1, choice2);

    this.emit('round_result', {
      matchIndex: this.currentMatchIndex,
      choices: {
        [match.player1]: choice1,
        [match.player2]: choice2,
      },
      result,
    });

    if (result === 'draw') {
      // Unentschieden: Runde wiederholen
      this.emitGameState();
      this.startTimer(() => {
        // Wahlen zuruecksetzen
        match.choices[match.player1] = null;
        match.choices[match.player2] = null;
        // Runde wird nicht erhoeht bei draw
        this.emitGameState();
        this.startChoiceTimer();
      }, 2000);
      return;
    }

    // Gewinner dieser Runde
    const roundWinner =
      result === 'player1' ? match.player1 : match.player2;
    match.scores[roundWinner]++;

    // Best-of pruefen
    const winsNeeded = Math.ceil(this.bestOf / 2);

    if (match.scores[roundWinner] >= winsNeeded) {
      // Match gewonnen
      match.winner = roundWinner;
      match.finished = true;

      this.addScore(roundWinner, 100);

      this.emit('match_won', {
        winner: roundWinner,
        matchIndex: this.currentMatchIndex,
        matchScores: match.scores,
      });

      this.emitGameState();

      this.startTimer(() => {
        this.advanceToNextMatch();
      }, 2500);
    } else {
      // Naechste Runde im Match
      match.round++;
      this.emitGameState();

      this.startTimer(() => {
        match.choices[match.player1] = null;
        match.choices[match.player2] = null;
        this.emitGameState();
        this.startChoiceTimer();
      }, 2000);
    }
  }

  private advanceToNextMatch(): void {
    // Verlierer eliminieren
    const match = this.matches[this.currentMatchIndex];
    if (match.winner) {
      const loser =
        match.winner === match.player1 ? match.player2 : match.player1;
      if (!this.eliminated.includes(loser)) {
        this.eliminated.push(loser);
      }
    }

    this.currentMatchIndex++;

    if (this.currentMatchIndex < this.matches.length) {
      // Naechstes Match
      this.emitGameState();
      this.startChoiceTimer();
    } else {
      // Turnierrunde abgeschlossen
      const winners = this.getRoundWinners();

      if (winners.length <= 1) {
        this.endGame();
      } else {
        this.advanceTournament(winners);
      }
    }
  }

  private advanceTournament(winners: string[]): void {
    this.tournamentRound++;

    this.generateBracket(winners);

    this.emit('tournament_round', {
      round: this.tournamentRound,
      bracket: this.bracket,
    });

    this.startTournamentRound();
  }

  private getRoundWinners(): string[] {
    const winners: string[] = [];

    // Byes
    for (const pair of this.bracket) {
      if (pair.length === 1) {
        winners.push(pair[0]);
      }
    }

    // Match-Gewinner
    for (const match of this.matches) {
      if (match.finished && match.winner) {
        winners.push(match.winner);
      }
    }

    return winners;
  }

  private startChoiceTimer(): void {
    this.clearAllTimers();

    const match = this.matches[this.currentMatchIndex];
    if (!match || match.finished) return;

    this.startCountdownTimer(this.settings.timePerRound, () => {
      const currentMatch = this.matches[this.currentMatchIndex];
      if (!currentMatch || currentMatch.finished) return;

      // Fehlende Wahlen mit Zufall ersetzen
      if (currentMatch.choices[currentMatch.player1] === null) {
        const randomChoice =
          CHOICES[Math.floor(Math.random() * CHOICES.length)];
        currentMatch.choices[currentMatch.player1] = randomChoice;
        this.emit('timeout_choice', {
          playerId: currentMatch.player1,
        });
      }

      if (currentMatch.choices[currentMatch.player2] === null) {
        const randomChoice =
          CHOICES[Math.floor(Math.random() * CHOICES.length)];
        currentMatch.choices[currentMatch.player2] = randomChoice;
        this.emit('timeout_choice', {
          playerId: currentMatch.player2,
        });
      }

      this.resolveRound(currentMatch);
    });
  }
}
