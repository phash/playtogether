/**
 * ReactionBar - Leiste zum Senden von Reactions
 *
 * Zeigt alle verfügbaren Reactions und ermöglicht das Senden mit Cooldown.
 */

import { useState, useEffect } from 'react';
import type { ReactionType } from '@playtogether/shared';
import { REACTIONS, REACTION_TYPES, MOODY_CONFIG } from '@playtogether/shared';
import { useMoodyStore } from '../../store/moodyStore';
import './ReactionBar.css';

interface ReactionBarProps {
  /** Ziel-Spieler ID (optional, für gezielte Reactions) */
  targetPlayerId?: string;
  /** Kompakte Darstellung */
  compact?: boolean;
  /** Callback nach dem Senden */
  onSend?: (type: ReactionType) => void;
}

export default function ReactionBar({
  targetPlayerId,
  compact = false,
  onSend,
}: ReactionBarProps) {
  const sendReaction = useMoodyStore((s) => s.sendReaction);
  const canSendReaction = useMoodyStore((s) => s.canSendReaction);
  const reactionCooldownUntil = useMoodyStore((s) => s.reactionCooldownUntil);

  const [cooldownPercent, setCooldownPercent] = useState(0);

  // Cooldown-Animation
  useEffect(() => {
    if (canSendReaction()) {
      setCooldownPercent(0);
      return;
    }

    const updateCooldown = () => {
      const now = Date.now();
      const remaining = reactionCooldownUntil - now;
      const percent = Math.max(0, (remaining / MOODY_CONFIG.reactionCooldownMs) * 100);
      setCooldownPercent(percent);

      if (percent > 0) {
        requestAnimationFrame(updateCooldown);
      }
    };

    updateCooldown();
  }, [reactionCooldownUntil, canSendReaction]);

  const handleSend = (type: ReactionType) => {
    if (!canSendReaction()) return;

    sendReaction(type, targetPlayerId);
    onSend?.(type);
  };

  const isDisabled = !canSendReaction();

  return (
    <div className={`reaction-bar ${compact ? 'compact' : ''}`}>
      {/* Cooldown Overlay */}
      {cooldownPercent > 0 && (
        <div
          className="reaction-bar-cooldown"
          style={{ width: `${cooldownPercent}%` }}
        />
      )}

      {/* Reactions */}
      <div className="reaction-bar-items">
        {REACTION_TYPES.map((type) => {
          const reaction = REACTIONS[type];
          return (
            <button
              key={type}
              className={`reaction-btn ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleSend(type)}
              disabled={isDisabled}
              title={reaction.name}
            >
              <span className="reaction-btn-emoji">{reaction.emoji}</span>
              {!compact && (
                <span className="reaction-btn-label">{reaction.name}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cooldown Text */}
      {isDisabled && !compact && (
        <div className="reaction-bar-cooldown-text">
          Warte kurz...
        </div>
      )}
    </div>
  );
}

/**
 * ReactionButton - Einzelner Button für eine bestimmte Reaction
 */
export function ReactionButton({
  type,
  targetPlayerId,
  size = 'md',
  showLabel = false,
  onSend,
}: {
  type: ReactionType;
  targetPlayerId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onSend?: () => void;
}) {
  const sendReaction = useMoodyStore((s) => s.sendReaction);
  const canSendReaction = useMoodyStore((s) => s.canSendReaction);

  const reaction = REACTIONS[type];
  const isDisabled = !canSendReaction();

  const handleClick = () => {
    if (isDisabled) return;
    sendReaction(type, targetPlayerId);
    onSend?.();
  };

  const sizeClass = {
    sm: 'reaction-single-sm',
    md: 'reaction-single-md',
    lg: 'reaction-single-lg',
  }[size];

  return (
    <button
      className={`reaction-single ${sizeClass} ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      title={reaction.name}
    >
      <span className="reaction-single-emoji">{reaction.emoji}</span>
      {showLabel && <span className="reaction-single-label">{reaction.name}</span>}
    </button>
  );
}

/**
 * QuickReaction - Schnelle Reaction bei Klick auf einen Avatar
 */
export function QuickReactionMenu({
  targetPlayerId,
  onClose,
  position,
}: {
  targetPlayerId: string;
  onClose: () => void;
  position: { x: number; y: number };
}) {
  const sendReaction = useMoodyStore((s) => s.sendReaction);
  const canSendReaction = useMoodyStore((s) => s.canSendReaction);

  const handleSend = (type: ReactionType) => {
    if (!canSendReaction()) return;
    sendReaction(type, targetPlayerId);
    onClose();
  };

  // Schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = () => onClose();
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="quick-reaction-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {REACTION_TYPES.slice(0, 4).map((type) => {
        const reaction = REACTIONS[type];
        return (
          <button
            key={type}
            className="quick-reaction-btn"
            onClick={() => handleSend(type)}
            disabled={!canSendReaction()}
          >
            {reaction.emoji}
          </button>
        );
      })}
    </div>
  );
}
