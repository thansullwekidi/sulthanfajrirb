import { z } from "zod";
import {
  ARTICLE_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_TYPES,
  SKILL_DOMAINS,
  WORK_MODES
} from "./domain";
import { parseCsvList } from "./primitives";
import { nonEmptyText, optionalDateIso, optionalHttpUrl, optionalImageUrl } from "./validation";
import { slugField } from "./project.contract";

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

export const experienceInputSchema = z.object({
  period: nonEmptyText("Periode", 4, 60),
  role: nonEmptyText("Peran", 3, 120),
  organization: nonEmptyText("Institusi", 3, 140),
  type: z.enum(EXPERIENCE_TYPES, {
    errorMap: () => ({ message: "Jenis pengalaman tidak dikenali." })
  }),
  highlights: highlightsField,
  employmentType: z
    .enum(EMPLOYMENT_TYPES, {
      errorMap: () => ({ message: "Jenis kerja tidak dikenali." })
    })
    .default("FULL_TIME"),
  location: z.string().trim().max(140, "Lokasi terlalu panjang.").default(""),
  workMode: z
    .enum(WORK_MODES, {
      errorMap: () => ({ message: "Mode kerja tidak dikenali." })
    })
    .default("ON_SITE"),
  description: z.string().trim().max(3000, "Deskripsi maksimal 3000 karakter.").default(""),
  skills: tagsField,
  logoUrl: optionalImageUrl("Logo instansi"),
  organizationUrl: optionalHttpUrl("Tautan instansi")
});

export const certificationInputSchema = z.object({
  title: nonEmptyText("Nama sertifikasi", 4, 160),
  issuer: nonEmptyText("Penerbit", 3, 140),
  issueDate: optionalDateIso("Tanggal terbit"),
  expiryDate: optionalDateIso("Tanggal kedaluwarsa").default(""),
  credentialId: z.string().trim().max(80, "ID kredensial terlalu panjang.").default(""),
  verifyUrl: optionalHttpUrl("Tautan verifikasi"),
  skills: tagsField,
  imageUrl: optionalImageUrl("Foto sertifikasi"),
  issuerLogoUrl: optionalImageUrl("Logo penerbit")
});

export const skillInputSchema = z.object({
  name: nonEmptyText("Nama keahlian", 2, 80),
  category: z.enum(SKILL_DOMAINS, {
    errorMap: () => ({ message: "Domain keahlian tidak dikenali." })
  }),
  level: z.coerce
    .number({ invalid_type_error: "Tingkat penguasaan harus berupa angka." })
    .int("Tingkat penguasaan harus bilangan bulat.")
    .min(0, "Tingkat penguasaan minimal 0%.")
    .max(100, "Tingkat penguasaan maksimal 100%."),
  context: z.string().trim().max(220, "Konteks maksimal 220 karakter.").default(""),
  endorsements: z.coerce
    .number({ invalid_type_error: "Jumlah dukungan harus berupa angka." })
    .int("Jumlah dukungan harus bilangan bulat.")
    .min(0, "Jumlah dukungan tidak boleh negatif.")
    .max(99_999, "Jumlah dukungan terlalu besar.")
    .default(0)
});

export const articleInputSchema = z.object({
  slug: slugField,
  title: nonEmptyText("Judul artikel", 5, 160),
  category: nonEmptyText("Kategori", 3, 60),
  publishedAt: optionalDateIso("Tanggal terbit"),
  summary: nonEmptyText("Ringkasan", 20, 320),
  content: nonEmptyText("Isi artikel", 40, 30000),
  status: z.enum(ARTICLE_STATUSES).default("PUBLISHED")
});

export const testimonialInputSchema = z.object({
  author: nonEmptyText("Nama pemberi rekomendasi", 3, 120),
  role: nonEmptyText("Jabatan", 3, 120),
  organization: nonEmptyText("Instansi", 3, 140),
  relationship: z.string().trim().max(140, "Hubungan kerja terlalu panjang.").default(""),
  quote: nonEmptyText("Kutipan", 20, 700),
  verifiedTag: z.string().trim().max(60, "Label verifikasi terlalu panjang.").default("Terverifikasi"),
  date: optionalDateIso("Tanggal"),
  isVisible: z.boolean().default(true)
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
export type CertificationInput = z.infer<typeof certificationInputSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;
