# PlayTogether

Eine Multiplayer-Plattform für kleine Spiele, die man gemeinsam über Smartphones spielen kann.

## Features

- **Echtzeit-Multiplayer** via WebSocket
- **Mobile-First Design** - optimiert für Smartphones
- **Native Android App** mit Jetpack Compose
- **Raum-System** mit einfachen 4-stelligen Codes
- **10 Spielmodi** in 3 Kategorien (Klassisch, Party, Wort-Spiele)
- **Moody-System** - Virtuelles Haustier mit Belohnungen
- **Achievement-System** - 18 Achievements zum Freischalten
- **Freundschafts-System** - Freunde hinzufuegen und verwalten
- **Playlist-System** - Mehrere Spiele hintereinander spielen

## Projektstruktur

```
playtogether/
├── packages/
│   ├── shared/     # Gemeinsame Typen und Utilities
│   ├── server/     # Backend (Express + Socket.io + Prisma)
│   └── client/     # Frontend (React + Vite)
├── android/        # Native Android App (Kotlin + Jetpack Compose)
└── docker-compose.yml
```

## Schnellstart

### Mit Docker (Empfohlen)

**Voraussetzungen:** Docker und Docker Compose

```bash
# .env Datei erstellen
cp .env.example .env

# Container bauen und starten
make up

# Oder mit npm:
npm run docker:up
```

Die Anwendung ist dann verfügbar:
- **Client:** http://localhost (Port 80)
- **Server:** http://localhost:3001

**Weitere Docker-Befehle:**
```bash
make logs      # Logs anzeigen
make down      # Container stoppen
make restart   # Container neustarten
make dev       # Entwicklungsmodus mit Hot-Reload
```

### Ohne Docker (Lokale Entwicklung)

**Voraussetzungen:** Node.js 18+

```bash
# Dependencies installieren
npm install

# Shared-Paket bauen
npm run build:shared

# Server und Client gleichzeitig starten
npm run dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173

## Wie es funktioniert

1. **Spiel erstellen**: Ein Spieler erstellt einen Raum und wählt ein Spiel
2. **Code teilen**: Der 4-stellige Raum-Code wird mit Freunden geteilt
3. **Beitreten**: Freunde öffnen die App und geben den Code ein
4. **Spielen**: Der Host startet das Spiel, wenn genug Spieler da sind

## Technologie-Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand
- **Backend**: Node.js, Express, Socket.io, Prisma
- **Android**: Kotlin, Jetpack Compose, Material 3
- **Database**: PostgreSQL, Redis
- **Shared**: TypeScript Typen und Utilities
- **Deployment**: Docker, Docker Compose, nginx

## Docker Deployment

### Produktion

```bash
# Einfaches Deployment
./scripts/deploy.sh

# Oder manuell:
docker compose build
docker compose up -d
```

### Konfiguration

Umgebungsvariablen in `.env`:

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `SERVER_PORT` | Server-Port (extern) | 3001 |
| `CLIENT_PORT` | Client-Port (extern) | 80 |
| `VITE_SERVER_URL` | WebSocket URL | http://localhost:3001 |
| `CLIENT_URL` | CORS Origin | http://localhost |

### Container

| Service | Image | Port | Beschreibung |
|---------|-------|------|--------------|
| `server` | Node.js Alpine | 3001 | WebSocket + REST API |
| `client` | nginx Alpine | 80 | Static Files + SPA |

### Health Checks

```bash
# Server
curl http://localhost:3001/api/health

# Client
curl http://localhost/health
```

## Verfuegbare Spiele (10)

### Klassische Spiele
| Spiel | Spieler | Beschreibung |
|-------|---------|--------------|
| Quiz Champ | 2-8 | 145 Fragen, 20s Timer, Streak-Bonus |
| Tic Tac Toe | 2-8 | Klassisches Strategiespiel im Turniermodus |
| Schere Stein Papier | 2-16 | Turnier-Paarungen |
| Reaktions-Test | 2-8 | Reagiere so schnell wie moeglich auf das Signal |

### Party & Spass
| Spiel | Spieler | Beschreibung |
|-------|---------|--------------|
| Entweder/Oder | 3-20 | Was waehlt die Mehrheit? Stimme ab! |
| Gluecksrad | 2-6 | Drehe das Rad und loese die Phrase |
| Emoji Malen | 3-10 | Male mit Emojis und lass andere raten |

### Wort-Spiele
| Spiel | Spieler | Beschreibung |
|-------|---------|--------------|
| Anagramme | 2-8 | Entwirre das verwuerfelte Wort |
| Galgenmaennchen | 2-8 | Errate das Wort Buchstabe fuer Buchstabe |
| Wort-Raten | 4-12 | Erklaere Woerter und lass Freunde raten |

## Android App

Die native Android-App ist verfügbar als APK-Download:

```
http://localhost:3003/download/playtogether.apk
```

**Features:**
- Native Jetpack Compose UI
- Material Design 3
- WebSocket-Integration
- Offline-fähig (Lobby)

## Lizenz

MIT
