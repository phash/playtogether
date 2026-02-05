/**
 * QuizGame - Quiz-Spielkomponente
 *
 * Features:
 * - 9 Fragen pro Runde
 * - 20 Sekunden pro Frage
 * - Punkte für richtige Antworten + Speed-Bonus
 * - Daumen hoch/runter Feedback für Fragenqualität
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { QuizGameState, QuizQuestion, QUIZ_CONFIG } from '@playtogether/shared';

// Konfiguration (sollte mit Server übereinstimmen)
const TIME_PER_QUESTION = 20;
const QUESTIONS_PER_ROUND = 9;

export default function QuizGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  // Cast gameState to QuizGameState
  const quizState = gameState as QuizGameState | null;
  const currentQuestion = quizState?.currentQuestion;
  const phase = quizState?.phase || 'preparation';
  const currentRound = quizState?.currentRound || 0;
  const totalRounds = quizState?.totalRounds || QUESTIONS_PER_ROUND;
  const scores = quizState?.scores || {};
  const playerAnswers = quizState?.playerAnswers || {};
  const questionFeedback = quizState?.questionFeedback || {};
  const showCorrectAnswer = quizState?.showCorrectAnswer || false;
  const correctAnswerIndex = quizState?.correctAnswerIndex;

  // Eigene Antwort und Score
  const myAnswer = playerId ? playerAnswers[playerId] : null;
  const myScore = playerId ? (scores[playerId] || 0) : 0;

  // Timer basierend auf questionStartTime
  useEffect(() => {
    if (phase !== 'active' || !quizState?.questionStartTime) {
      return;
    }

    const updateTimer = () => {
      const elapsed = (Date.now() - quizState.questionStartTime) / 1000;
      const remaining = Math.max(0, TIME_PER_QUESTION - elapsed);
      setTimeLeft(Math.ceil(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [phase, quizState?.questionStartTime]);

  // Reset state when question changes
  useEffect(() => {
    setHasAnswered(false);
    setHasFeedback(false);
    setTimeLeft(TIME_PER_QUESTION);
  }, [currentRound, currentQuestion?.id]);

  // Update local score when server score changes
  useEffect(() => {
    setLocalScore(myScore);
  }, [myScore]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (hasAnswered || phase !== 'active') return;

    setHasAnswered(true);
    sendGameAction('answer', { answerIndex });
  }, [hasAnswered, phase, sendGameAction]);

  const handleFeedback = useCallback((isPositive: boolean) => {
    if (hasFeedback) return;

    setHasFeedback(true);
    sendGameAction('feedback', { isPositive });
  }, [hasFeedback, sendGameAction]);

  // Timer-Farbe basierend auf verbleibender Zeit
  const getTimerColor = () => {
    if (timeLeft > 12) return 'var(--success)';
    if (timeLeft > 6) return 'var(--warning)';
    return 'var(--error)';
  };

  // Antwort-Stil
  const getAnswerStyle = (index: number) => {
    const baseStyle = {
      padding: '1rem',
      background: 'var(--surface)',
      border: '2px solid var(--surface-light)',
      borderRadius: 'var(--radius)',
      color: 'var(--text)',
      fontSize: '1rem',
      fontWeight: '500' as const,
      cursor: (hasAnswered || phase !== 'active') ? 'default' : 'pointer',
      transition: 'all 0.2s',
      minHeight: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
    };

    // Wenn Ergebnis angezeigt wird
    if (showCorrectAnswer && correctAnswerIndex !== undefined) {
      if (index === correctAnswerIndex) {
        return { ...baseStyle, background: 'var(--success)', color: 'white', border: '2px solid var(--success)' };
      }
      if (myAnswer === index && index !== correctAnswerIndex) {
        return { ...baseStyle, background: 'var(--error)', color: 'white', border: '2px solid var(--error)' };
      }
      return { ...baseStyle, opacity: 0.5 };
    }

    // Während des Spiels
    if (myAnswer === index) {
      return { ...baseStyle, background: 'var(--primary)', color: 'white', border: '2px solid var(--primary)' };
    }

    return baseStyle;
  };

  // Lade-Zustand
  if (!quizState || !currentQuestion) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Lade Quiz...</p>
      </div>
    );
  }

  // Spiel beendet
  if (phase === 'end') {
    const sortedPlayers = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);
    const winner = sortedPlayers[0]?.[0];
    const isWinner = winner === playerId;

    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          {isWinner ? '🎉 Du hast gewonnen!' : '🏁 Quiz beendet!'}
        </h2>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Endstand</h3>
          {sortedPlayers.map(([id, score], index) => {
            const player = room?.players.find(p => p.id === id);
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: id === playerId ? 'var(--primary-light)' : 'var(--surface-light)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.5rem',
                }}
              >
                <span>
                  {medals[index] || `${index + 1}.`} {player?.name || 'Spieler'}
                  {id === playerId && ' (Du)'}
                </span>
                <span style={{ fontWeight: 'bold' }}>{score} Punkte</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header: Timer, Frage-Nummer, Punkte */}
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
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.9rem',
          }}
        >
          Frage {currentRound}/{totalRounds}
        </div>
        <div
          style={{
            background: 'var(--surface-light)',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontWeight: 'bold',
          }}
        >
          🏆 {localScore}
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div
        style={{
          height: '4px',
          background: 'var(--surface-light)',
          borderRadius: '2px',
          marginBottom: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(currentRound / totalRounds) * 100}%`,
            background: 'var(--primary)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Timer-Balken */}
      <div
        style={{
          height: '6px',
          background: 'var(--surface-light)',
          borderRadius: '3px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(timeLeft / TIME_PER_QUESTION) * 100}%`,
            background: getTimerColor(),
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Kategorie & Schwierigkeit */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '500',
          }}
        >
          {currentQuestion.category}
        </span>
        <span
          style={{
            background: currentQuestion.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.2)' :
                       currentQuestion.difficulty === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                       'rgba(239, 68, 68, 0.2)',
            color: currentQuestion.difficulty === 'easy' ? 'var(--success)' :
                   currentQuestion.difficulty === 'medium' ? 'var(--warning)' :
                   'var(--error)',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '500',
          }}
        >
          {currentQuestion.difficulty === 'easy' ? 'Leicht' :
           currentQuestion.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
        </span>
      </div>

      {/* Frage */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', lineHeight: '1.5' }}>
          {currentQuestion.question}
        </h2>
      </div>

      {/* Antworten (3 Optionen) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {currentQuestion.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={hasAnswered || phase !== 'active'}
            style={getAnswerStyle(index)}
          >
            <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
              {['A', 'B', 'C'][index]}.
            </span>
            {answer}
          </button>
        ))}
      </div>

      {/* Feedback-Buttons (Daumen hoch/runter) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          background: 'var(--surface-light)',
          borderRadius: 'var(--radius)',
        }}
      >
        <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Frage bewerten:
        </span>
        <button
          onClick={() => handleFeedback(true)}
          disabled={hasFeedback}
          style={{
            padding: '0.5rem 1rem',
            background: hasFeedback && questionFeedback[playerId || ''] === true
              ? 'var(--success)'
              : 'var(--surface)',
            border: '2px solid var(--success)',
            borderRadius: 'var(--radius)',
            cursor: hasFeedback ? 'default' : 'pointer',
            fontSize: '1.5rem',
            opacity: hasFeedback && questionFeedback[playerId || ''] !== true ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
          title="Gute Frage"
        >
          👍
        </button>
        <button
          onClick={() => handleFeedback(false)}
          disabled={hasFeedback}
          style={{
            padding: '0.5rem 1rem',
            background: hasFeedback && questionFeedback[playerId || ''] === false
              ? 'var(--error)'
              : 'var(--surface)',
            border: '2px solid var(--error)',
            borderRadius: 'var(--radius)',
            cursor: hasFeedback ? 'default' : 'pointer',
            fontSize: '1.5rem',
            opacity: hasFeedback && questionFeedback[playerId || ''] !== false ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
          title="Schlechte Frage"
        >
          👎
        </button>
      </div>

      {/* Ergebnis-Feedback */}
      {showCorrectAnswer && (
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            background: myAnswer === correctAnswerIndex
              ? 'rgba(34, 197, 94, 0.2)'
              : myAnswer === null
              ? 'rgba(234, 179, 8, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
          }}
        >
          {myAnswer === correctAnswerIndex ? (
            <>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Richtig!
              </p>
            </>
          ) : myAnswer === null ? (
            <>
              <span style={{ fontSize: '2rem' }}>⏰</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Zeit abgelaufen!
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Richtige Antwort: {currentQuestion.answers[correctAnswerIndex || 0]}
              </p>
            </>
          ) : (
            <>
              <span style={{ fontSize: '2rem' }}>❌</span>
              <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                Leider falsch!
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Richtige Antwort: {currentQuestion.answers[correctAnswerIndex || 0]}
              </p>
            </>
          )}
        </div>
      )}

      {/* Spieler-Status (wer hat schon geantwortet) */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          background: 'var(--surface-light)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Spieler:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {room?.players.map(player => {
            const answered = playerAnswers[player.id] !== null && playerAnswers[player.id] !== undefined;
            return (
              <span
                key={player.id}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: answered ? 'var(--success)' : 'var(--surface)',
                  color: answered ? 'white' : 'var(--text)',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  border: player.id === playerId ? '2px solid var(--primary)' : 'none',
                }}
              >
                {player.name} {answered && '✓'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
