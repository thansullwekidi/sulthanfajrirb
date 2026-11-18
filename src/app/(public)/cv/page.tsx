import Link from "next/link";
import { readDatabase } from "@/server/db/store";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;

export const metadata = {
  title: "CV — Muhammad Sulthan Fajri Rabbani",
  description: "CV PDF yang diunggah melalui Studio CMS."
};

export default async function ResumePage() {
  const db = await readDatabase();
  const config = db.siteConfig;
  const resumeUrl = config.resumeUrl;

  return (
    <div className="shell">
      <section className="cv-toolbar">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow eyebrow--accent">05 / CV</span>
          <h1 className="display" style={{ fontSize: "clamp(30px, 3.6vw, 44px)", lineHeight: 1 }}>
            CV <em>Pribadi</em>
          </h1>
          <p style={{ maxWidth: "60ch", color: "var(--muted)", fontSize: 12, lineHeight: 1.65 }}>
            Dokumen ini dibuat dan diperbarui sendiri, lalu diunggah melalui Studio CMS. Situs
            hanya menampilkan berkas PDF yang Anda pilih.
          </p>
        </div>
        {resumeUrl ? (
          <a className="btn btn--primary" href={`${resumeUrl}?download=1`}>
            <Icon name="download" size={13} />
            Unduh CV PDF
          </a>
        ) : null}
      </section>

      {resumeUrl ? (
        <section className="cv-stage" aria-label="Pratinjau CV PDF">
          <iframe
            title={`CV ${config.fullName}`}
            src={resumeUrl}
            style={{
              width: "100%",
              minHeight: "min(78vh, 1050px)",
              border: "1px solid var(--line)",
              background: "var(--surface)"
            }}
          />
        </section>
      ) : (
        <section
          className="panel"
          style={{ margin: "36px 0 72px", maxWidth: 720, padding: 24 }}
        >
          <div className="stack" style={{ gap: 12, alignItems: "flex-start" }}>
            <Icon name="file" size={28} />
            <h2 className="section-head__title">CV belum diunggah</h2>
            <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.65 }}>
              Buat CV Anda sendiri, simpan sebagai PDF, lalu unggah melalui Studio CMS → Konfigurasi
              → CV PDF.
            </p>
            <Link href="/admin" className="btn btn--primary">
              <Icon name="upload" size={12} />
              Buka Studio CMS
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
