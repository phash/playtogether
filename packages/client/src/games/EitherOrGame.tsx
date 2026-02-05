/**
 * EitherOrGame - Entweder/Oder Spielkomponente
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { EitherOrGameState } from '@playtogether/shared';

export default function EitherOrGame() {
  const { gameState, sendGameAction, playerId } = useGameStore();
  const state = gameState as EitherOrGameState;
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [timeLeft, setTimeLeft] = useState(state?.speedRound ? 5 : 10);

  // Timer
  useEffect(() => {
    if (state?.phase !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [state?.phase, state?.currentRound]);

  // Reset bei neuer Frage
  useEffect(() => {
    setSelectedOption(null);
    setTimeLeft(state?.speedRound ? 5 : 10);
  }, [state?.currentRound, state?.speedRound]);

  const handleVote = (choice: 'A' | 'B') => {
    if (selectedOption || state?.phase !== 'active') return;

    setSelectedOption(choice);
    sendGameAction('vote', { choice });
  };

  if (!state || !state.currentQuestion) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Frage...</p>
      </div>
    );
  }

  const { currentQuestion, speedRound, streak } = state;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header mit Streak */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {speedRound && (
          <div
            className="pulse"
            style={{
              background: 'var(--error)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              display: 'inline-block',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            SPEED ROUND!
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <span className="text-secondary">
            Runde {state.currentRound}/{state.totalRounds}
          </span>
          <span style={{
            color: timeLeft < 3 ? 'var(--error)' : 'var(--text)',
            fontWeight: timeLeft < 3 ? 'bold' : 'normal',
          }}>
            {timeLeft}s
          </span>
          {streak > 0 && (
            <span style={{ color: 'var(--warning)' }}>
              {streak}x Streak
            </span>
          )}
        </div>
      </div>

      {/* Timer Bar */}
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
            width: `${(timeLeft / (speedRound ? 5 : 10)) * 100}%`,
            background: timeLeft < 3 ? 'var(--error)' : 'var(--primary)',
            transition: 'width 1s linear, background 0.3s',
          }}
        />
      </div>

      {/* VS Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '0.5rem',
          alignItems: 'stretch',
          minHeight: '200px',
        }}
      >
        {/* Option A */}
        <button
          onClick={() => handleVote('A')}
          disabled={selectedOption !== null || state.phase !== 'active'}
          className={selectedOption === 'A' ? 'pulse' : ''}
          style={{
            padding: '1.5rem 1rem',
            background: selectedOption === 'A'
              ? 'var(--primary)'
              : 'var(--surface)',
            border: `3px solid ${selectedOption === 'A' ? 'var(--primary)' : 'var(--surface-light)'}`,
            borderRadius: 'var(--radius)',
            color: selectedOption === 'A' ? 'white' : 'var(--text)',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: selectedOption || state.phase !== 'active' ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          {currentQuestion.optionA}
        </button>

        {/* VS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          VS
        </div>

        {/* Option B */}
        <button
          onClick={() => handleVote('B')}
          disabled={selectedOption !== null || state.phase !== 'active'}
          className={selectedOption === 'B' ? 'pulse' : ''}
          style={{
            padding: '1.5rem 1rem',
            background: selectedOption === 'B'
              ? 'var(--secondary)'
              : 'var(--surface)',
            border: `3px solid ${selectedOption === 'B' ? 'var(--secondary)' : 'var(--surface-light)'}`,
            borderRadius: 'var(--radius)',
            color: selectedOption === 'B' ? 'white' : 'var(--text)',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: selectedOption || state.phase !== 'active' ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          {currentQuestion.optionB}
        </button>
      </div>

      {/* Feedback */}
      {selectedOption && (
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '2rem',
          }}
        >
          {selectedOption === 'A' ? (
            <span>{currentQuestion.optionA}</span>
          ) : (
            <span>{currentQuestion.optionB}</span>
          )}
        </div>
      )}

      {/* Kategorie Anzeige */}
      <div
        style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface-light)',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        {currentQuestion.category === 'food' && ' Essen'}
        {currentQuestion.category === 'lifestyle' && ' Lifestyle'}
        {currentQuestion.category === 'travel' && ' Reisen'}
        {currentQuestion.category === 'entertainment' && ' Unterhaltung'}
      </div>
    </div>
  );
}
