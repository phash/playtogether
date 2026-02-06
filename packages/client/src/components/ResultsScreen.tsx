/**
 * ResultsScreen - Siegerehrung nach jedem Spiel mit Confetti und Rankings
 */

import { useGameStore } from '../store/gameStore';

export default function ResultsScreen() {
  const { gameResultsData, playerId, room, endSession } = useGameStore();

  if (!gameResultsData) return null;

  const { winnerName, rankings, gamesPlayed } = gameResultsData;
  const isHost = room?.hostId === playerId;
  const isWinner = gameResultsData.winner === playerId;

  return (
    <div className="fade-in" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* CSS Confetti */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-10px',
              left: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              background: ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'][i % 7],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes winner-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
          50% { text-shadow: 0 0 25px rgba(245, 158, 11, 0.6); }
        }
      `}</style>

      <div className="container" style={{ paddingTop: '2rem', position: 'relative', zIndex: 1 }}>
        {/* Winner announcement */}
        <div className="text-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '4rem',
            animation: 'trophy-bounce 1s ease-in-out infinite',
            marginBottom: '0.5rem',
          }}>
            {isWinner ? '🏆' : '🎉'}
          </div>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: '700',
            animation: 'winner-glow 2s ease-in-out infinite',
            color: 'var(--warning)',
            margin: 0,
          }}>
            {winnerName} gewinnt!
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {gamesPlayed} {gamesPlayed === 1 ? 'Spiel' : 'Spiele'} gespielt
          </p>
        </div>

        {/* Rankings */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1rem' }}>
            Gesamtwertung
          </h3>
          {rankings.map((entry) => {
            const medals = ['🥇', '🥈', '🥉'];
            const isMe = entry.playerId === playerId;
            return (
              <div
                key={entry.playerId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: isMe
                    ? 'rgba(99, 102, 241, 0.15)'
                    : entry.rank <= 3
                    ? 'var(--surface-light)'
                    : 'transparent',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.4rem',
                  border: isMe ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', width: '2rem', textAlign: 'center' }}>
                    {medals[entry.rank - 1] || `${entry.rank}.`}
                  </span>
                  <span style={{ fontWeight: isMe ? '700' : '500' }}>
                    {entry.playerName}
                    {isMe && ' (Du)'}
                  </span>
                </span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
                  {entry.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Auto-transition hint */}
        <p className="text-secondary text-center" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Voting startet gleich...
        </p>

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
