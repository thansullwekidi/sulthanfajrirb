"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { MediaField } from "@/components/cms/MediaField";
import { Icon } from "@/components/ui/Icon";
import { testimonialInputSchema } from "@/contracts/content.contract";
import type { Testimonial } from "@/contracts/domain";
import { formatDateId } from "@/contracts/primitives";
import { fieldErrorsFromZod } from "@/contracts/validation";

function TestimonialForm({
  testimonial,
  onSaved
}: {
  testimonial: Testimonial | null;
  onSaved: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [author, setAuthor] = useState(testimonial?.author ?? "");
  const [role, setRole] = useState(testimonial?.role ?? "");
  const [organization, setOrganization] = useState(testimonial?.organization ?? "");
  const [relationship, setRelationship] = useState(testimonial?.relationship ?? "");
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  const [verifiedTag, setVerifiedTag] = useState(testimonial?.verifiedTag ?? "Terverifikasi");
  const [date, setDate] = useState(testimonial?.date ?? "");
  const [avatarUrl, setAvatarUrl] = useState(testimonial?.avatarUrl ?? "");
  const [profileUrl, setProfileUrl] = useState(testimonial?.profileUrl ?? "");
  const [isVisible, setIsVisible] = useState(testimonial?.isVisible ?? true);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = testimonialInputSchema.safeParse({
      author,
      role,
      organization,
      relationship,
      quote,
      verifiedTag,
      date,
      avatarUrl,
      profileUrl,
      isVisible
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom rekomendasi yang ditandai sebelum menyimpan.");
      return;
    }

    const envelope = testimonial
      ? await run(
          () =>
            apiPatch<Testimonial>(
              `/api/v1/collections/testimonials/${testimonial.id}`,
              parsed.data
            ),
          {
            successTitle: "Rekomendasi diperbarui",
            successDescription: parsed.data.author
          }
        )
      : await run(
          () => apiPost<Testimonial>("/api/v1/collections/testimonials", parsed.data),
          {
            successTitle: "Rekomendasi ditambahkan",
            successDescription: parsed.data.author
          }
        );

    if (envelope?.ok) onSaved();
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">
          {testimonial ? "Sunting Rekomendasi" : "Rekomendasi Baru"}
        </span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
          {testimonial ? testimonial.id.toUpperCase() : "DRAFT"}
        </span>
      </div>

      <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {banner ? (
          <div className="form-status" role="alert">
            <Icon name="alert" size={14} />
            <span>{banner}</span>
          </div>
        ) : null}

        <div className="form-row-2">
          <Field label="Nama" htmlFor="tst-author" error={errors.author}>
            <input
              id="tst-author"
              className="input"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Dr. Ratna Kusuma"
            />
          </Field>
          <Field label="Jabatan" htmlFor="tst-role" error={errors.role}>
            <input
              id="tst-role"
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Kepala Laboratorium"
            />
          </Field>
        </div>

        <Field label="Instansi" htmlFor="tst-org" error={errors.organization}>
          <input
            id="tst-org"
            className="input"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="Universitas Pendidikan Indonesia"
          />
        </Field>

        <Field
          label="Hubungan Kerja"
          htmlFor="tst-relationship"
          error={errors.relationship}
          hint="opsional, mis. Atasan langsung, Rekan tim"
        >
          <input
            id="tst-relationship"
            className="input"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            placeholder="Atasan langsung"
          />
        </Field>

        <Field label="Kutipan" htmlFor="tst-quote" error={errors.quote} hint="20—700 karakter">
          <textarea
            id="tst-quote"
            className="textarea"
            rows={6}
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            placeholder="Uraian spesifik mengenai kualitas kerja teknis dan dampaknya."
          />
        </Field>

        <div className="form-row-2">
          <Field label="Label Verifikasi" htmlFor="tst-tag" error={errors.verifiedTag}>
            <input
              id="tst-tag"
              className="input"
              value={verifiedTag}
              onChange={(event) => setVerifiedTag(event.target.value)}
              placeholder="Terverifikasi"
            />
          </Field>
          <Field label="Tanggal" htmlFor="tst-date" error={errors.date}>
            <input
              id="tst-date"
              type="date"
              className="input mono"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
        </div>

        <MediaField
          id="tst-avatar"
          label="Foto Pemberi Rekomendasi"
          hint="opsional, tampil di samping kutipan publik"
          purpose="AVATAR"
          value={avatarUrl}
          onChange={setAvatarUrl}
          error={errors.avatarUrl}
        />

        <Field
          label="Tautan Profil"
          htmlFor="tst-profile"
          error={errors.profileUrl}
          hint="opsional, mis. LinkedIn pemberi rekomendasi"
        >
          <input
            id="tst-profile"
            className="input mono"
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            spellCheck={false}
          />
        </Field>

        <label className="check-row">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
          />
          Tampilkan rekomendasi ini di halaman publik
        </label>

        <div className="form-actions">
          <span className="form-note">
            {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Tampil di Ringkasan publik."}
          </span>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : testimonial ? "Simpan Perubahan" : "Tambah Rekomendasi"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function TestimonialsModule({ testimonials }: { testimonials: Testimonial[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const sorted = [...testimonials].sort((a, b) => a.sortOrder - b.sortOrder);
  const editing = testimonials.find((testimonial) => testimonial.id === editingId) ?? null;

  const remove = async () => {
    if (!deleteTarget) return;
    const envelope = await run(
      () => apiDelete<{ id: string }>(`/api/v1/collections/testimonials/${deleteTarget.id}`),
      {
        successTitle: "Rekomendasi dihapus",
        successDescription: deleteTarget.author
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
          <span className="eyebrow eyebrow--accent">07 / Rekomendasi</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Endorsemen terverifikasi
          </h2>
          <p className="admin-head__sub">
            Kutipan yang tampil pada Ringkasan publik. Gunakan label verifikasi untuk menandai
            sumber dan tanggal wawancara agar klaim dapat ditelusuri.
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
          Rekomendasi Baru
        </button>
      </div>

      <div className="admin-toolbar">
        <span className="eyebrow">{testimonials.length} kutipan aktif</span>
        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
        </span>
      </div>

      <div className="admin-panel admin-grid-2">
        <div className="trash-list">
          {sorted.length === 0 ? (
            <div className="admin-empty">Belum ada rekomendasi terdaftar.</div>
          ) : (
            sorted.map((testimonial) => (
              <div key={testimonial.id} className="trash-item" style={{ alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span className="trash-item__title" style={{ fontSize: 17 }}>
                      {testimonial.author}
                    </span>
                    <span className="badge badge--ok">{testimonial.verifiedTag}</span>
                  </div>
                  <div className="trash-item__meta">
                    <span>{testimonial.role}</span>
                    <span>{testimonial.organization}</span>
                    {testimonial.relationship ? <span>{testimonial.relationship}</span> : null}
                    <span>{formatDateId(testimonial.date)}</span>
                    <span>URUT {String(testimonial.sortOrder).padStart(2, "0")}</span>
                    {testimonial.isVisible ? null : <span>TERSEMBUNYI</span>}
                  </div>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.65,
                      maxWidth: "62ch"
                    }}
                  >
                    “{testimonial.quote}”
                  </p>
                </div>
                <div className="trash-item__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={() => {
                      setEditingId(testimonial.id);
                      setNonce((current) => current + 1);
                    }}
                    aria-label={`Sunting rekomendasi ${testimonial.author}`}
                    title="Sunting"
                  >
                    <Icon name="pencil" size={12} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "var(--danger)" }}
                    onClick={() => setDeleteTarget(testimonial)}
                    disabled={isSubmitting}
                    aria-label={`Hapus rekomendasi ${testimonial.author}`}
                    title="Hapus"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <TestimonialForm
          key={`testimonial-${editingId ?? "new"}-${nonce}`}
          testimonial={editing}
          onSaved={() => {
            setEditingId(null);
            setNonce((current) => current + 1);
          }}
        />
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus rekomendasi ${deleteTarget.author}?`}
          description="Kutipan akan dihapus dari Ringkasan publik dan tidak dapat dipulihkan. Tindakan ini tercatat sebagai PURGE pada log audit."
          confirmLabel="Hapus Rekomendasi"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
