# Supabase (Deckora)

**Proyecto:** Deckora  
**Ref:** `ntaioerwelnqurhgjdqq`  
**URL:** `https://ntaioerwelnqurhgjdqq.supabase.co`  
**Región:** eu-west-1

El esquema se puede aplicar:
- desde **Grok (MCP Supabase)** con `apply_migration`
- o con GitHub Actions (`supabase/migrations/`)

---

## Variables en Render (obligatorias para la DB)

En el Web Service → **Environment**:

| Key | Valor |
|-----|--------|
| `SUPABASE_URL` | `https://ntaioerwelnqurhgjdqq.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Settings → API → `service_role`** (secret) |

> `service_role` **solo en el servidor**. No la pongas en el frontend ni en el chat.

Tras guardar, **Manual Deploy**.  
Comprueba: `https://TU-APP.onrender.com/health` → debe decir `"db": "connected"`.

---

## Tablas iniciales

- `profiles`
- `player_ranks`
- `match_history` / `match_players`
- `cosmetics` / `profile_cosmetics`

API de prueba del server: `GET /api/profile/:username` (crea perfil si no existe).

---

## Secrets opcionales (GitHub Actions)

Si quieres migraciones por push: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`.
Con MCP activo, Grok puede aplicar migraciones sin Action.
