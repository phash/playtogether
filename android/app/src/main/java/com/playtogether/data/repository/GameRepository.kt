package com.playtogether.data.repository

import android.util.Log
import com.playtogether.data.api.ConnectionState
import com.playtogether.data.api.SocketClient
import com.playtogether.data.model.GameState
import com.playtogether.data.model.Player
import com.playtogether.data.model.PlaylistItem
import com.playtogether.data.model.Room
import com.playtogether.data.model.RoomSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "GameRepository"

/**
 * Repository für Spielzustand
 */
@Singleton
class GameRepository @Inject constructor(
    private val socketClient: SocketClient,
    private val userPreferences: UserPreferencesRepository
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

    // Live timer (updated by timer_tick events)
    private val _timerValue = MutableStateFlow(0)
    val timerValue: StateFlow<Int> = _timerValue

    // Raw game state JSON (for game-specific fields)
    private val _rawGameState = MutableStateFlow<JSONObject?>(null)
    val rawGameState: StateFlow<JSONObject?> = _rawGameState

    // Fehler
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    // Track if we intentionally left the room (vs disconnect)
    private var intentionallyLeft = false

    init {
        observeMessages()
        observeConnectionState()
        // Restore saved room info for auto-reconnect after process death
        restoreSavedRoomInfo()
    }

    private fun restoreSavedRoomInfo() {
        scope.launch {
            try {
                val savedCode = userPreferences.getLastRoomCode()
                val savedName = userPreferences.getPlayerName()
                if (savedCode != null && savedName != null) {
                    Log.d(TAG, "Restored saved room info: code=$savedCode, name=$savedName")
                    socketClient.lastRoomCode = savedCode
                    socketClient.lastPlayerName = savedName
                    // If socket is already connected (race condition after process death),
                    // attempt reconnect immediately
                    if (connectionState.value == ConnectionState.CONNECTED) {
                        Log.d(TAG, "Socket already connected, attempting immediate reconnect to room $savedCode")
                        socketClient.reconnect(savedCode, savedName)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to restore saved room info", e)
            }
        }
    }

    private fun persistRoomCode(code: String?) {
        scope.launch {
            try {
                userPreferences.saveLastRoomCode(code)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to persist room code", e)
            }
        }
    }

    private fun observeMessages() {
        socketClient.messages()
            .onEach { message ->
                try {
                    handleMessage(message)
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling message: ${message.type}", e)
                }
            }
            .launchIn(scope)
    }

    private fun observeConnectionState() {
        socketClient.connectionState
            .onEach { state ->
                when (state) {
                    ConnectionState.RECONNECTING -> {
                        Log.d(TAG, "Reconnecting... keeping room state")
                    }
                    ConnectionState.CONNECTED -> {
                        Log.d(TAG, "Connected")
                    }
                    ConnectionState.DISCONNECTED -> {
                        if (intentionallyLeft) {
                            _room.value = null
                            _playerId.value = null
                            _gameState.value = null
                            _rawGameState.value = null
                            _timerValue.value = 0
                        }
                    }
                    else -> {}
                }
            }
            .launchIn(scope)
    }

    private fun handleMessage(message: SocketClient.ServerMessage) {
        when (message.type) {
            "room_created", "room_joined" -> {
                val roomJson = message.payload.getJSONObject("room")
                val room = parseRoom(roomJson)
                _room.value = room
                _playerId.value = message.payload.getString("playerId")
                // Store for auto-reconnect (in-memory + persistent)
                socketClient.lastRoomCode = room.code
                persistRoomCode(room.code)
                intentionallyLeft = false
                Log.d(TAG, "Room ${room.code}: ${message.type} (status=${room.status})")
            }

            "room_updated" -> {
                val roomJson = message.payload.getJSONObject("room")
                _room.value = parseRoom(roomJson)
            }

            "player_joined" -> {
                val playerJson = message.payload.getJSONObject("player")
                val player = parsePlayer(playerJson)
                _room.value = _room.value?.let { room ->
                    room.copy(players = room.players + player)
                }
            }

            "player_left" -> {
                val leftPlayerId = message.payload.getString("playerId")
                _room.value = _room.value?.let { room ->
                    room.copy(players = room.players.filter { it.id != leftPlayerId })
                }
            }

            "player_updated" -> {
                val playerJson = message.payload.getJSONObject("player")
                val updatedPlayer = parsePlayer(playerJson)
                _room.value = _room.value?.let { room ->
                    room.copy(players = room.players.map {
                        if (it.id == updatedPlayer.id) updatedPlayer else it
                    })
                }
            }

            "player_disconnected" -> {
                val playerName = message.payload.optString("playerName", "?")
                Log.d(TAG, "Player disconnected: $playerName")
            }

            "player_reconnected" -> {
                val playerName = message.payload.optString("playerName", "?")
                Log.d(TAG, "Player reconnected: $playerName")
            }

            "game_starting" -> {
                _room.value = _room.value?.copy(status = "starting")
            }

            "timer_tick" -> {
                _timerValue.value = message.payload.optInt("timeRemaining", 0)
            }

            "game_state" -> {
                val stateJson = message.payload.getJSONObject("state")
                _gameState.value = parseGameState(stateJson)
                _rawGameState.value = stateJson
                _timerValue.value = stateJson.optInt("timeRemaining", 0)
                _room.value = _room.value?.copy(status = "playing")
            }

            "game_intermission" -> {
                _room.value = _room.value?.copy(status = "intermission")
            }

            "game_ended" -> {
                _gameState.value = null
                _rawGameState.value = null
                _timerValue.value = 0
                _room.value = _room.value?.copy(status = "finished")
            }

            "error" -> {
                val errorMsg = message.payload.optString("message", "Unbekannter Fehler")
                val errorCode = message.payload.optString("code", "")
                Log.e(TAG, "Server error: $errorCode - $errorMsg")

                if (errorCode == "RECONNECT_FAILED") {
                    Log.d(TAG, "Reconnect failed - room may no longer exist")
                    socketClient.lastRoomCode = null
                    socketClient.lastPlayerName = null
                    persistRoomCode(null)
                    _room.value = null
                    _playerId.value = null
                    _gameState.value = null
                    _rawGameState.value = null
                    _timerValue.value = 0
                } else {
                    _error.value = errorMsg
                }
            }
        }
    }

    private fun parseRoom(json: JSONObject): Room {
        val playersArray = json.getJSONArray("players")
        val players = (0 until playersArray.length()).map { i ->
            parsePlayer(playersArray.getJSONObject(i))
        }

        val settingsJson = json.optJSONObject("settings") ?: JSONObject()

        val playlistArray = json.optJSONArray("playlist")
        val playlist = if (playlistArray != null) {
            (0 until playlistArray.length()).map { i ->
                val item = playlistArray.getJSONObject(i)
                PlaylistItem(
                    gameType = item.getString("gameType"),
                    roundCount = item.optInt("roundCount", 5),
                    timePerRound = item.optInt("timePerRound", 30)
                )
            }
        } else {
            emptyList()
        }

        return Room(
            id = json.getString("id"),
            code = json.getString("code"),
            hostId = json.getString("hostId"),
            gameType = json.getString("gameType"),
            status = json.getString("status"),
            players = players,
            maxPlayers = json.optInt("maxPlayers", 8),
            minPlayers = json.optInt("minPlayers", 2),
            settings = RoomSettings(
                roundCount = settingsJson.optInt("roundCount", 5),
                timePerRound = settingsJson.optInt("timePerRound", 30)
            ),
            playlist = playlist,
            currentPlaylistIndex = json.optInt("currentPlaylistIndex", 0)
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
        socketClient.lastPlayerName = playerName
        intentionallyLeft = false
        socketClient.createRoom(playerName, gameType)
    }

    fun joinRoom(code: String, playerName: String) {
        socketClient.lastPlayerName = playerName
        intentionallyLeft = false
        socketClient.joinRoom(code, playerName)
    }

    fun leaveRoom() {
        intentionallyLeft = true
        socketClient.leaveRoom()
        socketClient.lastRoomCode = null
        socketClient.lastPlayerName = null
        persistRoomCode(null)
        _room.value = null
        _playerId.value = null
        _gameState.value = null
        _rawGameState.value = null
        _timerValue.value = 0
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
