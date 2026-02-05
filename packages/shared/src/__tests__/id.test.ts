/**
 * Tests für ID-Generierung
 */

import { describe, it, expect } from 'vitest';
import { generateId, generatePlayerId, generateRoomId } from '../utils/id.js';

describe('ID-Generierung', () => {
  describe('generateId', () => {
    it('sollte einen String zurückgeben', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('sollte einen Bindestrich enthalten', () => {
      const id = generateId();
      expect(id).toContain('-');
    });

    it('sollte eindeutige IDs generieren', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('sollte IDs mit korrektem Format generieren', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });

  describe('generatePlayerId', () => {
    it('sollte mit "p_" beginnen', () => {
      const id = generatePlayerId();
      expect(id.startsWith('p_')).toBe(true);
    });

    it('sollte eindeutige IDs generieren', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePlayerId());
      }
      expect(ids.size).toBe(100);
    });

    it('sollte eine vernünftige Länge haben', () => {
      const id = generatePlayerId();
      expect(id.length).toBeGreaterThan(5);
      expect(id.length).toBeLessThan(20);
    });
  });

  describe('generateRoomId', () => {
    it('sollte mit "r_" beginnen', () => {
      const id = generateRoomId();
      expect(id.startsWith('r_')).toBe(true);
    });

    it('sollte eindeutige IDs generieren', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId());
      }
      expect(ids.size).toBe(100);
    });

    it('sollte Unterstriche als Trennzeichen haben', () => {
      const id = generateRoomId();
      const underscoreCount = (id.match(/_/g) || []).length;
      expect(underscoreCount).toBe(2);
    });
  });
});
