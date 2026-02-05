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
enum class GameType(val id: String, val displayName: String, val icon: String) {
    QUIZ("quiz", "Quiz", "🧠"),
    WOULD_YOU_RATHER("wouldyourather", "Würdest du eher?", "🤔"),
    MOST_LIKELY("mostlikely", "Wer würde am ehesten?", "👆"),
    EITHER_OR("eitheror", "Entweder/Oder", "⚡"),
    WORD_CHAIN("wordchain", "Wortkette", "🔗"),
    ANAGRAM("anagram", "Anagramme", "🔤");

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
    val settings: RoomSettings
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
