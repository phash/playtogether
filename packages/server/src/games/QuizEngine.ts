/**
 * Quiz Battle - Wissens-Quiz mit Schnelligkeitsbonus
 *
 * Features:
 * - 9 Fragen pro Runde
 * - 20 Sekunden pro Frage
 * - Punkte für richtige Antworten + Speed-Bonus
 * - Daumen hoch/runter Feedback für Fragenqualität
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  QuizGameState,
  QuizQuestion,
  GameType,
} from '@playtogether/shared';
import {
  QUIZ_QUESTIONS,
  shuffleArray,
  QUIZ_CONFIG,
} from '@playtogether/shared';

interface QuizFeedbackData {
  thumbsUp: number;
  thumbsDown: number;
}

export class QuizEngine extends BaseGameEngine {
  private questions: QuizQuestion[] = [];
  private currentQuestion?: QuizQuestion;
  private playerAnswers: Map<string, number | null> = new Map();
  private answerTimes: Map<string, number> = new Map();
  private questionFeedback: Map<string, boolean | null> = new Map();
  private questionStartTime: number = 0;
  private roundTimer?: NodeJS.Timeout;

  // Feedback-Statistiken pro Frage (in-memory für diese Session)
  private feedbackStats: Map<string, QuizFeedbackData> = new Map();

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);

    // 9 Fragen pro Runde auswählen
    const questionsNeeded = QUIZ_CONFIG.QUESTIONS_PER_ROUND;
    this.questions = shuffleArray([...QUIZ_QUESTIONS]).slice(0, questionsNeeded);

    // Runden-Anzahl auf 9 setzen (überschreibt Settings)
    this.settings.roundCount = questionsNeeded;
  }

  getGameType(): GameType {
    return 'quiz';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentQuestion = this.questions[this.currentRound - 1];
    this.questionStartTime = Date.now();

    // Antworten und Feedback zurücksetzen
    this.playerAnswers.clear();
    this.answerTimes.clear();
    this.questionFeedback.clear();

    for (const playerId of this.playerIds) {
      this.playerAnswers.set(playerId, null);
      this.questionFeedback.set(playerId, null);
    }

    this.phase = 'active';
    this.emit('game_state', { state: this.getState() });

    // Timer für Zeitablauf (20 Sekunden)
    this.roundTimer = this.startTimer(() => {
      this.finishQuestion();
    }, QUIZ_CONFIG.TIME_PER_QUESTION * 1000);
  }

  handleAction(action: GameAction): void {
    const { playerId, action: actionType, data } = action;

    switch (actionType) {
      case 'answer':
        this.handleAnswer(playerId, data as { answerIndex: number });
        break;
      case 'feedback':
        this.handleFeedback(playerId, data as { isPositive: boolean });
        break;
    }
  }

  private handleAnswer(playerId: string, data: { answerIndex: number }): void {
    if (this.phase !== 'active') return;

    // Nur wenn noch nicht geantwortet
    if (this.playerAnswers.get(playerId) !== null) return;

    const { answerIndex } = data;
    if (answerIndex < 0 || answerIndex > 2) return;

    const answerTime = Date.now() - this.questionStartTime;

    this.playerAnswers.set(playerId, answerIndex);
    this.answerTimes.set(playerId, answerTime);

    // Punkte berechnen
    if (this.currentQuestion && answerIndex === this.currentQuestion.correctIndex) {
      // Basis-Punkte für richtige Antwort
      let points = QUIZ_CONFIG.POINTS_CORRECT;

      // Speed-Bonus: Je schneller, desto mehr Punkte (max 50 Bonus)
      const maxTime = QUIZ_CONFIG.TIME_PER_QUESTION * 1000;
      const speedRatio = 1 - (answerTime / maxTime);
      const speedBonus = Math.floor(speedRatio * QUIZ_CONFIG.POINTS_SPEED_BONUS_MAX);
      points += Math.max(0, speedBonus);

      this.addScore(playerId, points);
    }

    // Update senden
    this.emit('answer_received', {
      playerId,
      answeredCount: this.countAnswers(),
      totalPlayers: this.playerIds.length,
    });

    // Prüfen ob alle geantwortet haben
    if (this.allAnswersIn()) {
      if (this.roundTimer) {
        clearTimeout(this.roundTimer);
      }
      this.finishQuestion();
    }
  }

  private handleFeedback(playerId: string, data: { isPositive: boolean }): void {
    // Feedback kann während active oder reveal Phase gegeben werden
    if (this.phase !== 'active' && this.phase !== 'reveal') return;
    if (!this.currentQuestion) return;

    // Nur einmal pro Frage
    if (this.questionFeedback.get(playerId) !== null) return;

    this.questionFeedback.set(playerId, data.isPositive);

    // Feedback-Statistik aktualisieren
    const questionId = this.currentQuestion.id;
    let stats = this.feedbackStats.get(questionId);
    if (!stats) {
      stats = { thumbsUp: 0, thumbsDown: 0 };
      this.feedbackStats.set(questionId, stats);
    }

    if (data.isPositive) {
      stats.thumbsUp++;
    } else {
      stats.thumbsDown++;
    }

    // Feedback-Update senden
    this.emit('feedback_received', {
      playerId,
      questionId,
      isPositive: data.isPositive,
      totalThumbsUp: stats.thumbsUp,
      totalThumbsDown: stats.thumbsDown,
    });
  }

  getState(): QuizGameState {
    // Für Clients: correctIndex nur in reveal/end Phase zeigen
    const showAnswer = this.phase === 'reveal' || this.phase === 'end';

    return {
      type: 'quiz',
      currentRound: this.currentRound,
      totalRounds: QUIZ_CONFIG.QUESTIONS_PER_ROUND,
      phase: this.phase,
      timeRemaining: QUIZ_CONFIG.TIME_PER_QUESTION,
      scores: this.getScoresObject(),
      currentQuestion: this.currentQuestion ? {
        ...this.currentQuestion,
        // correctIndex nur zeigen wenn Frage beendet
        correctIndex: showAnswer ? this.currentQuestion.correctIndex : -1,
      } : undefined,
      playerAnswers: Object.fromEntries(this.playerAnswers),
      questionStartTime: this.questionStartTime,
      questionFeedback: Object.fromEntries(this.questionFeedback),
      answerTimes: Object.fromEntries(this.answerTimes),
      showCorrectAnswer: showAnswer,
      correctAnswerIndex: showAnswer ? this.currentQuestion?.correctIndex : undefined,
    };
  }

  private allAnswersIn(): boolean {
    for (const answer of this.playerAnswers.values()) {
      if (answer === null) return false;
    }
    return true;
  }

  private countAnswers(): number {
    let count = 0;
    for (const answer of this.playerAnswers.values()) {
      if (answer !== null) count++;
    }
    return count;
  }

  private finishQuestion(): void {
    this.phase = 'reveal';

    // Ergebnisse berechnen
    const results = {
      correctIndex: this.currentQuestion?.correctIndex ?? 0,
      answerDistribution: [0, 0, 0] as [number, number, number],
      correctPlayers: [] as string[],
      fastestPlayer: null as string | null,
      fastestTime: Infinity,
    };

    // Antwortverteilung und schnellster Spieler
    for (const [playerId, answerIndex] of this.playerAnswers) {
      if (answerIndex !== null) {
        results.answerDistribution[answerIndex]++;

        if (answerIndex === results.correctIndex) {
          results.correctPlayers.push(playerId);

          const time = this.answerTimes.get(playerId) || Infinity;
          if (time < results.fastestTime) {
            results.fastestTime = time;
            results.fastestPlayer = playerId;
          }
        }
      }
    }

    // Feedback-Statistiken für diese Frage
    const questionId = this.currentQuestion?.id || '';
    const feedbackStats = this.feedbackStats.get(questionId) || { thumbsUp: 0, thumbsDown: 0 };

    this.emit('question_results', {
      ...results,
      feedbackStats,
      question: this.currentQuestion,
    });

    // State-Update senden
    this.emit('game_state', { state: this.getState() });

    // Nach REVEAL_TIME zur nächsten Frage
    this.startTimer(() => {
      if (this.currentRound >= this.questions.length) {
        this.endGame();
      } else {
        this.nextRound();
      }
    }, QUIZ_CONFIG.REVEAL_TIME * 1000);
  }

  protected endGame(): void {
    this.phase = 'end';

    // Finale Statistiken berechnen
    const finalStats = {
      totalQuestions: this.questions.length,
      feedbackSummary: {
        totalThumbsUp: 0,
        totalThumbsDown: 0,
      },
    };

    for (const stats of this.feedbackStats.values()) {
      finalStats.feedbackSummary.totalThumbsUp += stats.thumbsUp;
      finalStats.feedbackSummary.totalThumbsDown += stats.thumbsDown;
    }

    this.emit('game_ended', {
      finalScores: this.getScoresObject(),
      winner: this.getWinner(),
      stats: finalStats,
    });
  }
}
