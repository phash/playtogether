/**
 * WouldYouRatherGame - Würdest du eher? Spielkomponente
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { WouldYouRatherGameState } from '@playtogether/shared';

export default function WouldYouRatherGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as WouldYouRatherGameState;
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [timeLeft, setTimeLeft] = useState(state?.timeRemaining || 30);

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
    setTimeLeft(state?.timeRemaining || 30);
  }, [state?.currentRound]);

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

  const { currentQuestion, votes, votingComplete, results } = state;
  const totalVotes = results ? results.a + results.b : 0;
  const percentA = totalVotes > 0 ? Math.round((results!.a / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? Math.round((results!.b / totalVotes) * 100) : 50;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Würdest du eher...?
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <span className="text-secondary">
            Runde {state.currentRound}/{state.totalRounds}
          </span>
          {state.phase === 'active' && (
            <span style={{ color: timeLeft < 10 ? 'var(--error)' : 'var(--text)' }}>
              {timeLeft}s
            </span>
          )}
        </div>
      </div>

      {/* Optionen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Option A */}
        <button
          onClick={() => handleVote('A')}
          disabled={selectedOption !== null || state.phase !== 'active'}
          style={{
            position: 'relative',
            padding: '2rem 1.5rem',
            background: selectedOption === 'A'
              ? 'var(--primary)'
              : votingComplete && votes[playerId!] === 'A'
                ? 'var(--primary)'
                : 'var(--surface)',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius)',
            color: selectedOption === 'A' || (votingComplete && votes[playerId!] === 'A')
              ? 'white'
              : 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: '500',
            cursor: selectedOption || state.phase !== 'active' ? 'default' : 'pointer',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {votingComplete && results && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${percentA}%`,
                background: 'var(--primary)',
                opacity: 0.3,
                transition: 'width 0.5s ease',
              }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {currentQuestion.optionA}
          </span>
          {votingComplete && results && (
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}>
              {percentA}%
            </div>
          )}
        </button>

        {/* VS Trenner */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
          ODER
        </div>

        {/* Option B */}
        <button
          onClick={() => handleVote('B')}
          disabled={selectedOption !== null || state.phase !== 'active'}
          style={{
            position: 'relative',
            padding: '2rem 1.5rem',
            background: selectedOption === 'B'
              ? 'var(--secondary)'
              : votingComplete && votes[playerId!] === 'B'
                ? 'var(--secondary)'
                : 'var(--surface)',
            border: '2px solid var(--secondary)',
            borderRadius: 'var(--radius)',
            color: selectedOption === 'B' || (votingComplete && votes[playerId!] === 'B')
              ? 'white'
              : 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: '500',
            cursor: selectedOption || state.phase !== 'active' ? 'default' : 'pointer',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {votingComplete && results && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${percentB}%`,
                background: 'var(--secondary)',
                opacity: 0.3,
                transition: 'width 0.5s ease',
              }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {currentQuestion.optionB}
          </span>
          {votingComplete && results && (
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '0.5rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}>
              {percentB}%
            </div>
          )}
        </button>
      </div>

      {/* Warte-Hinweis */}
      {selectedOption && !votingComplete && (
        <div className="fade-in" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
          <p className="text-secondary">Warte auf andere Spieler...</p>
        </div>
      )}

      {/* Ergebnis */}
      {votingComplete && results && (
        <div className="fade-in card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem' }}>
            {results.a > results.b
              ? `${results.a} Spieler wählen Option A!`
              : results.b > results.a
                ? `${results.b} Spieler wählen Option B!`
                : 'Unentschieden!'
            }
          </p>
        </div>
      )}
    </div>
  );
}
