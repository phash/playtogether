/**
 * AnagrammeGame - Entwirre das verwürfelte Wort
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { AnagrammeGameState } from '@playtogether/shared';

export default function AnagrammeGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as AnagrammeGameState;
  const [guess, setGuess] = useState('');

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const myAttempts = state.attempts[playerId] || [];
  const isSolved = state.solved[playerId] || false;

  const handleSubmit = () => {
    const trimmed = guess.trim();
    if (!trimmed) return;
    sendGameAction('guess', { word: trimmed });
    setGuess('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Unbekannt';
  };

  // Timer bar
  const timerPercent = state.timeRemaining > 0
    ? Math.max(0, (state.timeRemaining / (room.settings.timePerRound || 30)) * 100)
    : 0;

  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Spiel beendet!</h2>
          {state.revealedWord && (
            <p className="text-secondary mb-2">
              Das Wort war: <strong style={{ color: 'var(--success)' }}>{state.revealedWord}</strong>
            </p>
          )}
        </div>
        <div className="card">
          <h3 className="mb-2">Rangliste</h3>
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: player.id === playerId ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-light)',
                borderRadius: 'var(--radius)',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', width: '2rem' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span style={{ fontWeight: player.id === playerId ? '700' : '500' }}>
                  {player.name}
                </span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                {state.scores[player.id] || 0} Pkt.
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (state.phase === 'reveal') {
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <p className="text-secondary mb-1">Die Lösung</p>
          <h2 style={{ color: 'var(--success)', fontSize: '1.8rem', marginBottom: '1rem' }}>
            {state.revealedWord || '???'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {players.map((p) => (
              <span
                key={p.id}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  background: state.solved[p.id] ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: state.solved[p.id] ? 'var(--success)' : 'var(--error)',
                }}
              >
                {p.name}: {state.solved[p.id] ? 'Gelöst!' : 'Nicht gelöst'}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* Timer Bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'var(--surface-light)',
        borderRadius: '2px',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${timerPercent}%`,
          height: '100%',
          background: timerColor,
          borderRadius: '2px',
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>

      {/* Category + Difficulty */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          {state.category}
        </span>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: state.difficulty === 'easy'
            ? 'rgba(34, 197, 94, 0.2)'
            : state.difficulty === 'medium'
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
          color: state.difficulty === 'easy'
            ? 'var(--success)'
            : state.difficulty === 'medium'
              ? 'var(--warning)'
              : 'var(--error)',
        }}>
          {state.difficulty === 'easy' ? 'Leicht' : state.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
        </span>
      </div>

      {/* Scrambled Word */}
      <div className="card text-center">
        <p className="text-secondary mb-1" style={{ fontSize: '0.85rem' }}>Entwirre dieses Wort:</p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
        }}>
          {state.scrambledWord.split('').map((letter, i) => (
            <div
              key={i}
              style={{
                width: '44px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface-light)',
                borderRadius: 'var(--radius)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--primary)',
                border: '2px solid var(--primary)',
              }}
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
          {state.wordLength} Buchstaben
        </p>
      </div>

      {/* Input */}
      {!isSolved && state.phase === 'active' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            className="input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Dein Tipp..."
            maxLength={state.wordLength + 5}
            autoComplete="off"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!guess.trim()}
            style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
          >
            Raten
          </button>
        </div>
      )}

      {isSolved && (
        <div className="card text-center" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <p style={{ color: 'var(--success)', fontWeight: '600', marginTop: '0.5rem' }}>
            Richtig gelöst!
          </p>
        </div>
      )}

      {/* Previous Attempts */}
      {myAttempts.length > 0 && (
        <div className="card">
          <p className="text-secondary mb-1" style={{ fontSize: '0.85rem' }}>Deine Versuche:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {myAttempts.map((attempt, i) => (
              <div
                key={i}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.95rem',
                  background: isSolved && i === myAttempts.length - 1
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: isSolved && i === myAttempts.length - 1
                    ? 'var(--success)'
                    : 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{isSolved && i === myAttempts.length - 1 ? '✓' : '✗'}</span>
                <span>{attempt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
