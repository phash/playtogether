package com.playtogether.data.model

import kotlinx.serialization.Serializable

/**
 * Spieler im Raum
 */
@Serializable
data class Player(
    val id: String,
    val name: String,
    val avatarColor: String,
    val isHost: Boolean,
    val score: Int = 0,
    val isReady: Boolean = false
)

/**
 * Spieltypen
 */
enum class GameType(val id: String, val displayName: String, val icon: String, val minPlayers: Int, val maxPlayers: Int) {
    ANAGRAMME("anagramme", "Anagramme", "🔤", 2, 8),
    QUIZ_CHAMP("quiz_champ", "Quiz Champ", "🧠", 2, 8),
    ENTWEDER_ODER("entweder_oder", "Entweder/Oder", "⚖️", 3, 20),
    GLUECKSRAD("gluecksrad", "Glücksrad", "🎡", 2, 6),
    TIC_TAC_TOE("tic_tac_toe", "Tic Tac Toe", "❌", 2, 8),
    ROCK_PAPER_SCISSORS("rock_paper_scissors", "Schere Stein Papier", "✊", 2, 16),
    HANGMAN("hangman", "Galgenmännchen", "💀", 2, 8);

    companion object {
        fun fromId(id: String): GameType? = entries.find { it.id == id }
    }
}

/**
 * Raum-Status
 */
enum class RoomStatus {
    WAITING,
    STARTING,
    PLAYING,
    INTERMISSION,
    FINISHED
}

/**
 * Raum-Einstellungen
 */
@Serializable
data class RoomSettings(
    val roundCount: Int = 5,
    val timePerRound: Int = 30
)

/**
 * Playlist-Eintrag
 */
@Serializable
data class PlaylistItem(
    val gameType: String,
    val roundCount: Int,
    val timePerRound: Int
)

/**
 * Raum
 */
@Serializable
data class Room(
    val id: String,
    val code: String,
    val hostId: String,
    val gameType: String,
    val status: String,
    val players: List<Player>,
    val maxPlayers: Int = 8,
    val minPlayers: Int = 2,
    val settings: RoomSettings,
    val playlist: List<PlaylistItem> = emptyList(),
    val currentPlaylistIndex: Int = 0
)

/**
 * Spielzustand
 */
@Serializable
data class GameState(
    val type: String,
    val currentRound: Int,
    val totalRounds: Int,
    val phase: String,
    val timeRemaining: Int,
    val scores: Map<String, Int>
)

/**
 * Moody Stimmungslevel
 */
enum class MoodLevel(val emoji: String) {
    ANGRY("😠"),
    SAD("😢"),
    MEH("😕"),
    NEUTRAL("😐"),
    CONTENT("🙂"),
    HAPPY("😊"),
    ECSTATIC("🤩")
}

/**
 * Reaktionstypen
 */
enum class ReactionType(val emoji: String) {
    THUMBS_UP("👍"),
    THUMBS_DOWN("👎"),
    CLAP("👏"),
    LAUGH("😂"),
    WOW("😮"),
    HEART("❤️"),
    FIRE("🔥"),
    THINKING("🤔")
}

/**
 * Moody Reaktion
 */
@Serializable
data class MoodyReaction(
    val id: String,
    val fromPlayerId: String,
    val toPlayerId: String? = null,
    val type: String,
    val timestamp: Long
)
