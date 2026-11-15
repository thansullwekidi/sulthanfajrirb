"use client";

import { useMemo, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { MediaField } from "@/components/cms/MediaField";
import { Icon } from "@/components/ui/Icon";
import {
  profileEntryInputSchema,
  profileSectionInputSchema,
  type ProfileEntryInput,
  type ProfileSectionInput
} from "@/contracts/profile.contract";
import {
  PROFILE_ENTRY_LABELS,
  PROFILE_SECTION_KINDS,
  PROFILE_SECTION_KIND_LABELS,
  type MediaPurpose,
  type ProfileEntry,
  type ProfileSection,
  type ProfileSectionKind
} from "@/contracts/domain";
import { fieldErrorsFromZod } from "@/contracts/validation";

type DeleteTarget =
  | { kind: "section"; id: string; title: string }
  | { kind: "entry"; sectionId: string; entryId: string; title: string };

/** Tujuan penyimpanan media mengikuti jenis bagian agar audit mudah dibaca. */
/**
 * Tujuan penyimpanan media mengikuti jenis bagian agar audit mudah dibaca.
 * Sampul publikasi/paten adalah media entri, bukan foto sertifikasi.
 */
function mediaPurposeFor(kind: ProfileSectionKind): MediaPurpose {
  if (kind === "EDUCATION") return "EDUCATION_LOGO";
  if (kind === "ORGANIZATIONS" || kind === "VOLUNTEER") return "ORGANIZATION_LOGO";
  return "PROFILE_ENTRY";
}

function SectionForm({
  section,
  onDone
}: {
  section: ProfileSection | null;
  onDone: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [title, setTitle] = useState(section?.title ?? "");
  const [subtitle, setSubtitle] = useState(section?.subtitle ?? "");
  const [kind, setKind] = useState<ProfileSectionKind>(section?.kind ?? "CUSTOM");
  const [visible, setVisible] = useState(section?.visible ?? true);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = profileSectionInputSchema.safeParse({ title, subtitle, kind, visible });
    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom bagian profil yang ditandai.");
      return;
    }

    const payload: ProfileSectionInput = parsed.data;
    const envelope = section
      ? await run(
          () =>
            apiPost<ProfileSection>("/api/v1/profile", {
              action: "section.update",
              id: section.id,
              section: payload
            }),
          {
            successTitle: "Bagian profil diperbarui",
            successDescription: payload.title
          }
        )
      : await run(
          () =>
            apiPost<ProfileSection>("/api/v1/profile", {
              action: "section.create",
              section: payload
            }),
          {
            successTitle: "Bagian profil ditambahkan",
            successDescription: payload.title
          }
        );

    if (envelope?.ok) onDone();
  };

  return (
    <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      {banner ? (
        <div className="form-status" role="alert">
          <Icon name="alert" size={14} />
          <span>{banner}</span>
        </div>
      ) : null}

      <Field label="Nama Bagian" htmlFor="prf-title" error={errors.title} hint="2—80 karakter">
        <input
          id="prf-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Pendidikan"
        />
      </Field>

      <Field label="Jenis Bagian" htmlFor="prf-kind" error={errors.kind}>
        <select
          id="prf-kind"
          className="select"
          value={kind}
          onChange={(event) => setKind(event.target.value as ProfileSectionKind)}
        >
          {PROFILE_SECTION_KINDS.map((option) => (
            <option key={option} value={option}>
              {PROFILE_SECTION_KIND_LABELS[option]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subjudul" htmlFor="prf-subtitle" error={errors.subtitle} hint="opsional">
        <input
          id="prf-subtitle"
          className="input"
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
          placeholder="Riwayat akademik formal"
        />
      </Field>

      <label className="check-row">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        Tampilkan bagian ini di halaman publik
      </label>

      <div className="form-actions">
        <span className="form-note">
          {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Jenis menentukan tata letak publik."}
        </span>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : section ? "Simpan Bagian" : "Tambah Bagian"}
        </button>
      </div>
    </form>
  );
}

function EntryForm({
  section,
  entry,
  onDone
}: {
  section: ProfileSection;
  entry: ProfileEntry | null;
  onDone: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const labels = PROFILE_ENTRY_LABELS[section.kind];
  const [title, setTitle] = useState(entry?.title ?? "");
  const [subtitle, setSubtitle] = useState(entry?.subtitle ?? "");
  const [meta, setMeta] = useState(entry?.meta ?? "");
  const [location, setLocation] = useState(entry?.location ?? "");
  const [startDate, setStartDate] = useState(entry?.startDate ?? "");
  const [endDate, setEndDate] = useState(entry?.endDate ?? "");
  const [isCurrent, setIsCurrent] = useState(entry?.isCurrent ?? false);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [imageUrl, setImageUrl] = useState(entry?.imageUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(entry?.logoUrl ?? "");
  const [authors, setAuthors] = useState(entry?.authors ?? "");
  const [publisher, setPublisher] = useState(entry?.publisher ?? "");
  const [tags, setTags] = useState(entry?.tags.join(", ") ?? "");
  const [visible, setVisible] = useState(entry?.visible ?? true);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = profileEntryInputSchema.safeParse({
      title,
      subtitle,
      meta,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      url,
      imageUrl,
      logoUrl,
      authors,
      publisher,
      tags,
      visible
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom entri yang ditandai.");
      return;
    }

    // Publikasi & paten wajib punya tautan langsung ke sumbernya.
    if (labels.requireUrl && !parsed.data.url) {
      setLocalErrors({
        url: `${labels.urlLabel ?? "Tautan"} wajib diisi agar pembaca dapat membuka sumber aslinya.`
      });
      setBanner("Tautan sumber wajib diisi untuk jenis bagian ini.");
      return;
    }

    const payload: ProfileEntryInput = parsed.data;
    const envelope = entry
      ? await run(
          () =>
            apiPost<ProfileEntry>("/api/v1/profile", {
              action: "entry.update",
              sectionId: section.id,
              entryId: entry.id,
              entry: payload
            }),
          { successTitle: "Entri diperbarui", successDescription: payload.title }
        )
      : await run(
          () =>
            apiPost<ProfileEntry>("/api/v1/profile", {
              action: "entry.create",
              sectionId: section.id,
              entry: payload
            }),
          { successTitle: "Entri ditambahkan", successDescription: payload.title }
        );

    if (envelope?.ok) onDone();
  };

  return (
    <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      {banner ? (
        <div className="form-status" role="alert">
          <Icon name="alert" size={14} />
          <span>{banner}</span>
        </div>
      ) : null}

      <Field label={labels.title} htmlFor="pre-title" error={errors.title}>
        <input
          id="pre-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>

      {labels.subtitle ? (
        <Field label={labels.subtitle} htmlFor="pre-subtitle" error={errors.subtitle}>
          <input
            id="pre-subtitle"
            className="input"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
          />
        </Field>
      ) : null}

      {labels.meta ? (
        <Field label={labels.meta} htmlFor="pre-meta" error={errors.meta}>
          <input
            id="pre-meta"
            className="input mono"
            value={meta}
            onChange={(event) => setMeta(event.target.value)}
          />
        </Field>
      ) : null}

      {labels.showDates ? (
        <div className="form-row-2">
          <Field label="Tanggal Mulai" htmlFor="pre-start" error={errors.startDate}>
            <input
              id="pre-start"
              className="input mono"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              placeholder="Feb 2023"
            />
          </Field>
          <Field label="Tanggal Selesai" htmlFor="pre-end" error={errors.endDate}>
            <input
              id="pre-end"
              className="input mono"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              placeholder="Jul 2023"
              disabled={isCurrent}
            />
          </Field>
        </div>
      ) : null}

      {labels.showDates ? (
        <label className="check-row">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(event) => {
              setIsCurrent(event.target.checked);
              if (event.target.checked) setEndDate("");
            }}
          />
          Masih berlangsung
        </label>
      ) : null}

      {labels.showLocation ? (
        <Field label="Lokasi" htmlFor="pre-location" error={errors.location} hint="opsional">
          <input
            id="pre-location"
            className="input"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </Field>
      ) : null}

      <Field label={labels.description} htmlFor="pre-description" error={errors.description}>
        <textarea
          id="pre-description"
          className="textarea"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      {labels.tags ? (
        <Field label={labels.tags} htmlFor="pre-tags" error={errors.tags} hint="pisahkan dengan koma">
          <input
            id="pre-tags"
            className="input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
      ) : null}

      {labels.showUrl ? (
        <Field
          label={labels.urlLabel ?? "Tautan"}
          htmlFor="pre-url"
          error={errors.url}
          hint={labels.requireUrl ? "wajib, tautan langsung ke sumber" : "opsional, http(s)"}
        >
          <input
            id="pre-url"
            className="input mono"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            spellCheck={false}
            required={labels.requireUrl}
          />
        </Field>
      ) : null}

      {labels.showAuthors ? (
        <div className="form-row-2">
          <Field
            label="Penulis / Kontributor"
            htmlFor="pre-authors"
            error={errors.authors}
            hint="opsional"
          >
            <input
              id="pre-authors"
              className="input"
              value={authors}
              onChange={(event) => setAuthors(event.target.value)}
              placeholder="Nama penulis dipisah koma"
            />
          </Field>
          <Field
            label="Penerbit / Jurnal"
            htmlFor="pre-publisher"
            error={errors.publisher}
            hint="opsional"
          >
            <input
              id="pre-publisher"
              className="input"
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
              placeholder="Nama jurnal, konferensi, atau kantor"
            />
          </Field>
        </div>
      ) : null}

      {labels.showImage ? (
        <MediaField
          id="pre-image"
          label={labels.imageLabel ?? "Gambar Entri"}
          hint="opsional, unggah berkas atau tempel URL"
          purpose={mediaPurposeFor(section.kind)}
          value={imageUrl}
          onChange={setImageUrl}
          error={errors.imageUrl}
        />
      ) : null}

      {labels.logoLabel ? (
        <MediaField
          id="pre-logo"
          label={labels.logoLabel}
          hint="opsional, tampil sebagai lencana di samping judul"
          purpose="EDUCATION_LOGO"
          value={logoUrl}
          onChange={setLogoUrl}
          error={errors.logoUrl}
        />
      ) : null}

      <label className="check-row">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        Tampilkan entri ini
      </label>

      <div className="form-actions">
        <span className="form-note">
          {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : `Bagian: ${section.title}`}
        </span>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : entry ? "Simpan Entri" : "Tambah Entri"}
        </button>
      </div>
    </form>
  );
}

export function ProfileModule({ sections }: { sections: ProfileSection[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );
  const [sectionEditingId, setSectionEditingId] = useState<string | null>(null);
  const [sectionNonce, setSectionNonce] = useState(0);
  const [entryEditingId, setEntryEditingId] = useState<string | null>(null);
  const [entryNonce, setEntryNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const sorted = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  const activeSection = sorted.find((section) => section.id === activeSectionId) ?? sorted[0] ?? null;
  const editingSection = sorted.find((section) => section.id === sectionEditingId) ?? null;
  const editingEntry =
    activeSection?.entries.find((entry) => entry.id === entryEditingId) ?? null;

  const mutate = async (
    body: Record<string, unknown>,
    successTitle: string,
    successDescription?: string
  ) => {
    const envelope = await run(() => apiPost<unknown>("/api/v1/profile", body), {
      successTitle,
      successDescription
    });
    return Boolean(envelope?.ok);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const ok =
      deleteTarget.kind === "section"
        ? await mutate(
            { action: "section.delete", id: deleteTarget.id },
            "Bagian dihapus",
            deleteTarget.title
          )
        : await mutate(
            {
              action: "entry.delete",
              sectionId: deleteTarget.sectionId,
              entryId: deleteTarget.entryId
            },
            "Entri dihapus",
            deleteTarget.title
          );

    if (ok) {
      if (deleteTarget.kind === "section" && activeSectionId === deleteTarget.id) {
        setActiveSectionId(null);
      }
      if (deleteTarget.kind === "entry" && entryEditingId === deleteTarget.entryId) {
        setEntryEditingId(null);
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">04 / Bagian Profil</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Bagian profil ala LinkedIn
          </h2>
          <p className="admin-head__sub">
            Tambah, ubah, urutkan, sembunyikan, atau hapus setiap bagian profil: pendidikan,
            mata kuliah, bahasa, organisasi, penghargaan, publikasi, paten, skor tes, relawan,
            kepedulian, sorotan, aktivitas, dan minat. Semua perubahan tercatat pada log audit.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setSectionEditingId(null);
            setSectionNonce((current) => current + 1);
          }}
        >
          <Icon name="plus" size={13} />
          Bagian Baru
        </button>
      </div>

      <div className="admin-panel admin-grid-2">
        <div className="stack" style={{ gap: 14 }}>
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Daftar Bagian</span>
              <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                {isSubmitting ? "MUTASI BERJALAN…" : `${sorted.length} BAGIAN`}
              </span>
            </div>

            <div className="trash-list">
              {sorted.map((section, index) => {
                const isActive = activeSection?.id === section.id;
                return (
                  <div key={section.id} className="trash-item">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionId(section.id);
                        setEntryEditingId(null);
                        setEntryNonce((current) => current + 1);
                      }}
                      style={{ textAlign: "left", flex: 1 }}
                    >
                      <div className="trash-item__title">
                        {section.title}
                        {section.visible ? null : (
                          <span className="badge" style={{ marginLeft: 8 }}>
                            TERSEMBUNYI
                          </span>
                        )}
                      </div>
                      <div className="trash-item__meta">
                        <span>{PROFILE_SECTION_KIND_LABELS[section.kind]}</span>
                        <span>{section.entries.length} entri</span>
                        <span>URUT {String(index + 1).padStart(2, "0")}</span>
                        {isActive ? <span>AKTIF</span> : null}
                      </div>
                    </button>
                    <div className="trash-item__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() =>
                          void mutate(
                            { action: "section.move", id: section.id, direction: "UP" },
                            "Urutan diperbarui",
                            section.title
                          )
                        }
                        disabled={isSubmitting || index === 0}
                        aria-label={`Naikkan ${section.title}`}
                        title="Naik"
                      >
                        <Icon name="chevron-up" size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() =>
                          void mutate(
                            { action: "section.move", id: section.id, direction: "DOWN" },
                            "Urutan diperbarui",
                            section.title
                          )
                        }
                        disabled={isSubmitting || index === sorted.length - 1}
                        aria-label={`Turunkan ${section.title}`}
                        title="Turun"
                      >
                        <Icon name="chevron-down" size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() =>
                          void mutate(
                            {
                              action: "section.visibility",
                              id: section.id,
                              visible: !section.visible
                            },
                            section.visible ? "Bagian disembunyikan" : "Bagian ditampilkan",
                            section.title
                          )
                        }
                        disabled={isSubmitting}
                        aria-label={`${section.visible ? "Sembunyikan" : "Tampilkan"} ${section.title}`}
                        title={section.visible ? "Sembunyikan" : "Tampilkan"}
                      >
                        <Icon name={section.visible ? "eye" : "lock"} size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() => {
                          setSectionEditingId(section.id);
                          setSectionNonce((current) => current + 1);
                        }}
                        aria-label={`Sunting ${section.title}`}
                        title="Sunting bagian"
                      >
                        <Icon name="pencil" size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 26, height: 26, color: "var(--danger)" }}
                        onClick={() =>
                          setDeleteTarget({
                            kind: "section",
                            id: section.id,
                            title: section.title
                          })
                        }
                        disabled={isSubmitting}
                        aria-label={`Hapus ${section.title}`}
                        title="Hapus bagian"
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {sorted.length === 0 ? (
                <div className="admin-empty">Belum ada bagian profil. Tambahkan bagian pertama.</div>
              ) : null}
            </div>
          </div>

          {activeSection ? (
            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">Entri · {activeSection.title}</span>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => {
                    setEntryEditingId(null);
                    setEntryNonce((current) => current + 1);
                  }}
                >
                  <Icon name="plus" size={11} />
                  Entri Baru
                </button>
              </div>

              <div className="trash-list">
                {[...activeSection.entries]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((entry, index) => (
                    <div key={entry.id} className="trash-item">
                      <div style={{ flex: 1 }}>
                        <div className="trash-item__title">
                          {entry.title}
                          {entry.visible ? null : (
                            <span className="badge" style={{ marginLeft: 8 }}>
                              TERSEMBUNYI
                            </span>
                          )}
                        </div>
                        <div className="trash-item__meta">
                          {entry.subtitle ? <span>{entry.subtitle}</span> : null}
                          {entry.startDate || entry.endDate ? (
                            <span>
                              {entry.startDate || "—"} – {entry.isCurrent ? "Sekarang" : entry.endDate || "—"}
                            </span>
                          ) : null}
                          {entry.location ? <span>{entry.location}</span> : null}
                          <span>URUT {String(index + 1).padStart(2, "0")}</span>
                        </div>
                      </div>
                      <div className="trash-item__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() =>
                            void mutate(
                              {
                                action: "entry.move",
                                sectionId: activeSection.id,
                                entryId: entry.id,
                                direction: "UP"
                              },
                              "Urutan entri diperbarui",
                              entry.title
                            )
                          }
                          disabled={isSubmitting || index === 0}
                          aria-label={`Naikkan ${entry.title}`}
                          title="Naik"
                        >
                          <Icon name="chevron-up" size={11} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() =>
                            void mutate(
                              {
                                action: "entry.move",
                                sectionId: activeSection.id,
                                entryId: entry.id,
                                direction: "DOWN"
                              },
                              "Urutan entri diperbarui",
                              entry.title
                            )
                          }
                          disabled={
                            isSubmitting || index === activeSection.entries.length - 1
                          }
                          aria-label={`Turunkan ${entry.title}`}
                          title="Turun"
                        >
                          <Icon name="chevron-down" size={11} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() =>
                            void mutate(
                              {
                                action: "entry.visibility",
                                sectionId: activeSection.id,
                                entryId: entry.id,
                                visible: !entry.visible
                              },
                              entry.visible ? "Entri disembunyikan" : "Entri ditampilkan",
                              entry.title
                            )
                          }
                          disabled={isSubmitting}
                          aria-label={`${entry.visible ? "Sembunyikan" : "Tampilkan"} ${entry.title}`}
                          title={entry.visible ? "Sembunyikan" : "Tampilkan"}
                        >
                          <Icon name={entry.visible ? "eye" : "lock"} size={11} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() => {
                            setEntryEditingId(entry.id);
                            setEntryNonce((current) => current + 1);
                          }}
                          aria-label={`Sunting ${entry.title}`}
                          title="Sunting entri"
                        >
                          <Icon name="pencil" size={11} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 26, height: 26, color: "var(--danger)" }}
                          onClick={() =>
                            setDeleteTarget({
                              kind: "entry",
                              sectionId: activeSection.id,
                              entryId: entry.id,
                              title: entry.title
                            })
                          }
                          disabled={isSubmitting}
                          aria-label={`Hapus ${entry.title}`}
                          title="Hapus entri"
                        >
                          <Icon name="trash" size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                {activeSection.entries.length === 0 ? (
                  <div className="admin-empty">
                    Bagian ini belum memiliki entri. Tambahkan entri pertama.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">
                {sectionEditingId ? "Sunting Bagian" : "Bagian Baru"}
              </span>
              <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                {sectionEditingId ? sectionEditingId.toUpperCase() : "DRAFT"}
              </span>
            </div>
            <SectionForm
              key={`section-${sectionEditingId ?? "new"}-${sectionNonce}`}
              section={editingSection}
              onDone={() => {
                setSectionEditingId(null);
                setSectionNonce((current) => current + 1);
              }}
            />
          </div>

          {activeSection ? (
            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">
                  {entryEditingId ? "Sunting Entri" : "Entri Baru"}
                </span>
                <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                  {activeSection.title.toUpperCase()}
                </span>
              </div>
              <EntryForm
                key={`entry-${activeSection.id}-${entryEditingId ?? "new"}-${entryNonce}`}
                section={activeSection}
                entry={editingEntry}
                onDone={() => {
                  setEntryEditingId(null);
                  setEntryNonce((current) => current + 1);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus ${deleteTarget.title}?`}
          description={
            deleteTarget.kind === "section"
              ? "Seluruh entri di dalam bagian ini ikut terhapus dari halaman publik. Tindakan ini menulis entri PURGE permanen pada log audit."
              : "Entri akan hilang dari halaman publik. Tindakan ini menulis entri PURGE permanen pada log audit."
          }
          confirmLabel="Hapus"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
