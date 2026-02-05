/**
 * Quiz Champ - Wissens-Quiz mit Streak-Bonus
 *
 * Jede Runde wird eine zufällige Frage mit 4 Optionen gestellt.
 * 20 Sekunden Timer. Richtige Antwort: 100 * Speed-Bonus.
 * Streak-Bonus: 3 korrekte in Folge = +25, 5+ = +50.
 * Falsche Antwort setzt den Streak zurück.
 */

import {
  BaseGameEngine,
  GameEngineConfig,
  GameAction,
  GameEventCallback,
} from './BaseGameEngine.js';
import type {
  QuizChampGameState,
  QuizChampQuestion,
  GameType,
} from '@playtogether/shared';
import {
  QUIZ_CHAMP_QUESTIONS,
  shuffleArray,
} from '@playtogether/shared';

export class QuizChampEngine extends BaseGameEngine {
  private questions: QuizChampQuestion[] = [];
  private currentQuestion?: QuizChampQuestion;
  private playerAnswers: Map<string, number | null> = new Map();
  private questionStartTime: number = 0;
  private streaks: Map<string, number> = new Map(); // playerId -> consecutive correct
  private answerResults: Map<string, { correct: boolean; points: number }> = new Map();

  constructor(config: GameEngineConfig, onEvent: GameEventCallback) {
    super(config, onEvent);

    // Zufällige Fragen auswählen
    this.questions = shuffleArray([...QUIZ_CHAMP_QUESTIONS]).slice(
      0,
      config.settings.roundCount
    );

    // Streaks initialisieren
    for (const playerId of this.playerIds) {
      this.streaks.set(playerId, 0);
    }
  }

  getGameType(): GameType {
    return 'quiz_champ';
  }

  start(): void {
    this.phase = 'active';
    this.currentRound = 0;
    this.nextRound();
  }

  protected startRound(): void {
    this.currentQuestion = this.questions[this.currentRound - 1];
    this.questionStartTime = Date.now();

    // Antworten und Ergebnisse zurücksetzen
    this.playerAnswers.clear();
    this.answerResults.clear();

    for (const playerId of this.playerIds) {
      this.playerAnswers.set(playerId, null);
    }

    this.phase = 'active';
    this.emitGameState();

    // Countdown-Timer starten
    this.startCountdownTimer(this.settings.timePerRound, () => {
      this.finishQuestion();
    });
  }

  handleAction(action: GameAction): void {
    if (action.action === 'answer' && this.phase === 'active') {
      this.handleAnswer(action.playerId, action.data as { answerIndex: number });
    }
  }

  private handleAnswer(playerId: string, data: { answerIndex: number }): void {
    // Nur wenn noch nicht geantwortet
    if (this.playerAnswers.get(playerId) !== null) return;

    const { answerIndex } = data;
    if (answerIndex < 0 || answerIndex > 3) return;

    this.playerAnswers.set(playerId, answerIndex);

    // Bestätigung senden
    this.emit('answer_confirmed', {
      playerId,
      answeredCount: this.countAnswers(),
      totalPlayers: this.playerIds.length,
    });

    this.emitGameState();

    // Prüfen ob alle geantwortet haben
    if (this.allAnswersIn()) {
      this.clearAllTimers();
      this.finishQuestion();
    }
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
    this.clearAllTimers();

    const correctIndex = this.currentQuestion!.correctIndex;
    const maxTimeMs = this.settings.timePerRound * 1000;

    // Ergebnisse berechnen
    for (const [playerId, answerIndex] of this.playerAnswers) {
      if (answerIndex === correctIndex) {
        // Richtige Antwort
        const currentStreak = (this.streaks.get(playerId) || 0) + 1;
        this.streaks.set(playerId, currentStreak);

        // Basispunkte mit Speed-Bonus
        const answerTimeMs = Date.now() - this.questionStartTime;
        const timeLeftMs = Math.max(0, maxTimeMs - answerTimeMs);
        let points = this.calculateSpeedScore(100, timeLeftMs, maxTimeMs);

        // Streak-Bonus
        let streakBonus = 0;
        if (currentStreak >= 5) {
          streakBonus = 50;
        } else if (currentStreak >= 3) {
          streakBonus = 25;
        }
        points += streakBonus;

        this.addScore(playerId, points);
        this.answerResults.set(playerId, { correct: true, points });
      } else {
        // Falsche Antwort oder keine Antwort
        this.streaks.set(playerId, 0);
        this.answerResults.set(playerId, { correct: false, points: 0 });
      }
    }

    // Spieler die nicht geantwortet haben verlieren ihren Streak
    for (const playerId of this.playerIds) {
      if (!this.answerResults.has(playerId)) {
        this.streaks.set(playerId, 0);
        this.answerResults.set(playerId, { correct: false, points: 0 });
      }
    }

    this.emit('question_results', {
      correctIndex,
      results: Object.fromEntries(this.answerResults),
      streaks: Object.fromEntries(this.streaks),
    });

    this.emitGameState();

    // Nach 3 Sekunden zur nächsten Runde
    this.startTimer(() => {
      this.nextRound();
    }, 3000);
  }

  getState(): QuizChampGameState {
    const showAnswer = this.phase === 'reveal' || this.phase === 'end';

    const answerResultsObj: Record<string, { correct: boolean; points: number }> = {};
    for (const [playerId, result] of this.answerResults) {
      answerResultsObj[playerId] = result;
    }

    return {
      type: 'quiz_champ',
      currentRound: this.currentRound,
      totalRounds: this.settings.roundCount,
      phase: this.phase,
      timeRemaining: this.settings.timePerRound,
      scores: this.getScoresObject(),
      currentQuestion: this.currentQuestion
        ? {
            ...this.currentQuestion,
            // correctIndex nur zeigen wenn Frage beendet
            correctIndex: showAnswer ? this.currentQuestion.correctIndex : -1,
          }
        : undefined,
      playerAnswers: Object.fromEntries(this.playerAnswers),
      questionStartTime: this.questionStartTime,
      streaks: Object.fromEntries(this.streaks),
      answerResults: answerResultsObj,
      showCorrectAnswer: showAnswer,
      correctAnswerIndex: showAnswer ? this.currentQuestion?.correctIndex : undefined,
    };
  }
}
