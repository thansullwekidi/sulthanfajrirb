import { z } from "zod";
import { siteConfigInputSchema } from "./config.contract";
import {
  articleInputSchema,
  certificationInputSchema,
  experienceBaseSchema,
  skillInputSchema
} from "./content.contract";
import {
  profileEntryBaseSchema,
  profileSectionInputSchema
} from "./profile.contract";
import { socialLinkInputSchema } from "./media.contract";
import { AUDIT_ACTIONS, INQUIRY_STATUSES, MEDIA_ALLOWED_MIME, MEDIA_PURPOSES } from "./domain";
import { inquiryInputSchema } from "./inquiry.contract";

const auditLogSchema = z.object({
  id: z.string().trim().min(1),
  timestamp: z.string().trim().min(1),
  action: z.enum(AUDIT_ACTIONS),
  entityType: z.string().trim().min(1),
  entitySlug: z.string().trim(),
  commitHash: z.string().trim(),
  summary: z.string().trim()
});

const inquiryRecordSchema = inquiryInputSchema.extend({
  id: z.string().trim().min(1),
  status: z.enum(INQUIRY_STATUSES).default("UNREAD"),
  createdAt: z.string().trim().min(1)
});

const experienceRecordSchema = experienceBaseSchema.extend({
  id: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().trim().optional()
});

const certificationRecordSchema = certificationInputSchema.extend({
  id: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().trim().optional()
});

const skillRecordSchema = skillInputSchema.extend({
  id: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().trim().optional()
});

const articleRecordSchema = articleInputSchema.extend({
  id: z.string().trim().min(1),
  readTime: z.coerce.number().int().min(1).max(90).optional(),
  createdAt: z.string().trim().optional(),
  updatedAt: z.string().trim().optional()
});

const profileEntryRecordSchema = profileEntryBaseSchema.extend({
  id: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().trim().optional()
});

const profileSectionRecordSchema = profileSectionInputSchema.extend({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  entries: z.array(profileEntryRecordSchema).max(500).default([]),
  createdAt: z.string().trim().optional(),
  updatedAt: z.string().trim().optional()
});

const socialLinkRecordSchema = socialLinkInputSchema.extend({
  id: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().trim().optional()
});

const mediaAssetRecordSchema = z.object({
  id: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.enum(MEDIA_ALLOWED_MIME),
  byteSize: z.coerce.number().int().min(0),
  purpose: z.enum(MEDIA_PURPOSES),
  url: z.string().trim().min(1),
  createdAt: z.string().trim().optional()
});

export const databaseImportSchema = z.object({
  schemaVersion: z.number().int().optional(),
  experiences: z.array(experienceRecordSchema).max(300),
  certifications: z.array(certificationRecordSchema).max(300),
  skills: z.array(skillRecordSchema).max(300),
  articles: z.array(articleRecordSchema).max(300),
  profileSections: z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value.filter(
            (section) =>
              typeof section !== "object" ||
              section === null ||
              !["PROJECTS", "RECOMMENDATIONS"].includes(
                String((section as { kind?: unknown }).kind)
              )
          )
        : value,
    z.array(profileSectionRecordSchema).max(100).optional()
  ),
  socialLinks: z.array(socialLinkRecordSchema).max(50).optional(),
  mediaAssets: z.array(mediaAssetRecordSchema).max(500).optional(),
  inquiries: z.array(inquiryRecordSchema).max(500).optional(),
  auditLogs: z.array(auditLogSchema).max(5000).optional(),
  siteConfig: siteConfigInputSchema
});

export type DatabaseImport = z.infer<typeof databaseImportSchema>;
