import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseRuntime {
  client: SupabaseClient | null;
}

const runtimeHost = globalThis as typeof globalThis & {
  __portfolioSupabaseRuntime?: SupabaseRuntime;
};

const runtime: SupabaseRuntime = (runtimeHost.__portfolioSupabaseRuntime ??= {
  client: null
});

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = Boolean(url?.trim());
  const hasKey = Boolean(serviceRoleKey?.trim());

  if (hasUrl !== hasKey) {
    return false;
  }
  return hasUrl && hasKey;
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Konfigurasi Supabase belum tersedia.");
  }
  if (runtime.client) return runtime.client;

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diatur.");
  }

  runtime.client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
  return runtime.client;
}
