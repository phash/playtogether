/**
 * HomePage - Startseite zum Erstellen/Beitreten von Spielen
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { AVAILABLE_GAMES, type GameType } from '@playtogether/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    isConnected,
    playerName,
    setPlayerName,
    room,
    error,
    clearError,
    createRoom,
    joinRoom,
  } = useGameStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const joinParam = searchParams.get('join');

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>(joinParam ? 'join' : 'menu');
  const [selectedGame, setSelectedGame] = useState<GameType>('quiz_champ');
  const [joinCode, setJoinCode] = useState(joinParam?.toUpperCase() ?? '');
  const [localName, setLocalName] = useState(playerName);

  // Clean join parameter from URL after reading
  useEffect(() => {
    if (joinParam) {
      searchParams.delete('join');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Navigation wenn Raum erstellt/beigetreten
  useEffect(() => {
    if (room) {
      navigate(`/lobby/${room.code}`);
    }
  }, [room, navigate]);

  // Fehler nach 3 Sekunden ausblenden
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleNameSubmit = () => {
    if (localName.trim()) {
      setPlayerName(localName.trim());
    }
  };

  const handleCreateRoom = () => {
    if (!playerName) {
      handleNameSubmit();
    }
    if (localName.trim()) {
      setPlayerName(localName.trim());
      setTimeout(() => createRoom(selectedGame), 0);
    }
  };

  const handleJoinRoom = () => {
    if (!playerName) {
      handleNameSubmit();
    }
    if (localName.trim() && joinCode.trim()) {
      setPlayerName(localName.trim());
      setTimeout(() => joinRoom(joinCode.trim()), 0);
    }
  };

  if (!isConnected) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="loading">
          <div className="spinner" />
          <p className="mt-2 text-secondary">Verbinde mit Server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Logo */}
      <div className="text-center mb-4">
        <div style={{ fontSize: '4rem' }}>🎮</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>PlayTogether</h1>
        <p className="text-secondary">Spiele mit Freunden!</p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="card"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            borderLeft: '4px solid var(--error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Name Input */}
      {!playerName && (
        <div className="card mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block' }}>
            Dein Name
          </label>
          <input
            type="text"
            className="input mb-2"
            placeholder="Wie heißt du?"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </div>
      )}

      {/* Main Menu */}
      {mode === 'menu' && (
        <div className="fade-in">
          {playerName && (
            <p className="text-center mb-3">
              Hallo, <strong>{playerName}</strong>!{' '}
              <button
                onClick={() => setPlayerName('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                }}
              >
                (ändern)
              </button>
            </p>
          )}

          <button
            className="btn btn-primary mb-2"
            onClick={() => setMode('create')}
            disabled={!localName.trim()}
          >
            🎯 Spiel erstellen
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setMode('join')}
            disabled={!localName.trim()}
          >
            🚪 Spiel beitreten
          </button>
        </div>
      )}

      {/* Create Room */}
      {mode === 'create' && (
        <div className="fade-in">
          <h2 className="mb-2">Spiel wählen</h2>

          <div className="game-grid mb-3">
            {AVAILABLE_GAMES.map((game) => (
              <div
                key={game.type}
                className={`game-card ${selectedGame === game.type ? 'selected' : ''}`}
                onClick={() => setSelectedGame(game.type)}
              >
                <span className="game-icon">{game.icon}</span>
                <span className="game-name">{game.name}</span>
                <span className="game-players">
                  {game.minPlayers}-{game.maxPlayers} Spieler
                </span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary mb-2" onClick={handleCreateRoom}>
            Raum erstellen
          </button>

          <button className="btn btn-secondary" onClick={() => setMode('menu')}>
            Zurück
          </button>
        </div>
      )}

      {/* Join Room */}
      {mode === 'join' && (
        <div className="fade-in">
          <h2 className="mb-2">Raum beitreten</h2>

          <div className="card mb-3">
            <label className="text-secondary mb-1" style={{ display: 'block' }}>
              Raum-Code
            </label>
            <input
              type="text"
              className="input"
              placeholder="z.B. ABCD"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
              autoFocus
            />
          </div>

          <button
            className="btn btn-primary mb-2"
            onClick={handleJoinRoom}
            disabled={joinCode.length < 4}
          >
            Beitreten
          </button>

          <button className="btn btn-secondary" onClick={() => setMode('menu')}>
            Zurück
          </button>
        </div>
      )}

      {/* Friends Link */}
      <div className="text-center" style={{ marginTop: '1.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/friends')}
          style={{ fontSize: '0.9rem' }}
        >
          Freunde verwalten
        </button>
      </div>

      {/* Version Footer */}
      <div
        className="text-center text-secondary"
        style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.75rem', opacity: 0.6 }}
      >
        v{__APP_VERSION__}
      </div>
    </div>
  );
}
