"use client";

import { useEffect, useRef, useState } from "react";
import { apiPatch, apiPost, apiRequest } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { useStudio } from "@/client/state/StudioProvider";
import { useToast } from "@/client/state/ToastProvider";
import { useMutationLock } from "@/client/state/useMutationLock";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { MediaField } from "@/components/cms/MediaField";
import { Icon } from "@/components/ui/Icon";
import { siteConfigInputSchema } from "@/contracts/config.contract";
import type { SiteConfig } from "@/contracts/domain";
import { formatDateTimeId } from "@/contracts/primitives";
import { fieldErrorsFromZod } from "@/contracts/validation";

interface ImportCandidate {
  fileName: string;
  payload: unknown;
  summary: string;
}

function countSummary(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Struktur berkas tidak dikenali.";
  const candidate =
    "database" in payload ? (payload as { database: unknown }).database : payload;
  if (!candidate || typeof candidate !== "object") return "Struktur basis data tidak dikenali.";
  const record = candidate as Record<string, unknown>;
  const count = (key: string) => (Array.isArray(record[key]) ? record[key].length : 0);
  return `${count("projects")} proyek · ${count("articles")} artikel · ${count("skills")} keahlian · ${count("testimonials")} rekomendasi`;
}

export function SettingsModule({ config }: { config: SiteConfig }) {
  const { snapshot, refresh } = useStudio();
  const { toast } = useToast();
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const exportLock = useMutationLock();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(config.fullName);
  const [nim, setNim] = useState(config.nim);
  const [headline, setHeadline] = useState(config.headline);
  const [bio, setBio] = useState(config.bio);
  const [location, setLocation] = useState(config.location);
  const [email, setEmail] = useState(config.email);
  const [phone, setPhone] = useState(config.phone);
  const [website, setWebsite] = useState(config.website);
  const [address, setAddress] = useState(config.address);
  const [github, setGithub] = useState(config.github);
  const [linkedin, setLinkedin] = useState(config.linkedin);
  const [avatarUrl, setAvatarUrl] = useState(config.avatarUrl);
  const [coverImageUrl, setCoverImageUrl] = useState(config.coverImageUrl);
  const [pronouns, setPronouns] = useState(config.pronouns);
  const [connections, setConnections] = useState(config.connections);
  const [followers, setFollowers] = useState(config.followers);
  const [availability, setAvailability] = useState(config.availability);
  const [availabilityNote, setAvailabilityNote] = useState(config.availabilityNote);
  const [openToWork, setOpenToWork] = useState(config.openToWork);
  const [openToWorkNote, setOpenToWorkNote] = useState(config.openToWorkNote);
  const [cvVersion, setCvVersion] = useState(config.cvVersion);
  const [education, setEducation] = useState(config.education);

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [importCandidate, setImportCandidate] = useState<ImportCandidate | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  useEffect(() => {
    setFullName(config.fullName);
    setNim(config.nim);
    setHeadline(config.headline);
    setBio(config.bio);
    setLocation(config.location);
    setEmail(config.email);
    setPhone(config.phone);
    setWebsite(config.website);
    setAddress(config.address);
    setGithub(config.github);
    setLinkedin(config.linkedin);
    setAvatarUrl(config.avatarUrl);
    setCoverImageUrl(config.coverImageUrl);
    setPronouns(config.pronouns);
    setConnections(config.connections);
    setFollowers(config.followers);
    setAvailability(config.availability);
    setAvailabilityNote(config.availabilityNote);
    setOpenToWork(config.openToWork);
    setOpenToWorkNote(config.openToWorkNote);
    setCvVersion(config.cvVersion);
    setEducation(config.education);
  }, [config]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = siteConfigInputSchema.safeParse({
      fullName,
      nim,
      headline,
      bio,
      location,
      email,
      phone,
      website,
      address,
      github,
      linkedin,
      avatarUrl,
      coverImageUrl,
      pronouns,
      connections,
      followers,
      availability,
      availabilityNote,
      openToWork,
      openToWorkNote,
      cvVersion,
      education
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Kontrak konfigurasi belum terpenuhi. Perbaiki kolom yang ditandai.");
      return;
    }

    await run(() => apiPatch<SiteConfig>("/api/v1/config", parsed.data), {
      successTitle: "Konfigurasi tersimpan",
      successDescription: "Identitas, tautan, dan status ketersediaan diperbarui."
    });
  };

  const exportJson = async () => {
    const envelope = await exportLock.execute(() =>
      apiRequest<{ filename: string; database: unknown }>("/api/v1/database/export")
    );
    if (!envelope) return;
    if (!envelope.ok || !envelope.data) {
      toast({
        tone: "error",
        title: "Ekspor gagal",
        description: envelope.error?.message ?? "Berkas basis data tidak dapat dibuat."
      });
      return;
    }

    const blob = new Blob([JSON.stringify(envelope.data.database, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = envelope.data.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    toast({
      tone: "success",
      title: "Berkas ekspor dibuat",
      description: envelope.data.filename
    });
  };

  const handleFile = async (file: File | undefined) => {
    setFileError(null);
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      setImportCandidate({
        fileName: file.name,
        payload,
        summary: countSummary(payload)
      });
    } catch {
      setFileError("Berkas bukan JSON yang valid. Periksa struktur dan coba lagi.");
      setImportCandidate(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!importCandidate) return;
    const envelope = await run(
      () => apiPost<unknown>("/api/v1/database/import", importCandidate.payload),
      {
        successTitle: "Basis data diimpor",
        successDescription: importCandidate.fileName
      }
    );
    if (envelope?.ok) setImportCandidate(null);
  };

  const confirmReset = async () => {
    const envelope = await run(() => apiPost<unknown>("/api/v1/database/reset", {}), {
      successTitle: "Basis data direset",
      successDescription: "Seluruh entitas kembali ke data standar pabrik."
    });
    if (envelope?.ok) setResetOpen(false);
  };

  const counts = snapshot?.counts;

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">11 / Konfigurasi</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Identitas global & basis data
          </h2>
          <p className="admin-head__sub">
            Konfigurasi ini memasok nama, bio, tautan, dan status ketersediaan ke seluruh halaman
            publik sekaligus generator CV ATS. Ekspor JSON adalah salinan penuh yang dapat
            diimpor kembali.
          </p>
        </div>
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          DIPERBARUI {formatDateTimeId(config.updatedAt)}
        </span>
      </div>

      <div className="admin-panel admin-grid-2">
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Formulir Konfigurasi</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
            </span>
          </div>

          <form className="panel__body stack" style={{ gap: 14 }} onSubmit={save} noValidate>
            {banner ? (
              <div className="form-status" role="alert">
                <Icon name="alert" size={14} />
                <span>{banner}</span>
              </div>
            ) : null}

            <div className="form-row-2">
              <Field label="Nama Lengkap" htmlFor="cfg-name" error={errors.fullName}>
                <input
                  id="cfg-name"
                  className="input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </Field>
              <Field label="NIM / ID (opsional)" htmlFor="cfg-nim" error={errors.nim}>
                <input
                  id="cfg-nim"
                  className="input mono"
                  value={nim}
                  placeholder="Dikosongkan bila tidak relevan"
                  onChange={(event) => setNim(event.target.value)}
                />
              </Field>
            </div>

            <Field label="Judul Spesialisasi" htmlFor="cfg-headline" error={errors.headline}>
              <input
                id="cfg-headline"
                className="input"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
              />
            </Field>

            <Field label="Bio Ringkas" htmlFor="cfg-bio" error={errors.bio} hint="40—800 karakter">
              <textarea
                id="cfg-bio"
                className="textarea"
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </Field>

            <div className="form-row-2">
              <Field label="Lokasi" htmlFor="cfg-location" error={errors.location}>
                <input
                  id="cfg-location"
                  className="input"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </Field>
              <Field label="Alamat Surel" htmlFor="cfg-email" error={errors.email}>
                <input
                  id="cfg-email"
                  type="email"
                  className="input mono"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
            </div>

            <div className="form-row-2">
              <Field label="Telepon" htmlFor="cfg-phone" error={errors.phone} hint="opsional">
                <input
                  id="cfg-phone"
                  className="input mono"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
              <Field label="Situs Web" htmlFor="cfg-website" error={errors.website} hint="opsional">
                <input
                  id="cfg-website"
                  className="input mono"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  spellCheck={false}
                />
              </Field>
            </div>

            <Field label="Alamat" htmlFor="cfg-address" error={errors.address} hint="opsional">
              <input
                id="cfg-address"
                className="input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </Field>

            <div className="form-row-2">
              <Field
                label="Kata Ganti"
                htmlFor="cfg-pronouns"
                error={errors.pronouns}
                hint="opsional"
              >
                <input
                  id="cfg-pronouns"
                  className="input"
                  value={pronouns}
                  onChange={(event) => setPronouns(event.target.value)}
                  placeholder="ia / dia"
                />
              </Field>
              <Field label="Pendidikan" htmlFor="cfg-education" error={errors.education}>
                <input
                  id="cfg-education"
                  className="input"
                  value={education}
                  onChange={(event) => setEducation(event.target.value)}
                />
              </Field>
            </div>

            <div className="form-row-2">
              <Field label="Koneksi" htmlFor="cfg-connections" error={errors.connections}>
                <input
                  id="cfg-connections"
                  type="number"
                  min={0}
                  className="input mono"
                  value={connections}
                  onChange={(event) => setConnections(Number(event.target.value))}
                />
              </Field>
              <Field label="Pengikut" htmlFor="cfg-followers" error={errors.followers}>
                <input
                  id="cfg-followers"
                  type="number"
                  min={0}
                  className="input mono"
                  value={followers}
                  onChange={(event) => setFollowers(Number(event.target.value))}
                />
              </Field>
            </div>

            <MediaField
              id="cfg-avatar"
              label="Foto Profil"
              hint="opsional, tampil di beranda & CV"
              purpose="AVATAR"
              value={avatarUrl}
              onChange={setAvatarUrl}
              error={errors.avatarUrl}
            />

            <MediaField
              id="cfg-cover"
              label="Foto Sampul"
              hint="opsional, tampil di kepala profil publik"
              purpose="COVER"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              error={errors.coverImageUrl}
            />

            <Field label="GitHub" htmlFor="cfg-github" error={errors.github} hint="opsional">
              <input
                id="cfg-github"
                className="input mono"
                value={github}
                onChange={(event) => setGithub(event.target.value)}
                spellCheck={false}
              />
            </Field>

            <Field label="LinkedIn" htmlFor="cfg-linkedin" error={errors.linkedin} hint="opsional">
              <input
                id="cfg-linkedin"
                className="input mono"
                value={linkedin}
                onChange={(event) => setLinkedin(event.target.value)}
                spellCheck={false}
              />
            </Field>

            <div className="form-row-2">
              <Field label="Versi CV" htmlFor="cfg-cv" error={errors.cvVersion}>
                <input
                  id="cfg-cv"
                  className="input mono"
                  value={cvVersion}
                  onChange={(event) => setCvVersion(event.target.value)}
                />
              </Field>
              <Field
                label="Catatan Ketersediaan"
                htmlFor="cfg-availability-note"
                error={errors.availabilityNote}
              >
                <input
                  id="cfg-availability-note"
                  className="input"
                  value={availabilityNote}
                  onChange={(event) => setAvailabilityNote(event.target.value)}
                />
              </Field>
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={availability}
                onChange={(event) => setAvailability(event.target.checked)}
              />
              Tersedia untuk peluang desain & kolaborasi kreatif
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={openToWork}
                onChange={(event) => setOpenToWork(event.target.checked)}
              />
              Terbuka untuk peluang kerja (Open to Work)
            </label>

            <Field
              label="Catatan Peluang Kerja"
              htmlFor="cfg-open-note"
              error={errors.openToWorkNote}
              hint="opsional, tampil bila Open to Work aktif"
            >
              <input
                id="cfg-open-note"
                className="input"
                value={openToWorkNote}
                onChange={(event) => setOpenToWorkNote(event.target.value)}
              />
            </Field>

            <div className="form-actions">
              <span className="form-note">
                {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Berlaku di 6 halaman publik."}
              </span>
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Simpan Konfigurasi"}
              </button>
            </div>
          </form>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Cadangan JSON</span>
              <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                {counts ? `${counts.auditLogs} LOG` : "SNAPSHOT"}
              </span>
            </div>
            <div className="panel__body stack" style={{ gap: 12 }}>
              <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.65 }}>
                Ekspor menghasilkan satu berkas JSON berisi proyek, rekam jejak, keahlian, jurnal,
                rekomendasi, kotak masuk, konfigurasi, dan seluruh log audit. Impor memvalidasi
                ulang setiap kolom melalui kontrak skema server sebelum menimpa basis data.
              </p>

              <div className="form-row-2">
                <Field label="Ekspor" htmlFor="cfg-export">
                  <input
                    id="cfg-export"
                    className="input mono"
                    value={counts ? `${counts.projectsPublished + counts.projectsDraft + counts.projectsArchived} proyek · ${counts.articles} artikel` : "—"}
                    readOnly
                    tabIndex={-1}
                  />
                </Field>
                <Field label="Impor" htmlFor="cfg-import">
                  <input
                    id="cfg-import"
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="input"
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                    style={{ paddingTop: 7 }}
                  />
                </Field>
              </div>

              {fileError ? (
                <div className="form-status" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{fileError}</span>
                </div>
              ) : null}

              <div className="form-actions" style={{ marginTop: 2 }}>
                <span className="form-note">JSON · UTF-8 · tanpa kompresi</span>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => void exportJson()}
                  disabled={exportLock.isSubmitting}
                >
                  <Icon name="download" size={12} />
                  {exportLock.isSubmitting ? "Menyiapkan…" : "Unduh Ekspor"}
                </button>
              </div>
            </div>
          </div>

          <div className="danger-zone">
            <span className="danger-zone__title">Zona Berbahaya</span>
            <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.65 }}>
              Reset mengembalikan seluruh basis data ke data standar pabrik. Ekspor cadangan
              terlebih dahulu bila ingin mempertahankan perubahan lokal.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setResetOpen(true)}
                disabled={isSubmitting}
              >
                <Icon name="refresh" size={12} />
                Reset Basis Data
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => void refresh()}
                disabled={isSubmitting}
              >
                <Icon name="restore" size={12} />
                Sinkronkan Ulang
              </button>
            </div>
          </div>
        </div>
      </div>

      {importCandidate ? (
        <ConfirmModal
          title={`Impor ${importCandidate.fileName}?`}
          description={`Berkas: ${importCandidate.summary}. Seluruh data saat ini akan diganti oleh isi berkas, lalu entri IMPORT ditulis ke log audit.`}
          confirmLabel="Impor & Timpa"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setImportCandidate(null)}
          onConfirm={confirmImport}
        />
      ) : null}

      {resetOpen ? (
        <ConfirmModal
          title="Reset seluruh basis data?"
          description="Semua proyek, artikel, keahlian, rekomendasi, pesan, dan log audit akan dikembalikan ke data standar pabrik. Ekspor cadangan terlebih dahulu bila ragu."
          confirmLabel="Reset Sekarang"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setResetOpen(false)}
          onConfirm={confirmReset}
        />
      ) : null}
    </div>
  );
}
