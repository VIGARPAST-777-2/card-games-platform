import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Valores públicos del proyecto Deckora (anon es segura en cliente/servidor con RLS) */
export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://ntaioerwelnqurhgjdqq.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YWlvZXJ3ZWxucXVyaGdqZHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzA4NzEsImV4cCI6MjEwMzUwNjg3MX0.pUldyhLR4eo-fOAzJtdPU3ksgMDE_2O4IjoRYNvRo1o';

/** service_role solo por env (nunca hardcodear en el repo) */
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client: SupabaseClient | null = null;

/**
 * Cliente del server.
 * Preferimos service_role si está en Render; si no, anon (RLS aplica).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const key = SERVICE_ROLE || SUPABASE_ANON_KEY;
    client = createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}

export function isDbConfigured(): boolean {
  return Boolean(SUPABASE_URL && (SERVICE_ROLE || SUPABASE_ANON_KEY));
}

export function usingServiceRole(): boolean {
  return Boolean(SERVICE_ROLE);
}

export async function pingDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('cosmetics').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' };
  }
}
