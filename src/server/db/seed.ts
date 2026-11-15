import type { Database } from "@/contracts/domain";

/**
 * Keadaan awal basis data — profil desain grafis Muhammad Sulthan Fajri Rabbani.
 * Reset mengembalikan basis data ke keadaan ini, bukan ke data demo rekayasa lama.
 */
export function buildSeedDatabase(): Database {
  const now = "2026-11-15T00:00:00.000Z";

  return {
    schemaVersion: 1,
    siteConfig: {
      fullName: "Muhammad Sulthan Fajri Rabbani",
      nim: "",
      headline: "Graphic Design",
      bio: "Berdomisili di Kota Tangerang Selatan dengan pengalaman magang desain grafis dan asistensi redaksi di TVRI Stasiun DKI Jakarta. Terbiasa menggunakan Adobe Illustrator, Adobe Premiere Pro, CorelDRAW, Adobe Photoshop, serta After Effects.",
      location: "Kota Tangerang Selatan, Banten, Indonesia",
      email: "sulthan.fajrirb@gmail.com",
      phone: "",
      website: "",
      address: "",
      github: "",
      linkedin: "https://www.linkedin.com/in/muhammad-sulthan-fajri-rabbani-ba2863300/",
      avatarUrl: "",
      coverImageUrl: "",
      pronouns: "",
      connections: 7,
      followers: 8,
      availability: true,
      availabilityNote: "",
      openToWork: false,
      openToWorkNote: "",
      cvVersion: "2026.2",
      education: "UIN Sultan Maulana Hasanuddin Banten",
      updatedAt: now
    },
    projects: [],
    experiences: [
      {
        id: "exp_tvri_desain",
        period: "Feb 2023 — Jul 2023",
        role: "Desain grafis",
        organization: "TVRI Stasiun DKI Jakarta",
        type: "KARIER",
        highlights: [
          "Pemagangan desain grafis selama enam bulan di Jakarta Metropolitan Area.",
          "Menggunakan Adobe Illustrator, Adobe Premiere Pro, CorelDRAW, Adobe Photoshop, After Effects, Desain Logo, dan Komunikasi."
        ],
        employmentType: "APPRENTICESHIP",
        location: "Jakarta Metropolitan Area",
        workMode: "ON_SITE",
        description:
          "Pemagangan desain grafis selama enam bulan. Terlibat dalam produksi materi visual dan pengolahan media menggunakan perkakas desain Adobe serta CorelDRAW.",
        skills: [
          "Adobe Illustrator",
          "Adobe Premiere Pro",
          "CorelDRAW",
          "Desain Logo",
          "Graphic Design",
          "Komunikasi",
          "Adobe Photoshop",
          "After Effects"
        ],
        logoUrl: "",
        organizationUrl: "",
        sortOrder: 1,
        createdAt: now
      },
      {
        id: "exp_tvri_redaksi",
        period: "Feb 2023 — Jul 2023",
        role: "asisten redaktur",
        organization: "TVRI Stasiun DKI Jakarta",
        type: "KARIER",
        highlights: [
          "Magang asistensi redaksi selama enam bulan dengan kerja on-site.",
          "Berlokasi di TVRI Stasiun DKI Jakarta."
        ],
        employmentType: "INTERNSHIP",
        location: "Jakarta Metropolitan Area",
        workMode: "ON_SITE",
        description:
          "Magang asistensi redaksi selama enam bulan dengan penempatan on-site di TVRI Stasiun DKI Jakarta.",
        skills: ["Komunikasi"],
        logoUrl: "",
        organizationUrl: "",
        sortOrder: 2,
        createdAt: now
      }
    ],
    certifications: [],
    skills: (
      [
        ["Adobe Illustrator", "Perkakas utama desain vektor."],
        ["Adobe Premiere Pro", "Penyuntingan dan perakitan materi video."],
        ["CorelDRAW", "Desain vektor untuk kebutuhan produksi cetak."],
        ["Desain Logo", "Penyusunan identitas visual dan tanda grafis."],
        ["Graphic Design", "Komposisi tipografi, warna, dan tata letak."],
        ["Komunikasi", "Koordinasi kerja redaksi dan produksi media."],
        ["Adobe Photoshop", "Pengolahan gambar dan retouching."],
        ["After Effects", "Animasi dan olah gerak untuk materi siar."]
      ] as ReadonlyArray<readonly [string, string]>
    ).map(([name, context], index) => ({
      id: `sk_desain_${String(index + 1).padStart(2, "0")}`,
      name,
      category: "MEDIA_KREATIF" as const,
      level: 75,
      context,
      endorsements: 0,
      sortOrder: index + 1,
      createdAt: now
    })),
    articles: [],
    testimonials: [],
    profileSections: [
      {
        id: "prf_pendidikan",
        slug: "pendidikan",
        title: "Pendidikan",
        subtitle: "Riwayat akademik formal",
        kind: "EDUCATION",
        visible: true,
        sortOrder: 1,
        entries: [
          {
            id: "prf_edu_uin",
            title: "UIN Sultan Maulana Hasanuddin Banten",
            subtitle: "",
            meta: "",
            location: "Banten, Indonesia",
            startDate: "",
            endDate: "",
            isCurrent: true,
            description: "",
            url: "",
            imageUrl: "",
            logoUrl: "",
            authors: "",
            publisher: "",
            tags: [],
            visible: true,
            sortOrder: 1,
            createdAt: now
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_bahasa",
        slug: "bahasa",
        title: "Bahasa",
        subtitle: "Kemampuan bahasa",
        kind: "LANGUAGES",
        visible: true,
        sortOrder: 2,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_organisasi",
        slug: "organisasi",
        title: "Organisasi",
        subtitle: "Peran dan keanggotaan",
        kind: "ORGANIZATIONS",
        visible: true,
        sortOrder: 3,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_penghargaan",
        slug: "penghargaan",
        title: "Penghargaan",
        subtitle: "Prestasi dan pengakuan",
        kind: "HONORS",
        visible: true,
        sortOrder: 4,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_publikasi",
        slug: "publikasi",
        title: "Publikasi",
        subtitle: "Karya tulis dan terbitan",
        kind: "PUBLICATIONS",
        visible: true,
        sortOrder: 5,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_paten",
        slug: "paten",
        title: "Paten",
        subtitle: "Hak kekayaan intelektual",
        kind: "PATENTS",
        visible: true,
        sortOrder: 6,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_skor-tes",
        slug: "skor-tes",
        title: "Skor Tes",
        subtitle: "Hasil uji kemampuan",
        kind: "TEST_SCORES",
        visible: true,
        sortOrder: 7,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_relawan",
        slug: "relawan",
        title: "Pengalaman Relawan",
        subtitle: "Kontribusi sosial dan komunitas",
        kind: "VOLUNTEER",
        visible: true,
        sortOrder: 8,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_kepedulian",
        slug: "kepedulian",
        title: "Kepedulian",
        subtitle: "Isu yang diperjuangkan",
        kind: "CAUSES",
        visible: true,
        sortOrder: 9,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_sorotan",
        slug: "sorotan",
        title: "Sorotan",
        subtitle: "Karya dan tautan pilihan",
        kind: "FEATURED",
        visible: true,
        sortOrder: 10,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_aktivitas",
        slug: "aktivitas",
        title: "Aktivitas",
        subtitle: "Catatan dan unggahan terbaru",
        kind: "ACTIVITY",
        visible: true,
        sortOrder: 11,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_minat",
        slug: "minat",
        title: "Minat",
        subtitle: "Topik, organisasi, dan tokoh yang diikuti",
        kind: "INTERESTS",
        visible: true,
        sortOrder: 12,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_layanan",
        slug: "layanan",
        title: "Layanan",
        subtitle: "Jasa yang dapat dipesan",
        kind: "SERVICES",
        visible: true,
        sortOrder: 13,
        entries: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "prf_rekomendasi",
        slug: "rekomendasi",
        title: "Rekomendasi",
        subtitle: "Kata orang lain tentang kerja sama",
        kind: "RECOMMENDATIONS",
        visible: true,
        sortOrder: 14,
        entries: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    socialLinks: [],
    mediaAssets: [],
    inquiries: [],
    auditLogs: [
      {
        id: "aud_seed_design_2026",
        timestamp: now,
        action: "RESET",
        entityType: "DATABASE",
        entitySlug: "data-standar",
        commitHash: "seed2026",
        summary: "Inisialisasi basis data profil desain."
      }
    ]
  };
}
