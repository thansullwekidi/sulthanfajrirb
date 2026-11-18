export default function LoadingKontak() {
  return (
    <div className="shell" aria-busy="true" aria-label="Memuat halaman kontak…">
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
          <span className="skel skel--eyebrow" />
        </div>
      </section>

      <div className="contact-layout">
        <aside className="contact-aside">
          <div className="skel skel--display" style={{ maxWidth: 320 }} />
          <div className="skel skel--body" style={{ marginTop: 20, maxWidth: 440 }} />
          <div className="skel skel--body" style={{ marginTop: 6, maxWidth: 360 }} />
          <div className="skel skel--chip" style={{ marginTop: 20 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <div className="skel skel--body" style={{ maxWidth: 220 }} />
            <div className="skel skel--body" style={{ maxWidth: 280 }} />
            <div className="skel skel--body" style={{ maxWidth: 200 }} />
          </div>
        </aside>
        <div className="contact-main">
          <div className="skel skel--card" style={{ minHeight: 320 }} />
        </div>
      </div>
    </div>
  );
}
