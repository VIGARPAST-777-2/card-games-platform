import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Cliente admin del server (service_role).
 * Nunca uses esta key en el frontend.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  if (!client) {
    client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return client;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Health check simple contra la DB */
export async function pingDb(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, error: 'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados' };
  }

  const { error } = await sb.from('cosmetics').select('id').limit(1);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
