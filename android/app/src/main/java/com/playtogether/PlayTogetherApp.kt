package com.playtogether

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * PlayTogether Application
 * Initialisiert Hilt für Dependency Injection
 */
@HiltAndroidApp
class PlayTogetherApp : Application()
