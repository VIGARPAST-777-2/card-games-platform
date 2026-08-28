import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

async function loadConfig(): Promise<{ url: string; anonKey: string } | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    return res.json();
  } catch {
    // Dev fallback
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && anonKey) return { url, anonKey };
    return null;
  }
}

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (client) return client;
  if (!initPromise) {
    initPromise = (async () => {
      const cfg = await loadConfig();
      if (!cfg) return null;
      client = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return client;
    })();
  }
  return initPromise;
}
