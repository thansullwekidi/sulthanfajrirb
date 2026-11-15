import Link from "next/link";
import { ClockWib } from "@/components/editorial/ClockWib";
import { SectionHead, Sparkline } from "@/components/editorial/SectionHead";
import { SocialLinks } from "@/components/editorial/SocialLinks";
import { TechnicalBlueprintSVG } from "@/components/editorial/TechnicalBlueprintSVG";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORY_LABELS,
  CATEGORY_CODES,
  resolveEducation,
  type Project,
  type Skill,
  type SkillDomain,
  SKILL_DOMAINS
} from "@/contracts/domain";
import { formatDateId } from "@/contracts/primitives";
import { getSiteConfig } from "@/server/repositories/config.repository";
import {
  listArticles,
  listSkills,
  listTestimonials
} from "@/server/repositories/content.repository";
import { listProfileSections } from "@/server/repositories/profile.repository";
import {
  listFeaturedProjects,
  listAllProjects,
  listPublishedProjects
} from "@/server/repositories/project.repository";
import { listSocialLinks } from "@/server/repositories/social.repository";

export const dynamic = "force-dynamic";

function MetricCell({ project }: { project: Project }) {
  return (
    <div className="work-row__metric">
      <div>
        <div className="eyebrow" style={{ marginBottom: 5 }}>
          {project.metricLabel}
        </div>
        <div className="work-row__metric-value">{project.metricValue}</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8
        }}
      >
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {project.commitHash}
        </span>
        <span className="work-row__arrow" aria-hidden="true">
          <Icon name="arrow-up-right" size={16} />
        </span>
      </div>
    </div>
  );
}

function FeaturedRow({ project, index }: { project: Project; index: number }) {
  return (
    <Link
      href={`/karya?karya=${project.slug}`}
      className="work-row"
      aria-label={`Buka studi kasus ${project.title}`}
    >
      <div className="work-row__index">{String(index + 1).padStart(2, "0")}</div>
      <div className="work-row__body">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span className="badge badge--accent">{CATEGORY_LABELS[project.category]}</span>
          <span className="badge">UNGGULAN</span>
        </div>
        <h3 className="work-row__title">{project.title}</h3>
        <p className="work-row__sub">{project.subtitle}</p>
        <div className="tag-row">
          {project.techStack.slice(0, 5).map((tech) => (
            <span key={tech} className="tag">
              {tech}
            </span>
          ))}
        </div>
      </div>
      <div className="work-row__diagram">
        <TechnicalBlueprintSVG type={project.diagramType} compact />
      </div>
      <MetricCell project={project} />
    </Link>
  );
}

function SkillDomainCell({ domain, skills }: { domain: SkillDomain; skills: Skill[] }) {
  const scoped = skills.filter((skill) => skill.category === domain);
  return (
    <div className="domain-cell">
      <div className="domain-cell__head">
        <span className="domain-cell__title">{CATEGORY_LABELS[domain]}</span>
        <span className="domain-cell__code">{CATEGORY_CODES[domain]}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const [
    config,
    projects,
    allProjects,
    featured,
    articles,
    skills,
    testimonials,
    socialLinks,
    profileSections
  ] = await Promise.all([
    getSiteConfig(),
    listPublishedProjects(),
    listAllProjects(),
    listFeaturedProjects(),
    listArticles(true),
    listSkills(),
    listTestimonials(),
    listSocialLinks(true),
    listProfileSections(true)
  ]);

  const education = resolveEducation(profileSections, config.education);

  const verifiedMetrics = projects.filter((project) => project.metricValue.trim().length > 0).length;
  const pinnedSkills = skills.filter((skill) => skill.pinned);
  const metricCoverage = projects.length === 0 ? 0 : Math.round((verifiedMetrics / projects.length) * 100);
  const totalReadingMinutes = articles.reduce((sum, article) => sum + article.readTime, 0);
  const drafts = allProjects.filter((project) => project.status === "DRAFT").length;

  return (
    <div className="shell">
      <section className="masthead" aria-labelledby="ringkasan-title">
        <div className="masthead__main">
          <div className="headline-split">
            <span className="eyebrow">Dossier Desain / Edisi 2026</span>
            {config.nim ? (
              <span className="eyebrow eyebrow--accent">NIM {config.nim}</span>
            ) : null}
          </div>

          <h1 className="display" id="ringkasan-title">
            Muhammad Sulthan
            <br />
            Fajri <em>Rabbani</em>
          </h1>

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
              Buka CV ATS
            </Link>
            <Link href="/kontak" className="btn">
              <Icon name="mail" size={13} />
              Kirim Diskusi
            </Link>
            {config.github ? (
              <a
                href={config.github}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn--quiet"
              >
                <Icon name="github" size={13} />
                Repositori
              </a>
            ) : null}
          </div>
        </div>

        <aside className="masthead__aside" aria-label="Status dan identitas">
          {config.avatarUrl ? (
            <img
              src={config.avatarUrl}
              alt={`Foto profil ${config.fullName}`}
              width={72}
              height={72}
              style={{
                width: 72,
                height: 72,
                objectFit: "cover",
                border: "1px solid var(--line)",
                alignSelf: "flex-start"
              }}
            />
          ) : null}

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
            {config.connections > 0 ? (
              <div className="meta-row">
                <dt>Koneksi</dt>
                <dd>{config.connections}</dd>
              </div>
            ) : null}
            {config.followers > 0 ? (
              <div className="meta-row">
                <dt>Pengikut</dt>
                <dd>{config.followers}</dd>
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

      <section className="kpi" aria-label="Indikator kinerja utama">
        <div className="kpi__cell">
          <div className="kpi__top">
            <span className="kpi__label">Karya Terpublikasi</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--ok)" }}>
              LIVE
            </span>
          </div>
          <div className="kpi__value">
            {String(projects.length).padStart(2, "0")}
            <small>/ {String(projects.length + drafts).padStart(2, "0")}</small>
          </div>
          <Sparkline values={[2, 3, 3, 4, 4, 4]} />
          <div className="kpi__foot">
            <span>Terverifikasi di katalog</span>
            <span>{projects.length} entri</span>
          </div>
        </div>

        <div className="kpi__cell">
          <div className="kpi__top">
            <span className="kpi__label">Metrik Terverifikasi</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--ok)" }}>
              {verifiedMetrics}/{projects.length}
            </span>
          </div>
          <div className="kpi__value">
            {metricCoverage}
            <small>%</small>
          </div>
          <Sparkline values={[64, 72, 80, 88, 94, metricCoverage]} accent />
          <div className="kpi__foot">
            <span>Tiap karya memiliki metrik terukur</span>
          </div>
        </div>

        <div className="kpi__cell">
          <div className="kpi__top">
            <span className="kpi__label">Artikel Jurnal</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              LAB NOTES
            </span>
          </div>
          <div className="kpi__value">
            {String(articles.length).padStart(2, "0")}
            <small>artikel</small>
          </div>
          <Sparkline values={[1, 1, 2, 3, 3, 4]} />
          <div className="kpi__foot">
            <span>{totalReadingMinutes} menit total baca</span>
          </div>
        </div>

        <div className="kpi__cell">
          <div className="kpi__top">
            <span className="kpi__label">Kompetensi Teknis</span>
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              4 DOMAIN
            </span>
          </div>
          <div className="kpi__value">
            {String(skills.length).padStart(2, "0")}
            <small>entri</small>
          </div>
          <Sparkline values={[6, 7, 9, 10, 11, skills.length]} />
          <div className="kpi__foot">
            <span>Direktori keahlian terukur</span>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="sorotan-title">
        <SectionHead
          index="01.1"
          title="Sorotan Karya Unggulan"
          meta={`${featured.length} karya · urutan deterministik`}
        />
        <div className="section-intro">
          <p id="sorotan-title">
            Karya pilihan dengan bukti visual paling kuat. Setiap entri memuat pendekatan desain,
            metrik capaian, dan tautan ke artefak. Data dibaca langsung dari basis data Studio, bukan
            dari berkas statis.
          </p>
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">Status Basis Data</span>
            <span className="mono" style={{ fontSize: 11 }}>
              {verifiedMetrics} metrik · {skills.length} kompetensi · {testimonials.length} rekomendasi
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
              Sinkronisasi terakhir {formatDateId(config.updatedAt)}
            </span>
          </div>
        </div>
        <div className="work-list" style={{ marginTop: 24 }}>
          {featured.map((project, index) => (
            <FeaturedRow key={project.id} project={project} index={index} />
          ))}
          {featured.length === 0 ? (
            <div className="empty-state">
              <strong>Belum ada karya unggulan</strong>
              <span>Tandai proyek sebagai unggulan dari Studio CMS.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" aria-labelledby="kompetensi-title">
        <SectionHead
          index="01.2"
          title="Matriks Kompetensi 4-Domain"
          meta={`${skills.length} entri · skala 0—100`}
        />
        <div className="section-intro">
          <p id="kompetensi-title">
            Penguasaan diukur dari artefak yang dapat diperiksa: portofolio, berkas sumber, dan materi
            terbit. Angka pada bilah menunjukkan tingkat kemahiran yang diklaim, bukan sertifikasi
            otomatis.
          </p>
          <Link href="/rekam-jejak" className="link-inline" style={{ alignSelf: "end" }}>
            Rekam jejak lengkap
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
        {pinnedSkills.length > 0 ? (
          <div className="stack" style={{ gap: 8, marginTop: 20 }}>
            <span className="eyebrow">Keahlian Unggulan</span>
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
        <div className="domain-grid">
          {SKILL_DOMAINS.map((domain) => (
            <SkillDomainCell key={domain} domain={domain} skills={skills} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="rekomendasi-title">
        <SectionHead
          index="01.3"
          title="Rekomendasi Terverifikasi"
          meta={`${testimonials.length} sumber · 2024—2026`}
        />
        <div className="quote-grid" style={{ marginTop: 24 }}>
          {testimonials.map((testimonial) => (
            <figure key={testimonial.id} className="quote" style={{ margin: 0 }}>
              <span className="quote__mark" aria-hidden="true">
                “
              </span>
              <blockquote className="quote__text">{testimonial.quote}</blockquote>
              <figcaption className="quote__author">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {testimonial.avatarUrl ? (
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        flex: "0 0 auto",
                        border: "1px solid var(--line)",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        background: "var(--surface)"
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={testimonial.avatarUrl}
                        alt={testimonial.author}
                        width={32}
                        height={32}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </span>
                  ) : null}
                  <div className="stack" style={{ gap: 2 }}>
                    <span className="quote__name">{testimonial.author}</span>
                    <span className="quote__role">
                      {testimonial.role} · {testimonial.organization}
                    </span>
                  </div>
                </div>
                <span className="badge badge--ok" style={{ alignSelf: "flex-start" }}>
                  {testimonial.verifiedTag}
                </span>
                {testimonial.date ? (
                  <span
                    className="mono"
                    style={{ alignSelf: "flex-start", fontSize: 10, color: "var(--muted)" }}
                  >
                    {formatDateId(testimonial.date)}
                  </span>
                ) : null}
                {testimonial.relationship ? (
                  <span style={{ alignSelf: "flex-start", fontSize: 11, color: "var(--muted)" }}>
                    {testimonial.relationship}
                  </span>
                ) : null}
                {testimonial.profileUrl ? (
                  <a
                    href={testimonial.profileUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-inline"
                    style={{ alignSelf: "flex-start", fontSize: 11 }}
                  >
                    Lihat profil
                    <Icon name="external" size={10} />
                  </a>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
