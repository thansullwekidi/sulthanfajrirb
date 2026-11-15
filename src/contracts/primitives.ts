/**
 * LAPISAN 1 — Primitif sanitasi bersama.
 * Fungsi-fungsi ini dipakai oleh kontrak skema di klien maupun di server
 * sehingga aturan normalisasi hanya hidup di satu tempat.
 */

/** Normalisasi slug menjadi kebab-case: hanya a-z, 0-9, dan tanda hubung tunggal. */
export function normalizeSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 140);
}

/** Ubah "Next.js,  Redis ,, next.js" menjadi ["Next.js", "Redis"]. */
export function parseCsvList(input: string | string[]): string[] {
  const raw = Array.isArray(input) ? input : input.split(/[,\n;]/);
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of raw) {
    const clean = item.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
}

export function trimText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

/** Hanya menerima http(s):// secara eksplisit. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * URL aset media internal hasil unggahan Studio: `/api/v1/media/<id>`.
 * Aset lokal tidak melewati protokol HTTP absolut, jadi perlu diizinkan
 * secara eksplisit — tetapi hanya untuk pola rute media yang kita kenal.
 */
export function isInternalMediaUrl(value: string): boolean {
  return /^\/api\/v1\/media\/[A-Za-z0-9_-]{4,}$/.test(value);
}

/** URL gambar yang sah: berkas unggahan internal atau http(s) eksternal. */
export function isSafeImageUrl(value: string): boolean {
  return isInternalMediaUrl(value) || isSafeHttpUrl(value);
}

export function formatDateId(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  }).format(date);
}

export function formatDateTimeId(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  }).format(date);
}

export function formatClockWib(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  }).format(date);
}

export function readingTimeFrom(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
