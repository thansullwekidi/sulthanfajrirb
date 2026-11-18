import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/services/auth.service";
import { getSupabaseClient, isSupabaseConfigured } from "@/server/db/supabase";
import { readDatabase, withTransaction } from "@/server/db/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORAGE_BUCKET = "portfolio-media";
const EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf"
};

/**
 * Migrasi URL media lama (proxy /api/v1/media/xxx) ke URL Supabase Storage public.
 * Hanya bisa diakses oleh admin yang sudah login.
 * GET /api/v1/admin/migrate-media
 */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Butuh login admin." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "Supabase belum dikonfigurasi." }, { status: 503 });
    }

    const supabase = getSupabaseClient();
    const db = await readDatabase();
    const assets = db.mediaAssets ?? [];

    const toMigrate = assets.filter(a => a.url.startsWith("/api/v1/media/"));

    if (toMigrate.length === 0) {
      return NextResponse.json({ ok: true, migrated: 0, message: "Semua URL sudah terbaru." });
    }

    // Buat map: id → public URL baru
    const urlMap = new Map<string, string>();
    for (const asset of toMigrate) {
      const ext = EXTENSION[asset.mimeType] ?? "jpg";
      const objectPath = `${asset.id}.${ext}`;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
      urlMap.set(asset.id, data.publicUrl);
    }

    // Update database Supabase
    await withTransaction((draft) => {
      for (const asset of draft.mediaAssets) {
        if (!asset.url.startsWith("/api/v1/media/")) continue;
        const newUrl = urlMap.get(asset.id);
        if (!newUrl) continue;
        const oldUrl = asset.url;
        asset.url = newUrl;

        // Update semua referensi di database
        if (draft.siteConfig.avatarUrl === oldUrl) draft.siteConfig.avatarUrl = newUrl;
        if (draft.siteConfig.coverImageUrl === oldUrl) draft.siteConfig.coverImageUrl = newUrl;
        if (draft.siteConfig.resumeUrl === oldUrl) draft.siteConfig.resumeUrl = newUrl;
        for (const exp of draft.experiences) {
          if (exp.logoUrl === oldUrl) exp.logoUrl = newUrl;
        }
        for (const cert of draft.certifications) {
          if (cert.imageUrl === oldUrl) cert.imageUrl = newUrl;
          if (cert.issuerLogoUrl === oldUrl) cert.issuerLogoUrl = newUrl;
        }
        for (const section of draft.profileSections) {
          for (const entry of section.entries) {
            if (entry.imageUrl === oldUrl) entry.imageUrl = newUrl;
            if (entry.logoUrl === oldUrl) entry.logoUrl = newUrl;
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      migrated: toMigrate.length,
      message: `Berhasil migrasi ${toMigrate.length} URL media ke Supabase Storage public URL.`,
      urls: Object.fromEntries(urlMap)
    });

  } catch (err) {
    console.error("[migrate-media]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
