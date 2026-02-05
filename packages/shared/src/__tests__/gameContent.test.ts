/**
 * Tests für Spielinhalte
 */

import { describe, it, expect } from 'vitest';
import {
  WOULD_YOU_RATHER_QUESTIONS,
  MOST_LIKELY_QUESTIONS,
  EITHER_OR_QUESTIONS,
  WORD_CHAIN_START_WORDS,
  GERMAN_WORD_LIST,
  ANAGRAM_PUZZLES,
  isValidGermanWord,
  isValidWordChainWord,
  canFormWord,
  getRandomAnagramPuzzle,
  shuffleArray,
  getRandomQuestions,
} from '../data/gameContent.js';

describe('Spielinhalte - Fragen', () => {
  describe('WOULD_YOU_RATHER_QUESTIONS', () => {
    it('sollte Fragen enthalten', () => {
      expect(WOULD_YOU_RATHER_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('sollte gültige Struktur haben', () => {
      for (const question of WOULD_YOU_RATHER_QUESTIONS) {
        expect(question.id).toBeDefined();
        expect(question.optionA).toBeDefined();
        expect(question.optionB).toBeDefined();
        expect(question.category).toBeDefined();
      }
    });

    it('sollte eindeutige IDs haben', () => {
      const ids = WOULD_YOU_RATHER_QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('MOST_LIKELY_QUESTIONS', () => {
    it('sollte Fragen enthalten', () => {
      expect(MOST_LIKELY_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('sollte gültige Struktur haben', () => {
      for (const question of MOST_LIKELY_QUESTIONS) {
        expect(question.id).toBeDefined();
        expect(question.question).toBeDefined();
        expect(question.category).toBeDefined();
      }
    });
  });

  describe('EITHER_OR_QUESTIONS', () => {
    it('sollte Fragen enthalten', () => {
      expect(EITHER_OR_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('sollte verschiedene Kategorien haben', () => {
      const categories = new Set(EITHER_OR_QUESTIONS.map((q) => q.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });
});

describe('Wortkette', () => {
  describe('WORD_CHAIN_START_WORDS', () => {
    it('sollte Startwörter enthalten', () => {
      expect(WORD_CHAIN_START_WORDS.length).toBeGreaterThan(0);
    });

    it('sollte alle mit Großbuchstaben beginnen', () => {
      for (const word of WORD_CHAIN_START_WORDS) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    });
  });

  describe('GERMAN_WORD_LIST', () => {
    it('sollte Wörter enthalten', () => {
      expect(GERMAN_WORD_LIST.size).toBeGreaterThan(0);
    });

    it('sollte alle Wörter kleingeschrieben haben', () => {
      for (const word of GERMAN_WORD_LIST) {
        expect(word).toBe(word.toLowerCase());
      }
    });
  });

  describe('isValidGermanWord', () => {
    it('sollte gültige Wörter erkennen', () => {
      expect(isValidGermanWord('apfel')).toBe(true);
      expect(isValidGermanWord('APFEL')).toBe(true);
      expect(isValidGermanWord('Apfel')).toBe(true);
    });

    it('sollte ungültige Wörter ablehnen', () => {
      expect(isValidGermanWord('xyz')).toBe(false);
      expect(isValidGermanWord('qwerty')).toBe(false);
    });
  });

  describe('isValidWordChainWord', () => {
    it('sollte gültige Wortketten-Wörter akzeptieren', () => {
      expect(isValidWordChainWord('lampe', 'l')).toBe(true);
      expect(isValidWordChainWord('engel', 'e')).toBe(true);
    });

    it('sollte Wörter mit falschem Anfangsbuchstaben ablehnen', () => {
      expect(isValidWordChainWord('lampe', 'a')).toBe(false);
      expect(isValidWordChainWord('baum', 'a')).toBe(false);
    });

    it('sollte zu kurze Wörter ablehnen', () => {
      expect(isValidWordChainWord('a', 'a')).toBe(false);
    });

    it('sollte ungültige Wörter ablehnen', () => {
      expect(isValidWordChainWord('xyz', 'x')).toBe(false);
    });
  });
});

describe('Anagramme', () => {
  describe('ANAGRAM_PUZZLES', () => {
    it('sollte Puzzles enthalten', () => {
      expect(ANAGRAM_PUZZLES.length).toBeGreaterThan(0);
    });

    it('sollte gültige Struktur haben', () => {
      for (const puzzle of ANAGRAM_PUZZLES) {
        expect(puzzle.letters).toBeDefined();
        expect(puzzle.letters.length).toBeGreaterThan(0);
        expect(puzzle.validWords).toBeDefined();
        expect(puzzle.validWords.length).toBeGreaterThan(0);
        expect(puzzle.bonusWord).toBeDefined();
      }
    });

    it('sollte Bonuswort in validWords enthalten', () => {
      for (const puzzle of ANAGRAM_PUZZLES) {
        expect(puzzle.validWords).toContain(puzzle.bonusWord);
      }
    });
  });

  describe('canFormWord', () => {
    it('sollte gültige Wörter erkennen', () => {
      expect(canFormWord('reis', ['R', 'E', 'I', 'S', 'E', 'N'])).toBe(true);
      expect(canFormWord('reise', ['R', 'E', 'I', 'S', 'E', 'N'])).toBe(true);
      expect(canFormWord('reisen', ['R', 'E', 'I', 'S', 'E', 'N'])).toBe(true);
    });

    it('sollte ungültige Wörter ablehnen', () => {
      expect(canFormWord('reisen', ['R', 'E', 'I', 'S'])).toBe(false);
      expect(canFormWord('xxx', ['R', 'E', 'I', 'S', 'E', 'N'])).toBe(false);
    });

    it('sollte Buchstaben nur einmal verwenden', () => {
      expect(canFormWord('ee', ['E'])).toBe(false);
      expect(canFormWord('ee', ['E', 'E'])).toBe(true);
    });
  });

  describe('getRandomAnagramPuzzle', () => {
    it('sollte ein Puzzle zurückgeben', () => {
      const puzzle = getRandomAnagramPuzzle();
      expect(puzzle).toBeDefined();
      expect(puzzle.letters).toBeDefined();
      expect(puzzle.validWords).toBeDefined();
    });
  });
});

describe('Hilfsfunktionen', () => {
  describe('shuffleArray', () => {
    it('sollte Array gleicher Länge zurückgeben', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled.length).toBe(original.length);
    });

    it('sollte alle Elemente enthalten', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      for (const item of original) {
        expect(shuffled).toContain(item);
      }
    });

    it('sollte Original nicht verändern', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffleArray(original);
      expect(original).toEqual(copy);
    });
  });

  describe('getRandomQuestions', () => {
    it('sollte richtige Anzahl zurückgeben', () => {
      const questions = getRandomQuestions(WOULD_YOU_RATHER_QUESTIONS, 5);
      expect(questions.length).toBe(5);
    });

    it('sollte nicht mehr als verfügbar zurückgeben', () => {
      const questions = getRandomQuestions(WOULD_YOU_RATHER_QUESTIONS, 1000);
      expect(questions.length).toBe(WOULD_YOU_RATHER_QUESTIONS.length);
    });

    it('sollte verschiedene Elemente bei mehrfachem Aufruf zurückgeben können', () => {
      // Teste ob mindestens einmal verschiedene Ergebnisse kommen
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const questions = getRandomQuestions(WOULD_YOU_RATHER_QUESTIONS, 3);
        results.add(questions.map((q) => q.id).join(','));
      }
      // Bei genug Durchläufen sollten verschiedene Kombinationen kommen
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
