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
import fs from 'fs';
import crypto from 'crypto';

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
import achievementRoutes from './routes/achievements.js';
import friendRoutes from './routes/friends.js';

// Services
import { userService } from './services/UserService.js';
import { monthlyScoreService } from './services/MonthlyScoreService.js';

const PORT = process.env.PORT || 3300;
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
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Generous timeouts for mobile connections
  pingTimeout: 60000,    // 60s before considering connection dead (default: 20s)
  pingInterval: 25000,   // 25s between pings
  // Allow both transports
  transports: ['websocket', 'polling'],
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

// Achievement routes
app.use('/api/achievements', achievementRoutes);

// Friend routes
app.use('/api/friends', friendRoutes);

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

// APK Info endpoint
app.get('/api/apk-info', (_req, res) => {
  const apkPath = path.join(__dirname, '../public/downloads/playtogether.apk');

  if (!fs.existsSync(apkPath)) {
    res.status(404).json({ error: 'APK nicht gefunden' });
    return;
  }

  const stats = fs.statSync(apkPath);
  const fileBuffer = fs.readFileSync(apkPath);
  const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  res.json({
    version: '2.0.0',
    versionCode: 3,
    filename: 'playtogether.apk',
    size: stats.size,
    sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
    modified: stats.mtime.toISOString(),
    md5: md5Hash,
    sha256: sha256Hash,
    serverUrl: CLIENT_URL,
  });
});

// Download page
app.get('/download', (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlayTogether - Android App Download</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e4e4e4;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      padding: 30px;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 { text-align: center; margin-bottom: 10px; font-size: 28px; }
    .emoji { font-size: 48px; text-align: center; display: block; margin-bottom: 20px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 30px; }
    .info-box {
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .info-row:last-child { border-bottom: none; }
    .label { color: #888; }
    .value { font-family: monospace; word-break: break-all; text-align: right; max-width: 60%; }
    .hash { font-size: 11px; }
    .download-btn {
      display: block;
      width: 100%;
      padding: 16px;
      background: #4CAF50;
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      margin-top: 20px;
    }
    .download-btn:hover { background: #45a049; }
    .loading { text-align: center; padding: 40px; }
    .error { color: #ff6b6b; text-align: center; padding: 20px; }
    .refresh-btn {
      display: block;
      width: 100%;
      padding: 12px;
      background: transparent;
      color: #888;
      border: 1px solid #888;
      border-radius: 8px;
      margin-top: 10px;
      cursor: pointer;
    }
    .refresh-btn:hover { background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <span class="emoji">🎮</span>
    <h1>PlayTogether</h1>
    <p class="subtitle">Android App Download</p>

    <div id="content">
      <div class="loading">Lade Informationen...</div>
    </div>
  </div>

  <script>
    async function loadInfo() {
      try {
        const res = await fetch('/api/apk-info?t=' + Date.now());
        if (!res.ok) throw new Error('APK nicht gefunden');
        const info = await res.json();

        document.getElementById('content').innerHTML = \`
          <div class="info-box">
            <div class="info-row">
              <span class="label">Version</span>
              <span class="value">\${info.version} (\${info.versionCode})</span>
            </div>
            <div class="info-row">
              <span class="label">Größe</span>
              <span class="value">\${info.sizeFormatted}</span>
            </div>
            <div class="info-row">
              <span class="label">Geändert</span>
              <span class="value">\${new Date(info.modified).toLocaleString('de-DE')}</span>
            </div>
            <div class="info-row">
              <span class="label">Server URL</span>
              <span class="value">\${info.serverUrl}</span>
            </div>
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="label">MD5</span>
              <span class="value hash">\${info.md5}</span>
            </div>
            <div class="info-row">
              <span class="label">SHA256</span>
              <span class="value hash">\${info.sha256}</span>
            </div>
          </div>

          <a href="/download/downloads/playtogether.apk?t=\${Date.now()}" class="download-btn">
            ⬇️ APK Herunterladen
          </a>
          <button class="refresh-btn" onclick="location.reload()">🔄 Aktualisieren</button>
        \`;
      } catch (e) {
        document.getElementById('content').innerHTML = \`
          <div class="error">Fehler: \${e.message}</div>
          <button class="refresh-btn" onclick="location.reload()">🔄 Erneut versuchen</button>
        \`;
      }
    }
    loadInfo();
  </script>
</body>
</html>`;
  res.send(html);
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
