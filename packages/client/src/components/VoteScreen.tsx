/**
 * VoteScreen - Spieler stimmen über das nächste Spiel ab
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameType } from '@playtogether/shared';

export default function VoteScreen() {
  const { voteData, voteResultData, myVote, submitVote, playerId, room, endSession } = useGameStore();
  const [countdown, setCountdown] = useState(30);

  // Client-side countdown
  useEffect(() => {
    if (!voteData) return;
    setCountdown(voteData.countdownSeconds);

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [voteData?.countdownSeconds]);

  const isHost = room?.hostId === playerId;

  // Show vote result overlay
  if (voteResultData) {
    return (
      <div className="fade-in" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <style>{`
          @keyframes result-pop {
            0% { transform: scale(0.5); opacity: 0; }
            60% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div style={{
          animation: 'result-pop 0.5s ease-out',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
            {voteResultData.chosenGame.icon}
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {voteResultData.chosenGame.name}
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            {voteResultData.wasTiebreak ? 'Zufall entscheidet!' : 'wurde gewählt!'}
          </p>
        </div>

        <p className="text-secondary" style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
          Spiel startet gleich...
        </p>
      </div>
    );
  }

  if (!voteData) return null;

  const { candidates, votes, totalVoters, votedCount } = voteData;
  const maxVotes = Math.max(1, ...Object.values(votes));

  return (
    <div className="fade-in" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
            Welches Spiel als Nächstes?
          </h2>
        </div>

        {/* Countdown + Progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
        }}>
          <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
            {votedCount}/{totalVoters} abgestimmt
          </span>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: countdown <= 5 ? 'var(--error)' : 'var(--primary)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '2.5rem',
            textAlign: 'center',
          }}>
            {countdown}
          </div>
        </div>

        {/* Vote progress bar */}
        <div style={{
          height: '4px',
          background: 'var(--surface-light)',
          borderRadius: '2px',
          marginBottom: '1.25rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: totalVoters > 0 ? `${(votedCount / totalVoters) * 100}%` : '0%',
            background: 'var(--primary)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Game Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {candidates.map((game) => {
            const isSelected = myVote === game.type;
            const voteCount = votes[game.type] || 0;
            const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

            return (
              <button
                key={game.type}
                onClick={() => !myVote && submitVote(game.type)}
                disabled={!!myVote}
                style={{
                  background: isSelected
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'var(--surface)',
                  border: isSelected
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 0.75rem',
                  cursor: myVote ? 'default' : 'pointer',
                  textAlign: 'center',
                  color: 'var(--text)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: myVote && !isSelected ? 0.7 : 1,
                }}
              >
                {/* Vote bar background */}
                {voteCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    width: `${barWidth}%`,
                    background: isSelected ? 'var(--primary)' : 'var(--surface-light)',
                    transition: 'width 0.3s ease',
                  }} />
                )}

                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '0.4rem',
                    right: '0.4rem',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'white',
                  }}>
                    ✓
                  </div>
                )}

                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
                  {game.icon}
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  {game.name}
                </div>
                <div className="text-secondary" style={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
                  {game.description}
                </div>
                {voteCount > 0 && (
                  <div style={{
                    marginTop: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                  }}>
                    {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Host: end session button */}
        {isHost && (
          <button
            className="btn btn-secondary"
            onClick={endSession}
            style={{ fontSize: '0.85rem', opacity: 0.8 }}
          >
            Session beenden
          </button>
        )}
      </div>
    </div>
  );
}
