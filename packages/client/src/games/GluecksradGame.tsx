/**
 * GluecksradGame - Drehe das Rad und löse die Phrase
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GluecksradGameState } from '@playtogether/shared';

const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
const VOWELS = 'AEIOU'.split('');
const UMLAUTS = ['Ä', 'Ö', 'Ü'];
const ALL_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ...UMLAUTS];

export default function GluecksradGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as GluecksradGameState;
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
  const isMyTurn = state.currentPlayerId === playerId;
  const currentPlayerName = players.find((p) => p.id === state.currentPlayerId)?.name || 'Unbekannt';

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Unbekannt';
  };

  const handleSpin = () => {
    sendGameAction('spin', {});
  };

  const handleGuessLetter = (letter: string) => {
    sendGameAction('guess_letter', { letter });
  };

  const handleBuyVowel = (letter: string) => {
    sendGameAction('buy_vowel', { letter });
  };

  const handleSolve = () => {
    if (!solveInput.trim()) return;
    sendGameAction('solve', { solution: solveInput.trim() });
    setSolveInput('');
    setShowSolveModal(false);
  };

  const isLetterGuessed = (letter: string) => {
    return state.revealedLetters.includes(letter.toUpperCase()) ||
      state.revealedLetters.includes(letter.toLowerCase());
  };

  const isVowel = (letter: string) => {
    return VOWELS.includes(letter.toUpperCase()) || UMLAUTS.includes(letter.toUpperCase());
  };

  // Timer bar
  const maxTime = room.settings.timePerRound || 90;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = timerPercent > 50
    ? 'var(--success)'
    : timerPercent > 25
      ? 'var(--warning)'
      : 'var(--error)';

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Spiel beendet!</h2>
          {state.solvedBy && (
            <p className="text-secondary">
              Gelöst von <strong>{getPlayerName(state.solvedBy)}</strong>
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

      {/* Current Player */}
      <div className="text-center mb-2">
        <span style={{
          fontWeight: '600',
          color: isMyTurn ? 'var(--primary)' : 'var(--text)',
          fontSize: '0.95rem',
        }}>
          {isMyTurn ? 'Du bist dran!' : `${currentPlayerName} ist dran`}
        </span>
      </div>

      {/* Phrase Display */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '4px',
          lineHeight: 1.6,
        }}>
          {state.phrase.split('').map((char, i) => {
            if (char === ' ') {
              return (
                <div key={i} style={{ width: '12px' }} />
              );
            }
            const isBlank = char === '_';
            return (
              <div
                key={i}
                style={{
                  width: '32px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isBlank ? 'var(--surface-light)' : 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: isBlank ? 'transparent' : 'var(--text)',
                  borderBottom: isBlank ? '2px solid var(--text-secondary)' : '2px solid var(--primary)',
                }}
              >
                {isBlank ? '\u00A0' : char.toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spin Result */}
      {state.lastSpinResult !== undefined && state.lastSpinResult !== null && (
        <div className="card text-center fade-in" style={{
          padding: '0.75rem',
          background: state.lastSpinResult === 'bankrott'
            ? 'rgba(239, 68, 68, 0.15)'
            : state.lastSpinResult === 'freidrehen'
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${
            state.lastSpinResult === 'bankrott'
              ? 'var(--error)'
              : state.lastSpinResult === 'freidrehen'
                ? 'var(--warning)'
                : 'var(--success)'
          }`,
        }}>
          {state.lastSpinResult === 'bankrott' ? (
            <span style={{ color: 'var(--error)', fontWeight: '700', fontSize: '1.1rem' }}>
              Bankrott! Geld weg!
            </span>
          ) : state.lastSpinResult === 'freidrehen' ? (
            <span style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '1.1rem' }}>
              Freidrehen!
            </span>
          ) : (
            <span style={{ color: 'var(--success)', fontWeight: '700', fontSize: '1.1rem' }}>
              {state.lastSpinResult}€ pro Buchstabe!
            </span>
          )}
        </div>
      )}

      {/* Round Money per player */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        marginTop: '0.5rem',
      }}>
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              background: p.id === state.currentPlayerId ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface-light)',
              color: p.id === state.currentPlayerId ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: p.id === state.currentPlayerId ? '600' : '400',
              border: p.id === playerId ? '1px solid var(--primary)' : '1px solid transparent',
            }}
          >
            {p.name}: {state.roundMoney[p.id] || 0}€
          </div>
        ))}
      </div>

      {/* Letter Keyboard */}
      {isMyTurn && state.canGuessLetter && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <p className="text-secondary text-center mb-1" style={{ fontSize: '0.8rem' }}>
            Wähle einen Konsonanten:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: 'center',
          }}>
            {ALL_LETTERS.map((letter) => {
              const guessed = isLetterGuessed(letter);
              const vowel = isVowel(letter);
              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (guessed) return;
                    if (vowel) return; // Vowels need buy_vowel action
                    handleGuessLetter(letter);
                  }}
                  disabled={guessed || vowel}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: guessed || vowel ? 'default' : 'pointer',
                    background: guessed
                      ? 'var(--surface)'
                      : vowel
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'var(--surface-light)',
                    color: guessed
                      ? 'var(--text-secondary)'
                      : vowel
                        ? 'var(--warning)'
                        : 'var(--text)',
                    opacity: guessed ? 0.3 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Buy Vowel */}
      {isMyTurn && state.canBuyVowel && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <p className="text-secondary text-center mb-1" style={{ fontSize: '0.8rem' }}>
            Vokal kaufen (250€):
          </p>
          <div style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'center',
          }}>
            {[...VOWELS, ...UMLAUTS].map((letter) => {
              const guessed = isLetterGuessed(letter);
              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (guessed) return;
                    handleBuyVowel(letter);
                  }}
                  disabled={guessed}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    border: '2px solid var(--warning)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: guessed ? 'default' : 'pointer',
                    background: guessed ? 'var(--surface)' : 'rgba(245, 158, 11, 0.15)',
                    color: guessed ? 'var(--text-secondary)' : 'var(--warning)',
                    opacity: guessed ? 0.3 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isMyTurn && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {state.canSpin && (
            <button
              className="btn btn-primary"
              onClick={handleSpin}
              style={{ flex: 1 }}
            >
              Rad drehen
            </button>
          )}
          {state.canSolve && (
            <button
              className="btn btn-success"
              onClick={() => setShowSolveModal(true)}
              style={{ flex: 1 }}
            >
              Lösen
            </button>
          )}
        </div>
      )}

      {/* Not my turn */}
      {!isMyTurn && state.phase === 'active' && (
        <div className="text-center mt-2">
          <p className="text-secondary">
            Warte auf {currentPlayerName}...
          </p>
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
            <h3 className="mb-2 text-center">Phrase lösen</h3>
            <input
              className="input mb-2"
              type="text"
              value={solveInput}
              onChange={(e) => setSolveInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSolve(); }}
              placeholder="Gib die Lösung ein..."
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

      {/* Solved */}
      {state.solved && (
        <div className="card text-center fade-in mt-2" style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid var(--success)',
        }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <p style={{ color: 'var(--success)', fontWeight: '600', marginTop: '0.5rem' }}>
            {state.solvedBy === playerId
              ? 'Du hast die Phrase gelöst!'
              : `${getPlayerName(state.solvedBy || '')} hat die Phrase gelöst!`}
          </p>
        </div>
      )}
    </div>
  );
}
