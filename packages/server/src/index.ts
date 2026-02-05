/**
 * PlayTogether Server - Haupteinstiegspunkt
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database
import { prisma, disconnectPrisma } from './db/prisma.js';

// Room Manager
import { RoomManager } from './rooms/RoomManager.js';

// Socket Handlers
import { setupSocketHandlers } from './socket/handlers.js';
import { socketAuth } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import moodyRoutes from './routes/moody.js';
import statsRoutes from './routes/stats.js';
import monthlyRoutes from './routes/monthly.js';

// Services
import { userService } from './services/UserService.js';
import { monthlyScoreService } from './services/MonthlyScoreService.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static files (APK download)
app.use('/download', express.static(path.join(__dirname, '../public')));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Room Manager initialisieren
const roomManager = new RoomManager();

// ===========================================
// REST API Routes
// ===========================================

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      database: 'disconnected',
    });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Moody routes
app.use('/api/moody', moodyRoutes);

// Stats routes
app.use('/api/stats', statsRoutes);

// Monthly leaderboard routes
app.use('/api/monthly', monthlyRoutes);

// Games list
app.get('/api/games', (_req, res) => {
  const { AVAILABLE_GAMES } = require('@playtogether/shared');
  res.json(AVAILABLE_GAMES);
});

// Room info
app.get('/api/room/:code', (req, res) => {
  const room = roomManager.getRoomByCode(req.params.code.toUpperCase());
  if (!room) {
    res.status(404).json({ error: 'Raum nicht gefunden' });
    return;
  }
  res.json({
    code: room.code,
    gameType: room.gameType,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers,
    status: room.status,
  });
});

// ===========================================
// Socket.io Setup
// ===========================================

// Socket authentication middleware
io.use(socketAuth);

// Setup socket handlers
setupSocketHandlers(io, roomManager);

// ===========================================
// Startup & Shutdown
// ===========================================

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Shutting down...');

  // Close socket connections
  io.close();

  // Close database connection
  await disconnectPrisma();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Periodic cleanup tasks
setInterval(async () => {
  try {
    // Clean up expired sessions
    const cleaned = await userService.cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Check for monthly reset (runs every hour, but only processes on the 1st)
let lastMonthlyResetCheck = '';
setInterval(async () => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Only process on the 1st of the month, and only once per month
    if (now.getDate() === 1 && lastMonthlyResetCheck !== currentMonth) {
      console.log('📅 Processing monthly highscore reset...');
      const result = await monthlyScoreService.processMonthlyReset();
      lastMonthlyResetCheck = currentMonth;

      if (result.winnerId) {
        console.log(`👑 Monthly winner: ${result.winnerUsername} with ${result.wins} wins!`);
      }
    }
  } catch (error) {
    console.error('Monthly reset error:', error);
  }
}, 60 * 60 * 1000); // Check every hour

// Server starten
httpServer.listen(PORT, () => {
  console.log(`🎮 PlayTogether Server läuft auf Port ${PORT}`);
  console.log(`📡 WebSocket bereit für Verbindungen`);
  console.log(`🔗 Client URL: ${CLIENT_URL}`);
  console.log(`💾 Database: PostgreSQL`);
});
