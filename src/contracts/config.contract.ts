import { z } from "zod";
import { DEFAULT_HOMEPAGE_SECTIONS } from "./domain";
import { emailField, nonEmptyText, optionalHttpUrl, optionalImageUrl } from "./validation";

const homepageText = (fallback: string, maxLength: number) =>
  z.string().trim().min(1, "Kolom tidak boleh kosong.").max(maxLength).default(fallback);

const homepageDescription = (fallback: string) =>
  z.string().trim().max(800, "Deskripsi maksimal 800 karakter.").default(fallback);

export const homepageSectionsSchema = z.object({
  hero: z
    .object({
      visible: z.boolean().default(DEFAULT_HOMEPAGE_SECTIONS.hero.visible),
      eyebrow: homepageText(DEFAULT_HOMEPAGE_SECTIONS.hero.eyebrow, 100),
      primaryCtaLabel: homepageText(DEFAULT_HOMEPAGE_SECTIONS.hero.primaryCtaLabel, 60),
      contactCtaLabel: homepageText(DEFAULT_HOMEPAGE_SECTIONS.hero.contactCtaLabel, 60),
      repositoryCtaLabel: homepageText(DEFAULT_HOMEPAGE_SECTIONS.hero.repositoryCtaLabel, 60)
    })
    .default(DEFAULT_HOMEPAGE_SECTIONS.hero),
  experienceTimeline: z
    .object({
      visible: z.boolean().default(DEFAULT_HOMEPAGE_SECTIONS.experienceTimeline.visible),
      title: homepageText(DEFAULT_HOMEPAGE_SECTIONS.experienceTimeline.title, 120),
      description: homepageDescription(DEFAULT_HOMEPAGE_SECTIONS.experienceTimeline.description)
    })
    .default(DEFAULT_HOMEPAGE_SECTIONS.experienceTimeline),
  certifications: z
    .object({
      visible: z.boolean().default(DEFAULT_HOMEPAGE_SECTIONS.certifications.visible),
      title: homepageText(DEFAULT_HOMEPAGE_SECTIONS.certifications.title, 120),
      description: homepageDescription(DEFAULT_HOMEPAGE_SECTIONS.certifications.description)
    })
    .default(DEFAULT_HOMEPAGE_SECTIONS.certifications),
  skills: z
    .object({
      visible: z.boolean().default(DEFAULT_HOMEPAGE_SECTIONS.skills.visible),
      title: homepageText(DEFAULT_HOMEPAGE_SECTIONS.skills.title, 120),
      description: homepageDescription(DEFAULT_HOMEPAGE_SECTIONS.skills.description),
      featuredLabel: homepageText(DEFAULT_HOMEPAGE_SECTIONS.skills.featuredLabel, 60)
    })
    .default(DEFAULT_HOMEPAGE_SECTIONS.skills),
  publications: z
    .object({
      visible: z.boolean().default(DEFAULT_HOMEPAGE_SECTIONS.publications.visible),
      title: homepageText(DEFAULT_HOMEPAGE_SECTIONS.publications.title, 120),
      description: homepageDescription(DEFAULT_HOMEPAGE_SECTIONS.publications.description),
      linkLabel: homepageText(DEFAULT_HOMEPAGE_SECTIONS.publications.linkLabel, 60)
    })
    .default(DEFAULT_HOMEPAGE_SECTIONS.publications)
});

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
  availability: z.boolean(),
  availabilityNote: z.string().trim().max(200, "Catatan ketersediaan terlalu panjang.").default(""),
  openToWork: z.boolean().default(false),
  openToWorkNote: z.string().trim().max(200, "Catatan peluang terlalu panjang.").default(""),
  resumeUrl: z
    .string()
    .trim()
    .max(200, "Berkas CV tidak valid.")
    .refine(
      (value) => value === "" || /^\/api\/v1\/media\/[A-Za-z0-9_-]+$/.test(value),
      "Berkas CV harus berasal dari unggahan media CMS."
    )
    .default(""),
  education: z.string().trim().max(180, "Pendidikan terlalu panjang.").default(""),
  homepageSections: homepageSectionsSchema.default(DEFAULT_HOMEPAGE_SECTIONS)
});

export type SiteConfigInput = z.infer<typeof siteConfigInputSchema>;
