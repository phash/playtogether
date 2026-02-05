/**
 * RockPaperScissorsGame - Schere Stein Papier Turnier
 */

import { useGameStore } from '../store/gameStore';
import type { RockPaperScissorsGameState, RPSChoice } from '@playtogether/shared';

const CHOICES: { value: RPSChoice; emoji: string; label: string }[] = [
  { value: 'rock', emoji: '🪨', label: 'Stein' },
  { value: 'scissors', emoji: '✌️', label: 'Schere' },
  { value: 'paper', emoji: '📄', label: 'Papier' },
];

function getChoiceEmoji(choice: RPSChoice | null): string {
  if (!choice) return '❓';
  return CHOICES.find((c) => c.value === choice)?.emoji || '❓';
}

function getChoiceLabel(choice: RPSChoice | null): string {
  if (!choice) return '???';
  return CHOICES.find((c) => c.value === choice)?.label || '???';
}

// Who beats who
function getWinner(c1: RPSChoice, c2: RPSChoice): 0 | 1 | 2 {
  if (c1 === c2) return 0; // draw
  if (
    (c1 === 'rock' && c2 === 'scissors') ||
    (c1 === 'scissors' && c2 === 'paper') ||
    (c1 === 'paper' && c2 === 'rock')
  ) return 1; // player 1
  return 2; // player 2
}

export default function RockPaperScissorsGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as RockPaperScissorsGameState;

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
  const maxTime = room.settings.timePerRound || 5;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  const handleChoose = (choice: RPSChoice) => {
    sendGameAction('choose', { choice });
  };

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Turnier beendet!</h2>
        </div>
        {/* Tournament bracket */}
        {state.bracket && (
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
        {/* Bye notice */}
        {state.bye === playerId && (
          <div className="card text-center mt-2" style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid var(--warning)',
          }}>
            <p style={{ color: 'var(--warning)', fontWeight: '600' }}>
              Du hast ein Freilos und kommst automatisch weiter!
            </p>
          </div>
        )}
      </div>
    );
  }

  const isPlayer1 = currentMatch.player1 === playerId;
  const isPlayer2 = currentMatch.player2 === playerId;
  const isMyMatch = isPlayer1 || isPlayer2;
  const myChoice = playerId ? currentMatch.choices[playerId] : null;
  const hasChosen = myChoice !== null && myChoice !== undefined;

  // Opponent's info
  const opponentId = isPlayer1 ? currentMatch.player2 : currentMatch.player1;
  const opponentChoice = opponentId ? currentMatch.choices[opponentId] : null;
  const bothChosen = currentMatch.choices[currentMatch.player1] != null &&
    currentMatch.choices[currentMatch.player2] != null;

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
      <div className="text-center mb-1">
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          Turnier-Runde {state.tournamentRound}
          {state.bestOf === 3 && ` (Best of 3 - Spiel ${currentMatch.round}/${currentMatch.maxRounds})`}
        </span>
      </div>

      {/* Match players */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '0 0.5rem',
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{
            fontWeight: currentMatch.player1 === playerId ? '700' : '500',
            fontSize: '0.95rem',
            color: currentMatch.player1 === playerId ? 'var(--primary)' : 'var(--text)',
            marginBottom: '0.25rem',
          }}>
            {getPlayerName(currentMatch.player1)}
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {currentMatch.scores[currentMatch.player1] || 0} Siege
          </span>
        </div>
        <span className="text-secondary" style={{ fontWeight: 'bold', padding: '0 0.5rem' }}>VS</span>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{
            fontWeight: currentMatch.player2 === playerId ? '700' : '500',
            fontSize: '0.95rem',
            color: currentMatch.player2 === playerId ? 'var(--primary)' : 'var(--text)',
            marginBottom: '0.25rem',
          }}>
            {getPlayerName(currentMatch.player2)}
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {currentMatch.scores[currentMatch.player2] || 0} Siege
          </span>
        </div>
      </div>

      {/* Reveal phase: show both choices */}
      {(state.phase === 'reveal' || (bothChosen && currentMatch.finished)) && (
        <div className="card fade-in" style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '1rem 0',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                {getChoiceEmoji(currentMatch.choices[currentMatch.player1] as RPSChoice | null)}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {getChoiceLabel(currentMatch.choices[currentMatch.player1] as RPSChoice | null)}
              </p>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              VS
            </span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                {getChoiceEmoji(currentMatch.choices[currentMatch.player2] as RPSChoice | null)}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {getChoiceLabel(currentMatch.choices[currentMatch.player2] as RPSChoice | null)}
              </p>
            </div>
          </div>

          {/* Round winner */}
          {currentMatch.winner !== undefined && (
            <div className="text-center" style={{ marginTop: '0.5rem' }}>
              {currentMatch.winner === null ? (
                <p style={{ fontWeight: '600', color: 'var(--warning)' }}>Unentschieden!</p>
              ) : currentMatch.winner === playerId ? (
                <p style={{ fontWeight: '600', color: 'var(--success)' }}>Du gewinnst die Runde!</p>
              ) : (
                <p style={{ fontWeight: '600', color: 'var(--error)' }}>
                  {getPlayerName(currentMatch.winner)} gewinnt die Runde!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Choice buttons (only when active and in match) */}
      {isMyMatch && state.phase === 'active' && !hasChosen && (
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          {CHOICES.map((choice) => (
            <button
              key={choice.value}
              onClick={() => handleChoose(choice.value)}
              style={{
                flex: 1,
                maxWidth: '120px',
                padding: '1.25rem 0.75rem',
                borderRadius: 'var(--radius-lg, 20px)',
                border: '2px solid var(--surface-light)',
                background: 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'center' as const,
                transition: 'all 0.2s',
                color: 'var(--text)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                {choice.emoji}
              </div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                {choice.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chosen, waiting */}
      {isMyMatch && hasChosen && state.phase === 'active' && (
        <div className="card text-center fade-in">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {getChoiceEmoji(myChoice)}
          </div>
          <p className="text-secondary">
            {getChoiceLabel(myChoice)} gewählt. Warte auf Gegner...
          </p>
        </div>
      )}

      {/* Match finished */}
      {currentMatch.finished && (
        <div className="card text-center fade-in" style={{
          background: currentMatch.winner === playerId
            ? 'rgba(34, 197, 94, 0.15)'
            : currentMatch.winner === null
              ? 'rgba(245, 158, 11, 0.15)'
              : isMyMatch
                ? 'rgba(239, 68, 68, 0.15)'
                : 'var(--surface)',
          border: currentMatch.winner === playerId
            ? '1px solid var(--success)'
            : currentMatch.winner === null
              ? '1px solid var(--warning)'
              : isMyMatch
                ? '1px solid var(--error)'
                : '1px solid var(--surface-light)',
        }}>
          {currentMatch.winner === null ? (
            <p style={{ fontWeight: '600', color: 'var(--warning)' }}>Unentschieden im Match!</p>
          ) : currentMatch.winner === playerId ? (
            <>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <p style={{ fontWeight: '600', color: 'var(--success)', marginTop: '0.25rem' }}>
                Du hast das Match gewonnen!
              </p>
            </>
          ) : isMyMatch ? (
            <p style={{ fontWeight: '600', color: 'var(--error)' }}>
              {getPlayerName(currentMatch.winner!)} gewinnt das Match!
            </p>
          ) : (
            <p style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
              {getPlayerName(currentMatch.winner!)} gewinnt das Match!
            </p>
          )}
        </div>
      )}

      {/* Spectator */}
      {!isMyMatch && state.phase === 'active' && (
        <div className="text-center mt-2">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Du schaust zu...
          </p>
        </div>
      )}

      {/* Bye notice */}
      {state.bye === playerId && (
        <div className="card text-center mt-2" style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid var(--warning)',
        }}>
          <p style={{ color: 'var(--warning)', fontWeight: '600', fontSize: '0.9rem' }}>
            Du hast ein Freilos!
          </p>
        </div>
      )}

      {/* Tournament bracket */}
      {state.bracket && (
        <div className="card mt-2">
          <h3 className="mb-2 text-center" style={{ fontSize: '0.95rem' }}>Turnierbaum</h3>
          {renderBracket(state.bracket, getPlayerName, playerId)}
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
            fontWeight: (pair[1] && pair[1] === playerId) ? '700' : '500',
            color: (pair[1] && pair[1] === playerId) ? 'var(--primary)' : 'var(--text)',
            flex: 1,
          }}>
            {pair[1] ? getPlayerName(pair[1]) : 'Freilos'}
          </span>
        </div>
      ))}
    </div>
  );
}
