# PlayTogether Android App

Native Android App für die PlayTogether Multiplayer-Plattform.

## Technologien

- **Kotlin** - Programmiersprache
- **Jetpack Compose** - Modern UI Toolkit
- **Hilt** - Dependency Injection
- **Socket.IO** - Echtzeit-Kommunikation
- **Kotlin Coroutines & Flow** - Asynchrone Programmierung
- **Material 3** - Design System

## Projektstruktur

```
app/src/main/java/com/playtogether/
├── PlayTogetherApp.kt      # Application Klasse
├── MainActivity.kt         # Haupt-Activity
├── di/                     # Dependency Injection
│   └── AppModule.kt
├── data/
│   ├── api/
│   │   └── SocketClient.kt # Socket.IO Wrapper
│   ├── model/
│   │   └── Models.kt       # Datenmodelle
│   └── repository/
│       └── GameRepository.kt
└── ui/
    ├── Navigation.kt       # App Navigation
    ├── theme/              # Material Theme
    │   ├── Color.kt
    │   ├── Theme.kt
    │   └── Type.kt
    └── screens/
        ├── HomeScreen.kt   # Start-Bildschirm
        ├── LobbyScreen.kt  # Warteraum
        └── GameScreen.kt   # Spiel-Bildschirm
```

## Setup

### Voraussetzungen

- Android Studio Hedgehog (2023.1.1) oder neuer
- JDK 17
- Android SDK 34

### Server-Konfiguration

Die Server-URL wird in `app/build.gradle.kts` konfiguriert:

```kotlin
// Debug (Emulator - 10.0.2.2 ist localhost des Hosts)
buildConfigField("String", "SERVER_URL", "\"http://10.0.2.2:3000\"")

// Release
buildConfigField("String", "SERVER_URL", "\"https://api.playtogether.app\"")
```

Für physische Geräte im lokalen Netzwerk die IP-Adresse des Servers verwenden.

### Build

```bash
# Debug APK erstellen
./gradlew assembleDebug

# Release APK erstellen
./gradlew assembleRelease

# App auf verbundenes Gerät installieren
./gradlew installDebug
```

## Features

- [x] Verbindung zum Server
- [x] Raum erstellen/beitreten
- [x] Lobby mit Spielerliste
- [x] Spiel-Grundgerüst
- [ ] Vollständige Spiel-Implementierungen
- [ ] Moody Avatar System
- [ ] Offline-Modus
- [ ] Push-Benachrichtigungen

## Mindest-Anforderungen

- Android 8.0 (API 26) oder höher
- Internetverbindung
