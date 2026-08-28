import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MatchManager } from './match/MatchManager.js';
import { isDbConfigured, pingDb } from './db/supabase.js';
import { ensureProfile, listRanks } from './db/profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

app.use(
  cors({
    origin: isProd ? false : true,
  })
);
app.use(express.json());

app.get('/health', async (_req, res) => {
  const db = await pingDb();
  res.json({
    status: 'ok',
    service: 'deckora',
    ts: Date.now(),
    db: isDbConfigured() ? (db.ok ? 'connected' : `error: ${db.error}`) : 'not_configured',
  });
});

app.get('/api/profile/:username', async (req, res) => {
  try {
    const profile = await ensureProfile(req.params.username);
    if (!profile) {
      res.status(503).json({ error: 'Base de datos no disponible' });
      return;
    }
    const ranks = await listRanks(profile.id);
    res.json({ profile, ranks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
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

const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath, { index: false }));

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/api')
    ) {
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
  console.log(`[db] ${isDbConfigured() ? 'Supabase configurado' : 'Supabase NO configurado (falta env)'}`);
});
