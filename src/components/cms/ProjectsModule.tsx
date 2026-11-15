"use client";

import { useMemo, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { useStudio } from "@/client/state/StudioProvider";
import { useToast } from "@/client/state/ToastProvider";
import { ProjectEditor } from "@/components/cms/ProjectEditor";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, type Project, type ProjectStatus } from "@/contracts/domain";
import { formatDateId } from "@/contracts/primitives";

type StatusFilter = "ALL" | "PUBLISHED" | "DRAFT";

export function ProjectsModule({ projects }: { projects: Project[] }) {
  const { refresh } = useStudio();
  const { toast } = useToast();
  const { run, isSubmitting } = useAdminAction();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [editing, setEditing] = useState<"new" | string | null>(null);

  const active = useMemo(
    () =>
      projects
        .filter((project) => project.status !== "ARCHIVED")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [projects]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return active.filter((project) => {
      if (filter !== "ALL" && project.status !== filter) return false;
      if (!term) return true;
      return `${project.title} ${project.slug} ${project.techStack.join(" ")}`
        .toLowerCase()
        .includes(term);
    });
  }, [active, filter, query]);

  const counts = useMemo(
    () => ({
      ALL: active.length,
      PUBLISHED: active.filter((project) => project.status === "PUBLISHED").length,
      DRAFT: active.filter((project) => project.status === "DRAFT").length
    }),
    [active]
  );

  const editingProject =
    editing && editing !== "new" ? (projects.find((project) => project.id === editing) ?? null) : null;

  if (editing) {
    return (
      <ProjectEditor
        project={editingProject}
        onClose={() => setEditing(null)}
      />
    );
  }

  const move = async (project: Project, direction: "UP" | "DOWN") => {
    await run(
      () =>
        apiPost<Project[]>(`/api/v1/projects/${project.id}/actions`, {
          action: direction === "UP" ? "MOVE_UP" : "MOVE_DOWN"
        }),
      {
        successTitle: "Urutan diperbarui",
        successDescription: `${project.title} digeser ${direction === "UP" ? "ke atas" : "ke bawah"}.`,
        toastOnSuccess: false
      }
    );
  };

  const toggleFeature = async (project: Project) => {
    await run(
      () =>
        apiPost<Project>(`/api/v1/projects/${project.id}/actions`, {
          action: "FEATURE",
          isFeatured: !project.isFeatured
        }),
      {
        successTitle: project.isFeatured ? "Sorotan dilepas" : "Ditandai unggulan",
        successDescription: project.title
      }
    );
  };

  const archive = async (project: Project) => {
    await run(
      () => apiPost<Project>(`/api/v1/projects/${project.id}/actions`, { action: "ARCHIVE" }),
      {
        successTitle: "Proyek diarsipkan",
        toastOnSuccess: false,
        onSuccess: () => {
          toast({
            tone: "info",
            title: "Dipindahkan ke Tempat Sampah",
            description: `${project.title} · dapat dipulihkan`,
            duration: 9000,
            action: {
              label: "Batalkan",
              onClick: async () => {
                const restored = await apiPost<Project>(
                  `/api/v1/projects/${project.id}/actions`,
                  { action: "RESTORE" }
                );
                await refresh();
                toast({
                  tone: restored.ok ? "success" : "error",
                  title: restored.ok ? "Proyek dipulihkan" : "Pemulihan gagal",
                  description: restored.ok ? project.title : restored.error?.message
                });
              }
            }
          });
        }
      }
    );
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">01 / Manajer Proyek</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Indeks karya & status terbit
          </h2>
          <p className="admin-head__sub">
            Urutan indeks dinormalisasi otomatis menjadi 1..N setiap kali entri ditambah, digeser,
            atau diarsipkan. Penghapusan permanen hanya tersedia di Tempat Sampah.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={13} />
          Proyek Baru
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Icon name="search" size={12} />
          <span className="sr-only">Cari proyek</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, slug, atau teknologi…"
            type="search"
          />
        </label>

        <div style={{ display: "flex", gap: 0 }}>
          {(["ALL", "PUBLISHED", "DRAFT"] as StatusFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              className="btn btn--sm"
              onClick={() => setFilter(option)}
              style={
                filter === option
                  ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                  : { borderColor: "var(--line)", color: "var(--muted)" }
              }
            >
              {option === "ALL" ? "Semua" : option === "PUBLISHED" ? "Terbit" : "Draf"} (
              {counts[option]})
            </button>
          ))}
        </div>

        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {String(filtered.length).padStart(2, "0")} DARI {String(active.length).padStart(2, "0")}{" "}
          ENTRI AKTIF
        </span>
      </div>

      <div className="admin-panel">
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Tabel Manajemen · urutan prioritas</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>Urut</th>
                  <th>Karya</th>
                  <th style={{ width: 130 }}>Kategori</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 140 }}>Metrik</th>
                  <th style={{ width: 70 }}>Sorot</th>
                  <th style={{ width: 110, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => {
                  const index = active.findIndex((item) => item.id === project.id);
                  return (
                    <tr key={project.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                            {String(project.sortOrder).padStart(2, "0")}
                          </span>
                          <div className="sort-buttons">
                            <button
                              type="button"
                              onClick={() => move(project, "UP")}
                              disabled={isSubmitting || index <= 0}
                              aria-label="Naikkan urutan"
                              title="Naik"
                            >
                              <Icon name="chevron-up" size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(project, "DOWN")}
                              disabled={isSubmitting || index < 0 || index >= active.length - 1}
                              aria-label="Turunkan urutan"
                              title="Turun"
                            >
                              <Icon name="chevron-down" size={10} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setEditing(project.id)}
                          style={{ textAlign: "left" }}
                        >
                          <span className="admin-table__title">{project.title}</span>
                          <span className="admin-table__sub">
                            /{project.slug} · {project.techStack.length} teknologi · update{" "}
                            {formatDateId(project.updatedAt)}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="badge">{CATEGORY_LABELS[project.category]}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            project.status === "PUBLISHED" ? "badge--ok" : "badge--warn"
                          }`}
                        >
                          {project.status === "PUBLISHED" ? "TERBIT" : "DRAF"}
                        </span>
                      </td>
                      <td>
                        <div className="eyebrow">{project.metricLabel}</div>
                        <div className="mono" style={{ fontSize: 10, marginTop: 2 }}>
                          {project.metricValue}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="star-btn"
                          data-on={project.isFeatured}
                          onClick={() => toggleFeature(project)}
                          disabled={isSubmitting}
                          aria-label={
                            project.isFeatured ? "Lepas dari unggulan" : "Tandai sebagai unggulan"
                          }
                          aria-pressed={project.isFeatured}
                        >
                          <Icon name="star" size={12} />
                        </button>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setEditing(project.id)}
                            aria-label={`Sunting ${project.title}`}
                            title="Sunting"
                          >
                            <Icon name="pencil" size={12} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 28, height: 28, color: "var(--danger)" }}
                            onClick={() => archive(project)}
                            disabled={isSubmitting}
                            aria-label={`Arsipkan ${project.title}`}
                            title="Arsipkan"
                          >
                            <Icon name="archive" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="admin-empty">
                Tidak ada proyek yang cocok dengan filter ini. Ubah kata kunci atau tambah entri
                baru.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
