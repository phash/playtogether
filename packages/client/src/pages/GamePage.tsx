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
import ResultsScreen from '../components/ResultsScreen';
import VoteScreen from '../components/VoteScreen';
import SessionEndScreen from '../components/SessionEndScreen';

export default function GamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const {
    room,
    gameState,
    playerId,
    leaveRoom,
    gameResultsData,
    voteData,
    voteResultData,
    sessionEndedData,
  } = useGameStore();

  // Redirect wenn kein Raum
  useEffect(() => {
    if (!room) {
      navigate('/');
    } else if (room.status === 'finished' && !sessionEndedData) {
      navigate(`/lobby/${code}`);
    }
  }, [room, navigate, code, sessionEndedData]);

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

  // Session ended - final results
  if (sessionEndedData) {
    return <SessionEndScreen />;
  }

  // Game results - post-game ranking with confetti
  if (gameResultsData) {
    return <ResultsScreen />;
  }

  // Voting or vote result
  if (voteData || voteResultData) {
    return <VoteScreen />;
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
