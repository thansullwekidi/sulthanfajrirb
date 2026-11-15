import type {
  Article,
  Certification,
  Database,
  Experience,
  Skill,
  Testimonial
} from "@/contracts/domain";
import type {
  ArticleInput,
  CertificationInput,
  ExperienceInput,
  SkillInput,
  TestimonialInput
} from "@/contracts/content.contract";
import { readingTimeFrom } from "@/contracts/primitives";
import { readDatabase, withTransaction } from "@/server/db/store";
import { DomainError, conflictSlug, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/** Repositori konten pendukung: rekam jejak, sertifikasi, keahlian, jurnal, testimoni. */

function nextOrder(items: ReadonlyArray<{ sortOrder: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ------------------------------------------------------------------ BACA */

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

export async function listTestimonials(visibleOnly = true): Promise<Testimonial[]> {
  const testimonials = (await readDatabase()).testimonials;
  const filtered = visibleOnly ? testimonials.filter((item) => item.isVisible) : testimonials;
  return sortByOrder(filtered);
}

/* ---------------------------------------------------------------- REKAM JEJAK */

export async function createExperience(input: ExperienceInput): Promise<Experience> {
  return withTransaction((draft) => {
    const timestamp = new Date().toISOString();
    const entity: Experience = {
      id: createEntityId("exp"),
      period: input.period,
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
}

export async function updateExperience(id: string, input: ExperienceInput): Promise<Experience> {
  return withTransaction((draft) => {
    const entity = draft.experiences.find((item) => item.id === id);
    if (!entity) throw notFound("Pengalaman");
    entity.period = input.period;
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
}

/* -------------------------------------------------------------- SERTIFIKASI */

export async function createCertification(input: CertificationInput): Promise<Certification> {
  return withTransaction((draft) => {
    const entity: Certification = {
      id: createEntityId("cert"),
      title: input.title,
      issuer: input.issuer,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      credentialId: input.credentialId,
      verifyUrl: input.verifyUrl,
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
}

export async function updateCertification(
  id: string,
  input: CertificationInput
): Promise<Certification> {
  return withTransaction((draft) => {
    const entity = draft.certifications.find((item) => item.id === id);
    if (!entity) throw notFound("Sertifikasi");
    entity.title = input.title;
    entity.issuer = input.issuer;
    entity.issueDate = input.issueDate;
    entity.expiryDate = input.expiryDate;
    entity.credentialId = input.credentialId;
    entity.verifyUrl = input.verifyUrl;
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
}

/* ----------------------------------------------------------------- KEAHLIAN */

export async function createSkill(input: SkillInput): Promise<Skill> {
  return withTransaction((draft) => {
    const entity: Skill = {
      id: createEntityId("sk"),
      name: input.name,
      category: input.category,
      level: input.level,
      context: input.context,
      endorsements: input.endorsements,
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
}

export async function updateSkill(id: string, input: SkillInput): Promise<Skill> {
  return withTransaction((draft) => {
    const entity = draft.skills.find((item) => item.id === id);
    if (!entity) throw notFound("Keahlian");
    entity.name = input.name;
    entity.category = input.category;
    entity.level = input.level;
    entity.context = input.context;
    entity.endorsements = input.endorsements;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "SKILL",
      entitySlug: input.name.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(`skill:${id}`),
      summary: `Memperbarui keahlian "${input.name}" menjadi ${input.level}%.`
    });
    return structuredClone(entity);
  });
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
}

/* -------------------------------------------------------------------- JURNAL */

function assertArticleSlug(draft: Database, slug: string, excludeId?: string): void {
  const duplicate = draft.articles.find(
    (article) => article.slug === slug && article.id !== excludeId
  );
  if (duplicate) throw conflictSlug(slug);
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  return withTransaction((draft) => {
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
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  return withTransaction((draft) => {
    const entity = draft.articles.find((item) => item.id === id);
    if (!entity) throw notFound("Artikel");
    assertArticleSlug(draft, input.slug, id);
    entity.slug = input.slug;
    entity.title = input.title;
    entity.category = input.category;
    entity.publishedAt = input.publishedAt || entity.publishedAt;
    entity.summary = input.summary;
    entity.content = input.content;
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
}

/* ----------------------------------------------------------------- TESTIMONI */

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial> {
  return withTransaction((draft) => {
    const entity: Testimonial = {
      id: createEntityId("tst"),
      author: input.author,
      role: input.role,
      organization: input.organization,
      relationship: input.relationship,
      quote: input.quote,
      verifiedTag: input.verifiedTag,
      date: input.date || new Date().toISOString().slice(0, 10),
      isVisible: input.isVisible,
      sortOrder: nextOrder(draft.testimonials),
      createdAt: new Date().toISOString()
    };
    draft.testimonials.push(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "TESTIMONIAL",
      entitySlug: input.author.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(entity.id),
      summary: `Menambahkan rekomendasi dari ${input.author} (${input.organization}).`
    });
    return structuredClone(entity);
  });
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput
): Promise<Testimonial> {
  return withTransaction((draft) => {
    const entity = draft.testimonials.find((item) => item.id === id);
    if (!entity) throw notFound("Rekomendasi");
    entity.author = input.author;
    entity.role = input.role;
    entity.organization = input.organization;
    entity.relationship = input.relationship;
    entity.quote = input.quote;
    entity.verifiedTag = input.verifiedTag;
    entity.date = input.date || entity.date;
    entity.isVisible = input.isVisible;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "TESTIMONIAL",
      entitySlug: input.author.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(`testimonial:${id}`),
      summary: `Memperbarui rekomendasi dari ${input.author}.`
    });
    return structuredClone(entity);
  });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.testimonials.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Rekomendasi");
    const [removed] = draft.testimonials.splice(index, 1);
    if (!removed) throw notFound("Rekomendasi");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "TESTIMONIAL",
      entitySlug: removed.author.toLowerCase().replace(/\s+/g, "-"),
      commitHash: createCommitHash(`testimonial-del:${id}`),
      summary: `Menghapus rekomendasi dari ${removed.author}.`
    });
  });
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
