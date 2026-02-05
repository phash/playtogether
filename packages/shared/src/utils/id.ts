/**
 * ID-Generierung für PlayTogether
 */

/**
 * Generiert eine eindeutige ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generiert eine kurze Player-ID
 */
export function generatePlayerId(): string {
  return `p_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generiert eine Room-ID
 */
export function generateRoomId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
