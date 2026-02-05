/**
 * MoodPicker - Auswahl für die eigene Stimmung
 *
 * Horizontaler Slider mit allen Mood-Levels von wütend bis begeistert.
 */

import { useState, useRef } from 'react';
import type { MoodLevel } from '@playtogether/shared';
import { MOODS, MOOD_LEVELS } from '@playtogether/shared';
import { useMoodyStore } from '../../store/moodyStore';
import './MoodPicker.css';

interface MoodPickerProps {
  /** Kompakte Darstellung (nur aktiver Mood) */
  compact?: boolean;
  /** Callback nach Auswahl */
  onSelect?: (mood: MoodLevel) => void;
}

export default function MoodPicker({ compact = false, onSelect }: MoodPickerProps) {
  const currentMood = useMoodyStore((s) => s.mood);
  const setMood = useMoodyStore((s) => s.setMood);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleSelect = (mood: MoodLevel) => {
    setMood(mood);
    onSelect?.(mood);
    if (compact) {
      setIsExpanded(false);
    }
  };

  const currentMoodDef = MOODS[currentMood];
  const currentIndex = MOOD_LEVELS.indexOf(currentMood);

  if (compact && !isExpanded) {
    return (
      <button
        className="mood-picker-compact"
        onClick={() => setIsExpanded(true)}
        style={{
          background: `linear-gradient(135deg, ${currentMoodDef.bgGradient[0]}, ${currentMoodDef.bgGradient[1]})`,
        }}
      >
        <span className="mood-picker-compact-emoji">{currentMoodDef.emoji}</span>
        <span className="mood-picker-compact-label">{currentMoodDef.name}</span>
        <span className="mood-picker-compact-arrow">▼</span>
      </button>
    );
  }

  return (
    <div className="mood-picker">
      {compact && (
        <button
          className="mood-picker-close"
          onClick={() => setIsExpanded(false)}
        >
          ✕
        </button>
      )}

      <div className="mood-picker-label">Wie fühlst du dich?</div>

      {/* Mood Track */}
      <div className="mood-track">
        {/* Gradient Background */}
        <div className="mood-track-bg" />

        {/* Mood Options */}
        <div className="mood-options">
          {MOOD_LEVELS.map((level, index) => {
            const mood = MOODS[level];
            const isActive = level === currentMood;

            return (
              <button
                key={level}
                className={`mood-option ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(level)}
                style={{
                  '--mood-color': mood.color,
                } as React.CSSProperties}
                title={mood.name}
              >
                <span className="mood-option-emoji">{mood.emoji}</span>
                {isActive && (
                  <span className="mood-option-name">{mood.name}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div
          className="mood-progress"
          style={{
            width: `${(currentIndex / (MOOD_LEVELS.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="mood-labels">
        <span>😤 Sauer</span>
        <span>😐 Neutral</span>
        <span>🤩 Begeistert</span>
      </div>
    </div>
  );
}

/**
 * MoodSlider - Alternative Darstellung als Slider
 */
export function MoodSlider({ onSelect }: { onSelect?: (mood: MoodLevel) => void }) {
  const currentMood = useMoodyStore((s) => s.mood);
  const setMood = useMoodyStore((s) => s.setMood);
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentIndex = MOOD_LEVELS.indexOf(currentMood);

  const handleSliderChange = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percentage * (MOOD_LEVELS.length - 1));
    const newMood = MOOD_LEVELS[index];

    if (newMood !== currentMood) {
      setMood(newMood);
      onSelect?.(newMood);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSliderChange(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons > 0) {
      handleSliderChange(e.clientX);
    }
  };

  const currentMoodDef = MOODS[currentMood];

  return (
    <div className="mood-slider-container">
      <div className="mood-slider-current">
        <span className="mood-slider-emoji">{currentMoodDef.emoji}</span>
        <span className="mood-slider-name">{currentMoodDef.name}</span>
      </div>

      <div
        ref={sliderRef}
        className="mood-slider"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Gradient Track */}
        <div className="mood-slider-track">
          {MOOD_LEVELS.map((level, i) => (
            <div
              key={level}
              className="mood-slider-segment"
              style={{
                background: `linear-gradient(135deg, ${MOODS[level].bgGradient[0]}, ${MOODS[level].bgGradient[1]})`,
              }}
            />
          ))}
        </div>

        {/* Thumb */}
        <div
          className="mood-slider-thumb"
          style={{
            left: `${(currentIndex / (MOOD_LEVELS.length - 1)) * 100}%`,
            background: currentMoodDef.color,
          }}
        >
          {currentMoodDef.emoji}
        </div>
      </div>
    </div>
  );
}
