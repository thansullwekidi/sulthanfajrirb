"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { MediaField } from "@/components/cms/MediaField";
import { Icon } from "@/components/ui/Icon";
import {
  certificationInputSchema,
  experienceInputSchema
} from "@/contracts/content.contract";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPES,
  EXPERIENCE_TYPE_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
  type Certification,
  type EmploymentType,
  type Experience,
  type ExperienceType,
  type WorkMode
} from "@/contracts/domain";
import { fieldErrorsFromZod } from "@/contracts/validation";

type Tab = "pengalaman" | "sertifikasi";

type DeleteTarget =
  | { entity: "experiences"; id: string; title: string }
  | { entity: "certifications"; id: string; title: string };

function ExperienceForm({
  experience,
  onSaved
}: {
  experience: Experience | null;
  onSaved: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [period, setPeriod] = useState(experience?.period ?? "");
  const [role, setRole] = useState(experience?.role ?? "");
  const [organization, setOrganization] = useState(experience?.organization ?? "");
  const [type, setType] = useState<ExperienceType>(experience?.type ?? "AKADEMIK");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    experience?.employmentType ?? "FULL_TIME"
  );
  const [workMode, setWorkMode] = useState<WorkMode>(experience?.workMode ?? "ON_SITE");
  const [location, setLocation] = useState(experience?.location ?? "");
  const [description, setDescription] = useState(experience?.description ?? "");
  const [skills, setSkills] = useState(experience?.skills.join(", ") ?? "");
  const [logoUrl, setLogoUrl] = useState(experience?.logoUrl ?? "");
  const [organizationUrl, setOrganizationUrl] = useState(experience?.organizationUrl ?? "");
  const [highlights, setHighlights] = useState(experience?.highlights.join("\n") ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = experienceInputSchema.safeParse({
      period,
      role,
      organization,
      type,
      highlights,
      employmentType,
      location,
      workMode,
      description,
      skills,
      logoUrl,
      organizationUrl
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom pengalaman yang ditandai sebelum menyimpan.");
      return;
    }

    const envelope = experience
      ? await run(
          () =>
            apiPatch<Experience>(
              `/api/v1/collections/experiences/${experience.id}`,
              parsed.data
            ),
          {
            successTitle: "Pengalaman diperbarui",
            successDescription: `${parsed.data.role} · ${parsed.data.organization}`
          }
        )
      : await run(() => apiPost<Experience>("/api/v1/collections/experiences", parsed.data), {
          successTitle: "Pengalaman ditambahkan",
          successDescription: `${parsed.data.role} · ${parsed.data.organization}`
        });

    if (envelope?.ok) onSaved();
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">
          {experience ? "Sunting Pengalaman" : "Pengalaman Baru"}
        </span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
          {experience ? experience.id.toUpperCase() : "DRAFT"}
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
          <Field label="Periode" htmlFor="exp-period" error={errors.period} hint="2024 — 2026">
            <input
              id="exp-period"
              className="input mono"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="2024 — 2026"
            />
          </Field>
          <Field label="Jenis" htmlFor="exp-type" error={errors.type}>
            <select
              id="exp-type"
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value as ExperienceType)}
            >
              {EXPERIENCE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {EXPERIENCE_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="form-row-2">
          <Field label="Jenis Kerja" htmlFor="exp-employment" error={errors.employmentType}>
            <select
              id="exp-employment"
              className="select"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
            >
              {EMPLOYMENT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {EMPLOYMENT_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mode Kerja" htmlFor="exp-workmode" error={errors.workMode}>
            <select
              id="exp-workmode"
              className="select"
              value={workMode}
              onChange={(event) => setWorkMode(event.target.value as WorkMode)}
            >
              {WORK_MODES.map((option) => (
                <option key={option} value={option}>
                  {WORK_MODE_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Lokasi" htmlFor="exp-location" error={errors.location} hint="opsional">
          <input
            id="exp-location"
            className="input"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Jakarta Metropolitan Area"
          />
        </Field>

        <Field label="Peran" htmlFor="exp-role" error={errors.role} hint="3—120 karakter">
          <input
            id="exp-role"
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Desainer Grafis"
          />
        </Field>

        <Field label="Institusi / Organisasi" htmlFor="exp-org" error={errors.organization}>
          <input
            id="exp-org"
            className="input"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="Universitas Pendidikan Indonesia"
          />
        </Field>

        <MediaField
          id="exp-logo"
          label="Logo Institusi"
          hint="opsional, tampil di linimasa publik"
          purpose="EDUCATION_LOGO"
          value={logoUrl}
          onChange={setLogoUrl}
          error={errors.logoUrl}
        />

        <Field
          label="Tautan Institusi"
          htmlFor="exp-org-url"
          error={errors.organizationUrl}
          hint="opsional, mis. situs resmi TVRI"
        >
          <input
            id="exp-org-url"
            className="input mono"
            value={organizationUrl}
            onChange={(event) => setOrganizationUrl(event.target.value)}
            placeholder="https://…"
            spellCheck={false}
          />
        </Field>

        <Field
          label="Deskripsi"
          htmlFor="exp-description"
          error={errors.description}
          hint="opsional, maks. 3000 karakter"
        >
          <textarea
            id="exp-description"
            className="textarea"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ringkasan peran, tanggung jawab, dan hasil."
          />
        </Field>

        <Field
          label="Keahlian Terkait"
          htmlFor="exp-skills"
          error={errors.skills}
          hint="pisahkan dengan koma"
        >
          <input
            id="exp-skills"
            className="input"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Adobe Illustrator, Adobe Premiere Pro"
          />
        </Field>

        <Field
          label="Poin Rincian"
          htmlFor="exp-highlights"
          error={errors.highlights}
          hint="satu poin per baris"
        >
          <textarea
            id="exp-highlights"
            className="textarea"
            rows={6}
            value={highlights}
            onChange={(event) => setHighlights(event.target.value)}
            placeholder={"Memimpin migrasi pipeline CI dari 14 menit ke 4 menit.\nMenyusun 9 modul praktikum terverifikasi."}
          />
        </Field>

        <div className="form-actions">
          <span className="form-note">
            {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Urutan ditetapkan otomatis."}
          </span>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : experience ? "Simpan Perubahan" : "Tambah Pengalaman"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CertificationForm({
  certification,
  onSaved
}: {
  certification: Certification | null;
  onSaved: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [title, setTitle] = useState(certification?.title ?? "");
  const [issuer, setIssuer] = useState(certification?.issuer ?? "");
  const [issueDate, setIssueDate] = useState(certification?.issueDate ?? "");
  const [expiryDate, setExpiryDate] = useState(certification?.expiryDate ?? "");
  const [credentialId, setCredentialId] = useState(certification?.credentialId ?? "");
  const [verifyUrl, setVerifyUrl] = useState(certification?.verifyUrl ?? "");
  const [skills, setSkills] = useState(certification?.skills.join(", ") ?? "");
  const [imageUrl, setImageUrl] = useState(certification?.imageUrl ?? "");
  const [issuerLogoUrl, setIssuerLogoUrl] = useState(certification?.issuerLogoUrl ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = certificationInputSchema.safeParse({
      title,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      verifyUrl,
      skills,
      imageUrl,
      issuerLogoUrl
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali kolom sertifikasi yang ditandai sebelum menyimpan.");
      return;
    }

    const envelope = certification
      ? await run(
          () =>
            apiPatch<Certification>(
              `/api/v1/collections/certifications/${certification.id}`,
              parsed.data
            ),
          {
            successTitle: "Sertifikasi diperbarui",
            successDescription: parsed.data.title
          }
        )
      : await run(
          () => apiPost<Certification>("/api/v1/collections/certifications", parsed.data),
          {
            successTitle: "Sertifikasi ditambahkan",
            successDescription: parsed.data.title
          }
        );

    if (envelope?.ok) onSaved();
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">
          {certification ? "Sunting Sertifikasi" : "Sertifikasi Baru"}
        </span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
          {certification ? certification.id.toUpperCase() : "DRAFT"}
        </span>
      </div>

      <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {banner ? (
          <div className="form-status" role="alert">
            <Icon name="alert" size={14} />
            <span>{banner}</span>
          </div>
        ) : null}

        <Field label="Nama Sertifikasi" htmlFor="cert-title" error={errors.title}>
          <input
            id="cert-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="TensorFlow Developer Certificate"
          />
        </Field>

        <Field label="Penerbit" htmlFor="cert-issuer" error={errors.issuer}>
          <input
            id="cert-issuer"
            className="input"
            value={issuer}
            onChange={(event) => setIssuer(event.target.value)}
            placeholder="Google Cloud"
          />
        </Field>

        <div className="form-row-2">
          <Field label="Tanggal Terbit" htmlFor="cert-date" error={errors.issueDate}>
            <input
              id="cert-date"
              type="date"
              className="input mono"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
            />
          </Field>
          <Field
            label="Tanggal Kedaluwarsa"
            htmlFor="cert-expiry"
            error={errors.expiryDate}
            hint="opsional"
          >
            <input
              id="cert-expiry"
              type="date"
              className="input mono"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </Field>
        </div>

        <Field label="ID Kredensial" htmlFor="cert-credential" error={errors.credentialId}>
          <input
            id="cert-credential"
            className="input mono"
            value={credentialId}
            onChange={(event) => setCredentialId(event.target.value)}
            placeholder="TF-2026-0912"
            spellCheck={false}
          />
        </Field>

        <Field label="URL Verifikasi" htmlFor="cert-url" error={errors.verifyUrl} hint="opsional">
          <input
            id="cert-url"
            className="input mono"
            value={verifyUrl}
            onChange={(event) => setVerifyUrl(event.target.value)}
            placeholder="https://www.credential.net/…"
            spellCheck={false}
          />
        </Field>

        <Field
          label="Keahlian Terkait"
          htmlFor="cert-skills"
          error={errors.skills}
          hint="pisahkan dengan koma"
        >
          <input
            id="cert-skills"
            className="input"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
          />
        </Field>

        <MediaField
          id="cert-image"
          label="Foto Sertifikasi"
          hint="opsional, unggah pindaian atau tangkapan sertifikat"
          purpose="CERTIFICATION"
          value={imageUrl}
          onChange={setImageUrl}
          error={errors.imageUrl}
        />

        <MediaField
          id="cert-issuer-logo"
          label="Logo Penerbit"
          hint="opsional, tampil di samping nama penerbit"
          purpose="EDUCATION_LOGO"
          value={issuerLogoUrl}
          onChange={setIssuerLogoUrl}
          error={errors.issuerLogoUrl}
        />

        <div className="form-actions">
          <span className="form-note">
            {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Kredensial tampil di CV ATS."}
          </span>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Menyimpan…"
              : certification
                ? "Simpan Perubahan"
                : "Tambah Sertifikasi"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function TrajectoryModule({
  experiences,
  certifications
}: {
  experiences: Experience[];
  certifications: Certification[];
}) {
  const { run, isSubmitting } = useAdminAction();
  const [tab, setTab] = useState<Tab>("pengalaman");
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [certificationId, setCertificationId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const editingExperience =
    experiences.find((experience) => experience.id === experienceId) ?? null;
  const editingCertification =
    certifications.find((certification) => certification.id === certificationId) ?? null;

  const createNew = () => {
    setExperienceId(null);
    setCertificationId(null);
    setNonce((current) => current + 1);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const envelope = await run(
      () =>
        apiDelete<{ id: string }>(
          `/api/v1/collections/${deleteTarget.entity}/${deleteTarget.id}`
        ),
      {
        successTitle: "Entri dihapus",
        successDescription: deleteTarget.title
      }
    );

    if (envelope?.ok) {
      if (deleteTarget.entity === "experiences" && experienceId === deleteTarget.id) {
        setExperienceId(null);
      }
      if (deleteTarget.entity === "certifications" && certificationId === deleteTarget.id) {
        setCertificationId(null);
      }
      setNonce((current) => current + 1);
      setDeleteTarget(null);
    }
  };

  const sortedExperiences = [...experiences].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedCertifications = [...certifications].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">03 / Rekam Jejak</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Linimasa pengalaman & sertifikasi
          </h2>
          <p className="admin-head__sub">
            Setiap perubahan langsung memperbarui halaman Rekam Jejak, CV ATS, dan sinyal KPI.
            Pemutakhiran dicatat pada log audit dengan hash commit yang dapat ditelusuri.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={createNew}>
          <Icon name="plus" size={13} />
          {tab === "pengalaman" ? "Pengalaman Baru" : "Sertifikasi Baru"}
        </button>
      </div>

      <div className="admin-toolbar">
        <div style={{ display: "flex", gap: 0 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setTab("pengalaman")}
            style={
              tab === "pengalaman"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Pengalaman ({sortedExperiences.length})
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setTab("sertifikasi")}
            style={
              tab === "sertifikasi"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Sertifikasi ({sortedCertifications.length})
          </button>
        </div>
        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
        </span>
      </div>

      <div className="admin-panel admin-grid-2">
        {tab === "pengalaman" ? (
          sortedExperiences.length === 0 ? (
            <div className="panel">
              <div className="admin-empty">Belum ada pengalaman. Tambahkan entri pertama.</div>
            </div>
          ) : (
            <div className="trash-list">
              {sortedExperiences.map((experience) => (
                <div key={experience.id} className="trash-item">
                  <div>
                    <div className="trash-item__title">{experience.role}</div>
                    <div className="trash-item__meta">
                      <span>{experience.organization}</span>
                      <span>{experience.period}</span>
                      <span>{EMPLOYMENT_TYPE_LABELS[experience.employmentType].toUpperCase()}</span>
                      {experience.location ? <span>{experience.location}</span> : null}
                      <span>{EXPERIENCE_TYPE_LABELS[experience.type].toUpperCase()}</span>
                      <span>URUT {String(experience.sortOrder).padStart(2, "0")}</span>
                    </div>
                    <p style={{ marginTop: 7, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
                      {experience.highlights[0] ?? "Belum ada poin rincian."}
                    </p>
                  </div>
                  <div className="trash-item__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => {
                        setExperienceId(experience.id);
                        setNonce((current) => current + 1);
                      }}
                      aria-label={`Sunting ${experience.role}`}
                      title="Sunting"
                    >
                      <Icon name="pencil" size={12} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 28, height: 28, color: "var(--danger)" }}
                      onClick={() =>
                        setDeleteTarget({
                          entity: "experiences",
                          id: experience.id,
                          title: experience.role
                        })
                      }
                      disabled={isSubmitting}
                      aria-label={`Hapus ${experience.role}`}
                      title="Hapus"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : sortedCertifications.length === 0 ? (
          <div className="panel">
            <div className="admin-empty">Belum ada sertifikasi terdaftar.</div>
          </div>
        ) : (
          <div className="panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sertifikasi</th>
                    <th style={{ width: 120 }}>Terbit</th>
                    <th style={{ width: 110 }}>Kredensial</th>
                    <th style={{ width: 90, textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCertifications.map((certification) => (
                    <tr key={certification.id}>
                      <td>
                        <span className="admin-table__title" style={{ fontSize: 14 }}>
                          {certification.title}
                        </span>
                        <span className="admin-table__sub">{certification.issuer}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 9.5 }}>
                          {certification.issueDate || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 9 }}>
                          {certification.credentialId || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 28, height: 28 }}
                            onClick={() => {
                              setCertificationId(certification.id);
                              setNonce((current) => current + 1);
                            }}
                            aria-label={`Sunting ${certification.title}`}
                            title="Sunting"
                          >
                            <Icon name="pencil" size={12} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 28, height: 28, color: "var(--danger)" }}
                            onClick={() =>
                              setDeleteTarget({
                                entity: "certifications",
                                id: certification.id,
                                title: certification.title
                              })
                            }
                            disabled={isSubmitting}
                            aria-label={`Hapus ${certification.title}`}
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
            </div>
          </div>
        )}

        {tab === "pengalaman" ? (
          <ExperienceForm
            key={`exp-${experienceId ?? "new"}-${nonce}`}
            experience={editingExperience}
            onSaved={() => {
              setExperienceId(null);
              setNonce((current) => current + 1);
            }}
          />
        ) : (
          <CertificationForm
            key={`cert-${certificationId ?? "new"}-${nonce}`}
            certification={editingCertification}
            onSaved={() => {
              setCertificationId(null);
              setNonce((current) => current + 1);
            }}
          />
        )}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus ${deleteTarget.title}?`}
          description="Entri akan dihapus dari basis data dan seluruh halaman publik yang memakainya. Tindakan ini menulis entri PURGE permanen pada log audit."
          confirmLabel="Hapus Entri"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
