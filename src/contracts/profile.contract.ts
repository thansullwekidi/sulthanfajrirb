import { z } from "zod";
import { PROFILE_SECTION_KINDS } from "./domain";
import { parseCsvList } from "./primitives";
import { nonEmptyText, optionalHttpUrl, optionalImageUrl } from "./validation";

/** Daftar tag opsional untuk entri profil. */
const entryTagsField = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return [];
    if (typeof value === "string") return parseCsvList(value);
    if (Array.isArray(value)) return parseCsvList(value as string[]);
    return value;
  },
  z.array(z.string().trim().min(1)).max(30, "Maksimal 30 tag.")
);

export const profileSectionInputSchema = z.object({
  title: nonEmptyText("Nama bagian", 2, 80),
  subtitle: z.string().trim().max(180, "Subjudul bagian terlalu panjang.").default(""),
  kind: z.enum(PROFILE_SECTION_KINDS, {
    errorMap: () => ({ message: "Jenis bagian tidak dikenali." })
  }),
  visible: z.boolean().default(true)
});

/**
 * Skema dasar entri profil (tanpa aturan lintas-kolom).
 * Diekspor terpisah agar lapisan impor basis data dapat memakai `.extend()`.
 */
export const profileEntryBaseSchema = z.object({
  title: nonEmptyText("Judul entri", 2, 140),
  subtitle: z.string().trim().max(180, "Subjudul entri terlalu panjang.").default(""),
  meta: z.string().trim().max(180, "Keterangan tambahan terlalu panjang.").default(""),
  location: z.string().trim().max(140, "Lokasi terlalu panjang.").default(""),
  startDate: z.string().trim().max(40, "Tanggal mulai terlalu panjang.").default(""),
  endDate: z.string().trim().max(40, "Tanggal selesai terlalu panjang.").default(""),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(4000, "Deskripsi maksimal 4000 karakter.").default(""),
  url: optionalHttpUrl("Tautan entri"),
  imageUrl: optionalImageUrl("URL gambar"),
  logoUrl: optionalImageUrl("URL logo"),
  authors: z.string().trim().max(300, "Daftar penulis terlalu panjang.").default(""),
  publisher: z.string().trim().max(180, "Nama penerbit terlalu panjang.").default(""),
  tags: entryTagsField,
  visible: z.boolean().default(true)
});

/**
 * Entri profil. Kolom `url` wajib untuk jenis yang memang harus dapat dibuka
 * pembaca — publikasi dan paten — karena LinkedIn pun menautkannya ke sumber.
 */
export const profileEntryInputSchema = profileEntryBaseSchema.superRefine((value, ctx) => {
  if (!value.url) return;
  // Tautan entri harus benar-benar menuju publikasi, bukan halaman umum.
  if (/^https?:\/\/(www\.)?(google|bing)\./i.test(value.url)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "Gunakan tautan langsung ke publikasi, bukan tautan mesin pencari."
    });
  }
});

const sectionId = z.string().trim().min(4, "ID bagian tidak valid.");
const entryId = z.string().trim().min(4, "ID entri tidak valid.");
const direction = z.enum(["UP", "DOWN"], {
  errorMap: () => ({ message: "Arah perpindahan tidak valid." })
});

export const profileMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("section.create"),
    section: profileSectionInputSchema
  }),
  z.object({
    action: z.literal("section.update"),
    id: sectionId,
    section: profileSectionInputSchema
  }),
  z.object({
    action: z.literal("section.delete"),
    id: sectionId
  }),
  z.object({
    action: z.literal("section.move"),
    id: sectionId,
    direction
  }),
  z.object({
    action: z.literal("section.visibility"),
    id: sectionId,
    visible: z.boolean()
  }),
  z.object({
    action: z.literal("entry.create"),
    sectionId,
    entry: profileEntryInputSchema
  }),
  z.object({
    action: z.literal("entry.update"),
    sectionId,
    entryId,
    entry: profileEntryInputSchema
  }),
  z.object({
    action: z.literal("entry.delete"),
    sectionId,
    entryId
  }),
  z.object({
    action: z.literal("entry.move"),
    sectionId,
    entryId,
    direction
  }),
  z.object({
    action: z.literal("entry.visibility"),
    sectionId,
    entryId,
    visible: z.boolean()
  })
]);

export type ProfileSectionInput = z.infer<typeof profileSectionInputSchema>;
export type ProfileEntryInput = z.infer<typeof profileEntryInputSchema>;
export type ProfileMutation = z.infer<typeof profileMutationSchema>;
