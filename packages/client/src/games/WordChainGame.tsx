/**
 * WordChainGame - Wortkette Spielkomponente
 */

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { WordChainGameState } from '@playtogether/shared';

export default function WordChainGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as WordChainGameState;
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(state?.turnTimeLimit || 15);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMyTurn = state?.currentPlayerId === playerId;
  const isEliminated = state?.eliminatedPlayers.includes(playerId || '');

  // Timer
  useEffect(() => {
    if (state?.phase !== 'active' || !isMyTurn) return;

    setTimeLeft(state.turnTimeLimit);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [state?.phase, state?.currentPlayerId, isMyTurn]);

  // Focus Input wenn dran
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
    setInput('');
    setError(null);
  }, [state?.currentPlayerId, isMyTurn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || !input.trim()) return;

    sendGameAction('submit_word', { word: input.trim() });
    setInput('');
  };

  if (!state) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const currentPlayer = room?.players.find((p) => p.id === state.currentPlayerId);
  const activePlayers = room?.players.filter(
    (p) => !state.eliminatedPlayers.includes(p.id)
  );

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Aktuelles Wort */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div className="text-secondary" style={{ marginBottom: '0.5rem' }}>
          Aktuelles Wort
        </div>
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'var(--surface)',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius)',
            display: 'inline-block',
          }}
        >
          {state.currentWord.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '1.2rem',
            color: 'var(--primary)',
          }}
        >
          Nächster Buchstabe:{' '}
          <strong style={{ fontSize: '1.5rem' }}>
            {state.lastLetter.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* Wer ist dran */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          background: isMyTurn ? 'var(--primary)' : 'var(--surface)',
          color: isMyTurn ? 'white' : 'var(--text)',
        }}
      >
        {isEliminated ? (
          <div>
            <span style={{ fontSize: '2rem' }}>😵</span>
            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              Du bist ausgeschieden!
            </p>
          </div>
        ) : isMyTurn ? (
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              Du bist dran!
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginTop: '0.5rem',
                color: timeLeft < 5 ? 'var(--warning)' : 'inherit',
              }}
            >
              {timeLeft}s
            </div>
          </div>
        ) : (
          <div>
            <div className="text-secondary" style={{ marginBottom: '0.25rem' }}>
              Am Zug:
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {currentPlayer?.name}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {isMyTurn && !isEliminated && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Wort mit "${state.lastLetter.toUpperCase()}"...`}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
              autoComplete="off"
              autoCapitalize="off"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.5rem 1rem',
                background: input.trim() ? 'var(--primary)' : 'var(--surface-light)',
                color: input.trim() ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              Senden
            </button>
          </div>
        </form>
      )}

      {/* Fehler */}
      {error && (
        <div
          className="fade-in"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Spieler Liste */}
      <div>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Spieler</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {room?.players.map((player) => {
            const isActive = !state.eliminatedPlayers.includes(player.id);
            const isCurrent = player.id === state.currentPlayerId;

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: isCurrent ? 'var(--primary)' : 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  opacity: isActive ? 1 : 0.5,
                  color: isCurrent ? 'white' : 'var(--text)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: player.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {isActive ? player.name.charAt(0).toUpperCase() : '❌'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>
                    {player.name}
                    {player.id === playerId && ' (Du)'}
                  </div>
                  {!isActive && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      Ausgeschieden
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {state.scores[player.id] || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verwendete Wörter */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
          Verwendete Wörter ({state.usedWords.length})
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            maxHeight: '100px',
            overflow: 'auto',
          }}
        >
          {state.usedWords.slice(-10).map((word, i) => (
            <span
              key={i}
              style={{
                background: 'var(--surface-light)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
