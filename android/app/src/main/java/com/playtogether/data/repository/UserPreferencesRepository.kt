package com.playtogether.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

class UserPreferencesRepository(private val context: Context) {

    private object Keys {
        val PLAYER_NAME = stringPreferencesKey("player_name")
    }

    val playerName: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[Keys.PLAYER_NAME] ?: ""
    }

    suspend fun savePlayerName(name: String) {
        context.dataStore.edit { prefs ->
            prefs[Keys.PLAYER_NAME] = name
        }
    }
}
