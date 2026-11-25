import type {
  AdminSnapshot,
  Article,
  AuditLog,
  Database,
  Inquiry,
  MediaAsset
} from "@/contracts/domain";
import type { DatabaseImport } from "@/contracts/database.contract";
import { readingTimeFrom } from "@/contracts/primitives";
import { buildSeedDatabase } from "@/server/db/seed";
import { readDatabase, withTransaction } from "@/server/db/store";
import { revalidatePortfolioCache } from "@/server/db/cache";
import { appendAudit, createCommitHash } from "./audit.repository";
import { detachMediaReferences, purgeMediaFiles } from "./media.repository";

export async function buildAdminSnapshot(): Promise<AdminSnapshot> {
  const database = await readDatabase();
  return {
    database,
    counts: {
      articles: database.articles.length,
      skills: database.skills.length,
      profileSections: database.profileSections.length,
      profileEntries: database.profileSections.reduce(
        (sum, section) => sum + section.entries.length,
        0
      ),
      socialLinks: database.socialLinks.length,
      mediaAssets: database.mediaAssets.length,
      inquiriesUnread: database.inquiries.filter((i) => i.status === "UNREAD").length,
      auditLogs: database.auditLogs.length
    },
    generatedAt: new Date().toISOString()
  };
}

export async function exportDatabase(): Promise<{ database: Database; filename: string }> {
  const database = await readDatabase();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return {
    database,
    filename: `portofolio-sulthan-${stamp}.json`
  };
}

export async function importDatabase(input: DatabaseImport): Promise<Database> {
  const now = new Date().toISOString();

  const articles: Article[] = input.articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    readTime: article.readTime ?? readingTimeFrom(article.content),
    publishedAt: article.publishedAt || now.slice(0, 10),
    summary: article.summary,
    content: article.content,
    externalUrl: article.externalUrl,
    status: article.status,
    createdAt: article.createdAt ?? now,
    updatedAt: article.updatedAt ?? article.createdAt ?? now
  }));

  const inquiries: Inquiry[] = (input.inquiries ?? []).map((inquiry) => ({
    id: inquiry.id,
    senderName: inquiry.senderName,
    senderEmail: inquiry.senderEmail,
    organization: inquiry.organization,
    category: inquiry.category,
    budgetTimeline: inquiry.budgetTimeline,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt
  }));

  const auditLogs: AuditLog[] = input.auditLogs ?? [];

  const next: Database = {
    schemaVersion: 1,
    siteConfig: { ...input.siteConfig, updatedAt: now },
    experiences: input.experiences.map((experience, index) => ({
      id: experience.id,
      period: experience.period,
      startDate: experience.startDate ?? "",
      endDate: experience.endDate ?? "",
      isCurrent: experience.isCurrent ?? false,
      role: experience.role,
      organization: experience.organization,
      type: experience.type,
      highlights: experience.highlights,
      employmentType: experience.employmentType,
      location: experience.location,
      workMode: experience.workMode,
      description: experience.description,
      skills: experience.skills,
      logoUrl: experience.logoUrl,
      organizationUrl: experience.organizationUrl,
      sortOrder: experience.sortOrder ?? index + 1,
      createdAt: experience.createdAt ?? now
    })),
    certifications: input.certifications.map((certification, index) => ({
      id: certification.id,
      title: certification.title,
      issuer: certification.issuer,
      issueDate: certification.issueDate,
      expiryDate: certification.expiryDate,
      credentialId: certification.credentialId,
      skills: certification.skills,
      imageUrl: certification.imageUrl,
      issuerLogoUrl: certification.issuerLogoUrl,
      sortOrder: certification.sortOrder ?? index + 1,
      createdAt: certification.createdAt ?? now
    })),
    skills: input.skills.map((skill, index) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      level: skill.level,
      context: skill.context,
      endorsements: skill.endorsements,
      pinned: skill.pinned ?? false,
      sortOrder: skill.sortOrder ?? index + 1,
      createdAt: skill.createdAt ?? now
    })),
    articles,
    profileSections: (input.profileSections ?? buildSeedDatabase().profileSections).map(
      (section, index) => ({
        id: section.id,
        slug: section.slug,
        title: section.title,
        subtitle: section.subtitle,
        kind: section.kind,
        visible: section.visible,
        sortOrder: section.sortOrder ?? index + 1,
        entries: section.entries.map((entry, entryIndex) => ({
          id: entry.id,
          title: entry.title,
          subtitle: entry.subtitle,
          meta: entry.meta,
          location: entry.location,
          startDate: entry.startDate,
          endDate: entry.endDate,
          isCurrent: entry.isCurrent,
          description: entry.description,
          fieldOfStudy: entry.fieldOfStudy ?? "",
          notes: entry.notes ?? "",
          url: entry.url,
          imageUrl: entry.imageUrl,
          logoUrl: entry.logoUrl,
          authors: entry.authors,
          publisher: entry.publisher,
          tags: entry.tags,
          visible: entry.visible,
          sortOrder: entry.sortOrder ?? entryIndex + 1,
          createdAt: entry.createdAt ?? now
        })),
        createdAt: section.createdAt ?? now,
        updatedAt: section.updatedAt ?? section.createdAt ?? now
      })
    ),
    socialLinks: (input.socialLinks ?? []).map((link, index) => ({
      id: link.id,
      platform: link.platform,
      label: link.label,
      url: link.url,
      visible: link.visible,
      sortOrder: link.sortOrder ?? index + 1,
      createdAt: link.createdAt ?? now
    })),
    mediaAssets: (input.mediaAssets ?? []).map((asset) => ({
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      purpose: asset.purpose,
      url: asset.url,
      createdAt: asset.createdAt ?? now
    })),
    inquiries,
    auditLogs
  };

  let removedMedia: MediaAsset[] = [];
  const imported = await withTransaction((draft) => {
    const replacementAssets = new Map(next.mediaAssets.map((asset) => [asset.id, asset.mimeType]));
    removedMedia = draft.mediaAssets.filter(
      (asset) => replacementAssets.get(asset.id) !== asset.mimeType
    );
    draft.schemaVersion = 1;
    draft.siteConfig = next.siteConfig;
    draft.experiences = next.experiences;
    draft.certifications = next.certifications;
    draft.skills = next.skills;
    draft.articles = next.articles;
    draft.profileSections = next.profileSections;
    draft.socialLinks = next.socialLinks;
    draft.mediaAssets = next.mediaAssets;
    draft.inquiries = next.inquiries;
    draft.auditLogs = next.auditLogs;
    detachMediaReferences(draft, new Set(removedMedia.map((asset) => asset.url)));

    appendAudit(draft, {
      action: "IMPORT",
      entityType: "DATABASE",
      entitySlug: "portofolio-json",
      commitHash: createCommitHash(`import:${Date.now()}`),
      summary: `Mengimpor basis data: ${next.articles.length} artikel, ${next.skills.length} keahlian.`
    });

    return structuredClone(draft);
  });
  await purgeMediaFiles(removedMedia);
  await revalidatePortfolioCache();
  return imported;
}

export async function resetDatabase(): Promise<Database> {
  const seed = buildSeedDatabase();
  seed.siteConfig.updatedAt = new Date().toISOString();

  let removedMedia: MediaAsset[] = [];
  const reset = await withTransaction((draft) => {
    removedMedia = [...draft.mediaAssets];
    draft.schemaVersion = 1;
    draft.siteConfig = seed.siteConfig;
    draft.experiences = seed.experiences;
    draft.certifications = seed.certifications;
    draft.skills = seed.skills;
    draft.articles = seed.articles;
    draft.profileSections = seed.profileSections;
    draft.socialLinks = seed.socialLinks;
    draft.mediaAssets = seed.mediaAssets;
    draft.inquiries = seed.inquiries;
    draft.auditLogs = seed.auditLogs;
    detachMediaReferences(draft, new Set(removedMedia.map((asset) => asset.url)));

    appendAudit(draft, {
      action: "RESET",
      entityType: "DATABASE",
      entitySlug: "data-standar",
      commitHash: createCommitHash(`reset:${Date.now()}`),
      summary: "Memulihkan basis data ke data standar pabrik."
    });

    return structuredClone(draft);
  });
  await purgeMediaFiles(removedMedia);
  await revalidatePortfolioCache();
  return reset;
}

/** Daftar ID entitas untuk keperluan diagnostik dan pengujian integritas. */
export async function collectEntityIds(): Promise<Record<string, string[]>> {
  const database = await readDatabase();
  return {
    experiences: database.experiences.map((item) => item.id),
    certifications: database.certifications.map((item) => item.id),
    skills: database.skills.map((item) => item.id),
    articles: database.articles.map((item) => item.id),
    profileSections: database.profileSections.map((item) => item.id),
    socialLinks: database.socialLinks.map((item) => item.id),
    mediaAssets: database.mediaAssets.map((item) => item.id),
    inquiries: database.inquiries.map((item) => item.id),
    auditLogs: database.auditLogs.map((item) => item.id)
  };
}
