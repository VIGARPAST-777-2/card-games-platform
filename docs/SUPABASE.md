# Supabase · Deckora

**Proyecto:** Deckora (`ntaioerwelnqurhgjdqq`)  
**URL:** `https://ntaioerwelnqurhgjdqq.supabase.co`

## Variables en Render (Environment)

| Key | Valor |
|-----|--------|
| `SUPABASE_URL` | `https://ntaioerwelnqurhgjdqq.supabase.co` |
| `SUPABASE_ANON_KEY` | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (**solo server**) |

Tras guardar → **Manual Deploy**.  
`/health` debe mostrar `"db":"connected"`.  
`/api/config` debe devolver `url` + `anonKey` (para login en el navegador).

## Auth

- Registro / login con email + contraseña (Supabase Auth)
- Trigger `handle_new_user` crea fila en `profiles` (500 monedas)

## Tablas

profiles (coins, gems, streaks, pass), player_ranks, match_*, cosmetics, friendships, clubs, club_members, store_items, coin_ledger, missions, profile_missions
