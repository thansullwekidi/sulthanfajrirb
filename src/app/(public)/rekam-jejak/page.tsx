import Link from "next/link";
import { ProfileSections } from "@/components/editorial/ProfileSections";
import { SectionHead } from "@/components/editorial/SectionHead";
import { SocialLinks } from "@/components/editorial/SocialLinks";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORY_CODES,
  CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  SKILL_DOMAINS,
  WORK_MODE_LABELS
} from "@/contracts/domain";
import { formatDateId, formatPeriod } from "@/contracts/primitives";
import { getSiteConfig } from "@/server/repositories/config.repository";
import {
  listCertifications,
  listExperiences,
  listSkills
} from "@/server/repositories/content.repository";
import { listProfileSections } from "@/server/repositories/profile.repository";
import { listSocialLinks } from "@/server/repositories/social.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rekam Jejak & Keahlian",
  description:
    "Linimasa pengalaman akademik dan profesional, sertifikasi terverifikasi, serta direktori tech stack dengan tingkat kemahiran terukur."
};

const TYPE_LABEL = EXPERIENCE_TYPE_LABELS;

export default async function TrajectoryPage() {
  const [config, experiences, certifications, skills, profileSections, socialLinks] =
    await Promise.all([
      getSiteConfig(),
      listExperiences(),
      listCertifications(),
      listSkills(),
      listProfileSections(true),
      listSocialLinks(true)
    ]);

  return (
    <div className="shell">
      <section style={{ padding: "52px 0 34px", borderBottom: "1px solid var(--line)" }}>
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
          <span className="eyebrow eyebrow--accent">03 / Rekam Jejak & Keahlian</span>
          <span className="eyebrow">
            {experiences.length} pengalaman · {certifications.length} sertifikasi · {skills.length}{" "}
            keahlian
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
            gap: 48,
            alignItems: "end"
          }}
          className="section-intro"
        >
          <h1 className="display" style={{ fontSize: "clamp(38px, 4.8vw, 68px)" }}>
            Linimasa yang dapat <em>ditelusuri.</em>
          </h1>
          <div className="stack" style={{ gap: 12 }}>
            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}>
              Riwayat akademik, proyek tim, dan pengalaman industri. Sertifikasi mencantumkan
              penerbit serta ID kredensial yang dapat diverifikasi bila tautan tersedia.
            </p>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
              {config.education}
            </div>
            {socialLinks.length > 0 ? <SocialLinks links={socialLinks} /> : null}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="linimasa-title">
        <SectionHead index="03.1" title="Linimasa Pengalaman" meta="Terbaru di atas" />
        <div className="timeline" style={{ marginTop: 24 }}>
          {experiences.map((experience) => (
            <div key={experience.id} className="timeline__row">
              <div className="timeline__period">
                {formatPeriod(
                  experience.startDate,
                  experience.endDate,
                  experience.isCurrent,
                  experience.period
                )}
              </div>
              <div className="timeline__body">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {experience.logoUrl ? (
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        flex: "0 0 auto",
                        border: "1px solid var(--line)",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                        background: "var(--surface)"
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={experience.logoUrl}
                        alt={`Logo ${experience.organization}`}
                        width={38}
                        height={38}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </span>
                  ) : null}
                  <div className="stack" style={{ gap: 3 }}>
                    <h3 className="timeline__role" id="linimasa-title">
                      {experience.role}
                    </h3>
                    {experience.organizationUrl ? (
                      <a
                        href={experience.organizationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="timeline__org link-inline"
                        style={{ borderBottom: 0, alignSelf: "flex-start" }}
                      >
                        {experience.organization}
                        <Icon name="external" size={10} />
                      </a>
                    ) : (
                      <span className="timeline__org">{experience.organization}</span>
                    )}
                  </div>
                </div>
                <ul className="timeline__points">
                  {experience.highlights.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {experience.description ? (
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.65,
                      color: "var(--muted)",
                      maxWidth: "70ch"
                    }}
                  >
                    {experience.description}
                  </p>
                ) : null}
                {experience.skills.length > 0 ? (
                  <div className="tag-row">
                    {experience.skills.map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="timeline__aside">
                <span className={`badge ${experience.type === "KARIER" ? "badge--accent" : ""}`}>
                  {TYPE_LABEL[experience.type]}
                </span>
                <span className="badge">{EMPLOYMENT_TYPE_LABELS[experience.employmentType]}</span>
                {experience.workMode !== "ON_SITE" ? (
                  <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                    {WORK_MODE_LABELS[experience.workMode]}
                  </span>
                ) : null}
                {experience.location ? (
                  <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                    {experience.location}
                  </span>
                ) : null}
                <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                  {experience.highlights.length} poin terukur
                </span>
              </div>
            </div>
          ))}
          {experiences.length === 0 ? (
            <div className="empty-state">
              <strong>Belum ada pengalaman</strong>
              <span>Tambahkan entri melalui Studio CMS.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" aria-labelledby="sertifikasi-title">
        <SectionHead
          index="03.2"
          title="Sertifikasi Terverifikasi"
          meta={`${certifications.length} kredensial`}
        />
        <div style={{ overflowX: "auto", marginTop: 24 }}>
          <table className="data-table" id="sertifikasi-title">
            <thead>
              <tr>
                <th style={{ width: 40 }}>No</th>
                <th>Kredensial</th>
                <th style={{ width: 220 }}>Penerbit</th>
                <th style={{ width: 130 }}>Terbit</th>
                <th style={{ width: 130 }}>Kedaluwarsa</th>
                <th style={{ width: 190 }}>ID Kredensial</th>
                <th style={{ width: 110 }}>Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((certification, index) => (
                <tr key={certification.id}>
                  <td className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {certification.imageUrl ? (
                        <a
                          href={certification.imageUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{
                            width: 64,
                            height: 48,
                            flex: "0 0 auto",
                            border: "1px solid var(--line)",
                            overflow: "hidden",
                            display: "block",
                            background: "var(--surface)"
                          }}
                          title="Buka foto sertifikat"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={certification.imageUrl}
                            alt={`Foto sertifikat ${certification.title}`}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </a>
                      ) : null}
                      <div style={{ fontSize: 13 }}>{certification.title}</div>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {certification.issuerLogoUrl ? (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            flex: "0 0 auto",
                            border: "1px solid var(--line)",
                            display: "grid",
                            placeItems: "center",
                            overflow: "hidden",
                            background: "var(--surface)"
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={certification.issuerLogoUrl}
                            alt={`Logo ${certification.issuer}`}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </span>
                      ) : null}
                      <span>{certification.issuer}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 10 }}>
                    {formatDateId(certification.issueDate)}
                  </td>
                  <td className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {certification.expiryDate ? formatDateId(certification.expiryDate) : "—"}
                  </td>
                  <td className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                    {certification.credentialId || "—"}
                  </td>
                  <td>
                    {certification.verifyUrl ? (
                      <a
                        href={certification.verifyUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-inline"
                      >
                        Periksa
                        <Icon name="external" size={11} />
                      </a>
                    ) : (
                      <span className="badge">Arsip Fisik</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="keahlian-title">
        <SectionHead
          index="03.3"
          title="Direktori Tech Stack"
          meta={`${skills.length} entri · 4 domain`}
        />
        <div className="section-intro">
          <p id="keahlian-title">
            Tingkat kemahiran bersifat relatif terhadap konteks pemakaian yang dicantumkan. Bilah
            bukan pengganti bukti teknis: setiap keahlian merujuk pada artefak di katalog atau
            repositori.
          </p>
          <Link href="/karya" className="link-inline" style={{ alignSelf: "end" }}>
            Lihat bukti pada katalog
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>

        <div className="stack-grid">
          {SKILL_DOMAINS.map((domain) => {
            const scoped = skills.filter((skill) => skill.category === domain);
            return (
              <div key={domain} className="stack-group">
                <div className="stack-group__head">
                  <div className="stack" style={{ gap: 3 }}>
                    <span className="eyebrow">{CATEGORY_CODES[domain]}</span>
                    <h3 className="mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {CATEGORY_LABELS[domain]}
                    </h3>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {scoped.length} entri
                  </span>
                </div>
                <div className="stack-list">
                  {scoped.map((skill) => (
                    <div key={skill.id} className="skill-bar skill-bar--accent">
                      <div className="skill-bar__top">
                        <span style={{ fontWeight: 500 }}>{skill.name}</span>
                        <span className="skill-bar__level">
                          {skill.endorsements > 0
                            ? `${skill.level}% · ${skill.endorsements} dukungan`
                            : `${skill.level}%`}
                        </span>
                      </div>
                      <div className="skill-bar__track" role="presentation">
                        <span
                          className="skill-bar__fill"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                      <span className="skill-bar__context">{skill.context}</span>
                    </div>
                  ))}
                  {scoped.length === 0 ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      Belum ada keahlian pada domain ini.
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <ProfileSections sections={profileSections} indexPrefix="03" startAt={4} />
    </div>
  );
}
