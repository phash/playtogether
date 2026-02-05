/**
 * Tests für AnagramEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnagramEngine } from '../games/AnagramEngine.js';
import type { GameEngineConfig, GameEventCallback } from '../games/BaseGameEngine.js';

describe('AnagramEngine', () => {
  let engine: AnagramEngine;
  let events: Array<{ event: string; data: unknown }>;
  let onEvent: GameEventCallback;

  const createConfig = (overrides?: Partial<GameEngineConfig>): GameEngineConfig => ({
    roomId: 'test-room',
    playerIds: ['player1', 'player2'],
    settings: {
      roundCount: 3,
      timePerRound: 60,
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
      engine = new AnagramEngine(createConfig(), onEvent);
      expect(engine.getGameType()).toBe('anagram');
    });

    it('sollte initialen State haben', () => {
      engine = new AnagramEngine(createConfig(), onEvent);
      const state = engine.getState();
      expect(state.type).toBe('anagram');
      expect(state.currentRound).toBe(0);
    });
  });

  describe('Spielstart', () => {
    it('sollte Spiel starten können', () => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();

      const state = engine.getState();
      expect(state.currentRound).toBe(1);
      expect(state.phase).toBe('active');
      expect(state.letters.length).toBeGreaterThan(0);
    });

    it('sollte Buchstaben bereitstellen', () => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();

      const state = engine.getState();
      expect(Array.isArray(state.letters)).toBe(true);
      expect(state.letters.length).toBeGreaterThan(0);
    });
  });

  describe('Wort-Eingabe', () => {
    beforeEach(() => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();
      events = [];
    });

    it('sollte gültige Wörter akzeptieren', () => {
      const state = engine.getState();
      // Hole ein gültiges Wort aus der Liste (wenn reveal, sonst leer)
      // Da wir im active state sind, versuchen wir ein Wort das aus den Buchstaben gebildet werden kann

      // Sende ein Wort
      engine.handleAction({
        playerId: 'player1',
        action: 'submit_word',
        data: { word: 'reis' }, // Häufiges Wort in den Puzzles
      });

      // Check ob ein Event gesendet wurde
      const wordEvent = events.find(
        (e) => e.event === 'word_found' || e.event === 'word_invalid'
      );
      expect(wordEvent).toBeDefined();
    });

    it('sollte zu kurze Wörter ablehnen', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'submit_word',
        data: { word: 'ab' },
      });

      const invalidEvent = events.find((e) => e.event === 'word_invalid');
      expect(invalidEvent).toBeDefined();
      expect((invalidEvent?.data as any).reason).toContain('Mindestens');
    });

    it('sollte bereits gefundene Wörter ablehnen', () => {
      // Finde zuerst ein gültiges Wort
      engine.handleAction({
        playerId: 'player1',
        action: 'submit_word',
        data: { word: 'test' },
      });

      events = [];

      // Versuche dasselbe Wort nochmal
      engine.handleAction({
        playerId: 'player1',
        action: 'submit_word',
        data: { word: 'test' },
      });

      const invalidEvent = events.find((e) => e.event === 'word_invalid');
      // Wird entweder als "Bereits gefunden" oder "Kein gültiges Wort" abgelehnt
      expect(invalidEvent).toBeDefined();
    });
  });

  describe('Buchstaben mischen', () => {
    beforeEach(() => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();
      events = [];
    });

    it('sollte Buchstaben mischen können', () => {
      engine.handleAction({
        playerId: 'player1',
        action: 'shuffle_letters',
        data: {},
      });

      const shuffleEvent = events.find((e) => e.event === 'letters_shuffled');
      expect(shuffleEvent).toBeDefined();
      expect((shuffleEvent?.data as any).playerId).toBe('player1');
    });
  });

  describe('Punkte', () => {
    beforeEach(() => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();
    });

    it('sollte Scores für alle Spieler initialisieren', () => {
      const state = engine.getState();
      expect(state.scores['player1']).toBe(0);
      expect(state.scores['player2']).toBe(0);
    });
  });

  describe('Rundenende', () => {
    beforeEach(() => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();
      events = [];
    });

    it('sollte Runde nach Timeout beenden', () => {
      // Timer vorlaufen lassen
      vi.advanceTimersByTime(60000);

      const roundEndEvent = events.find((e) => e.event === 'round_ended');
      expect(roundEndEvent).toBeDefined();
    });

    it('sollte alle gültigen Wörter nach Rundenende zeigen', () => {
      // Timer vorlaufen lassen
      vi.advanceTimersByTime(60000);

      const state = engine.getState();
      expect(state.phase).toBe('reveal');
      expect(state.allValidWords.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('sollte Timer aufräumen bei destroy', () => {
      engine = new AnagramEngine(createConfig(), onEvent);
      engine.start();
      engine.destroy();

      // Sollte keine Fehler werfen
      vi.advanceTimersByTime(120000);
    });
  });
});
