"use client";

import { useEffect, useMemo, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { useStudio } from "@/client/state/StudioProvider";
import { Icon } from "@/components/ui/Icon";
import type { Project } from "@/contracts/domain";
import { formatDateTimeId } from "@/contracts/primitives";

function PurgeModal({
  project,
  onCancel,
  onConfirm,
  busy
}: {
  project: Project;
  onCancel: () => void;
  onConfirm: (slug: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value.trim() !== project.slug) {
      setError("Slug tidak cocok. Ketik persis seperti yang tertera.");
      return;
    }
    setError(null);
    onConfirm(value.trim());
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="modal modal--narrow" role="dialog" aria-modal="true" aria-labelledby="purge-title">
        <div className="modal__bar">
          <div className="modal__bar-meta">
            <span style={{ color: "var(--danger)" }}>Tahap 2 / Hapus Permanen</span>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Tutup">
            <Icon name="close" size={14} />
          </button>
        </div>

        <form className="modal__body" onSubmit={submit}>
          <h2 className="modal__title" id="purge-title" style={{ fontSize: 28 }}>
            Hapus proyek secara permanen?
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 12.5, lineHeight: 1.7 }}>
            Tindakan ini menghapus <strong style={{ color: "var(--text)" }}>{project.title}</strong>{" "}
            dari basis data. Tidak ada tombol batalkan setelah dieksekusi, dan seluruh relasi
            metriknya hilang dari katalog publik serta CV ATS.
          </p>

          <div
            style={{
              border: "1px solid var(--line)",
              padding: "10px 12px",
              margin: "18px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)"
            }}
          >
            <Icon name="alert" size={13} style={{ color: "var(--danger)" }} />
            <span className="mono" style={{ fontSize: 10 }}>
              {project.slug}
            </span>
          </div>

          <div className={`field ${error ? "field--error" : ""}`}>
            <label htmlFor="purge-slug">Ketik ulang slug untuk konfirmasi</label>
            <input
              id="purge-slug"
              className="input mono"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              placeholder={project.slug}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {error ? <span className="field__error">{error}</span> : null}
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>
              Batalkan
            </button>
            <button
              type="submit"
              className="btn btn--danger"
              disabled={busy || value.trim() !== project.slug}
            >
              <Icon name="trash" size={12} />
              {busy ? "Menghapus…" : "Hapus Permanen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TrashModule({ projects }: { projects: Project[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [purgeTarget, setPurgeTarget] = useState<Project | null>(null);

  const archived = useMemo(
    () =>
      projects
        .filter((project) => project.status === "ARCHIVED")
        .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? "")),
    [projects]
  );

  const restore = async (project: Project) => {
    await run(
      () => apiPost<Project>(`/api/v1/projects/${project.id}/actions`, { action: "RESTORE" }),
      {
        successTitle: "Dipulihkan ke publik",
        successDescription: `${project.title} kembali berstatus TERBIT.`
      }
    );
  };

  const purge = async (slug: string) => {
    if (!purgeTarget) return;
    const envelope = await run(
      () =>
        apiPost<{ slug: string }>(`/api/v1/projects/${purgeTarget.id}/actions`, {
          action: "PURGE",
          confirmSlug: slug
        }),
      {
        successTitle: "Dihapus permanen",
        successDescription: `${purgeTarget.title} tidak lagi ada di basis data.`
      }
    );
    if (envelope?.ok) setPurgeTarget(null);
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">02 / Tempat Sampah</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Pemulihan & penghapusan permanen
          </h2>
          <p className="admin-head__sub">
            Item di sini sudah disembunyikan dari katalog publik dan CV ATS. Pulihkan kapan saja,
            atau hapus permanen dengan konfirmasi ketik ulang slug.
          </p>
        </div>
        <span className="badge badge--warn">{archived.length} ENTRI DIARSIPKAN</span>
      </div>

      <div className="admin-panel">
        {archived.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 18 }}>
            <strong>Tempat sampah kosong</strong>
            <span>Proyek yang diarsipkan akan muncul di sini, bukan langsung terhapus.</span>
          </div>
        ) : (
          <div className="trash-list">
            {archived.map((project) => (
              <div key={project.id} className="trash-item">
                <div>
                  <div className="trash-item__title">{project.title}</div>
                  <div className="trash-item__meta">
                    <span>/{project.slug}</span>
                    <span>DIARSIPKAN {formatDateTimeId(project.archivedAt ?? project.updatedAt)}</span>
                    <span>COMMIT {project.commitHash}</span>
                    <span>{project.techStack.length} TEKNOLOGI</span>
                  </div>
                </div>
                <div className="trash-item__actions">
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => restore(project)}
                    disabled={isSubmitting}
                  >
                    <Icon name="restore" size={12} />
                    Pulihkan
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => setPurgeTarget(project)}
                    disabled={isSubmitting}
                  >
                    <Icon name="trash" size={12} />
                    Hapus Permanen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            border: "1px solid var(--line)",
            padding: "14px 16px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start"
          }}
        >
          <Icon name="lock" size={14} style={{ marginTop: 2 }} />
          <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.65 }}>
            Protokol dua tahap: arsipkan dari Manajer Proyek (dengan tombol Batalkan instan), lalu
            putuskan di sini. Setiap pemulihan dan penghapusan menulis entri baru ke log audit.
          </p>
        </div>
      </div>

      {purgeTarget ? (
        <PurgeModal
          project={purgeTarget}
          busy={isSubmitting}
          onCancel={() => setPurgeTarget(null)}
          onConfirm={purge}
        />
      ) : null}
    </div>
  );
}
