package com.playtogether.data.api

import android.util.Log
import com.playtogether.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "SocketClient"

/**
 * Verbindungsstatus
 */
enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    ERROR
}

/**
 * Socket.IO Client Wrapper
 */
@Singleton
class SocketClient @Inject constructor() {

    private var socket: Socket? = null

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _lastError = MutableStateFlow<String?>(null)
    val lastError: StateFlow<String?> = _lastError

    // Store last room info for auto-reconnect
    var lastRoomCode: String? = null
    var lastPlayerName: String? = null

    // Track if this is a reconnection (not first connect)
    private var hasConnectedBefore = false

    // Message flow - uses replay=10 to buffer recent messages for late subscribers
    private val _messages = MutableSharedFlow<ServerMessage>(replay = 10)

    /**
     * Verbindet zum Server
     */
    fun connect() {
        // Don't create a new socket if one already exists (even if disconnected - it will auto-reconnect)
        if (socket != null) {
            if (socket?.connected() == true) {
                Log.d(TAG, "Already connected, skipping connect()")
                return
            }
            // Socket exists but not connected - it's probably reconnecting via Socket.IO
            Log.d(TAG, "Socket exists but not connected, state=${_connectionState.value}")
            return
        }

        try {
            _connectionState.value = ConnectionState.CONNECTING
            Log.d(TAG, "Creating new socket connection to ${BuildConfig.SERVER_URL}")

            val options = IO.Options().apply {
                // Allow both transports - polling as fallback if websocket fails
                transports = arrayOf("websocket", "polling")
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 1000
                reconnectionDelayMax = 10000
                timeout = 20000  // 20s initial connection timeout
                forceNew = false // Reuse existing connection
            }

            socket = IO.socket(BuildConfig.SERVER_URL, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "=== CONNECTED to server (id: ${id()}) ===")
                    _connectionState.value = ConnectionState.CONNECTED
                    _lastError.value = null

                    // Auto-reconnect to last room (works for both socket reconnects
                    // and fresh connects after process death if room info was restored)
                    val code = lastRoomCode
                    val name = lastPlayerName
                    if (code != null && name != null) {
                        Log.d(TAG, ">>> Auto-reconnecting to room $code as $name")
                        reconnect(code, name)
                    }
                    hasConnectedBefore = true
                }

                on(Socket.EVENT_DISCONNECT) { args ->
                    val reason = args.firstOrNull()?.toString() ?: "unknown"
                    Log.w(TAG, "=== DISCONNECTED: $reason ===")
                    if (lastRoomCode != null) {
                        _connectionState.value = ConnectionState.RECONNECTING
                    } else {
                        _connectionState.value = ConnectionState.DISCONNECTED
                    }
                }

                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    val error = args.firstOrNull()?.toString() ?: "Verbindungsfehler"
                    Log.e(TAG, "=== CONNECTION ERROR: $error ===")
                    if (lastRoomCode != null) {
                        _connectionState.value = ConnectionState.RECONNECTING
                    } else {
                        _connectionState.value = ConnectionState.ERROR
                        _lastError.value = error
                    }
                }

                // Log reconnection attempts
                on("reconnect_attempt") { args ->
                    val attempt = args.firstOrNull()?.toString() ?: "?"
                    Log.d(TAG, "Reconnect attempt #$attempt")
                }

                on("reconnect") { args ->
                    val attempt = args.firstOrNull()?.toString() ?: "?"
                    Log.d(TAG, "Reconnected after $attempt attempts")
                }

                on("reconnect_error") { args ->
                    val error = args.firstOrNull()?.toString() ?: "?"
                    Log.w(TAG, "Reconnect error: $error")
                }

                on("reconnect_failed") {
                    Log.e(TAG, "Reconnect FAILED - all attempts exhausted")
                    _connectionState.value = ConnectionState.ERROR
                }

                // Register message listener immediately so no messages are lost
                on("message") { args ->
                    try {
                        val json = args[0] as JSONObject
                        val type = json.getString("type")
                        val payload = json.optJSONObject("payload") ?: JSONObject()
                        Log.d(TAG, "Received: $type")
                        _messages.tryEmit(ServerMessage(type, payload))
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to parse message", e)
                    }
                }
                Log.d(TAG, "Message listener registered on socket")

                // Ping/pong logging for debugging
                on("ping") {
                    Log.v(TAG, "ping")
                }

                on("pong") { args ->
                    val latency = args.firstOrNull()?.toString() ?: "?"
                    Log.v(TAG, "pong (latency: ${latency}ms)")
                }

                connect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create socket", e)
            _connectionState.value = ConnectionState.ERROR
            _lastError.value = e.message
        }
    }

    /**
     * Trennt die Verbindung
     */
    fun disconnect() {
        Log.d(TAG, "Explicit disconnect requested")
        socket?.disconnect()
        socket?.off()  // Remove all listeners
        socket = null
        hasConnectedBefore = false
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    /**
     * Sendet eine Nachricht an den Server
     */
    fun send(type: String, payload: JSONObject = JSONObject()) {
        val s = socket
        if (s == null || !s.connected()) {
            Log.w(TAG, "Cannot send '$type' - socket not connected (socket=${s != null}, connected=${s?.connected()})")
            return
        }
        try {
            val message = JSONObject().apply {
                put("type", type)
                put("payload", payload)
            }
            Log.d(TAG, "Sending: $type")
            s.emit("message", message)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send message: $type", e)
        }
    }

    /**
     * Reconnect zu einem bestehenden Raum
     */
    fun reconnect(code: String, playerName: String) {
        send("reconnect", JSONObject().apply {
            put("code", code)
            put("playerName", playerName)
        })
    }

    /**
     * Erstellt einen Raum
     */
    fun createRoom(playerName: String, gameType: String) {
        send("create_room", JSONObject().apply {
            put("playerName", playerName)
            put("gameType", gameType)
        })
    }

    /**
     * Tritt einem Raum bei
     */
    fun joinRoom(code: String, playerName: String) {
        send("join_room", JSONObject().apply {
            put("code", code)
            put("playerName", playerName)
        })
    }

    /**
     * Verlässt den Raum
     */
    fun leaveRoom() {
        send("leave_room")
    }

    /**
     * Setzt Bereitschaftsstatus
     */
    fun setReady(ready: Boolean) {
        send("set_ready", JSONObject().apply {
            put("ready", ready)
        })
    }

    /**
     * Startet das Spiel (nur Host)
     */
    fun startGame() {
        send("start_game")
    }

    /**
     * Sendet eine Spielaktion
     */
    fun sendGameAction(action: String, data: JSONObject = JSONObject()) {
        send("game_action", JSONObject().apply {
            put("action", action)
            put("data", data)
        })
    }

    /**
     * Aktualisiert Moody
     */
    fun updateMoody(mood: String, cosmetics: JSONObject = JSONObject()) {
        send("moody_update", JSONObject().apply {
            put("mood", mood)
            put("cosmetics", cosmetics)
        })
    }

    /**
     * Sendet eine Reaktion
     */
    fun sendReaction(reactionType: String, toPlayerId: String? = null) {
        send("moody_reaction", JSONObject().apply {
            put("reactionType", reactionType)
            if (toPlayerId != null) {
                put("toPlayerId", toPlayerId)
            }
        })
    }

    /**
     * Lauscht auf Server-Nachrichten als Flow
     */
    fun messages(): Flow<ServerMessage> = _messages.asSharedFlow()

    /**
     * Server-Nachricht
     */
    data class ServerMessage(
        val type: String,
        val payload: JSONObject
    )
}
