import { z } from "zod";
import { MEDIA_PURPOSES, SOCIAL_PLATFORMS } from "./domain";
import { isSafeHttpUrl } from "./primitives";

/**
 * Kontrak media dan media sosial.
 * Unggahan memakai data URL base64 agar tidak bergantung pada penyimpanan berkas
 * eksternal; server menuliskannya ke `public/media` sebelum URL-nya disimpan.
 */

/** Perkiraan ukuran byte dari string base64 (tanpa padding). */
export function base64ByteSize(base64: string): number {
  const clean = base64.replace(/\s+/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/** Data URL gambar: `data:image/png;base64,…`. */
export const imageDataUrlSchema = z
  .string()
  .trim()
  .min(1, "Berkas gambar wajib dipilih.")
  .refine((value) => /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/i.test(value), {
    message: "Berkas harus berupa data URL gambar base64 yang valid."
  });

export const mediaUploadSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "Nama berkas wajib diisi.")
    .max(180, "Nama berkas terlalu panjang."),
  dataUrl: imageDataUrlSchema,
  purpose: z.enum(MEDIA_PURPOSES, {
    errorMap: () => ({ message: "Jenis pemakaian media tidak dikenali." })
  })
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

/** Media yang sudah tersimpan dapat dihapus berdasarkan id. */
export const mediaDeleteSchema = z.object({
  id: z.string().trim().min(4, "ID media tidak valid.")
});

/** Tautan media sosial pada profil publik. */
export const socialLinkInputSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS, {
    errorMap: () => ({ message: "Platform media sosial tidak dikenali." })
  }),
  label: z.string().trim().max(80, "Label media sosial terlalu panjang.").default(""),
  url: z
    .string()
    .trim()
    .min(1, "URL media sosial wajib diisi.")
    .max(500, "URL media sosial terlalu panjang.")
    .refine((value) => isSafeHttpUrl(value), {
      message: "URL media sosial harus diawali https:// atau http:// yang valid."
    }),
  visible: z.boolean().default(true)
});

export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;

const socialLinkId = z.string().trim().min(4, "ID media sosial tidak valid.");
const direction = z.enum(["UP", "DOWN"], {
  errorMap: () => ({ message: "Arah perpindahan tidak valid." })
});

export const socialMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("social.create"),
    link: socialLinkInputSchema
  }),
  z.object({
    action: z.literal("social.update"),
    id: socialLinkId,
    link: socialLinkInputSchema
  }),
  z.object({
    action: z.literal("social.delete"),
    id: socialLinkId
  }),
  z.object({
    action: z.literal("social.move"),
    id: socialLinkId,
    direction
  }),
  z.object({
    action: z.literal("social.visibility"),
    id: socialLinkId,
    visible: z.boolean()
  })
]);

export type SocialMutation = z.infer<typeof socialMutationSchema>;
