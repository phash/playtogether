/**
 * Spielinhalte - Fragen und Daten für alle Spiele
 */

import type {
  WouldYouRatherQuestion,
  MostLikelyQuestion,
  EitherOrQuestion,
} from '../types/game.js';

// ============================================
// WÜRDEST DU EHER? - Fragen
// ============================================

export const WOULD_YOU_RATHER_QUESTIONS: WouldYouRatherQuestion[] = [
  // Funny
  { id: 'wyr1', optionA: 'Immer laut denken müssen', optionB: 'Nie mehr alleine sein können', category: 'funny' },
  { id: 'wyr2', optionA: 'Nur noch flüstern können', optionB: 'Nur noch schreien können', category: 'funny' },
  { id: 'wyr3', optionA: 'Rückwärts gehen müssen', optionB: 'Seitwärts gehen müssen', category: 'funny' },
  { id: 'wyr4', optionA: 'Immer 5 Minuten zu früh sein', optionB: 'Immer 5 Minuten zu spät sein', category: 'funny' },
  { id: 'wyr5', optionA: 'Nur noch Kinderlieder hören können', optionB: 'Nur noch Heavy Metal hören können', category: 'funny' },
  { id: 'wyr6', optionA: 'Ein Jahr lang nur Pizza essen', optionB: 'Ein Jahr lang nie Pizza essen', category: 'funny' },
  { id: 'wyr7', optionA: 'Immer nasse Socken tragen', optionB: 'Immer einen kleinen Stein im Schuh haben', category: 'funny' },
  { id: 'wyr8', optionA: 'Jedes Mal niesen wenn du lügst', optionB: 'Jedes Mal hicksen wenn jemand deinen Namen sagt', category: 'funny' },

  // Deep
  { id: 'wyr10', optionA: 'Die Vergangenheit ändern können', optionB: 'Die Zukunft sehen können', category: 'deep' },
  { id: 'wyr11', optionA: 'Gedanken lesen können', optionB: 'Unsichtbar sein können', category: 'deep' },
  { id: 'wyr12', optionA: 'Nie mehr arbeiten müssen', optionB: 'Den perfekten Job haben', category: 'deep' },
  { id: 'wyr13', optionA: 'Berühmt aber unglücklich sein', optionB: 'Unbekannt aber glücklich sein', category: 'deep' },
  { id: 'wyr14', optionA: 'Alle Sprachen sprechen können', optionB: 'Mit Tieren reden können', category: 'deep' },
  { id: 'wyr15', optionA: 'In der Vergangenheit leben', optionB: 'In der Zukunft leben', category: 'deep' },
  { id: 'wyr16', optionA: 'Nie mehr lügen können', optionB: 'Nie mehr die Wahrheit erfahren', category: 'deep' },

  // Lifestyle
  { id: 'wyr20', optionA: 'Auf dem Land leben', optionB: 'In der Großstadt leben', category: 'lifestyle' },
  { id: 'wyr21', optionA: 'Nie mehr kochen', optionB: 'Nie mehr auswärts essen', category: 'lifestyle' },
  { id: 'wyr22', optionA: 'Immer Sommer haben', optionB: 'Immer Winter haben', category: 'lifestyle' },
  { id: 'wyr23', optionA: 'Früh aufstehen, früh schlafen', optionB: 'Spät aufstehen, spät schlafen', category: 'lifestyle' },
  { id: 'wyr24', optionA: 'Kein Smartphone für ein Jahr', optionB: 'Keinen Computer für ein Jahr', category: 'lifestyle' },
  { id: 'wyr25', optionA: 'Nur noch Bücher lesen', optionB: 'Nur noch Filme schauen', category: 'lifestyle' },

  // Gross/Eklig
  { id: 'wyr30', optionA: 'Einen lebenden Wurm essen', optionB: 'Eine tote Spinne essen', category: 'gross' },
  { id: 'wyr31', optionA: 'Eine Woche nicht duschen', optionB: 'Eine Woche nicht Zähne putzen', category: 'gross' },
  { id: 'wyr32', optionA: 'Socken von einem Fremden tragen', optionB: 'Eine Zahnbürste mit einem Fremden teilen', category: 'gross' },
];

// ============================================
// WER WÜRDE AM EHESTEN? - Fragen
// ============================================

export const MOST_LIKELY_QUESTIONS: MostLikelyQuestion[] = [
  // Funny
  { id: 'ml1', question: 'Wer würde am ehesten einen viralen TikTok-Tanz machen?', category: 'funny' },
  { id: 'ml2', question: 'Wer würde am ehesten bei einer Quizshow gewinnen?', category: 'funny' },
  { id: 'ml3', question: 'Wer würde am ehesten aus Versehen Reply All drücken?', category: 'funny' },
  { id: 'ml4', question: 'Wer würde am ehesten ein Haustier nach Essen benennen?', category: 'funny' },
  { id: 'ml5', question: 'Wer würde am ehesten beim Karaoke auf den Tisch steigen?', category: 'funny' },
  { id: 'ml6', question: 'Wer würde am ehesten mit einem Promi verwechselt werden?', category: 'funny' },
  { id: 'ml7', question: 'Wer würde am ehesten sein Handy in der Toilette verlieren?', category: 'funny' },
  { id: 'ml8', question: 'Wer würde am ehesten eine Stunde lang über sein Hobby reden?', category: 'funny' },

  // Embarrassing
  { id: 'ml10', question: 'Wer würde am ehesten in der Öffentlichkeit stolpern?', category: 'embarrassing' },
  { id: 'ml11', question: 'Wer würde am ehesten die falschen Namen verwechseln?', category: 'embarrassing' },
  { id: 'ml12', question: 'Wer würde am ehesten seinen Text bei einer Präsentation vergessen?', category: 'embarrassing' },
  { id: 'ml13', question: 'Wer würde am ehesten jemandem zuwinken, der gar nicht gemeint war?', category: 'embarrassing' },
  { id: 'ml14', question: 'Wer würde am ehesten laut lachen in einer stillen Situation?', category: 'embarrassing' },

  // Talent
  { id: 'ml20', question: 'Wer würde am ehesten ein Buch schreiben?', category: 'talent' },
  { id: 'ml21', question: 'Wer würde am ehesten ein eigenes Unternehmen gründen?', category: 'talent' },
  { id: 'ml22', question: 'Wer würde am ehesten ein Musikinstrument lernen?', category: 'talent' },
  { id: 'ml23', question: 'Wer würde am ehesten einen Marathon laufen?', category: 'talent' },
  { id: 'ml24', question: 'Wer würde am ehesten Bürgermeister werden?', category: 'talent' },

  // Lifestyle
  { id: 'ml30', question: 'Wer würde am ehesten vegan werden?', category: 'lifestyle' },
  { id: 'ml31', question: 'Wer würde am ehesten auswandern?', category: 'lifestyle' },
  { id: 'ml32', question: 'Wer würde am ehesten im Lotto gewinnen und es verschenken?', category: 'lifestyle' },
  { id: 'ml33', question: 'Wer würde am ehesten einen Weltrekord aufstellen?', category: 'lifestyle' },
  { id: 'ml34', question: 'Wer würde am ehesten 100 Jahre alt werden?', category: 'lifestyle' },
];

// ============================================
// ENTWEDER/ODER - Fragen
// ============================================

export const EITHER_OR_QUESTIONS: EitherOrQuestion[] = [
  // Food
  { id: 'eo1', optionA: 'Pizza', optionB: 'Burger', category: 'food' },
  { id: 'eo2', optionA: 'Süß', optionB: 'Salzig', category: 'food' },
  { id: 'eo3', optionA: 'Kaffee', optionB: 'Tee', category: 'food' },
  { id: 'eo4', optionA: 'Frühstück', optionB: 'Abendessen', category: 'food' },
  { id: 'eo5', optionA: 'Schokolade', optionB: 'Gummibärchen', category: 'food' },
  { id: 'eo6', optionA: 'Italienisch', optionB: 'Asiatisch', category: 'food' },
  { id: 'eo7', optionA: 'Kochen', optionB: 'Bestellen', category: 'food' },
  { id: 'eo8', optionA: 'Eis', optionB: 'Kuchen', category: 'food' },

  // Lifestyle
  { id: 'eo10', optionA: 'Strand', optionB: 'Berge', category: 'lifestyle' },
  { id: 'eo11', optionA: 'Früh aufstehen', optionB: 'Spät aufstehen', category: 'lifestyle' },
  { id: 'eo12', optionA: 'Sommer', optionB: 'Winter', category: 'lifestyle' },
  { id: 'eo13', optionA: 'Hund', optionB: 'Katze', category: 'lifestyle' },
  { id: 'eo14', optionA: 'Telefonieren', optionB: 'Texten', category: 'lifestyle' },
  { id: 'eo15', optionA: 'Duschen', optionB: 'Baden', category: 'lifestyle' },
  { id: 'eo16', optionA: 'Ordnung', optionB: 'Chaos', category: 'lifestyle' },

  // Entertainment
  { id: 'eo20', optionA: 'Netflix', optionB: 'YouTube', category: 'entertainment' },
  { id: 'eo21', optionA: 'Film', optionB: 'Serie', category: 'entertainment' },
  { id: 'eo22', optionA: 'Buch', optionB: 'Podcast', category: 'entertainment' },
  { id: 'eo23', optionA: 'Konzert', optionB: 'Festival', category: 'entertainment' },
  { id: 'eo24', optionA: 'Videospiele', optionB: 'Brettspiele', category: 'entertainment' },
  { id: 'eo25', optionA: 'Komödie', optionB: 'Drama', category: 'entertainment' },

  // Travel
  { id: 'eo30', optionA: 'Städtetrip', optionB: 'Natururlaub', category: 'travel' },
  { id: 'eo31', optionA: 'Fliegen', optionB: 'Zug fahren', category: 'travel' },
  { id: 'eo32', optionA: 'Hotel', optionB: 'Airbnb', category: 'travel' },
  { id: 'eo33', optionA: 'Alleine reisen', optionB: 'In der Gruppe reisen', category: 'travel' },
  { id: 'eo34', optionA: 'Spontan verreisen', optionB: 'Alles planen', category: 'travel' },
];

// ============================================
// WORTKETTE - Startwörter und Validierung
// ============================================

export const WORD_CHAIN_START_WORDS = [
  'Apfel', 'Lampe', 'Sonne', 'Tisch', 'Blume',
  'Katze', 'Regen', 'Schuh', 'Wald', 'Musik',
  'Stein', 'Wolke', 'Feuer', 'Nacht', 'Stern',
];

// Einfache deutsche Wortliste für Validierung
// In Produktion würde man eine vollständige Wortliste verwenden
export const GERMAN_WORD_LIST = new Set([
  // A
  'apfel', 'auto', 'arm', 'auge', 'abend', 'anfang', 'arbeit', 'antwort',
  // B
  'ball', 'baum', 'bein', 'berg', 'bild', 'blume', 'boot', 'brot', 'buch', 'butter',
  // D
  'dach', 'dose', 'draht',
  // E
  'eis', 'ende', 'engel', 'erde', 'essen',
  // F
  'fahrt', 'farbe', 'feder', 'feld', 'fenster', 'feuer', 'fisch', 'fleisch', 'fluss', 'frage', 'frau', 'freund', 'frucht',
  // G
  'gabel', 'garten', 'gast', 'geld', 'gesicht', 'glas', 'gras', 'grenze',
  // H
  'haar', 'hals', 'hand', 'haus', 'haut', 'herz', 'himmel', 'hund',
  // I
  'idee', 'insel',
  // K
  'kaffee', 'karte', 'katze', 'kind', 'kirche', 'kleid', 'kopf', 'kraft', 'krieg', 'kuchen',
  // L
  'lampe', 'land', 'leben', 'lehrer', 'licht', 'liebe', 'luft',
  // M
  'magen', 'mann', 'markt', 'meer', 'meister', 'mensch', 'messer', 'milch', 'mittel', 'mond', 'morgen', 'mund', 'musik', 'mutter',
  // N
  'nacht', 'nadel', 'name', 'nase', 'natur', 'nebel',
  // O
  'ofen', 'ohr', 'ordnung',
  // P
  'papier', 'pferd', 'pflanze', 'platz', 'preis',
  // R
  'rad', 'rand', 'raum', 'regen', 'reis', 'reise', 'ring', 'rose', 'ruhe',
  // S
  'sache', 'salz', 'sand', 'schiff', 'schlaf', 'schluss', 'schnee', 'schuh', 'schule', 'see', 'seite', 'sinn', 'sohn', 'sonne', 'spiel', 'sprache', 'stadt', 'stamm', 'stein', 'stelle', 'stern', 'stimme', 'stock', 'strasse', 'stunde', 'stuhl',
  // T
  'tag', 'tanz', 'tasche', 'tasse', 'teil', 'tier', 'tisch', 'tod', 'tor', 'traum', 'tropfen', 'tuch', 'turm',
  // U
  'uhr', 'umwelt',
  // V
  'vater', 'vogel', 'volk',
  // W
  'wagen', 'wald', 'wand', 'wasser', 'weg', 'wein', 'welt', 'werk', 'wetter', 'wind', 'winter', 'woche', 'wolke', 'wort', 'wunsch',
  // Z
  'zahl', 'zahn', 'zeit', 'zeitung', 'zimmer', 'zucker', 'zukunft',
]);

/**
 * Prüft ob ein Wort gültig ist für Wortkette
 */
export function isValidGermanWord(word: string): boolean {
  return GERMAN_WORD_LIST.has(word.toLowerCase());
}

/**
 * Prüft ob das Wort mit dem richtigen Buchstaben beginnt
 */
export function isValidWordChainWord(word: string, lastLetter: string): boolean {
  const normalizedWord = word.toLowerCase().trim();
  const normalizedLetter = lastLetter.toLowerCase();

  if (normalizedWord.length < 2) return false;
  if (normalizedWord[0] !== normalizedLetter) return false;

  return isValidGermanWord(normalizedWord);
}

// ============================================
// ANAGRAMME - Buchstaben und Wörter
// ============================================

export interface AnagramPuzzle {
  letters: string[];
  validWords: string[];
  bonusWord: string;
}

export const ANAGRAM_PUZZLES: AnagramPuzzle[] = [
  {
    letters: ['R', 'E', 'I', 'S', 'E', 'N'],
    validWords: ['reis', 'reise', 'see', 'nie', 'sir', 'rein', 'seine', 'einer', 'reisen'],
    bonusWord: 'reisen',
  },
  {
    letters: ['S', 'P', 'I', 'E', 'L', 'E'],
    validWords: ['spiel', 'lippe', 'see', 'eile', 'lese', 'spiele'],
    bonusWord: 'spiele',
  },
  {
    letters: ['B', 'L', 'U', 'M', 'E', 'N'],
    validWords: ['blume', 'lumen', 'nebel', 'blumen'],
    bonusWord: 'blumen',
  },
  {
    letters: ['S', 'C', 'H', 'U', 'L', 'E'],
    validWords: ['schuh', 'schule', 'lusche'],
    bonusWord: 'schule',
  },
  {
    letters: ['G', 'A', 'R', 'T', 'E', 'N'],
    validWords: ['art', 'rat', 'tag', 'nage', 'rate', 'garten'],
    bonusWord: 'garten',
  },
  {
    letters: ['F', 'R', 'E', 'U', 'N', 'D'],
    validWords: ['freund', 'ruf', 'nur', 'und'],
    bonusWord: 'freund',
  },
  {
    letters: ['W', 'I', 'N', 'T', 'E', 'R'],
    validWords: ['wirt', 'wein', 'rein', 'nie', 'winter'],
    bonusWord: 'winter',
  },
  {
    letters: ['S', 'O', 'M', 'M', 'E', 'R'],
    validWords: ['rose', 'sommer'],
    bonusWord: 'sommer',
  },
  {
    letters: ['A', 'B', 'E', 'N', 'D', 'S'],
    validWords: ['band', 'sand', 'abend', 'abends'],
    bonusWord: 'abends',
  },
  {
    letters: ['M', 'O', 'R', 'G', 'E', 'N'],
    validWords: ['norm', 'morgen'],
    bonusWord: 'morgen',
  },
];

/**
 * Holt ein zufälliges Anagramm-Puzzle
 */
export function getRandomAnagramPuzzle(): AnagramPuzzle {
  return ANAGRAM_PUZZLES[Math.floor(Math.random() * ANAGRAM_PUZZLES.length)];
}

/**
 * Prüft ob ein Wort aus den gegebenen Buchstaben gebildet werden kann
 */
export function canFormWord(word: string, letters: string[]): boolean {
  const available = [...letters.map(l => l.toLowerCase())];
  const wordLetters = word.toLowerCase().split('');

  for (const letter of wordLetters) {
    const index = available.indexOf(letter);
    if (index === -1) return false;
    available.splice(index, 1);
  }

  return true;
}

// ============================================
// HILFSFUNKTIONEN
// ============================================

/**
 * Mischt ein Array zufällig (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Holt zufällige Fragen aus einer Liste
 */
export function getRandomQuestions<T>(questions: T[], count: number): T[] {
  return shuffleArray(questions).slice(0, count);
}
