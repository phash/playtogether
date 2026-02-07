/**
 * Spiel-Typen für die PlayTogether-Plattform
 */

// Verfügbare Spieltypen
export type GameType =
  | 'anagramme'
  | 'quiz_champ'
  | 'entweder_oder'
  | 'gluecksrad'
  | 'tic_tac_toe'
  | 'rock_paper_scissors'
  | 'hangman'
  | 'reaction_test'
  | 'word_guess'
  | 'emoji_draw';

export interface GameInfo {
  type: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  category: 'classic' | 'party' | 'word';
  defaultRounds: number;
  defaultTime: number;
}

export const AVAILABLE_GAMES: GameInfo[] = [
  // Klassische Spiele
  {
    type: 'quiz_champ',
    name: 'Quiz Champ',
    description: 'Beantworte Fragen schneller als deine Freunde! Streak-Bonus!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '🧠',
    category: 'classic',
    defaultRounds: 10,
    defaultTime: 20,
  },
  {
    type: 'tic_tac_toe',
    name: 'Tic Tac Toe',
    description: 'Das klassische Strategiespiel - im Turniermodus!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '❌',
    category: 'classic',
    defaultRounds: 3,
    defaultTime: 10,
  },
  {
    type: 'rock_paper_scissors',
    name: 'Schere Stein Papier',
    description: 'Turnier-Paarungen - wer gewinnt?',
    minPlayers: 2,
    maxPlayers: 16,
    icon: '✊',
    category: 'classic',
    defaultRounds: 3,
    defaultTime: 5,
  },

  // Party & Spass
  {
    type: 'entweder_oder',
    name: 'Entweder/Oder',
    description: 'Was wählt die Mehrheit? Stimme ab!',
    minPlayers: 3,
    maxPlayers: 20,
    icon: '⚖️',
    category: 'party',
    defaultRounds: 10,
    defaultTime: 15,
  },
  {
    type: 'gluecksrad',
    name: 'Glücksrad',
    description: 'Drehe das Rad und löse die Phrase!',
    minPlayers: 2,
    maxPlayers: 6,
    icon: '🎡',
    category: 'party',
    defaultRounds: 3,
    defaultTime: 90,
  },

  // Wort-Spiele
  {
    type: 'anagramme',
    name: 'Anagramme',
    description: 'Entwirre das verwürfelte Wort!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '🔤',
    category: 'word',
    defaultRounds: 8,
    defaultTime: 30,
  },
  {
    type: 'hangman',
    name: 'Galgenmännchen',
    description: 'Errate das Wort Buchstabe für Buchstabe!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '💀',
    category: 'word',
    defaultRounds: 5,
    defaultTime: 60,
  },
  {
    type: 'reaction_test',
    name: 'Reaktions-Test',
    description: 'Reagiere so schnell wie möglich auf das Signal!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '⚡',
    category: 'classic',
    defaultRounds: 5,
    defaultTime: 10,
  },
  {
    type: 'word_guess',
    name: 'Wort-Raten',
    description: 'Erkläre Wörter und lass deine Freunde raten!',
    minPlayers: 4,
    maxPlayers: 12,
    icon: '💬',
    category: 'word',
    defaultRounds: 8,
    defaultTime: 60,
  },
  {
    type: 'emoji_draw',
    name: 'Emoji Malen',
    description: 'Male mit Emojis und lass andere raten!',
    minPlayers: 3,
    maxPlayers: 10,
    icon: '🎨',
    category: 'party',
    defaultRounds: 8,
    defaultTime: 90,
  },
];

export function getGameInfo(type: GameType): GameInfo | undefined {
  return AVAILABLE_GAMES.find((game) => game.type === type);
}

export function getGamesByCategory(category: GameInfo['category']): GameInfo[] {
  return AVAILABLE_GAMES.filter((game) => game.category === category);
}

// Basis-Spielzustand
export interface GameState {
  type: GameType;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;
  timeRemaining: number;
  scores: Record<string, number>;
}

export type GamePhase = 'preparation' | 'active' | 'reveal' | 'scores' | 'end';

// ============================================
// SCORING
// ============================================

/**
 * Berechnet Speed-Bonus (1.0 - 2.0x Multiplikator)
 * Je schneller, desto höher der Bonus
 */
export function calculateSpeedBonus(timeLeftMs: number, maxTimeMs: number): number {
  if (maxTimeMs <= 0) return 1.0;
  const ratio = Math.max(0, Math.min(1, timeLeftMs / maxTimeMs));
  return 1.0 + ratio; // 1.0 (letzte Sekunde) bis 2.0 (sofort)
}

// ============================================
// ANAGRAMME
// ============================================

export interface AnagrammeGameState extends GameState {
  type: 'anagramme';
  scrambledWord: string;
  wordLength: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attempts: Record<string, string[]>; // playerId -> attempted words
  solved: Record<string, boolean>; // playerId -> solved?
  revealedWord?: string; // shown in reveal phase
}

// ============================================
// QUIZ CHAMP
// ============================================

export interface QuizChampQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizChampGameState extends GameState {
  type: 'quiz_champ';
  currentQuestion?: QuizChampQuestion;
  playerAnswers: Record<string, number | null>;
  questionStartTime: number;
  streaks: Record<string, number>; // playerId -> consecutive correct answers
  answerResults: Record<string, { correct: boolean; points: number }>;
  showCorrectAnswer?: boolean;
  correctAnswerIndex?: number;
}

// ============================================
// ENTWEDER/ODER
// ============================================

export interface EntwederOderQuestion {
  id: string;
  optionA: string;
  optionB: string;
  category: string;
}

export interface EntwederOderGameState extends GameState {
  type: 'entweder_oder';
  currentQuestion?: EntwederOderQuestion;
  votes: Record<string, 'A' | 'B' | null>;
  votingComplete: boolean;
  results?: { a: number; b: number; total: number; percentA: number; percentB: number };
}

// ============================================
// GLÜCKSRAD
// ============================================

export type GluecksradSpinResult = 'bankrott' | 'freidrehen' | number; // number = Betrag

export interface GluecksradGameState extends GameState {
  type: 'gluecksrad';
  phrase: string; // With unrevealed letters as _
  category: string;
  revealedLetters: string[];
  currentPlayerId: string;
  playerOrder: string[];
  currentPlayerIndex: number;
  lastSpinResult?: GluecksradSpinResult;
  roundMoney: Record<string, number>; // Money this round (per player)
  canSpin: boolean;
  canGuessLetter: boolean;
  canSolve: boolean;
  canBuyVowel: boolean;
  wrongGuesses: number;
  solved: boolean;
  solvedBy?: string;
}

// ============================================
// TIC TAC TOE
// ============================================

export interface TicTacToeMatch {
  player1: string;
  player2: string;
  board: (string | null)[]; // 9 cells, null = empty, playerId = taken
  currentTurn: string;
  winner?: string | null; // null = draw
  finished: boolean;
}

export interface TicTacToeGameState extends GameState {
  type: 'tic_tac_toe';
  mode: '1v1' | 'tournament';
  matches: TicTacToeMatch[];
  currentMatchIndex: number;
  bracket?: string[][]; // tournament bracket
  tournamentRound: number;
  eliminated: string[];
}

// ============================================
// SCHERE STEIN PAPIER
// ============================================

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export interface RPSMatch {
  player1: string;
  player2: string;
  choices: Record<string, RPSChoice | null>;
  winner?: string | null; // null = draw
  round: number;
  maxRounds: number; // 1 or 3 (best-of-3)
  scores: Record<string, number>;
  finished: boolean;
}

export interface RockPaperScissorsGameState extends GameState {
  type: 'rock_paper_scissors';
  matches: RPSMatch[];
  currentMatchIndex: number;
  bracket?: string[][];
  tournamentRound: number;
  eliminated: string[];
  bestOf: 1 | 3;
  bye?: string; // player with bye (odd player count)
}

// ============================================
// HANGMAN (Galgenmännchen)
// ============================================

export interface HangmanGameState extends GameState {
  type: 'hangman';
  wordDisplay: string; // e.g. "_ A _ _ E"
  wordLength: number;
  category: string;
  guessedLetters: string[];
  correctLetters: string[];
  wrongLetters: string[];
  wrongCount: number;
  maxWrong: number; // 8
  letterGuessedBy: Record<string, string>; // letter -> playerId who guessed it first
  solved: boolean;
  solvedBy?: string;
  revealedWord?: string;
}

// ============================================
// REAKTIONS-TEST
// ============================================

export interface ReactionTestRoundResult {
  playerId: string;
  reactionTimeMs: number | null; // null = false start
  points: number;
}

export interface ReactionTestGameState extends GameState {
  type: 'reaction_test';
  signalActive: boolean;
  reactionTimes: Record<string, number | null>; // playerId -> ms or null (false start)
  falseStarts: Record<string, boolean>;
  roundResults: ReactionTestRoundResult[];
  allReacted: boolean;
}

// ============================================
// WORT-RATEN
// ============================================

export interface WordGuessEntry {
  playerId: string;
  guess: string;
  correct: boolean;
  timestamp: number;
}

export interface WordGuessGameState extends GameState {
  type: 'word_guess';
  explainerId: string;
  word: string; // visible to all, client hides for non-explainer
  wordLength: number;
  category: string;
  guesses: WordGuessEntry[];
  solved: boolean;
  solvedBy?: string;
  playerOrder: string[];
  skipped: boolean;
}

// ============================================
// EMOJI MALEN
// ============================================

export interface EmojiPlacement {
  emoji: string;
  position: number; // index in grid (0-15 for 4x4)
}

export interface EmojiDrawGameState extends GameState {
  type: 'emoji_draw';
  drawerId: string;
  word: string; // visible to all, client hides for non-drawer
  category: string;
  emojiBoard: (string | null)[]; // 16 cells (4x4)
  guesses: WordGuessEntry[]; // reuse same structure
  solved: boolean;
  solvedBy?: string;
  playerOrder: string[];
  availableEmojis: string[];
}

// ============================================
// Union Type für alle Spielzustände
// ============================================

export type AnyGameState =
  | AnagrammeGameState
  | QuizChampGameState
  | EntwederOderGameState
  | GluecksradGameState
  | TicTacToeGameState
  | RockPaperScissorsGameState
  | HangmanGameState
  | ReactionTestGameState
  | WordGuessGameState
  | EmojiDrawGameState;
