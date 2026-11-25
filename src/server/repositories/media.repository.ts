import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database, MediaAsset, MediaMime, MediaPurpose } from "@/contracts/domain";
import {
  MEDIA_ALLOWED_MIME,
  MEDIA_MAX_BYTES,
  RESUME_MAX_BYTES
} from "@/contracts/domain";
import { readDatabase, withTransaction } from "@/server/db/store";
import { revalidatePortfolioCache } from "@/server/db/cache";
import { getSupabaseClient, isSupabaseConfigured } from "@/server/db/supabase";
import { DomainError, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/** Supabase Storage in production; local files remain available for development. */

const MEDIA_DIR =
  process.env.MEDIA_DIR && process.env.MEDIA_DIR.trim().length > 0
    ? process.env.MEDIA_DIR
    : path.join(process.cwd(), ".data", "media");
const STORAGE_BUCKET = "portfolio-media";

const EXTENSION: Record<MediaMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf"
};

/** Deteksi tipe berkas dari magic bytes, bukan dari nama atau MIME klien. */
function sniffMime(buffer: Buffer): MediaMime | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (buffer.length >= 8) {
    const png = buffer.subarray(0, 8);
    if (png.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return "image/png";
    }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 6) {
    const head = buffer.subarray(0, 6).toString("ascii");
    if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  }
  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  }
  if (buffer.length >= 12) {
    const ftyp = buffer.subarray(4, 8).toString("ascii");
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (ftyp === "ftyp" && (brand === "avif" || brand === "avis")) return "image/avif";
  }
  return null;
}

function sanitizeBaseName(fileName: string): string {
  const base = path.basename(fileName).replace(/\.[^.]+$/, "");
  const clean = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return clean || "gambar";
}

function decodeDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:([^;,]+);base64,(.+)$/is.exec(dataUrl.trim());
  if (!match?.[1] || !match[2]) {
    throw new DomainError(422, "INVALID_MEDIA", "Berkas gambar tidak dapat dibaca.");
  }
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  return { mimeType: match[1].toLowerCase(), buffer };
}

/* ------------------------------------------------------------------ BACA */

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const assets = (await readDatabase()).mediaAssets;
  return [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readMediaFile(
  id: string
): Promise<{ buffer: Buffer; mimeType: MediaMime; fileName: string }> {
  const asset = (await readDatabase()).mediaAssets.find((item) => item.id === id);
  if (!asset) throw notFound("Media");

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient()
      .storage.from(STORAGE_BUCKET)
      .download(`${asset.id}.${EXTENSION[asset.mimeType]}`);
    if (error) {
      if (error.message.toLowerCase().includes("not found")) throw notFound("Berkas media");
      throw new Error(`Gagal membaca media dari Supabase Storage: ${error.message}`);
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, mimeType: asset.mimeType, fileName: asset.fileName };
  }

  try {
    const buffer = await fs.readFile(
      path.join(MEDIA_DIR, `${asset.id}.${EXTENSION[asset.mimeType]}`)
    );
    return { buffer, mimeType: asset.mimeType, fileName: asset.fileName };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw notFound("Berkas media");
    throw error;
  }
}

/* ------------------------------------------------------------------ TULIS */

export async function saveMedia(input: {
  fileName: string;
  dataUrl: string;
  purpose: MediaPurpose;
}): Promise<MediaAsset> {
  const { buffer, mimeType } = decodeDataUrl(input.dataUrl);
  const maxBytes = input.purpose === "RESUME" ? RESUME_MAX_BYTES : MEDIA_MAX_BYTES;

  if (buffer.byteLength === 0) {
    throw new DomainError(422, "EMPTY_MEDIA", "Berkas kosong.");
  }
  if (buffer.byteLength > maxBytes) {
    throw new DomainError(
      422,
      "MEDIA_TOO_LARGE",
      `Ukuran ${input.purpose === "RESUME" ? "CV" : "gambar"} maksimal ${Math.round(
        maxBytes / 1024 / 1024
      )} MB.`
    );
  }

  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    throw new DomainError(
      422,
      "UNSUPPORTED_MEDIA",
      "Format berkas tidak dikenali. Gunakan PNG, JPEG, WebP, GIF, AVIF, atau PDF untuk CV."
    );
  }
  if (!(MEDIA_ALLOWED_MIME as readonly string[]).includes(sniffed)) {
    throw new DomainError(422, "UNSUPPORTED_MEDIA", "Format berkas tidak diizinkan.");
  }
  if ((input.purpose === "RESUME") !== (sniffed === "application/pdf")) {
    throw new DomainError(
      422,
      "MEDIA_PURPOSE_MISMATCH",
      input.purpose === "RESUME" ? "Unggah CV dalam format PDF." : "PDF hanya dapat diunggah sebagai CV."
    );
  }
  if (mimeType !== sniffed) {
    throw new DomainError(
      422,
      "MEDIA_MISMATCH",
      "Isi berkas tidak cocok dengan tipe yang dinyatakan."
    );
  }

  const id = createEntityId("med");
  const extension = EXTENSION[sniffed];
  const fileName = `${sanitizeBaseName(input.fileName)}.${extension}`;
  const objectPath = `${id}.${extension}`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .storage.from(STORAGE_BUCKET)
      .upload(objectPath, buffer, { contentType: sniffed, upsert: false });
    if (error) throw new Error(`Gagal mengunggah media ke Supabase Storage: ${error.message}`);

    // Pakai public URL Supabase Storage langsung — tidak perlu proxy Next.js
    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    const publicUrl = publicData.publicUrl;

    try {
      return await withTransaction((draft) => {
        const asset: MediaAsset = {
          id,
          fileName,
          mimeType: sniffed,
          byteSize: buffer.byteLength,
          purpose: input.purpose,
          url: publicUrl,
          createdAt: new Date().toISOString()
        };
        draft.mediaAssets.push(asset);
        appendAudit(draft, {
          action: "CREATE",
          entityType: "MEDIA",
          entitySlug: id,
          commitHash: createCommitHash(id),
          summary: `Mengunggah media "${fileName}" (${Math.round(buffer.byteLength / 1024)} KB).`
        });
        return structuredClone(asset);
      });
    } catch (error) {
      // Jangan tinggalkan berkas yatim bila pencatatan basis data gagal.
      try {
        const { error: cleanupError } = await supabase
          .storage.from(STORAGE_BUCKET)
          .remove([objectPath]);
        if (cleanupError) {
          console.error("[media] gagal membersihkan unggahan yatim:", cleanupError);
        }
      } catch (cleanupError) {
        console.error("[media] gagal membersihkan unggahan yatim:", cleanupError);
      }
      throw error;
    }
  } else {
    // Mode dev lokal: simpan ke filesystem dan pakai proxy route
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(path.join(MEDIA_DIR, objectPath), buffer);

    try {
      return await withTransaction((draft) => {
        const asset: MediaAsset = {
          id,
          fileName,
          mimeType: sniffed,
          byteSize: buffer.byteLength,
          purpose: input.purpose,
          url: `/api/v1/media/${id}`,
          createdAt: new Date().toISOString()
        };
        draft.mediaAssets.push(asset);
        appendAudit(draft, {
          action: "CREATE",
          entityType: "MEDIA",
          entitySlug: id,
          commitHash: createCommitHash(id),
          summary: `Mengunggah media "${fileName}" (${Math.round(buffer.byteLength / 1024)} KB).`
        });
        return structuredClone(asset);
      });
    } catch (error) {
      try {
        await fs.rm(path.join(MEDIA_DIR, objectPath), { force: true });
      } catch (cleanupError) {
        console.error("[media] gagal membersihkan unggahan yatim:", cleanupError);
      }
      throw error;
    }
  }
}

export function detachMediaReferences(database: Database, urls: ReadonlySet<string>): number {
  let detachedReferences = 0;
  const clear = (value: string): string => {
    if (!urls.has(value)) return value;
    detachedReferences += 1;
    return "";
  };

  database.siteConfig.avatarUrl = clear(database.siteConfig.avatarUrl);
  database.siteConfig.coverImageUrl = clear(database.siteConfig.coverImageUrl);
  database.siteConfig.resumeUrl = clear(database.siteConfig.resumeUrl);
  for (const experience of database.experiences) {
    experience.logoUrl = clear(experience.logoUrl);
  }
  for (const certification of database.certifications) {
    certification.imageUrl = clear(certification.imageUrl);
    certification.issuerLogoUrl = clear(certification.issuerLogoUrl);
  }
  for (const section of database.profileSections) {
    for (const entry of section.entries) {
      entry.imageUrl = clear(entry.imageUrl);
      entry.logoUrl = clear(entry.logoUrl);
    }
  }

  return detachedReferences;
}

export async function purgeMediaFiles(assets: readonly MediaAsset[]): Promise<void> {
  if (isSupabaseConfigured()) {
    const objects = assets.map((asset) => `${asset.id}.${EXTENSION[asset.mimeType]}`);
    if (objects.length === 0) return;
    const { error } = await getSupabaseClient().storage.from(STORAGE_BUCKET).remove(objects);
    if (error) throw new Error(`Gagal menghapus media dari Supabase Storage: ${error.message}`);
    return;
  }

  await Promise.all(
    assets.map((asset) =>
      fs.rm(path.join(MEDIA_DIR, `${asset.id}.${EXTENSION[asset.mimeType]}`), {
        force: true
      })
    )
  );
}

export async function deleteMedia(id: string): Promise<void> {
  const removed = await withTransaction((draft) => {
    const index = draft.mediaAssets.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Media");
    const [asset] = draft.mediaAssets.splice(index, 1);
    if (!asset) throw notFound("Media");
    const detachedReferences = detachMediaReferences(draft, new Set([asset.url]));
    appendAudit(draft, {
      action: "PURGE",
      entityType: "MEDIA",
      entitySlug: asset.id,
      commitHash: createCommitHash(`media-del:${id}`),
      summary: `Menghapus permanen media "${asset.fileName}" dan melepas ${detachedReferences} referensi.`
    });
    return asset;
  });

  await purgeMediaFiles([removed]);
  await revalidatePortfolioCache();
}

/** Total pemakaian penyimpanan media dalam byte. */
export async function mediaUsage(): Promise<{ count: number; bytes: number }> {
  const assets = (await readDatabase()).mediaAssets;
  return {
    count: assets.length,
    bytes: assets.reduce((sum, asset) => sum + asset.byteSize, 0)
  };
}
