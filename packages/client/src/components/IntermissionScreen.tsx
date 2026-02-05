/**
 * IntermissionScreen - Zwischen-Rankings zwischen Playlist-Spielen
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function IntermissionScreen() {
  const { intermissionData, playerId } = useGameStore();
  const [countdown, setCountdown] = useState(intermissionData?.countdownSeconds || 10);

  useEffect(() => {
    if (!intermissionData) return;
    setCountdown(intermissionData.countdownSeconds);

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [intermissionData]);

  if (!intermissionData) return null;

  const { rankings, nextGame, currentPlaylistIndex, totalPlaylistItems } = intermissionData;

  return (
    <div className="fade-in" style={{ padding: '1.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
          Spiel {currentPlaylistIndex} von {totalPlaylistItems}
        </p>
        <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>Zwischenstand</h2>
      </div>

      {/* Rankings */}
      <div className="card mb-3">
        {rankings.map((entry) => {
          const medals = ['🥇', '🥈', '🥉'];
          const isMe = entry.playerId === playerId;
          return (
            <div
              key={entry.playerId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: isMe ? 'var(--primary-light)' : entry.rank <= 3 ? 'var(--surface-light)' : 'transparent',
                borderRadius: 'var(--radius)',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', width: '2rem', textAlign: 'center' }}>
                  {medals[entry.rank - 1] || `${entry.rank}.`}
                </span>
                <span style={{ fontWeight: isMe ? '700' : '500' }}>
                  {entry.playerName}
                  {isMe && ' (Du)'}
                </span>
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {entry.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next Game Preview */}
      {nextGame && (
        <div
          className="card text-center mb-3"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Nächstes Spiel
          </p>
          <div style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{nextGame.icon}</div>
          <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{nextGame.name}</p>
        </div>
      )}

      {/* Countdown */}
      <div className="text-center">
        <p className="text-secondary">Weiter in</p>
        <div
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'var(--primary)',
          }}
        >
          {countdown}
        </div>
      </div>
    </div>
  );
}
