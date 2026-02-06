/**
 * SessionEndScreen - Finale Ergebnisse nach Session-Ende
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function SessionEndScreen() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { sessionEndedData, playerId, leaveRoom } = useGameStore();

  if (!sessionEndedData) return null;

  const { finalRankings, gamesPlayed } = sessionEndedData;
  const winner = finalRankings[0];
  const isWinner = winner?.playerId === playerId;

  const handleBackToLobby = () => {
    leaveRoom();
    navigate('/');
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Confetti for winner */}
      {isWinner && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-10px',
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                background: ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'][i % 7],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `confetti-fall-end ${2.5 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti-fall-end {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes final-trophy {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>

      <div className="container" style={{ paddingTop: '2rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '4.5rem',
            animation: 'final-trophy 2s ease-in-out infinite',
            marginBottom: '0.5rem',
          }}>
            {isWinner ? '🏆' : '🎮'}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: '0 0 0.25rem' }}>
            {isWinner ? 'Du hast gewonnen!' : 'Session beendet!'}
          </h1>
          <p className="text-secondary">
            {gamesPlayed} {gamesPlayed === 1 ? 'Spiel' : 'Spiele'} gespielt
          </p>
        </div>

        {/* Final Rankings */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1rem' }}>
            Endergebnis
          </h3>
          {finalRankings.map((entry) => {
            const medals = ['🥇', '🥈', '🥉'];
            const isMe = entry.playerId === playerId;
            return (
              <div
                key={entry.playerId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 0.75rem',
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
                  <span style={{ fontSize: '1.3rem', width: '2rem', textAlign: 'center' }}>
                    {medals[entry.rank - 1] || `${entry.rank}.`}
                  </span>
                  <span style={{ fontWeight: isMe ? '700' : '500', fontSize: '1.05rem' }}>
                    {entry.playerName}
                    {isMe && ' (Du)'}
                  </span>
                </span>
                <span style={{ fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--primary)' }}>
                  {entry.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Back to lobby */}
        <button
          className="btn btn-primary"
          onClick={handleBackToLobby}
        >
          Zurück zur Lobby
        </button>
      </div>
    </div>
  );
}
