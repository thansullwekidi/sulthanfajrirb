import { promises as fs } from "node:fs";
import path from "node:path";
import type { MediaAsset, MediaMime, MediaPurpose } from "@/contracts/domain";
import { MEDIA_ALLOWED_MIME, MEDIA_MAX_BYTES } from "@/contracts/domain";
import { readDatabase, withTransaction } from "@/server/db/store";
import { DomainError, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/**
 * Repositori media: berkas gambar disimpan di `.data/media` dan disajikan
 * melalui rute `/api/v1/media/[id]`, sehingga tidak bergantung pada folder
 * `public` yang bersifat statis setelah build produksi.
 */

const MEDIA_DIR =
  process.env.MEDIA_DIR && process.env.MEDIA_DIR.trim().length > 0
    ? process.env.MEDIA_DIR
    : path.join(process.cwd(), ".data", "media");

const EXTENSION: Record<MediaMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

/** Deteksi tipe berkas dari magic bytes, bukan dari nama atau MIME klien. */
function sniffMime(buffer: Buffer): MediaMime | null {
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
): Promise<{ buffer: Buffer; mimeType: MediaMime }> {
  const asset = (await readDatabase()).mediaAssets.find((item) => item.id === id);
  if (!asset) throw notFound("Media");

  try {
    const buffer = await fs.readFile(path.join(MEDIA_DIR, `${asset.id}.${EXTENSION[asset.mimeType]}`));
    return { buffer, mimeType: asset.mimeType };
  } catch {
    throw notFound("Berkas media");
  }
}

/* ------------------------------------------------------------------ TULIS */

export async function saveMedia(input: {
  fileName: string;
  dataUrl: string;
  purpose: MediaPurpose;
}): Promise<MediaAsset> {
  const { buffer, mimeType } = decodeDataUrl(input.dataUrl);

  if (buffer.byteLength === 0) {
    throw new DomainError(422, "EMPTY_MEDIA", "Berkas gambar kosong.");
  }
  if (buffer.byteLength > MEDIA_MAX_BYTES) {
    throw new DomainError(
      422,
      "MEDIA_TOO_LARGE",
      `Ukuran gambar maksimal ${Math.round(MEDIA_MAX_BYTES / 1024 / 1024)} MB.`
    );
  }

  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    throw new DomainError(
      422,
      "UNSUPPORTED_MEDIA",
      "Format gambar tidak dikenali. Gunakan PNG, JPEG, WebP, GIF, atau AVIF."
    );
  }
  if (!(MEDIA_ALLOWED_MIME as readonly string[]).includes(sniffed)) {
    throw new DomainError(422, "UNSUPPORTED_MEDIA", "Format gambar tidak diizinkan.");
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
  const target = path.join(MEDIA_DIR, `${id}.${extension}`);

  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.writeFile(target, buffer);

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
    // Jangan tinggalkan berkas yatim bila pencatatan basis data gagal.
    await fs.rm(target, { force: true });
    throw error;
  }
}

export async function deleteMedia(id: string): Promise<void> {
  const removed = await withTransaction((draft) => {
    const index = draft.mediaAssets.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Media");
    const [asset] = draft.mediaAssets.splice(index, 1);
    if (!asset) throw notFound("Media");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "MEDIA",
      entitySlug: asset.id,
      commitHash: createCommitHash(`media-del:${id}`),
      summary: `Menghapus media "${asset.fileName}".`
    });
    return asset;
  });

  await fs.rm(path.join(MEDIA_DIR, `${removed.id}.${EXTENSION[removed.mimeType]}`), {
    force: true
  });
}

/** Total pemakaian penyimpanan media dalam byte. */
export async function mediaUsage(): Promise<{ count: number; bytes: number }> {
  const assets = (await readDatabase()).mediaAssets;
  return {
    count: assets.length,
    bytes: assets.reduce((sum, asset) => sum + asset.byteSize, 0)
  };
}
