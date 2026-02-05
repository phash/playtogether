/**
 * AnagramGame - Anagramme Spielkomponente
 */

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { AnagramGameState } from '@playtogether/shared';
import { shuffleArray } from '@playtogether/shared';

export default function AnagramGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as AnagramGameState;
  const [input, setInput] = useState('');
  const [displayLetters, setDisplayLetters] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{ valid: boolean; word: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(state?.timeRemaining || 60);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialisiere Buchstaben
  useEffect(() => {
    if (state?.letters) {
      setDisplayLetters([...state.letters]);
    }
  }, [state?.letters, state?.currentRound]);

  // Timer
  useEffect(() => {
    if (state?.phase !== 'active') return;

    setTimeLeft(state.timeRemaining);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [state?.phase, state?.currentRound]);

  // Clear input bei neuer Runde
  useEffect(() => {
    setInput('');
    setLastResult(null);
  }, [state?.currentRound]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state?.phase !== 'active') return;

    sendGameAction('submit_word', { word: input.trim().toLowerCase() });
    setInput('');
  };

  const handleShuffle = () => {
    setDisplayLetters(shuffleArray([...displayLetters]));
    sendGameAction('shuffle_letters', {});
  };

  const handleLetterClick = (letter: string, index: number) => {
    setInput((prev) => prev + letter.toLowerCase());
    inputRef.current?.focus();
  };

  if (!state) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const myWords = state.foundWords[playerId || ''] || [];
  const isReveal = state.phase === 'reveal';

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <span className="text-secondary">
            Runde {state.currentRound}/{state.totalRounds}
          </span>
          <span style={{
            color: timeLeft < 15 ? 'var(--error)' : 'var(--text)',
            fontWeight: timeLeft < 15 ? 'bold' : 'normal',
          }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Timer Bar */}
      <div
        style={{
          height: '6px',
          background: 'var(--surface-light)',
          borderRadius: '3px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(timeLeft / (state.timeRemaining || 60)) * 100}%`,
            background: timeLeft < 15 ? 'var(--error)' : 'var(--primary)',
            transition: 'width 1s linear, background 0.3s',
          }}
        />
      </div>

      {/* Buchstaben */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        {displayLetters.map((letter, index) => (
          <button
            key={index}
            onClick={() => handleLetterClick(letter, index)}
            disabled={isReveal}
            style={{
              width: '48px',
              height: '48px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: isReveal ? 'default' : 'pointer',
              transition: 'transform 0.1s',
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Mischen Button */}
      {!isReveal && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={handleShuffle}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--surface-light)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            Mischen
          </button>
        </div>
      )}

      {/* Input */}
      {!isReveal && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Wort eingeben..."
              style={{
                flex: 1,
                padding: '1rem',
                fontSize: '1.1rem',
                border: '2px solid var(--surface-light)',
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
                padding: '1rem 1.5rem',
                background: input.trim() ? 'var(--primary)' : 'var(--surface-light)',
                color: input.trim() ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 'bold',
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              OK
            </button>
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                style={{
                  padding: '1rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-light)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                X
              </button>
            )}
          </div>
        </form>
      )}

      {/* Feedback */}
      {lastResult && (
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            background: lastResult.valid
              ? 'rgba(34, 197, 94, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
            color: lastResult.valid ? 'var(--success)' : 'var(--error)',
          }}
        >
          {lastResult.valid
            ? `"${lastResult.word}" - Richtig!`
            : `"${lastResult.word}" - Ungültig`
          }
        </div>
      )}

      {/* Gefundene Wörter */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Deine Wörter</h3>
          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
            {myWords.length} gefunden
          </span>
        </div>
        {myWords.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {myWords.map((word, i) => (
              <span
                key={i}
                style={{
                  background: word === state.bonusWord
                    ? 'var(--warning)'
                    : 'var(--surface-light)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: word === state.bonusWord ? 'bold' : 'normal',
                }}
              >
                {word}
                {word === state.bonusWord && ' ★'}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>
            Noch keine Wörter gefunden
          </p>
        )}
      </div>

      {/* Reveal Phase - Alle Wörter */}
      {isReveal && state.allValidWords.length > 0 && (
        <div className="card fade-in">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            Alle möglichen Wörter ({state.allValidWords.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {state.allValidWords.map((word, i) => {
              const found = myWords.includes(word);
              return (
                <span
                  key={i}
                  style={{
                    background: word === state.bonusWord
                      ? 'var(--warning)'
                      : found
                        ? 'var(--success)'
                        : 'var(--surface-light)',
                    color: found || word === state.bonusWord ? 'white' : 'var(--text)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.9rem',
                  }}
                >
                  {word}
                  {word === state.bonusWord && ' (Bonus)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Andere Spieler */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Spieler</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {room?.players.map((player) => {
            const words = state.foundWords[player.id] || [];
            return (
              <div
                key={player.id}
                style={{
                  padding: '0.75rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: player.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {player.name}
                    {player.id === playerId && ' (Du)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {words.length} Wörter
                  </div>
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {state.scores[player.id] || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
