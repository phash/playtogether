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

### Voraussetzungen

- Node.js 18+
- npm oder pnpm

### Installation

```bash
# Dependencies installieren
npm install

# Shared-Paket bauen
npm run build:shared
```

### Entwicklung

```bash
# Server und Client gleichzeitig starten
npm run dev

# Oder einzeln:
npm run dev:server  # Server auf Port 3001
npm run dev:client  # Client auf Port 5173
```

### Produktion

```bash
npm run build
npm run start
```

## Wie es funktioniert

1. **Spiel erstellen**: Ein Spieler erstellt einen Raum und wählt ein Spiel
2. **Code teilen**: Der 4-stellige Raum-Code wird mit Freunden geteilt
3. **Beitreten**: Freunde öffnen die App und geben den Code ein
4. **Spielen**: Der Host startet das Spiel, wenn genug Spieler da sind

## Technologie-Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand
- **Backend**: Node.js, Express, Socket.io
- **Shared**: TypeScript Typen und Utilities

## Verfügbare Spiele

| Spiel | Status | Spieler |
|-------|--------|---------|
| Quiz Battle | ✅ Demo | 2-8 |
| Kritzel & Rate | 🚧 Geplant | 3-10 |
| Wort-Raten | 🚧 Geplant | 4-12 |
| Reaktions-Test | 🚧 Geplant | 2-8 |

## Lizenz

MIT
