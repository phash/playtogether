/**
 * HangmanGame - Galgenmännchen
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { HangmanGameState } from '@playtogether/shared';

const ALL_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), 'Ä', 'Ö', 'Ü'];

/** SVG Gallows with 8 progressive stages */
function HangmanSvg({ wrongCount }: { wrongCount: number }) {
  const color = 'var(--text-secondary)';
  const bodyColor = 'var(--error)';

  return (
    <svg viewBox="0 0 200 200" width="160" height="160" style={{ display: 'block', margin: '0 auto' }}>
      {/* Stage 1: Base */}
      {wrongCount >= 1 && (
        <line x1="20" y1="180" x2="100" y2="180" stroke={color} strokeWidth="4" strokeLinecap="round" />
      )}
      {/* Stage 2: Pole */}
      {wrongCount >= 2 && (
        <line x1="60" y1="180" x2="60" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" />
      )}
      {/* Stage 3: Top beam */}
      {wrongCount >= 3 && (
        <line x1="60" y1="30" x2="140" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" />
      )}
      {/* Stage 4: Rope */}
      {wrongCount >= 4 && (
        <line x1="140" y1="30" x2="140" y2="55" stroke={color} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Stage 5: Head */}
      {wrongCount >= 5 && (
        <circle cx="140" cy="70" r="15" stroke={bodyColor} strokeWidth="3" fill="none" />
      )}
      {/* Stage 6: Body */}
      {wrongCount >= 6 && (
        <line x1="140" y1="85" x2="140" y2="130" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Stage 7: Left arm */}
      {wrongCount >= 7 && (
        <line x1="140" y1="100" x2="115" y2="115" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Stage 8: Right arm */}
      {wrongCount >= 8 && (
        <line x1="140" y1="100" x2="165" y2="115" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function HangmanGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as HangmanGameState;
  const [solveInput, setSolveInput] = useState('');
  const [showSolveModal, setShowSolveModal] = useState(false);

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
  const maxTime = room.settings.timePerRound || 60;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  const handleGuessLetter = (letter: string) => {
    sendGameAction('guess_letter', { letter });
  };

  const handleSolve = () => {
    if (!solveInput.trim()) return;
    sendGameAction('solve', { word: solveInput.trim() });
    setSolveInput('');
    setShowSolveModal(false);
  };

  const getLetterState = (letter: string): 'correct' | 'wrong' | 'unused' => {
    const upper = letter.toUpperCase();
    if (state.correctLetters.includes(upper) || state.correctLetters.includes(letter.toLowerCase())) {
      return 'correct';
    }
    if (state.wrongLetters.includes(upper) || state.wrongLetters.includes(letter.toLowerCase())) {
      return 'wrong';
    }
    return 'unused';
  };

  const isGameOver = state.solved || state.wrongCount >= state.maxWrong;

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Spiel beendet!</h2>
          {state.revealedWord && (
            <p className="text-secondary">
              Das Wort war: <strong style={{ color: 'var(--success)' }}>{state.revealedWord}</strong>
            </p>
          )}
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
      <div className="text-center mb-1">
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          Kategorie: {state.category}
        </span>
      </div>

      {/* Wrong count indicator */}
      <div className="text-center mb-1">
        <span style={{
          fontSize: '0.85rem',
          color: state.wrongCount > state.maxWrong / 2 ? 'var(--error)' : 'var(--text-secondary)',
        }}>
          {state.wrongCount} / {state.maxWrong} Fehler
        </span>
      </div>

      {/* Hangman SVG */}
      <div style={{ marginBottom: '1rem' }}>
        <HangmanSvg wrongCount={state.wrongCount} />
      </div>

      {/* Word Display */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px',
        }}>
          {state.wordDisplay.split('').map((char, i) => {
            if (char === ' ') {
              return <div key={i} style={{ width: '16px' }} />;
            }
            const isBlank = char === '_';
            return (
              <div
                key={i}
                style={{
                  width: '36px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isBlank ? 'transparent' : 'rgba(99, 102, 241, 0.15)',
                  borderRadius: '6px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: isBlank ? 'var(--text-secondary)' : 'var(--text)',
                  borderBottom: '2px solid ' + (isBlank ? 'var(--text-secondary)' : 'var(--primary)'),
                }}
              >
                {isBlank ? '\u00A0' : char.toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Letter Keyboard */}
      {state.phase === 'active' && !isGameOver && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: 'center',
          }}>
            {ALL_LETTERS.map((letter) => {
              const letterState = getLetterState(letter);
              const guessed = letterState !== 'unused';
              const guessedBy = state.letterGuessedBy[letter.toUpperCase()] || state.letterGuessedBy[letter.toLowerCase()];

              return (
                <button
                  key={letter}
                  onClick={() => !guessed && handleGuessLetter(letter)}
                  disabled={guessed}
                  title={guessedBy ? `Geraten von ${getPlayerName(guessedBy)}` : undefined}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: guessed ? 'default' : 'pointer',
                    background: letterState === 'correct'
                      ? 'rgba(34, 197, 94, 0.25)'
                      : letterState === 'wrong'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'var(--surface-light)',
                    color: letterState === 'correct'
                      ? 'var(--success)'
                      : letterState === 'wrong'
                        ? 'var(--error)'
                        : 'var(--text)',
                    opacity: letterState === 'wrong' ? 0.5 : 1,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Who guessed which letters */}
          {Object.keys(state.letterGuessedBy).length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Buchstaben geraten von:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {Object.entries(state.letterGuessedBy).map(([letter, guesser]) => (
                  <span
                    key={letter}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: state.correctLetters.includes(letter.toUpperCase()) || state.correctLetters.includes(letter)
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: state.correctLetters.includes(letter.toUpperCase()) || state.correctLetters.includes(letter)
                        ? 'var(--success)'
                        : 'var(--error)',
                    }}
                  >
                    {letter.toUpperCase()}: {getPlayerName(guesser)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Solve Button */}
      {state.phase === 'active' && !isGameOver && (
        <button
          className="btn btn-secondary mt-1"
          onClick={() => setShowSolveModal(true)}
        >
          Wort lösen
        </button>
      )}

      {/* Solved/Failed State */}
      {state.solved && state.phase !== 'reveal' && (
        <div className="card text-center fade-in mt-2" style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid var(--success)',
        }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <p style={{ color: 'var(--success)', fontWeight: '600', marginTop: '0.5rem' }}>
            {state.solvedBy === playerId
              ? 'Du hast das Wort gelöst!'
              : `${getPlayerName(state.solvedBy || '')} hat das Wort gelöst!`}
          </p>
          {state.revealedWord && (
            <p style={{ marginTop: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {state.revealedWord}
            </p>
          )}
        </div>
      )}

      {state.wrongCount >= state.maxWrong && !state.solved && state.phase !== 'reveal' && (
        <div className="card text-center fade-in mt-2" style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--error)',
        }}>
          <span style={{ fontSize: '2rem' }}>💀</span>
          <p style={{ color: 'var(--error)', fontWeight: '600', marginTop: '0.5rem' }}>
            Nicht geschafft!
          </p>
          {state.revealedWord && (
            <p style={{ marginTop: '0.5rem' }}>
              Das Wort war: <strong style={{ color: 'var(--text)' }}>{state.revealedWord}</strong>
            </p>
          )}
        </div>
      )}

      {/* Solve Modal */}
      {showSolveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setShowSolveModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-center">Wort lösen</h3>
            <input
              className="input mb-2"
              type="text"
              value={solveInput}
              onChange={(e) => setSolveInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSolve(); }}
              placeholder="Gib das Wort ein..."
              autoFocus
              autoComplete="off"
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSolveModal(false)}
                style={{ flex: 1 }}
              >
                Abbrechen
              </button>
              <button
                className="btn btn-success"
                onClick={handleSolve}
                disabled={!solveInput.trim()}
                style={{ flex: 1 }}
              >
                Lösen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
