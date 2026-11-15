import { z } from "zod";
import { INQUIRY_STATUSES } from "./domain";
import { emailField, nonEmptyText } from "./validation";

export const INQUIRY_CATEGORIES = [
  "Peluang Desain",
  "Kolaborasi Kreatif",
  "Produksi Media",
  "Konsultasi Visual",
  "Lainnya",
  "Peluang Rekayasa",
  "Kolaborasi Riset",
  "Audit Teknis",
  "Diskusi Arsitektur"
] as const;

/** Pilihan yang tampil pada formulir publik; nilai lama tetap valid untuk impor. */
export const INQUIRY_CATEGORY_OPTIONS = [
  "Peluang Desain",
  "Kolaborasi Kreatif",
  "Produksi Media",
  "Konsultasi Visual",
  "Lainnya"
] as const;

export const inquiryInputSchema = z.object({
  senderName: nonEmptyText("Nama lengkap", 3, 120),
  senderEmail: emailField,
  organization: nonEmptyText("Instansi atau perusahaan", 2, 140),
  category: z.enum(INQUIRY_CATEGORIES, {
    errorMap: () => ({ message: "Kategori keperluan tidak dikenali." })
  }),
  budgetTimeline: z.string().trim().max(80, "Rentang waktu terlalu panjang.").default(""),
  message: nonEmptyText("Pesan teknis", 30, 4000)
});

export const inquiryStatusSchema = z.object({
  status: z.enum(INQUIRY_STATUSES)
});

export type InquiryInput = z.infer<typeof inquiryInputSchema>;
