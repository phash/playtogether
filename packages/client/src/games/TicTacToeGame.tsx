/**
 * TicTacToeGame - Klassisches Tic Tac Toe mit Turniermodus
 */

import { useGameStore } from '../store/gameStore';
import type { TicTacToeGameState, TicTacToeMatch } from '@playtogether/shared';

// Winning line combinations
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function getWinLine(match: TicTacToeMatch): number[] | null {
  if (!match.winner) return null;
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (
      match.board[a] === match.winner &&
      match.board[b] === match.winner &&
      match.board[c] === match.winner
    ) {
      return line;
    }
  }
  return null;
}

export default function TicTacToeGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as TicTacToeGameState;

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Unbekannt';
  };

  // Timer bar
  const maxTime = room.settings.timePerRound || 10;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  const handlePlace = (position: number) => {
    sendGameAction('place', { position });
  };

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Spiel beendet!</h2>
        </div>
        {/* Tournament Bracket */}
        {state.mode === 'tournament' && state.bracket && (
          <div className="card">
            <h3 className="mb-2 text-center">Turnierbaum</h3>
            {renderBracket(state.bracket, getPlayerName, playerId)}
          </div>
        )}
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
                <span style={{ fontWeight: player.id === playerId ? '700' : '500' }}>
                  {player.name}
                </span>
                {state.eliminated.includes(player.id) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Ausgeschieden</span>
                )}
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

  // Current match
  const currentMatch = state.matches[state.currentMatchIndex];
  if (!currentMatch) {
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p className="mt-2 text-secondary">Nächstes Match wird vorbereitet...</p>
        </div>
      </div>
    );
  }

  const isPlayer1 = currentMatch.player1 === playerId;
  const isPlayer2 = currentMatch.player2 === playerId;
  const isMyMatch = isPlayer1 || isPlayer2;
  const isMyTurn = currentMatch.currentTurn === playerId;
  const winLine = getWinLine(currentMatch);

  const getSymbol = (cellValue: string | null) => {
    if (!cellValue) return '';
    return cellValue === currentMatch.player1 ? 'X' : 'O';
  };

  const getMySymbol = () => {
    if (isPlayer1) return 'X';
    if (isPlayer2) return 'O';
    return '';
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* Timer Bar */}
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

      {/* Tournament info */}
      {state.mode === 'tournament' && (
        <div className="text-center mb-1">
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            background: 'var(--surface-light)',
            color: 'var(--text-secondary)',
          }}>
            Turnier-Runde {state.tournamentRound}
          </span>
        </div>
      )}

      {/* Player indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0 0.5rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius)',
          background: currentMatch.currentTurn === currentMatch.player1
            ? 'rgba(99, 102, 241, 0.2)'
            : 'var(--surface-light)',
          border: currentMatch.currentTurn === currentMatch.player1
            ? '2px solid var(--primary)'
            : '2px solid transparent',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>X</span>
          <span style={{
            fontWeight: currentMatch.player1 === playerId ? '700' : '500',
            fontSize: '0.9rem',
          }}>
            {getPlayerName(currentMatch.player1)}
          </span>
        </div>
        <span className="text-secondary" style={{ fontWeight: 'bold' }}>VS</span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius)',
          background: currentMatch.currentTurn === currentMatch.player2
            ? 'rgba(239, 68, 68, 0.2)'
            : 'var(--surface-light)',
          border: currentMatch.currentTurn === currentMatch.player2
            ? '2px solid var(--error)'
            : '2px solid transparent',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--error)' }}>O</span>
          <span style={{
            fontWeight: currentMatch.player2 === playerId ? '700' : '500',
            fontSize: '0.9rem',
          }}>
            {getPlayerName(currentMatch.player2)}
          </span>
        </div>
      </div>

      {/* Turn indicator */}
      {!currentMatch.finished && (
        <div className="text-center mb-2">
          <span style={{
            fontWeight: '600',
            color: isMyTurn ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.95rem',
          }}>
            {isMyTurn
              ? `Du bist dran (${getMySymbol()})`
              : isMyMatch
                ? `${getPlayerName(currentMatch.currentTurn)} ist dran`
                : `${getPlayerName(currentMatch.currentTurn)} ist dran`
            }
          </span>
        </div>
      )}

      {/* 3x3 Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        maxWidth: '300px',
        margin: '0 auto 1rem',
        aspectRatio: '1',
      }}>
        {currentMatch.board.map((cell, i) => {
          const symbol = getSymbol(cell);
          const isWinCell = winLine?.includes(i);
          const canClick = isMyTurn && !cell && !currentMatch.finished && isMyMatch;

          return (
            <button
              key={i}
              onClick={() => canClick && handlePlace(i)}
              disabled={!canClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isWinCell
                  ? 'rgba(34, 197, 94, 0.25)'
                  : 'var(--surface)',
                border: isWinCell
                  ? '3px solid var(--success)'
                  : '2px solid var(--surface-light)',
                borderRadius: 'var(--radius)',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                cursor: canClick ? 'pointer' : 'default',
                color: symbol === 'X' ? 'var(--primary)' : 'var(--error)',
                transition: 'all 0.2s',
                aspectRatio: '1',
              }}
            >
              {symbol}
            </button>
          );
        })}
      </div>

      {/* Match result */}
      {currentMatch.finished && (
        <div className="card text-center fade-in" style={{
          background: currentMatch.winner === playerId
            ? 'rgba(34, 197, 94, 0.15)'
            : currentMatch.winner === null
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${
            currentMatch.winner === playerId
              ? 'var(--success)'
              : currentMatch.winner === null
                ? 'var(--warning)'
                : 'var(--error)'
          }`,
        }}>
          {currentMatch.winner === null ? (
            <p style={{ fontWeight: '600', color: 'var(--warning)' }}>Unentschieden!</p>
          ) : currentMatch.winner === playerId ? (
            <>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <p style={{ fontWeight: '600', color: 'var(--success)', marginTop: '0.25rem' }}>
                Du hast gewonnen!
              </p>
            </>
          ) : (
            <p style={{ fontWeight: '600', color: 'var(--error)' }}>
              {getPlayerName(currentMatch.winner!)} hat gewonnen!
            </p>
          )}
        </div>
      )}

      {/* Tournament bracket */}
      {state.mode === 'tournament' && state.bracket && (
        <div className="card mt-2">
          <h3 className="mb-2 text-center" style={{ fontSize: '0.95rem' }}>Turnierbaum</h3>
          {renderBracket(state.bracket, getPlayerName, playerId)}
        </div>
      )}

      {/* Spectator notice */}
      {!isMyMatch && !currentMatch.finished && (
        <div className="text-center mt-2">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Du schaust zu...
          </p>
        </div>
      )}
    </div>
  );
}

function renderBracket(
  bracket: string[][],
  getPlayerName: (id: string) => string,
  playerId: string
) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {bracket.map((pair, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            background: 'var(--surface-light)',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
          }}
        >
          <span style={{
            fontWeight: pair[0] === playerId ? '700' : '500',
            color: pair[0] === playerId ? 'var(--primary)' : 'var(--text)',
            flex: 1,
            textAlign: 'right',
          }}>
            {getPlayerName(pair[0])}
          </span>
          <span className="text-secondary" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            VS
          </span>
          <span style={{
            fontWeight: pair[1] === playerId ? '700' : '500',
            color: pair[1] === playerId ? 'var(--primary)' : 'var(--text)',
            flex: 1,
          }}>
            {pair[1] ? getPlayerName(pair[1]) : 'Freilos'}
          </span>
        </div>
      ))}
    </div>
  );
}
