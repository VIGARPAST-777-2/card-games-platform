import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MatchManager } from './match/MatchManager.js';
import { getSupabase, isDbConfigured, pingDb } from './db/supabase.js';
import { authProfile } from './db/auth.js';
import { registerAdminRoutes } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: isProd ? false : true }));
app.use(express.json({ limit: '600kb' }));

app.get('/health', async (_req, res) => {
  const db = await pingDb();
  res.json({
    status: 'ok',
    service: 'deckora-poker',
    ts: Date.now(),
    db: db.ok ? 'connected' : `error: ${db.error}`,
    mode: 'service_role_only',
  });
});

async function fetchProfile(authUserId: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('profiles')
    .select(
      'id, username, avatar_url, level, xp, wins, losses, games_played, coins, gems, current_streak, best_streak, season_pass_xp, season_pass_premium, title, is_admin, is_banned, language'
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (data && data.username?.toLowerCase() === 'vigarpast') {
    data.is_admin = true;
  }
  return data;
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!isDbConfigured()) return res.status(503).json({ error: 'DB no configurada' });
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    if (!email || password.length < 6 || username.length < 3) {
      return res.status(400).json({ error: 'Email, password (>=6) and username (>=3) required' });
    }
    const sb = getSupabase();
    const { data: existing } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) return res.status(400).json({ error: error.message });
    if (!data.user) return res.status(500).json({ error: 'User not created' });

    const isAdmin = username === 'vigarpast';
    await sb.from('profiles').upsert(
      {
        auth_user_id: data.user.id,
        username,
        coins: 500,
        gems: 0,
        is_admin: isAdmin,
      },
      { onConflict: 'auth_user_id' }
    );

    const login = await sb.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.session) {
      return res.json({ ok: true, message: 'Account created. Sign in.' });
    }
    const profile = await fetchProfile(data.user.id);
    res.json({
      access_token: login.data.session.access_token,
      refresh_token: login.data.session.refresh_token,
      expires_at: login.data.session.expires_at,
      user: { id: data.user.id, email },
      profile,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!isDbConfigured()) return res.status(503).json({ error: 'DB no configurada' });
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const sb = getSupabase();
    let { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error && /confirm|verified|email/i.test(error.message)) {
      const { data: listed } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = listed?.users?.find((u) => u.email?.toLowerCase() === email);
      if (found) {
        await sb.auth.admin.updateUserById(found.id, { email_confirm: true });
        const retry = await sb.auth.signInWithPassword({ email, password });
        data = retry.data;
        error = retry.error;
      }
    }
    if (error || !data?.session || !data.user) {
      return res.status(401).json({ error: error?.message ?? 'Login failed' });
    }
    const profile = await fetchProfile(data.user.id);
    if (profile && (profile as { is_banned?: boolean }).is_banned) {
      return res.status(403).json({ error: 'Banned' });
    }
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email },
      profile,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const { auth_user_id, ...safe } = profile;
    res.json({ user: { id: auth_user_id }, profile: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/api/auth/logout', async (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/profile/avatar', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const dataUrl = String(req.body?.dataUrl ?? '');
    if (!dataUrl.startsWith('data:image/') || dataUrl.length > 550_000) {
      return res.status(400).json({ error: 'Invalid image (max ~400KB)' });
    }
    const sb = getSupabase();
    await sb.from('profiles').update({ avatar_url: dataUrl }).eq('id', profile.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

registerAdminRoutes(app);

app.post('/api/store/buy', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const itemId = req.body?.itemId as string;
    const { data: item } = await sb.from('store_items').select('*').eq('id', itemId).maybeSingle();
    if (!item?.active) return res.status(404).json({ error: 'Not found' });
    if (item.price_coins > profile.coins || item.price_gems > (profile.gems ?? 0)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    let newCoins = profile.coins - item.price_coins;
    const newGems = (profile.gems ?? 0) - item.price_gems;
    if (item.kind === 'currency_pack') newCoins += Number(item.payload?.coins ?? 1000);
    await sb.from('profiles').update({
      coins: newCoins,
      gems: newGems,
      ...(item.kind === 'pass' ? { season_pass_premium: true } : {}),
    }).eq('id', profile.id);
    await sb.from('coin_ledger').insert({
      profile_id: profile.id,
      amount: -item.price_coins,
      reason: `buy:${item.id}`,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/store/items', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data } = await sb.from('store_items').select('*').eq('active', true);
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/api/friends/request', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const { data: other } = await sb.from('profiles').select('id, username').eq('username', username).maybeSingle();
    if (!other) return res.status(404).json({ error: 'User not found' });
    if (other.id === profile.id) return res.status(400).json({ error: 'Invalid' });
    const { error } = await sb.from('friendships').insert({
      requester_id: profile.id,
      addressee_id: other.id,
      status: 'pending',
    });
    if (error) return res.status(400).json({ error: error.message });
    await sb.from('notifications').insert({
      profile_id: other.id,
      kind: 'friend_request',
      title: 'Friend request',
      body: `${profile.username}`,
      href: '/friends',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/friends', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const { data } = await sb
      .from('friendships')
      .select('id, status, requester_id, addressee_id')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/api/clubs', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const name = String(req.body?.name ?? '').trim();
    const tag = String(req.body?.tag ?? '').trim().toUpperCase().slice(0, 5);
    if (name.length < 3 || tag.length < 2) return res.status(400).json({ error: 'Invalid' });
    const { data: club, error } = await sb
      .from('clubs')
      .insert({ name, tag, owner_id: profile.id })
      .select('id, name, tag, description')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    await sb.from('club_members').insert({ club_id: club.id, profile_id: profile.id, role: 'owner' });
    const { data: thread } = await sb.from('chat_threads').insert({ kind: 'club', club_id: club.id }).select('id').single();
    if (thread) await sb.from('chat_participants').insert({ thread_id: thread.id, profile_id: profile.id });
    res.json({ club });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const { data } = await sb
      .from('notifications')
      .select('id, kind, title, body, href, read, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/chat/threads', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const { data: parts } = await sb.from('chat_participants').select('thread_id').eq('profile_id', profile.id);
    const ids = (parts ?? []).map((p) => p.thread_id);
    if (!ids.length) return res.json([]);
    const { data: threads } = await sb.from('chat_threads').select('id, kind, club_id').in('id', ids);
    const out = [];
    for (const th of threads ?? []) {
      let label = th.kind;
      if (th.kind === 'club' && th.club_id) {
        const { data: c } = await sb.from('clubs').select('name, tag').eq('id', th.club_id).maybeSingle();
        label = c ? `${c.tag} ${c.name}` : 'Club';
      } else {
        const { data: others } = await sb
          .from('chat_participants')
          .select('profile_id')
          .eq('thread_id', th.id)
          .neq('profile_id', profile.id);
        if (others?.[0]) {
          const { data: p } = await sb.from('profiles').select('username').eq('id', others[0].profile_id).maybeSingle();
          label = p?.username ?? 'DM';
        }
      }
      out.push({ id: th.id, kind: th.kind, label });
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/api/chat/dm', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const { data: other } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (!other) return res.status(404).json({ error: 'User not found' });
    const { data: thread } = await sb.from('chat_threads').insert({ kind: 'dm' }).select('id').single();
    if (!thread) return res.status(500).json({ error: 'Error' });
    await sb.from('chat_participants').insert([
      { thread_id: thread.id, profile_id: profile.id },
      { thread_id: thread.id, profile_id: other.id },
    ]);
    res.json({ threadId: thread.id });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/chat/threads/:id/messages', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const { data: part } = await sb
      .from('chat_participants')
      .select('thread_id')
      .eq('thread_id', req.params.id)
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (!part) return res.status(403).json({ error: 'Forbidden' });
    const { data } = await sb
      .from('chat_messages')
      .select('id, body, sender_id, created_at')
      .eq('thread_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100);
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/api/chat/threads/:id/messages', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const sb = getSupabase();
    const body = String(req.body?.body ?? '').trim().slice(0, 2000);
    if (!body) return res.status(400).json({ error: 'Empty' });
    const { data: part } = await sb
      .from('chat_participants')
      .select('thread_id')
      .eq('thread_id', req.params.id)
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (!part) return res.status(403).json({ error: 'Forbidden' });
    await sb.from('chat_messages').insert({ thread_id: req.params.id, sender_id: profile.id, body });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: isProd ? undefined : { origin: true },
  transports: ['websocket', 'polling'],
});
const matchManager = new MatchManager(io);

io.on('connection', (socket) => {
  socket.on('action', (action) => matchManager.handleAction(socket, action));
  socket.on('disconnect', () => matchManager.handleDisconnect(socket));
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
  console.log(`Deckora Poker on :${PORT}`);
  console.log(`[db] ${isDbConfigured() ? 'service_role' : 'MISSING SERVICE_ROLE_KEY'}`);
});
