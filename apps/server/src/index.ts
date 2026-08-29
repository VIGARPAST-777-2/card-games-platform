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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: isProd ? false : true }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  const db = await pingDb();
  res.json({
    status: 'ok',
    service: 'deckora',
    ts: Date.now(),
    db: db.ok ? 'connected' : `error: ${db.error}`,
    mode: 'service_role_only',
  });
});

/** Perfil público (sin auth_user_id) */
async function fetchProfile(authUserId: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('profiles')
    .select(
      'id, username, avatar_url, level, xp, wins, losses, games_played, coins, gems, current_streak, best_streak, season_pass_xp, season_pass_premium, title'
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data;
}

// ── Auth: sin verificación de email (email_confirm automático) ────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!isDbConfigured()) return res.status(503).json({ error: 'DB no configurada' });
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    if (!email || password.length < 6 || username.length < 3) {
      return res.status(400).json({ error: 'Email, contraseña (≥6) y usuario (≥3) requeridos' });
    }
    const sb = getSupabase();
    const { data: existing } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Usuario ya existe' });

    // email_confirm: true → no hace falta verificar correo
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) return res.status(400).json({ error: error.message });
    if (!data.user) return res.status(500).json({ error: 'No se creó el usuario' });

    await sb.from('profiles').upsert(
      {
        auth_user_id: data.user.id,
        username,
        coins: 500,
        gems: 0,
      },
      { onConflict: 'auth_user_id' }
    );

    const login = await sb.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.session) {
      return res.json({ ok: true, message: 'Cuenta creada. Inicia sesión.' });
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
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error interno' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!isDbConfigured()) return res.status(503).json({ error: 'DB no configurada' });
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const sb = getSupabase();

    let { data, error } = await sb.auth.signInWithPassword({ email, password });

    // Si el proyecto aún exige confirmación: confirmamos y reintentamos
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
      return res.status(401).json({ error: error?.message ?? 'Login fallido' });
    }

    const profile = await fetchProfile(data.user.id);
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email },
      profile,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const { auth_user_id, ...safe } = profile;
    res.json({
      user: { id: auth_user_id },
      profile: safe,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/auth/logout', async (_req, res) => {
  // El cliente borra el token local; no hace falta invalidar en servidor
  res.json({ ok: true });
});

// ── Tienda ───────────────────────────────────────────────────────────────────
app.post('/api/store/buy', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const itemId = req.body?.itemId as string;
    const { data: item } = await sb.from('store_items').select('*').eq('id', itemId).maybeSingle();
    if (!item?.active) return res.status(404).json({ error: 'Ítem no encontrado' });
    if (item.price_coins > profile.coins || item.price_gems > (profile.gems ?? 0)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
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
    if (item.cosmetic_id) {
      await sb.from('profile_cosmetics').upsert({
        profile_id: profile.id,
        cosmetic_id: item.cosmetic_id,
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/store/items', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data } = await sb.from('store_items').select('*').eq('active', true);
    res.json(data ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Amigos ───────────────────────────────────────────────────────────────────
app.post('/api/friends/request', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim();
    const { data: other } = await sb.from('profiles').select('id, username').eq('username', username).maybeSingle();
    if (!other) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (other.id === profile.id) return res.status(400).json({ error: 'No puedes añadirte a ti mismo' });
    const { error } = await sb.from('friendships').insert({
      requester_id: profile.id,
      addressee_id: other.id,
      status: 'pending',
    });
    if (error) return res.status(400).json({ error: error.message });
    await sb.from('notifications').insert({
      profile_id: other.id,
      kind: 'friend_request',
      title: 'Nueva solicitud de amistad',
      body: `${profile.username} quiere ser tu amigo`,
      href: '/friends',
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/friends', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const { data } = await sb
      .from('friendships')
      .select('id, status, requester_id, addressee_id')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
    res.json(data ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Clubes ───────────────────────────────────────────────────────────────────
app.post('/api/clubs', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const name = String(req.body?.name ?? '').trim();
    const tag = String(req.body?.tag ?? '').trim().toUpperCase().slice(0, 5);
    if (name.length < 3 || tag.length < 2) return res.status(400).json({ error: 'Nombre o tag inválido' });
    const { data: club, error } = await sb
      .from('clubs')
      .insert({ name, tag, owner_id: profile.id })
      .select('id, name, tag, description')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    await sb.from('club_members').insert({ club_id: club.id, profile_id: profile.id, role: 'owner' });
    const { data: thread } = await sb.from('chat_threads').insert({ kind: 'club', club_id: club.id }).select('id').single();
    if (thread) {
      await sb.from('chat_participants').insert({ thread_id: thread.id, profile_id: profile.id });
    }
    res.json({ club });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Notificaciones ───────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const { data } = await sb
      .from('notifications')
      .select('id, kind, title, body, href, read, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Chat ─────────────────────────────────────────────────────────────────────
app.get('/api/chat/threads', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
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
        } else label = 'DM';
      }
      out.push({ id: th.id, kind: th.kind, label });
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/chat/dm', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim();
    const { data: other } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (!other) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { data: thread } = await sb.from('chat_threads').insert({ kind: 'dm' }).select('id').single();
    if (!thread) return res.status(500).json({ error: 'No se pudo crear el chat' });
    await sb.from('chat_participants').insert([
      { thread_id: thread.id, profile_id: profile.id },
      { thread_id: thread.id, profile_id: other.id },
    ]);
    await sb.from('notifications').insert({
      profile_id: other.id,
      kind: 'chat',
      title: 'Nuevo chat',
      body: `${profile.username} te ha escrito`,
      href: '/chat',
    });
    res.json({ threadId: thread.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/chat/threads/:id/messages', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const { data: part } = await sb
      .from('chat_participants')
      .select('thread_id')
      .eq('thread_id', req.params.id)
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (!part) return res.status(403).json({ error: 'Sin acceso' });
    const { data } = await sb
      .from('chat_messages')
      .select('id, body, sender_id, created_at')
      .eq('thread_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100);
    res.json(data ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/chat/threads/:id/messages', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const body = String(req.body?.body ?? '').trim().slice(0, 2000);
    if (!body) return res.status(400).json({ error: 'Mensaje vacío' });
    const { data: part } = await sb
      .from('chat_participants')
      .select('thread_id')
      .eq('thread_id', req.params.id)
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (!part) return res.status(403).json({ error: 'Sin acceso' });
    const { error } = await sb.from('chat_messages').insert({
      thread_id: req.params.id,
      sender_id: profile.id,
      body,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Apuestas ─────────────────────────────────────────────────────────────────
app.get('/api/bets', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const { data } = await sb
      .from('bets')
      .select('id, amount, status, note, creator_id, opponent_id, created_at')
      .or(`creator_id.eq.${profile.id},opponent_id.eq.${profile.id},status.eq.open`)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/bets', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const amount = Math.floor(Number(req.body?.amount));
    if (!amount || amount < 10) return res.status(400).json({ error: 'Mínimo 10 monedas' });
    if (amount > profile.coins) return res.status(400).json({ error: 'Saldo insuficiente' });
    let opponentId: string | null = null;
    const uname = req.body?.opponentUsername;
    if (uname) {
      const { data: other } = await sb.from('profiles').select('id').eq('username', String(uname).trim()).maybeSingle();
      if (!other) return res.status(404).json({ error: 'Rival no encontrado' });
      opponentId = other.id;
      await sb.from('notifications').insert({
        profile_id: other.id,
        kind: 'bet',
        title: 'Nueva apuesta',
        body: `${profile.username} te desafía por ${amount} monedas`,
        href: '/bets',
      });
    }
    await sb.from('profiles').update({ coins: profile.coins - amount }).eq('id', profile.id);
    await sb.from('coin_ledger').insert({ profile_id: profile.id, amount: -amount, reason: 'bet_lock' });
    const { data: bet, error } = await sb
      .from('bets')
      .insert({
        creator_id: profile.id,
        opponent_id: opponentId,
        amount,
        note: req.body?.note ? String(req.body.note).slice(0, 200) : null,
        status: 'open',
      })
      .select('id')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, id: bet.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/bets/:id/accept', async (req, res) => {
  try {
    const profile = await authProfile(req);
    if (!profile) return res.status(401).json({ error: 'No autenticado' });
    const sb = getSupabase();
    const { data: bet } = await sb.from('bets').select('*').eq('id', req.params.id).maybeSingle();
    if (!bet || bet.status !== 'open') return res.status(400).json({ error: 'Apuesta no disponible' });
    if (bet.creator_id === profile.id) return res.status(400).json({ error: 'No puedes aceptar la tuya' });
    if (profile.coins < bet.amount) return res.status(400).json({ error: 'Saldo insuficiente' });
    await sb.from('profiles').update({ coins: profile.coins - bet.amount }).eq('id', profile.id);
    await sb.from('coin_ledger').insert({ profile_id: profile.id, amount: -bet.amount, reason: 'bet_lock' });
    await sb.from('bets').update({ status: 'accepted', opponent_id: profile.id }).eq('id', bet.id);
    await sb.from('notifications').insert({
      profile_id: bet.creator_id,
      kind: 'bet',
      title: 'Apuesta aceptada',
      body: `${profile.username} aceptó tu apuesta de ${bet.amount} monedas`,
      href: '/bets',
    });
    res.json({ ok: true });
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
  console.log(`🃏 Deckora on :${PORT}`);
  console.log(`[db] ${isDbConfigured() ? 'service_role' : 'MISSING SERVICE_ROLE_KEY'}`);
});
