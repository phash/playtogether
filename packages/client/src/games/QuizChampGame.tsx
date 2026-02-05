/**
 * QuizChampGame - Beantworte Fragen schneller als deine Freunde
 */

import { useGameStore } from '../store/gameStore';
import type { QuizChampGameState } from '@playtogether/shared';

export default function QuizChampGame() {
  const { gameState, sendGameAction, room, playerId } = useGameStore();
  const state = gameState as QuizChampGameState;

  if (!state || !room || !playerId) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p className="mt-2 text-secondary">Lade Spiel...</p>
      </div>
    );
  }

  const players = room.players;
  const myAnswer = state.playerAnswers[playerId];
  const hasAnswered = myAnswer !== undefined && myAnswer !== null;
  const myStreak = state.streaks[playerId] || 0;

  // Timer bar
  const maxTime = room.settings.timePerRound || 20;
  const timerPercent = Math.max(0, (state.timeRemaining / maxTime) * 100);
  const timerColor = state.timeRemaining > 12
    ? 'var(--success)'
    : state.timeRemaining > 6
      ? 'var(--warning)'
      : 'var(--error)';

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Unbekannt';
  };

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || state.phase !== 'active') return;
    sendGameAction('answer', { answerIndex });
  };

  // Answer button style
  const getAnswerStyle = (index: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '1rem',
      borderRadius: 'var(--radius)',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: hasAnswered || state.phase !== 'active' ? 'default' : 'pointer',
      border: '2px solid transparent',
      textAlign: 'left' as const,
      transition: 'all 0.3s',
      background: 'var(--surface-light)',
      color: 'var(--text)',
      opacity: 1,
    };

    if (state.showCorrectAnswer) {
      if (index === state.correctAnswerIndex) {
        return {
          ...baseStyle,
          background: 'rgba(34, 197, 94, 0.25)',
          border: '2px solid var(--success)',
          color: 'var(--success)',
        };
      }
      if (hasAnswered && myAnswer === index && index !== state.correctAnswerIndex) {
        return {
          ...baseStyle,
          background: 'rgba(239, 68, 68, 0.25)',
          border: '2px solid var(--error)',
          color: 'var(--error)',
        };
      }
      return { ...baseStyle, opacity: 0.5 };
    }

    if (hasAnswered && myAnswer === index) {
      return {
        ...baseStyle,
        background: 'rgba(99, 102, 241, 0.25)',
        border: '2px solid var(--primary)',
      };
    }

    return baseStyle;
  };

  const answerLabels = ['A', 'B', 'C', 'D'];

  // End phase
  if (state.phase === 'end') {
    const sortedPlayers = [...players].sort(
      (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
    );
    return (
      <div className="fade-in" style={{ paddingBottom: '80px' }}>
        <div className="card text-center">
          <h2 style={{ marginBottom: '0.5rem' }}>Quiz beendet!</h2>
          <p className="text-secondary">Wer war der Schnellste?</p>
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
                {(state.streaks[player.id] || 0) > 1 && (
                  <span style={{ fontSize: '0.85rem' }}>
                    🔥 x{state.streaks[player.id]}
                  </span>
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

  // No current question (preparation phase)
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
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>

      {/* Category + Difficulty + Streak */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: 'var(--surface-light)',
          color: 'var(--text-secondary)',
        }}>
          {question.category}
        </span>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          background: question.difficulty === 'easy'
            ? 'rgba(34, 197, 94, 0.2)'
            : question.difficulty === 'medium'
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
          color: question.difficulty === 'easy'
            ? 'var(--success)'
            : question.difficulty === 'medium'
              ? 'var(--warning)'
              : 'var(--error)',
        }}>
          {question.difficulty === 'easy' ? 'Leicht' : question.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
        </span>
        {myStreak > 1 && (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            background: 'rgba(245, 158, 11, 0.2)',
            color: 'var(--warning)',
            fontWeight: '600',
          }}>
            🔥 x{myStreak}
          </span>
        )}
      </div>

      {/* Question */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', lineHeight: 1.4, textAlign: 'center' }}>
          {question.question}
        </h3>
      </div>

      {/* Answers 2x2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={hasAnswered || state.phase !== 'active'}
            style={getAnswerStyle(index)}
          >
            <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: 'var(--primary)' }}>
              {answerLabels[index]}
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Answer Results */}
      {state.showCorrectAnswer && state.answerResults[playerId] && (
        <div
          className="card text-center fade-in"
          style={{
            background: state.answerResults[playerId].correct
              ? 'rgba(34, 197, 94, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${state.answerResults[playerId].correct ? 'var(--success)' : 'var(--error)'}`,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>
            {state.answerResults[playerId].correct ? '✓' : '✗'}
          </span>
          <p style={{
            fontWeight: '600',
            color: state.answerResults[playerId].correct ? 'var(--success)' : 'var(--error)',
            marginTop: '0.25rem',
          }}>
            {state.answerResults[playerId].correct ? 'Richtig!' : 'Falsch!'}
            {state.answerResults[playerId].points > 0 && (
              <span> +{state.answerResults[playerId].points} Punkte</span>
            )}
          </p>
        </div>
      )}

      {/* Waiting state */}
      {hasAnswered && !state.showCorrectAnswer && (
        <div className="text-center">
          <p className="text-secondary">Warte auf andere Spieler...</p>
        </div>
      )}
    </div>
  );
}
