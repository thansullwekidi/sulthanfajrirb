import { JournalList } from "@/components/editorial/JournalList";
import { SectionHead } from "@/components/editorial/SectionHead";
import { Icon } from "@/components/ui/Icon";
import { listArticles } from "@/server/repositories/content.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catatan Lab",
  description:
    "Catatan proses desain, eksperimen visual, dan pelajaran produksi media yang ditulis sebagai dokumentasi kerja."
};

export default async function JournalPage() {
  const articles = await listArticles(true);
  const totalMinutes = articles.reduce((sum, article) => sum + article.readTime, 0);
  const categories = [...new Set(articles.map((article) => article.category))];

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
          <span className="eyebrow eyebrow--accent">04 / Catatan Lab</span>
          <span className="eyebrow">
            {String(articles.length).padStart(2, "0")} catatan · {totalMinutes} menit baca
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
            Catatan dari <em>meja kerja.</em>
          </h1>
          <div className="stack" style={{ gap: 12 }}>
            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}>
              Dokumentasi keputusan kreatif: apa yang dicoba, apa yang dipelajari, dan mengapa arah
              visual tertentu dipilih. Ditulis sebagai catatan proses, bukan promosi.
            </p>
            <div className="tag-row">
              {categories.map((category) => (
                <span key={category} className="tag">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionHead
          index="04.1"
          title="Indeks Catatan"
          meta="Terbaru di atas · arsip terbit"
          action={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="book" size={11} />
              {articles.length} dokumen
            </span>
          }
        />
        <JournalList articles={articles} />

        <div
          style={{
            marginTop: 32,
            border: "1px solid var(--line)",
            padding: "18px 20px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 20,
            alignItems: "center"
          }}
        >
          <div className="stack" style={{ gap: 5 }}>
            <span className="eyebrow">Catatan Metodologi</span>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, maxWidth: "78ch" }}>
              Seluruh artikel dibaca langsung dari tabel <span className="mono">articles</span> dengan
              status <span className="mono">PUBLISHED</span>. Waktu baca dihitung dari jumlah kata isi
              artikel (200 kata per menit) saat penyimpanan.
            </p>
          </div>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
            {totalMinutes} MENIT TOTAL
          </span>
        </div>
      </section>
    </div>
  );
}
