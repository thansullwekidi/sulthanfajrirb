import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "@/contracts/domain";
import { buildSeedDatabase } from "./seed";

/**
 * LAPISAN 2 — Local Persistence Storage Engine.
 * - Penulisan atomik (tulis ke berkas sementara lalu rename).
 * - Mutex antrean proses agar tidak ada dua transaksi menulis bersamaan.
 * - Snapshot rollback: kegagalan di tengah transaksi mengembalikan berkas
 *   ke keadaan sebelum mutasi (zero partial write).
 */

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE =
  process.env.PORTFOLIO_DB_PATH && process.env.PORTFOLIO_DB_PATH.trim().length > 0
    ? process.env.PORTFOLIO_DB_PATH
    : path.join(DB_DIR, "portfolio.json");

interface StoreRuntime {
  cache: Database | null;
  queue: Promise<unknown>;
  initializing: Promise<void> | null;
}

const runtimeHost = globalThis as typeof globalThis & {
  __portfolioStoreRuntime?: StoreRuntime;
};

const runtime: StoreRuntime = (runtimeHost.__portfolioStoreRuntime ??= {
  cache: null,
  queue: Promise.resolve(),
  initializing: null
});

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = runtime.queue.then(task, task);
  runtime.queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/** Normalisasi defensif terhadap berkas yang rusak atau hasil impor lama. */
function coerceDatabase(input: unknown): Database {
  const seed = buildSeedDatabase();
  if (typeof input !== "object" || input === null) throw new Error("Basis data bukan objek.");
  const raw = input as Partial<Database>;

  const array = <T>(value: unknown, fallback: T[]): T[] =>
    Array.isArray(value) ? (value as T[]) : fallback;

  const fallbackTime = seed.siteConfig.updatedAt;

  const profiles = array(raw.profileSections, seed.profileSections).map((section, index) => ({
    ...section,
    slug: section.slug || `bagian-${index + 1}`,
    subtitle: section.subtitle ?? "",
    kind: section.kind ?? "CUSTOM",
    visible: section.visible ?? true,
    sortOrder: typeof section.sortOrder === "number" ? section.sortOrder : index + 1,
    createdAt: section.createdAt ?? fallbackTime,
    updatedAt: section.updatedAt ?? fallbackTime,
    entries: (Array.isArray(section.entries) ? section.entries : []).map((entry, entryIndex) => ({
      ...entry,
      subtitle: entry.subtitle ?? "",
      meta: entry.meta ?? "",
      location: entry.location ?? "",
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      isCurrent: entry.isCurrent ?? false,
      description: entry.description ?? "",
      url: entry.url ?? "",
      imageUrl: entry.imageUrl ?? "",
      logoUrl: entry.logoUrl ?? "",
      authors: entry.authors ?? "",
      publisher: entry.publisher ?? "",
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      visible: entry.visible ?? true,
      sortOrder: typeof entry.sortOrder === "number" ? entry.sortOrder : entryIndex + 1,
      createdAt: entry.createdAt ?? fallbackTime
    }))
  }));

  const socialLinks = array(raw.socialLinks, seed.socialLinks).map((link, index) => ({
    ...link,
    label: link.label ?? "",
    visible: link.visible ?? true,
    sortOrder: typeof link.sortOrder === "number" ? link.sortOrder : index + 1,
    createdAt: link.createdAt ?? fallbackTime
  }));

  const mediaAssets = array(raw.mediaAssets, seed.mediaAssets).map((asset) => ({
    ...asset,
    byteSize: typeof asset.byteSize === "number" ? asset.byteSize : 0,
    createdAt: asset.createdAt ?? fallbackTime
  }));

  return {
    schemaVersion: 1,
    siteConfig: {
      ...seed.siteConfig,
      ...(typeof raw.siteConfig === "object" && raw.siteConfig !== null ? raw.siteConfig : {})
    },
    projects: array(raw.projects, seed.projects),
    experiences: array(raw.experiences, seed.experiences).map((experience) => ({
      ...experience,
      employmentType: experience.employmentType ?? "FULL_TIME",
      location: experience.location ?? "",
      workMode: experience.workMode ?? "ON_SITE",
      description: experience.description ?? "",
      skills: Array.isArray(experience.skills) ? experience.skills : [],
      logoUrl: experience.logoUrl ?? "",
      organizationUrl: experience.organizationUrl ?? ""
    })),
    certifications: array(raw.certifications, seed.certifications).map((certification) => ({
      ...certification,
      expiryDate: certification.expiryDate ?? "",
      skills: Array.isArray(certification.skills) ? certification.skills : [],
      imageUrl: certification.imageUrl ?? "",
      issuerLogoUrl: certification.issuerLogoUrl ?? ""
    })),
    skills: array(raw.skills, seed.skills).map((skill) => ({
      ...skill,
      endorsements: typeof skill.endorsements === "number" ? skill.endorsements : 0,
      pinned: skill.pinned ?? false
    })),
    articles: array(raw.articles, seed.articles),
    testimonials: array(raw.testimonials, seed.testimonials).map((testimonial) => ({
      ...testimonial,
      relationship: testimonial.relationship ?? "",
      avatarUrl: testimonial.avatarUrl ?? "",
      profileUrl: testimonial.profileUrl ?? "",
      isVisible: testimonial.isVisible ?? true
    })),
    profileSections: profiles,
    socialLinks,
    mediaAssets,
    inquiries: array(raw.inquiries, seed.inquiries),
    auditLogs: array(raw.auditLogs, seed.auditLogs)
  };
}

async function writeUnsafe(database: Database): Promise<void> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  const payload = JSON.stringify(database, null, 2);
  const tempFile = `${DB_FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tempFile, payload, "utf8");

  try {
    const current = await fs.readFile(DB_FILE, "utf8");
    await fs.writeFile(`${DB_FILE}.bak`, current, "utf8");
  } catch {
    // Berkas belum ada: tidak ada cadangan yang perlu dibuat.
  }

  await fs.rename(tempFile, DB_FILE);
}

async function readUnsafe(): Promise<Database> {
  if (runtime.cache) return runtime.cache;

  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = coerceDatabase(JSON.parse(raw) as unknown);
    runtime.cache = parsed;
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      try {
        await fs.rename(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`);
      } catch {
        // Abaikan: berkas mungkin sudah tidak ada.
      }
    }

    const seed = buildSeedDatabase();
    await writeUnsafe(seed);
    runtime.cache = seed;
    return seed;
  }
}

export async function readDatabase(): Promise<Database> {
  const database = await enqueue(() => readUnsafe());
  return structuredClone(database);
}

/**
 * Jalankan mutasi di dalam transaksi tunggal. Bila mutator melempar galat,
 * berkas dan cache dikembalikan ke snapshot awal.
 */
export async function withTransaction<T>(
  mutator: (draft: Database) => Promise<T> | T
): Promise<T> {
  return enqueue(async () => {
    const snapshot = structuredClone(await readUnsafe());
    const draft = structuredClone(snapshot);

    try {
      const result = await mutator(draft);
      await writeUnsafe(draft);
      runtime.cache = draft;
      return result;
    } catch (error) {
      await writeUnsafe(snapshot);
      runtime.cache = snapshot;
      throw error;
    }
  });
}

/** Menimpa seluruh basis data (dipakai impor dan reset). */
export async function replaceDatabase(next: Database): Promise<void> {
  await withTransaction((draft) => {
    draft.schemaVersion = next.schemaVersion;
    draft.projects = next.projects;
    draft.experiences = next.experiences;
    draft.certifications = next.certifications;
    draft.skills = next.skills;
    draft.articles = next.articles;
    draft.testimonials = next.testimonials;
    draft.profileSections = next.profileSections;
    draft.socialLinks = next.socialLinks;
    draft.mediaAssets = next.mediaAssets;
    draft.inquiries = next.inquiries;
    draft.auditLogs = next.auditLogs;
    draft.siteConfig = next.siteConfig;
  });
}

export async function databaseFilePath(): Promise<string> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  return DB_FILE;
}

export function invalidateRuntimeCache(): void {
  runtime.cache = null;
}
