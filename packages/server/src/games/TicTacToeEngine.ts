/**
 * Tic Tac Toe - Spiellogik
 *
 * Features:
 * - 2 Spieler: direktes 1v1
 * - 3+ Spieler: Turniermodus mit Bracket
 * - 10 Sekunden pro Zug, Timeout = zufaelliger gueltiger Zug
 * - Best-of-N Matches pro Paarung (settings.roundCount)
 * - 100 Punkte fuer Sieg, 25 fuer Unentschieden
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  TicTacToeGameState,
  TicTacToeMatch,
  GameType,
} from '@playtogether/shared';
import { shuffleArray } from '@playtogether/shared';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Zeilen
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Spalten
  [0, 4, 8], [2, 4, 6],             // Diagonalen
];

export class TicTacToeEngine extends BaseGameEngine {
  private mode: '1v1' | 'tournament' = '1v1';
  private matches: TicTacToeMatch[] = [];
  private currentMatchIndex: number = 0;
  private bracket: string[][] = [];
  private tournamentRound: number = 1;
  private eliminated: string[] = [];
  private bestOf: number = 3;
  private matchWins: Map<string, number> = new Map(); // track wins within a best-of series
  private moveTimer?: NodeJS.Timeout;

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);
    this.bestOf = config.settings.roundCount;
    this.mode = config.playerIds.length === 2 ? '1v1' : 'tournament';
  }

  getGameType(): GameType {
    return 'tic_tac_toe';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 1;
    this.tournamentRound = 1;

    if (this.mode === '1v1') {
      this.bracket = [[this.playerIds[0], this.playerIds[1]]];
    } else {
      this.generateBracket();
    }

    this.startTournamentRound();
  }

  protected startRound(): void {
    // Wird nicht direkt verwendet - Turnier nutzt eigene Logik
    this.startTournamentRound();
  }

  handleAction(action: GameAction): void {
    const { playerId, action: actionType, data } = action;

    if (actionType !== 'place' || this.phase !== 'active') return;

    const match = this.matches[this.currentMatchIndex];
    if (!match || match.finished) return;

    // Nur der aktuelle Spieler darf ziehen
    if (playerId !== match.currentTurn) return;

    const { position } = data as { position: number };
    this.placeMove(match, playerId, position);
  }

  getState(): TicTacToeGameState {
    return {
      type: 'tic_tac_toe',
      currentRound: this.currentRound,
      totalRounds: this.bestOf,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      mode: this.mode,
      matches: this.matches,
      currentMatchIndex: this.currentMatchIndex,
      bracket: this.bracket.length > 0 ? this.bracket : undefined,
      tournamentRound: this.tournamentRound,
      eliminated: this.eliminated,
    };
  }

  // ---- Private Methoden ----

  private generateBracket(): void {
    const players = shuffleArray([...this.playerIds]);
    this.bracket = [];

    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        this.bracket.push([players[i], players[i + 1]]);
      } else {
        // Ungerade Anzahl: letzter Spieler bekommt Bye
        this.bracket.push([players[i]]);
      }
    }
  }

  private startTournamentRound(): void {
    this.matches = [];
    this.currentMatchIndex = 0;

    const winners: string[] = [];

    for (const pair of this.bracket) {
      if (pair.length === 1) {
        // Bye: Spieler kommt automatisch weiter
        winners.push(pair[0]);
        this.addScore(pair[0], 25); // Bye-Punkte
        this.emit('bye', { playerId: pair[0] });
        continue;
      }

      // Neues Match erstellen
      const match: TicTacToeMatch = {
        player1: pair[0],
        player2: pair[1],
        board: Array(9).fill(null),
        currentTurn: pair[0],
        finished: false,
      };
      this.matches.push(match);
    }

    // Wenn keine Matches (nur Byes), naechste Turnierrunde
    if (this.matches.length === 0) {
      if (winners.length <= 1) {
        this.endGame();
      } else {
        this.advanceTournament(winners);
      }
      return;
    }

    // Match-Wins zuruecksetzen fuer diese Runde
    this.matchWins.clear();
    for (const match of this.matches) {
      this.matchWins.set(match.player1, 0);
      this.matchWins.set(match.player2, 0);
    }

    this.emitGameState();
    this.startMoveTimer();
  }

  private placeMove(match: TicTacToeMatch, playerId: string, position: number): void {
    if (position < 0 || position > 8) return;
    if (match.board[position] !== null) return;

    this.clearMoveTimer();

    match.board[position] = playerId;

    // Gewinner pruefen
    const winner = this.checkWinner(match);

    if (winner) {
      match.winner = winner;
      match.finished = true;
      this.addScore(winner, 100);

      this.emit('match_won', {
        winner,
        match: this.currentMatchIndex,
      });

      this.handleMatchEnd(match);
      return;
    }

    // Unentschieden pruefen
    if (this.isBoardFull(match.board)) {
      match.winner = null; // null = draw
      match.finished = true;
      this.addScore(match.player1, 25);
      this.addScore(match.player2, 25);

      this.emit('match_draw', {
        match: this.currentMatchIndex,
      });

      this.handleMatchEnd(match);
      return;
    }

    // Naechster Spieler
    match.currentTurn =
      match.currentTurn === match.player1 ? match.player2 : match.player1;

    this.emitGameState();
    this.startMoveTimer();
  }

  private handleMatchEnd(match: TicTacToeMatch): void {
    this.emitGameState();

    // Bei best-of: pruefen ob Serie entschieden
    if (this.bestOf > 1) {
      if (match.winner) {
        const wins = (this.matchWins.get(match.winner) ?? 0) + 1;
        this.matchWins.set(match.winner, wins);

        const winsNeeded = Math.ceil(this.bestOf / 2);
        if (wins >= winsNeeded) {
          // Serie gewonnen
          this.startTimer(() => {
            this.advanceToNextMatch(match.winner!);
          }, 2000);
          return;
        }
      }

      // Naechstes Match in der Serie
      this.startTimer(() => {
        this.startRematch(match);
      }, 2000);
      return;
    }

    // Best-of-1: Direkt weiter
    this.startTimer(() => {
      this.advanceToNextMatch(match.winner ?? null);
    }, 2000);
  }

  private startRematch(oldMatch: TicTacToeMatch): void {
    const newMatch: TicTacToeMatch = {
      player1: oldMatch.player1,
      player2: oldMatch.player2,
      board: Array(9).fill(null),
      // Verlierer / player2 beginnt naechstes Match
      currentTurn:
        oldMatch.winner === oldMatch.player1
          ? oldMatch.player2
          : oldMatch.player1,
      finished: false,
    };
    this.matches[this.currentMatchIndex] = newMatch;
    this.emitGameState();
    this.startMoveTimer();
  }

  private advanceToNextMatch(winner: string | null): void {
    // Verlierer wird eliminiert
    const match = this.matches[this.currentMatchIndex];
    if (winner) {
      const loser =
        winner === match.player1 ? match.player2 : match.player1;
      if (!this.eliminated.includes(loser)) {
        this.eliminated.push(loser);
      }
    }

    this.currentMatchIndex++;

    if (this.currentMatchIndex < this.matches.length) {
      // Naechstes Match in dieser Runde
      this.matchWins.clear();
      const nextMatch = this.matches[this.currentMatchIndex];
      this.matchWins.set(nextMatch.player1, 0);
      this.matchWins.set(nextMatch.player2, 0);
      this.emitGameState();
      this.startMoveTimer();
    } else {
      // Alle Matches der Turnierrunde abgeschlossen
      const roundWinners = this.getRoundWinners();

      if (roundWinners.length <= 1 || this.mode === '1v1') {
        this.endGame();
      } else {
        this.advanceTournament(roundWinners);
      }
    }
  }

  private advanceTournament(winners: string[]): void {
    this.tournamentRound++;

    // Neues Bracket aus Gewinnern
    this.bracket = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        this.bracket.push([winners[i], winners[i + 1]]);
      } else {
        this.bracket.push([winners[i]]);
      }
    }

    this.emit('tournament_round', {
      round: this.tournamentRound,
      bracket: this.bracket,
    });

    this.startTournamentRound();
  }

  private getRoundWinners(): string[] {
    const winners: string[] = [];

    // Byes bekommen
    for (const pair of this.bracket) {
      if (pair.length === 1) {
        winners.push(pair[0]);
      }
    }

    // Match-Gewinner
    for (const match of this.matches) {
      if (match.finished && match.winner) {
        winners.push(match.winner);
      } else if (match.finished && match.winner === null) {
        // Unentschieden: player1 kommt weiter (oder random)
        winners.push(match.player1);
      }
    }

    return winners;
  }

  private checkWinner(match: TicTacToeMatch): string | null {
    for (const [a, b, c] of WIN_LINES) {
      if (
        match.board[a] !== null &&
        match.board[a] === match.board[b] &&
        match.board[b] === match.board[c]
      ) {
        return match.board[a]!;
      }
    }
    return null;
  }

  private isBoardFull(board: (string | null)[]): boolean {
    return board.every((cell) => cell !== null);
  }

  private getValidMoves(board: (string | null)[]): number[] {
    const moves: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) moves.push(i);
    }
    return moves;
  }

  private startMoveTimer(): void {
    this.clearMoveTimer();
    const match = this.matches[this.currentMatchIndex];
    if (!match || match.finished) return;

    this.startCountdownTimer(this.settings.timePerRound, () => {
      // Timeout: zufaelliger gueltiger Zug
      const currentMatch = this.matches[this.currentMatchIndex];
      if (!currentMatch || currentMatch.finished) return;

      const validMoves = this.getValidMoves(currentMatch.board);
      if (validMoves.length > 0) {
        const randomPos =
          validMoves[Math.floor(Math.random() * validMoves.length)];

        this.emit('timeout_move', {
          playerId: currentMatch.currentTurn,
          position: randomPos,
        });

        this.placeMove(currentMatch, currentMatch.currentTurn, randomPos);
      }
    });
  }

  private clearMoveTimer(): void {
    this.clearAllTimers();
  }
}
