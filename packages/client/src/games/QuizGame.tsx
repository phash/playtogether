/**
 * QuizGame - Quiz-Spielkomponente
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

// Demo-Fragen für das Quiz
const DEMO_QUESTIONS = [
  {
    question: 'Welche Farbe hat der Himmel bei klarem Wetter?',
    answers: ['Grün', 'Blau', 'Rot', 'Gelb'],
    correctIndex: 1,
  },
  {
    question: 'Wie viele Beine hat eine Spinne?',
    answers: ['6', '8', '10', '4'],
    correctIndex: 1,
  },
  {
    question: 'Was ist die Hauptstadt von Deutschland?',
    answers: ['München', 'Hamburg', 'Berlin', 'Köln'],
    correctIndex: 2,
  },
  {
    question: 'Welches Element hat das chemische Symbol "O"?',
    answers: ['Gold', 'Silber', 'Sauerstoff', 'Eisen'],
    correctIndex: 2,
  },
  {
    question: 'Wie viele Minuten hat eine Stunde?',
    answers: ['30', '60', '90', '120'],
    correctIndex: 1,
  },
];

export default function QuizGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  const currentQuestion = DEMO_QUESTIONS[currentQuestionIndex];

  // Timer
  useEffect(() => {
    if (showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult]);

  const handleTimeout = () => {
    if (selectedAnswer === null) {
      setShowResult(true);
      setTimeout(nextQuestion, 2000);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    // Punkte berechnen (mehr Punkte für schnellere Antworten)
    if (answerIndex === currentQuestion.correctIndex) {
      const points = Math.max(100, timeLeft * 10);
      setScore((prev) => prev + points);
      sendGameAction('answer', {
        questionIndex: currentQuestionIndex,
        answerIndex,
        correct: true,
        points,
        timeLeft,
      });
    } else {
      sendGameAction('answer', {
        questionIndex: currentQuestionIndex,
        answerIndex,
        correct: false,
        points: 0,
        timeLeft,
      });
    }

    // Nächste Frage nach 2 Sekunden
    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(30);
    } else {
      // Spiel beendet
      sendGameAction('finish', { finalScore: score });
    }
  };

  const getAnswerStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index
        ? { background: 'var(--primary)', color: 'white' }
        : {};
    }

    if (index === currentQuestion.correctIndex) {
      return { background: 'var(--success)', color: 'white' };
    }

    if (selectedAnswer === index && index !== currentQuestion.correctIndex) {
      return { background: 'var(--error)', color: 'white' };
    }

    return { opacity: 0.5 };
  };

  // Timer-Farbe basierend auf verbleibender Zeit
  const getTimerColor = () => {
    if (timeLeft > 20) return 'var(--success)';
    if (timeLeft > 10) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Timer und Punktestand */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
          }}
        >
          <span style={{ color: getTimerColor() }}>⏱️ {timeLeft}s</span>
        </div>
        <div
          style={{
            background: 'var(--surface-light)',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontWeight: 'bold',
          }}
        >
          🏆 {score} Punkte
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div
        style={{
          height: '4px',
          background: 'var(--surface-light)',
          borderRadius: '2px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentQuestionIndex + 1) / DEMO_QUESTIONS.length) * 100}%`,
            background: 'var(--primary)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Frage */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p
          className="text-secondary"
          style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}
        >
          Frage {currentQuestionIndex + 1} von {DEMO_QUESTIONS.length}
        </p>
        <h2 style={{ fontSize: '1.3rem', lineHeight: '1.4' }}>
          {currentQuestion.question}
        </h2>
      </div>

      {/* Antworten */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {currentQuestion.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={showResult}
            style={{
              padding: '1.25rem 1rem',
              background: 'var(--surface)',
              border: '2px solid var(--surface-light)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: showResult ? 'default' : 'pointer',
              transition: 'all 0.2s',
              ...getAnswerStyle(index),
            }}
          >
            {answer}
          </button>
        ))}
      </div>

      {/* Ergebnis-Feedback */}
      {showResult && (
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            background:
              selectedAnswer === currentQuestion.correctIndex
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
          }}
        >
          {selectedAnswer === currentQuestion.correctIndex ? (
            <>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Richtig! +{Math.max(100, timeLeft * 10)} Punkte
              </p>
            </>
          ) : selectedAnswer === null ? (
            <>
              <span style={{ fontSize: '2rem' }}>⏰</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Zeit abgelaufen!
              </p>
            </>
          ) : (
            <>
              <span style={{ fontSize: '2rem' }}>❌</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Leider falsch!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
