import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MatchManager } from './match/MatchManager.js';
import { getSupabase, isDbConfigured, pingDb } from './db/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: isProd ? false : true }));
app.use(express.json());

async function authProfile(req: express.Request) {
  const sb = getSupabase();
  if (!sb) return null;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  return profile;
}

app.get('/health', async (_req, res) => {
  const db = await pingDb();
  res.json({
    status: 'ok',
    service: 'deckora',
    ts: Date.now(),
    db: isDbConfigured() ? (db.ok ? 'connected' : `error: ${db.error}`) : 'not_configured',
  });
});

/** Público: URL + anon key para el cliente */
app.get('/api/config', (_req, res) => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(503).json({ error: 'Config incompleta' });
    return;
  }
  res.json({ url, anonKey });
});

app.post('/api/store/buy', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const sb = getSupabase()!;
    const itemId = req.body?.itemId as string;
    const { data: item } = await sb.from('store_items').select('*').eq('id', itemId).maybeSingle();
    if (!item || !item.active) {
      res.status(404).json({ error: 'Ítem no encontrado' });
      return;
    }
    if (item.price_coins > profile.coins || item.price_gems > (profile.gems ?? 0)) {
      res.status(400).json({ error: 'Saldo insuficiente' });
      return;
    }
    const newCoins = profile.coins - item.price_coins;
    const newGems = (profile.gems ?? 0) - item.price_gems;
    await sb.from('profiles').update({ coins: newCoins, gems: newGems }).eq('id', profile.id);
    await sb.from('coin_ledger').insert({
      profile_id: profile.id,
      amount: -item.price_coins,
      reason: `buy:${item.id}`,
    });
    if (item.cosmetic_id) {
      await sb.from('profile_cosmetics').upsert({
        profile_id: profile.id,
        cosmetic_id: item.cosmetic_id,
      });
    }
    if (item.kind === 'pass') {
      await sb.from('profiles').update({ season_pass_premium: true }).eq('id', profile.id);
    }
    if (item.kind === 'currency_pack') {
      const grant = item.payload?.coins ?? 1000;
      await sb
        .from('profiles')
        .update({ coins: newCoins + Number(grant) })
        .eq('id', profile.id);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/friends/request', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const sb = getSupabase()!;
    const username = String(req.body?.username ?? '').trim();
    const { data: other } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (!other) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (other.id === profile.id) {
      res.status(400).json({ error: 'No puedes añadirte a ti mismo' });
      return;
    }
    const { error } = await sb.from('friendships').insert({
      requester_id: profile.id,
      addressee_id: other.id,
      status: 'pending',
    });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/clubs', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const sb = getSupabase()!;
    const name = String(req.body?.name ?? '').trim();
    const tag = String(req.body?.tag ?? '').trim().toUpperCase().slice(0, 5);
    if (name.length < 3 || tag.length < 2) {
      res.status(400).json({ error: 'Nombre o tag inválido' });
      return;
    }
    const { data: club, error } = await sb
      .from('clubs')
      .insert({ name, tag, owner_id: profile.id })
      .select('id, name, tag, description')
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    await sb.from('club_members').insert({
      club_id: club.id,
      profile_id: profile.id,
      role: 'owner',
    });
    res.json({ club });
  } catch (e) {
    console.error(e);
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
  socket.on('action', (action) => matchManager.handleAction(socket, action));
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
    matchManager.handleDisconnect(socket);
  });
});

const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/health') || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

httpServer.listen(PORT, () => {
  console.log(`🃏 Deckora on :${PORT}`);
  console.log(`[db] ${isDbConfigured() ? 'ok' : 'missing env'}`);
});
