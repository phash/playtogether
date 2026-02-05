/**
 * Spiel-Typen für die PlayTogether-Plattform
 */

// Verfügbare Spieltypen
export type GameType = 'quiz' | 'drawing' | 'wordguess' | 'reaction';

export interface GameInfo {
  type: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
}

export const AVAILABLE_GAMES: GameInfo[] = [
  {
    type: 'quiz',
    name: 'Quiz Battle',
    description: 'Beantworte Fragen schneller als deine Freunde!',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '❓',
  },
  {
    type: 'drawing',
    name: 'Kritzel & Rate',
    description: 'Zeichne und errate, was andere gezeichnet haben!',
    minPlayers: 3,
    maxPlayers: 10,
    icon: '🎨',
  },
  {
    type: 'wordguess',
    name: 'Wort-Raten',
    description: 'Erkläre Wörter ohne sie zu benutzen!',
    minPlayers: 4,
    maxPlayers: 12,
    icon: '💬',
  },
  {
    type: 'reaction',
    name: 'Reaktions-Test',
    description: 'Wer hat die schnellsten Reflexe?',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '⚡',
  },
];

export function getGameInfo(type: GameType): GameInfo | undefined {
  return AVAILABLE_GAMES.find((game) => game.type === type);
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
