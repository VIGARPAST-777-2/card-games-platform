# Supabase + migraciones automáticas (método 3)

Cuando se suben archivos a `supabase/migrations/`, un **GitHub Action** aplica los cambios a tu proyecto Supabase.

Yo actualizo el SQL en el repo → al hacer push a `main` se aplica en la DB.

---

## 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto.
2. Anota el **Reference ID** (Settings → General → Reference ID).  
   Ejemplo: `abcdefghijklmnop`

---

## 2. Secrets en GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Dónde obtenerlo |
|--------|------------------|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) → Generate new token |
| `SUPABASE_PROJECT_ID` | Settings → General → **Reference ID** |
| `SUPABASE_DB_PASSWORD` | La contraseña de la base que elegiste al crear el proyecto (Database password) |

---

## 3. Lanzar migraciones

- **Automático:** cualquier push a `main` que toque `supabase/migrations/**`
- **Manual:** pestaña **Actions** → *Supabase Migrations* → *Run workflow*

Si los secrets no están, el workflow avisa y no rompe el deploy de la app.

---

## 4. Variables en Render (app)

Cuando el server use la DB, en Render añade:

| Key | Valor |
|-----|--------|
| `SUPABASE_URL` | Project URL (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (Settings → API) — **solo server, nunca en el frontend** |
| `DATABASE_URL` | (opcional) Connection string Postgres (Settings → Database) |

---

## 5. Flujo de trabajo con Grok

1. Me pides un cambio de esquema ("añade tabla de amigos").
2. Yo creo/edito un archivo en `supabase/migrations/YYYYMMDDHHMMSS_nombre.sql`.
3. Push a `main` → Action aplica el SQL en Supabase.
4. Si hace falta, actualizo el código del server en el mismo repo.

---

## Esquema inicial

Migración `20260828120000_init_deckora.sql`:

- `profiles` — usuarios / progreso
- `player_ranks` — MMR y tier por juego
- `match_history` + `match_players` — historial
- `cosmetics` + `profile_cosmetics` — cosméticos
- RLS activado (el server usará `service_role` al principio)

---

## Probar en local (opcional)

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_ID
supabase db push
```
