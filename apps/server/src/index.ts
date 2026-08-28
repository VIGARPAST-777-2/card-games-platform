import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MatchManager } from './match/MatchManager.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'deckora-server', ts: Date.now() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true },
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

httpServer.listen(PORT, () => {
  console.log(`🃏 Deckora server listening on :${PORT}`);
});
