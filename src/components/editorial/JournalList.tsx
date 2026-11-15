"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/editorial/CopyButton";
import { MarkdownBlock } from "@/components/editorial/MarkdownBlock";
import { Icon } from "@/components/ui/Icon";
import type { Article } from "@/contracts/domain";
import { formatDateId } from "@/contracts/primitives";

export function JournalList({ articles }: { articles: Article[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("artikel");
    if (slug && articles.some((article) => article.slug === slug)) setSelectedSlug(slug);
  }, [articles]);

  const selected = useMemo(
    () => articles.find((article) => article.slug === selectedSlug) ?? null,
    [articles, selectedSlug]
  );

  useEffect(() => {
    if (!selected) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function open(article: Article) {
    setSelectedSlug(article.slug);
    const url = new URL(window.location.href);
    url.searchParams.set("artikel", article.slug);
    window.history.replaceState(null, "", url.toString());
  }

  function close() {
    setSelectedSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("artikel");
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <>
      <div className="journal-list" style={{ marginTop: 24 }}>
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            className="journal-row"
            onClick={() => open(article)}
            aria-label={`Baca artikel ${article.title}`}
          >
            <span className="journal-row__date">{formatDateId(article.publishedAt)}</span>
            <span>
              <span className="journal-row__title" style={{ display: "block" }}>
                {article.title}
              </span>
              <span className="journal-row__summary" style={{ display: "block" }}>
                {article.summary}
              </span>
            </span>
            <span className="journal-row__meta">{article.category}</span>
            <span className="journal-row__meta journal-row__time" style={{ justifyContent: "flex-end" }}>
              <Icon name="clock" size={11} />
              &nbsp;{article.readTime} mnt
            </span>
          </button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <strong>Belum ada catatan terbit</strong>
          <span>Artikel berstatus draf tidak ditampilkan di halaman publik.</span>
        </div>
      ) : null}

      {selected ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="article-title">
            <div className="modal__bar">
              <div className="modal__bar-meta">
                <span>Catatan Lab</span>
                <span style={{ color: "var(--line-strong)" }}>/</span>
                <span>{selected.slug}</span>
              </div>
              <button type="button" className="icon-btn" onClick={close} aria-label="Tutup artikel">
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="modal__body">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12
                }}
              >
                <span className="badge badge--accent">{selected.category}</span>
                <span className="badge">{selected.readTime} menit baca</span>
                <span className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                  {formatDateId(selected.publishedAt)}
                </span>
              </div>

              <h2 className="modal__title" id="article-title">
                {selected.title}
              </h2>
              <p className="modal__sub">{selected.summary}</p>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line)",
                  maxWidth: "74ch",
                }}
              >
                <MarkdownBlock content={selected.content} />
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderTop: "1px solid var(--line)",
                  paddingTop: 16,
                  marginTop: 24
                }}
              >
                <CopyButton
                  value={`# ${selected.title}\n\n${selected.summary}\n\n${selected.content}`}
                  label="Salin Artikel"
                  className="btn btn--sm"
                />
                <button type="button" className="btn" onClick={close}>
                  <Icon name="arrow-right" size={13} />
                  Kembali ke Indeks
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
