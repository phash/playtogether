/**
 * VoteManager - Verwaltet Voting zwischen Spielen und kumulative Scores
 */

import type { GameType } from '@playtogether/shared';
import { AVAILABLE_GAMES, getGameInfo } from '@playtogether/shared';

export type VoteEventCallback = (event: string, data: unknown) => void;

export class VoteManager {
  private cumulativeScores: Record<string, number> = {};
  private playerNames: Record<string, string> = {};
  private roomId: string;
  private gamesPlayed: number = 0;
  private lastPlayedGame: GameType | null = null;
  private votes: Map<string, GameType> = new Map();
  private candidates: Array<{ type: GameType; name: string; icon: string; description: string }> = [];
  private voteTimer: NodeJS.Timeout | null = null;
  private onEvent: VoteEventCallback;

  constructor(
    roomId: string,
    playerIds: string[],
    playerNames: Record<string, string>,
    onEvent: VoteEventCallback
  ) {
    this.roomId = roomId;
    this.playerNames = { ...playerNames };
    this.onEvent = onEvent;

    for (const id of playerIds) {
      this.cumulativeScores[id] = 0;
    }
  }

  /**
   * Fügt Game-Scores zu kumulativen Scores hinzu
   */
  addGameScores(scores: Record<string, number>): void {
    for (const [playerId, score] of Object.entries(scores)) {
      this.cumulativeScores[playerId] = (this.cumulativeScores[playerId] || 0) + score;
    }
    this.gamesPlayed++;
  }

  /**
   * Gibt Rankings zurück (sortiert nach Score)
   */
  getRankings(): Array<{ playerId: string; playerName: string; score: number; rank: number }> {
    const sorted = Object.entries(this.cumulativeScores)
      .sort(([, a], [, b]) => b - a);

    return sorted.map(([playerId, score], index) => ({
      playerId,
      playerName: this.playerNames[playerId] || 'Spieler',
      score,
      rank: index + 1,
    }));
  }

  /**
   * Sendet game_results an alle Spieler
   */
  emitGameResults(finalScores: Record<string, number>, winner: string): void {
    const rankings = this.getRankings();
    const winnerName = this.playerNames[winner] || 'Spieler';

    this.onEvent('game_results', {
      finalScores,
      winner,
      winnerName,
      rankings,
      gamesPlayed: this.gamesPlayed,
    });
  }

  /**
   * Startet die Voting-Phase
   */
  startVoting(countdownSeconds: number = 30): void {
    const playerCount = Object.keys(this.cumulativeScores).length;
    this.votes.clear();

    // Filter candidates by player count and exclude last played game
    let candidates = AVAILABLE_GAMES.filter((game) => {
      if (game.type === this.lastPlayedGame) return false;
      if (playerCount < game.minPlayers) return false;
      if (playerCount > game.maxPlayers) return false;
      return true;
    });

    // If no candidates (e.g. only 1 game fits), allow last played
    if (candidates.length === 0) {
      candidates = AVAILABLE_GAMES.filter((game) => {
        if (playerCount < game.minPlayers) return false;
        if (playerCount > game.maxPlayers) return false;
        return true;
      });
    }

    this.candidates = candidates.map((g) => ({
      type: g.type,
      name: g.name,
      icon: g.icon,
      description: g.description,
    }));

    this.onEvent('vote_start', {
      candidates: this.candidates,
      countdownSeconds,
    });

    // Start countdown timer
    this.voteTimer = setTimeout(() => {
      this.resolveVote();
    }, countdownSeconds * 1000);
  }

  /**
   * Spieler gibt Stimme ab
   */
  castVote(playerId: string, gameType: GameType): void {
    // Validate game is a candidate
    if (!this.candidates.some((c) => c.type === gameType)) return;

    this.votes.set(playerId, gameType);
    this.emitVoteUpdate();

    // Check if all players voted
    const totalVoters = Object.keys(this.cumulativeScores).length;
    if (this.votes.size >= totalVoters) {
      // All voted - resolve immediately
      if (this.voteTimer) {
        clearTimeout(this.voteTimer);
        this.voteTimer = null;
      }
      this.resolveVote();
    }
  }

  /**
   * Sendet aktuellen Vote-Stand
   */
  private emitVoteUpdate(): void {
    const voteCounts: Record<string, number> = {};
    for (const gameType of this.votes.values()) {
      voteCounts[gameType] = (voteCounts[gameType] || 0) + 1;
    }

    this.onEvent('vote_update', {
      votes: voteCounts,
      totalVoters: Object.keys(this.cumulativeScores).length,
      votedCount: this.votes.size,
    });
  }

  /**
   * Wertet Voting aus und sendet Ergebnis
   */
  resolveVote(): void {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }

    const voteCounts: Record<string, number> = {};
    for (const gameType of this.votes.values()) {
      voteCounts[gameType] = (voteCounts[gameType] || 0) + 1;
    }

    let chosenType: GameType;
    let wasTiebreak = false;

    if (Object.keys(voteCounts).length === 0) {
      // No votes: pick random from candidates
      const randomIndex = Math.floor(Math.random() * this.candidates.length);
      chosenType = this.candidates[randomIndex].type;
      wasTiebreak = true;
    } else {
      // Find max votes
      const maxVotes = Math.max(...Object.values(voteCounts));
      const winners = Object.entries(voteCounts)
        .filter(([, count]) => count === maxVotes)
        .map(([type]) => type as GameType);

      if (winners.length === 1) {
        chosenType = winners[0];
      } else {
        // Tiebreak: random among tied
        const randomIndex = Math.floor(Math.random() * winners.length);
        chosenType = winners[randomIndex];
        wasTiebreak = true;
      }
    }

    const gameInfo = getGameInfo(chosenType);
    this.lastPlayedGame = chosenType;

    this.onEvent('vote_result', {
      chosenGame: {
        type: chosenType,
        name: gameInfo?.name || chosenType,
        icon: gameInfo?.icon || '🎮',
      },
      voteTally: voteCounts,
      wasTiebreak,
    });
  }

  /**
   * Gibt das zuletzt gewählte Spiel zurück
   */
  getLastPlayedGame(): GameType | null {
    return this.lastPlayedGame;
  }

  setLastPlayedGame(gameType: GameType): void {
    this.lastPlayedGame = gameType;
  }

  getGamesPlayed(): number {
    return this.gamesPlayed;
  }

  getCumulativeScores(): Record<string, number> {
    return { ...this.cumulativeScores };
  }

  getCandidates(): Array<{ type: GameType; name: string; icon: string; description: string }> {
    return this.candidates;
  }

  getVoteUpdate(): { votes: Record<string, number>; totalVoters: number; votedCount: number } {
    const voteCounts: Record<string, number> = {};
    for (const gameType of this.votes.values()) {
      voteCounts[gameType] = (voteCounts[gameType] || 0) + 1;
    }
    return {
      votes: voteCounts,
      totalVoters: Object.keys(this.cumulativeScores).length,
      votedCount: this.votes.size,
    };
  }

  /**
   * Spieler entfernen (bei Disconnect)
   */
  removePlayer(playerId: string): void {
    this.votes.delete(playerId);
    delete this.cumulativeScores[playerId];
    delete this.playerNames[playerId];
  }

  /**
   * Spieler hinzufügen (bei spätem Join)
   */
  addPlayer(playerId: string, name: string): void {
    if (!(playerId in this.cumulativeScores)) {
      this.cumulativeScores[playerId] = 0;
    }
    this.playerNames[playerId] = name;
  }

  destroy(): void {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }
  }
}
