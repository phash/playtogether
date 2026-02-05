/**
 * Spielinhalte - Fragen und Daten für alle Spiele
 */

import type {
  WouldYouRatherQuestion,
  MostLikelyQuestion,
  EitherOrQuestion,
  QuizQuestion,
} from '../types/game.js';

// ============================================
// QUIZ - 100 Fragen mit je 3 Antworten
// ============================================

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === ALLGEMEINWISSEN (20 Fragen) ===
  { id: 'q1', question: 'Wie viele Planeten hat unser Sonnensystem?', answers: ['7', '8', '9'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q2', question: 'Welches chemische Element hat das Symbol "Au"?', answers: ['Silber', 'Gold', 'Kupfer'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q3', question: 'Wie viele Kontinente gibt es auf der Erde?', answers: ['5', '6', '7'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q4', question: 'Welches Tier kann am längsten ohne Wasser überleben?', answers: ['Elefant', 'Kamel', 'Känguru-Ratte'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q5', question: 'Was ist die Hauptstadt von Australien?', answers: ['Sydney', 'Melbourne', 'Canberra'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q6', question: 'Wie viele Zähne hat ein erwachsener Mensch normalerweise?', answers: ['28', '32', '36'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q7', question: 'Welcher Planet ist der Sonne am nächsten?', answers: ['Venus', 'Mars', 'Merkur'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q8', question: 'Wie viele Stunden hat ein Tag?', answers: ['12', '24', '48'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q9', question: 'Was ist das größte Säugetier der Welt?', answers: ['Elefant', 'Blauwal', 'Giraffe'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q10', question: 'Welches Metall ist bei Raumtemperatur flüssig?', answers: ['Blei', 'Quecksilber', 'Zink'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q11', question: 'Wie viele Buchstaben hat das deutsche Alphabet?', answers: ['24', '26', '30'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q12', question: 'Welches Organ reinigt das Blut im menschlichen Körper?', answers: ['Leber', 'Niere', 'Milz'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q13', question: 'Was ist der längste Fluss der Welt?', answers: ['Amazonas', 'Nil', 'Jangtse'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q14', question: 'Wie viele Knochen hat ein erwachsener Mensch?', answers: ['186', '206', '226'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q15', question: 'Welches Gas atmen Pflanzen hauptsächlich ein?', answers: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q16', question: 'Was ist die Lichtgeschwindigkeit pro Sekunde (gerundet)?', answers: ['100.000 km', '300.000 km', '500.000 km'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'hard' },
  { id: 'q17', question: 'Welches Land hat die meisten Einwohner?', answers: ['Indien', 'China', 'USA'], correctIndex: 0, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q18', question: 'Wie heißt der größte Ozean der Erde?', answers: ['Atlantik', 'Indischer Ozean', 'Pazifik'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'easy' },
  { id: 'q19', question: 'Wie viele Herzkammern hat ein Mensch?', answers: ['2', '4', '6'], correctIndex: 1, category: 'Allgemeinwissen', difficulty: 'medium' },
  { id: 'q20', question: 'Welches Vitamin produziert der Körper durch Sonnenlicht?', answers: ['Vitamin A', 'Vitamin C', 'Vitamin D'], correctIndex: 2, category: 'Allgemeinwissen', difficulty: 'medium' },

  // === GEOGRAPHIE (15 Fragen) ===
  { id: 'q21', question: 'Welches ist das größte Land der Welt (Fläche)?', answers: ['Kanada', 'China', 'Russland'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'q22', question: 'In welchem Land liegt die Stadt Machu Picchu?', answers: ['Mexiko', 'Peru', 'Chile'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'q23', question: 'Welcher Fluss fließt durch Paris?', answers: ['Rhein', 'Seine', 'Loire'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'q24', question: 'Wie heißt die Hauptstadt von Kanada?', answers: ['Toronto', 'Vancouver', 'Ottawa'], correctIndex: 2, category: 'Geographie', difficulty: 'medium' },
  { id: 'q25', question: 'In welchem Land steht das Kolosseum?', answers: ['Griechenland', 'Italien', 'Spanien'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'q26', question: 'Welches ist der höchste Berg der Welt?', answers: ['K2', 'Mount Everest', 'Kangchendzönga'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'q27', question: 'In welchem Kontinent liegt Ägypten hauptsächlich?', answers: ['Asien', 'Afrika', 'Europa'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'q28', question: 'Wie heißt die größte Insel der Welt?', answers: ['Madagaskar', 'Grönland', 'Borneo'], correctIndex: 1, category: 'Geographie', difficulty: 'medium' },
  { id: 'q29', question: 'Welches Land hat die Form eines Stiefels?', answers: ['Spanien', 'Italien', 'Griechenland'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },
  { id: 'q30', question: 'Wie heißt die Hauptstadt von Japan?', answers: ['Osaka', 'Kyoto', 'Tokio'], correctIndex: 2, category: 'Geographie', difficulty: 'easy' },
  { id: 'q31', question: 'Welcher See ist der größte der Welt?', answers: ['Viktoriasee', 'Kaspisches Meer', 'Baikalsee'], correctIndex: 1, category: 'Geographie', difficulty: 'hard' },
  { id: 'q32', question: 'In welchem Land liegt die Sahara hauptsächlich?', answers: ['Ägypten', 'Algerien', 'Marokko'], correctIndex: 1, category: 'Geographie', difficulty: 'hard' },
  { id: 'q33', question: 'Wie heißt die Hauptstadt von Brasilien?', answers: ['São Paulo', 'Rio de Janeiro', 'Brasília'], correctIndex: 2, category: 'Geographie', difficulty: 'medium' },
  { id: 'q34', question: 'Welches Land grenzt an die meisten anderen Länder?', answers: ['Russland', 'China', 'Brasilien'], correctIndex: 1, category: 'Geographie', difficulty: 'hard' },
  { id: 'q35', question: 'An welchem Meer liegt Barcelona?', answers: ['Atlantik', 'Mittelmeer', 'Schwarzes Meer'], correctIndex: 1, category: 'Geographie', difficulty: 'easy' },

  // === GESCHICHTE (15 Fragen) ===
  { id: 'q36', question: 'In welchem Jahr fiel die Berliner Mauer?', answers: ['1987', '1989', '1991'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'q37', question: 'Wer war der erste Mensch auf dem Mond?', answers: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'q38', question: 'In welchem Jahrhundert lebte Leonardo da Vinci?', answers: ['14. Jahrhundert', '15./16. Jahrhundert', '17. Jahrhundert'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q39', question: 'Welches Imperium baute die Pyramiden von Gizeh?', answers: ['Römisches Reich', 'Altes Ägypten', 'Persisches Reich'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'q40', question: 'Wann begann der Erste Weltkrieg?', answers: ['1912', '1914', '1916'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q41', question: 'Wer erfand den Buchdruck mit beweglichen Lettern?', answers: ['Gutenberg', 'Luther', 'Dürer'], correctIndex: 0, category: 'Geschichte', difficulty: 'easy' },
  { id: 'q42', question: 'In welchem Jahr wurde Amerika von Kolumbus entdeckt?', answers: ['1482', '1492', '1502'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q43', question: 'Welcher König von Frankreich wurde während der Revolution hingerichtet?', answers: ['Ludwig XIV', 'Ludwig XVI', 'Ludwig XVIII'], correctIndex: 1, category: 'Geschichte', difficulty: 'hard' },
  { id: 'q44', question: 'Wann wurde die Titanic versenkt?', answers: ['1910', '1912', '1914'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q45', question: 'Welches Land war KEINE Achsenmacht im Zweiten Weltkrieg?', answers: ['Japan', 'Spanien', 'Italien'], correctIndex: 1, category: 'Geschichte', difficulty: 'hard' },
  { id: 'q46', question: 'Wer war der erste deutsche Bundeskanzler?', answers: ['Willy Brandt', 'Konrad Adenauer', 'Ludwig Erhard'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q47', question: 'In welchem Jahr wurde Deutschland wiedervereinigt?', answers: ['1989', '1990', '1991'], correctIndex: 1, category: 'Geschichte', difficulty: 'easy' },
  { id: 'q48', question: 'Welcher Krieg dauerte 100 Jahre?', answers: ['Engländer vs. Franzosen', 'Römer vs. Griechen', 'Spanier vs. Portugiesen'], correctIndex: 0, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q49', question: 'Wer schrieb "Das Kapital"?', answers: ['Lenin', 'Marx', 'Engels'], correctIndex: 1, category: 'Geschichte', difficulty: 'medium' },
  { id: 'q50', question: 'Wann wurde die EU gegründet (als EWG)?', answers: ['1947', '1957', '1967'], correctIndex: 1, category: 'Geschichte', difficulty: 'hard' },

  // === WISSENSCHAFT & TECHNIK (15 Fragen) ===
  { id: 'q51', question: 'Wer entwickelte die Relativitätstheorie?', answers: ['Newton', 'Einstein', 'Hawking'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'q52', question: 'Was ist H2O?', answers: ['Sauerstoff', 'Wasser', 'Wasserstoff'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'q53', question: 'Welches Teilchen hat eine negative Ladung?', answers: ['Proton', 'Neutron', 'Elektron'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q54', question: 'Wie heißt das Zentrum einer Zelle?', answers: ['Zellkern', 'Mitochondrium', 'Ribosom'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'q55', question: 'Welcher Planet hat die meisten Monde?', answers: ['Jupiter', 'Saturn', 'Uranus'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'hard' },
  { id: 'q56', question: 'Was misst ein Seismograph?', answers: ['Luftdruck', 'Erdbeben', 'Windstärke'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q57', question: 'Welches Element ist das häufigste im Universum?', answers: ['Sauerstoff', 'Kohlenstoff', 'Wasserstoff'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q58', question: 'Wer entdeckte das Penicillin?', answers: ['Fleming', 'Pasteur', 'Koch'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q59', question: 'Was ist die Einheit für elektrischen Widerstand?', answers: ['Volt', 'Ampere', 'Ohm'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q60', question: 'Welches Gas macht den größten Teil unserer Atmosphäre aus?', answers: ['Sauerstoff', 'Stickstoff', 'Kohlendioxid'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q61', question: 'Was ist der Siedepunkt von Wasser auf Meereshöhe?', answers: ['90°C', '100°C', '110°C'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'q62', question: 'Wie viele Chromosomen hat ein Mensch?', answers: ['23', '46', '48'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q63', question: 'Welches Organ produziert Insulin?', answers: ['Leber', 'Bauchspeicheldrüse', 'Niere'], correctIndex: 1, category: 'Wissenschaft', difficulty: 'medium' },
  { id: 'q64', question: 'Was ist die kleinste Einheit des Lebens?', answers: ['Atom', 'Molekül', 'Zelle'], correctIndex: 2, category: 'Wissenschaft', difficulty: 'easy' },
  { id: 'q65', question: 'Wie schnell ist Schall in der Luft (ca.)?', answers: ['340 m/s', '540 m/s', '740 m/s'], correctIndex: 0, category: 'Wissenschaft', difficulty: 'hard' },

  // === SPORT (15 Fragen) ===
  { id: 'q66', question: 'Wie viele Spieler hat eine Fußballmannschaft auf dem Feld?', answers: ['10', '11', '12'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'q67', question: 'In welchem Sport gibt es einen "Slam Dunk"?', answers: ['Football', 'Basketball', 'Volleyball'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'q68', question: 'Wo fanden die ersten modernen Olympischen Spiele statt?', answers: ['Rom', 'Paris', 'Athen'], correctIndex: 2, category: 'Sport', difficulty: 'medium' },
  { id: 'q69', question: 'Wie lange dauert ein Eishockey-Drittel?', answers: ['15 Minuten', '20 Minuten', '25 Minuten'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'q70', question: 'Welches Land hat die meisten Fußball-WM-Titel?', answers: ['Deutschland', 'Argentinien', 'Brasilien'], correctIndex: 2, category: 'Sport', difficulty: 'easy' },
  { id: 'q71', question: 'Wie viele Punkte gibt es für einen Touchdown im Football?', answers: ['5', '6', '7'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'q72', question: 'Welcher Tennisspieler hat die meisten Grand-Slam-Titel?', answers: ['Federer', 'Nadal', 'Djokovic'], correctIndex: 2, category: 'Sport', difficulty: 'medium' },
  { id: 'q73', question: 'In welchem Sport wird ein Puck verwendet?', answers: ['Hockey', 'Curling', 'Beide'], correctIndex: 0, category: 'Sport', difficulty: 'easy' },
  { id: 'q74', question: 'Wie viele Ringe hat das olympische Symbol?', answers: ['4', '5', '6'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'q75', question: 'Welches Land gewann die Fußball-WM 2014?', answers: ['Brasilien', 'Deutschland', 'Argentinien'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'q76', question: 'Wie viele Sätze braucht man mindestens um ein Tennis-Match zu gewinnen?', answers: ['2', '3', '4'], correctIndex: 0, category: 'Sport', difficulty: 'medium' },
  { id: 'q77', question: 'In welcher Sportart gibt es einen "Albatross"?', answers: ['Tennis', 'Golf', 'Badminton'], correctIndex: 1, category: 'Sport', difficulty: 'hard' },
  { id: 'q78', question: 'Wie viele Bahnen hat ein olympisches Schwimmbecken?', answers: ['6', '8', '10'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },
  { id: 'q79', question: 'Welche Farbe hat die 8er-Kugel beim Poolbillard?', answers: ['Rot', 'Schwarz', 'Blau'], correctIndex: 1, category: 'Sport', difficulty: 'easy' },
  { id: 'q80', question: 'Wie lange läuft man bei einem Marathon?', answers: ['40,195 km', '42,195 km', '44,195 km'], correctIndex: 1, category: 'Sport', difficulty: 'medium' },

  // === UNTERHALTUNG & KULTUR (20 Fragen) ===
  { id: 'q81', question: 'Wer sang "Thriller"?', answers: ['Prince', 'Michael Jackson', 'Whitney Houston'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q82', question: 'In welchem Film sagt man "Möge die Macht mit dir sein"?', answers: ['Star Trek', 'Star Wars', 'Herr der Ringe'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q83', question: 'Wer schrieb "Romeo und Julia"?', answers: ['Goethe', 'Shakespeare', 'Schiller'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q84', question: 'Welche Band sang "Bohemian Rhapsody"?', answers: ['The Beatles', 'Queen', 'Led Zeppelin'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q85', question: 'Wer malte die Mona Lisa?', answers: ['Michelangelo', 'Leonardo da Vinci', 'Raffael'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q86', question: 'In welcher Stadt steht die Freiheitsstatue?', answers: ['Washington', 'New York', 'Boston'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q87', question: 'Wer ist der Autor von "Harry Potter"?', answers: ['J.R.R. Tolkien', 'J.K. Rowling', 'Stephen King'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q88', question: 'Welches Instrument spielt ein Pianist?', answers: ['Geige', 'Klavier', 'Gitarre'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q89', question: 'In welchem Jahr kam das erste iPhone auf den Markt?', answers: ['2005', '2007', '2009'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'q90', question: 'Wer spielte Iron Man im MCU?', answers: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q91', question: 'Welche Serie spielt in Westeros?', answers: ['Vikings', 'Game of Thrones', 'The Witcher'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q92', question: 'Wer komponierte die "Neunte Symphonie"?', answers: ['Mozart', 'Bach', 'Beethoven'], correctIndex: 2, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'q93', question: 'In welchem Land wurde Pizza erfunden?', answers: ['Griechenland', 'Italien', 'USA'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q94', question: 'Welcher Disney-Film hat eine Eiskönigin?', answers: ['Frozen', 'Moana', 'Tangled'], correctIndex: 0, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q95', question: 'Wer singt "Bad Guy"?', answers: ['Taylor Swift', 'Billie Eilish', 'Ariana Grande'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q96', question: 'Wie heißt das Videospiel mit dem Klempner Mario?', answers: ['Sonic', 'Super Mario', 'Zelda'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q97', question: 'Welcher Streaming-Dienst produziert "Stranger Things"?', answers: ['Amazon Prime', 'Netflix', 'Disney+'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q98', question: 'Wer schrieb "Die Verwandlung"?', answers: ['Kafka', 'Hesse', 'Mann'], correctIndex: 0, category: 'Unterhaltung', difficulty: 'medium' },
  { id: 'q99', question: 'Welche Farbe hat der Umhang von Superman?', answers: ['Blau', 'Rot', 'Gelb'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
  { id: 'q100', question: 'In welchem Land wurde Oktoberfest geboren?', answers: ['Österreich', 'Deutschland', 'Schweiz'], correctIndex: 1, category: 'Unterhaltung', difficulty: 'easy' },
];

/**
 * Holt zufällige Quiz-Fragen
 */
export function getRandomQuizQuestions(count: number): QuizQuestion[] {
  return shuffleArray(QUIZ_QUESTIONS).slice(0, count);
}

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
