"use client";

import { useMemo, useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { Icon } from "@/components/ui/Icon";
import { skillInputSchema } from "@/contracts/content.contract";
import {
  CATEGORY_LABELS,
  SKILL_DOMAINS,
  type Skill,
  type SkillDomain
} from "@/contracts/domain";
import { fieldErrorsFromZod } from "@/contracts/validation";

function SkillForm({
  skill,
  onSaved
}: {
  skill: Skill | null;
  onSaved: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [name, setName] = useState(skill?.name ?? "");
  const [category, setCategory] = useState<SkillDomain>(skill?.category ?? "REKAYASA_WEB");
  const [level, setLevel] = useState(skill?.level ?? 70);
  const [endorsements, setEndorsements] = useState(skill?.endorsements ?? 0);
  const [context, setContext] = useState(skill?.context ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = skillInputSchema.safeParse({
      name,
      category,
      level,
      context,
      endorsements
    });
    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom keahlian yang ditandai sebelum menyimpan.");
      return;
    }

    const envelope = skill
      ? await run(
          () => apiPatch<Skill>(`/api/v1/collections/skills/${skill.id}`, parsed.data),
          {
            successTitle: "Keahlian diperbarui",
            successDescription: `${parsed.data.name} · ${parsed.data.level}%`
          }
        )
      : await run(() => apiPost<Skill>("/api/v1/collections/skills", parsed.data), {
          successTitle: "Keahlian ditambahkan",
          successDescription: `${parsed.data.name} · ${parsed.data.level}%`
        });

    if (envelope?.ok) onSaved();
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">{skill ? "Sunting Keahlian" : "Keahlian Baru"}</span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
          {skill ? skill.id.toUpperCase() : "DRAFT"}
        </span>
      </div>

      <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {banner ? (
          <div className="form-status" role="alert">
            <Icon name="alert" size={14} />
            <span>{banner}</span>
          </div>
        ) : null}

        <Field label="Nama Keahlian" htmlFor="skill-name" error={errors.name} hint="2—80 karakter">
          <input
            id="skill-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Playwright"
          />
        </Field>

        <Field label="Domain" htmlFor="skill-category" error={errors.category}>
          <select
            id="skill-category"
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value as SkillDomain)}
          >
            {SKILL_DOMAINS.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tingkat Penguasaan" htmlFor="skill-level" error={errors.level} hint="0—100%">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              aria-label="Tingkat penguasaan"
              style={{ flex: 1, accentColor: "var(--accent)" }}
            />
            <input
              id="skill-level"
              type="number"
              min={0}
              max={100}
              className="input mono"
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              style={{ width: 82 }}
            />
          </div>
        </Field>

        <Field
          label="Dukungan (Endorsement)"
          htmlFor="skill-endorsements"
          error={errors.endorsements}
          hint="jumlah rekomendasi keahlian, opsional"
        >
          <input
            id="skill-endorsements"
            type="number"
            min={0}
            className="input mono"
            value={endorsements}
            onChange={(event) => setEndorsements(Number(event.target.value))}
            style={{ width: 120 }}
          />
        </Field>

        <Field
          label="Konteks Pembuktian"
          htmlFor="skill-context"
          error={errors.context}
          hint="maks. 220 karakter"
        >
          <textarea
            id="skill-context"
            className="textarea"
            rows={4}
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Dipakai untuk orkestrasi 14 skenario regresi pada tiga lingkungan."
          />
        </Field>

        <div className="form-actions">
          <span className="form-note">
            {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Tampil pada grafik Tech Stack."}
          </span>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : skill ? "Simpan Perubahan" : "Tambah Keahlian"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function SkillsModule({ skills }: { skills: Skill[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [domain, setDomain] = useState<"ALL" | SkillDomain>("ALL");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...skills]
      .filter((skill) => {
        if (domain !== "ALL" && skill.category !== domain) return false;
        if (!term) return true;
        return `${skill.name} ${skill.context}`.toLowerCase().includes(term);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [domain, query, skills]);

  const editing = skills.find((skill) => skill.id === editingId) ?? null;

  const remove = async () => {
    if (!deleteTarget) return;
    const envelope = await run(
      () => apiDelete<{ id: string }>(`/api/v1/collections/skills/${deleteTarget.id}`),
      {
        successTitle: "Keahlian dihapus",
        successDescription: deleteTarget.name
      }
    );
    if (envelope?.ok) {
      if (editingId === deleteTarget.id) setEditingId(null);
      setNonce((current) => current + 1);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">05 / Tech Stack</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Direktori keahlian terukur
          </h2>
          <p className="admin-head__sub">
            Tingkat penguasaan bukan klaim kosong: setiap baris menyertakan konteks pembuktian yang
            tampil di halaman publik dan ringkasan CV ATS.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setEditingId(null);
            setNonce((current) => current + 1);
          }}
        >
          <Icon name="plus" size={13} />
          Keahlian Baru
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Icon name="search" size={12} />
          <span className="sr-only">Cari keahlian</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari keahlian atau konteks…"
            type="search"
          />
        </label>

        <select
          className="select"
          value={domain}
          onChange={(event) => setDomain(event.target.value as "ALL" | SkillDomain)}
          aria-label="Filter domain"
          style={{ width: 180, height: 32, fontSize: 10 }}
        >
          <option value="ALL">Semua domain</option>
          {SKILL_DOMAINS.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABELS[option]}
            </option>
          ))}
        </select>

        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {String(filtered.length).padStart(2, "0")} DARI {String(skills.length).padStart(2, "0")}{" "}
          KEAHLIAN
        </span>
      </div>

      <div className="admin-panel admin-grid-2">
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Matriks Keahlian</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Keahlian</th>
                  <th style={{ width: 130 }}>Domain</th>
                  <th style={{ width: 150 }}>Penguasaan</th>
                  <th style={{ width: 90, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(skill.id);
                          setNonce((current) => current + 1);
                        }}
                        style={{ textAlign: "left" }}
                      >
                        <span className="admin-table__title" style={{ fontSize: 15 }}>
                          {skill.name}
                        </span>
                        <span className="admin-table__sub">
                          {skill.context || "Tanpa konteks tambahan"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="badge">{CATEGORY_LABELS[skill.category]}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            background: "var(--line)",
                            position: "relative"
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              inset: "0 auto 0 0",
                              width: `${skill.level}%`,
                              background: "var(--accent)"
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 9.5, minWidth: 30 }}>
                          {skill.level}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 28, height: 28 }}
                          onClick={() => {
                            setEditingId(skill.id);
                            setNonce((current) => current + 1);
                          }}
                          aria-label={`Sunting ${skill.name}`}
                          title="Sunting"
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 28, height: 28, color: "var(--danger)" }}
                          onClick={() => setDeleteTarget(skill)}
                          disabled={isSubmitting}
                          aria-label={`Hapus ${skill.name}`}
                          title="Hapus"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="admin-empty">
                Tidak ada keahlian yang cocok. Ubah filter domain atau kata kunci.
              </div>
            ) : null}
          </div>
        </div>

        <SkillForm
          key={`skill-${editingId ?? "new"}-${nonce}`}
          skill={editing}
          onSaved={() => {
            setEditingId(null);
            setNonce((current) => current + 1);
          }}
        />
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus keahlian ${deleteTarget.name}?`}
          description="Baris keahlian akan hilang dari grafik Tech Stack publik dan CV ATS. Tindakan ini tercatat permanen pada audit log."
          confirmLabel="Hapus Keahlian"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
