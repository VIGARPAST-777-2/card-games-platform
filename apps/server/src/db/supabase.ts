import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL =
  process.env.SUPABASE_URL || 'https://ntaioerwelnqurhgjdqq.supabase.co';

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno');
  }
  return key;
}

let client: SupabaseClient | null = null;

/** Único cliente: service_role. Sin anon. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(URL, serviceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function pingDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isDbConfigured()) {
      return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' };
    }
    const sb = getSupabase();
    const { error } = await sb.from('cosmetics').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' };
  }
}
