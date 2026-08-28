import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Proyecto Deckora — anon key es pública por diseño */
const DEFAULT_URL = 'https://ntaioerwelnqurhgjdqq.supabase.co';
const DEFAULT_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YWlvZXJ3ZWxucXVyaGdqZHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzA4NzEsImV4cCI6MjEwMzUwNjg3MX0.pUldyhLR4eo-fOAzJtdPU3ksgMDE_2O4IjoRYNvRo1o';

let client: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function loadConfig(): Promise<{ url: string; anonKey: string }> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.anonKey) return data;
    }
  } catch {
    /* ignore */
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON,
  };
}

export async function getSupabase(): Promise<SupabaseClient> {
  if (client) return client;
  if (!initPromise) {
    initPromise = (async () => {
      const cfg = await loadConfig();
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
