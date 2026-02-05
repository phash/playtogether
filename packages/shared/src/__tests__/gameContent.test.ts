/**
 * Tests für Spielinhalte
 */

import { describe, it, expect } from 'vitest';
import {
  QUIZ_CHAMP_QUESTIONS,
  ENTWEDER_ODER_QUESTIONS,
  WORD_LIST,
  GLUECKSRAD_PHRASES,
  shuffleArray,
  getRandomQuestions,
  getRandomWords,
  scrambleWord,
} from '../data/gameContent.js';

describe('Quiz Champ Fragen', () => {
  it('sollte mindestens 100 Fragen enthalten', () => {
    expect(QUIZ_CHAMP_QUESTIONS.length).toBeGreaterThanOrEqual(100);
  });

  it('sollte gültige Struktur haben', () => {
    for (const q of QUIZ_CHAMP_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.question).toBeDefined();
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.category).toBeDefined();
      expect(q.difficulty).toBeDefined();
    }
  });

  it('sollte eindeutige IDs haben', () => {
    const ids = QUIZ_CHAMP_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('sollte verschiedene Kategorien haben', () => {
    const categories = new Set(QUIZ_CHAMP_QUESTIONS.map((q) => q.category));
    expect(categories.size).toBeGreaterThan(3);
  });

  it('sollte verschiedene Schwierigkeitsgrade haben', () => {
    const difficulties = new Set(QUIZ_CHAMP_QUESTIONS.map((q) => q.difficulty));
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('medium')).toBe(true);
    expect(difficulties.has('hard')).toBe(true);
  });
});

describe('Entweder/Oder Fragen', () => {
  it('sollte mindestens 50 Fragen enthalten', () => {
    expect(ENTWEDER_ODER_QUESTIONS.length).toBeGreaterThanOrEqual(50);
  });

  it('sollte gültige Struktur haben', () => {
    for (const q of ENTWEDER_ODER_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.optionA).toBeDefined();
      expect(q.optionB).toBeDefined();
      expect(q.category).toBeDefined();
    }
  });

  it('sollte eindeutige IDs haben', () => {
    const ids = ENTWEDER_ODER_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('sollte verschiedene Kategorien haben', () => {
    const categories = new Set(ENTWEDER_ODER_QUESTIONS.map((q) => q.category));
    expect(categories.size).toBeGreaterThan(3);
  });
});

describe('Wortliste', () => {
  it('sollte mindestens 100 Wörter enthalten', () => {
    expect(WORD_LIST.length).toBeGreaterThanOrEqual(100);
  });

  it('sollte gültige Struktur haben', () => {
    for (const entry of WORD_LIST) {
      expect(entry.word).toBeDefined();
      expect(entry.word.length).toBeGreaterThan(2);
      expect(entry.category).toBeDefined();
      expect(['easy', 'medium', 'hard']).toContain(entry.difficulty);
    }
  });

  it('sollte keine doppelten Wörter haben', () => {
    const words = WORD_LIST.map((w) => w.word.toLowerCase());
    const uniqueWords = new Set(words);
    expect(uniqueWords.size).toBe(words.length);
  });

  it('sollte verschiedene Schwierigkeitsgrade haben', () => {
    const difficulties = new Set(WORD_LIST.map((w) => w.difficulty));
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('medium')).toBe(true);
    expect(difficulties.has('hard')).toBe(true);
  });
});

describe('Glücksrad Phrasen', () => {
  it('sollte mindestens 50 Phrasen enthalten', () => {
    expect(GLUECKSRAD_PHRASES.length).toBeGreaterThanOrEqual(50);
  });

  it('sollte gültige Struktur haben', () => {
    for (const p of GLUECKSRAD_PHRASES) {
      expect(p.phrase).toBeDefined();
      expect(p.phrase.length).toBeGreaterThan(3);
      expect(p.category).toBeDefined();
    }
  });

  it('sollte verschiedene Kategorien haben', () => {
    const categories = new Set(GLUECKSRAD_PHRASES.map((p) => p.category));
    expect(categories.size).toBeGreaterThan(3);
  });

  it('sollte Phrasen in Großbuchstaben haben', () => {
    for (const p of GLUECKSRAD_PHRASES) {
      expect(p.phrase).toBe(p.phrase.toUpperCase());
    }
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
      const questions = getRandomQuestions(QUIZ_CHAMP_QUESTIONS, 5);
      expect(questions.length).toBe(5);
    });

    it('sollte nicht mehr als verfügbar zurückgeben', () => {
      const questions = getRandomQuestions(QUIZ_CHAMP_QUESTIONS, 10000);
      expect(questions.length).toBe(QUIZ_CHAMP_QUESTIONS.length);
    });

    it('sollte verschiedene Elemente bei mehrfachem Aufruf zurückgeben können', () => {
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const questions = getRandomQuestions(QUIZ_CHAMP_QUESTIONS, 3);
        results.add(questions.map((q) => q.id).join(','));
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('getRandomWords', () => {
    it('sollte richtige Anzahl zurückgeben', () => {
      const words = getRandomWords(5);
      expect(words.length).toBe(5);
    });

    it('sollte gültige WordEntry-Objekte zurückgeben', () => {
      const words = getRandomWords(3);
      for (const w of words) {
        expect(w.word).toBeDefined();
        expect(w.category).toBeDefined();
        expect(w.difficulty).toBeDefined();
      }
    });
  });

  describe('scrambleWord', () => {
    it('sollte gleiche Buchstaben enthalten', () => {
      const word = 'Apfel';
      const scrambled = scrambleWord(word);
      const sortedOriginal = word.toUpperCase().split('').sort().join('');
      const sortedScrambled = scrambled.split('').sort().join('');
      expect(sortedScrambled).toBe(sortedOriginal);
    });

    it('sollte Großbuchstaben zurückgeben', () => {
      const scrambled = scrambleWord('hallo');
      expect(scrambled).toBe(scrambled.toUpperCase());
    });

    it('sollte bei langen Wörtern eine andere Reihenfolge liefern', () => {
      // Bei kurzen Wörtern könnte zufällig die gleiche Reihenfolge rauskommen
      const word = 'Schmetterling';
      let different = false;
      for (let i = 0; i < 20; i++) {
        const scrambled = scrambleWord(word);
        if (scrambled !== word.toUpperCase()) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });
});
