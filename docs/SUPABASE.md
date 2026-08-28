# Supabase + Render

Proyecto **Deckora** · `ntaioerwelnqurhgjdqq`  
URL: `https://ntaioerwelnqurhgjdqq.supabase.co`

## Qué poner en Render (Environment)

| Variable | Dónde está en Supabase |
|----------|------------------------|
| `SUPABASE_URL` | `https://ntaioerwelnqurhgjdqq.supabase.co` |
| `SUPABASE_ANON_KEY` | **Settings → API →** clave `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Settings → API →** `service_role` (secreta, solo backend) |

Sin estas tres el login y la DB no funcionan en producción.

Grok **sí** puede editar el esquema por MCP.  
Grok **no** puede escribir las keys en Render: tienes que pegarlas tú una vez.

## Funciones de plataforma

Auth, perfiles, monedas, tienda, amigos, clubes, chat (DM + club), notificaciones, apuestas (solo monedas de juego), pase y misiones.
