/**
 * Tipe domain bersama (Single Source of Truth) untuk seluruh lapisan.
 * Tidak ada union string yang ditulis ulang di komponen UI.
 */

import { formatPeriod } from "./primitives";

export const SKILL_DOMAINS = [
  "REKAYASA_WEB",
  "MACHINE_LEARNING",
  "OTOMASI_SISTEM",
  "MEDIA_KREATIF"
] as const;
export type SkillDomain = (typeof SKILL_DOMAINS)[number];

export const EXPERIENCE_TYPES = ["AKADEMIK", "PROYEK", "KARIER"] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export const EXPERIENCE_TYPE_LABELS: Record<ExperienceType, string> = {
  AKADEMIK: "Akademik",
  PROYEK: "Proyek",
  KARIER: "Karier"
};

/** Jenis kerja bergaya LinkedIn. */
export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "SELF_EMPLOYED",
  "FREELANCE",
  "CONTRACT",
  "INTERNSHIP",
  "APPRENTICESHIP",
  "SEASONAL",
  "VOLUNTEER"
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Penuh Waktu",
  PART_TIME: "Paruh Waktu",
  SELF_EMPLOYED: "Wiraswasta",
  FREELANCE: "Lepas",
  CONTRACT: "Kontrak",
  INTERNSHIP: "Magang",
  APPRENTICESHIP: "Pemagangan",
  SEASONAL: "Musiman",
  VOLUNTEER: "Relawan"
};

/** Lokasi kerja bergaya LinkedIn. */
export const WORK_MODES = ["ON_SITE", "HYBRID", "REMOTE"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ON_SITE: "Di Kantor",
  HYBRID: "Hibrida",
  REMOTE: "Jarak Jauh"
};

/* ------------------------------------------------------------- MEDIA SOSIAL */

/**
 * Platform media sosial yang dikenali, mengikuti daftar "Contact info" LinkedIn.
 * Urutan di sini dipakai sebagai urutan saran pada formulir Studio.
 */
export const SOCIAL_PLATFORMS = [
  "LINKEDIN",
  "INSTAGRAM",
  "BEHANCE",
  "DRIBBBLE",
  "GITHUB",
  "YOUTUBE",
  "TIKTOK",
  "X",
  "FACEBOOK",
  "THREADS",
  "TELEGRAM",
  "WHATSAPP",
  "MEDIUM",
  "SUBSTACK",
  "PINTEREST",
  "SPOTIFY",
  "WEBSITE",
  "OTHER"
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  BEHANCE: "Behance",
  DRIBBBLE: "Dribbble",
  GITHUB: "GitHub",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  X: "X (Twitter)",
  FACEBOOK: "Facebook",
  THREADS: "Threads",
  TELEGRAM: "Telegram",
  WHATSAPP: "WhatsApp",
  MEDIUM: "Medium",
  SUBSTACK: "Substack",
  PINTEREST: "Pinterest",
  SPOTIFY: "Spotify",
  WEBSITE: "Situs Web",
  OTHER: "Lainnya"
};

/** Awalan URL yang disarankan agar pengguna tidak salah format. */
export const SOCIAL_PLATFORM_HINTS: Record<SocialPlatform, string> = {
  LINKEDIN: "https://www.linkedin.com/in/…",
  INSTAGRAM: "https://www.instagram.com/…",
  BEHANCE: "https://www.behance.net/…",
  DRIBBBLE: "https://dribbble.com/…",
  GITHUB: "https://github.com/…",
  YOUTUBE: "https://www.youtube.com/@…",
  TIKTOK: "https://www.tiktok.com/@…",
  X: "https://x.com/…",
  FACEBOOK: "https://www.facebook.com/…",
  THREADS: "https://www.threads.net/@…",
  TELEGRAM: "https://t.me/…",
  WHATSAPP: "https://wa.me/62…",
  MEDIUM: "https://medium.com/@…",
  SUBSTACK: "https://…substack.com",
  PINTEREST: "https://www.pinterest.com/…",
  SPOTIFY: "https://open.spotify.com/…",
  WEBSITE: "https://…",
  OTHER: "https://…"
};

/* ------------------------------------------------------------------- MEDIA */

/** Jenis pemakaian aset media, dipakai untuk penamaan berkas dan audit. */
export const MEDIA_PURPOSES = [
  "AVATAR",
  "RESUME",
  "COVER",
  "CERTIFICATION",
  "EDUCATION_LOGO",
  "ORGANIZATION_LOGO",
  "PROFILE_ENTRY",
  "SOCIAL",
  "OTHER"
] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const MEDIA_PURPOSE_LABELS: Record<MediaPurpose, string> = {
  AVATAR: "Foto Profil",
  RESUME: "CV",
  COVER: "Foto Sampul",
  CERTIFICATION: "Foto Sertifikasi",
  EDUCATION_LOGO: "Logo Pendidikan",
  ORGANIZATION_LOGO: "Logo Instansi",
  PROFILE_ENTRY: "Media Entri Profil",
  SOCIAL: "Media Sosial",
  OTHER: "Lainnya"
};

/** Batas unggah berkas media (byte). */
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const RESUME_MAX_BYTES = 3 * 1024 * 1024;

/** Tipe MIME yang diterima. SVG sengaja ditolak karena dapat memuat skrip. */
export const MEDIA_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf"
] as const;
export type MediaMime = (typeof MEDIA_ALLOWED_MIME)[number];

export interface MediaAsset {
  id: string;
  fileName: string;
  mimeType: MediaMime;
  byteSize: number;
  purpose: MediaPurpose;
  url: string;
  createdAt: string;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
}

/** Jenis bagian profil LinkedIn yang dapat ditambah, diubah, diurutkan, disembunyikan, dan dihapus. */
export const PROFILE_SECTION_KINDS = [
  "EDUCATION",
  "COURSES",
  "LANGUAGES",
  "ORGANIZATIONS",
  "HONORS",
  "PUBLICATIONS",
  "PATENTS",
  "TEST_SCORES",
  "VOLUNTEER",
  "CAREER_BREAK",
  "CAUSES",
  "INTERESTS",
  "FEATURED",
  "ACTIVITY",
  "SERVICES",
  "CUSTOM"
] as const;
export type ProfileSectionKind = (typeof PROFILE_SECTION_KINDS)[number];

export const PROFILE_SECTION_KIND_LABELS: Record<ProfileSectionKind, string> = {
  EDUCATION: "Pendidikan",
  COURSES: "Mata Kuliah",
  LANGUAGES: "Bahasa",
  ORGANIZATIONS: "Organisasi",
  HONORS: "Penghargaan",
  PUBLICATIONS: "Publikasi",
  PATENTS: "Paten",
  TEST_SCORES: "Skor Tes",
  VOLUNTEER: "Pengalaman Relawan",
  CAREER_BREAK: "Jeda Karier",
  CAUSES: "Kepedulian",
  INTERESTS: "Minat",
  FEATURED: "Sorotan",
  ACTIVITY: "Aktivitas",
  SERVICES: "Layanan",
  CUSTOM: "Bagian Kustom"
};

/** Tata letak render publik per jenis bagian. */
export const PROFILE_SECTION_LAYOUTS = ["TIMELINE", "LIST", "GRID", "POSTS"] as const;
export type ProfileSectionLayout = (typeof PROFILE_SECTION_LAYOUTS)[number];

export const PROFILE_SECTION_LAYOUT: Record<ProfileSectionKind, ProfileSectionLayout> = {
  EDUCATION: "TIMELINE",
  COURSES: "LIST",
  LANGUAGES: "LIST",
  ORGANIZATIONS: "TIMELINE",
  HONORS: "LIST",
  PUBLICATIONS: "LIST",
  PATENTS: "LIST",
  TEST_SCORES: "LIST",
  VOLUNTEER: "TIMELINE",
  CAREER_BREAK: "TIMELINE",
  CAUSES: "LIST",
  INTERESTS: "GRID",
  FEATURED: "GRID",
  ACTIVITY: "POSTS",
  SERVICES: "GRID",
  CUSTOM: "LIST"
};

/** Label kolom entri per jenis bagian, mengikuti istilah LinkedIn. */
export interface ProfileEntryLabels {
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  tags: string;
  showDates: boolean;
  showLocation: boolean;
  showUrl: boolean;
  showImage: boolean;
  /** Label khusus kolom gambar, mis. "Logo Institusi" atau "Foto Sertifikat". */
  imageLabel?: string;
  /** Label kolom logo kecil di samping judul (pendidikan, organisasi, relawan). */
  logoLabel?: string;
  /** Label khusus kolom tautan, mis. "Tautan Publikasi". */
  urlLabel?: string;
  /** Tautan wajib diisi untuk jenis ini (mis. publikasi harus dapat dibuka). */
  requireUrl?: boolean;
  /** Tampilkan kolom penulis & penerbit terpisah (khas publikasi/paten). */
  showAuthors?: boolean;
  /**
   * Label kolom bidang studi (`fieldsOfStudy` LinkedIn). Kosong berarti kolom
   * disembunyikan — hanya jenis bagian yang memang punya bidang studi.
   */
  fieldOfStudyLabel?: string;
  /**
   * Label kolom catatan tambahan (`notes` LinkedIn). Kosong berarti kolom
   * disembunyikan agar formulir tidak melebar tanpa guna.
   */
  notesLabel?: string;
}

export const PROFILE_ENTRY_LABELS: Record<ProfileSectionKind, ProfileEntryLabels> = {
  EDUCATION: {
    title: "Sekolah / Institusi",
    subtitle: "Gelar",
    meta: "Nilai / IPK",
    description: "Aktivitas & Organisasi",
    tags: "Keahlian",
    showDates: true,
    showLocation: true,
    showUrl: true,
    showImage: false,
    imageLabel: "Foto Kegiatan Pendidikan",
    logoLabel: "Logo Institusi Pendidikan",
    urlLabel: "Tautan Institusi",
    fieldOfStudyLabel: "Bidang Studi / Jurusan",
    notesLabel: "Catatan Tambahan"
  },
  COURSES: {
    title: "Nama Mata Kuliah",
    subtitle: "Institusi",
    meta: "Nomor Mata Kuliah",
    description: "Ringkasan",
    tags: "Keahlian",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: false
  },
  LANGUAGES: {
    title: "Bahasa",
    subtitle: "Tingkat Kemahiran",
    meta: "",
    description: "Catatan",
    tags: "",
    showDates: false,
    showLocation: false,
    showUrl: false,
    showImage: false
  },
  ORGANIZATIONS: {
    title: "Nama Organisasi",
    subtitle: "Posisi",
    meta: "",
    description: "Deskripsi",
    tags: "Keahlian",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Foto Organisasi",
    logoLabel: "Logo Organisasi",
    urlLabel: "Tautan Organisasi"
  },
  HONORS: {
    title: "Nama Penghargaan",
    subtitle: "Penerbit",
    meta: "Posisi Saat Menerima",
    description: "Deskripsi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Foto Penghargaan",
    notesLabel: "Catatan Tambahan"
  },
  PUBLICATIONS: {
    title: "Judul Publikasi",
    subtitle: "Jurnal / Konferensi",
    meta: "Volume / Edisi",
    description: "Ringkasan",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Sampul Publikasi",
    urlLabel: "Tautan Publikasi",
    requireUrl: true,
    showAuthors: true
  },
  PATENTS: {
    title: "Judul Paten",
    subtitle: "Kantor Paten",
    meta: "Nomor Paten",
    description: "Deskripsi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    urlLabel: "Tautan Paten",
    requireUrl: true,
    showAuthors: true
  },
  TEST_SCORES: {
    title: "Nama Tes",
    subtitle: "Lembaga",
    meta: "Skor",
    description: "Deskripsi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: false,
    showImage: false
  },
  VOLUNTEER: {
    title: "Peran",
    subtitle: "Organisasi",
    meta: "",
    description: "Deskripsi",
    tags: "Penyebab",
    showDates: true,
    showLocation: true,
    showUrl: true,
    showImage: true,
    imageLabel: "Foto Kegiatan",
    logoLabel: "Logo Organisasi",
    urlLabel: "Tautan Organisasi"
  },
  CAREER_BREAK: {
    title: "Judul Entri",
    subtitle: "Keterangan Singkat",
    meta: "Jenis Jeda",
    description: "Deskripsi",
    tags: "Keahlian yang Dikembangkan",
    showDates: true,
    showLocation: true,
    showUrl: false,
    showImage: false
  },
  CAUSES: {
    title: "Kepedulian",
    subtitle: "",
    meta: "",
    description: "Catatan",
    tags: "",
    showDates: false,
    showLocation: false,
    showUrl: false,
    showImage: false
  },
  INTERESTS: {
    title: "Nama",
    subtitle: "Jenis (Perusahaan, Tokoh, Grup, Sekolah)",
    meta: "",
    description: "Catatan",
    tags: "",
    showDates: false,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Logo / Foto"
  },
  FEATURED: {
    title: "Judul Sorotan",
    subtitle: "Keterangan",
    meta: "",
    description: "Deskripsi",
    tags: "",
    showDates: false,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Gambar Sorotan",
    urlLabel: "Tautan Sorotan"
  },
  ACTIVITY: {
    title: "Judul Unggahan",
    subtitle: "Jenis (Unggahan, Komentar, Reaksi)",
    meta: "",
    description: "Isi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Gambar Unggahan",
    urlLabel: "Tautan Unggahan"
  },
  SERVICES: {
    title: "Nama Layanan",
    subtitle: "Kategori",
    meta: "",
    description: "Deskripsi Layanan",
    tags: "Keahlian",
    showDates: false,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Gambar Layanan",
    urlLabel: "Tautan Pemesanan"
  },
  CUSTOM: {
    title: "Judul",
    subtitle: "Subjudul",
    meta: "Keterangan Tambahan",
    description: "Deskripsi",
    tags: "Tag",
    showDates: true,
    showLocation: true,
    showUrl: true,
    showImage: true,
    showAuthors: true
  }
};

/**
 * Pilihan jenis jeda karier, mengikuti daftar resmi LinkedIn pada fitur
 * "Add career break". Dibiarkan kosong pun sah — LinkedIn mengizinkan jenis
 * jeda tidak dipilih selama deskripsi diisi.
 */
export const CAREER_BREAK_TYPES = [
  "PARENTAL_LEAVE",
  "CAREGIVING",
  "BEREAVEMENT",
  "CAREER_TRANSITION",
  "FULL_TIME_PARENTING",
  "GAP_YEAR",
  "LAYOFF",
  "HEALTH_WELLBEING",
  "PERSONAL_GOAL",
  "PROFESSIONAL_DEVELOPMENT",
  "RELOCATION",
  "RETIREMENT",
  "TRAVEL",
  "VOLUNTARY_WORK",
  "OTHER"
] as const;
export type CareerBreakType = (typeof CAREER_BREAK_TYPES)[number];

export const CAREER_BREAK_TYPE_LABELS: Record<CareerBreakType, string> = {
  PARENTAL_LEAVE: "Cuti Melahirkan / Mengasuh Anak",
  CAREGIVING: "Merawat Keluarga",
  BEREAVEMENT: "Kedukaan",
  CAREER_TRANSITION: "Transisi Karier",
  FULL_TIME_PARENTING: "Mengasuh Anak Penuh Waktu",
  GAP_YEAR: "Tahun Jeda",
  LAYOFF: "Pemutusan Hubungan Kerja",
  HEALTH_WELLBEING: "Kesehatan & Kesejahteraan",
  PERSONAL_GOAL: "Pengejaran Tujuan Pribadi",
  PROFESSIONAL_DEVELOPMENT: "Pengembangan Profesional",
  RELOCATION: "Pindah Domisili",
  RETIREMENT: "Pensiun",
  TRAVEL: "Perjalanan",
  VOLUNTARY_WORK: "Kerja Sukarela",
  OTHER: "Lainnya"
};
export const ARTICLE_STATUSES = ["PUBLISHED", "DRAFT"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf"
};

export const INQUIRY_STATUSES = ["UNREAD", "READ", "ARCHIVED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  UNREAD: "Belum Dibaca",
  READ: "Sudah Dibaca",
  ARCHIVED: "Diarsipkan"
};

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "RESTORE",
  "PURGE",
  "REORDER",
  "IMPORT",
  "RESET"
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Label dan kode untuk kategori keahlian historis.
 */
export const SKILL_DOMAIN_LABELS: Record<SkillDomain, string> = {
  REKAYASA_WEB: "Web & Interaktif",
  MACHINE_LEARNING: "Data & Analitik",
  OTOMASI_SISTEM: "Sistem & Alur Kerja",
  MEDIA_KREATIF: "Media & Desain"
};

export const SKILL_DOMAIN_CODES: Record<SkillDomain, string> = {
  REKAYASA_WEB: "RW",
  MACHINE_LEARNING: "ML",
  OTOMASI_SISTEM: "OS",
  MEDIA_KREATIF: "MD"
};

export interface Experience {
  id: string;
  /**
   * Periode bebas, dipertahankan sebagai cadangan bila tanggal terstruktur kosong.
   * LinkedIn menyimpan posisi sebagai startMonthYear/endMonthYear terpisah.
   */
  period: string;
  /** Bulan/tahun mulai, mis. "Feb 2023". */
  startDate: string;
  /** Bulan/tahun selesai; kosong berarti masih berlangsung (seperti LinkedIn). */
  endDate: string;
  /** Turunan dari `endDate` kosong, disimpan eksplisit agar render konsisten. */
  isCurrent: boolean;
  role: string;
  organization: string;
  type: ExperienceType;
  highlights: string[];
  employmentType: EmploymentType;
  location: string;
  workMode: WorkMode;
  description: string;
  skills: string[];
  /** Logo instansi, diisi lewat unggahan media Studio. */
  logoUrl: string;
  /** Tautan publik instansi/perusahaan. */
  organizationUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  skills: string[];
  /** Foto/citra sertifikat, diisi lewat unggahan media Studio. */
  imageUrl: string;
  /** Logo penerbit sertifikasi. */
  issuerLogoUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillDomain;
  level: number;
  context: string;
  endorsements: number;
  /** Keahlian unggulan yang disematkan di bagian atas profil, seperti "Top Skills" LinkedIn. */
  pinned: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: number;
  publishedAt: string;
  summary: string;
  content: string;
  externalUrl: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------------------------- BAGIAN PROFIL LINKEDIN */

export interface ProfileEntry {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  /**
   * Bidang studi terpisah dari gelar, mengikuti `fieldsOfStudy` LinkedIn.
   * Pada Pendidikan, `subtitle` menyimpan gelar dan kolom ini menyimpan jurusan.
   */
  fieldOfStudy: string;
  /**
   * Catatan tambahan, mengikuti `notes` LinkedIn — berbeda dari `description`
   * yang menyimpan aktivitas/organisasi.
   */
  notes: string;
  url: string;
  imageUrl: string;
  /** Logo kecil khusus institusi/lembaga (pendidikan, organisasi, relawan). */
  logoUrl: string;
  /** Penulis atau kontributor, dipakai jenis Publikasi dan Paten. */
  authors: string;
  /** Penerbit / instansi, terpisah dari subtitle agar dapat diurutkan. */
  publisher: string;
  tags: string[];
  visible: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ProfileSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  kind: ProfileSectionKind;
  visible: boolean;
  sortOrder: number;
  entries: ProfileEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  senderName: string;
  senderEmail: string;
  organization: string;
  category: string;
  budgetTimeline: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface SiteConfig {
  fullName: string;
  nim: string;
  headline: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  github: string;
  linkedin: string;
  avatarUrl: string;
  coverImageUrl: string;
  pronouns: string;
  availability: boolean;
  availabilityNote: string;
  openToWork: boolean;
  openToWorkNote: string;
  resumeUrl: string;
  education: string;
  homepageSections: HomepageSections;
  updatedAt: string;
}

export interface HomepageSections {
  hero: {
    visible: boolean;
    eyebrow: string;
    primaryCtaLabel: string;
    contactCtaLabel: string;
    repositoryCtaLabel: string;
  };
  experienceTimeline: {
    visible: boolean;
    title: string;
    description: string;
  };
  certifications: {
    visible: boolean;
    title: string;
    description: string;
  };
  skills: {
    visible: boolean;
    title: string;
    description: string;
    featuredLabel: string;
  };
  publications: {
    visible: boolean;
    title: string;
    description: string;
    linkLabel: string;
  };
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSections = {
  hero: {
    visible: true,
    eyebrow: "Dossier Desain / Edisi 2026",
    primaryCtaLabel: "Lihat CV",
    contactCtaLabel: "Kirim Diskusi",
    repositoryCtaLabel: "Repositori"
  },
  experienceTimeline: {
    visible: true,
    title: "Linimasa yang Dapat Ditelusuri",
    description:
      "Riwayat pengalaman profesional dan akademik yang dicatat secara terstruktur."
  },
  certifications: {
    visible: true,
    title: "Sertifikasi",
    description:
      "Sertifikat dilampirkan sebagai foto yang diunggah melalui Studio CMS."
  },
  skills: {
    visible: true,
    title: "Media & Desain",
    description:
      "Keahlian kreatif yang digunakan dalam produksi desain grafis, visual, dan media.",
    featuredLabel: "Keahlian Unggulan"
  },
  publications: {
    visible: true,
    title: "Publikasi Artikel",
    description: "Artikel dan tulisan yang dipublikasikan.",
    linkLabel: "Buka artikel"
  }
};

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  entityType: string;
  entitySlug: string;
  commitHash: string;
  summary: string;
}

/**
 * Satu baris pendidikan siap tampil. Bagian profil `EDUCATION` adalah sumber
 * kebenaran; `SiteConfig.education` hanya dipakai sebagai cadangan untuk data
 * lama yang belum punya entri profil.
 */
export interface EducationLine {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  period: string;
  grade: string;
  notes: string;
  description: string;
  logoUrl: string;
  url: string;
}

/**
 * Susun daftar pendidikan dari bagian profil, dengan cadangan teks tunggal
 * pada Konfigurasi. Dipakai beranda, halaman rekam jejak, CV cetak, dan
 * ekspor Markdown agar keempatnya tidak pernah berbeda sumber.
 */
export function resolveEducation(
  sections: ProfileSection[],
  fallback: string
): EducationLine[] {
  const section = sections.find((item) => item.kind === "EDUCATION");
  const entries = (section?.entries ?? [])
    .filter((entry) => entry.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (entries.length === 0) {
    const text = fallback.trim();
    return text
      ? [
          {
            id: "config-education",
            school: text,
            degree: "",
            fieldOfStudy: "",
            location: "",
            period: "",
            grade: "",
            notes: "",
            description: "",
            logoUrl: "",
            url: ""
          }
        ]
      : [];
  }

  return entries.map((entry) => ({
    id: entry.id,
    school: entry.title,
    degree: entry.subtitle,
    fieldOfStudy: entry.fieldOfStudy,
    location: entry.location,
    period: formatPeriod(entry.startDate, entry.endDate, entry.isCurrent),
    grade: entry.meta,
    notes: entry.notes,
    description: entry.description,
    logoUrl: entry.logoUrl,
    url: entry.url
  }));
}

export interface Database {
  schemaVersion: number;
  experiences: Experience[];
  certifications: Certification[];
  skills: Skill[];
  articles: Article[];
  profileSections: ProfileSection[];
  socialLinks: SocialLink[];
  mediaAssets: MediaAsset[];
  inquiries: Inquiry[];
  auditLogs: AuditLog[];
  siteConfig: SiteConfig;
}

export type CollectionName =
  | "experiences"
  | "certifications"
  | "skills"
  | "articles";

export interface AdminSnapshot {
  database: Database;
  counts: {
    articles: number;
    skills: number;
    profileSections: number;
    profileEntries: number;
    socialLinks: number;
    mediaAssets: number;
    inquiriesUnread: number;
    auditLogs: number;
  };
  generatedAt: string;
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Tambah",
  UPDATE: "Ubah",
  ARCHIVE: "Arsipkan",
  RESTORE: "Pulihkan",
  PURGE: "Hapus Permanen",
  REORDER: "Urutkan Ulang",
  IMPORT: "Impor Basis Data",
  RESET: "Reset Basis Data"
};
