export default function LoadingCv() {
  return (
    <div className="shell" aria-busy="true" aria-label="Memuat CV…">
      <section className="cv-toolbar">
        <div className="stack" style={{ gap: 8 }}>
          <span className="skel skel--eyebrow" />
          <div className="skel skel--display" style={{ maxWidth: 260 }} />
          <div className="skel skel--body" style={{ maxWidth: 480 }} />
        </div>
        <span className="skel skel--btn" style={{ alignSelf: "flex-start" }} />
      </section>
      <section
        className="cv-stage"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "min(78vh, 1050px)",
          border: "1px solid var(--line)",
          marginTop: 24
        }}
      >
        <span className="skel-pulse" aria-hidden="true" />
      </section>
    </div>
  );
}
