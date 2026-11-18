import type {
  Article,
  Certification,
  Database,
  Experience,
  Skill
} from "@/contracts/domain";
import type {
  ArticleInput,
  CertificationInput,
  ExperienceInput,
  SkillInput
} from "@/contracts/content.contract";
import { readingTimeFrom } from "@/contracts/primitives";
import { readDatabase, withTransaction } from "@/server/db/store";
import { DomainError, conflictSlug, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";
import { revalidatePortfolioCache } from "@/server/db/cache";

/** Repositori konten publik beranda dan profil. */

function nextOrder(items: ReadonlyArray<{ sortOrder: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ------------------------------------------------------------------ BACA (langsung dari Supabase, tanpa cache tambahan) */

export async function listExperiences(): Promise<Experience[]> {
  return sortByOrder((await readDatabase()).experiences);
}

export async function listCertifications(): Promise<Certification[]> {
  return sortByOrder((await readDatabase()).certifications);
}

export async function listSkills(): Promise<Skill[]> {
  return sortByOrder((await readDatabase()).skills);
}

export async function listArticles(publishedOnly = true): Promise<Article[]> {
  const articles = (await readDatabase()).articles;
  const filtered = publishedOnly
    ? articles.filter((article) => article.status === "PUBLISHED")
    : articles;
  return [...filtered].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const article = (await readDatabase()).articles.find(
    (item) => item.slug === slug && item.status === "PUBLISHED"
  );
  return article ? structuredClone(article) : null;
}

/* ---------------------------------------------------------------- REKAM JEJAK */

export async function createExperience(input: ExperienceInput): Promise<Experience> {
  const result = await withTransaction((draft) => {
    const timestamp = new Date().toISOString();
    const entity: Experience = {
      id: createEntityId("exp"),
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate,
      isCurrent: input.isCurrent,
      role: input.role,
      organization: input.organization,
      type: input.type,
      highlights: input.highlights,
      employmentType: input.employmentType,
      location: input.location,
      workMode: input.workMode,
      description: input.description,
      skills: input.skills,
      logoUrl: input.logoUrl,
      organizationUrl: input.organizationUrl,
      sortOrder: nextOrder(draft.experiences),
      createdAt: timestamp
    };
    draft.experiences.push(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "EXPERIENCE",
      entitySlug: `${input.organization} — ${input.role}`.slice(0, 80),
      commitHash: createCommitHash(entity.id),
      summary: `Menambahkan pengalaman "${input.role}" di ${input.organization}.`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function updateExperience(id: string, input: ExperienceInput): Promise<Experience> {
  const result = await withTransaction((draft) => {
    const entity = draft.experiences.find((item) => item.id === id);
    if (!entity) throw notFound("Pengalaman");
    entity.period = input.period;
    entity.startDate = input.startDate;
    entity.endDate = input.endDate;
    entity.isCurrent = input.isCurrent;
    entity.role = input.role;
    entity.organization = input.organization;
    entity.type = input.type;
    entity.highlights = input.highlights;
    entity.employmentType = input.employmentType;
    entity.location = input.location;
    entity.workMode = input.workMode;
    entity.description = input.description;
    entity.skills = input.skills;
    entity.logoUrl = input.logoUrl;
    entity.organizationUrl = input.organizationUrl;
    const commitHash = createCommitHash(`exp:${id}`);
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "EXPERIENCE",
      entitySlug: `${input.organization} — ${input.role}`.slice(0, 80),
      commitHash,
      summary: `Memperbarui pengalaman "${input.role}".`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function deleteExperience(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.experiences.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Pengalaman");
    const [removed] = draft.experiences.splice(index, 1);
    if (!removed) throw notFound("Pengalaman");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "EXPERIENCE",
      entitySlug: `${removed.organization} — ${removed.role}`.slice(0, 80),
      commitHash: createCommitHash(`exp-del:${id}`),
      summary: `Menghapus pengalaman "${removed.role}".`
    });
  });
  await revalidatePortfolioCache();
}

/* -------------------------------------------------------------- SERTIFIKASI */

export async function createCertification(input: CertificationInput): Promise<Certification> {
  const result = await withTransaction((draft) => {
    const entity: Certification = {
      id: createEntityId("cert"),
      title: input.title,
      issuer: input.issuer,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      credentialId: input.credentialId,
      skills: input.skills,
      imageUrl: input.imageUrl,
      issuerLogoUrl: input.issuerLogoUrl,
      sortOrder: nextOrder(draft.certifications),
      createdAt: new Date().toISOString()
    };
    draft.certifications.push(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "CERTIFICATION",
      entitySlug: input.credentialId || input.title.slice(0, 60),
      commitHash: createCommitHash(entity.id),
      summary: `Menambahkan sertifikasi "${input.title}" dari ${input.issuer}.`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function updateCertification(
  id: string,
  input: CertificationInput
): Promise<Certification> {
  const result = await withTransaction((draft) => {
    const entity = draft.certifications.find((item) => item.id === id);
    if (!entity) throw notFound("Sertifikasi");
    entity.title = input.title;
    entity.issuer = input.issuer;
    entity.issueDate = input.issueDate;
    entity.expiryDate = input.expiryDate;
    entity.credentialId = input.credentialId;
    entity.skills = input.skills;
    entity.imageUrl = input.imageUrl;
    entity.issuerLogoUrl = input.issuerLogoUrl;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "CERTIFICATION",
      entitySlug: input.credentialId || input.title.slice(0, 60),
      commitHash: createCommitHash(`cert:${id}`),
      summary: `Memperbarui sertifikasi "${input.title}".`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function deleteCertification(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.certifications.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Sertifikasi");
    const [removed] = draft.certifications.splice(index, 1);
    if (!removed) throw notFound("Sertifikasi");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "CERTIFICATION",
      entitySlug: removed.credentialId || removed.title.slice(0, 60),
      commitHash: createCommitHash(`cert-del:${id}`),
      summary: `Menghapus sertifikasi "${removed.title}".`
    });
  });
  await revalidatePortfolioCache();
}

/* ----------------------------------------------------------------- KEAHLIAN */

export async function createSkill(input: SkillInput): Promise<Skill> {
  const result = await withTransaction((draft) => {
    const entity: Skill = {
      id: createEntityId("sk"),
      name: input.name,
      category: input.category,
      level: input.level,
      context: input.context,
      endorsements: input.endorsements,
      pinned: input.pinned,
      sortOrder: nextOrder(draft.skills),
      createdAt: new Date().toISOString()
    };
    draft.skills.push(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "SKILL",
      entitySlug: input.name.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(entity.id),
      summary: `Menambahkan keahlian "${input.name}" (${input.level}%).`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function updateSkill(id: string, input: SkillInput): Promise<Skill> {
  const result = await withTransaction((draft) => {
    const entity = draft.skills.find((item) => item.id === id);
    if (!entity) throw notFound("Keahlian");
    entity.name = input.name;
    entity.category = input.category;
    entity.level = input.level;
    entity.context = input.context;
    entity.endorsements = input.endorsements;
    entity.pinned = input.pinned;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "SKILL",
      entitySlug: input.name.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(`skill:${id}`),
      summary: `Memperbarui keahlian "${input.name}" menjadi ${input.level}%.`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function deleteSkill(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.skills.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Keahlian");
    const [removed] = draft.skills.splice(index, 1);
    if (!removed) throw notFound("Keahlian");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "SKILL",
      entitySlug: removed.name.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(`skill-del:${id}`),
      summary: `Menghapus keahlian "${removed.name}".`
    });
  });
  await revalidatePortfolioCache();
}

/* -------------------------------------------------------------------- JURNAL */

function assertArticleSlug(draft: Database, slug: string, excludeId?: string): void {
  const duplicate = draft.articles.find(
    (article) => article.slug === slug && article.id !== excludeId
  );
  if (duplicate) throw conflictSlug(slug);
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const result = await withTransaction((draft) => {
    assertArticleSlug(draft, input.slug);
    const timestamp = new Date().toISOString();
    const entity: Article = {
      id: createEntityId("art"),
      slug: input.slug,
      title: input.title,
      category: input.category,
      readTime: readingTimeFrom(input.content),
      publishedAt: input.publishedAt || timestamp.slice(0, 10),
      summary: input.summary,
      content: input.content,
      externalUrl: input.externalUrl,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    draft.articles.push(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "ARTICLE",
      entitySlug: input.slug,
      commitHash: createCommitHash(entity.id),
      summary: `Menulis artikel "${input.title}".`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  const result = await withTransaction((draft) => {
    const entity = draft.articles.find((item) => item.id === id);
    if (!entity) throw notFound("Artikel");
    assertArticleSlug(draft, input.slug, id);
    entity.slug = input.slug;
    entity.title = input.title;
    entity.category = input.category;
    entity.publishedAt = input.publishedAt || entity.publishedAt;
    entity.summary = input.summary;
    entity.content = input.content;
    entity.externalUrl = input.externalUrl;
    entity.readTime = readingTimeFrom(input.content);
    entity.status = input.status;
    entity.updatedAt = new Date().toISOString();
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "ARTICLE",
      entitySlug: input.slug,
      commitHash: createCommitHash(`article:${id}`),
      summary: `Memperbarui artikel "${input.title}".`
    });
    return structuredClone(entity);
  });
  await revalidatePortfolioCache();
  return result;
}

export async function deleteArticle(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.articles.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Artikel");
    const [removed] = draft.articles.splice(index, 1);
    if (!removed) throw notFound("Artikel");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "ARTICLE",
      entitySlug: removed.slug,
      commitHash: createCommitHash(`article-del:${id}`),
      summary: `Menghapus artikel "${removed.title}".`
    });
  });
  await revalidatePortfolioCache();
}

/* ------------------------------------------------------- NORMALISASI GLOBAL */

export function ensureUniqueSkillNames(skills: Skill[]): void {
  const seen = new Set<string>();
  for (const skill of skills) {
    if (seen.has(skill.name.toLowerCase())) {
      throw new DomainError(409, "DUPLICATE_SKILL", `Keahlian "${skill.name}" sudah ada.`);
    }
    seen.add(skill.name.toLowerCase());
  }
}
