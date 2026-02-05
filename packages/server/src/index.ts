/**
 * PlayTogether Server - Haupteinstiegspunkt
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager.js';
import { setupSocketHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Room Manager initialisieren
const roomManager = new RoomManager();

// REST API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/games', (_req, res) => {
  const { AVAILABLE_GAMES } = require('@playtogether/shared');
  res.json(AVAILABLE_GAMES);
});

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

// Socket.io Setup
setupSocketHandlers(io, roomManager);

// Server starten
httpServer.listen(PORT, () => {
  console.log(`🎮 PlayTogether Server läuft auf Port ${PORT}`);
  console.log(`📡 WebSocket bereit für Verbindungen`);
});
