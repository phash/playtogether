# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Docker (recommended) - starts all services
docker compose up -d
docker compose up -d --build  # rebuild after changes
docker compose logs -f        # view logs

# Local development (Node.js 18+)
npm install
npm run build:shared          # must build shared package first
npm run dev                   # runs server + client concurrently

# Individual services
npm run dev:server            # server only (localhost:3001)
npm run dev:client            # client only (localhost:5173)

# Testing
npm test                      # run all tests
npm run test:watch            # watch mode

# Android APK
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

## Architecture

### Monorepo Structure
- `packages/shared/` - TypeScript types and utilities shared between server and client
- `packages/server/` - Express + Socket.io backend with Prisma ORM
- `packages/client/` - React + Vite frontend
- `android/` - Native Kotlin Android app with Jetpack Compose

### Game Engine Pattern
All game engines extend `BaseGameEngine` in `packages/server/src/games/`:

```typescript
class MyGameEngine extends BaseGameEngine {
  start(): void { }
  handleAction(action: GameAction): void { }
  getState(): AnyGameState { }
  getGameType(): GameType { }
  protected startRound(): void { }
}
```

To add a new game:
1. Create engine class extending `BaseGameEngine`
2. Register in `GameManager.ts` GAME_ENGINES map
3. Export from `games/index.ts`
4. Add types to `packages/shared/src/types/game.ts`

### Real-time Communication
- Server uses Socket.io for WebSocket connections
- Messages follow typed protocol defined in `packages/shared/src/types/messages.ts`
- Client messages: `create_room`, `join_room`, `game_action`, `moody_update`, etc.
- Server messages: `room_created`, `game_state`, `player_joined`, etc.

### Room System
- `RoomManager` handles room lifecycle (create, join, leave)
- Rooms identified by 4-character codes
- Players join via code, host controls game start
- Room state broadcast to all players via Socket.io

### Playlist System
- `PlaylistManager` in `packages/server/src/games/` manages multiple games in sequence
- Cumulative scores across all games in a playlist
- `IntermissionScreen` component shown between games with rankings and next game preview
- Socket events: `intermission`, `timer_tick`, `playlist_ended`

### Scoring System
- `calculateSpeedScore(base, timeLeftMs, maxTimeMs)` in `BaseGameEngine` for speed bonuses (1.0-2.0x)
- Quiz Champ: streak bonuses (+25 at 3 correct, +50 at 5+)
- Game-specific stats stored as JSON in `UserStats.gameSpecificStats`

### Database (Prisma)
Schema in `packages/server/prisma/schema.prisma`:
- `User` - accounts (can be guests)
- `Moody` - avatar customization and XP
- `UserStats` - game statistics (with `gameSpecificStats` JSON field)
- `GameScore` - per-round scoring with base points and speed bonus
- `MonthlyScore` / `CrownHolder` - monthly leaderboard system
- `GameSession` / `GameParticipant` - game history

## Environment Configuration

Key variables in `.env` (see `.env.example`):
- `SERVER_PORT` - external server port (default: 3001)
- `CLIENT_PORT` - external client port (default: 80)
- `VITE_SERVER_URL` - WebSocket URL for client (must match server's external URL)
- `CLIENT_URL` - CORS origin (must match client's external URL)

**Important for mobile access:** Both `VITE_SERVER_URL` and `CLIENT_URL` must use the server's LAN IP (not localhost) for devices to connect over the network.

## Android App

- Server URL configured in `android/app/build.gradle.kts` as `BuildConfig.SERVER_URL`
- Debug build uses local network IP, release build uses production URL
- Version displayed on HomeScreen via `BuildConfig.VERSION_NAME`
- APK download available at `/download` endpoint on server

## Implemented Games

| Game Type | Engine Class | Description |
|-----------|--------------|-------------|
| `anagramme` | AnagrammeEngine | Unscramble letters to form a word |
| `quiz_champ` | QuizChampEngine | 4-option quiz with streak bonuses |
| `entweder_oder` | EntwederOderEngine | Majority vote either/or |
| `gluecksrad` | GluecksradEngine | Wheel of Fortune with turn-based play |
| `tic_tac_toe` | TicTacToeEngine | Tic-tac-toe with tournament brackets |
| `rock_paper_scissors` | RockPaperScissorsEngine | Rock-paper-scissors tournament |
| `hangman` | HangmanEngine | Cooperative hangman word guessing |

### Game Content
Content data in `packages/shared/src/data/gameContent.ts`:
- 145 quiz questions (8 categories, 3 difficulty levels)
- 91 either/or questions (7 categories)
- 150 German words (easy/medium/hard) for Anagramme, Hangman, Gluecksrad
- 100 Gluecksrad phrases (7 categories)
- Utility functions: `shuffleArray`, `scrambleWord`, `getRandomWords`, `getRandomQuestions`
