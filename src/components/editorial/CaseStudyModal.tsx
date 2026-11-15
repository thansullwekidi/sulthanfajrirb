"use client";

import { useEffect } from "react";
import { CopyButton } from "@/components/editorial/CopyButton";
import { MarkdownBlock } from "@/components/editorial/MarkdownBlock";
import { TechnicalBlueprintSVG } from "@/components/editorial/TechnicalBlueprintSVG";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, type Project } from "@/contracts/domain";
import { formatDateId } from "@/contracts/primitives";

interface CaseStudyModalProps {
  project: Project;
  onClose: () => void;
}

export function CaseStudyModal({ project, onClose }: CaseStudyModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="case-study-title">
        <div className="modal__bar">
          <div className="modal__bar-meta">
            <span>Spesifikasi Karya</span>
            <span style={{ color: "var(--line-strong)" }}>/</span>
            <span>{project.slug}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Tutup pembaca spesifikasi"
          >
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
            <span className="badge badge--accent">{CATEGORY_LABELS[project.category]}</span>
            <span className="badge badge--ok">TERPUBLIKASI</span>
            {project.isFeatured ? <span className="badge badge--warn">UNGGULAN</span> : null}
            <span className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
              {project.commitHash}
            </span>
          </div>

          <h2 className="modal__title" id="case-study-title">
            {project.title}
          </h2>
          <p className="modal__sub">{project.subtitle}</p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginTop: 20
            }}
          >
            <div className="tag-row">
              {project.techStack.map((tech) => (
                <span key={tech} className="tag">
                  {tech}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.links.github ? (
                <a
                  href={project.links.github}
                  className="btn btn--sm"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="github" size={12} />
                  GitHub
                </a>
              ) : null}
              {project.links.live ? (
                <a
                  href={project.links.live}
                  className="btn btn--sm"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="external" size={12} />
                  Demo Live
                </a>
              ) : null}
              {project.links.notebook ? (
                <a
                  href={project.links.notebook}
                  className="btn btn--sm"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon name="code" size={12} />
                  Notebook .ipynb
                </a>
              ) : null}
            </div>
          </div>

          <div className="spec-grid">
            <div className="spec-cell">
              <span className="spec-cell__label">{project.metricLabel}</span>
              <span className="spec-cell__value" style={{ fontSize: 18 }}>
                {project.metricValue}
              </span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell__label">Teknologi</span>
              <span className="spec-cell__value">{project.techStack.length} komponen</span>
            </div>
            <div className="spec-cell">
              <span className="spec-cell__label">Pembaruan Terakhir</span>
              <span className="spec-cell__value">{formatDateId(project.updatedAt)}</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.8fr)",
              gap: 24,
              alignItems: "start",
              paddingBottom: 8
            }}
          >
            <div>
              <div className="prose-block" style={{ borderTop: 0, paddingTop: 0 }}>
                <span className="prose-block__label">Tantangan Teknis</span>
                <div className="prose-block__body">
                  <p>{project.challenge}</p>
                </div>
              </div>
              <div className="prose-block">
                <span className="prose-block__label">Solusi Arsitektur</span>
                <div className="prose-block__body">
                  <p>{project.solution}</p>
                </div>
              </div>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="eyebrow">Diagram / {project.diagramType}</span>
              <TechnicalBlueprintSVG type={project.diagramType} />
            </div>
          </div>

          {project.caseStudy ? (
            <div className="prose-block">
              <span className="prose-block__label">Studi Kasus</span>
              <div className="prose-block__body">
                <MarkdownBlock content={project.caseStudy} />
              </div>
            </div>
          ) : null}

          {project.codeSnippet ? (
            <div className="prose-block">
              <span className="prose-block__label">Cuplikan Produksi</span>
              <div className="prose-block__body">
                <div className="code-block">
                  <div className="code-block__bar">
                    <span>kode inti · {project.commitHash}</span>
                    <CopyButton value={project.codeSnippet} />
                  </div>
                  <pre>
                    <code>{project.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              borderTop: "1px solid var(--line)",
              paddingTop: 16,
              marginTop: 8
            }}
          >
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              ID {project.id.toUpperCase()} · DIBUAT {formatDateId(project.createdAt).toUpperCase()}
            </span>
            <button type="button" className="btn" onClick={onClose}>
              <Icon name="arrow-right" size={13} />
              Tutup Spesifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
