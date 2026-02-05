/**
 * EntwederOderGame - Was wählt die Mehrheit?
 */

import { useGameStore } from '../store/gameStore';
import type { EntwederOderGameState } from '@playtogether/shared';

export default function EntwederOderGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as EntwederOderGameState;

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const myVote = state.votes[playerId];
  const hasVoted = myVote !== undefined && myVote !== null;

  // Timer bar
  const maxTime = room.settings.timePerRound || 15;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  const handleVote = (choice: 'A' | 'B') => {
    if (hasVoted || state.phase !== 'active') return;
    sendGameAction('vote', { choice });
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
          <p className="text-secondary">Wer hat am meisten mit der Mehrheit gestimmt?</p>
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

  if (!state.currentQuestion) {
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p className="mt-2 text-secondary">Nächste Frage wird geladen...</p>
        </div>
      </div>
    );
  }

  const question = state.currentQuestion;

  // Reveal phase - show results
  if ((state.phase === 'reveal' || state.votingComplete) && state.results) {
    const { percentA, percentB } = state.results;
    const majorityA = percentA >= percentB;
    const majorityB = percentB > percentA;

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

        {/* Category */}
        {question.category && (
          <div className="text-center mb-2">
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              background: 'var(--surface-light)',
              color: 'var(--text-secondary)',
            }}>
              {question.category}
            </span>
          </div>
        )}

        {/* Option A Result */}
        <div
          className="card"
          style={{
            marginBottom: '0.75rem',
            border: majorityA ? '2px solid var(--primary)' : '2px solid transparent',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${percentA}%`,
              background: 'rgba(99, 102, 241, 0.12)',
              transition: 'width 1s ease-out',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginRight: '0.5rem' }}>A</span>
              <span style={{ fontWeight: '600' }}>{question.optionA}</span>
              {myVote === 'A' && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  (Deine Wahl)
                </span>
              )}
            </div>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: majorityA ? 'var(--primary)' : 'var(--text-secondary)',
            }}>
              {Math.round(percentA)}%
            </span>
          </div>
        </div>

        {/* Option B Result */}
        <div
          className="card"
          style={{
            border: majorityB ? '2px solid var(--primary)' : '2px solid transparent',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${percentB}%`,
              background: 'rgba(99, 102, 241, 0.12)',
              transition: 'width 1s ease-out',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginRight: '0.5rem' }}>B</span>
              <span style={{ fontWeight: '600' }}>{question.optionB}</span>
              {myVote === 'B' && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  (Deine Wahl)
                </span>
              )}
            </div>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: majorityB ? 'var(--primary)' : 'var(--text-secondary)',
            }}>
              {Math.round(percentB)}%
            </span>
          </div>
        </div>

        <p className="text-center text-secondary mt-2" style={{ fontSize: '0.85rem' }}>
          {state.results.total} {state.results.total === 1 ? 'Stimme' : 'Stimmen'} abgegeben
        </p>
      </div>
    );
  }

  // Active / Voting phase
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

      {/* Category */}
      {question.category && (
        <div className="text-center mb-2">
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            background: 'var(--surface-light)',
            color: 'var(--text-secondary)',
          }}>
            {question.category}
          </span>
        </div>
      )}

      <p className="text-center text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
        Was wählst du?
      </p>

      {/* Option A */}
      <button
        onClick={() => handleVote('A')}
        disabled={hasVoted}
        style={{
          width: '100%',
          padding: '1.5rem 1.25rem',
          marginBottom: '0.75rem',
          borderRadius: 'var(--radius-lg, 20px)',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: hasVoted ? 'default' : 'pointer',
          border: myVote === 'A' ? '2px solid var(--primary)' : '2px solid transparent',
          background: myVote === 'A' ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface)',
          color: 'var(--text)',
          transition: 'all 0.2s',
          textAlign: 'left' as const,
        }}
      >
        <span style={{ color: 'var(--primary)', marginRight: '0.75rem', fontSize: '1.3rem' }}>A</span>
        {question.optionA}
      </button>

      {/* VS divider */}
      <div className="text-center mb-1" style={{
        fontWeight: 'bold',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
      }}>
        ODER
      </div>

      {/* Option B */}
      <button
        onClick={() => handleVote('B')}
        disabled={hasVoted}
        style={{
          width: '100%',
          padding: '1.5rem 1.25rem',
          marginBottom: '1rem',
          borderRadius: 'var(--radius-lg, 20px)',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: hasVoted ? 'default' : 'pointer',
          border: myVote === 'B' ? '2px solid var(--primary)' : '2px solid transparent',
          background: myVote === 'B' ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface)',
          color: 'var(--text)',
          transition: 'all 0.2s',
          textAlign: 'left' as const,
        }}
      >
        <span style={{ color: 'var(--primary)', marginRight: '0.75rem', fontSize: '1.3rem' }}>B</span>
        {question.optionB}
      </button>

      {/* Waiting */}
      {hasVoted && (
        <div className="text-center fade-in">
          <p className="text-secondary">Warte auf andere...</p>
        </div>
      )}
    </div>
  );
}
