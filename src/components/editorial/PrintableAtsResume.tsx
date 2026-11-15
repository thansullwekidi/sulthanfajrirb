import type {
  Certification,
  Experience,
  Project,
  SiteConfig,
  Skill
} from "@/contracts/domain";
import {
  CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORK_MODE_LABELS
} from "@/contracts/domain";
import { formatDateId, formatPeriod } from "@/contracts/primitives";

interface ResumeProps {
  config: SiteConfig;
  experiences: Experience[];
  projects: Project[];
  certifications: Certification[];
  skills: Skill[];
}

/**
 * LAPISAN 5 — Lembar CV ATS satu halaman.
 * Satu kolom, tanpa ikon dekoratif, hierarki berbasis teks, aman untuk parser.
 */
export function PrintableAtsResume({
  config,
  experiences,
  projects,
  certifications,
  skills
}: ResumeProps) {
  const domains = [...new Set(skills.map((skill) => skill.category))];

  return (
    <article className="cv-sheet" aria-label="CV ATS satu halaman">
      <header style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <h1 className="cv-name">{config.fullName}</h1>
        <p className="cv-role">{config.headline}</p>
        <div className="cv-contact">
          <span>{config.location}</span>
          <span>{config.email}</span>
          {config.phone ? <span>{config.phone}</span> : null}
          {config.website ? (
            <span>{config.website.replace(/^https?:\/\//, "")}</span>
          ) : null}
          {config.github ? (
            <span>{config.github.replace(/^https?:\/\//, "")}</span>
          ) : null}
          <span>{config.linkedin.replace(/^https?:\/\//, "")}</span>
        </div>
      </header>

      <section className="cv-section">
        <h2 className="cv-section__title">Ringkasan Profesional</h2>
        <p style={{ fontSize: "8.9pt", lineHeight: 1.45 }}>{config.bio}</p>
      </section>

      <section className="cv-section">
        <h2 className="cv-section__title">Pengalaman</h2>
        {experiences.map((experience) => (
          <div key={experience.id} className="cv-entry">
            <div className="cv-entry__head">
              <span className="cv-entry__title">{experience.role}</span>
              <span className="cv-entry__meta">
                {formatPeriod(
                  experience.startDate,
                  experience.endDate,
                  experience.isCurrent,
                  experience.period
                )}
              </span>
            </div>
            <span className="cv-entry__sub">
              {experience.organization}
              {" · "}
              {EMPLOYMENT_TYPE_LABELS[experience.employmentType]}
              {experience.location ? ` · ${experience.location}` : ""}
              {experience.workMode !== "ON_SITE"
                ? ` · ${WORK_MODE_LABELS[experience.workMode]}`
                : ""}
            </span>
            <ul className="cv-list">
              {experience.highlights.slice(0, 2).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            {experience.skills.length > 0 ? (
              <span style={{ fontSize: "8.2pt", color: "#3d3b37" }}>
                Keahlian: {experience.skills.join(", ")}
              </span>
            ) : null}
          </div>
        ))}
      </section>

      {projects.length > 0 ? (
        <section className="cv-section">
          <h2 className="cv-section__title">Proyek Unggulan</h2>
          {projects.map((project) => (
            <div key={project.id} className="cv-entry">
              <div className="cv-entry__head">
                <span className="cv-entry__title">{project.title}</span>
                <span className="cv-entry__meta">{project.metricValue}</span>
              </div>
              <span className="cv-entry__sub">{project.subtitle}</span>
              <span style={{ fontSize: "8.2pt", color: "#3d3b37" }}>
                Teknologi: {project.techStack.join(", ")}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="cv-section">
        <h2 className="cv-section__title">Pendidikan</h2>
        <div className="cv-entry">
          <div className="cv-entry__head">
            <span className="cv-entry__title">{config.education}</span>
            {config.nim ? <span className="cv-entry__meta">NIM {config.nim}</span> : null}
          </div>
        </div>
      </section>

      {certifications.length > 0 ? (
        <section className="cv-section">
          <h2 className="cv-section__title">Sertifikasi</h2>
          {certifications.map((certification) => (
            <div key={certification.id} className="cv-entry__head">
              <span style={{ fontSize: "8.9pt" }}>
                <strong>{certification.title}</strong> — {certification.issuer}
              </span>
              <span className="cv-entry__meta">
                {formatDateId(certification.issueDate)}
                {certification.expiryDate
                  ? ` — ${formatDateId(certification.expiryDate)}`
                  : ""}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="cv-section">
        <h2 className="cv-section__title">Keahlian</h2>
        {domains.map((domain) => (
          <div key={domain} className="cv-skill-line">
            <span>{CATEGORY_LABELS[domain]}</span>
            <span>
              {skills
                .filter((skill) => skill.category === domain)
                .map((skill) => skill.name)
                .join(" · ")}
            </span>
          </div>
        ))}
      </section>
    </article>
  );
}
