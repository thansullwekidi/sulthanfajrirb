import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/server/db/supabase";
import { readDatabase } from "@/server/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseConfigured: false,
    envVars: {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      STUDIO_SESSION_SECRET: Boolean(process.env.STUDIO_SESSION_SECRET),
      STUDIO_ADMIN_PASSPHRASE: Boolean(process.env.STUDIO_ADMIN_PASSPHRASE),
      NODE_ENV: process.env.NODE_ENV,
    },
    dbTest: null as unknown,
    dbError: null as unknown,
  };

  try {
    result.supabaseConfigured = isSupabaseConfigured();
  } catch (e) {
    result.supabaseConfigured = `ERROR: ${(e as Error).message}`;
  }

  try {
    const db = await readDatabase();
    result.dbTest = {
      ok: true,
      experienceCount: db.experiences?.length ?? 0,
      skillCount: db.skills?.length ?? 0,
    };
  } catch (e) {
    result.dbError = (e as Error).message;
  }

  return NextResponse.json(result);
}
