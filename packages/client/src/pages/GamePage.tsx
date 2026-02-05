/**
 * GamePage - Aktives Spiel
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGameInfo } from '@playtogether/shared';
import QuizGame from '../games/QuizGame';

export default function GamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { room, gameState, playerId, leaveRoom } = useGameStore();

  // Redirect wenn kein Raum oder Spiel
  useEffect(() => {
    if (!room) {
      navigate('/');
    } else if (room.status === 'finished') {
      navigate(`/lobby/${code}`);
    }
  }, [room, navigate, code]);

  if (!room || !gameState) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="loading">
          <div className="spinner" />
          <p className="mt-2 text-secondary">Lade Spiel...</p>
        </div>
      </div>
    );
  }

  const gameInfo = getGameInfo(room.gameType);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  // Spiel-Komponente basierend auf Spieltyp rendern
  const renderGame = () => {
    switch (room.gameType) {
      case 'quiz':
        return <QuizGame />;
      case 'drawing':
        return <PlaceholderGame name="Kritzel & Rate" icon="🎨" />;
      case 'wordguess':
        return <PlaceholderGame name="Wort-Raten" icon="💬" />;
      case 'reaction':
        return <PlaceholderGame name="Reaktions-Test" icon="⚡" />;
      default:
        return <PlaceholderGame name="Unbekannt" icon="❓" />;
    }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh' }}>
      {/* Game Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--surface-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{gameInfo?.icon}</span>
          <span style={{ fontWeight: '600' }}>{gameInfo?.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="text-secondary">
            Runde {gameState.currentRound}/{gameState.totalRounds}
          </span>
          <button
            onClick={handleLeave}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--error)',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Game Content */}
      <div className="container" style={{ paddingTop: '1rem' }}>
        {renderGame()}
      </div>

      {/* Scoreboard */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--surface-light)',
          padding: '0.75rem 1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          {room.players.slice(0, 4).map((player) => (
            <div key={player.id} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: player.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.25rem',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  border:
                    player.id === playerId ? '2px solid white' : 'none',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                {gameState.scores[player.id] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Platzhalter für noch nicht implementierte Spiele
function PlaceholderGame({ name, icon }: { name: string; icon: string }) {
  return (
    <div
      className="card text-center"
      style={{ marginTop: '2rem', padding: '3rem' }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div>
      <h2>{name}</h2>
      <p className="text-secondary mt-2">
        Dieses Spiel wird bald verfügbar sein!
      </p>
    </div>
  );
}
