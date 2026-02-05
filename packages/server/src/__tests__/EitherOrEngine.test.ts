/**
 * Tests für EitherOrEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EitherOrEngine } from '../games/EitherOrEngine.js';
import type { GameEngineConfig, GameEventCallback } from '../games/BaseGameEngine.js';

describe('EitherOrEngine', () => {
  let engine: EitherOrEngine;
  let events: Array<{ event: string; data: unknown }>;
  let onEvent: GameEventCallback;

  const createConfig = (overrides?: Partial<GameEngineConfig>): GameEngineConfig => ({
    roomId: 'test-room',
    playerIds: ['player1', 'player2', 'player3'],
    settings: {
      roundCount: 5,
      timePerRound: 30,
    },
    ...overrides,
  });

  beforeEach(() => {
    events = [];
    onEvent = (event: string, data: unknown) => {
      events.push({ event, data });
    };
    vi.useFakeTimers();
  });

  describe('Initialisierung', () => {
    it('sollte korrekt initialisiert werden', () => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      expect(engine.getGameType()).toBe('eitheror');
    });

    it('sollte initialen State haben', () => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      const state = engine.getState();
      expect(state.type).toBe('eitheror');
      expect(state.currentRound).toBe(0);
      expect(state.phase).toBe('preparation');
    });
  });

  describe('Spielstart', () => {
    it('sollte Spiel starten können', () => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();

      const state = engine.getState();
      expect(state.currentRound).toBe(1);
      expect(state.phase).toBe('active');
      expect(state.currentQuestion).toBeDefined();
    });

    it('sollte game_state Event senden bei Start', () => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();

      const gameStateEvent = events.find((e) => e.event === 'game_state');
      expect(gameStateEvent).toBeDefined();
    });
  });

  describe('Abstimmung', () => {
    beforeEach(() => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();
      events = []; // Reset events
    });

    it('sollte Votes annehmen', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'A' },
      });

      const voteEvent = events.find((e) => e.event === 'vote_received');
      expect(voteEvent).toBeDefined();
      expect((voteEvent?.data as any).playerId).toBe('player1');
      expect((voteEvent?.data as any).choice).toBe('A');
    });

    it('sollte doppelte Votes ignorieren', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'A' },
      });
      events = [];

      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'B' },
      });

      const voteEvent = events.find((e) => e.event === 'vote_received');
      expect(voteEvent).toBeUndefined();
    });

    it('sollte Punkte für schnelle Antworten vergeben', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'A' },
      });

      const state = engine.getState();
      expect(state.scores['player1']).toBeGreaterThan(0);
    });
  });

  describe('Rundenende', () => {
    beforeEach(() => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();
      events = [];
    });

    it('sollte Runde beenden wenn alle abgestimmt haben', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'A' },
      });
      engine.handleAction({
        playerId: 'player2',
        action: 'vote',
        data: { choice: 'B' },
      });
      engine.handleAction({
        playerId: 'player3',
        action: 'vote',
        data: { choice: 'A' },
      });

      const roundResults = events.find((e) => e.event === 'round_results');
      expect(roundResults).toBeDefined();
      expect((roundResults?.data as any).results.a).toBe(2);
      expect((roundResults?.data as any).results.b).toBe(1);
    });

    it('sollte Runde nach Timeout beenden', () => {
      // Ein Spieler stimmt ab
      engine.handleAction({
        playerId: 'player1',
        action: 'vote',
        data: { choice: 'A' },
      });

      // Timer vorlaufen lassen (10 Sekunden normal)
      vi.advanceTimersByTime(10000);

      const roundResults = events.find((e) => e.event === 'round_results');
      expect(roundResults).toBeDefined();
    });
  });

  describe('Streak System', () => {
    beforeEach(() => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();
    });

    it('sollte Streak erhöhen wenn alle abstimmen', () => {
      // Erste Runde - alle stimmen ab
      engine.handleAction({ playerId: 'player1', action: 'vote', data: { choice: 'A' } });
      engine.handleAction({ playerId: 'player2', action: 'vote', data: { choice: 'A' } });
      engine.handleAction({ playerId: 'player3', action: 'vote', data: { choice: 'A' } });

      const state = engine.getState();
      expect(state.streak).toBe(1);
    });

    it('sollte Streak zurücksetzen wenn nicht alle abstimmen', () => {
      // Nur ein Spieler stimmt ab
      engine.handleAction({ playerId: 'player1', action: 'vote', data: { choice: 'A' } });

      // Timer vorlaufen lassen
      vi.advanceTimersByTime(10000);

      const state = engine.getState();
      expect(state.streak).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('sollte Timer aufräumen bei destroy', () => {
      engine = new EitherOrEngine(createConfig(), onEvent);
      engine.start();
      engine.destroy();

      // Sollte keine Fehler werfen
      vi.advanceTimersByTime(60000);
    });
  });
});
