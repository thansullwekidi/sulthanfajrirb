import { ContactForm } from "@/components/editorial/ContactForm";
import { ClockWib } from "@/components/editorial/ClockWib";
import { SocialLinks } from "@/components/editorial/SocialLinks";
import { Icon } from "@/components/ui/Icon";
import { readDatabase } from "@/server/db/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kontak & Diskusi",
  description:
    "Formulir kontak tervalidasi untuk peluang desain, kolaborasi kreatif, produksi media, dan konsultasi visual. Pesan masuk langsung ke Kotak Masuk Studio CMS."
};

export default async function ContactPage() {
  const db = await readDatabase();
  const config = db.siteConfig;
  const socialLinks = db.socialLinks
    .filter((l) => l.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="shell">
      <section style={{ padding: "52px 0 0", borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 22
          }}
        >
          <span className="eyebrow eyebrow--accent">06 / Kontak & Diskusi</span>
          <span className="eyebrow">Kotak masuk CMS · status belum dibaca</span>
        </div>
      </section>

      <div className="contact-layout">
        <aside className="contact-aside">
          <h1 className="display" style={{ fontSize: "clamp(38px, 4.4vw, 64px)" }}>
            Mari membahas <em>ide visual.</em>
          </h1>

          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.75, maxWidth: "48ch" }}>
            Gunakan formulir ini untuk peluang desain, kolaborasi kreatif, produksi media, atau
            konsultasi visual. Sertakan konteks yang spesifik: jenis materi, audiens, dan hasil yang
            diharapkan. Pesan masuk ke antrean Kotak Masuk Studio dan tercatat pada log audit.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              border: "1px solid var(--line)"
            }}
          >
            <span
              className={`dot ${config.availability ? "dot--pulse" : "dot--warn"}`}
              aria-hidden="true"
            />
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.05em" }}>
              {config.availability ? "TERBUKA UNTUK PELUANG" : "TIDAK MENERIMA PROYEK BARU"}
            </span>
          </div>

          <dl className="contact-facts">
            <div className="contact-fact">
              <dt className="contact-fact__label">Surel Langsung</dt>
              <dd className="contact-fact__value">
                <a href={`mailto:${config.email}`} className="link-inline" style={{ borderBottom: 0 }}>
                  {config.email}
                </a>
              </dd>
            </div>
            <div className="contact-fact">
              <dt className="contact-fact__label">Domisili</dt>
              <dd className="contact-fact__value">{config.location}</dd>
            </div>
            {config.phone ? (
              <div className="contact-fact">
                <dt className="contact-fact__label">Telepon</dt>
                <dd className="contact-fact__value">{config.phone}</dd>
              </div>
            ) : null}
            {config.website ? (
              <div className="contact-fact">
                <dt className="contact-fact__label">Situs Web</dt>
                <dd className="contact-fact__value">
                  <a
                    href={config.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-inline"
                    style={{ borderBottom: 0 }}
                  >
                    {config.website.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="contact-fact">
              <dt className="contact-fact__label">Waktu Respons</dt>
              <dd className="contact-fact__value">1—3 hari kerja · WIB UTC+7</dd>
            </div>
            <div className="contact-fact">
              <dt className="contact-fact__label">Catatan</dt>
              <dd className="contact-fact__value" style={{ textTransform: "none", letterSpacing: 0 }}>
                {config.availabilityNote}
              </dd>
            </div>
          </dl>

          {socialLinks.length > 0 ? (
            <div className="stack" style={{ gap: 8, marginTop: 18 }}>
              <span className="eyebrow">Media Sosial</span>
              <SocialLinks links={socialLinks} variant="list" />
            </div>
          ) : null}

          <ClockWib compact />
        </aside>

        <div className="contact-main">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 18
            }}
          >
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Formulir Dispatch</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                Validasi ganda · sanitasi otomatis · audit log
              </span>
            </div>
            <span className="badge badge--ok">
              <Icon name="lock" size={10} />
              Terhubung Database
            </span>
          </div>

          <ContactForm />

          <div
            style={{
              marginTop: 28,
              borderTop: "1px solid var(--line)",
              paddingTop: 16,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              ENDPOINT POST /API/V1/INQUIRIES · AMPLOP RESPONS STANDAR
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              TIDAK ADA DATA YANG DITAMPILKAN KE PUBLIK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
