/**
 * ReactionTestGame - Reagiere so schnell wie möglich!
 */

import { useGameStore } from '../store/gameStore';
import type { ReactionTestGameState } from '@playtogether/shared';

export default function ReactionTestGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as ReactionTestGameState;

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const myReaction = state.reactionTimes[playerId];
  const myFalseStart = state.falseStarts[playerId] || false;
  const hasReacted = myReaction !== null || myFalseStart;

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name || 'Unbekannt';

  const handleTap = () => {
    if (!hasReacted) {
      sendGameAction('tap', {});
    }
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

  // Reveal phase - show round results
  if (state.phase === 'reveal') {
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center mb-2">
          <h2 style={{ marginBottom: '0.75rem' }}>Ergebnis</h2>
          {state.roundResults.map((result, i) => (
            <div
              key={result.playerId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                background: result.playerId === playerId ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-light)',
                borderRadius: 'var(--radius)',
                marginBottom: '0.4rem',
              }}
            >
              <span>
                {i === 0 && result.reactionTimeMs !== null ? '🏆 ' : ''}
                {getPlayerName(result.playerId)}
              </span>
              <span style={{
                fontWeight: '600',
                color: result.reactionTimeMs === null ? 'var(--error)' : 'var(--success)',
              }}>
                {result.reactionTimeMs === null
                  ? 'Zu früh!'
                  : `${result.reactionTimeMs}ms (+${result.points})`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Preparation or Active phase - the main game area
  const isPreparation = state.phase === 'preparation' || !state.signalActive;
  const bgColor = myFalseStart
    ? '#7f1d1d'
    : isPreparation
      ? '#991b1b'
      : '#166534';

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      <div
        onClick={handleTap}
        style={{
          background: bgColor,
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          cursor: hasReacted ? 'default' : 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {myFalseStart ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
            <h2 style={{ color: '#fca5a5', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Zu früh!
            </h2>
            <p style={{ color: '#fca5a5', opacity: 0.8 }}>Warte auf die anderen...</p>
          </>
        ) : myReaction !== null ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <h2 style={{ color: '#86efac', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {myReaction}ms
            </h2>
            <p style={{ color: '#86efac', opacity: 0.8 }}>Warte auf die anderen...</p>
          </>
        ) : isPreparation ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔴</div>
            <h2 style={{ color: '#fca5a5', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Warte auf das Signal...
            </h2>
            <p style={{ color: '#fca5a5', opacity: 0.8 }}>Nicht zu früh tippen!</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🟢</div>
            <h2 style={{ color: '#86efac', fontSize: '2rem', marginBottom: '0.5rem' }}>
              JETZT!
            </h2>
            <p style={{ color: '#86efac' }}>Tippe so schnell du kannst!</p>
          </>
        )}
      </div>

      {/* Player status */}
      <div className="card mt-2">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {players.map((p) => {
            const reacted = state.reactionTimes[p.id] !== null || state.falseStarts[p.id];
            return (
              <span
                key={p.id}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  background: reacted
                    ? state.falseStarts[p.id]
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)'
                    : 'var(--surface-light)',
                  color: reacted
                    ? state.falseStarts[p.id]
                      ? 'var(--error)'
                      : 'var(--success)'
                    : 'var(--text-secondary)',
                }}
              >
                {p.name}
                {reacted
                  ? state.falseStarts[p.id]
                    ? ' 💥'
                    : ' ✓'
                  : ' ...'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
