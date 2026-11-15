import Link from "next/link";
import { CatalogClient } from "@/components/editorial/CatalogClient";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, PROJECT_CATEGORIES } from "@/contracts/domain";
import { listPublishedProjects } from "@/server/repositories/project.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Karya",
  description:
    "Indeks karya desain grafis dan media digital beserta studi kasus, pendekatan visual, metrik, dan artefak yang dapat diperiksa."
};

export default async function CatalogPage() {
  const projects = await listPublishedProjects();
  const categoriesPresent = PROJECT_CATEGORIES.filter((category) =>
    projects.some((project) => project.category === category)
  ).length;
  const commits = projects
    .map((project) => project.commitHash)
    .slice(0, 4)
    .join(" · ");

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
          <span className="eyebrow eyebrow--accent">02 / Katalog Karya</span>
          <span className="eyebrow">
            {String(projects.length).padStart(2, "0")} entri terbit · {categoriesPresent} kategori
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
            Katalog karya yang <em>dapat diperiksa.</em>
          </h1>
          <div className="stack" style={{ gap: 14 }}>
            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}>
              Setiap entri memuat konteks, keputusan visual, metrik, dan tautan artefak. Buka baris
              untuk membaca spesifikasi penuh serta menyalin catatan produksi.
            </p>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.03em" }}>
              COMMIT AKTIF · {commits || "—"}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PROJECT_CATEGORIES.map((category) => (
                <span key={category} className="tag">
                  {CATEGORY_LABELS[category]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CatalogClient projects={projects} />

      <section
        style={{
          padding: "32px 0 64px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 40
        }}
        className="section-intro"
      >
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">Metodologi Penyajian</span>
          <p style={{ color: "var(--muted)", fontSize: 12.5, lineHeight: 1.7 }}>
            Angka pada kolom metrik diambil dari pengukuran yang tercatat pada studi kasus. Karya
            berstatus draf dan arsip tidak pernah muncul di katalog publik — penyaringan dilakukan di
            repositori, bukan di antarmuka.
          </p>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">Kategori Tersedia</span>
          <div className="mono" style={{ fontSize: 10.5, lineHeight: 1.9, color: "var(--muted)" }}>
            {PROJECT_CATEGORIES.map((category, index) => (
              <div key={category} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>
                  {String(index + 1).padStart(2, "0")} / {CATEGORY_LABELS[category]}
                </span>
                <span>{projects.filter((project) => project.category === category).length} karya</span>
              </div>
            ))}
          </div>
          <Link href="/kontak" className="link-inline" style={{ alignSelf: "flex-start" }}>
            Diskusikan karya
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
