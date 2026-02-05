/**
 * MoodyAvatar - Der zentrale Avatar eines Spielers
 *
 * Zeigt den aktuellen Mood mit allen ausgerüsteten Cosmetics an.
 * Kann angeklickt werden, um eine Reaction zu senden.
 */

import { useState, useEffect } from 'react';
import type {
  MoodLevel,
  EquippedCosmetics,
  MoodyReaction,
} from '@playtogether/shared';
import { MOODS, REACTIONS, getCosmeticById } from '@playtogether/shared';
import { useMoodyStore } from '../../store/moodyStore';
import './MoodyAvatar.css';

interface MoodyAvatarProps {
  /** Spieler-ID für diesen Avatar */
  playerId: string;
  /** Spielername */
  name?: string;
  /** Mood-Level (wenn nicht angegeben, wird aus Store gelesen) */
  mood?: MoodLevel;
  /** Ausgerüstete Cosmetics */
  cosmetics?: EquippedCosmetics;
  /** Größe des Avatars */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Ob dieser Avatar dem aktuellen User gehört */
  isOwn?: boolean;
  /** Ob der Avatar anklickbar ist (für Reactions) */
  clickable?: boolean;
  /** Callback wenn auf den Avatar geklickt wird */
  onClick?: () => void;
  /** Level anzeigen? */
  showLevel?: boolean;
  /** Name anzeigen? */
  showName?: boolean;
}

const SIZE_MAP = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

export default function MoodyAvatar({
  playerId,
  name,
  mood: propMood,
  cosmetics: propCosmetics,
  size = 'md',
  isOwn = false,
  clickable = true,
  onClick,
  showLevel = false,
  showName = false,
}: MoodyAvatarProps) {
  const storeMood = useMoodyStore((s) => s.mood);
  const storeCosmetics = useMoodyStore((s) => s.equippedCosmetics);
  const playerMoods = useMoodyStore((s) => s.playerMoods);
  const incomingReactions = useMoodyStore((s) => s.incomingReactions);
  const getLevel = useMoodyStore((s) => s.getLevel);
  const canSendReaction = useMoodyStore((s) => s.canSendReaction);

  // Mood und Cosmetics bestimmen
  const mood = propMood ?? (isOwn ? storeMood : playerMoods[playerId]?.mood ?? 'neutral');
  const cosmetics = propCosmetics ?? (isOwn ? storeCosmetics : playerMoods[playerId]?.cosmetics);

  const moodDef = MOODS[mood];
  const pixelSize = SIZE_MAP[size];

  // Reactions für diesen Spieler filtern
  const myReactions = incomingReactions.filter(
    (r) => r.toPlayerId === playerId || (!r.toPlayerId && !isOwn)
  );

  // CSS-Styles aus Cosmetics aufbauen
  const buildStyles = () => {
    const styles: React.CSSProperties = {
      width: pixelSize,
      height: pixelSize,
      background: moodDef.bgGradient
        ? `linear-gradient(135deg, ${moodDef.bgGradient[0]} 0%, ${moodDef.bgGradient[1]} 100%)`
        : moodDef.color,
    };

    if (cosmetics) {
      // Background
      if (cosmetics.background) {
        const bg = getCosmeticById(cosmetics.background);
        if (bg?.css?.background) {
          styles.background = bg.css.background;
        }
      }

      // Border
      if (cosmetics.border) {
        const border = getCosmeticById(cosmetics.border);
        if (border?.css) {
          if (border.css.border) styles.border = border.css.border;
          if (border.css.boxShadow) styles.boxShadow = border.css.boxShadow;
        }
      }
    }

    return styles;
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const level = isOwn ? getLevel().level : undefined;

  return (
    <div className="moody-avatar-wrapper" style={{ width: pixelSize }}>
      {/* Accessoire (über dem Avatar) */}
      {cosmetics?.accessory && cosmetics.accessory !== 'acc_none' && (
        <AccessoryOverlay
          accessoryId={cosmetics.accessory}
          size={pixelSize}
        />
      )}

      {/* Hauptavatar */}
      <div
        className={`moody-avatar ${moodDef.animation ?? ''} ${clickable ? 'clickable' : ''}`}
        style={buildStyles()}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        {/* Emoji */}
        <span
          className="moody-emoji"
          style={{ fontSize: pixelSize * 0.5 }}
        >
          {moodDef.emoji}
        </span>

        {/* Partikel-Effekt */}
        {cosmetics?.effect && cosmetics.effect !== 'effect_none' && (
          <EffectOverlay effectId={cosmetics.effect} size={pixelSize} />
        )}

        {/* Cooldown-Indikator für eigenen Avatar */}
        {isOwn && !canSendReaction() && (
          <div className="cooldown-indicator" />
        )}
      </div>

      {/* Eingehende Reactions */}
      <div className="reactions-container">
        {myReactions.map((reaction) => (
          <ReactionBubble key={reaction.id} reaction={reaction} />
        ))}
      </div>

      {/* Level Badge */}
      {showLevel && level !== undefined && (
        <div className="level-badge">
          {level}
        </div>
      )}

      {/* Name */}
      {showName && name && (
        <div className="moody-name">
          {name}
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-Komponenten
// ============================================

function AccessoryOverlay({
  accessoryId,
  size,
}: {
  accessoryId: string;
  size: number;
}) {
  const item = getCosmeticById(accessoryId);
  if (!item) return null;

  return (
    <div
      className="accessory-overlay"
      style={{
        fontSize: size * 0.35,
        top: -size * 0.15,
      }}
    >
      {item.preview}
    </div>
  );
}

function EffectOverlay({
  effectId,
  size,
}: {
  effectId: string;
  size: number;
}) {
  const item = getCosmeticById(effectId);
  if (!item) return null;

  // Verschiedene Effekte rendern
  const effectEmoji = item.preview;

  return (
    <div className={`effect-overlay effect-${effectId}`}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="effect-particle"
          style={{
            animationDelay: `${i * 0.3}s`,
            left: `${20 + Math.random() * 60}%`,
          }}
        >
          {effectEmoji}
        </span>
      ))}
    </div>
  );
}

function ReactionBubble({ reaction }: { reaction: MoodyReaction }) {
  const reactionDef = REACTIONS[reaction.type];

  return (
    <div className="reaction-bubble animate-float-up">
      {reactionDef.emoji}
    </div>
  );
}
