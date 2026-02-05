# PlayTogether

Eine Multiplayer-Plattform für kleine Spiele, die man gemeinsam über Smartphones spielen kann.

## Features

- **Echtzeit-Multiplayer** via WebSocket
- **Mobile-First Design** - optimiert für Smartphones
- **Raum-System** mit einfachen 4-stelligen Codes
- **Mehrere Spielmodi** (Quiz, Zeichnen, Wörter raten, Reaktionstest)

## Projektstruktur

```
playtogether/
├── packages/
│   ├── shared/     # Gemeinsame Typen und Utilities
│   ├── server/     # Backend (Express + Socket.io)
│   └── client/     # Frontend (React + Vite)
└── games/          # Spielmodule (geplant)
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
- **Backend**: Node.js, Express, Socket.io
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

## Verfügbare Spiele

| Spiel | Status | Spieler |
|-------|--------|---------|
| Quiz Battle | ✅ Demo | 2-8 |
| Kritzel & Rate | 🚧 Geplant | 3-10 |
| Wort-Raten | 🚧 Geplant | 4-12 |
| Reaktions-Test | 🚧 Geplant | 2-8 |

## Lizenz

MIT
