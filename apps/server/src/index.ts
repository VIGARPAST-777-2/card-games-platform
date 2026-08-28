import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MatchManager } from './match/MatchManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

// En desarrollo permitimos cualquier origen; en producción mismo origen
app.use(
  cors({
    origin: isProd ? false : true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'deckora', ts: Date.now() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: isProd ? undefined : { origin: true },
  transports: ['websocket', 'polling'],
});

const matchManager = new MatchManager(io);

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`);

  socket.on('action', (action) => {
    matchManager.handleAction(socket, action);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
    matchManager.handleDisconnect(socket);
  });
});

// ── Servir el frontend (Vite build) ──────────────────────────────────────────
// En producción: apps/server/dist → ../../web/dist
const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath, { index: false }));

  // SPA fallback: cualquier ruta que no sea API/socket devuelve index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  console.log(`[static] sirviendo frontend desde ${webDistPath}`);
} else {
  console.warn(`[static] no se encontró ${webDistPath} — solo API/socket disponibles`);
}

httpServer.listen(PORT, () => {
  console.log(`🃏 Deckora listening on :${PORT} (${isProd ? 'production' : 'development'})`);
});
