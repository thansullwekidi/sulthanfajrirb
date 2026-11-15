import { Icon } from "@/components/ui/Icon";
import {
  PROFILE_ENTRY_LABELS,
  PROFILE_SECTION_LAYOUT,
  type ProfileEntry,
  type ProfileSection
} from "@/contracts/domain";

/**
 * Render bagian profil bergaya LinkedIn memakai kelas editorial yang sudah ada
 * (timeline, data-table, stack-grid, quote-grid) agar bahasa visual situs tetap sama.
 * Semua kolom media bersifat kondisional: tidak ada ruang kosong bila data belum diisi.
 */

function period(entry: ProfileEntry): string {
  if (!entry.startDate && !entry.endDate) return "";
  if (entry.isCurrent) return `${entry.startDate || "—"} — Sekarang`;
  if (!entry.endDate) return entry.startDate;
  return `${entry.startDate} — ${entry.endDate}`;
}

/** Label tautan menyesuaikan jenis bagian (publikasi, paten, sorotan, dsb.). */
function linkLabel(section: ProfileSection): string {
  const labels = PROFILE_ENTRY_LABELS[section.kind];
  if (section.kind === "PUBLICATIONS") return "Buka publikasi";
  if (section.kind === "PATENTS") return "Buka dokumen paten";
  if (section.kind === "FEATURED") return "Buka sorotan";
  if (section.kind === "SERVICES") return "Pesan layanan";
  if (section.kind === "RECOMMENDATIONS") return "Lihat profil";
  if (section.kind === "EDUCATION") return "Situs institusi";
  if (section.kind === "ACTIVITY") return "Lihat unggahan";
  return labels.urlLabel ?? "Buka tautan";
}

function EntryTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

/** Logo kecil di samping judul (institusi pendidikan, organisasi, relawan). */
function EntryLogo({ url, title }: { url: string; title: string }) {
  if (!url) return null;
  return (
    <span
      style={{
        width: 34,
        height: 34,
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
        src={url}
        alt={`Logo ${title}`}
        width={34}
        height={34}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        loading="lazy"
      />
    </span>
  );
}

function EntryLink({
  url,
  label,
  variant = "inline"
}: {
  url: string;
  label: string;
  variant?: "inline" | "block";
}) {
  if (!url) return null;

  if (variant === "block") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="btn btn--sm"
        style={{ alignSelf: "flex-start" }}
      >
        {label}
        <Icon name="arrow-up-right" size={11} />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="link-inline"
      style={{ alignSelf: "flex-start", fontSize: 11 }}
    >
      {label}
      <Icon name="external" size={11} />
    </a>
  );
}

/** Penulis & penerbit — hanya untuk jenis yang menyediakannya (publikasi/paten/kustom). */
function EntryByline({ entry }: { entry: ProfileEntry }) {
  if (!entry.authors && !entry.publisher) return null;
  return (
    <div
      className="mono"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 12px",
        fontSize: 9.5,
        letterSpacing: "0.03em",
        color: "var(--muted)"
      }}
    >
      {entry.authors ? <span>Penulis: {entry.authors}</span> : null}
      {entry.publisher ? <span>Penerbit: {entry.publisher}</span> : null}
    </div>
  );
}

/** Gambar entri (sampul publikasi, foto sertifikat, gambar sorotan). */
function EntryImage({ url, title, wide }: { url: string; title: string; wide?: boolean }) {
  if (!url) return null;
  return (
    <span
      style={{
        display: "block",
        border: "1px solid var(--line)",
        overflow: "hidden",
        background: "var(--surface)",
        maxWidth: wide ? "100%" : 220
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={title}
        loading="lazy"
        style={{
          width: "100%",
          height: "auto",
          maxHeight: wide ? 260 : 150,
          objectFit: "cover",
          display: "block"
        }}
      />
    </span>
  );
}

function TimelineLayout({ section }: { section: ProfileSection }) {
  const entries = section.entries.filter((entry) => entry.visible);
  return (
    <div className="timeline" style={{ marginTop: 24 }}>
      {entries.map((entry) => (
        <div key={entry.id} className="timeline__row">
          <div className="timeline__period">{period(entry) || "—"}</div>
          <div className="timeline__body">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <EntryLogo url={entry.logoUrl} title={entry.title} />
              <div className="stack" style={{ gap: 3 }}>
                <h3 className="timeline__role">{entry.title}</h3>
                {entry.subtitle ? <span className="timeline__org">{entry.subtitle}</span> : null}
                <EntryByline entry={entry} />
              </div>
            </div>
            {entry.description ? (
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--muted)", maxWidth: "70ch" }}>
                {entry.description}
              </p>
            ) : null}
            {entry.imageUrl ? <EntryImage url={entry.imageUrl} title={entry.title} /> : null}
            <EntryTags tags={entry.tags} />
            <EntryLink url={entry.url} label={linkLabel(section)} />
          </div>
          <div className="timeline__aside">
            {entry.meta ? <span className="badge badge--accent">{entry.meta}</span> : null}
            {entry.location ? (
              <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                {entry.location}
              </span>
            ) : null}
            {entry.isCurrent ? <span className="badge badge--ok">Berlangsung</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListLayout({ section }: { section: ProfileSection }) {
  const entries = section.entries.filter((entry) => entry.visible);
  const hasSubtitle = entries.some((entry) => entry.subtitle);
  const hasMeta = entries.some((entry) => entry.meta);
  const hasDate = entries.some((entry) => entry.startDate || entry.endDate);
  const hasLogo = entries.some((entry) => entry.logoUrl || entry.imageUrl);
  const hasByline = entries.some((entry) => entry.authors || entry.publisher);

  return (
    <div style={{ overflowX: "auto", marginTop: 24 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>No</th>
            <th>Entri</th>
            {hasByline ? <th style={{ width: 190 }}>Penulis / Penerbit</th> : null}
            {hasSubtitle ? <th style={{ width: 200 }}>Keterangan</th> : null}
            {hasMeta ? <th style={{ width: 150 }}>Tambahan</th> : null}
            {hasDate ? <th style={{ width: 160 }}>Periode</th> : null}
            {hasLogo ? <th style={{ width: 120 }}>Media</th> : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id}>
              <td className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                {String(index + 1).padStart(2, "0")}
              </td>
              <td>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <EntryLogo url={entry.logoUrl} title={entry.title} />
                  <div>
                    <div style={{ fontSize: 13 }}>{entry.title}</div>
                    {entry.description ? (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--muted)",
                          lineHeight: 1.6,
                          marginTop: 4
                        }}
                      >
                        {entry.description}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 6 }}>
                      <EntryLink url={entry.url} label={linkLabel(section)} />
                    </div>
                  </div>
                </div>
              </td>
              {hasByline ? (
                <td style={{ color: "var(--muted)", fontSize: 11.5 }}>
                  {entry.authors ? <div>{entry.authors}</div> : null}
                  {entry.publisher ? (
                    <div className="mono" style={{ fontSize: 9.5, marginTop: 3 }}>
                      {entry.publisher}
                    </div>
                  ) : null}
                  {!entry.authors && !entry.publisher ? "—" : null}
                </td>
              ) : null}
              {hasSubtitle ? (
                <td style={{ color: "var(--muted)" }}>{entry.subtitle || "—"}</td>
              ) : null}
              {hasMeta ? (
                <td className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                  {entry.meta || "—"}
                </td>
              ) : null}
              {hasDate ? (
                <td className="mono" style={{ fontSize: 9.5 }}>
                  {period(entry) || "—"}
                </td>
              ) : null}
              {hasLogo ? (
                <td>
                  <EntryImage url={entry.imageUrl} title={entry.title} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridLayout({ section }: { section: ProfileSection }) {
  const entries = section.entries.filter((entry) => entry.visible);
  return (
    <div className="stack-grid" style={{ marginTop: 24 }}>
      {entries.map((entry) => (
        <div key={entry.id} className="stack-group">
          <div className="stack-group__head">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <EntryLogo url={entry.logoUrl} title={entry.title} />
              <div className="stack" style={{ gap: 3 }}>
                {entry.subtitle ? <span className="eyebrow">{entry.subtitle}</span> : null}
                <h3 className="mono" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                  {entry.title}
                </h3>
              </div>
            </div>
            {entry.startDate ? (
              <span className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                {period(entry)}
              </span>
            ) : null}
          </div>
          <EntryImage url={entry.imageUrl} title={entry.title} wide />
          {entry.description ? (
            <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.65 }}>
              {entry.description}
            </p>
          ) : null}
          <EntryByline entry={entry} />
          <EntryTags tags={entry.tags} />
          <EntryLink url={entry.url} label={linkLabel(section)} />
        </div>
      ))}
    </div>
  );
}

function PostsLayout({ section }: { section: ProfileSection }) {
  const entries = section.entries.filter((entry) => entry.visible);
  return (
    <div className="quote-grid" style={{ marginTop: 24 }}>
      {entries.map((entry) => (
        <figure key={entry.id} className="quote" style={{ margin: 0 }}>
          {entry.subtitle ? <span className="eyebrow">{entry.subtitle}</span> : null}
          <blockquote className="quote__text">{entry.description || entry.title}</blockquote>
          <EntryImage url={entry.imageUrl} title={entry.title} wide />
          <figcaption className="quote__author">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <EntryLogo url={entry.logoUrl} title={entry.title} />
              <div className="stack" style={{ gap: 2 }}>
                <span className="quote__name">{entry.title}</span>
                {entry.meta ? <span className="quote__role">{entry.meta}</span> : null}
                {period(entry) ? <span className="quote__role">{period(entry)}</span> : null}
              </div>
            </div>
            <EntryByline entry={entry} />
            <EntryLink url={entry.url} label={linkLabel(section)} variant="block" />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function SectionBody({ section }: { section: ProfileSection }) {
  const layout = PROFILE_SECTION_LAYOUT[section.kind];

  switch (layout) {
    case "TIMELINE":
      return <TimelineLayout section={section} />;
    case "GRID":
      return <GridLayout section={section} />;
    case "POSTS":
      return <PostsLayout section={section} />;
    default:
      return <ListLayout section={section} />;
  }
}

export function ProfileSections({
  sections,
  indexPrefix,
  startAt
}: {
  sections: ProfileSection[];
  indexPrefix: string;
  startAt: number;
}) {
  const visible = sections
    .filter((section) => section.visible)
    .filter((section) => section.entries.some((entry) => entry.visible));

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((section, index) => (
        <section
          key={section.id}
          className="section"
          aria-labelledby={`profil-${section.slug}-title`}
          id={`profil-${section.slug}`}
        >
          <div className="section-head">
            <span className="section-head__index">
              {`${indexPrefix}.${startAt + index}`}
            </span>
            <h2 className="section-head__title" id={`profil-${section.slug}-title`}>
              {section.title}
            </h2>
            <div className="section-head__meta">
              {section.subtitle ||
                `${section.entries.filter((entry) => entry.visible).length} entri`}
            </div>
          </div>
          <SectionBody section={section} />
        </section>
      ))}
    </>
  );
}
