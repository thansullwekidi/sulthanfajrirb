import { z } from "zod";
import {
  envelopeError,
  envelopeOk,
  type ApiResponse
} from "@/contracts/api-envelope";
import type {
  AdminSnapshot,
  Article,
  Certification,
  CollectionName,
  Experience,
  Inquiry,
  InquiryStatus,
  Project,
  SiteConfig,
  Skill,
  Testimonial
} from "@/contracts/domain";
import type { AdminSession } from "@/contracts/auth.contract";
import { databaseImportSchema } from "@/contracts/database.contract";
import {
  articleInputSchema,
  certificationInputSchema,
  experienceInputSchema,
  skillInputSchema,
  testimonialInputSchema
} from "@/contracts/content.contract";
import { inquiryInputSchema, inquiryStatusSchema } from "@/contracts/inquiry.contract";
import { siteConfigInputSchema } from "@/contracts/config.contract";
import { profileMutationSchema } from "@/contracts/profile.contract";
import {
  mediaDeleteSchema,
  mediaUploadSchema,
  socialMutationSchema
} from "@/contracts/media.contract";
import {
  projectInputSchema,
  projectMoveSchema,
  projectPurgeSchema
} from "@/contracts/project.contract";
import { loginSchema } from "@/contracts/auth.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";
import { DomainError } from "@/server/errors";
import { getAdminSession, issueSessionToken, verifyPassphrase } from "@/server/services/auth.service";
import {
  archiveProject,
  createProject,
  moveProject,
  purgeProject,
  restoreProject,
  setProjectFeatured,
  updateProject
} from "@/server/repositories/project.repository";
import {
  createArticle,
  createCertification,
  createExperience,
  createSkill,
  createTestimonial,
  deleteArticle,
  deleteCertification,
  deleteExperience,
  deleteSkill,
  deleteTestimonial,
  updateArticle,
  updateCertification,
  updateExperience,
  updateSkill,
  updateTestimonial
} from "@/server/repositories/content.repository";
import {
  createInquiry,
  deleteInquiry,
  setInquiryStatus
} from "@/server/repositories/inquiry.repository";
import {
  createProfileEntry,
  createProfileSection,
  deleteProfileEntry,
  deleteProfileSection,
  moveProfileEntry,
  moveProfileSection,
  setProfileEntryVisibility,
  setProfileSectionVisibility,
  updateProfileEntry,
  updateProfileSection
} from "@/server/repositories/profile.repository";
import { updateSiteConfig } from "@/server/repositories/config.repository";
import {
  deleteMedia,
  listMediaAssets,
  mediaUsage,
  saveMedia
} from "@/server/repositories/media.repository";
import {
  createSocialLink,
  deleteSocialLink,
  listSocialLinks,
  moveSocialLink,
  setSocialLinkVisibility,
  updateSocialLink
} from "@/server/repositories/social.repository";
import {
  buildAdminSnapshot,
  exportDatabase,
  importDatabase,
  resetDatabase
} from "@/server/repositories/database.repository";

/**
 * LAPISAN 3 — Controller / Action Handler.
 * Tanggung jawab: otorisasi sesi, validasi kontrak, pemanggilan repositori,
 * dan pembungkusan amplop respons. Tidak ada akses berkas langsung di sini.
 */

const TAGS = {
  projects: ["projects:catalog", "kpi:overview", "resume:ats", "works:featured"],
  content: ["trajectory:public", "resume:ats", "skills:public"],
  articles: ["journal:public"],
  testimonials: ["endorsements:public"],
  inquiries: ["inbox:admin"],
  config: ["site:config", "resume:ats", "kpi:overview"],
  media: ["media:library", "site:config", "trajectory:public"],
  social: ["social:links", "site:config"],
  database: ["*"]
} as const;

function fieldErrors(error: z.ZodError): Record<string, string> {
  return fieldErrorsFromZod(error);
}

export function parsePayload<S extends z.ZodTypeAny>(schema: S, payload: unknown): z.infer<S> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new DomainError(
      422,
      "VALIDATION_FAILED",
      "Periksa kembali kolom yang ditandai. Data belum disimpan.",
      fieldErrors(result.error)
    );
  }
  return result.data;
}

function toErrorEnvelope(error: unknown): ApiResponse<never> {
  if (error instanceof DomainError) {
    return envelopeError(error.status, error.code, error.message, error.fields);
  }
  if (error instanceof z.ZodError) {
    return envelopeError(
      422,
      "VALIDATION_FAILED",
      "Kontrak skema tidak terpenuhi.",
      fieldErrors(error)
    );
  }
  console.error("[studio-api] kegagalan tak terduga:", error);
  return envelopeError(
    500,
    "INTERNAL_ERROR",
    "Terjadi kesalahan internal. Mutasi dibatalkan dan data lama tetap utuh."
  );
}

/** Gerbang otorisasi: seluruh mutasi CMS wajib melewati fungsi ini. */
export async function runAdmin<T>(
  handler: (session: AdminSession) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  const session = await getAdminSession();
  if (!session) {
    return envelopeError(
      403,
      "SESSION_REQUIRED",
      "Sesi admin tidak valid atau telah berakhir. Masuk kembali ke Studio."
    );
  }
  try {
    return await handler(session);
  } catch (error) {
    return toErrorEnvelope(error) as ApiResponse<T>;
  }
}

/** Hanya untuk endpoint publik (formulir kontak). */
export async function runPublic<T>(handler: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await handler();
  } catch (error) {
    return toErrorEnvelope(error) as ApiResponse<T>;
  }
}

/* ------------------------------------------------------------------ SESI */

export async function loginAction(
  payload: unknown
): Promise<ApiResponse<{ session: AdminSession; token: string }>> {
  return runPublic(async () => {
    const input = parsePayload(loginSchema, payload);
    if (!verifyPassphrase(input.passphrase)) {
      throw new DomainError(403, "INVALID_PASSPHRASE", "Frasa sandi admin tidak cocok.", {
        passphrase: "Frasa sandi salah."
      });
    }
    const { token, session } = issueSessionToken();
    return envelopeOk({ session, token }, { status: 200 });
  });
}

export async function sessionAction(): Promise<ApiResponse<AdminSession | null>> {
  const session = await getAdminSession();
  return envelopeOk(session);
}

/* ------------------------------------------------------------- SNAPSHOT */

export async function snapshotAction(): Promise<ApiResponse<AdminSnapshot>> {
  return runAdmin(async () => envelopeOk(await buildAdminSnapshot()));
}

/* --------------------------------------------------------------- PROYEK */

export async function createProjectAction(payload: unknown): Promise<ApiResponse<Project>> {
  return runAdmin(async () => {
    const input = parsePayload(projectInputSchema, payload);
    const project = await createProject(input);
    return envelopeOk(project, { status: 201, invalidatedTags: [...TAGS.projects] });
  });
}

export async function updateProjectAction(
  id: string,
  payload: unknown
): Promise<ApiResponse<Project>> {
  return runAdmin(async () => {
    const input = parsePayload(projectInputSchema, payload);
    const project = await updateProject(id, input);
    return envelopeOk(project, { invalidatedTags: [...TAGS.projects] });
  });
}

export async function archiveProjectAction(id: string): Promise<ApiResponse<Project>> {
  return runAdmin(async () => {
    const project = await archiveProject(id);
    return envelopeOk(project, { invalidatedTags: [...TAGS.projects] });
  });
}

export async function restoreProjectAction(id: string): Promise<ApiResponse<Project>> {
  return runAdmin(async () => {
    const project = await restoreProject(id);
    return envelopeOk(project, { invalidatedTags: [...TAGS.projects] });
  });
}

export async function purgeProjectAction(
  id: string,
  payload: unknown
): Promise<ApiResponse<{ slug: string }>> {
  return runAdmin(async () => {
    const input = parsePayload(projectPurgeSchema, payload);
    const result = await purgeProject(id, input.confirmSlug);
    return envelopeOk(result, { invalidatedTags: [...TAGS.projects] });
  });
}

export async function moveProjectAction(
  id: string,
  payload: unknown
): Promise<ApiResponse<Project[]>> {
  return runAdmin(async () => {
    const input = parsePayload(projectMoveSchema, payload);
    const projects = await moveProject(id, input.direction);
    return envelopeOk(projects, { invalidatedTags: [...TAGS.projects] });
  });
}

export async function featureProjectAction(
  id: string,
  featured: boolean
): Promise<ApiResponse<Project>> {
  return runAdmin(async () => {
    const project = await setProjectFeatured(id, featured);
    return envelopeOk(project, { invalidatedTags: [...TAGS.projects] });
  });
}

/* ---------------------------------------------------- KOLEKSI KONTEN CRUD */

export async function createCollectionAction(
  entity: CollectionName,
  payload: unknown
): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    switch (entity) {
      case "experiences": {
        const data: Experience = await createExperience(
          parsePayload(experienceInputSchema, payload)
        );
        return envelopeOk(data, { status: 201, invalidatedTags: [...TAGS.content] });
      }
      case "certifications": {
        const data: Certification = await createCertification(
          parsePayload(certificationInputSchema, payload)
        );
        return envelopeOk(data, { status: 201, invalidatedTags: [...TAGS.content] });
      }
      case "skills": {
        const data: Skill = await createSkill(parsePayload(skillInputSchema, payload));
        return envelopeOk(data, { status: 201, invalidatedTags: [...TAGS.content] });
      }
      case "articles": {
        const data: Article = await createArticle(parsePayload(articleInputSchema, payload));
        return envelopeOk(data, { status: 201, invalidatedTags: [...TAGS.articles] });
      }
      case "testimonials": {
        const data: Testimonial = await createTestimonial(
          parsePayload(testimonialInputSchema, payload)
        );
        return envelopeOk(data, { status: 201, invalidatedTags: [...TAGS.testimonials] });
      }
    }
  });
}

export async function updateCollectionAction(
  entity: CollectionName,
  id: string,
  payload: unknown
): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    switch (entity) {
      case "experiences": {
        const data = await updateExperience(id, parsePayload(experienceInputSchema, payload));
        return envelopeOk(data, { invalidatedTags: [...TAGS.content] });
      }
      case "certifications": {
        const data = await updateCertification(
          id,
          parsePayload(certificationInputSchema, payload)
        );
        return envelopeOk(data, { invalidatedTags: [...TAGS.content] });
      }
      case "skills": {
        const data = await updateSkill(id, parsePayload(skillInputSchema, payload));
        return envelopeOk(data, { invalidatedTags: [...TAGS.content] });
      }
      case "articles": {
        const data = await updateArticle(id, parsePayload(articleInputSchema, payload));
        return envelopeOk(data, { invalidatedTags: [...TAGS.articles] });
      }
      case "testimonials": {
        const data = await updateTestimonial(
          id,
          parsePayload(testimonialInputSchema, payload)
        );
        return envelopeOk(data, { invalidatedTags: [...TAGS.testimonials] });
      }
    }
  });
}

export async function deleteCollectionAction(
  entity: CollectionName,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  return runAdmin(async () => {
    switch (entity) {
      case "experiences":
        await deleteExperience(id);
        break;
      case "certifications":
        await deleteCertification(id);
        break;
      case "skills":
        await deleteSkill(id);
        break;
      case "articles":
        await deleteArticle(id);
        break;
      case "testimonials":
        await deleteTestimonial(id);
        break;
    }
    return envelopeOk(
      { id },
      {
        invalidatedTags:
          entity === "articles"
            ? [...TAGS.articles]
            : entity === "testimonials"
              ? [...TAGS.testimonials]
              : [...TAGS.content]
      }
    );
  });
}

/* --------------------------------------------------------- BAGIAN PROFIL */

export async function profileMutationAction(
  payload: unknown
): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    const input = parsePayload(profileMutationSchema, payload);
    const tags = [...TAGS.content];

    switch (input.action) {
      case "section.create": {
        const data = await createProfileSection(input.section);
        return envelopeOk(data, { status: 201, invalidatedTags: tags });
      }
      case "section.update": {
        const data = await updateProfileSection(input.id, input.section);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "section.delete": {
        await deleteProfileSection(input.id);
        return envelopeOk({ id: input.id }, { invalidatedTags: tags });
      }
      case "section.move": {
        const data = await moveProfileSection(input.id, input.direction);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "section.visibility": {
        const data = await setProfileSectionVisibility(input.id, input.visible);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "entry.create": {
        const data = await createProfileEntry(input.sectionId, input.entry);
        return envelopeOk(data, { status: 201, invalidatedTags: tags });
      }
      case "entry.update": {
        const data = await updateProfileEntry(input.sectionId, input.entryId, input.entry);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "entry.delete": {
        await deleteProfileEntry(input.sectionId, input.entryId);
        return envelopeOk({ id: input.entryId }, { invalidatedTags: tags });
      }
      case "entry.move": {
        const data = await moveProfileEntry(input.sectionId, input.entryId, input.direction);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "entry.visibility": {
        const data = await setProfileEntryVisibility(
          input.sectionId,
          input.entryId,
          input.visible
        );
        return envelopeOk(data, { invalidatedTags: tags });
      }
    }
  });
}

/* ------------------------------------------------------------- KOTAK MASUK */

export async function submitInquiryAction(payload: unknown): Promise<ApiResponse<Inquiry>> {
  return runPublic(async () => {
    const input = parsePayload(inquiryInputSchema, payload);
    const inquiry = await createInquiry(input);
    return envelopeOk(inquiry, { status: 201, invalidatedTags: [...TAGS.inquiries] });
  });
}

export async function updateInquiryStatusAction(
  id: string,
  payload: unknown
): Promise<ApiResponse<Inquiry>> {
  return runAdmin(async () => {
    const input = parsePayload(inquiryStatusSchema, payload);
    const inquiry = await setInquiryStatus(id, input.status as InquiryStatus);
    return envelopeOk(inquiry, { invalidatedTags: [...TAGS.inquiries] });
  });
}

export async function deleteInquiryAction(id: string): Promise<ApiResponse<{ id: string }>> {
  return runAdmin(async () => {
    await deleteInquiry(id);
    return envelopeOk({ id }, { invalidatedTags: [...TAGS.inquiries] });
  });
}

/* ------------------------------------------------------------------- MEDIA */

export async function mediaUploadAction(payload: unknown): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    const input = parsePayload(mediaUploadSchema, payload);
    const asset = await saveMedia(input);
    return envelopeOk(asset, { status: 201, invalidatedTags: [...TAGS.media] });
  });
}

export async function mediaListAction(): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    const assets = await listMediaAssets();
    const usage = await mediaUsage();
    return envelopeOk({ assets, usage });
  });
}

export async function mediaDeleteAction(payload: unknown): Promise<ApiResponse<{ id: string }>> {
  return runAdmin(async () => {
    const input = parsePayload(mediaDeleteSchema, payload);
    await deleteMedia(input.id);
    return envelopeOk({ id: input.id }, { invalidatedTags: [...TAGS.media] });
  });
}

/* ------------------------------------------------------------ MEDIA SOSIAL */

export async function socialMutationAction(payload: unknown): Promise<ApiResponse<unknown>> {
  return runAdmin<unknown>(async () => {
    const input = parsePayload(socialMutationSchema, payload);
    const tags = [...TAGS.social];

    switch (input.action) {
      case "social.create": {
        const data = await createSocialLink(input.link);
        return envelopeOk(data, { status: 201, invalidatedTags: tags });
      }
      case "social.update": {
        const data = await updateSocialLink(input.id, input.link);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "social.delete": {
        await deleteSocialLink(input.id);
        return envelopeOk({ id: input.id }, { invalidatedTags: tags });
      }
      case "social.move": {
        const data = await moveSocialLink(input.id, input.direction);
        return envelopeOk(data, { invalidatedTags: tags });
      }
      case "social.visibility": {
        const data = await setSocialLinkVisibility(input.id, input.visible);
        return envelopeOk(data, { invalidatedTags: tags });
      }
    }
  });
}

/* ---------------------------------------------------------------- KONFIGURASI */

export async function updateConfigAction(payload: unknown): Promise<ApiResponse<SiteConfig>> {
  return runAdmin(async () => {
    const input = parsePayload(siteConfigInputSchema, payload);
    const config = await updateSiteConfig(input);
    return envelopeOk(config, { invalidatedTags: [...TAGS.config] });
  });
}

/* ------------------------------------------------------- BASIS DATA JSON */

export async function exportDatabaseAction(): Promise<
  ApiResponse<{ filename: string; database: unknown }>
> {
  return runAdmin(async () => {
    const result = await exportDatabase();
    return envelopeOk(result);
  });
}

export async function importDatabaseAction(payload: unknown): Promise<ApiResponse<unknown>> {
  return runAdmin(async () => {
    const candidate =
      payload && typeof payload === "object" && "database" in payload
        ? (payload as { database: unknown }).database
        : payload;
    const input = parsePayload(databaseImportSchema, candidate);
    const database = await importDatabase(input);
    return envelopeOk(database, { invalidatedTags: [...TAGS.database] });
  });
}

export async function resetDatabaseAction(): Promise<ApiResponse<unknown>> {
  return runAdmin(async () => {
    const database = await resetDatabase();
    return envelopeOk(database, { invalidatedTags: [...TAGS.database] });
  });
}
