/**
 * Spiel-Typen für die PlayTogether-Plattform
 */

// Verfügbare Spieltypen
export type GameType =
  | 'quiz'
  | 'drawing'
  | 'wordguess'
  | 'reaction'
  // Party & Spaß
  | 'wouldyourather'
  | 'mostlikely'
  | 'eitheror'
  // Wort-Spiele
  | 'wordchain'
  | 'anagram';

export interface GameInfo {
  type: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  category: 'classic' | 'party' | 'word';
}

export const AVAILABLE_GAMES: GameInfo[] = [
  // Klassische Spiele
  {
    type: 'quiz',
    name: 'Quiz Battle',
    description: 'Beantworte Fragen schneller als deine Freunde!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '❓',
    category: 'classic',
  },
  {
    type: 'drawing',
    name: 'Kritzel & Rate',
    description: 'Zeichne und errate, was andere gezeichnet haben!',
    minPlayers: 3,
    maxPlayers: 10,
    icon: '🎨',
    category: 'classic',
  },
  {
    type: 'wordguess',
    name: 'Wort-Raten',
    description: 'Erkläre Wörter ohne sie zu benutzen!',
    minPlayers: 4,
    maxPlayers: 12,
    icon: '💬',
    category: 'classic',
  },
  {
    type: 'reaction',
    name: 'Reaktions-Test',
    description: 'Wer hat die schnellsten Reflexe?',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '⚡',
    category: 'classic',
  },

  // Party & Spaß
  {
    type: 'wouldyourather',
    name: 'Würdest du eher?',
    description: 'Wähle zwischen zwei Optionen und sieh, was andere denken!',
    minPlayers: 2,
    maxPlayers: 12,
    icon: '🤔',
    category: 'party',
  },
  {
    type: 'mostlikely',
    name: 'Wer würde am ehesten?',
    description: 'Stimmt ab, wer aus der Gruppe am ehesten etwas tun würde!',
    minPlayers: 3,
    maxPlayers: 10,
    icon: '👆',
    category: 'party',
  },
  {
    type: 'eitheror',
    name: 'Entweder/Oder',
    description: 'Schnelle Entscheidungen - Pizza oder Burger?',
    minPlayers: 2,
    maxPlayers: 20,
    icon: '⚖️',
    category: 'party',
  },

  // Wort-Spiele
  {
    type: 'wordchain',
    name: 'Wortkette',
    description: 'Der letzte Buchstabe wird zum ersten des nächsten Worts!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '🔗',
    category: 'word',
  },
  {
    type: 'anagram',
    name: 'Anagramme',
    description: 'Bilde so viele Wörter wie möglich aus den Buchstaben!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '🔤',
    category: 'word',
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

// Quiz-spezifische Typen
export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizGameState extends GameState {
  type: 'quiz';
  currentQuestion?: QuizQuestion;
  playerAnswers: Record<string, number | null>;
  questionStartTime: number;
}

export interface QuizAnswer {
  playerId: string;
  answerIndex: number;
  answeredAt: number;
}

// ============================================
// WÜRDEST DU EHER? (Would You Rather)
// ============================================

export interface WouldYouRatherQuestion {
  id: string;
  optionA: string;
  optionB: string;
  category: 'funny' | 'deep' | 'gross' | 'lifestyle';
}

export interface WouldYouRatherGameState extends GameState {
  type: 'wouldyourather';
  currentQuestion?: WouldYouRatherQuestion;
  votes: Record<string, 'A' | 'B' | null>;
  votingComplete: boolean;
  results?: { a: number; b: number };
}

// ============================================
// WER WÜRDE AM EHESTEN? (Most Likely To)
// ============================================

export interface MostLikelyQuestion {
  id: string;
  question: string; // "Wer würde am ehesten...?"
  category: 'funny' | 'embarrassing' | 'talent' | 'lifestyle';
}

export interface MostLikelyGameState extends GameState {
  type: 'mostlikely';
  currentQuestion?: MostLikelyQuestion;
  votes: Record<string, string | null>; // userId -> votedForPlayerId
  votingComplete: boolean;
  results?: Record<string, number>; // playerId -> vote count
}

// ============================================
// ENTWEDER/ODER (Either/Or)
// ============================================

export interface EitherOrQuestion {
  id: string;
  optionA: string;
  optionB: string;
  category: 'food' | 'lifestyle' | 'travel' | 'entertainment';
}

export interface EitherOrGameState extends GameState {
  type: 'eitheror';
  currentQuestion?: EitherOrQuestion;
  votes: Record<string, 'A' | 'B' | null>;
  streak: number; // Consecutive questions
  speedRound: boolean;
}

// ============================================
// WORTKETTE (Word Chain)
// ============================================

export interface WordChainGameState extends GameState {
  type: 'wordchain';
  currentWord: string;
  currentPlayerIndex: number;
  currentPlayerId: string;
  playerOrder: string[];
  usedWords: string[];
  lastLetter: string;
  turnTimeLimit: number;
  eliminatedPlayers: string[];
}

export interface WordChainSubmission {
  playerId: string;
  word: string;
  timestamp: number;
}

// ============================================
// ANAGRAMME (Anagram)
// ============================================

export interface AnagramGameState extends GameState {
  type: 'anagram';
  letters: string[];
  foundWords: Record<string, string[]>; // playerId -> words found
  allValidWords: string[]; // All possible words (hidden from clients)
  minWordLength: number;
  bonusWord?: string; // Longest possible word for bonus
}

export interface AnagramSubmission {
  playerId: string;
  word: string;
  timestamp: number;
}

// ============================================
// Union Type für alle Spielzustände
// ============================================

export type AnyGameState =
  | QuizGameState
  | WouldYouRatherGameState
  | MostLikelyGameState
  | EitherOrGameState
  | WordChainGameState
  | AnagramGameState;
