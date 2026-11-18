/**
 * Script migrasi URL media lama (proxy /api/v1/media/xxx)
 * ke URL Supabase Storage public langsung.
 *
 * Jalankan: node scripts/migrate-media-urls.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "portfolio-media";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dulu.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf"
};

async function readState() {
  const { data, error } = await supabase.rpc("portfolio_read");
  if (error) throw new Error("Gagal baca Supabase: " + error.message);
  return data[0];
}

async function writeState(revision, payload) {
  const { data, error } = await supabase.rpc("portfolio_write", {
    p_expected_revision: revision,
    p_payload: payload
  });
  if (error) throw new Error("Gagal tulis Supabase: " + error.message);
  return data;
}

async function main() {
  const state = await readState();
  const db = state.payload;
  const assets = db.mediaAssets ?? [];
  
  let migrated = 0;
  
  for (const asset of assets) {
    // Hanya migrate URL proxy lama
    if (!asset.url.startsWith("/api/v1/media/")) continue;
    
    const extension = EXTENSION[asset.mimeType] ?? "jpg";
    const objectPath = `${asset.id}.${extension}`;
    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    
    console.log(`Migrasi: ${asset.id} → ${pub.publicUrl}`);
    asset.url = pub.publicUrl;
    migrated++;
    
    // Juga update referensi URL di siteConfig, experiences, certifications, profileSections
    const oldUrl = `/api/v1/media/${asset.id}`;
    const newUrl = pub.publicUrl;
    
    if (db.siteConfig?.avatarUrl === oldUrl) db.siteConfig.avatarUrl = newUrl;
    if (db.siteConfig?.coverImageUrl === oldUrl) db.siteConfig.coverImageUrl = newUrl;
    if (db.siteConfig?.resumeUrl === oldUrl) db.siteConfig.resumeUrl = newUrl;
    
    for (const exp of db.experiences ?? []) {
      if (exp.logoUrl === oldUrl) exp.logoUrl = newUrl;
    }
    for (const cert of db.certifications ?? []) {
      if (cert.imageUrl === oldUrl) cert.imageUrl = newUrl;
      if (cert.issuerLogoUrl === oldUrl) cert.issuerLogoUrl = newUrl;
    }
    for (const section of db.profileSections ?? []) {
      for (const entry of section.entries ?? []) {
        if (entry.imageUrl === oldUrl) entry.imageUrl = newUrl;
        if (entry.logoUrl === oldUrl) entry.logoUrl = newUrl;
      }
    }
  }
  
  if (migrated === 0) {
    console.log("Tidak ada URL lama yang perlu dimigrasi.");
    return;
  }
  
  const ok = await writeState(state.revision, db);
  if (ok) {
    console.log(`✅ Berhasil migrasi ${migrated} URL media ke Supabase Storage public URL.`);
  } else {
    console.error("Gagal menulis (conflict revision), coba lagi.");
  }
}

main().catch(console.error);
