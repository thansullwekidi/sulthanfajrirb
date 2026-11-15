import { buildAtsMarkdown } from "@/contracts/ats-markdown";
import { resolveEducation } from "@/contracts/domain";
import { CvToolbar } from "@/components/editorial/CvToolbar";
import { PrintableAtsResume } from "@/components/editorial/PrintableAtsResume";
import { Icon } from "@/components/ui/Icon";
import { getSiteConfig } from "@/server/repositories/config.repository";
import {
  listCertifications,
  listExperiences,
  listSkills
} from "@/server/repositories/content.repository";
import { listProfileSections } from "@/server/repositories/profile.repository";
import { listPublishedProjects } from "@/server/repositories/project.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CV ATS 1 Halaman",
  description:
    "Dokumen CV ATS satu halaman yang tersinkronisasi otomatis dengan basis data portofolio. Siap dicetak ke PDF atau disalin sebagai Markdown."
};

export default async function ResumePage() {
  const [config, experiences, projects, certifications, skills, profileSections] =
    await Promise.all([
      getSiteConfig(),
      listExperiences(),
      listPublishedProjects(),
      listCertifications(),
      listSkills(),
      listProfileSections(true)
    ]);

  const education = resolveEducation(profileSections, config.education);

  const featured = [...projects]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 3);
  const topExperiences = [...experiences].slice(0, 3);
  const topCertifications = certifications.slice(0, 3);

  const markdown = buildAtsMarkdown({
    config,
    education,
    experiences: topExperiences,
    projects: featured,
    certifications: topCertifications,
    skills
  });

  return (
    <div className="shell">
      <section className="cv-toolbar">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow eyebrow--accent">05 / CV ATS 1 Halaman</span>
          <h1
            className="display"
            style={{ fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1 }}
          >
            Dokumen siap <em>cetak.</em>
          </h1>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
            VERSI {config.cvVersion} · SINKRON DENGAN {projects.length} PROYEK · {skills.length}{" "}
            KEAHLIAN
          </span>
        </div>
        <CvToolbar markdown={markdown} />
      </section>

      <div className="cv-stage">
        <PrintableAtsResume
          config={config}
          education={education}
          experiences={topExperiences}
          projects={featured}
          certifications={topCertifications}
          skills={skills}
        />
      </div>

      <section
        className="no-print"
        style={{
          borderTop: "1px solid var(--line)",
          padding: "22px 0 64px",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 28
        }}
      >
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Aturan Cetak</span>
          <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
            Ukuran A4, margin 12 mm, tanpa elemen navigasi. Seluruh warna dipaksa hitam-putih agar
            terbaca oleh parser ATS.
          </p>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Sinkronisasi</span>
          <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
            Perubahan pada profil, pengalaman, proyek, sertifikasi, dan keahlian langsung
            tercermin di lembar ini setelah disimpan di Studio.
          </p>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Verifikasi Manual</span>
          <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
            Setelah menyimpan PDF, salin seluruh teks dari dokumen untuk memastikan urutan tetap
            logis tanpa kolom yang saling menyela.
          </p>
          <span className="mono" style={{ fontSize: 9, color: "var(--ok)" }}>
            <Icon name="check" size={11} /> SATU KOLOM · TANPA IKON · TABEL MINIMAL
          </span>
        </div>
      </section>
    </div>
  );
}
