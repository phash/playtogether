package com.playtogether.data.repository

import com.playtogether.data.api.SocketClient
import com.playtogether.data.model.GameState
import com.playtogether.data.model.Player
import com.playtogether.data.model.Room
import com.playtogether.data.model.RoomSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository für Spielzustand
 */
@Singleton
class GameRepository @Inject constructor(
    private val socketClient: SocketClient
) {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Verbindungsstatus
    val connectionState = socketClient.connectionState

    // Aktueller Raum
    private val _room = MutableStateFlow<Room?>(null)
    val room: StateFlow<Room?> = _room

    // Spieler-ID
    private val _playerId = MutableStateFlow<String?>(null)
    val playerId: StateFlow<String?> = _playerId

    // Spielzustand
    private val _gameState = MutableStateFlow<GameState?>(null)
    val gameState: StateFlow<GameState?> = _gameState

    // Fehler
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init {
        observeMessages()
    }

    private fun observeMessages() {
        socketClient.messages()
            .onEach { message -> handleMessage(message) }
            .launchIn(scope)
    }

    private fun handleMessage(message: SocketClient.ServerMessage) {
        when (message.type) {
            "room_created", "room_joined" -> {
                val roomJson = message.payload.getJSONObject("room")
                _room.value = parseRoom(roomJson)
                _playerId.value = message.payload.getString("playerId")
            }

            "room_updated" -> {
                val roomJson = message.payload.getJSONObject("room")
                _room.value = parseRoom(roomJson)
            }

            "player_joined" -> {
                val playerJson = message.payload.getJSONObject("player")
                val player = parsePlayer(playerJson)
                _room.value = _room.value?.copy(
                    players = _room.value!!.players + player
                )
            }

            "player_left" -> {
                val leftPlayerId = message.payload.getString("playerId")
                _room.value = _room.value?.copy(
                    players = _room.value!!.players.filter { it.id != leftPlayerId }
                )
            }

            "player_updated" -> {
                val playerJson = message.payload.getJSONObject("player")
                val updatedPlayer = parsePlayer(playerJson)
                _room.value = _room.value?.copy(
                    players = _room.value!!.players.map {
                        if (it.id == updatedPlayer.id) updatedPlayer else it
                    }
                )
            }

            "game_starting" -> {
                _room.value = _room.value?.copy(status = "starting")
            }

            "game_state" -> {
                val stateJson = message.payload.getJSONObject("state")
                _gameState.value = parseGameState(stateJson)
                _room.value = _room.value?.copy(status = "playing")
            }

            "game_ended" -> {
                _room.value = _room.value?.copy(status = "finished")
            }

            "error" -> {
                _error.value = message.payload.getString("message")
            }
        }
    }

    private fun parseRoom(json: JSONObject): Room {
        val playersArray = json.getJSONArray("players")
        val players = (0 until playersArray.length()).map { i ->
            parsePlayer(playersArray.getJSONObject(i))
        }

        val settingsJson = json.optJSONObject("settings") ?: JSONObject()

        return Room(
            id = json.getString("id"),
            code = json.getString("code"),
            hostId = json.getString("hostId"),
            gameType = json.getString("gameType"),
            status = json.getString("status"),
            players = players,
            settings = RoomSettings(
                roundCount = settingsJson.optInt("roundCount", 5),
                timePerRound = settingsJson.optInt("timePerRound", 30)
            )
        )
    }

    private fun parsePlayer(json: JSONObject): Player {
        return Player(
            id = json.getString("id"),
            name = json.getString("name"),
            avatarColor = json.getString("avatarColor"),
            isHost = json.getBoolean("isHost"),
            score = json.optInt("score", 0),
            isReady = json.optBoolean("isReady", false)
        )
    }

    private fun parseGameState(json: JSONObject): GameState {
        val scoresJson = json.optJSONObject("scores") ?: JSONObject()
        val scores = mutableMapOf<String, Int>()
        scoresJson.keys().forEach { key ->
            scores[key] = scoresJson.getInt(key)
        }

        return GameState(
            type = json.getString("type"),
            currentRound = json.getInt("currentRound"),
            totalRounds = json.getInt("totalRounds"),
            phase = json.getString("phase"),
            timeRemaining = json.optInt("timeRemaining", 0),
            scores = scores
        )
    }

    // Public API
    fun connect() = socketClient.connect()
    fun disconnect() = socketClient.disconnect()

    fun createRoom(playerName: String, gameType: String) {
        socketClient.createRoom(playerName, gameType)
    }

    fun joinRoom(code: String, playerName: String) {
        socketClient.joinRoom(code, playerName)
    }

    fun leaveRoom() {
        socketClient.leaveRoom()
        _room.value = null
        _playerId.value = null
        _gameState.value = null
    }

    fun setReady(ready: Boolean) = socketClient.setReady(ready)
    fun startGame() = socketClient.startGame()

    fun sendGameAction(action: String, data: JSONObject = JSONObject()) {
        socketClient.sendGameAction(action, data)
    }

    fun clearError() {
        _error.value = null
    }
}
