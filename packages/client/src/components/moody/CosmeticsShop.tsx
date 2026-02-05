/**
 * CosmeticsShop - Shop zum Anschauen und Ausrüsten von Cosmetics
 */

import { useState, useMemo } from 'react';
import type { CosmeticCategory, CosmeticItem, CosmeticRarity } from '@playtogether/shared';
import {
  COSMETICS_BY_CATEGORY,
  RARITY_COLORS,
  canUnlockCosmetic,
  getUnlockProgress,
  getCosmeticById,
} from '@playtogether/shared';
import { useMoodyStore } from '../../store/moodyStore';
import MoodyAvatar from './MoodyAvatar';
import './CosmeticsShop.css';

interface CosmeticsShopProps {
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<CosmeticCategory, { name: string; icon: string }> = {
  background: { name: 'Hintergrund', icon: '🎨' },
  border: { name: 'Rahmen', icon: '⭕' },
  accessory: { name: 'Accessoire', icon: '🎀' },
  effect: { name: 'Effekt', icon: '✨' },
  trail: { name: 'Trail', icon: '💫' },
};

const CATEGORIES: CosmeticCategory[] = ['background', 'border', 'accessory', 'effect', 'trail'];

export default function CosmeticsShop({ onClose }: CosmeticsShopProps) {
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>('background');

  const equippedCosmetics = useMoodyStore((s) => s.equippedCosmetics);
  const unlockedCosmetics = useMoodyStore((s) => s.unlockedCosmetics);
  const equipCosmetic = useMoodyStore((s) => s.equipCosmetic);
  const stats = useMoodyStore((s) => s.stats);
  const xp = useMoodyStore((s) => s.xp);
  const getLevel = useMoodyStore((s) => s.getLevel);
  const playerId = 'preview'; // Für Vorschau

  const { level } = getLevel();

  const items = useMemo(() => {
    return COSMETICS_BY_CATEGORY[activeCategory] || [];
  }, [activeCategory]);

  const handleEquip = (item: CosmeticItem) => {
    if (!unlockedCosmetics.includes(item.id)) return;
    equipCosmetic(activeCategory, item.id);
  };

  const isEquipped = (item: CosmeticItem) => {
    return equippedCosmetics[activeCategory] === item.id;
  };

  const isUnlocked = (item: CosmeticItem) => {
    return unlockedCosmetics.includes(item.id);
  };

  const getProgress = (item: CosmeticItem) => {
    return getUnlockProgress(item, { ...stats, level });
  };

  const getUnlockText = (item: CosmeticItem) => {
    const condition = item.unlockCondition;
    switch (condition.type) {
      case 'default':
        return 'Standard';
      case 'games_played':
        return `${stats.gamesPlayed}/${condition.count} Spiele`;
      case 'games_won':
        return `${stats.gamesWon}/${condition.count} Siege`;
      case 'reactions_sent':
        return `${stats.reactionsSent}/${condition.count} Reactions`;
      case 'reactions_received':
        return `${stats.reactionsReceived}/${condition.count} erhalten`;
      case 'streak':
        return `${stats.currentStreak}/${condition.days} Tage Streak`;
      case 'level':
        return `Level ${level}/${condition.level}`;
      case 'achievement':
        return 'Achievement';
      case 'special':
        return 'Spezial';
      default:
        return '???';
    }
  };

  return (
    <div className="cosmetics-shop">
      {/* Header */}
      <div className="shop-header">
        <h2>Moody Shop</h2>
        {onClose && (
          <button className="shop-close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="shop-preview">
        <MoodyAvatar
          playerId={playerId}
          isOwn={true}
          size="xl"
          showLevel={true}
          clickable={false}
        />
        <div className="shop-preview-level">
          Level {level}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="shop-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`shop-category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            <span className="shop-category-icon">{CATEGORY_LABELS[cat].icon}</span>
            <span className="shop-category-name">{CATEGORY_LABELS[cat].name}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="shop-items">
        {items.map((item) => {
          const unlocked = isUnlocked(item);
          const equipped = isEquipped(item);
          const progress = getProgress(item);

          return (
            <button
              key={item.id}
              className={`shop-item ${unlocked ? 'unlocked' : 'locked'} ${equipped ? 'equipped' : ''}`}
              onClick={() => handleEquip(item)}
              disabled={!unlocked}
            >
              {/* Rarity Indicator */}
              <div
                className="shop-item-rarity"
                style={{ background: RARITY_COLORS[item.rarity] }}
              />

              {/* Preview */}
              <div className="shop-item-preview">
                {item.preview}
              </div>

              {/* Name */}
              <div className="shop-item-name">{item.name}</div>

              {/* Status */}
              {equipped && (
                <div className="shop-item-badge equipped">Ausgerüstet</div>
              )}

              {!unlocked && (
                <div className="shop-item-locked">
                  <div className="shop-item-progress">
                    <div
                      className="shop-item-progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="shop-item-unlock-text">
                    {getUnlockText(item)}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="shop-legend">
        <span className="legend-title">Seltenheit:</span>
        {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as CosmeticRarity[]).map((rarity) => (
          <span key={rarity} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: RARITY_COLORS[rarity] }}
            />
            {rarity === 'common' && 'Häufig'}
            {rarity === 'uncommon' && 'Ungewöhnlich'}
            {rarity === 'rare' && 'Selten'}
            {rarity === 'epic' && 'Episch'}
            {rarity === 'legendary' && 'Legendär'}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Kompakte Cosmetics-Auswahl für eine Kategorie
 */
export function CosmeticSelector({
  category,
  onSelect,
}: {
  category: CosmeticCategory;
  onSelect?: (itemId: string) => void;
}) {
  const equippedCosmetics = useMoodyStore((s) => s.equippedCosmetics);
  const unlockedCosmetics = useMoodyStore((s) => s.unlockedCosmetics);
  const equipCosmetic = useMoodyStore((s) => s.equipCosmetic);

  const items = COSMETICS_BY_CATEGORY[category] || [];
  const unlockedItems = items.filter((item) => unlockedCosmetics.includes(item.id));

  const handleSelect = (item: CosmeticItem) => {
    equipCosmetic(category, item.id);
    onSelect?.(item.id);
  };

  return (
    <div className="cosmetic-selector">
      {unlockedItems.map((item) => {
        const isSelected = equippedCosmetics[category] === item.id;

        return (
          <button
            key={item.id}
            className={`cosmetic-selector-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelect(item)}
            title={item.name}
            style={{
              borderColor: isSelected ? RARITY_COLORS[item.rarity] : 'transparent',
            }}
          >
            {item.preview}
          </button>
        );
      })}
    </div>
  );
}
