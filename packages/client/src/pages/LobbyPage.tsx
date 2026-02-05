/**
 * LobbyPage - Warteraum vor Spielbeginn
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGameInfo } from '@playtogether/shared';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { room, playerId, countdown, leaveRoom, startGame } = useGameStore();

  // Redirect wenn kein Raum
  useEffect(() => {
    if (!room) {
      navigate('/');
    }
  }, [room, navigate]);

  // Redirect zu Spiel wenn es losgeht
  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/game/${code}`);
    }
  }, [room?.status, code, navigate]);

  if (!room) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const gameInfo = getGameInfo(room.gameType);
  const isHost = room.hostId === playerId;
  const canStart = room.players.length >= room.minPlayers;

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?join=${room.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PlayTogether',
          text: `Spiel mit mir ${gameInfo?.name}! Code: ${room.code}`,
          url,
        });
      } catch {
        copyToClipboard(room.code);
      }
    } else {
      copyToClipboard(room.code);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Code "${text}" kopiert!`);
  };

  // Countdown Anzeige
  if (countdown !== null) {
    return (
      <div
        className="container"
        style={{
          paddingTop: '4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <p className="text-secondary mb-2">Spiel startet in</p>
        <div className="countdown">{countdown}</div>
        <p className="mt-2" style={{ fontSize: '1.5rem' }}>
          {gameInfo?.icon} {gameInfo?.name}
        </p>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <span style={{ fontSize: '2.5rem' }}>{gameInfo?.icon}</span>
        <h1 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
          {gameInfo?.name}
        </h1>
      </div>

      {/* Room Code */}
      <div className="card mb-3">
        <p className="text-secondary text-center mb-1">Raum-Code</p>
        <div className="room-code">{room.code}</div>
        <button
          className="btn btn-secondary mt-2"
          onClick={handleShare}
          style={{ fontSize: '0.9rem' }}
        >
          📤 Code teilen
        </button>
      </div>

      {/* Players */}
      <div className="card mb-3">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <h2 style={{ fontSize: '1rem' }}>Spieler</h2>
          <span className="text-secondary">
            {room.players.length}/{room.maxPlayers}
          </span>
        </div>

        <div className="player-list">
          {room.players.map((player) => (
            <div key={player.id} className="player-item">
              <div
                className="player-avatar"
                style={{ backgroundColor: player.avatarColor }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="player-name">
                {player.name}
                {player.id === playerId && ' (Du)'}
              </span>
              {player.isHost && <span className="player-badge">👑 Host</span>}
            </div>
          ))}

          {/* Leere Slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="player-item"
                style={{ opacity: 0.4 }}
              >
                <div
                  className="player-avatar"
                  style={{ backgroundColor: '#475569' }}
                >
                  ?
                </div>
                <span className="player-name text-secondary">
                  Wartet auf Spieler...
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Actions */}
      {isHost ? (
        <>
          <button
            className="btn btn-success mb-2"
            onClick={startGame}
            disabled={!canStart}
          >
            {canStart
              ? '🚀 Spiel starten'
              : `⏳ Noch ${room.minPlayers - room.players.length} Spieler benötigt`}
          </button>
        </>
      ) : (
        <div
          className="card text-center"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <p>⏳ Warte auf Host...</p>
        </div>
      )}

      <button
        className="btn btn-secondary mt-2"
        onClick={handleLeave}
        style={{ marginTop: '1rem' }}
      >
        🚪 Raum verlassen
      </button>
    </div>
  );
}
