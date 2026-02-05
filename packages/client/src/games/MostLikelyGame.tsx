/**
 * MostLikelyGame - Wer würde am ehesten? Spielkomponente
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { MostLikelyGameState } from '@playtogether/shared';

export default function MostLikelyGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as MostLikelyGameState;
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
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
    setSelectedPlayer(null);
    setTimeLeft(state?.timeRemaining || 30);
  }, [state?.currentRound]);

  const handleVote = (votedForId: string) => {
    if (selectedPlayer || state?.phase !== 'active') return;

    setSelectedPlayer(votedForId);
    sendGameAction('vote', { playerId: votedForId });
  };

  if (!state || !state.currentQuestion) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Frage...</p>
      </div>
    );
  }

  const { currentQuestion, votingComplete, results } = state;

  // Finde den Spieler mit den meisten Stimmen
  const getWinner = () => {
    if (!results) return null;
    let maxVotes = 0;
    let winnerId: string | null = null;
    for (const [pid, count] of Object.entries(results)) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = pid;
      }
    }
    return winnerId;
  };

  const winner = getWinner();

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
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

      {/* Frage */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>
          👆
        </span>
        <h2 style={{ fontSize: '1.3rem', lineHeight: '1.4', color: 'var(--primary)' }}>
          {currentQuestion.question}
        </h2>
      </div>

      {/* Spieler-Auswahl */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        {room?.players.map((player) => {
          const voteCount = results?.[player.id] || 0;
          const isWinner = winner === player.id && votingComplete;
          const isSelected = selectedPlayer === player.id;

          return (
            <button
              key={player.id}
              onClick={() => handleVote(player.id)}
              disabled={selectedPlayer !== null || state.phase !== 'active'}
              style={{
                position: 'relative',
                padding: '1.25rem',
                background: isWinner
                  ? 'var(--success)'
                  : isSelected
                    ? 'var(--primary)'
                    : 'var(--surface)',
                border: `2px solid ${isWinner ? 'var(--success)' : isSelected ? 'var(--primary)' : 'var(--surface-light)'}`,
                borderRadius: 'var(--radius)',
                color: isWinner || isSelected ? 'white' : 'var(--text)',
                cursor: selectedPlayer || state.phase !== 'active' ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: player.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  border: player.id === playerId ? '3px solid white' : 'none',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {player.name}
                {player.id === playerId && ' (Du)'}
              </div>

              {/* Stimmen */}
              {votingComplete && (
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginTop: '0.5rem',
                }}>
                  {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                </div>
              )}

              {/* Gewinner Badge */}
              {isWinner && voteCount > 0 && (
                <div
                  className="pulse"
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: 'var(--warning)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >

                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Warte-Hinweis */}
      {selectedPlayer && !votingComplete && (
        <div className="fade-in" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
          <p className="text-secondary">Warte auf andere Spieler...</p>
        </div>
      )}

      {/* Ergebnis */}
      {votingComplete && winner && results && (
        <div className="fade-in card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem' }}>
            <strong>{room?.players.find(p => p.id === winner)?.name}</strong> wurde am häufigsten gewählt!
          </p>
        </div>
      )}
    </div>
  );
}
