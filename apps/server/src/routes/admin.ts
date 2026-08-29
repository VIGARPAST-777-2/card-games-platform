import type { Express } from 'express';
import { getSupabase } from '../db/supabase.js';
import { authProfile, requireAdmin } from '../db/auth.js';

export function registerAdminRoutes(app: Express) {
  app.get('/api/admin/events', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile)) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    const { data } = await sb
      .from('platform_events')
      .select('id, slug, title_es, title_en, title_fr, active, reward_coins, reward_gems')
      .order('starts_at', { ascending: false });
    res.json(data ?? []);
  });

  app.post('/api/admin/events/toggle', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile)) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    await sb.from('platform_events').update({ active: Boolean(req.body?.active) }).eq('id', req.body?.id);
    res.json({ ok: true });
  });

  app.post('/api/admin/gift', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile)) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const { data: target } = await sb.from('profiles').select('*').eq('username', username).maybeSingle();
    if (!target) return res.status(404).json({ error: 'User not found' });
    const coins = Math.max(0, Number(req.body?.coins) || 0);
    const gems = Math.max(0, Number(req.body?.gems) || 0);
    const pass = Boolean(req.body?.pass);
    await sb
      .from('profiles')
      .update({
        coins: target.coins + coins,
        gems: (target.gems ?? 0) + gems,
        ...(pass ? { season_pass_premium: true } : {}),
      })
      .eq('id', target.id);
    if (coins) {
      await sb.from('coin_ledger').insert({
        profile_id: target.id,
        amount: coins,
        reason: 'admin_gift',
      });
    }
    await sb.from('notifications').insert({
      profile_id: target.id,
      kind: 'system',
      title: 'Recompensa de administracion',
      body: `Has recibido ${coins} monedas y ${gems} gemas`,
      href: '/profile',
    });
    res.json({ ok: true });
  });

  app.post('/api/admin/ban', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile)) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    if (username === 'vigarpast') return res.status(400).json({ error: 'Cannot ban admin' });
    const { data: target } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
    if (!target) return res.status(404).json({ error: 'User not found' });
    await sb
      .from('profiles')
      .update({
        is_banned: Boolean(req.body?.ban),
        ban_reason: req.body?.ban ? String(req.body?.reason ?? '') : null,
      })
      .eq('id', target.id);
    res.json({ ok: true });
  });

  app.post('/api/admin/giveaway', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile) || !profile) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    const { data, error } = await sb
      .from('giveaways')
      .insert({
        title: String(req.body?.title ?? 'Giveaway'),
        reward_type: req.body?.reward_type ?? 'coins',
        reward_amount: Number(req.body?.reward_amount) || 100,
        created_by: profile.id,
        status: 'open',
      })
      .select('id')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, id: data.id });
  });

  app.post('/api/admin/giveaway/:id/draw', async (req, res) => {
    const profile = await authProfile(req);
    if (!requireAdmin(profile)) return res.status(403).json({ error: 'Forbidden' });
    const sb = getSupabase();
    const { data: entries } = await sb
      .from('giveaway_entries')
      .select('profile_id')
      .eq('giveaway_id', req.params.id);
    if (!entries?.length) {
      // if no entries, pick random profile as demo
      const { data: anyP } = await sb.from('profiles').select('id, username').limit(20);
      if (!anyP?.length) return res.status(400).json({ error: 'No players' });
      const winner = anyP[Math.floor(Math.random() * anyP.length)];
      const { data: g } = await sb.from('giveaways').select('*').eq('id', req.params.id).maybeSingle();
      if (g) {
        await sb
          .from('giveaways')
          .update({ status: 'drawn', winner_id: winner.id, drawn_at: new Date().toISOString() })
          .eq('id', g.id);
        if (g.reward_type === 'coins') {
          const { data: p } = await sb.from('profiles').select('coins').eq('id', winner.id).single();
          await sb.from('profiles').update({ coins: (p?.coins ?? 0) + g.reward_amount }).eq('id', winner.id);
        }
      }
      return res.json({ ok: true, winner: winner.username });
    }
    const pick = entries[Math.floor(Math.random() * entries.length)];
    const { data: w } = await sb.from('profiles').select('username, coins').eq('id', pick.profile_id).single();
    const { data: g } = await sb.from('giveaways').select('*').eq('id', req.params.id).single();
    await sb
      .from('giveaways')
      .update({ status: 'drawn', winner_id: pick.profile_id, drawn_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (g?.reward_type === 'coins' && w) {
      await sb.from('profiles').update({ coins: w.coins + g.reward_amount }).eq('id', pick.profile_id);
    }
    res.json({ ok: true, winner: w?.username });
  });
}
