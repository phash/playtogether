/**
 * EmojiDrawGame - Male mit Emojis und lass andere raten!
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { EmojiDrawGameState } from '@playtogether/shared';
import { EMOJI_PALETTE } from '@playtogether/shared';

export default function EmojiDrawGame() {
  const { gameState, sendGameAction, room, playerId, timerValue } = useGameStore();
  const state = gameState as EmojiDrawGameState;
  const [guess, setGuess] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(EMOJI_PALETTE)[0]);

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const isDrawer = playerId === state.drawerId;
  const drawerName = players.find((p) => p.id === state.drawerId)?.name || 'Unbekannt';

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name || 'Unbekannt';

  const handleCellClick = (position: number) => {
    if (!isDrawer) return;
    if (state.emojiBoard[position]) {
      sendGameAction('remove_emoji', { position });
    } else if (selectedEmoji) {
      sendGameAction('place_emoji', { emoji: selectedEmoji, position });
    }
  };

  const handleSubmitGuess = () => {
    const trimmed = guess.trim();
    if (!trimmed) return;
    sendGameAction('guess', { text: trimmed });
    setGuess('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmitGuess();
  };

  const timeLeft = timerValue ?? state.timeRemaining;
  const maxTime = room.settings.timePerRound || 90;
  const timerPercent = Math.max(0, (timeLeft / maxTime) * 100);
  const timerColor = timerPercent > 50 ? 'var(--success)' : timerPercent > 25 ? 'var(--warning)' : 'var(--error)';

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2>Spiel beendet!</h2>
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
                <span>{player.name}</span>
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

  // Reveal phase
  if (state.phase === 'reveal') {
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <p className="text-secondary mb-1">Das Wort war</p>
          <h2 style={{ color: state.solved ? 'var(--success)' : 'var(--error)', fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            {state.word}
          </h2>

          {/* Show final board */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            maxWidth: '240px',
            margin: '0 auto 1rem',
          }}>
            {state.emojiBoard.map((emoji, i) => (
              <div
                key={i}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-light)',
                  borderRadius: '6px',
                  fontSize: '1.5rem',
                }}
              >
                {emoji || ''}
              </div>
            ))}
          </div>

          {state.solved && state.solvedBy && (
            <p style={{ color: 'var(--success)' }}>
              Geraten von <strong>{getPlayerName(state.solvedBy)}</strong>!
            </p>
          )}
          {!state.solved && (
            <p style={{ color: 'var(--error)' }}>Nicht geraten</p>
          )}
        </div>
      </div>
    );
  }

  // Active phase
  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* Timer */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'var(--surface-light)',
        borderRadius: '2px',
        marginBottom: '0.75rem',
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          {state.category}
        </span>
      </div>

      {/* Word for drawer */}
      {isDrawer && (
        <div className="card text-center mb-2" style={{ padding: '0.75rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Du malst:</p>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', margin: 0 }}>{state.word}</h2>
        </div>
      )}

      {!isDrawer && (
        <div className="text-center mb-2">
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            <strong>{drawerName}</strong> malt...
          </p>
        </div>
      )}

      {/* Emoji Board - 4x4 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        maxWidth: '280px',
        margin: '0 auto 0.75rem',
      }}>
        {state.emojiBoard.map((emoji, i) => (
          <div
            key={i}
            onClick={() => handleCellClick(i)}
            style={{
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: emoji ? 'var(--surface-light)' : 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '2rem',
              cursor: isDrawer ? 'pointer' : 'default',
              border: isDrawer && !emoji && selectedEmoji ? '2px dashed var(--primary)' : '2px solid transparent',
              transition: 'background 0.15s',
            }}
          >
            {emoji || ''}
          </div>
        ))}
      </div>

      {/* Emoji Palette (drawer only) */}
      {isDrawer && (
        <div className="card" style={{ padding: '0.5rem' }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            overflowX: 'auto',
            marginBottom: '0.5rem',
            paddingBottom: '0.25rem',
          }}>
            {Object.keys(EMOJI_PALETTE).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  border: 'none',
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-light)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          }}>
            {(EMOJI_PALETTE[activeCategory] || []).map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  border: selectedEmoji === emoji ? '2px solid var(--primary)' : '2px solid transparent',
                  borderRadius: '6px',
                  background: selectedEmoji === emoji ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guess input (non-drawer) */}
      {!isDrawer && !state.solved && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            className="input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Was wird hier gemalt?"
            autoComplete="off"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmitGuess}
            disabled={!guess.trim()}
            style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
          >
            Raten
          </button>
        </div>
      )}

      {state.solved && (
        <div className="card text-center" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <p style={{ color: 'var(--success)', fontWeight: '600', marginTop: '0.5rem' }}>
            {state.solvedBy === playerId ? 'Du hast es geraten!' : `${getPlayerName(state.solvedBy!)} hat es geraten!`}
          </p>
        </div>
      )}

      {/* Guesses */}
      {state.guesses.length > 0 && (
        <div className="card mt-2" style={{ padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {state.guesses.slice(-6).map((entry, i) => (
              <div
                key={i}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  background: entry.correct ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  color: entry.correct ? 'var(--success)' : 'var(--text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{entry.correct ? '✓' : '✗'} {entry.guess}</span>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  {getPlayerName(entry.playerId)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
