/**
 * Spielinhalte - Fragen und Daten für alle Spiele
 */

import type {
  QuizChampQuestion,
  EntwederOderQuestion,
} from '../types/game.js';

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

// ============================================
// WORTLISTE - für Anagramme, Hangman, Glücksrad
// ============================================

export interface WordEntry {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const WORD_LIST: WordEntry[] = [
  // === LEICHT (4-5 Buchstaben) ===
  { word: 'Apfel', category: 'Obst', difficulty: 'easy' },
  { word: 'Stern', category: 'Natur', difficulty: 'easy' },
  { word: 'Blume', category: 'Natur', difficulty: 'easy' },
  { word: 'Katze', category: 'Tiere', difficulty: 'easy' },
  { word: 'Regen', category: 'Wetter', difficulty: 'easy' },
  { word: 'Lampe', category: 'Haus', difficulty: 'easy' },
  { word: 'Tisch', category: 'Haus', difficulty: 'easy' },
  { word: 'Vogel', category: 'Tiere', difficulty: 'easy' },
  { word: 'Sonne', category: 'Natur', difficulty: 'easy' },
  { word: 'Schuh', category: 'Haus', difficulty: 'easy' },
  { word: 'Milch', category: 'Essen', difficulty: 'easy' },
  { word: 'Stuhl', category: 'Haus', difficulty: 'easy' },
  { word: 'Pferd', category: 'Tiere', difficulty: 'easy' },
  { word: 'Wolke', category: 'Natur', difficulty: 'easy' },
  { word: 'Musik', category: 'Kultur', difficulty: 'easy' },
  { word: 'Feuer', category: 'Natur', difficulty: 'easy' },
  { word: 'Nacht', category: 'Zeit', difficulty: 'easy' },
  { word: 'Traum', category: 'Alltag', difficulty: 'easy' },
  { word: 'Kraft', category: 'Alltag', difficulty: 'easy' },
  { word: 'Kleid', category: 'Kleidung', difficulty: 'easy' },
  { word: 'Preis', category: 'Alltag', difficulty: 'easy' },
  { word: 'Brief', category: 'Alltag', difficulty: 'easy' },
  { word: 'Gabel', category: 'Haus', difficulty: 'easy' },
  { word: 'Hund', category: 'Tiere', difficulty: 'easy' },
  { word: 'Herz', category: 'Körper', difficulty: 'easy' },
  { word: 'Fisch', category: 'Tiere', difficulty: 'easy' },
  { word: 'Birne', category: 'Obst', difficulty: 'easy' },
  { word: 'Mauer', category: 'Gebäude', difficulty: 'easy' },
  { word: 'Krone', category: 'Gegenstände', difficulty: 'easy' },
  { word: 'Feder', category: 'Natur', difficulty: 'easy' },
  { word: 'Kerze', category: 'Haus', difficulty: 'easy' },
  { word: 'Blatt', category: 'Natur', difficulty: 'easy' },
  { word: 'Kreuz', category: 'Formen', difficulty: 'easy' },
  { word: 'Turm', category: 'Gebäude', difficulty: 'easy' },
  { word: 'Stein', category: 'Natur', difficulty: 'easy' },
  { word: 'Farbe', category: 'Kunst', difficulty: 'easy' },
  { word: 'Perle', category: 'Schmuck', difficulty: 'easy' },
  { word: 'Wiese', category: 'Natur', difficulty: 'easy' },
  { word: 'Palme', category: 'Pflanzen', difficulty: 'easy' },
  { word: 'Nadel', category: 'Gegenstände', difficulty: 'easy' },
  { word: 'Fluss', category: 'Natur', difficulty: 'easy' },
  { word: 'Welle', category: 'Natur', difficulty: 'easy' },
  { word: 'Insel', category: 'Geographie', difficulty: 'easy' },
  { word: 'Tiger', category: 'Tiere', difficulty: 'easy' },
  { word: 'Adler', category: 'Tiere', difficulty: 'easy' },
  { word: 'Engel', category: 'Figuren', difficulty: 'easy' },
  { word: 'Braut', category: 'Menschen', difficulty: 'easy' },
  { word: 'Geist', category: 'Figuren', difficulty: 'easy' },
  { word: 'Hafen', category: 'Orte', difficulty: 'easy' },
  { word: 'Anker', category: 'Gegenstände', difficulty: 'easy' },

  // === MITTEL (6-8 Buchstaben) ===
  { word: 'Garten', category: 'Natur', difficulty: 'medium' },
  { word: 'Freund', category: 'Menschen', difficulty: 'medium' },
  { word: 'Winter', category: 'Jahreszeit', difficulty: 'medium' },
  { word: 'Sommer', category: 'Jahreszeit', difficulty: 'medium' },
  { word: 'Morgen', category: 'Zeit', difficulty: 'medium' },
  { word: 'Schule', category: 'Bildung', difficulty: 'medium' },
  { word: 'Kirche', category: 'Gebäude', difficulty: 'medium' },
  { word: 'Sprache', category: 'Kultur', difficulty: 'medium' },
  { word: 'Fenster', category: 'Haus', difficulty: 'medium' },
  { word: 'Kuchen', category: 'Essen', difficulty: 'medium' },
  { word: 'Messer', category: 'Haus', difficulty: 'medium' },
  { word: 'Wasser', category: 'Natur', difficulty: 'medium' },
  { word: 'Kaffee', category: 'Essen', difficulty: 'medium' },
  { word: 'Reisen', category: 'Freizeit', difficulty: 'medium' },
  { word: 'Arbeit', category: 'Beruf', difficulty: 'medium' },
  { word: 'Donner', category: 'Wetter', difficulty: 'medium' },
  { word: 'Bruder', category: 'Familie', difficulty: 'medium' },
  { word: 'Silber', category: 'Material', difficulty: 'medium' },
  { word: 'Spiegel', category: 'Haus', difficulty: 'medium' },
  { word: 'Himmel', category: 'Natur', difficulty: 'medium' },
  { word: 'Brücke', category: 'Gebäude', difficulty: 'medium' },
  { word: 'Drache', category: 'Figuren', difficulty: 'medium' },
  { word: 'Schloss', category: 'Gebäude', difficulty: 'medium' },
  { word: 'Tempel', category: 'Gebäude', difficulty: 'medium' },
  { word: 'Flasche', category: 'Gegenstände', difficulty: 'medium' },
  { word: 'Grenze', category: 'Geographie', difficulty: 'medium' },
  { word: 'Lehrer', category: 'Beruf', difficulty: 'medium' },
  { word: 'Koffer', category: 'Gegenstände', difficulty: 'medium' },
  { word: 'Schlange', category: 'Tiere', difficulty: 'medium' },
  { word: 'Frieden', category: 'Alltag', difficulty: 'medium' },
  { word: 'Schatz', category: 'Alltag', difficulty: 'medium' },
  { word: 'Pirat', category: 'Figuren', difficulty: 'medium' },
  { word: 'Rakete', category: 'Technik', difficulty: 'medium' },
  { word: 'Planet', category: 'Weltraum', difficulty: 'medium' },
  { word: 'Vulkan', category: 'Natur', difficulty: 'medium' },
  { word: 'Delfin', category: 'Tiere', difficulty: 'medium' },
  { word: 'Giraffe', category: 'Tiere', difficulty: 'medium' },
  { word: 'Papagei', category: 'Tiere', difficulty: 'medium' },
  { word: 'Pinguin', category: 'Tiere', difficulty: 'medium' },
  { word: 'Elefant', category: 'Tiere', difficulty: 'medium' },
  { word: 'Krokodil', category: 'Tiere', difficulty: 'medium' },
  { word: 'Flamingo', category: 'Tiere', difficulty: 'medium' },
  { word: 'Erdbeere', category: 'Obst', difficulty: 'medium' },
  { word: 'Kartoffel', category: 'Essen', difficulty: 'medium' },
  { word: 'Brezel', category: 'Essen', difficulty: 'medium' },
  { word: 'Dirigent', category: 'Beruf', difficulty: 'medium' },
  { word: 'Detektiv', category: 'Beruf', difficulty: 'medium' },
  { word: 'Astronaut', category: 'Beruf', difficulty: 'medium' },
  { word: 'Nordsee', category: 'Geographie', difficulty: 'medium' },
  { word: 'Fahrrad', category: 'Alltag', difficulty: 'medium' },
  { word: 'Rucksack', category: 'Gegenstände', difficulty: 'medium' },
  { word: 'Lavendel', category: 'Pflanzen', difficulty: 'medium' },
  { word: 'Gewitter', category: 'Wetter', difficulty: 'medium' },
  { word: 'Diamant', category: 'Schmuck', difficulty: 'medium' },
  { word: 'Kompass', category: 'Gegenstände', difficulty: 'medium' },
  { word: 'Roboter', category: 'Technik', difficulty: 'medium' },
  { word: 'Kapitän', category: 'Beruf', difficulty: 'medium' },
  { word: 'Chirurg', category: 'Beruf', difficulty: 'medium' },
  { word: 'Feuerwehr', category: 'Beruf', difficulty: 'medium' },
  { word: 'Kaninchen', category: 'Tiere', difficulty: 'medium' },

  // === SCHWER (9+ Buchstaben) ===
  { word: 'Schmetterling', category: 'Tiere', difficulty: 'hard' },
  { word: 'Geburtstag', category: 'Feiern', difficulty: 'hard' },
  { word: 'Abenteuer', category: 'Freizeit', difficulty: 'hard' },
  { word: 'Spielplatz', category: 'Orte', difficulty: 'hard' },
  { word: 'Sonnenschein', category: 'Wetter', difficulty: 'hard' },
  { word: 'Weihnachten', category: 'Feiern', difficulty: 'hard' },
  { word: 'Schokolade', category: 'Essen', difficulty: 'hard' },
  { word: 'Bibliothek', category: 'Gebäude', difficulty: 'hard' },
  { word: 'Regenschirm', category: 'Gegenstände', difficulty: 'hard' },
  { word: 'Handschuhe', category: 'Kleidung', difficulty: 'hard' },
  { word: 'Wasserfall', category: 'Natur', difficulty: 'hard' },
  { word: 'Sonnenblume', category: 'Pflanzen', difficulty: 'hard' },
  { word: 'Regenbogen', category: 'Natur', difficulty: 'hard' },
  { word: 'Schneeflocke', category: 'Natur', difficulty: 'hard' },
  { word: 'Mondschein', category: 'Natur', difficulty: 'hard' },
  { word: 'Schwarzwald', category: 'Geographie', difficulty: 'hard' },
  { word: 'Apfelkuchen', category: 'Essen', difficulty: 'hard' },
  { word: 'Pfannkuchen', category: 'Essen', difficulty: 'hard' },
  { word: 'Sauerkraut', category: 'Essen', difficulty: 'hard' },
  { word: 'Lebkuchen', category: 'Essen', difficulty: 'hard' },
  { word: 'Briefkasten', category: 'Alltag', difficulty: 'hard' },
  { word: 'Schildkröte', category: 'Tiere', difficulty: 'hard' },
  { word: 'Zahnbürste', category: 'Alltag', difficulty: 'hard' },
  { word: 'Nordlicht', category: 'Natur', difficulty: 'hard' },
  { word: 'Gletscher', category: 'Natur', difficulty: 'hard' },
  { word: 'Marmelade', category: 'Essen', difficulty: 'hard' },
  { word: 'Bratwurst', category: 'Essen', difficulty: 'hard' },
  { word: 'Journalist', category: 'Beruf', difficulty: 'hard' },
  { word: 'Zugspitze', category: 'Geographie', difficulty: 'hard' },
  { word: 'Feuerwerk', category: 'Feiern', difficulty: 'hard' },
  { word: 'Schatzkarte', category: 'Abenteuer', difficulty: 'hard' },
  { word: 'Leuchtturm', category: 'Gebäude', difficulty: 'hard' },
  { word: 'Ritterburg', category: 'Gebäude', difficulty: 'hard' },
  { word: 'Fernseher', category: 'Technik', difficulty: 'hard' },
  { word: 'Staubsauger', category: 'Haus', difficulty: 'hard' },
  { word: 'Handtasche', category: 'Gegenstände', difficulty: 'hard' },
  { word: 'Armbanduhr', category: 'Schmuck', difficulty: 'hard' },
  { word: 'Taschenlampe', category: 'Gegenstände', difficulty: 'hard' },
  { word: 'Fallschirm', category: 'Abenteuer', difficulty: 'hard' },
  { word: 'Hubschrauber', category: 'Technik', difficulty: 'hard' },
];

/**
 * Holt zufällige Wörter aus der WORD_LIST
 */
export function getRandomWords(count: number): WordEntry[] {
  return shuffleArray([...WORD_LIST]).slice(0, count);
}

/**
 * Verwürfelt ein Wort (Buchstaben zufällig anordnen)
 * Stellt sicher, dass das Ergebnis nicht dem Original entspricht
 */
export function scrambleWord(word: string): string {
  const letters = word.toUpperCase().split('');
  let scrambled: string[];
  let attempts = 0;

  do {
    scrambled = shuffleArray([...letters]);
    attempts++;
  } while (scrambled.join('') === letters.join('') && attempts < 20);

  return scrambled.join('');
}

// ============================================
// GLÜCKSRAD - Phrasen
// ============================================

export interface GluecksradPhrase {
  phrase: string;
  category: string;
}

export const GLUECKSRAD_PHRASES: GluecksradPhrase[] = [
  // Sprichwörter
  { phrase: 'ALLER ANFANG IST SCHWER', category: 'Sprichwort' },
  { phrase: 'MORGENSTUND HAT GOLD IM MUND', category: 'Sprichwort' },
  { phrase: 'DER APFEL FÄLLT NICHT WEIT VOM STAMM', category: 'Sprichwort' },
  { phrase: 'WER ZULETZT LACHT LACHT AM BESTEN', category: 'Sprichwort' },
  { phrase: 'ÜBUNG MACHT DEN MEISTER', category: 'Sprichwort' },
  { phrase: 'STILLE WASSER SIND TIEF', category: 'Sprichwort' },
  { phrase: 'KLEIDER MACHEN LEUTE', category: 'Sprichwort' },
  { phrase: 'WER RASTET DER ROSTET', category: 'Sprichwort' },
  { phrase: 'VIELE KÖCHE VERDERBEN DEN BREI', category: 'Sprichwort' },
  { phrase: 'DER FRÜHE VOGEL FÄNGT DEN WURM', category: 'Sprichwort' },
  { phrase: 'WISSEN IST MACHT', category: 'Sprichwort' },
  { phrase: 'LÜGEN HABEN KURZE BEINE', category: 'Sprichwort' },
  { phrase: 'HOCHMUT KOMMT VOR DEM FALL', category: 'Sprichwort' },
  { phrase: 'ZEIT IST GELD', category: 'Sprichwort' },
  { phrase: 'IN DER RUHE LIEGT DIE KRAFT', category: 'Sprichwort' },
  { phrase: 'HUNDE DIE BELLEN BEISSEN NICHT', category: 'Sprichwort' },
  { phrase: 'EIN BILD SAGT MEHR ALS TAUSEND WORTE', category: 'Sprichwort' },
  { phrase: 'WER SUCHT DER FINDET', category: 'Sprichwort' },
  { phrase: 'DAS LEBEN IST KEIN WUNSCHKONZERT', category: 'Sprichwort' },
  { phrase: 'AUGE UM AUGE ZAHN UM ZAHN', category: 'Sprichwort' },

  // Berühmte Orte
  { phrase: 'DAS BRANDENBURGER TOR', category: 'Berühmte Orte' },
  { phrase: 'DIE CHINESISCHE MAUER', category: 'Berühmte Orte' },
  { phrase: 'DER SCHIEFE TURM VON PISA', category: 'Berühmte Orte' },
  { phrase: 'DAS KOLOSSEUM IN ROM', category: 'Berühmte Orte' },
  { phrase: 'DIE FREIHEITSSTATUE', category: 'Berühmte Orte' },
  { phrase: 'DER EIFFELTURM IN PARIS', category: 'Berühmte Orte' },
  { phrase: 'DAS OPERNHAUS IN SYDNEY', category: 'Berühmte Orte' },
  { phrase: 'DER KÖLNER DOM', category: 'Berühmte Orte' },
  { phrase: 'SCHLOSS NEUSCHWANSTEIN', category: 'Berühmte Orte' },
  { phrase: 'DIE PYRAMIDEN VON GIZEH', category: 'Berühmte Orte' },

  // Filme & Serien
  { phrase: 'MÖGE DIE MACHT MIT DIR SEIN', category: 'Film & Serien' },
  { phrase: 'ICH BIN DEIN VATER', category: 'Film & Serien' },
  { phrase: 'HOUSTON WIR HABEN EIN PROBLEM', category: 'Film & Serien' },
  { phrase: 'BIS DIE UNENDLICHKEIT UND WEITER', category: 'Film & Serien' },
  { phrase: 'MEIN SCHATZ', category: 'Film & Serien' },
  { phrase: 'WINTER KOMMT', category: 'Film & Serien' },
  { phrase: 'ICH KOMME WIEDER', category: 'Film & Serien' },
  { phrase: 'DAS LEBEN IST WIE EINE SCHACHTEL PRALINEN', category: 'Film & Serien' },
  { phrase: 'HAKUNA MATATA', category: 'Film & Serien' },
  { phrase: 'NACH DEN STERNEN GREIFEN', category: 'Film & Serien' },

  // Essen & Trinken
  { phrase: 'SCHWARZWÄLDER KIRSCHTORTE', category: 'Essen & Trinken' },
  { phrase: 'BAYERISCHE WEISSWURST MIT BREZEL', category: 'Essen & Trinken' },
  { phrase: 'WIENER SCHNITZEL MIT KARTOFFELSALAT', category: 'Essen & Trinken' },
  { phrase: 'CURRYWURST MIT POMMES', category: 'Essen & Trinken' },
  { phrase: 'SPAGHETTI BOLOGNESE', category: 'Essen & Trinken' },
  { phrase: 'APFELSTRUDEL MIT VANILLESOSSE', category: 'Essen & Trinken' },
  { phrase: 'HEISSE SCHOKOLADE MIT SAHNE', category: 'Essen & Trinken' },
  { phrase: 'FRISCHER OBSTKUCHEN VOM BÄCKER', category: 'Essen & Trinken' },
  { phrase: 'KARTOFFELPUFFER MIT APFELMUS', category: 'Essen & Trinken' },
  { phrase: 'KAISERSCHMARRN MIT PUDERZUCKER', category: 'Essen & Trinken' },

  // Alltag
  { phrase: 'MORGENS ERSTMAL EINEN KAFFEE', category: 'Alltag' },
  { phrase: 'DAS WOCHENENDE IST ZU KURZ', category: 'Alltag' },
  { phrase: 'HEUTE IST EIN GUTER TAG', category: 'Alltag' },
  { phrase: 'ZUSAMMEN SIND WIR STARK', category: 'Alltag' },
  { phrase: 'EINMAL UM DIE GANZE WELT', category: 'Alltag' },
  { phrase: 'DAS BESTE KOMMT NOCH', category: 'Alltag' },
  { phrase: 'LACHEN IST DIE BESTE MEDIZIN', category: 'Alltag' },
  { phrase: 'FREUNDE SIND DIE FAMILIE DIE MAN SICH AUSSUCHT', category: 'Alltag' },
  { phrase: 'JEDER TAG IST EIN NEUER ANFANG', category: 'Alltag' },
  { phrase: 'GENIESSE DEN AUGENBLICK', category: 'Alltag' },

  // Musik
  { phrase: 'STAIRWAY TO HEAVEN', category: 'Musik' },
  { phrase: 'BOHEMIAN RHAPSODY VON QUEEN', category: 'Musik' },
  { phrase: 'ALLE MEINE ENTCHEN', category: 'Musik' },
  { phrase: 'FREUDE SCHÖNER GÖTTERFUNKEN', category: 'Musik' },
  { phrase: 'EIN HOCH AUF UNS', category: 'Musik' },
  { phrase: 'ÜBER DEN WOLKEN', category: 'Musik' },
  { phrase: 'ATEMLOS DURCH DIE NACHT', category: 'Musik' },
  { phrase: 'STERNE LEUCHTEN FÜR DICH', category: 'Musik' },
  { phrase: 'TANZ MIT MIR BIS ZUM MORGEN', category: 'Musik' },
  { phrase: 'DIE GEDANKEN SIND FREI', category: 'Musik' },

  // Sport
  { phrase: 'OLYMPISCHE SOMMERSPIELE', category: 'Sport' },
  { phrase: 'ELFMETERSCHIESSEN IM FINALE', category: 'Sport' },
  { phrase: 'WELTMEISTER IM FUSSBALL', category: 'Sport' },
  { phrase: 'GOLD SILBER UND BRONZE', category: 'Sport' },
  { phrase: 'SCHNELLER HÖHER WEITER', category: 'Sport' },
  { phrase: 'MARATHON DURCH DIE STADT', category: 'Sport' },
  { phrase: 'CHAMPIONS LEAGUE FINALE', category: 'Sport' },
  { phrase: 'DOPPELTER RITTBERGER', category: 'Sport' },
  { phrase: 'STAFFELLAUF BEI DEN OLYMPISCHEN SPIELEN', category: 'Sport' },
  { phrase: 'POKALSIEGER DES JAHRES', category: 'Sport' },
];

// ============================================
// QUIZ CHAMP - Fragen mit 4 Antwortmöglichkeiten
// ============================================

export const QUIZ_CHAMP_QUESTIONS: QuizChampQuestion[] = [
  // === ALLGEMEINWISSEN (50 Fragen) ===
  { id: 'qc1', question: 'Wie viele Planeten hat unser Sonnensystem?', options: ['6', '7', '8', '9'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc2', question: 'Welches chemische Element hat das Symbol "Au"?', options: ['Silber', 'Gold', 'Kupfer', 'Aluminium'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc3', question: 'Wie viele Kontinente gibt es auf der Erde?', options: ['4', '5', '6', '7'], correctIndex: 3, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc4', question: 'Was ist die Hauptstadt von Australien?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc5', question: 'Wie viele Zähne hat ein erwachsener Mensch?', options: ['28', '30', '32', '36'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc6', question: 'Welcher Planet ist der Sonne am nächsten?', options: ['Venus', 'Mars', 'Merkur', 'Erde'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc7', question: 'Was ist das größte Säugetier der Welt?', options: ['Elefant', 'Blauwal', 'Giraffe', 'Nilpferd'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc8', question: 'Welches Metall ist bei Raumtemperatur flüssig?', options: ['Blei', 'Quecksilber', 'Zink', 'Zinn'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc9', question: 'Wie viele Knochen hat ein erwachsener Mensch?', options: ['186', '196', '206', '226'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc10', question: 'Welches Gas atmen Pflanzen hauptsächlich ein?', options: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid', 'Helium'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc11', question: 'Welches Vitamin produziert der Körper durch Sonnenlicht?', options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], correctIndex: 3, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc12', question: 'Wie viele Herzkammern hat ein Mensch?', options: ['2', '3', '4', '6'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc13', question: 'Welches Land hat die meisten Einwohner?', options: ['Indien', 'China', 'USA', 'Indonesien'], correctIndex: 0, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc14', question: 'Was ist der längste Fluss der Welt?', options: ['Amazonas', 'Nil', 'Jangtse', 'Mississippi'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc15', question: 'Wie heißt der größte Ozean der Erde?', options: ['Atlantik', 'Indischer Ozean', 'Pazifik', 'Arktischer Ozean'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc16', question: 'Was ist die Lichtgeschwindigkeit pro Sekunde (gerundet)?', options: ['100.000 km', '200.000 km', '300.000 km', '500.000 km'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'hard' },
  { id: 'qc17', question: 'Wie viele Buchstaben hat das deutsche Alphabet?', options: ['24', '26', '28', '30'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc18', question: 'Welches Organ reinigt das Blut?', options: ['Leber', 'Niere', 'Milz', 'Herz'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc19', question: 'Was ist das härteste natürliche Material?', options: ['Stahl', 'Diamant', 'Titan', 'Quarz'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc20', question: 'Wie viele Sinne hat der Mensch klassisch?', options: ['3', '4', '5', '6'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'qc21', question: 'Welches Tier hat die längste Lebenserwartung?', options: ['Elefant', 'Schildkröte', 'Wal', 'Grönlandhai'], correctIndex: 3, category: 'Allgemeinwissen', difficulty: 'hard' },
  { id: 'qc22', question: 'Was ist die chemische Formel für Kochsalz?', options: ['NaCI', 'NaCl', 'KCl', 'CaCl'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc23', question: 'Welches Land hat die meisten Zeitzonen?', options: ['Russland', 'USA', 'Frankreich', 'China'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'hard' },
  { id: 'qc24', question: 'Wie viele Liter Blut hat ein erwachsener Mensch?', options: ['3-4 Liter', '5-6 Liter', '7-8 Liter', '9-10 Liter'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'qc25', question: 'Welches ist das kleinste Land der Welt?', options: ['Monaco', 'Vatikanstadt', 'San Marino', 'Liechtenstein'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },

  // === GEOGRAPHIE (40 Fragen) ===
  { id: 'qc26', question: 'Welches ist das größte Land der Welt?', options: ['Kanada', 'China', 'Russland', 'USA'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc27', question: 'In welchem Land liegt Machu Picchu?', options: ['Mexiko', 'Peru', 'Chile', 'Kolumbien'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc28', question: 'Welcher Fluss fließt durch Paris?', options: ['Rhein', 'Seine', 'Loire', 'Themse'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc29', question: 'Wie heißt die Hauptstadt von Kanada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctIndex: 2, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc30', question: 'Welches ist der höchste Berg der Welt?', options: ['K2', 'Mount Everest', 'Kangchendzönga', 'Makalu'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc31', question: 'Wie heißt die größte Insel der Welt?', options: ['Madagaskar', 'Grönland', 'Borneo', 'Sumatra'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc32', question: 'Wie heißt die Hauptstadt von Japan?', options: ['Osaka', 'Kyoto', 'Tokio', 'Yokohama'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc33', question: 'Wie heißt die Hauptstadt von Brasilien?', options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'], correctIndex: 2, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc34', question: 'An welchem Meer liegt Barcelona?', options: ['Atlantik', 'Mittelmeer', 'Schwarzes Meer', 'Nordsee'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc35', question: 'Welcher See ist der größte der Welt?', options: ['Viktoriasee', 'Kaspisches Meer', 'Baikalsee', 'Oberer See'], correctIndex: 1, category: 'Geographie', difficulty: 'hard' },
  { id: 'qc36', question: 'Welches Land hat die Form eines Stiefels?', options: ['Spanien', 'Italien', 'Griechenland', 'Portugal'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc37', question: 'In welchem Kontinent liegt Ägypten?', options: ['Asien', 'Afrika', 'Europa', 'Naher Osten'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc38', question: 'Welcher Fluss fließt durch London?', options: ['Rhein', 'Seine', 'Themse', 'Donau'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc39', question: 'Wie heißt die Hauptstadt der Türkei?', options: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc40', question: 'Welcher Staat ist der größte in den USA?', options: ['Texas', 'Alaska', 'Kalifornien', 'Montana'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc41', question: 'In welchem Land liegt der Kilimandscharo?', options: ['Kenia', 'Tansania', 'Uganda', 'Äthiopien'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc42', question: 'Welches Land grenzt NICHT an Deutschland?', options: ['Tschechien', 'Slowenien', 'Belgien', 'Dänemark'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'qc43', question: 'Was ist die Hauptstadt von Neuseeland?', options: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], correctIndex: 1, category: 'Geographie', difficulty: 'hard' },
  { id: 'qc44', question: 'Welcher Fluss fließt durch Wien?', options: ['Rhein', 'Elbe', 'Donau', 'Moldau'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'qc45', question: 'Wie heißt die Hauptstadt von Island?', options: ['Oslo', 'Helsinki', 'Reykjavik', 'Kopenhagen'], correctIndex: 2, category: 'Geographie', difficulty: 'medium' },

  // === GESCHICHTE (35 Fragen) ===
  { id: 'qc46', question: 'In welchem Jahr fiel die Berliner Mauer?', options: ['1987', '1989', '1990', '1991'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc47', question: 'Wer war der erste Mensch auf dem Mond?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc48', question: 'Wann begann der Erste Weltkrieg?', options: ['1912', '1914', '1916', '1918'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc49', question: 'Wer erfand den Buchdruck mit beweglichen Lettern?', options: ['Gutenberg', 'Luther', 'Dürer', 'Kepler'], correctIndex: 0, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc50', question: 'In welchem Jahr entdeckte Kolumbus Amerika?', options: ['1482', '1492', '1502', '1512'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc51', question: 'Wann wurde die Titanic versenkt?', options: ['1910', '1912', '1914', '1916'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc52', question: 'Wer war der erste deutsche Bundeskanzler?', options: ['Willy Brandt', 'Konrad Adenauer', 'Ludwig Erhard', 'Helmut Schmidt'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc53', question: 'In welchem Jahr wurde Deutschland wiedervereinigt?', options: ['1988', '1989', '1990', '1991'], correctIndex: 2, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc54', question: 'Wer schrieb "Das Kapital"?', options: ['Lenin', 'Marx', 'Engels', 'Hegel'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc55', question: 'Wann wurde die EU als EWG gegründet?', options: ['1947', '1952', '1957', '1967'], correctIndex: 2, category: 'Geschichte', difficulty: 'hard' },
  { id: 'qc56', question: 'Welcher König wurde in der Französischen Revolution hingerichtet?', options: ['Ludwig XIV', 'Ludwig XV', 'Ludwig XVI', 'Ludwig XVIII'], correctIndex: 2, category: 'Geschichte', difficulty: 'hard' },
  { id: 'qc57', question: 'Wann endete der Zweite Weltkrieg in Europa?', options: ['1944', '1945', '1946', '1947'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc58', question: 'Welche Zivilisation baute die Pyramiden von Gizeh?', options: ['Römisches Reich', 'Altes Ägypten', 'Persisches Reich', 'Griechisches Reich'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc59', question: 'Wer malte die Sixtinische Kapelle?', options: ['Leonardo da Vinci', 'Raffael', 'Michelangelo', 'Donatello'], correctIndex: 2, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc60', question: 'In welchem Jahrhundert lebte Leonardo da Vinci?', options: ['14. Jh.', '15./16. Jh.', '17. Jh.', '18. Jh.'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc61', question: 'Welches Land war KEINE Achsenmacht im WW2?', options: ['Japan', 'Spanien', 'Italien', 'Deutschland'], correctIndex: 1, category: 'Geschichte', difficulty: 'hard' },
  { id: 'qc62', question: 'Wann fand die Mondlandung statt?', options: ['1967', '1969', '1971', '1973'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc63', question: 'Wer war der erste Präsident der USA?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'qc64', question: 'Wann wurde die UNO gegründet?', options: ['1940', '1945', '1950', '1955'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'qc65', question: 'Welcher Krieg dauerte nominell 100 Jahre?', options: ['Engländer vs. Franzosen', 'Römer vs. Griechen', 'Spanier vs. Portugiesen', 'Osmanen vs. Habsburger'], correctIndex: 0, category: 'Geschichte', difficulty: 'medium' },

  // === WISSENSCHAFT & TECHNIK (40 Fragen) ===
  { id: 'qc66', question: 'Wer entwickelte die Relativitätstheorie?', options: ['Newton', 'Einstein', 'Hawking', 'Bohr'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc67', question: 'Was ist H2O?', options: ['Sauerstoff', 'Wasser', 'Wasserstoff', 'Salzsäure'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc68', question: 'Welches Teilchen hat eine negative Ladung?', options: ['Proton', 'Neutron', 'Elektron', 'Photon'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc69', question: 'Welches Element ist das häufigste im Universum?', options: ['Sauerstoff', 'Kohlenstoff', 'Wasserstoff', 'Helium'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc70', question: 'Wer entdeckte das Penicillin?', options: ['Fleming', 'Pasteur', 'Koch', 'Jenner'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc71', question: 'Was ist die Einheit für elektrischen Widerstand?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc72', question: 'Wie viele Chromosomen hat ein Mensch?', options: ['23', '44', '46', '48'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc73', question: 'Welches Organ produziert Insulin?', options: ['Leber', 'Bauchspeicheldrüse', 'Niere', 'Milz'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc74', question: 'Siedepunkt von Wasser auf Meereshöhe?', options: ['90°C', '95°C', '100°C', '110°C'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc75', question: 'Welches Gas dominiert unsere Atmosphäre?', options: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid', 'Argon'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc76', question: 'Was misst ein Seismograph?', options: ['Luftdruck', 'Erdbeben', 'Windstärke', 'Temperatur'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc77', question: 'Wie schnell ist Schall in der Luft (ca.)?', options: ['170 m/s', '340 m/s', '540 m/s', '740 m/s'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'hard' },
  { id: 'qc78', question: 'Was ist die kleinste Einheit des Lebens?', options: ['Atom', 'Molekül', 'Zelle', 'Organelle'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc79', question: 'Wie heißt das Zentrum einer Zelle?', options: ['Zellkern', 'Mitochondrium', 'Ribosom', 'Zellwand'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc80', question: 'Welcher Planet hat die meisten Monde?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptun'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'hard' },
  { id: 'qc81', question: 'Was ist die Einheit der elektrischen Spannung?', options: ['Ampere', 'Ohm', 'Watt', 'Volt'], correctIndex: 3, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc82', question: 'Welches Tier hat das größte Gehirn?', options: ['Elefant', 'Pottwal', 'Mensch', 'Delfin'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'hard' },
  { id: 'qc83', question: 'Was ist die Hauptfunktion der Mitochondrien?', options: ['Verdauung', 'Energieproduktion', 'Zellabwehr', 'Zellteilung'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'qc84', question: 'Welches Gas entsteht bei der Photosynthese?', options: ['Kohlendioxid', 'Stickstoff', 'Sauerstoff', 'Wasserstoff'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'qc85', question: 'Was ist die chemische Formel für Traubenzucker?', options: ['C6H12O6', 'C12H22O11', 'H2O', 'NaCl'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'hard' },

  // === SPORT (30 Fragen) ===
  { id: 'qc86', question: 'Wie viele Spieler hat eine Fußballmannschaft?', options: ['9', '10', '11', '12'], correctIndex: 2, category: 'Sport', difficulty: 'easy' },
  { id: 'qc87', question: 'In welchem Sport gibt es einen "Slam Dunk"?', options: ['Football', 'Basketball', 'Volleyball', 'Handball'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'qc88', question: 'Welches Land hat die meisten Fußball-WM-Titel?', options: ['Deutschland', 'Argentinien', 'Brasilien', 'Italien'], correctIndex: 2, category: 'Sport', difficulty: 'easy' },
  { id: 'qc89', question: 'Wie viele Ringe hat das olympische Symbol?', options: ['3', '4', '5', '6'], correctIndex: 2, category: 'Sport', difficulty: 'easy' },
  { id: 'qc90', question: 'Welches Land gewann die Fußball-WM 2014?', options: ['Brasilien', 'Deutschland', 'Argentinien', 'Spanien'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'qc91', question: 'Wo fanden die ersten modernen Olympischen Spiele statt?', options: ['Rom', 'Paris', 'Athen', 'London'], correctIndex: 2, category: 'Sport', difficulty: 'medium' },
  { id: 'qc92', question: 'Wie lange dauert ein Eishockey-Drittel?', options: ['15 Min', '20 Min', '25 Min', '30 Min'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'qc93', question: 'Wie viele Punkte gibt es für einen Touchdown?', options: ['5', '6', '7', '8'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'qc94', question: 'In welchem Sport wird ein Puck verwendet?', options: ['Eishockey', 'Curling', 'Feldhockey', 'Floorball'], correctIndex: 0, category: 'Sport', difficulty: 'easy' },
  { id: 'qc95', question: 'Wie lange läuft man bei einem Marathon?', options: ['40,195 km', '42,195 km', '44,195 km', '45 km'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'qc96', question: 'Welche Farbe hat die 8er-Kugel beim Billard?', options: ['Rot', 'Schwarz', 'Blau', 'Grün'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'qc97', question: 'In welcher Sportart gibt es einen "Albatross"?', options: ['Tennis', 'Golf', 'Badminton', 'Cricket'], correctIndex: 1, category: 'Sport', difficulty: 'hard' },
  { id: 'qc98', question: 'Wie viele Bahnen hat ein olympisches Schwimmbecken?', options: ['6', '8', '10', '12'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'qc99', question: 'Welcher Tennisspieler hat die meisten Grand Slams?', options: ['Federer', 'Nadal', 'Djokovic', 'Sampras'], correctIndex: 2, category: 'Sport', difficulty: 'medium' },
  { id: 'qc100', question: 'Wie viele Spieler stehen beim Basketball auf dem Feld?', options: ['5 pro Team', '6 pro Team', '7 pro Team', '8 pro Team'], correctIndex: 0, category: 'Sport', difficulty: 'easy' },

  // === UNTERHALTUNG & KULTUR (40 Fragen) ===
  { id: 'qc101', question: 'Wer sang "Thriller"?', options: ['Prince', 'Michael Jackson', 'Whitney Houston', 'Stevie Wonder'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc102', question: 'Welche Band sang "Bohemian Rhapsody"?', options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc103', question: 'Wer malte die Mona Lisa?', options: ['Michelangelo', 'Leonardo da Vinci', 'Raffael', 'Rembrandt'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc104', question: 'Wer ist der Autor von "Harry Potter"?', options: ['J.R.R. Tolkien', 'J.K. Rowling', 'Stephen King', 'Roald Dahl'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc105', question: 'Welche Serie spielt in Westeros?', options: ['Vikings', 'Game of Thrones', 'The Witcher', 'Lord of the Rings'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc106', question: 'Wer spielte Iron Man im MCU?', options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc107', question: 'In welchem Film sagt man "Möge die Macht mit dir sein"?', options: ['Star Trek', 'Star Wars', 'Herr der Ringe', 'Avatar'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc108', question: 'Wer schrieb "Romeo und Julia"?', options: ['Goethe', 'Shakespeare', 'Schiller', 'Molière'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc109', question: 'In welchem Jahr kam das erste iPhone?', options: ['2005', '2007', '2009', '2010'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'qc110', question: 'Wer komponierte die "Neunte Symphonie"?', options: ['Mozart', 'Bach', 'Beethoven', 'Haydn'], correctIndex: 2, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'qc111', question: 'Welcher Disney-Film hat eine Eiskönigin?', options: ['Frozen', 'Moana', 'Tangled', 'Brave'], correctIndex: 0, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc112', question: 'Wer singt "Bad Guy"?', options: ['Taylor Swift', 'Billie Eilish', 'Ariana Grande', 'Dua Lipa'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc113', question: 'Welcher Streaming-Dienst produziert "Stranger Things"?', options: ['Amazon Prime', 'Netflix', 'Disney+', 'HBO Max'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc114', question: 'Wer schrieb "Die Verwandlung"?', options: ['Kafka', 'Hesse', 'Mann', 'Brecht'], correctIndex: 0, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'qc115', question: 'Welche Farbe hat Supermans Umhang?', options: ['Blau', 'Rot', 'Gelb', 'Grün'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc116', question: 'In welchem Land wurde das Oktoberfest geboren?', options: ['Österreich', 'Deutschland', 'Schweiz', 'Tschechien'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc117', question: 'Wie heißt das Videospiel mit dem Klempner?', options: ['Sonic', 'Super Mario', 'Zelda', 'Donkey Kong'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc118', question: 'Welches Instrument spielt ein Pianist?', options: ['Geige', 'Klavier', 'Gitarre', 'Flöte'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc119', question: 'In welcher Stadt steht die Freiheitsstatue?', options: ['Washington', 'New York', 'Boston', 'Philadelphia'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc120', question: 'Wer schrieb "Faust"?', options: ['Schiller', 'Goethe', 'Kafka', 'Lessing'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc121', question: 'Welche Farbe hat der Hulk?', options: ['Rot', 'Blau', 'Grün', 'Gelb'], correctIndex: 2, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc122', question: 'Wer ist der Regisseur von "Inception"?', options: ['Spielberg', 'Nolan', 'Tarantino', 'Scorsese'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'qc123', question: 'Welche Band sang "Yesterday"?', options: ['Rolling Stones', 'The Beatles', 'The Who', 'Led Zeppelin'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'qc124', question: 'In welchem Film wird "Rosebud" gesagt?', options: ['Casablanca', 'Citizen Kane', 'Gone with the Wind', 'The Godfather'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'hard' },
  { id: 'qc125', question: 'Welcher Hogwarts-Haus gehört Harry Potter an?', options: ['Slytherin', 'Ravenclaw', 'Hufflepuff', 'Gryffindor'], correctIndex: 3, category: 'Unterhaltung', difficulty: 'easy' },

  // === ESSEN & TRINKEN (15 Fragen) ===
  { id: 'qc126', question: 'In welchem Land wurde Pizza erfunden?', options: ['Griechenland', 'Italien', 'USA', 'Spanien'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'easy' },
  { id: 'qc127', question: 'Welches Land ist für Sushi bekannt?', options: ['China', 'Thailand', 'Japan', 'Korea'], correctIndex: 2, category: 'Essen & Trinken', difficulty: 'easy' },
  { id: 'qc128', question: 'Aus welcher Bohne wird Schokolade gemacht?', options: ['Kaffeebohne', 'Kakaobohne', 'Vanillebohne', 'Sojabohne'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'easy' },
  { id: 'qc129', question: 'Was ist die Hauptzutat von Guacamole?', options: ['Tomate', 'Avocado', 'Paprika', 'Gurke'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'easy' },
  { id: 'qc130', question: 'Welches Getränk wird aus Hopfen gebraut?', options: ['Wein', 'Bier', 'Whisky', 'Sake'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'easy' },
  { id: 'qc131', question: 'Welches Obst hat den Beinamen "Paradiesapfel"?', options: ['Apfel', 'Birne', 'Tomate', 'Granatapfel'], correctIndex: 2, category: 'Essen & Trinken', difficulty: 'hard' },
  { id: 'qc132', question: 'Aus welchem Land kommt Cheddar-Käse?', options: ['Frankreich', 'Schweiz', 'England', 'Niederlande'], correctIndex: 2, category: 'Essen & Trinken', difficulty: 'medium' },
  { id: 'qc133', question: 'Was ist Wasabi?', options: ['Eine Beere', 'Ein Meerrettich', 'Eine Chili', 'Ein Gewürz'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'medium' },
  { id: 'qc134', question: 'Welches Gewürz ist das teuerste der Welt?', options: ['Vanille', 'Safran', 'Zimt', 'Kardamom'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'medium' },
  { id: 'qc135', question: 'Aus welchem Land stammt Paella?', options: ['Italien', 'Spanien', 'Portugal', 'Griechenland'], correctIndex: 1, category: 'Essen & Trinken', difficulty: 'medium' },

  // === NATUR & TIERE (15 Fragen) ===
  { id: 'qc136', question: 'Welches ist das schnellste Landtier?', options: ['Löwe', 'Gepard', 'Antilope', 'Pferd'], correctIndex: 1, category: 'Natur & Tiere', difficulty: 'easy' },
  { id: 'qc137', question: 'Wie viele Beine hat eine Spinne?', options: ['6', '8', '10', '12'], correctIndex: 1, category: 'Natur & Tiere', difficulty: 'easy' },
  { id: 'qc138', question: 'Welches Tier kann sein Fell farblich ändern?', options: ['Gecko', 'Chamäleon', 'Frosch', 'Tintenfisch'], correctIndex: 1, category: 'Natur & Tiere', difficulty: 'easy' },
  { id: 'qc139', question: 'Welcher Vogel kann rückwärts fliegen?', options: ['Specht', 'Kolibri', 'Adler', 'Papagei'], correctIndex: 1, category: 'Natur & Tiere', difficulty: 'medium' },
  { id: 'qc140', question: 'Wie viele Herzen hat ein Oktopus?', options: ['1', '2', '3', '4'], correctIndex: 2, category: 'Natur & Tiere', difficulty: 'hard' },
  { id: 'qc141', question: 'Welches Tier schläft am meisten pro Tag?', options: ['Katze', 'Faultier', 'Koala', 'Braunbär'], correctIndex: 2, category: 'Natur & Tiere', difficulty: 'medium' },
  { id: 'qc142', question: 'Was ist das größte Raubtier an Land?', options: ['Löwe', 'Tiger', 'Eisbär', 'Grizzlybär'], correctIndex: 2, category: 'Natur & Tiere', difficulty: 'medium' },
  { id: 'qc143', question: 'Welches Tier hat den besten Geruchssinn?', options: ['Hund', 'Elefant', 'Bär', 'Hai'], correctIndex: 2, category: 'Natur & Tiere', difficulty: 'hard' },
  { id: 'qc144', question: 'Wie kommunizieren Bienen den Ort von Nahrung?', options: ['Duft', 'Tanz', 'Summen', 'Berührung'], correctIndex: 1, category: 'Natur & Tiere', difficulty: 'medium' },
  { id: 'qc145', question: 'Welches ist das giftigste Tier der Welt?', options: ['Schwarze Mamba', 'Blauring-Oktopus', 'Pfeilgiftfrosch', 'Irukandji-Qualle'], correctIndex: 3, category: 'Natur & Tiere', difficulty: 'hard' },
];

// ============================================
// ENTWEDER/ODER - Fragen
// ============================================

export const ENTWEDER_ODER_QUESTIONS: EntwederOderQuestion[] = [
  // Essen
  { id: 'eo1', optionA: 'Pizza', optionB: 'Burger', category: 'Essen' },
  { id: 'eo2', optionA: 'Süß', optionB: 'Salzig', category: 'Essen' },
  { id: 'eo3', optionA: 'Kaffee', optionB: 'Tee', category: 'Essen' },
  { id: 'eo4', optionA: 'Frühstück', optionB: 'Abendessen', category: 'Essen' },
  { id: 'eo5', optionA: 'Schokolade', optionB: 'Gummibärchen', category: 'Essen' },
  { id: 'eo6', optionA: 'Italienisch', optionB: 'Asiatisch', category: 'Essen' },
  { id: 'eo7', optionA: 'Kochen', optionB: 'Bestellen', category: 'Essen' },
  { id: 'eo8', optionA: 'Eis', optionB: 'Kuchen', category: 'Essen' },
  { id: 'eo9', optionA: 'Fleisch', optionB: 'Vegetarisch', category: 'Essen' },
  { id: 'eo10', optionA: 'Cola', optionB: 'Fanta', category: 'Essen' },
  { id: 'eo11', optionA: 'Chips', optionB: 'Popcorn', category: 'Essen' },
  { id: 'eo12', optionA: 'Nutella', optionB: 'Marmelade', category: 'Essen' },
  { id: 'eo13', optionA: 'Döner', optionB: 'Sushi', category: 'Essen' },
  { id: 'eo14', optionA: 'Pommes', optionB: 'Reis', category: 'Essen' },
  { id: 'eo15', optionA: 'Wasser', optionB: 'Saft', category: 'Essen' },

  // Lifestyle
  { id: 'eo20', optionA: 'Strand', optionB: 'Berge', category: 'Lifestyle' },
  { id: 'eo21', optionA: 'Früh aufstehen', optionB: 'Spät aufstehen', category: 'Lifestyle' },
  { id: 'eo22', optionA: 'Sommer', optionB: 'Winter', category: 'Lifestyle' },
  { id: 'eo23', optionA: 'Hund', optionB: 'Katze', category: 'Lifestyle' },
  { id: 'eo24', optionA: 'Telefonieren', optionB: 'Texten', category: 'Lifestyle' },
  { id: 'eo25', optionA: 'Duschen', optionB: 'Baden', category: 'Lifestyle' },
  { id: 'eo26', optionA: 'Ordnung', optionB: 'Chaos', category: 'Lifestyle' },
  { id: 'eo27', optionA: 'Stadt', optionB: 'Land', category: 'Lifestyle' },
  { id: 'eo28', optionA: 'Auto', optionB: 'Fahrrad', category: 'Lifestyle' },
  { id: 'eo29', optionA: 'Frühling', optionB: 'Herbst', category: 'Lifestyle' },
  { id: 'eo30', optionA: 'Alleine wohnen', optionB: 'WG', category: 'Lifestyle' },
  { id: 'eo31', optionA: 'Sport', optionB: 'Couch', category: 'Lifestyle' },
  { id: 'eo32', optionA: 'Morgenmensch', optionB: 'Nachtmensch', category: 'Lifestyle' },
  { id: 'eo33', optionA: 'Wochenende zu Hause', optionB: 'Wochenende unterwegs', category: 'Lifestyle' },
  { id: 'eo34', optionA: 'Minimalismus', optionB: 'Sammeln', category: 'Lifestyle' },

  // Unterhaltung
  { id: 'eo40', optionA: 'Netflix', optionB: 'YouTube', category: 'Unterhaltung' },
  { id: 'eo41', optionA: 'Film', optionB: 'Serie', category: 'Unterhaltung' },
  { id: 'eo42', optionA: 'Buch', optionB: 'Podcast', category: 'Unterhaltung' },
  { id: 'eo43', optionA: 'Konzert', optionB: 'Festival', category: 'Unterhaltung' },
  { id: 'eo44', optionA: 'Videospiele', optionB: 'Brettspiele', category: 'Unterhaltung' },
  { id: 'eo45', optionA: 'Komödie', optionB: 'Drama', category: 'Unterhaltung' },
  { id: 'eo46', optionA: 'Spotify', optionB: 'Apple Music', category: 'Unterhaltung' },
  { id: 'eo47', optionA: 'Instagram', optionB: 'TikTok', category: 'Unterhaltung' },
  { id: 'eo48', optionA: 'Horror', optionB: 'Romantik', category: 'Unterhaltung' },
  { id: 'eo49', optionA: 'Action', optionB: 'Sci-Fi', category: 'Unterhaltung' },
  { id: 'eo50', optionA: 'Kino', optionB: 'Streaming', category: 'Unterhaltung' },
  { id: 'eo51', optionA: 'Pop', optionB: 'Rock', category: 'Unterhaltung' },
  { id: 'eo52', optionA: 'Zeichnen', optionB: 'Fotografieren', category: 'Unterhaltung' },
  { id: 'eo53', optionA: 'Theater', optionB: 'Musical', category: 'Unterhaltung' },
  { id: 'eo54', optionA: 'Harry Potter', optionB: 'Herr der Ringe', category: 'Unterhaltung' },

  // Reisen
  { id: 'eo60', optionA: 'Städtetrip', optionB: 'Natururlaub', category: 'Reisen' },
  { id: 'eo61', optionA: 'Fliegen', optionB: 'Zug fahren', category: 'Reisen' },
  { id: 'eo62', optionA: 'Hotel', optionB: 'Airbnb', category: 'Reisen' },
  { id: 'eo63', optionA: 'Alleine reisen', optionB: 'In der Gruppe', category: 'Reisen' },
  { id: 'eo64', optionA: 'Spontan verreisen', optionB: 'Alles planen', category: 'Reisen' },
  { id: 'eo65', optionA: 'Europa', optionB: 'Asien', category: 'Reisen' },
  { id: 'eo66', optionA: 'Camping', optionB: 'Luxushotel', category: 'Reisen' },
  { id: 'eo67', optionA: 'Kreuzfahrt', optionB: 'Roadtrip', category: 'Reisen' },
  { id: 'eo68', optionA: 'Kurztrip', optionB: 'Langzeiturlaub', category: 'Reisen' },
  { id: 'eo69', optionA: 'Abenteuerreise', optionB: 'Strandurlaub', category: 'Reisen' },

  // Persönlichkeit
  { id: 'eo70', optionA: 'Introvertiert', optionB: 'Extrovertiert', category: 'Persönlichkeit' },
  { id: 'eo71', optionA: 'Kopf', optionB: 'Bauch', category: 'Persönlichkeit' },
  { id: 'eo72', optionA: 'Risiko', optionB: 'Sicherheit', category: 'Persönlichkeit' },
  { id: 'eo73', optionA: 'Reden', optionB: 'Zuhören', category: 'Persönlichkeit' },
  { id: 'eo74', optionA: 'Vergangenheit', optionB: 'Zukunft', category: 'Persönlichkeit' },
  { id: 'eo75', optionA: 'Optimist', optionB: 'Realist', category: 'Persönlichkeit' },
  { id: 'eo76', optionA: 'Spontan', optionB: 'Geplant', category: 'Persönlichkeit' },
  { id: 'eo77', optionA: 'Teamplayer', optionB: 'Einzelkämpfer', category: 'Persönlichkeit' },
  { id: 'eo78', optionA: 'Qualität', optionB: 'Quantität', category: 'Persönlichkeit' },
  { id: 'eo79', optionA: 'Kreativ', optionB: 'Analytisch', category: 'Persönlichkeit' },
  { id: 'eo80', optionA: 'Geduldig', optionB: 'Ungeduldig', category: 'Persönlichkeit' },

  // Hypothetisch
  { id: 'eo90', optionA: 'Fliegen können', optionB: 'Unsichtbar sein', category: 'Hypothetisch' },
  { id: 'eo91', optionA: 'Zeitreise in die Zukunft', optionB: 'Zeitreise in die Vergangenheit', category: 'Hypothetisch' },
  { id: 'eo92', optionA: 'Gedanken lesen', optionB: 'Zukunft sehen', category: 'Hypothetisch' },
  { id: 'eo93', optionA: 'Alle Sprachen sprechen', optionB: 'Mit Tieren reden', category: 'Hypothetisch' },
  { id: 'eo94', optionA: 'Nie mehr schlafen müssen', optionB: 'Nie mehr essen müssen', category: 'Hypothetisch' },
  { id: 'eo95', optionA: 'Berühmt und arm', optionB: 'Unbekannt und reich', category: 'Hypothetisch' },
  { id: 'eo96', optionA: 'Ewige Jugend', optionB: 'Unendliches Wissen', category: 'Hypothetisch' },
  { id: 'eo97', optionA: 'Auf dem Mond leben', optionB: 'Unter Wasser leben', category: 'Hypothetisch' },
  { id: 'eo98', optionA: 'Superstärke', optionB: 'Superschnelligkeit', category: 'Hypothetisch' },
  { id: 'eo99', optionA: 'Immer die Wahrheit sagen', optionB: 'Immer lügen müssen', category: 'Hypothetisch' },
];
