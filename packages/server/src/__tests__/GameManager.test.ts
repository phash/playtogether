/**
 * Tests für GameManager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameManager } from '../games/GameManager.js';
import type { Room, GameType } from '@playtogether/shared';

describe('GameManager', () => {
  let gameManager: GameManager;
  let events: Array<{ event: string; data: unknown }>;

  const createMockRoom = (gameType: GameType): Room => ({
    id: 'test-room-id',
    code: 'ABCD',
    hostId: 'player1',
    gameType,
    status: 'playing',
    minPlayers: 2,
    maxPlayers: 8,
    players: new Map([
      ['player1', {
        id: 'player1',
        name: 'Player 1',
        avatarColor: '#ff0000',
        isHost: true,
        score: 0,
      }],
      ['player2', {
        id: 'player2',
        name: 'Player 2',
        avatarColor: '#00ff00',
        isHost: false,
        score: 0,
      }],
    ]),
    settings: {
      roundCount: 5,
      timePerRound: 30,
    },
    createdAt: Date.now(),
  });

  beforeEach(() => {
    gameManager = new GameManager();
    events = [];
    vi.useFakeTimers();
  });

  describe('Spieltyp-Unterstützung', () => {
    it('sollte unterstützte Spieltypen zurückgeben', () => {
      const types = gameManager.getSupportedGameTypes();
      expect(types).toContain('eitheror');
      expect(types).toContain('anagram');
      expect(types).toContain('wordchain');
      expect(types).toContain('wouldyourather');
      expect(types).toContain('mostlikely');
    });

    it('sollte unterstützte Spieltypen erkennen', () => {
      expect(gameManager.isGameTypeSupported('eitheror')).toBe(true);
      expect(gameManager.isGameTypeSupported('anagram')).toBe(true);
    });

    it('sollte nicht unterstützte Spieltypen erkennen', () => {
      expect(gameManager.isGameTypeSupported('quiz')).toBe(false);
      expect(gameManager.isGameTypeSupported('drawing')).toBe(false);
    });
  });

  describe('Spiel erstellen', () => {
    it('sollte Spiel für unterstützten Typ erstellen', () => {
      const room = createMockRoom('eitheror');
      const onEvent = (event: string, data: unknown) => {
        events.push({ event, data });
      };

      const engine = gameManager.createGame(room, onEvent);
      expect(engine).not.toBeNull();
      expect(engine?.getGameType()).toBe('eitheror');
    });

    it('sollte null für nicht unterstützten Typ zurückgeben', () => {
      const room = createMockRoom('quiz');
      const onEvent = vi.fn();

      const engine = gameManager.createGame(room, onEvent);
      expect(engine).toBeNull();
    });
  });

  describe('Spielaktionen', () => {
    it('sollte Spielaktionen weiterleiten', () => {
      const room = createMockRoom('eitheror');
      const onEvent = (event: string, data: unknown) => {
        events.push({ event, data });
      };

      gameManager.createGame(room, onEvent);
      gameManager.startGame(room.id);

      const handled = gameManager.handleAction(
        room.id,
        'player1',
        'vote',
        { choice: 'A' }
      );

      expect(handled).toBe(true);
    });

    it('sollte false für nicht existierende Spiele zurückgeben', () => {
      const handled = gameManager.handleAction(
        'non-existent',
        'player1',
        'vote',
        { choice: 'A' }
      );

      expect(handled).toBe(false);
    });
  });

  describe('Spielzustand', () => {
    it('sollte Spielzustand zurückgeben', () => {
      const room = createMockRoom('eitheror');
      const onEvent = vi.fn();

      gameManager.createGame(room, onEvent);
      gameManager.startGame(room.id);

      const state = gameManager.getGameState(room.id);
      expect(state).not.toBeNull();
      expect(state?.type).toBe('eitheror');
    });

    it('sollte null für nicht existierendes Spiel zurückgeben', () => {
      const state = gameManager.getGameState('non-existent');
      expect(state).toBeNull();
    });
  });

  describe('Spiel beenden', () => {
    it('sollte Spiel beenden können', () => {
      const room = createMockRoom('eitheror');
      const onEvent = vi.fn();

      gameManager.createGame(room, onEvent);
      gameManager.startGame(room.id);

      gameManager.endGame(room.id);

      const state = gameManager.getGameState(room.id);
      expect(state).toBeNull();
    });
  });

  describe('Statistiken', () => {
    it('sollte Statistiken zurückgeben', () => {
      const stats = gameManager.getStats();
      expect(stats.activeGames).toBe(0);
    });

    it('sollte aktive Spiele zählen', () => {
      const room = createMockRoom('eitheror');
      gameManager.createGame(room, vi.fn());

      const stats = gameManager.getStats();
      expect(stats.activeGames).toBe(1);
    });
  });
});
