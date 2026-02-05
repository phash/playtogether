/**
 * PlaylistManager - Verwaltet mehrere Spiele hintereinander
 */

import type { PlaylistItem, GameType } from '@playtogether/shared';
import { getGameInfo } from '@playtogether/shared';
import { GameManager } from './GameManager.js';
import type { GameEventCallback } from './BaseGameEngine.js';

export interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  cumulativeScores: Record<string, number>;
  playerNames: Record<string, string>;
  isComplete: boolean;
}

export class PlaylistManager {
  private items: PlaylistItem[];
  private currentIndex: number = 0;
  private cumulativeScores: Record<string, number> = {};
  private playerNames: Record<string, string> = {};
  private roomId: string;
  private playerIds: string[];
  private gameManager: GameManager;
  private onEvent: GameEventCallback;
  private intermissionTimer: NodeJS.Timeout | null = null;

  constructor(
    roomId: string,
    playerIds: string[],
    playerNames: Record<string, string>,
    playlist: PlaylistItem[],
    gameManager: GameManager,
    onEvent: GameEventCallback
  ) {
    this.roomId = roomId;
    this.playerIds = playerIds;
    this.playerNames = playerNames;
    this.items = [...playlist];
    this.gameManager = gameManager;
    this.onEvent = onEvent;

    // Initialize cumulative scores
    for (const id of playerIds) {
      this.cumulativeScores[id] = 0;
    }
  }

  get currentPlaylistIndex(): number {
    return this.currentIndex;
  }

  get totalItems(): number {
    return this.items.length;
  }

  get isComplete(): boolean {
    return this.currentIndex >= this.items.length;
  }

  getCurrentItem(): PlaylistItem | undefined {
    return this.items[this.currentIndex];
  }

  getNextItem(): PlaylistItem | undefined {
    return this.items[this.currentIndex + 1];
  }

  /**
   * Fügt Game-Scores zu kumulativen Scores hinzu
   */
  addGameScores(scores: Record<string, number>): void {
    for (const [playerId, score] of Object.entries(scores)) {
      this.cumulativeScores[playerId] = (this.cumulativeScores[playerId] || 0) + score;
    }
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
   * Advance to next game in playlist
   * Returns true if there is a next game, false if playlist is done
   */
  advance(): boolean {
    this.currentIndex++;
    return this.currentIndex < this.items.length;
  }

  /**
   * Startet Intermission-Phase
   */
  startIntermission(countdownSeconds: number = 10): void {
    const rankings = this.getRankings();
    const nextItem = this.getCurrentItem(); // Already advanced

    let nextGameInfo: { type: GameType; name: string; icon: string } | undefined;
    if (nextItem) {
      const info = getGameInfo(nextItem.gameType);
      if (info) {
        nextGameInfo = {
          type: nextItem.gameType,
          name: info.name,
          icon: info.icon,
        };
      }
    }

    this.onEvent('intermission', {
      rankings,
      nextGame: nextGameInfo,
      currentPlaylistIndex: this.currentIndex,
      totalPlaylistItems: this.items.length,
      countdownSeconds,
    });
  }

  /**
   * Sendet playlist_ended Event
   */
  endPlaylist(): void {
    const rankings = this.getRankings();
    this.onEvent('playlist_ended', {
      finalRankings: rankings,
    });
  }

  /**
   * Playlist CRUD: add game
   */
  addGame(item: PlaylistItem): void {
    this.items.push(item);
  }

  /**
   * Playlist CRUD: remove game at index
   */
  removeGame(index: number): void {
    if (index >= 0 && index < this.items.length && index >= this.currentIndex) {
      this.items.splice(index, 1);
    }
  }

  /**
   * Playlist CRUD: reorder
   */
  reorderGames(newOrder: PlaylistItem[]): void {
    this.items = newOrder;
  }

  getCumulativeScores(): Record<string, number> {
    return { ...this.cumulativeScores };
  }

  destroy(): void {
    if (this.intermissionTimer) {
      clearTimeout(this.intermissionTimer);
      this.intermissionTimer = null;
    }
  }
}
