export default function LoadingPage() {
  return (
    <div className="shell" aria-busy="true" aria-label="Memuat halaman…">
      <section className="masthead">
        <div className="masthead__main">
          <div className="headline-split">
            <span className="skel skel--eyebrow" />
          </div>
          <div className="skel skel--display" style={{ marginTop: 10 }} />
          <div className="skel skel--body" style={{ marginTop: 14, maxWidth: 480 }} />
          <div className="skel skel--body" style={{ marginTop: 6, maxWidth: 360 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <span className="skel skel--btn" />
            <span className="skel skel--btn" />
          </div>
        </div>
        <aside className="masthead__aside">
          <div className="skel skel--avatar" />
          <div className="skel skel--chip" style={{ marginTop: 14 }} />
        </aside>
      </section>

      <section className="section" style={{ marginTop: 48 }}>
        <div className="skel skel--section-head" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          <div className="skel skel--card" />
          <div className="skel skel--card" />
        </div>
      </section>
    </div>
  );
}
