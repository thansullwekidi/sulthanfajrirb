import { z } from "zod";
import { emailField, nonEmptyText, optionalHttpUrl, optionalImageUrl } from "./validation";

export const siteConfigInputSchema = z.object({
  fullName: nonEmptyText("Nama lengkap", 3, 120),
  nim: z.string().trim().max(40, "NIM / ID maksimal 40 karakter.").default(""),
  headline: nonEmptyText("Judul spesialisasi", 5, 140),
  bio: nonEmptyText("Bio ringkas", 40, 800),
  location: nonEmptyText("Lokasi", 3, 120),
  email: emailField,
  phone: z.string().trim().max(40, "Nomor telepon terlalu panjang.").default(""),
  website: optionalHttpUrl("Situs web"),
  address: z.string().trim().max(200, "Alamat terlalu panjang.").default(""),
  github: optionalHttpUrl("Tautan GitHub"),
  linkedin: optionalHttpUrl("Tautan LinkedIn"),
  avatarUrl: optionalImageUrl("URL foto profil"),
  coverImageUrl: optionalImageUrl("URL foto sampul"),
  pronouns: z.string().trim().max(40, "Kata ganti terlalu panjang.").default(""),
  connections: z.coerce
    .number({ invalid_type_error: "Jumlah koneksi harus berupa angka." })
    .int("Jumlah koneksi harus bilangan bulat.")
    .min(0, "Jumlah koneksi tidak boleh negatif.")
    .max(1_000_000, "Jumlah koneksi terlalu besar.")
    .default(0),
  followers: z.coerce
    .number({ invalid_type_error: "Jumlah pengikut harus berupa angka." })
    .int("Jumlah pengikut harus bilangan bulat.")
    .min(0, "Jumlah pengikut tidak boleh negatif.")
    .max(1_000_000, "Jumlah pengikut terlalu besar.")
    .default(0),
  availability: z.boolean(),
  availabilityNote: z.string().trim().max(200, "Catatan ketersediaan terlalu panjang.").default(""),
  openToWork: z.boolean().default(false),
  openToWorkNote: z.string().trim().max(200, "Catatan peluang terlalu panjang.").default(""),
  cvVersion: z.string().trim().max(30, "Versi CV terlalu panjang.").default("2026.2"),
  cvMaxExperiences: z.coerce
    .number({ invalid_type_error: "Harus berupa angka." })
    .int("Harus bilangan bulat.")
    .min(0, "Tidak boleh negatif.")
    .max(20, "Maksimal 20.")
    .default(3),
  cvMaxProjects: z.coerce
    .number({ invalid_type_error: "Harus berupa angka." })
    .int("Harus bilangan bulat.")
    .min(0, "Tidak boleh negatif.")
    .max(20, "Maksimal 20.")
    .default(3),
  cvMaxCertifications: z.coerce
    .number({ invalid_type_error: "Harus berupa angka." })
    .int("Harus bilangan bulat.")
    .min(0, "Tidak boleh negatif.")
    .max(20, "Maksimal 20.")
    .default(3),
  education: z.string().trim().max(180, "Pendidikan terlalu panjang.").default("")
});

export type SiteConfigInput = z.infer<typeof siteConfigInputSchema>;
