import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseClient } from "@/server/db/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.SUPABASE_URL ?? "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseConfigured: false,
    envVars: {
      SUPABASE_URL_set: Boolean(rawUrl),
      SUPABASE_URL_length: rawUrl.length,
      SUPABASE_URL_firstChars: rawUrl.slice(0, 40),
      SUPABASE_URL_lastChars: rawUrl.slice(-10),
      SUPABASE_URL_hasNewline: rawUrl.includes("\n") || rawUrl.includes("\r"),
      SUPABASE_URL_hasSpace: rawUrl.includes(" "),
      SUPABASE_KEY_set: Boolean(rawKey),
      SUPABASE_KEY_length: rawKey.length,
      SUPABASE_KEY_firstChars: rawKey.slice(0, 15),
      STUDIO_SESSION_SECRET: Boolean(process.env.STUDIO_SESSION_SECRET),
      STUDIO_ADMIN_PASSPHRASE: Boolean(process.env.STUDIO_ADMIN_PASSPHRASE),
      NODE_ENV: process.env.NODE_ENV,
    },
    rpcTest: null as unknown,
    rpcError: null as unknown,
  };

  try {
    result.supabaseConfigured = isSupabaseConfigured();
  } catch (e) {
    result.supabaseConfigured = `ERROR: ${(e as Error).message}`;
  }

  if (result.supabaseConfigured === true) {
    try {
      const { data, error } = await getSupabaseClient().rpc("portfolio_read");
      if (error) {
        result.rpcError = error.message;
      } else {
        const rows = data as Array<{ revision: number }> | null;
        result.rpcTest = { ok: true, revision: rows?.[0]?.revision ?? null };
      }
    } catch (e) {
      result.rpcError = (e as Error).message;
    }
  }

  return NextResponse.json(result);
}
