/**
 * Tipe domain bersama (Single Source of Truth) untuk seluruh lapisan.
 * Tidak ada union string yang ditulis ulang di komponen UI.
 */

export const PROJECT_CATEGORIES = [
  "REKAYASA_WEB",
  "MACHINE_LEARNING",
  "OTOMASI_SISTEM",
  "MEDIA_KREATIF"
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DIAGRAM_TYPES = [
  "WEB_ARCH",
  "ML_PIPELINE",
  "BROWSER_AUTOMATION",
  "MEDIA_ENGINE",
  "OAUTH_ROUTER"
] as const;
export type DiagramType = (typeof DIAGRAM_TYPES)[number];

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
  "COVER",
  "CERTIFICATION",
  "EDUCATION_LOGO",
  "PROFILE_ENTRY",
  "SOCIAL",
  "OTHER"
] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const MEDIA_PURPOSE_LABELS: Record<MediaPurpose, string> = {
  AVATAR: "Foto Profil",
  COVER: "Foto Sampul",
  CERTIFICATION: "Foto Sertifikasi",
  EDUCATION_LOGO: "Logo Pendidikan",
  PROFILE_ENTRY: "Media Entri Profil",
  SOCIAL: "Media Sosial",
  OTHER: "Lainnya"
};

/** Batas unggah berkas media (byte). */
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;

/** Tipe MIME yang diterima. SVG sengaja ditolak karena dapat memuat skrip. */
export const MEDIA_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif"
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
  "CAUSES",
  "INTERESTS",
  "FEATURED",
  "ACTIVITY",
  "SERVICES",
  "RECOMMENDATIONS",
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
  CAUSES: "Kepedulian",
  INTERESTS: "Minat",
  FEATURED: "Sorotan",
  ACTIVITY: "Aktivitas",
  SERVICES: "Layanan",
  RECOMMENDATIONS: "Rekomendasi",
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
  CAUSES: "LIST",
  INTERESTS: "GRID",
  FEATURED: "GRID",
  ACTIVITY: "POSTS",
  SERVICES: "GRID",
  RECOMMENDATIONS: "POSTS",
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
}

export const PROFILE_ENTRY_LABELS: Record<ProfileSectionKind, ProfileEntryLabels> = {
  EDUCATION: {
    title: "Sekolah / Institusi",
    subtitle: "Jenjang & Jurusan",
    meta: "Nilai / IPK",
    description: "Aktivitas & Organisasi",
    tags: "Keahlian",
    showDates: true,
    showLocation: true,
    showUrl: true,
    showImage: false,
    imageLabel: "Foto Kegiatan Pendidikan",
    logoLabel: "Logo Institusi Pendidikan",
    urlLabel: "Tautan Institusi"
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
    meta: "",
    description: "Deskripsi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Foto Penghargaan"
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
  RECOMMENDATIONS: {
    title: "Nama Pemberi Rekomendasi",
    subtitle: "Jabatan & Instansi",
    meta: "Hubungan Kerja",
    description: "Isi Rekomendasi",
    tags: "",
    showDates: true,
    showLocation: false,
    showUrl: true,
    showImage: true,
    imageLabel: "Foto Pemberi Rekomendasi",
    urlLabel: "Tautan Profil"
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

export const SKILL_DOMAINS = PROJECT_CATEGORIES;
export type SkillDomain = ProjectCategory;

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
 * Label tampilan netral untuk domain karya.
 * Kode enum tetap dipertahankan agar data lama dan impor tidak rusak.
 */
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  REKAYASA_WEB: "Web & Interaktif",
  MACHINE_LEARNING: "Data & Analitik",
  OTOMASI_SISTEM: "Sistem & Alur Kerja",
  MEDIA_KREATIF: "Media & Desain"
};

export const CATEGORY_CODES: Record<ProjectCategory, string> = {
  REKAYASA_WEB: "RW",
  MACHINE_LEARNING: "ML",
  OTOMASI_SISTEM: "OS",
  MEDIA_KREATIF: "MD"
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf",
  ARCHIVED: "Diarsipkan"
};

export const DIAGRAM_LABELS: Record<DiagramType, string> = {
  WEB_ARCH: "Arsitektur Web Full-Stack",
  ML_PIPELINE: "Pipeline Machine Learning",
  BROWSER_AUTOMATION: "Otomasi Browser Terdistribusi",
  MEDIA_ENGINE: "Mesin Media Digital",
  OAUTH_ROUTER: "Router OAuth Multi-Tenant"
};

export interface ProjectLinks {
  github: string;
  live: string;
  notebook: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  techStack: string[];
  metricLabel: string;
  metricValue: string;
  diagramType: DiagramType;
  codeSnippet: string;
  challenge: string;
  solution: string;
  caseStudy: string;
  links: ProjectLinks;
  status: ProjectStatus;
  isFeatured: boolean;
  sortOrder: number;
  commitHash: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Experience {
  id: string;
  period: string;
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
  verifyUrl: string;
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
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  organization: string;
  relationship: string;
  quote: string;
  verifiedTag: string;
  date: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
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
  url: string;
  imageUrl: string;
  /** Logo kecil khusus institusi/lembaga (pendidikan, organisasi, relawan). */
  logoUrl: string;
  /** Penulis atau kontributor, dipakai jenis Publikasi dan Paten. */
  authors: string;
  /** Penerbit / jurnal / kantor, terpisah dari subtitle agar dapat diurutkan. */
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
  connections: number;
  followers: number;
  availability: boolean;
  availabilityNote: string;
  openToWork: boolean;
  openToWorkNote: string;
  cvVersion: string;
  education: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  entityType: string;
  entitySlug: string;
  commitHash: string;
  summary: string;
}

export interface Database {
  schemaVersion: number;
  projects: Project[];
  experiences: Experience[];
  certifications: Certification[];
  skills: Skill[];
  articles: Article[];
  testimonials: Testimonial[];
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
  | "articles"
  | "testimonials";

export interface AdminSnapshot {
  database: Database;
  counts: {
    projectsPublished: number;
    projectsDraft: number;
    projectsArchived: number;
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
