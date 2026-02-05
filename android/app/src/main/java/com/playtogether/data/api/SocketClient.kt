package com.playtogether.data.api

import com.playtogether.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Verbindungsstatus
 */
enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
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

    /**
     * Verbindet zum Server
     */
    fun connect() {
        if (socket?.connected() == true) return

        try {
            _connectionState.value = ConnectionState.CONNECTING

            val options = IO.Options().apply {
                transports = arrayOf("websocket")
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
                timeout = 10000
            }

            socket = IO.socket(BuildConfig.SERVER_URL, options).apply {
                on(Socket.EVENT_CONNECT) {
                    _connectionState.value = ConnectionState.CONNECTED
                    _lastError.value = null
                }

                on(Socket.EVENT_DISCONNECT) {
                    _connectionState.value = ConnectionState.DISCONNECTED
                }

                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    _connectionState.value = ConnectionState.ERROR
                    _lastError.value = args.firstOrNull()?.toString() ?: "Verbindungsfehler"
                }

                connect()
            }
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.ERROR
            _lastError.value = e.message
        }
    }

    /**
     * Trennt die Verbindung
     */
    fun disconnect() {
        socket?.disconnect()
        socket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    /**
     * Sendet eine Nachricht an den Server
     */
    fun send(type: String, payload: JSONObject = JSONObject()) {
        val message = JSONObject().apply {
            put("type", type)
            put("payload", payload)
        }
        socket?.emit("message", message)
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
    fun messages(): Flow<ServerMessage> = callbackFlow {
        val listener = { args: Array<Any> ->
            try {
                val json = args[0] as JSONObject
                val type = json.getString("type")
                val payload = json.optJSONObject("payload") ?: JSONObject()
                trySend(ServerMessage(type, payload))
            } catch (e: Exception) {
                // Parsing error
            }
            Unit
        }

        socket?.on("message", listener)

        awaitClose {
            socket?.off("message", listener)
        }
    }

    /**
     * Server-Nachricht
     */
    data class ServerMessage(
        val type: String,
        val payload: JSONObject
    )
}
