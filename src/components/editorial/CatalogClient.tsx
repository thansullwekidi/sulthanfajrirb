"use client";

import { useEffect, useMemo, useState } from "react";
import { CaseStudyModal } from "@/components/editorial/CaseStudyModal";
import { TechnicalBlueprintSVG } from "@/components/editorial/TechnicalBlueprintSVG";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORY_LABELS,
  PROJECT_CATEGORIES,
  type Project,
  type ProjectCategory
} from "@/contracts/domain";

type CategoryFilter = "ALL" | ProjectCategory;
type ViewMode = "TABLE" | "GRID";

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  ...PROJECT_CATEGORIES.map((category) => ({
    value: category as CategoryFilter,
    label: CATEGORY_LABELS[category]
  }))
];

export function CatalogClient({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("TABLE");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("karya");
    if (!slug) return;
    if (projects.some((project) => project.slug === slug)) setSelectedSlug(slug);
  }, [projects]);

  const selected = useMemo(
    () => projects.find((project) => project.slug === selectedSlug) ?? null,
    [projects, selectedSlug]
  );

  const openProject = (project: Project) => {
    setSelectedSlug(project.slug);
    const url = new URL(window.location.href);
    url.searchParams.set("karya", project.slug);
    window.history.replaceState(null, "", url.toString());
  };

  const closeProject = () => {
    setSelectedSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("karya");
    window.history.replaceState(null, "", url.toString());
  };

  const counts = useMemo(() => {
    const map = new Map<CategoryFilter, number>();
    map.set("ALL", projects.length);
    for (const item of PROJECT_CATEGORIES) {
      map.set(
        item,
        projects.filter((project) => project.category === item).length
      );
    }
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = category === "ALL" || project.category === category;
      if (!matchesCategory) return false;
      if (!term) return true;
      const haystack = [
        project.title,
        project.subtitle,
        project.slug,
        project.metricLabel,
        project.metricValue,
        ...project.techStack
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [category, projects, query]);

  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs" role="tablist" aria-label="Filter kategori karya">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={category === filter.value}
              className="filter-tab"
              data-active={category === filter.value}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
              <span className="filter-tab__count">{counts.get(filter.value) ?? 0}</span>
            </button>
          ))}
        </div>

        <label className="search-box">
          <Icon name="search" size={13} />
          <span className="sr-only">Cari karya</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, teknologi, metrik…"
            type="search"
          />
        </label>

        <div className="view-toggle" role="group" aria-label="Mode tampilan katalog">
          <button
            type="button"
            data-active={view === "TABLE"}
            onClick={() => setView("TABLE")}
            aria-pressed={view === "TABLE"}
          >
            <Icon name="table" size={12} /> Indeks
          </button>
          <button
            type="button"
            data-active={view === "GRID"}
            onClick={() => setView("GRID")}
            aria-pressed={view === "GRID"}
          >
            <Icon name="grid" size={12} /> Cetak Biru
          </button>
        </div>
      </div>

      <div className="filter-summary">
        <span>
          {String(filtered.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}{" "}
          karya · {category === "ALL" ? "semua kategori" : CATEGORY_LABELS[category]}
        </span>
        <span>Hanya status PUBLISHED · urutan indeks deterministik</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <strong>Tidak ada karya yang cocok</strong>
          <span>
            Hapus kata kunci pencarian atau pilih kategori “Semua” untuk melihat seluruh katalog.
          </span>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              setQuery("");
              setCategory("ALL");
            }}
          >
            Reset filter
          </button>
        </div>
      ) : view === "TABLE" ? (
        <div style={{ overflowX: "auto" }}>
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>No</th>
                <th>Karya</th>
                <th style={{ width: 150 }}>Kategori</th>
                <th style={{ width: 170 }}>Metrik</th>
                <th style={{ width: 200 }}>Teknologi</th>
                <th style={{ width: 90 }}>Commit</th>
                <th style={{ width: 34 }} aria-label="Buka" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, index) => (
                <tr
                  key={project.id}
                  onClick={() => openProject(project)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openProject(project);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Buka ${project.title}`}
                >
                  <td className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <div className="catalog-table__title">{project.title}</div>
                    <div className="catalog-table__sub">{project.subtitle}</div>
                  </td>
                  <td>
                    <span className="badge">{CATEGORY_LABELS[project.category]}</span>
                    {project.isFeatured ? (
                      <div style={{ marginTop: 5 }}>
                        <span className="badge badge--accent">UNGGULAN</span>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="eyebrow">{project.metricLabel}</div>
                    <div
                      className="mono"
                      style={{ fontSize: 12.5, marginTop: 3, letterSpacing: "-0.01em" }}
                    >
                      {project.metricValue}
                    </div>
                  </td>
                  <td>
                    <div className="tag-row">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className="tag">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 ? (
                        <span className="tag">+{project.techStack.length - 3}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 9.5, color: "var(--muted)" }}>
                    {project.commitHash}
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    <Icon name="arrow-up-right" size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map((project, index) => (
            <button
              key={project.id}
              type="button"
              className="catalog-card"
              onClick={() => openProject(project)}
              aria-label={`Buka studi kasus ${project.title}`}
            >
              <div className="catalog-card__head">
                <span className="catalog-card__index">
                  {String(index + 1).padStart(2, "0")} / {project.diagramType}
                </span>
                <span className="badge">{CATEGORY_LABELS[project.category]}</span>
              </div>
              <TechnicalBlueprintSVG type={project.diagramType} compact />
              <h3 className="catalog-card__title">{project.title}</h3>
              <p className="catalog-card__sub">{project.subtitle}</p>
              <div className="tag-row">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span key={tech} className="tag">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="catalog-card__foot">
                <div>
                  <div className="eyebrow">{project.metricLabel}</div>
                  <div className="catalog-card__metric">{project.metricValue}</div>
                </div>
                <span style={{ color: "var(--muted)" }}>
                  <Icon name="arrow-up-right" size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? <CaseStudyModal project={selected} onClose={closeProject} /> : null}
    </>
  );
}
