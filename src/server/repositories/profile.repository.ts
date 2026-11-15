import type { ProfileEntry, ProfileSection } from "@/contracts/domain";
import { PROFILE_ENTRY_LABELS } from "@/contracts/domain";
import type { ProfileEntryInput, ProfileSectionInput } from "@/contracts/profile.contract";
import { normalizeSlug } from "@/contracts/primitives";
import { readDatabase, withTransaction } from "@/server/db/store";
import { DomainError, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/** Repositori bagian profil bergaya LinkedIn: bagian dan entri dapat ditambah, diubah, diurutkan, disembunyikan, dan dihapus. */

function nextOrder(items: ReadonlyArray<{ sortOrder: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeOrders<T extends { sortOrder: number }>(items: T[]): void {
  sortByOrder(items).forEach((item, index) => {
    item.sortOrder = index + 1;
  });
}

function uniqueSectionSlug(draft: { profileSections: ProfileSection[] }, title: string, excludeId?: string): string {
  const base = normalizeSlug(title) || "bagian";
  let candidate = base;
  let counter = 2;
  while (
    draft.profileSections.some(
      (section) => section.slug === candidate && section.id !== excludeId
    )
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function findSection(draft: { profileSections: ProfileSection[] }, id: string): ProfileSection {
  const section = draft.profileSections.find((item) => item.id === id);
  if (!section) throw notFound("Bagian profil");
  return section;
}

function findEntry(section: ProfileSection, id: string): ProfileEntry {
  const entry = section.entries.find((item) => item.id === id);
  if (!entry) throw notFound("Entri profil");
  return entry;
}

/**
 * Publikasi dan paten wajib menautkan sumbernya langsung, agar pembaca
 * dapat membuka dokumen aslinya. Aturan ini ditegakkan di server supaya
 * tidak dapat dilewati lewat pemanggilan API langsung.
 */
function assertEntryUrlRule(section: ProfileSection, input: ProfileEntryInput): void {
  const labels = PROFILE_ENTRY_LABELS[section.kind];
  if (!labels.requireUrl || input.url) return;
  throw new DomainError(
    422,
    "ENTRY_URL_REQUIRED",
    `${labels.urlLabel ?? "Tautan"} wajib diisi untuk bagian "${section.title}".`,
    { url: "Isi tautan langsung ke sumber publikasi/paten." }
  );
}

function moveItem<T extends { sortOrder: number }>(items: T[], id: string, direction: "UP" | "DOWN"): void {
  const ordered = sortByOrder(items);
  const index = ordered.findIndex((item) => (item as { id?: string }).id === id);
  if (index < 0) throw notFound("Entri");
  const target = direction === "UP" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return;
  const current = ordered[index];
  const other = ordered[target];
  if (!current || !other) return;
  const swap = current.sortOrder;
  current.sortOrder = other.sortOrder;
  other.sortOrder = swap;
  normalizeOrders(items);
}

/* ------------------------------------------------------------------ BACA */

export async function listProfileSections(visibleOnly = false): Promise<ProfileSection[]> {
  const sections = sortByOrder((await readDatabase()).profileSections);
  const scoped = visibleOnly ? sections.filter((section) => section.visible) : sections;
  return scoped.map((section) => ({
    ...section,
    entries: sortByOrder(section.entries).filter((entry) => (visibleOnly ? entry.visible : true))
  }));
}

/* ---------------------------------------------------------------- BAGIAN */

export async function createProfileSection(input: ProfileSectionInput): Promise<ProfileSection> {
  return withTransaction((draft) => {
    const timestamp = new Date().toISOString();
    const section: ProfileSection = {
      id: createEntityId("prf"),
      slug: uniqueSectionSlug(draft, input.title),
      title: input.title,
      subtitle: input.subtitle,
      kind: input.kind,
      visible: input.visible,
      sortOrder: nextOrder(draft.profileSections),
      entries: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    draft.profileSections.push(section);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "PROFILE_SECTION",
      entitySlug: section.slug,
      commitHash: createCommitHash(section.id),
      summary: `Menambahkan bagian profil "${input.title}".`
    });
    return structuredClone(section);
  });
}

export async function updateProfileSection(
  id: string,
  input: ProfileSectionInput
): Promise<ProfileSection> {
  return withTransaction((draft) => {
    const section = findSection(draft, id);
    section.title = input.title;
    section.subtitle = input.subtitle;
    section.kind = input.kind;
    section.visible = input.visible;
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROFILE_SECTION",
      entitySlug: section.slug,
      commitHash: createCommitHash(`profile-section:${id}`),
      summary: `Memperbarui bagian profil "${input.title}".`
    });
    return structuredClone(section);
  });
}

export async function deleteProfileSection(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.profileSections.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Bagian profil");
    const [removed] = draft.profileSections.splice(index, 1);
    if (!removed) throw notFound("Bagian profil");
    normalizeOrders(draft.profileSections);
    appendAudit(draft, {
      action: "PURGE",
      entityType: "PROFILE_SECTION",
      entitySlug: removed.slug,
      commitHash: createCommitHash(`profile-section-del:${id}`),
      summary: `Menghapus bagian profil "${removed.title}" beserta ${removed.entries.length} entri.`
    });
  });
}

export async function moveProfileSection(
  id: string,
  direction: "UP" | "DOWN"
): Promise<ProfileSection[]> {
  return withTransaction((draft) => {
    moveItem(draft.profileSections, id, direction);
    const section = findSection(draft, id);
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "REORDER",
      entityType: "PROFILE_SECTION",
      entitySlug: section.slug,
      commitHash: createCommitHash(`profile-section-move:${id}:${Date.now()}`),
      summary: `Menggeser bagian profil "${section.title}" ke ${direction === "UP" ? "atas" : "bawah"}.`
    });
    return structuredClone(sortByOrder(draft.profileSections));
  });
}

export async function setProfileSectionVisibility(
  id: string,
  visible: boolean
): Promise<ProfileSection> {
  return withTransaction((draft) => {
    const section = findSection(draft, id);
    section.visible = visible;
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROFILE_SECTION",
      entitySlug: section.slug,
      commitHash: createCommitHash(`profile-section-visibility:${id}`),
      summary: `${visible ? "Menampilkan" : "Menyembunyikan"} bagian profil "${section.title}".`
    });
    return structuredClone(section);
  });
}

/* ----------------------------------------------------------------- ENTRI */

export async function createProfileEntry(
  sectionId: string,
  input: ProfileEntryInput
): Promise<ProfileEntry> {
  return withTransaction((draft) => {
    const section = findSection(draft, sectionId);
    assertEntryUrlRule(section, input);
    const entry: ProfileEntry = {
      id: createEntityId("pre"),
      title: input.title,
      subtitle: input.subtitle,
      meta: input.meta,
      location: input.location,
      startDate: input.startDate,
      endDate: input.endDate,
      isCurrent: input.isCurrent,
      description: input.description,
      fieldOfStudy: input.fieldOfStudy,
      notes: input.notes,
      url: input.url,
      imageUrl: input.imageUrl,
      logoUrl: input.logoUrl,
      authors: input.authors,
      publisher: input.publisher,
      tags: input.tags,
      visible: input.visible,
      sortOrder: nextOrder(section.entries),
      createdAt: new Date().toISOString()
    };
    section.entries.push(entry);
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "CREATE",
      entityType: "PROFILE_ENTRY",
      entitySlug: `${section.slug}/${normalizeSlug(input.title) || entry.id}`,
      commitHash: createCommitHash(entry.id),
      summary: `Menambahkan entri "${input.title}" pada bagian "${section.title}".`
    });
    return structuredClone(entry);
  });
}

export async function updateProfileEntry(
  sectionId: string,
  entryId: string,
  input: ProfileEntryInput
): Promise<ProfileEntry> {
  return withTransaction((draft) => {
    const section = findSection(draft, sectionId);
    const entry = findEntry(section, entryId);
    assertEntryUrlRule(section, input);
    entry.title = input.title;
    entry.subtitle = input.subtitle;
    entry.meta = input.meta;
    entry.location = input.location;
    entry.startDate = input.startDate;
    entry.endDate = input.endDate;
    entry.isCurrent = input.isCurrent;
    entry.description = input.description;
    entry.fieldOfStudy = input.fieldOfStudy;
    entry.notes = input.notes;
    entry.url = input.url;
    entry.imageUrl = input.imageUrl;
    entry.logoUrl = input.logoUrl;
    entry.authors = input.authors;
    entry.publisher = input.publisher;
    entry.tags = input.tags;
    entry.visible = input.visible;
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROFILE_ENTRY",
      entitySlug: `${section.slug}/${normalizeSlug(input.title) || entryId}`,
      commitHash: createCommitHash(`profile-entry:${entryId}`),
      summary: `Memperbarui entri "${input.title}" pada bagian "${section.title}".`
    });
    return structuredClone(entry);
  });
}

export async function deleteProfileEntry(sectionId: string, entryId: string): Promise<void> {
  await withTransaction((draft) => {
    const section = findSection(draft, sectionId);
    const index = section.entries.findIndex((item) => item.id === entryId);
    if (index < 0) throw notFound("Entri profil");
    const [removed] = section.entries.splice(index, 1);
    if (!removed) throw notFound("Entri profil");
    normalizeOrders(section.entries);
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "PURGE",
      entityType: "PROFILE_ENTRY",
      entitySlug: `${section.slug}/${normalizeSlug(removed.title) || entryId}`,
      commitHash: createCommitHash(`profile-entry-del:${entryId}`),
      summary: `Menghapus entri "${removed.title}" dari bagian "${section.title}".`
    });
  });
}

export async function moveProfileEntry(
  sectionId: string,
  entryId: string,
  direction: "UP" | "DOWN"
): Promise<ProfileEntry[]> {
  return withTransaction((draft) => {
    const section = findSection(draft, sectionId);
    moveItem(section.entries, entryId, direction);
    const entry = findEntry(section, entryId);
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "REORDER",
      entityType: "PROFILE_ENTRY",
      entitySlug: `${section.slug}/${normalizeSlug(entry.title) || entryId}`,
      commitHash: createCommitHash(`profile-entry-move:${entryId}:${Date.now()}`),
      summary: `Menggeser entri "${entry.title}" pada bagian "${section.title}".`
    });
    return structuredClone(sortByOrder(section.entries));
  });
}

export async function setProfileEntryVisibility(
  sectionId: string,
  entryId: string,
  visible: boolean
): Promise<ProfileEntry> {
  return withTransaction((draft) => {
    const section = findSection(draft, sectionId);
    const entry = findEntry(section, entryId);
    entry.visible = visible;
    section.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROFILE_ENTRY",
      entitySlug: `${section.slug}/${normalizeSlug(entry.title) || entryId}`,
      commitHash: createCommitHash(`profile-entry-visibility:${entryId}`),
      summary: `${visible ? "Menampilkan" : "Menyembunyikan"} entri "${entry.title}".`
    });
    return structuredClone(entry);
  });
}

/** Validasi integritas: tidak boleh ada slug bagian ganda. */
export function assertProfileIntegrity(sections: ProfileSection[]): void {
  const seen = new Set<string>();
  for (const section of sections) {
    if (seen.has(section.slug)) {
      throw new DomainError(409, "DUPLICATE_PROFILE_SECTION", `Bagian "${section.title}" ganda.`);
    }
    seen.add(section.slug);
  }
}
