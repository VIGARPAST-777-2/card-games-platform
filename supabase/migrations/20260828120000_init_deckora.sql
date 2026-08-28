-- Deckora initial schema
-- Aplicada automáticamente por GitHub Actions (supabase db push)

-- Extensiones útiles
create extension if not exists "pgcrypto";

-- ── Perfiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,  -- enlazar con auth.users cuando actives Auth
  username      text not null unique,
  avatar_url    text,
  level         integer not null default 1 check (level >= 1),
  xp            integer not null default 0 check (xp >= 0),
  wins          integer not null default 0,
  losses        integer not null default 0,
  games_played  integer not null default 0,
  max_streak    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- ── Rangos por juego ───────────────────────────────────────────────────────
create table if not exists public.player_ranks (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  game_id     text not null,  -- poker | blackjack | rummy | hearts | spades | tute | mus
  mmr         integer not null default 1000,
  tier        text not null default 'bronze',
  division    integer not null default 3 check (division between 1 and 3),
  updated_at  timestamptz not null default now(),
  unique (profile_id, game_id)
);

create index if not exists player_ranks_game_mmr_idx
  on public.player_ranks (game_id, mmr desc);

-- ── Historial de partidas ──────────────────────────────────────────────────
create table if not exists public.match_history (
  id            uuid primary key default gen_random_uuid(),
  match_id      text not null,
  game_id       text not null,
  mode          text not null,  -- bot | quick | friendly | private | ranked
  ranked        boolean not null default false,
  finished_at   timestamptz not null default now(),
  metadata      jsonb not null default '{}'::jsonb
);

create index if not exists match_history_finished_idx
  on public.match_history (finished_at desc);

create table if not exists public.match_players (
  id            uuid primary key default gen_random_uuid(),
  match_row_id  uuid not null references public.match_history (id) on delete cascade,
  profile_id    uuid references public.profiles (id) on delete set null,
  username      text not null,
  seat          integer not null default 0,
  is_bot        boolean not null default false,
  placement     integer,  -- 1 = ganador, etc.
  score         integer,
  mmr_delta     integer
);

create index if not exists match_players_profile_idx
  on public.match_players (profile_id);

-- ── Cosméticos ─────────────────────────────────────────────────────────────
create table if not exists public.cosmetics (
  id          text primary key,  -- ej. cardback_classic
  kind        text not null,     -- card_back | table | avatar_frame | title | effect
  name        text not null,
  rarity      text not null default 'common',
  unlock_xp   integer default 0
);

create table if not exists public.profile_cosmetics (
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  cosmetic_id  text not null references public.cosmetics (id) on delete cascade,
  equipped     boolean not null default false,
  unlocked_at  timestamptz not null default now(),
  primary key (profile_id, cosmetic_id)
);

-- ── updated_at automático ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists player_ranks_updated_at on public.player_ranks;
create trigger player_ranks_updated_at
  before update on public.player_ranks
  for each row execute function public.set_updated_at();

-- ── RLS (básico; se refinará con Auth) ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.player_ranks enable row level security;
alter table public.match_history enable row level security;
alter table public.match_players enable row level security;
alter table public.cosmetics enable row level security;
alter table public.profile_cosmetics enable row level security;

-- Lectura pública de cosméticos del catálogo
drop policy if exists cosmetics_read on public.cosmetics;
create policy cosmetics_read on public.cosmetics
  for select using (true);

-- Por ahora el server usará service_role (bypass RLS).
-- Cuando haya Auth, añadiremos policies por auth.uid().
