/**
 * WordGuessGame - Erkläre Wörter und lass andere raten!
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { WordGuessGameState } from '@playtogether/shared';

export default function WordGuessGame() {
  const { gameState, sendGameAction, room, playerId, timerValue } = useGameStore();
  const state = gameState as WordGuessGameState;
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
  const isExplainer = playerId === state.explainerId;
  const explainerName = players.find((p) => p.id === state.explainerId)?.name || 'Unbekannt';

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name || 'Unbekannt';

  const handleSubmitGuess = () => {
    const trimmed = guess.trim();
    if (!trimmed) return;
    sendGameAction('guess', { text: trimmed });
    setGuess('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmitGuess();
  };

  const handleSkip = () => {
    sendGameAction('skip', {});
  };

  // Timer
  const timeLeft = timerValue ?? state.timeRemaining;
  const maxTime = room.settings.timePerRound || 60;
  const timerPercent = Math.max(0, (timeLeft / maxTime) * 100);
  const timerColor = timerPercent > 50 ? 'var(--success)' : timerPercent > 25 ? 'var(--warning)' : 'var(--error)';

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2>Spiel beendet!</h2>
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
                <span>{player.name}</span>
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
          <p className="text-secondary mb-1">Das Wort war</p>
          <h2 style={{ color: state.solved ? 'var(--success)' : 'var(--error)', fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            {state.word}
          </h2>
          {state.solved && state.solvedBy && (
            <p style={{ color: 'var(--success)' }}>
              Geraten von <strong>{getPlayerName(state.solvedBy)}</strong>!
            </p>
          )}
          {state.skipped && (
            <p style={{ color: 'var(--warning)' }}>Übersprungen</p>
          )}
          {!state.solved && !state.skipped && (
            <p style={{ color: 'var(--error)' }}>Nicht geraten</p>
          )}
        </div>
      </div>
    );
  }

  // Active phase
  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* Timer */}
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
          transition: 'width 1s linear',
        }} />
      </div>

      {/* Category badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          {state.category}
        </span>
      </div>

      {isExplainer ? (
        /* Explainer View */
        <div className="card text-center">
          <p className="text-secondary mb-1">Du erklärst:</p>
          <h2 style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.75rem' }}>
            {state.word}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Erkläre das Wort ohne es zu sagen!
          </p>
          <button className="btn btn-secondary" onClick={handleSkip}>
            Überspringen
          </button>
        </div>
      ) : (
        /* Guesser View */
        <div className="card text-center">
          <p className="text-secondary mb-1">
            <strong>{explainerName}</strong> erklärt ein Wort
          </p>
          <p style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            {state.wordLength} Buchstaben
          </p>

          {/* Input */}
          {!state.solved && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dein Tipp..."
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSubmitGuess}
                disabled={!guess.trim()}
                style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
              >
                Raten
              </button>
            </div>
          )}

          {state.solved && (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p style={{ color: 'var(--success)', fontWeight: '600' }}>
                {state.solvedBy === playerId ? 'Du hast es geraten!' : `${getPlayerName(state.solvedBy!)} hat es geraten!`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guesses */}
      {state.guesses.length > 0 && (
        <div className="card mt-2">
          <p className="text-secondary mb-1" style={{ fontSize: '0.85rem' }}>Versuche:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {state.guesses.slice(-8).map((entry, i) => (
              <div
                key={i}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.9rem',
                  background: entry.correct ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                  color: entry.correct ? 'var(--success)' : 'var(--text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{entry.correct ? '✓' : '✗'} {entry.guess}</span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {getPlayerName(entry.playerId)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
