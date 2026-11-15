import { z } from "zod";
import {
  DIAGRAM_TYPES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES
} from "./domain";
import { normalizeSlug, parseCsvList } from "./primitives";
import { nonEmptyText, optionalHttpUrl } from "./validation";

/** Sanitasi daftar teknologi: comma-separated atau array → array bersih tanpa duplikat. */
export const techStackField = z.preprocess(
  (value) => {
    if (typeof value === "string") return parseCsvList(value);
    if (Array.isArray(value)) return parseCsvList(value as string[]);
    return value;
  },
  z
    .array(z.string().trim().min(1))
    .min(1, "Minimal satu teknologi wajib dicantumkan.")
    .max(24, "Maksimal 24 teknologi per proyek.")
);

export const slugField = z
  .string({ required_error: "Slug wajib diisi." })
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

export const projectLinksSchema = z.object({
  github: optionalHttpUrl("Tautan GitHub"),
  live: optionalHttpUrl("Tautan demo"),
  notebook: optionalHttpUrl("Tautan notebook")
});

export const projectInputSchema = z.object({
  title: nonEmptyText("Judul proyek", 5, 140),
  slug: slugField,
  subtitle: nonEmptyText("Ringkasan", 20, 280),
  category: z.enum(PROJECT_CATEGORIES, {
    errorMap: () => ({ message: "Kategori proyek tidak dikenali." })
  }),
  techStack: techStackField,
  metricLabel: nonEmptyText("Label metrik", 3, 60),
  metricValue: nonEmptyText("Nilai metrik", 1, 60),
  diagramType: z.enum(DIAGRAM_TYPES, {
    errorMap: () => ({ message: "Jenis diagram tidak dikenali." })
  }),
  codeSnippet: z.string().max(8000, "Cuplikan kode maksimal 8000 karakter.").default(""),
  challenge: nonEmptyText("Tantangan teknis", 20, 2400),
  solution: nonEmptyText("Solusi arsitektur", 20, 2400),
  caseStudy: z.string().max(12000, "Studi kasus maksimal 12000 karakter.").default(""),
  links: projectLinksSchema,
  status: z.enum(PROJECT_STATUSES).default("DRAFT"),
  isFeatured: z.boolean().default(false)
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectFeatureSchema = z.object({
  isFeatured: z.boolean()
});

export const projectMoveSchema = z.object({
  direction: z.enum(["UP", "DOWN"])
});

export const projectPurgeSchema = z.object({
  confirmSlug: z.string().trim().min(1, "Ketik ulang slug untuk konfirmasi.")
});

export const projectIdSchema = z.string().trim().min(4, "ID proyek tidak valid.");
