import { z } from "zod";
import { MEDIA_PURPOSES, SOCIAL_PLATFORMS } from "./domain";
import { isSafeHttpUrl } from "./primitives";

/**
 * Kontrak unggahan gambar, CV PDF, dan tautan media sosial.
 * Unggahan memakai data URL base64; server menyimpan berkas di penyimpanan media lokal.
 */

/** Perkiraan ukuran byte dari string base64 (tanpa padding). */
export function base64ByteSize(base64: string): number {
  const clean = base64.replace(/\s+/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/** Data URL gambar atau PDF CV, keduanya wajib base64. */
export const mediaDataUrlSchema = z
  .string()
  .trim()
  .min(1, "Berkas wajib dipilih.")
  .refine(
    (value) =>
      /^data:(?:image\/[a-z0-9.+-]+|application\/pdf);base64,[A-Za-z0-9+/=\s]+$/i.test(value),
    {
      message: "Berkas harus berupa gambar atau PDF base64 yang valid."
    }
  );

export const mediaUploadSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, "Nama berkas wajib diisi.")
      .max(180, "Nama berkas terlalu panjang."),
    dataUrl: mediaDataUrlSchema,
    purpose: z.enum(MEDIA_PURPOSES, {
      error: "Jenis pemakaian media tidak dikenali."
    })
  })
  .superRefine((input, context) => {
    const isPdf = /^data:application\/pdf;/i.test(input.dataUrl);
    if ((input.purpose === "RESUME") !== isPdf) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataUrl"],
        message:
          input.purpose === "RESUME"
            ? "Unggah CV dalam format PDF."
            : "PDF hanya dapat diunggah sebagai CV."
      });
    }
  });

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

/** Media yang sudah tersimpan dapat dihapus berdasarkan id. */
export const mediaDeleteSchema = z.object({
  id: z.string().trim().min(4, "ID media tidak valid.")
});

/** Tautan media sosial pada profil publik. */
export const socialLinkInputSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS, {
    error: "Platform media sosial tidak dikenali."
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
  error: "Arah perpindahan tidak valid."
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
