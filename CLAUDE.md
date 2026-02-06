# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Docker (recommended) - starts all services (postgres, redis, server, client)
docker compose up -d
docker compose up -d --build  # rebuild after changes
docker compose logs -f        # view logs

# Local development (Node.js 18+)
npm install
npm run build:shared          # must build shared package first
npm run dev                   # runs server + client concurrently
npm run dev:server            # server only (localhost:3001)
npm run dev:client            # client only (localhost:5173)

# Testing (vitest, config in vitest.config.ts)
npm test                      # run all tests
npm run test:watch            # watch mode
npm run test:coverage         # with v8 coverage

# Database (run from packages/server/)
npx prisma migrate dev        # create/apply dev migration
npx prisma migrate deploy     # apply migrations in production
npx prisma db push            # push schema without migration
npx prisma studio             # GUI for browsing data
npx prisma generate           # regenerate client after schema changes

# Android APK
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

Makefile shortcuts for Docker: `make up`, `make down`, `make logs`, `make dev`, `make clean`, `make health`.

## Architecture

### Monorepo Structure (npm workspaces)
- `packages/shared/` - TypeScript types and utilities (must build first: `npm run build:shared`)
- `packages/server/` - Express + Socket.io backend with Prisma ORM (ESM, `"type": "module"`)
- `packages/client/` - React + Vite + Zustand frontend
- `android/` - Native Kotlin Android app with Jetpack Compose

### Key Server Directories
```
packages/server/src/
├── games/           # Game engines, GameManager, PlaylistManager
├── rooms/           # RoomManager (room lifecycle, 4-char codes)
├── socket/          # handlers.ts (all Socket.io message routing)
├── services/        # Business logic (auth, stats, leaderboard)
├── routes/          # REST API routes
├── middleware/       # Auth, error handling
└── db/              # Prisma client singleton
```

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

`BaseGameEngine` provides: timer management (`startTimer`, `startCountdownTimer`), score tracking (`addScore`), speed bonus calculation (`calculateSpeedScore` for 1.0-2.0x multipliers), round advancement (`nextRound`), event emission (`emit`, `emitGameState`).

To add a new game:
1. Create engine class extending `BaseGameEngine`
2. Register in `GameManager.ts` `GAME_ENGINES` map
3. Export from `games/index.ts`
4. Add types to `packages/shared/src/types/game.ts`

### Real-time Communication
- Server uses Socket.io (`packages/server/src/socket/handlers.ts` routes all messages)
- Messages follow typed protocol in `packages/shared/src/types/messages.ts`
- All messages go through a single `'message'` event with `{ type, payload }` structure
- Client messages: `create_room`, `join_room`, `game_action`, `moody_update`, etc.
- Server messages: `room_created`, `game_state`, `player_joined`, `timer_tick`, etc.
- 30-second disconnect grace period before removing players (reconnect via `reconnect` message)

### Client State Management
- Zustand store in `packages/client/src/store/gameStore.ts` manages all state
- Socket connection, room state, game state, and actions all in one store
- Game-specific React components in `packages/client/src/games/`

### Room & Playlist System
- `RoomManager` handles room lifecycle (create, join, leave, reconnect)
- Rooms identified by 4-character codes, host controls game start
- `PlaylistManager` chains multiple games with cumulative scoring
- Intermission screens between games show rankings and next game preview
- Socket events: `intermission`, `timer_tick`, `playlist_ended`

### Scoring System
- `calculateSpeedScore(base, timeLeftMs, maxTimeMs)` in `BaseGameEngine` for speed bonuses (1.0-2.0x)
- Quiz Champ: streak bonuses (+25 at 3 correct, +50 at 5+)
- Game-specific stats stored as JSON in `UserStats.gameSpecificStats`

### Database (Prisma + PostgreSQL)
Schema in `packages/server/prisma/schema.prisma`:
- `User` / `Session` - accounts (can be guests) and auth sessions
- `Moody` - avatar customization, XP, cosmetics, streaks
- `UserStats` - game statistics (with `gameSpecificStats` JSON field)
- `GameScore` - per-round scoring with base points and speed bonus
- `MonthlyScore` / `CrownHolder` - monthly leaderboard system
- `GameSession` / `GameParticipant` - game history
- `Achievement` / `UserAchievement` - achievement system

### Version Management
`version.json` at repo root is the single source of truth for app version. Used by Vite build (injected as `__APP_VERSION__`) and Android build (`versionName` in `build.gradle.kts`).

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
