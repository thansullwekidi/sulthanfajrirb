import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database, SiteConfig } from "@/contracts/domain";
import { buildSeedDatabase } from "./seed";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

/**
 * LAPISAN 2 — Supabase is the production store; this atomic JSON store remains
 * the local-development fallback.
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

function removeDeletedFeatures(input: unknown): boolean {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  const raw = input as Record<string, unknown>;
  let changed = false;

  for (const key of ["projects", "testimonials"]) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      delete raw[key];
      changed = true;
    }
  }

  if (Array.isArray(raw.profileSections)) {
    const activeSections = raw.profileSections.filter(
      (section) =>
        typeof section !== "object" ||
        section === null ||
        !["PROJECTS", "RECOMMENDATIONS"].includes(
          String((section as { kind?: unknown }).kind)
        )
    );
    if (activeSections.length !== raw.profileSections.length) {
      raw.profileSections = activeSections;
      changed = true;
    }
  }

  if (Array.isArray(raw.certifications)) {
    for (const certification of raw.certifications) {
      if (
        typeof certification === "object" &&
        certification !== null &&
        Object.prototype.hasOwnProperty.call(certification, "verifyUrl")
      ) {
        delete (certification as Record<string, unknown>).verifyUrl;
        changed = true;
      }
    }
  }

  const siteConfig = raw.siteConfig;
  if (typeof siteConfig === "object" && siteConfig !== null && !Array.isArray(siteConfig)) {
    const config = siteConfig as Record<string, unknown>;
    for (const key of ["connections", "followers"]) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        delete config[key];
        changed = true;
      }
    }
    const homepageSections = config.homepageSections;
    if (
      typeof homepageSections === "object" &&
      homepageSections !== null &&
      !Array.isArray(homepageSections)
    ) {
      const sections = homepageSections as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(sections, "metrics")) {
        delete sections.metrics;
        changed = true;
      }
      const publications = sections.publications;
      if (
        typeof publications === "object" &&
        publications !== null &&
        !Array.isArray(publications) &&
        Object.prototype.hasOwnProperty.call(publications, "maxItems")
      ) {
        delete (publications as Record<string, unknown>).maxItems;
        changed = true;
      }
    }
  }

  return changed;
}

async function purgeDeletedFeaturesFromArchives(): Promise<void> {
  try {
    const archiveNames = (await fs.readdir(DB_DIR)).filter(
      (name) => name === "portfolio.json.bak" || /^backup-pre-.*\.json$/i.test(name)
    );

    for (const name of archiveNames) {
      const archivePath = path.join(DB_DIR, name);
      if (path.resolve(archivePath) === path.resolve(DB_FILE)) continue;
      const contents = await fs.readFile(archivePath, "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(contents.replace(/^\uFEFF/, "")) as unknown;
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        console.warn(`Tidak dapat mempurge arsip JSON yang rusak: ${archivePath}`, error);
        continue;
      }
      if (!removeDeletedFeatures(parsed)) continue;

      const tempFile = `${archivePath}.tmp-${process.pid}-${Date.now()}`;
      await fs.writeFile(tempFile, JSON.stringify(parsed, null, 2), "utf8");
      await fs.rename(tempFile, archivePath);
    }
  } catch {
    // Direktori arsip tidak ada di lingkungan serverless read-only
  }
}

/** Normalisasi defensif terhadap berkas yang rusak atau hasil impor lama. */
function coerceDatabase(input: unknown): Database {
  const seed = buildSeedDatabase();
  if (typeof input !== "object" || input === null) throw new Error("Basis data bukan objek.");
  const raw = input as Partial<Database> & {
    projects?: unknown;
    siteConfig?: Partial<SiteConfig> & {
      connections?: unknown;
      followers?: unknown;
    };
  };
  const rawHomepageSections = (
    (raw.siteConfig as unknown as { homepageSections?: Record<string, Record<string, unknown>> })
      ?.homepageSections ?? {}
  );
  const storedSkills = { ...(rawHomepageSections.skills ?? {}) };
  const storedPublications = { ...(rawHomepageSections.publications ?? {}) };
  delete storedPublications.maxItems;
  if (storedSkills.title === "Matriks Kompetensi 4-Domain") {
    storedSkills.title = seed.siteConfig.homepageSections.skills.title;
  }
  if (
    storedSkills.description ===
    "Penguasaan diukur dari artefak yang dapat diperiksa: portofolio, berkas sumber, dan materi terbit. Angka pada bilah menunjukkan tingkat kemahiran yang diklaim, bukan sertifikasi otomatis."
  ) {
    storedSkills.description = seed.siteConfig.homepageSections.skills.description;
  }
  const storedSiteConfig = { ...(raw.siteConfig ?? {}) };
  delete storedSiteConfig.connections;
  delete storedSiteConfig.followers;

  const array = <T>(value: unknown, fallback: T[]): T[] =>
    Array.isArray(value) ? (value as T[]) : fallback;

  const fallbackTime = seed.siteConfig.updatedAt;

  const profiles = array(raw.profileSections, seed.profileSections)
    .filter((section) => !["PROJECTS", "RECOMMENDATIONS"].includes(String(section.kind)))
    .map((section, index) => ({
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
        fieldOfStudy: entry.fieldOfStudy ?? "",
        notes: entry.notes ?? "",
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
      ...storedSiteConfig,
      resumeUrl:
        typeof raw.siteConfig?.resumeUrl === "string"
          ? raw.siteConfig.resumeUrl
          : seed.siteConfig.resumeUrl,
      homepageSections: {
        hero: {
          ...seed.siteConfig.homepageSections.hero,
          ...(rawHomepageSections.hero ?? {}),
          primaryCtaLabel:
            rawHomepageSections.hero?.primaryCtaLabel === "Buka CV ATS"
              ? seed.siteConfig.homepageSections.hero.primaryCtaLabel
              : (rawHomepageSections.hero?.primaryCtaLabel as string | undefined) ??
                seed.siteConfig.homepageSections.hero.primaryCtaLabel
        },
        experienceTimeline: {
          ...seed.siteConfig.homepageSections.experienceTimeline,
          ...(raw.siteConfig?.homepageSections?.experienceTimeline ?? {})
        },
        certifications: {
          ...seed.siteConfig.homepageSections.certifications,
          ...(raw.siteConfig?.homepageSections?.certifications ?? {})
        },
        skills: {
          ...seed.siteConfig.homepageSections.skills,
          ...storedSkills
        },
        publications: {
          ...seed.siteConfig.homepageSections.publications,
          ...storedPublications
        }
      }
    },
    experiences: array(raw.experiences, seed.experiences).map((experience) => ({
      ...experience,
      employmentType: experience.employmentType ?? "FULL_TIME",
      startDate: experience.startDate ?? "",
      endDate: experience.endDate ?? "",
      isCurrent: experience.isCurrent ?? false,
      location: experience.location ?? "",
      workMode: experience.workMode ?? "ON_SITE",
      description: experience.description ?? "",
      skills: Array.isArray(experience.skills) ? experience.skills : [],
      logoUrl: experience.logoUrl ?? "",
      organizationUrl: experience.organizationUrl ?? ""
    })),
    certifications: array(raw.certifications, seed.certifications).map((certification) => {
      const normalized = { ...certification } as typeof certification & {
        verifyUrl?: string;
      };
      delete normalized.verifyUrl;
      return {
        ...normalized,
        expiryDate: certification.expiryDate ?? "",
        skills: Array.isArray(certification.skills) ? certification.skills : [],
        imageUrl: certification.imageUrl ?? "",
        issuerLogoUrl: certification.issuerLogoUrl ?? ""
      };
    }),
    skills: array(raw.skills, seed.skills).map((skill) => ({
      ...skill,
      endorsements: typeof skill.endorsements === "number" ? skill.endorsements : 0,
      pinned: skill.pinned ?? false
    })),
    articles: array(raw.articles, seed.articles).map((article) => ({
      ...article,
      externalUrl: article.externalUrl ?? ""
    })),
    profileSections: profiles,
    socialLinks,
    mediaAssets,
    inquiries: array(raw.inquiries, seed.inquiries),
    auditLogs: array(raw.auditLogs, seed.auditLogs)
  };
}

async function writeUnsafe(database: Database, preserveCurrentBackup = true): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    const payload = JSON.stringify(database, null, 2);
    const tempFile = `${DB_FILE}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tempFile, payload, "utf8");

    if (preserveCurrentBackup) {
      try {
        const current = await fs.readFile(DB_FILE, "utf8");
        await fs.writeFile(`${DB_FILE}.bak`, current, "utf8");
      } catch {
        // Berkas belum ada: tidak ada cadangan yang perlu dibuat.
      }
    }

    await fs.rename(tempFile, DB_FILE);
  } catch (error) {
    console.warn("Penyimpanan lokal ke disk dilewati (read-only filesystem):", error);
  }
}

async function readUnsafe(): Promise<Database> {
  if (runtime.cache) return runtime.cache;

  let raw: string;
  try {
    raw = await fs.readFile(DB_FILE, "utf8");
  } catch {
    // Berkas lokal tidak ada (misalnya di Vercel serverless tanpa .data)
    const seed = buildSeedDatabase();
    runtime.cache = seed;
    try {
      await writeUnsafe(seed);
    } catch {
      // Abaikan di serverless
    }
    return seed;
  }

  let parsedInput: unknown;
  try {
    parsedInput = JSON.parse(raw.replace(/^\uFEFF/, "")) as unknown;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    try {
      await fs.rename(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`);
    } catch {
      // Abaikan
    }
    const seed = buildSeedDatabase();
    try {
      await writeUnsafe(seed);
    } catch {
      // Abaikan
    }
    runtime.cache = seed;
    return seed;
  }

  const database = coerceDatabase(parsedInput);
  const hasLegacyProjects =
    typeof parsedInput === "object" &&
    parsedInput !== null &&
    Object.prototype.hasOwnProperty.call(parsedInput, "projects");
  const hasRemovedProfileSections =
    typeof parsedInput === "object" &&
    parsedInput !== null &&
    Array.isArray((parsedInput as { profileSections?: unknown }).profileSections) &&
    (parsedInput as { profileSections: Array<{ kind?: unknown }> }).profileSections.some(
      (section) => ["PROJECTS", "RECOMMENDATIONS"].includes(String(section.kind))
    );
  const hasRemovedMetricsConfiguration =
    typeof parsedInput === "object" &&
    parsedInput !== null &&
    typeof (parsedInput as { siteConfig?: unknown }).siteConfig === "object" &&
    (parsedInput as { siteConfig?: { homepageSections?: { metrics?: unknown } } }).siteConfig
      ?.homepageSections?.metrics !== undefined;
  const rawHomepageSections =
    typeof parsedInput === "object" && parsedInput !== null
      ? (parsedInput as {
          siteConfig?: {
            homepageSections?: { publications?: unknown } | null;
          } | null;
        }).siteConfig?.homepageSections
      : undefined;
  const rawPublications = rawHomepageSections?.publications;
  const hasRemovedPublicationLimit =
    typeof rawPublications === "object" &&
    rawPublications !== null &&
    Object.prototype.hasOwnProperty.call(rawPublications, "maxItems");
  const hasRemovedTestimonials =
    typeof parsedInput === "object" &&
    parsedInput !== null &&
    Object.prototype.hasOwnProperty.call(parsedInput, "testimonials");
  const hasLegacyCertificationUrls =
    typeof parsedInput === "object" &&
    parsedInput !== null &&
    Array.isArray((parsedInput as { certifications?: unknown }).certifications) &&
    (parsedInput as { certifications: Array<Record<string, unknown>> }).certifications.some(
      (certification) =>
        typeof certification === "object" &&
        certification !== null &&
        Object.prototype.hasOwnProperty.call(certification, "verifyUrl")
    );

  if (
    hasLegacyProjects ||
    hasRemovedProfileSections ||
    hasRemovedMetricsConfiguration ||
    hasRemovedPublicationLimit ||
    hasRemovedTestimonials ||
    hasLegacyCertificationUrls
  ) {
    try {
      const sanitized = JSON.stringify(database, null, 2);
      const backupFile = `${DB_FILE}.bak`;
      const backupTemp = `${backupFile}.tmp-${process.pid}-${Date.now()}`;
      await fs.writeFile(backupTemp, sanitized, "utf8");
      await fs.rename(backupTemp, backupFile);
      await writeUnsafe(database, false);
    } catch {
      // Abaikan jika read-only
    }
  }

  try {
    await purgeDeletedFeaturesFromArchives();
  } catch {
    // Abaikan jika read-only
  }
  runtime.cache = database;
  return database;
}

interface RemoteDatabaseState {
  revision: number;
  payload: unknown;
}

async function readRemoteState(): Promise<RemoteDatabaseState> {
  const { data, error } = await getSupabaseClient().rpc("portfolio_read");
  if (error) throw new Error(`Gagal membaca database Supabase: ${error.message}`);

  const state = (data as RemoteDatabaseState[] | null)?.[0];
  if (state) return state;

  const { error: initializeError } = await getSupabaseClient().rpc("portfolio_initialize", {
    p_payload: buildSeedDatabase()
  });
  if (initializeError) {
    throw new Error(`Gagal menginisialisasi database Supabase: ${initializeError.message}`);
  }

  const { data: initializedRows, error: readError } =
    await getSupabaseClient().rpc("portfolio_read");
  if (readError) throw new Error(`Gagal membaca database Supabase: ${readError.message}`);
  const initialized = (initializedRows as RemoteDatabaseState[] | null)?.[0];
  if (!initialized) {
    throw new Error("Database Supabase tidak mengembalikan data setelah inisialisasi.");
  }
  return initialized;
}

async function writeRemoteState(
  expectedRevision: number,
  payload: Database
): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc("portfolio_write", {
    p_expected_revision: expectedRevision,
    p_payload: payload
  });
  if (error) throw new Error(`Gagal menyimpan database Supabase: ${error.message}`);
  return data !== null;
}

export async function readDatabase(): Promise<Database> {
  if (isSupabaseConfigured()) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const remote = await readRemoteState();
      const database = coerceDatabase(remote.payload);
      if (JSON.stringify(database) !== JSON.stringify(remote.payload)) {
        if (!(await writeRemoteState(remote.revision, database))) continue;
      }
      return structuredClone(database);
    }
    throw new Error("Database berubah bersamaan saat dibaca. Coba lagi.");
  }

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
    if (isSupabaseConfigured()) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const remote = await readRemoteState();
        const snapshot = coerceDatabase(remote.payload);
        const draft = structuredClone(snapshot);
        const result = await mutator(draft);
        if (await writeRemoteState(remote.revision, draft)) {
          runtime.cache = null;
          return result;
        }
      }
      throw new Error("Database berubah bersamaan. Ulangi perubahan beberapa saat lagi.");
    }

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
    draft.experiences = next.experiences;
    draft.certifications = next.certifications;
    draft.skills = next.skills;
    draft.articles = next.articles;
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
