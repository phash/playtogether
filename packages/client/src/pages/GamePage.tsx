/**
 * GamePage - Aktives Spiel
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getGameInfo } from '@playtogether/shared';
import AnagrammeGame from '../games/AnagrammeGame';
import QuizChampGame from '../games/QuizChampGame';
import EntwederOderGame from '../games/EntwederOderGame';
import GluecksradGame from '../games/GluecksradGame';
import TicTacToeGame from '../games/TicTacToeGame';
import RockPaperScissorsGame from '../games/RockPaperScissorsGame';
import HangmanGame from '../games/HangmanGame';
import IntermissionScreen from '../components/IntermissionScreen';

export default function GamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { room, gameState, playerId, leaveRoom, intermissionData, playlistEndedData } = useGameStore();

  // Redirect wenn kein Raum
  useEffect(() => {
    if (!room) {
      navigate('/');
    } else if (room.status === 'finished' && !playlistEndedData) {
      navigate(`/lobby/${code}`);
    }
  }, [room, navigate, code, playlistEndedData]);

  if (!room) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="loading">
          <div className="spinner" />
          <p className="mt-2 text-secondary">Lade Spiel...</p>
        </div>
      </div>
    );
  }

  // Playlist ended - final results
  if (playlistEndedData) {
    const { finalRankings } = playlistEndedData;
    const winner = finalRankings[0];
    const isWinner = winner?.playerId === playerId;

    return (
      <div className="container fade-in" style={{ paddingTop: '2rem' }}>
        <div className="text-center mb-3">
          <div style={{ fontSize: '4rem' }}>{isWinner ? '🏆' : '🎮'}</div>
          <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
            {isWinner ? 'Du hast gewonnen!' : 'Playlist beendet!'}
          </h1>
        </div>

        <div className="card mb-3">
          <h3 className="mb-2" style={{ textAlign: 'center' }}>Endergebnis</h3>
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
                  padding: '0.75rem',
                  background: isMe ? 'var(--primary-light)' : 'var(--surface-light)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.5rem',
                }}
              >
                <span>
                  {medals[entry.rank - 1] || `${entry.rank}.`} {entry.playerName}
                  {isMe && ' (Du)'}
                </span>
                <span style={{ fontWeight: 'bold' }}>{entry.score} Punkte</span>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate(`/lobby/${code}`)}
        >
          Zurück zur Lobby
        </button>
      </div>
    );
  }

  // Intermission between playlist games
  if (intermissionData) {
    return <IntermissionScreen />;
  }

  // Waiting for game state
  if (!gameState) {
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

  const renderGame = () => {
    switch (room.gameType) {
      case 'anagramme':
        return <AnagrammeGame />;
      case 'quiz_champ':
        return <QuizChampGame />;
      case 'entweder_oder':
        return <EntwederOderGame />;
      case 'gluecksrad':
        return <GluecksradGame />;
      case 'tic_tac_toe':
        return <TicTacToeGame />;
      case 'rock_paper_scissors':
        return <RockPaperScissorsGame />;
      case 'hangman':
        return <HangmanGame />;
      default:
        return (
          <div className="card text-center" style={{ marginTop: '2rem', padding: '3rem' }}>
            <h2>Unbekanntes Spiel</h2>
          </div>
        );
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
          {room.playlist.length > 1 && (
            <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
              Spiel {room.currentPlaylistIndex + 1}/{room.playlist.length}
            </span>
          )}
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
