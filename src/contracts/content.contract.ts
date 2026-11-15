import { z } from "zod";
import {
  ARTICLE_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_TYPES,
  SKILL_DOMAINS,
  WORK_MODES
} from "./domain";
import { normalizeSlug, parseCsvList } from "./primitives";
import { nonEmptyText, optionalDateIso, optionalHttpUrl, optionalImageUrl } from "./validation";

const slugField = z
  .string({ error: "Slug wajib diisi." })
  .transform((value) => normalizeSlug(value))
  .refine((value) => value.length >= 3, {
    message: "Slug minimal 3 karakter (a-z, 0-9, tanda hubung)."
  })
  .refine((value) => value.length <= 140, {
    message: "Slug maksimal 140 karakter."
  })
  .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
    message: "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung tunggal."
  });

const highlightsField = z.preprocess(
  (value) => {
    if (typeof value === "string") return parseCsvList(value.split(/\n/));
    if (Array.isArray(value)) return parseCsvList(value as string[]);
    return value;
  },
  z
    .array(z.string().trim().min(1))
    .max(12, "Maksimal 12 poin rincian.")
);

/** Daftar tag opsional: kosong diperbolehkan, dipisah koma atau baris baru. */
const tagsField = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return [];
    if (typeof value === "string") return parseCsvList(value);
    if (Array.isArray(value)) return parseCsvList(value as string[]);
    return value;
  },
  z.array(z.string().trim().min(1)).max(30, "Maksimal 30 tag.")
);

/**
 * Skema dasar pengalaman (tanpa aturan lintas-kolom).
 * Diekspor terpisah agar lapisan impor basis data dapat memakai `.extend()`.
 */
export const experienceBaseSchema = z.object({
  /** Periode bebas; boleh kosong bila tanggal terstruktur diisi. */
  period: z.string().trim().max(60, "Periode terlalu panjang.").default(""),
  startDate: z.string().trim().max(40, "Tanggal mulai terlalu panjang.").default(""),
  endDate: z.string().trim().max(40, "Tanggal selesai terlalu panjang.").default(""),
  isCurrent: z.boolean().default(false),
  role: nonEmptyText("Peran", 3, 120),
  organization: nonEmptyText("Institusi", 3, 140),
  type: z.enum(EXPERIENCE_TYPES, {
    error: "Jenis pengalaman tidak dikenali."
  }),
  highlights: highlightsField,
  employmentType: z
    .enum(EMPLOYMENT_TYPES, {
      error: "Jenis kerja tidak dikenali."
    })
    .default("FULL_TIME"),
  location: z.string().trim().max(140, "Lokasi terlalu panjang.").default(""),
  workMode: z
    .enum(WORK_MODES, {
      error: "Mode kerja tidak dikenali."
    })
    .default("ON_SITE"),
  description: z.string().trim().max(3000, "Deskripsi maksimal 3000 karakter.").default(""),
  skills: tagsField,
  logoUrl: optionalImageUrl("Logo instansi"),
  organizationUrl: optionalHttpUrl("Tautan instansi")
});

export const experienceInputSchema = experienceBaseSchema.superRefine((value, ctx) => {
  // LinkedIn mewajibkan semacam rentang waktu: periode bebas ATAU tanggal terstruktur.
  if (!value.period && !value.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["period"],
      message: "Isi periode, atau tanggal mulai bulan/tahun."
    });
  }
  // Posisi yang masih berlangsung tidak boleh punya tanggal selesai.
  if (value.isCurrent && value.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Kosongkan tanggal selesai bila posisi masih berlangsung."
    });
  }
});

export const certificationInputSchema = z.object({
  title: nonEmptyText("Nama sertifikasi", 4, 160),
  issuer: nonEmptyText("Penerbit", 3, 140),
  issueDate: optionalDateIso("Tanggal terbit"),
  expiryDate: optionalDateIso("Tanggal kedaluwarsa").default(""),
  credentialId: z.string().trim().max(80, "ID kredensial terlalu panjang.").default(""),
  skills: tagsField,
  imageUrl: optionalImageUrl("Foto sertifikasi"),
  issuerLogoUrl: optionalImageUrl("Logo penerbit")
});

export const skillInputSchema = z.object({
  name: nonEmptyText("Nama keahlian", 2, 80),
  category: z.enum(SKILL_DOMAINS, {
    error: "Domain keahlian tidak dikenali."
  }),
  level: z.coerce
    .number({ error: "Tingkat penguasaan harus berupa angka." })
    .int("Tingkat penguasaan harus bilangan bulat.")
    .min(0, "Tingkat penguasaan minimal 0%.")
    .max(100, "Tingkat penguasaan maksimal 100%."),
  context: z.string().trim().max(220, "Konteks maksimal 220 karakter.").default(""),
  endorsements: z.coerce
    .number({ error: "Jumlah dukungan harus berupa angka." })
    .int("Jumlah dukungan harus bilangan bulat.")
    .min(0, "Jumlah dukungan tidak boleh negatif.")
    .max(99_999, "Jumlah dukungan terlalu besar.")
    .default(0),
  pinned: z.boolean().default(false)
});

export const articleInputSchema = z.object({
  slug: slugField,
  title: nonEmptyText("Judul artikel", 5, 160),
  category: nonEmptyText("Kategori", 3, 60),
  publishedAt: optionalDateIso("Tanggal terbit"),
  summary: nonEmptyText("Ringkasan", 20, 320),
  content: nonEmptyText("Isi artikel", 40, 30000),
  externalUrl: optionalHttpUrl("Tautan artikel").default(""),
  status: z.enum(ARTICLE_STATUSES).default("PUBLISHED")
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
export type CertificationInput = z.infer<typeof certificationInputSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;
