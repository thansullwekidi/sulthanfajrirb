import Link from "next/link";
import { ClockWib } from "@/components/editorial/ClockWib";
import { SectionHead } from "@/components/editorial/SectionHead";
import { SocialLinks } from "@/components/editorial/SocialLinks";
import { ProfileSections } from "@/components/editorial/ProfileSections";
import { Icon } from "@/components/ui/Icon";
import {
  SKILL_DOMAIN_LABELS,
  SKILL_DOMAIN_CODES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  resolveEducation,
  WORK_MODE_LABELS,
  type Article,
  type Certification,
  type Experience,
  type Skill,
  type SkillDomain
} from "@/contracts/domain";
import { formatDateId, formatPeriod } from "@/contracts/primitives";
import { getSiteConfig } from "@/server/repositories/config.repository";
import {
  listCertifications,
  listExperiences,
  listSkills,
  listArticles
} from "@/server/repositories/content.repository";
import { listProfileSections } from "@/server/repositories/profile.repository";
import { listSocialLinks } from "@/server/repositories/social.repository";

export const revalidate = 0;

function SkillDomainCell({ domain, skills }: { domain: SkillDomain; skills: Skill[] }) {
  const scoped = skills.filter((skill) => skill.category === domain);
  return (
    <div className="domain-cell">
      <div className="domain-cell__head">
        <span className="domain-cell__title">{SKILL_DOMAIN_LABELS[domain]}</span>
        <span className="domain-cell__code">{SKILL_DOMAIN_CODES[domain]}</span>
      </div>
      <div className="stack" style={{ gap: 14 }}>
        {scoped.map((skill) => (
          <div key={skill.id} className="skill-bar">
            <div className="skill-bar__top">
              <span>{skill.name}</span>
              <span className="skill-bar__level">{skill.level}%</span>
            </div>
            <div className="skill-bar__track" role="presentation">
              <span
                className="skill-bar__fill"
                style={{ width: `${Math.min(100, Math.max(0, skill.level))}%` }}
              />
            </div>
            <span className="skill-bar__context">{skill.context}</span>
            {skill.endorsements > 0 ? (
              <span className="skill-bar__endorsements">{skill.endorsements} dukungan</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const [
    config,
    skills,
    articles,
    socialLinks,
    profileSections,
    experiences,
    certifications
  ] = await Promise.all([
    getSiteConfig(),
    listSkills(),
    listArticles(true),
    listSocialLinks(true),
    listProfileSections(true),
    listExperiences(),
    listCertifications()
  ]);

  const education = resolveEducation(profileSections, config.education);
  const home = config.homepageSections;
  const homepageSkills = skills.filter((skill) => skill.category === "MEDIA_KREATIF");
  const homepageArticles = [...articles]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

  const pinnedSkills = homepageSkills.filter((skill) => skill.pinned);

  return (
    <div className="shell">
      {home.hero.visible ? (
      <section className="masthead" aria-labelledby="ringkasan-title">
        <div className="masthead__main">
          <div className="headline-split">
            <span className="eyebrow">{home.hero.eyebrow}</span>
            {config.nim ? (
              <span className="eyebrow eyebrow--accent">NIM {config.nim}</span>
            ) : null}
          </div>

          <h1 className="display" id="ringkasan-title">
            {config.fullName}
          </h1>
          {config.pronouns ? (
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {config.pronouns}
            </span>
          ) : null}

          <div className="headline-split">
            <span className="mono" style={{ fontSize: 12, letterSpacing: "0.04em" }}>
              {config.headline}
            </span>
            <span className="badge badge--ok">
              <span className="dot" aria-hidden="true" />
              Basis Data Tersinkron
            </span>
          </div>

          <p className="lede">{config.bio}</p>

          <div className="aside-actions">
            <Link href="/cv" className="btn btn--primary">
              <Icon name="print" size={13} />
              {home.hero.primaryCtaLabel}
            </Link>
            <Link href="/kontak" className="btn">
              <Icon name="mail" size={13} />
              {home.hero.contactCtaLabel}
            </Link>
            {config.github ? (
              <a
                href={config.github}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn--quiet"
              >
                <Icon name="github" size={13} />
                {home.hero.repositoryCtaLabel}
              </a>
            ) : null}
            {config.linkedin ? (
              <a
                href={config.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn--quiet"
              >
                <Icon name="linkedin" size={13} />
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>

        <aside className="masthead__aside" aria-label="Status dan identitas">
          {config.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="masthead__cover"
              src={config.coverImageUrl}
              alt={`Foto sampul ${config.fullName}`}
              loading="lazy"
            />
          ) : null}
          {config.avatarUrl ? (
            <img
              src={config.avatarUrl}
              alt={`Foto profil ${config.fullName}`}
              width={220}
              height={270}
              style={{
                width: "min(100%, 220px)",
                height: 270,
                objectFit: "cover",
                border: "1px solid var(--line)",
                alignSelf: "flex-start",
                background: "var(--surface)"
              }}
            />
          ) : (
            <div
              aria-label="Tempat foto profil"
              style={{
                width: "min(100%, 220px)",
                height: 270,
                border: "1px dashed var(--line)",
                display: "grid",
                placeContent: "center",
                justifyItems: "center",
                gap: 12,
                padding: 18,
                color: "var(--muted)",
                textAlign: "center",
                background: "var(--surface)"
              }}
            >
              <Icon name="user" size={34} />
              <span className="eyebrow">Foto Profil</span>
              <span style={{ fontSize: 11, lineHeight: 1.5 }}>
                Unggah foto melalui Studio CMS → Konfigurasi
              </span>
            </div>
          )}

          <div
            className="status-chip"
            style={{ alignSelf: "flex-start" }}
            title={config.availabilityNote}
          >
            <span
              className={`dot ${config.availability ? "dot--pulse" : "dot--warn"}`}
              aria-hidden="true"
            />
            {config.availability ? "Terbuka untuk peluang" : "Tidak menerima proyek"}
          </div>

          {config.openToWork ? (
            <div
              className="status-chip"
              style={{ alignSelf: "flex-start" }}
              title={config.openToWorkNote}
            >
              <span className="dot dot--pulse" aria-hidden="true" />
              {config.openToWorkNote || "Terbuka untuk peluang kerja"}
            </div>
          ) : null}

          <ClockWib />

          {socialLinks.length > 0 ? (
            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">Media Sosial</span>
              <SocialLinks links={socialLinks} />
            </div>
          ) : null}

          <dl className="meta-list">
            <div className="meta-row">
              <dt>Lokasi</dt>
              <dd>{config.location}</dd>
            </div>
            {config.address ? (
              <div className="meta-row">
                <dt>Alamat</dt>
                <dd>{config.address}</dd>
              </div>
            ) : null}
            <div className="meta-row">
              <dt>Pendidikan</dt>
              <dd>
                {education.length > 0
                  ? education.map((item) => item.school).join(" · ")
                  : config.education}
              </dd>
            </div>
            <div className="meta-row">
              <dt>Surel</dt>
              <dd>
                <a href={`mailto:${config.email}`} className="link-inline" style={{ borderBottom: 0 }}>
                  {config.email}
                </a>
              </dd>
            </div>
            {config.phone ? (
              <div className="meta-row">
                <dt>Telepon</dt>
                <dd>{config.phone}</dd>
              </div>
            ) : null}
            {config.website ? (
              <div className="meta-row">
                <dt>Situs</dt>
                <dd>
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
            <div className="meta-row">
              <dt>Pembaruan</dt>
              <dd>{formatDateId(config.updatedAt)}</dd>
            </div>
          </dl>

          {config.availabilityNote ? (
            <div
              style={{
                border: "1px solid var(--line)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              <span className="eyebrow">Catatan Ketersediaan</span>
              <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--muted)" }}>
                {config.availabilityNote}
              </p>
            </div>
          ) : null}
        </aside>
      </section>
      ) : null}

      {home.experienceTimeline.visible ? (
        <section className="section" aria-labelledby="home-timeline-title">
          <SectionHead
            index="01.1"
            title={home.experienceTimeline.title}
            meta={`${experiences.length} pengalaman · terbaru di atas`}
          />
          <div className="section-intro">
            <p id="home-timeline-title">{home.experienceTimeline.description}</p>
          </div>
          <div className="timeline home-timeline" style={{ marginTop: 24 }}>
            {experiences.map((experience: Experience) => (
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
                  <div className="timeline__role-row">
                    {experience.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={experience.logoUrl} alt="" className="timeline__logo" loading="lazy" />
                    ) : null}
                    <h3 className="timeline__role">{experience.role}</h3>
                  </div>
                  {experience.organizationUrl ? (
                    <a
                      href={experience.organizationUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="timeline__org link-inline"
                    >
                      {experience.organization}
                      <Icon name="external" size={10} />
                    </a>
                  ) : (
                    <span className="timeline__org">{experience.organization}</span>
                  )}
                  {experience.description ? (
                    <p className="home-timeline__description">{experience.description}</p>
                  ) : null}
                  {experience.highlights.length > 0 ? (
                    <ul className="timeline__points">
                      {experience.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : null}
                  {experience.skills.length > 0 ? <div className="tag-row">{experience.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div> : null}
                </div>
                <div className="timeline__aside">
                  <span className="badge badge--accent">
                    {EXPERIENCE_TYPE_LABELS[experience.type]}
                  </span>
                  <span className="badge">
                    {EMPLOYMENT_TYPE_LABELS[experience.employmentType]}
                  </span>
                  <span className="mono home-timeline__meta">
                    {WORK_MODE_LABELS[experience.workMode]}
                  </span>
                  {experience.location ? (
                    <span className="mono home-timeline__meta">{experience.location}</span>
                  ) : null}
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
      ) : null}

      {home.certifications.visible ? (
        <section className="section" aria-labelledby="home-certifications-title">
          <SectionHead
            index="01.1b"
            title={home.certifications.title}
            meta={`${certifications.length} kredensial`}
          />
          <div className="section-intro">
            <p id="home-certifications-title">{home.certifications.description}</p>
          </div>
          <div className="home-certifications" style={{ marginTop: 24 }}>
            {certifications.map((certification: Certification, index: number) => (
              <article className="home-certification" key={certification.id}>
                <div className="home-certification__top">
                  <span className="mono home-certification__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {certification.imageUrl ? (
                    <a
                      href={certification.imageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="home-certification__image"
                      aria-label={`Buka foto sertifikat ${certification.title}`}
                      title="Buka foto sertifikat"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={certification.imageUrl} alt="" loading="lazy" />
                    </a>
                  ) : null}
                </div>
                <h3>{certification.title}</h3>
                <div className="home-certification__issuer">
                  {certification.issuerLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={certification.issuerLogoUrl} alt="" loading="lazy" />
                  ) : null}
                  <span>{certification.issuer}</span>
                </div>
                <div className="home-certification__dates">
                  <span>Terbit {formatDateId(certification.issueDate)}</span>
                  {certification.expiryDate ? (
                    <span>Kedaluwarsa {formatDateId(certification.expiryDate)}</span>
                  ) : null}
                </div>
                {certification.credentialId ? (
                  <span className="mono home-certification__credential">
                    ID {certification.credentialId}
                  </span>
                ) : null}
                {certification.imageUrl ? (
                  <a
                    href={certification.imageUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-inline"
                  >
                    Lihat foto sertifikat
                    <Icon name="eye" size={10} />
                  </a>
                ) : (
                  <span className="badge">Foto sertifikat belum diunggah</span>
                )}
                {certification.skills.length > 0 ? (
                  <div className="tag-row">
                    {certification.skills.map((skill) => (
                      <span className="tag" key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {certifications.length === 0 ? (
              <div className="empty-state">
                <strong>Belum ada sertifikasi</strong>
                <span>Tambahkan kredensial melalui Studio CMS.</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {home.skills.visible ? (
      <section className="section" aria-labelledby="kompetensi-title">
        <SectionHead
          index="01.2"
          title={home.skills.title}
          meta={`${homepageSkills.length} entri · media & desain`}
        />
        <div className="section-intro">
          <p id="kompetensi-title">{home.skills.description}</p>
        </div>
        {pinnedSkills.length > 0 ? (
          <div className="stack" style={{ gap: 8, marginTop: 20 }}>
            <span className="eyebrow">{home.skills.featuredLabel}</span>
            <div className="tag-row">
              {pinnedSkills.map((skill) => (
                <span key={skill.id} className="tag">
                  {skill.name}
                  {skill.endorsements > 0 ? ` · ${skill.endorsements}` : ""}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="domain-grid domain-grid--creative">
          {(["MEDIA_KREATIF"] as const).map((domain) => (
            <SkillDomainCell key={domain} domain={domain} skills={homepageSkills} />
          ))}
        </div>
      </section>
      ) : null}

      {home.publications.visible ? (
      <section className="section" aria-labelledby="publications-title" id="publikasi">
        <SectionHead
          index="01.3"
          title={home.publications.title}
          meta={`${articles.length} artikel terbit`}
        />
        <div className="section-intro">
          <p id="publications-title">{home.publications.description}</p>
        </div>
        <div className="publication-grid" style={{ marginTop: 24 }}>
          {homepageArticles.map((article: Article, index: number) => (
              <article key={article.id} className="publication-card">
                <div className="publication-card__top">
                  <span className="mono publication-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="badge badge--accent">{article.category}</span>
                </div>
                <h3><Link href={`/publikasi/${article.slug}`}>{article.title}</Link></h3>
                <p>{article.summary}</p>
                <div className="publication-card__meta">
                  <span>{formatDateId(article.publishedAt)}</span>
                  <span>{article.readTime} menit baca</span>
                </div>
                <div className="publication-card__links">
                  <Link href={`/publikasi/${article.slug}`} className="publication-card__action">
                    Baca artikel
                    <Icon name="arrow-right" size={13} />
                  </Link>
                {article.externalUrl ? (
                    <a
                      href={article.externalUrl}
                      className="publication-card__action"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {home.publications.linkLabel}
                      <Icon name="arrow-up-right" size={13} />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          {homepageArticles.length === 0 ? (
            <div className="empty-state">
              <strong>Belum ada artikel terbit</strong>
              <span>Terbitkan artikel melalui Studio CMS untuk menampilkannya di sini.</span>
            </div>
          ) : null}
        </div>
      </section>
      ) : null}

      <ProfileSections sections={profileSections} indexPrefix="02" startAt={1} />
    </div>
  );
}
