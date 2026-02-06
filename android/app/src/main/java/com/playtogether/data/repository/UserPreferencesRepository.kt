package com.playtogether.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

class UserPreferencesRepository(private val context: Context) {

    private object Keys {
        val PLAYER_NAME = stringPreferencesKey("player_name")
        val LAST_ROOM_CODE = stringPreferencesKey("last_room_code")
    }

    val playerName: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[Keys.PLAYER_NAME] ?: ""
    }

    suspend fun savePlayerName(name: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.PLAYER_NAME] = name
        }
    }

    /**
     * Saves the current room code for auto-reconnect after process death
     */
    suspend fun saveLastRoomCode(code: String?) {
        context.dataStore.edit { prefs ->
            if (code != null) {
                prefs[Keys.LAST_ROOM_CODE] = code
            } else {
                prefs.remove(Keys.LAST_ROOM_CODE)
            }
        }
    }

    /**
     * Gets the last room code (blocking read for init)
     */
    suspend fun getLastRoomCode(): String? {
        return context.dataStore.data.first()[Keys.LAST_ROOM_CODE]
    }

    /**
     * Gets the saved player name (blocking read for init)
     */
    suspend fun getPlayerName(): String? {
        val name = context.dataStore.data.first()[Keys.PLAYER_NAME]
        return if (name.isNullOrBlank()) null else name
    }
}
