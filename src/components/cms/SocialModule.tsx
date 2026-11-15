"use client";

import { useMemo, useState } from "react";
import { apiPost, apiRequest } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { Icon } from "@/components/ui/Icon";
import {
  MEDIA_PURPOSE_LABELS,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_HINTS,
  SOCIAL_PLATFORM_LABELS,
  type MediaAsset,
  type SocialLink,
  type SocialPlatform
} from "@/contracts/domain";
import { socialLinkInputSchema } from "@/contracts/media.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";

type Tab = "sosial" | "media";

type DeleteTarget =
  | { kind: "social"; id: string; title: string }
  | { kind: "media"; id: string; title: string };

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function SocialForm({
  link,
  onDone
}: {
  link: SocialLink | null;
  onDone: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [platform, setPlatform] = useState<SocialPlatform>(link?.platform ?? "INSTAGRAM");
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [visible, setVisible] = useState(link?.visible ?? true);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = socialLinkInputSchema.safeParse({ platform, label, url, visible });
    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Periksa kembali tautan media sosial yang ditandai.");
      return;
    }

    const envelope = link
      ? await run(
          () =>
            apiPost<SocialLink>("/api/v1/social", {
              action: "social.update",
              id: link.id,
              link: parsed.data
            }),
          { successTitle: "Media sosial diperbarui", successDescription: SOCIAL_PLATFORM_LABELS[platform] }
        )
      : await run(
          () =>
            apiPost<SocialLink>("/api/v1/social", {
              action: "social.create",
              link: parsed.data
            }),
          { successTitle: "Media sosial ditambahkan", successDescription: SOCIAL_PLATFORM_LABELS[platform] }
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

      <Field label="Platform" htmlFor="soc-platform" error={errors.platform}>
        <select
          id="soc-platform"
          className="select"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
        >
          {SOCIAL_PLATFORMS.map((option) => (
            <option key={option} value={option}>
              {SOCIAL_PLATFORM_LABELS[option]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="URL Akun"
        htmlFor="soc-url"
        error={errors.url}
        hint={SOCIAL_PLATFORM_HINTS[platform]}
      >
        <input
          id="soc-url"
          className="input mono"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={SOCIAL_PLATFORM_HINTS[platform]}
          spellCheck={false}
        />
      </Field>

      <Field label="Label Tampilan" htmlFor="soc-label" error={errors.label} hint="opsional">
        <input
          id="soc-label"
          className="input"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={SOCIAL_PLATFORM_LABELS[platform]}
        />
      </Field>

      <label className="check-row">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        Tampilkan tautan ini di profil publik
      </label>

      <div className="form-actions">
        <span className="form-note">
          {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Tautan dibuka di tab baru."}
        </span>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : link ? "Simpan Tautan" : "Tambah Tautan"}
        </button>
      </div>
    </form>
  );
}

export function SocialModule({
  socialLinks,
  mediaAssets
}: {
  socialLinks: SocialLink[];
  mediaAssets: MediaAsset[];
}) {
  const { run, isSubmitting } = useAdminAction();
  const [tab, setTab] = useState<Tab>("sosial");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const sortedLinks = useMemo(
    () => [...socialLinks].sort((a, b) => a.sortOrder - b.sortOrder),
    [socialLinks]
  );
  const sortedAssets = useMemo(
    () => [...mediaAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [mediaAssets]
  );

  const editing = sortedLinks.find((link) => link.id === editingId) ?? null;
  const totalBytes = sortedAssets.reduce((sum, asset) => sum + asset.byteSize, 0);

  const mutateSocial = async (
    body: Record<string, unknown>,
    successTitle: string,
    successDescription?: string
  ) => {
    const envelope = await run(() => apiPost<unknown>("/api/v1/social", body), {
      successTitle,
      successDescription
    });
    return Boolean(envelope?.ok);
  };

  const remove = async () => {
    if (!deleteTarget) return;

    const envelope =
      deleteTarget.kind === "social"
        ? await run(
            () =>
              apiPost<unknown>("/api/v1/social", {
                action: "social.delete",
                id: deleteTarget.id
              }),
            { successTitle: "Tautan dihapus", successDescription: deleteTarget.title }
          )
        : await run(
            () =>
              apiRequest<unknown>("/api/v1/media", {
                method: "DELETE",
                body: JSON.stringify({ id: deleteTarget.id })
              }),
            { successTitle: "Media dihapus", successDescription: deleteTarget.title }
          );

    if (envelope?.ok) {
      if (deleteTarget.kind === "social" && editingId === deleteTarget.id) setEditingId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">10 / Media &amp; Sosial</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Tautan sosial &amp; pustaka media
          </h2>
          <p className="admin-head__sub">
            Kelola tautan media sosial yang tampil di profil publik — tambah, ubah, urutkan,
            sembunyikan, atau hapus. Pustaka media menampung seluruh gambar yang diunggah dari
            modul Konfigurasi, Pengalaman & Sertifikasi, dan Bagian Profil.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setTab("sosial")}
            style={
              tab === "sosial"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Media Sosial ({sortedLinks.length})
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setTab("media")}
            style={
              tab === "media"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Pustaka Media ({sortedAssets.length})
          </button>
        </div>
      </div>

      {tab === "sosial" ? (
        <div className="admin-panel admin-grid-2">
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Daftar Tautan</span>
              <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                {isSubmitting ? "MUTASI BERJALAN…" : `${sortedLinks.length} TAUTAN`}
              </span>
            </div>

            <div className="trash-list">
              {sortedLinks.map((link, index) => (
                <div key={link.id} className="trash-item">
                  <div style={{ flex: 1 }}>
                    <div className="trash-item__title">
                      {link.label || SOCIAL_PLATFORM_LABELS[link.platform]}
                      {link.visible ? null : (
                        <span className="badge" style={{ marginLeft: 8 }}>
                          TERSEMBUNYI
                        </span>
                      )}
                    </div>
                    <div className="trash-item__meta">
                      <span>{SOCIAL_PLATFORM_LABELS[link.platform]}</span>
                      <span style={{ wordBreak: "break-all" }}>
                        {link.url.replace(/^https?:\/\//, "")}
                      </span>
                      <span>URUT {String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                  <div className="trash-item__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 26, height: 26 }}
                      onClick={() =>
                        void mutateSocial(
                          { action: "social.move", id: link.id, direction: "UP" },
                          "Urutan diperbarui",
                          link.label || SOCIAL_PLATFORM_LABELS[link.platform]
                        )
                      }
                      disabled={isSubmitting || index === 0}
                      aria-label="Naikkan"
                      title="Naik"
                    >
                      <Icon name="chevron-up" size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 26, height: 26 }}
                      onClick={() =>
                        void mutateSocial(
                          { action: "social.move", id: link.id, direction: "DOWN" },
                          "Urutan diperbarui",
                          link.label || SOCIAL_PLATFORM_LABELS[link.platform]
                        )
                      }
                      disabled={isSubmitting || index === sortedLinks.length - 1}
                      aria-label="Turunkan"
                      title="Turun"
                    >
                      <Icon name="chevron-down" size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 26, height: 26 }}
                      onClick={() =>
                        void mutateSocial(
                          {
                            action: "social.visibility",
                            id: link.id,
                            visible: !link.visible
                          },
                          link.visible ? "Tautan disembunyikan" : "Tautan ditampilkan",
                          link.label || SOCIAL_PLATFORM_LABELS[link.platform]
                        )
                      }
                      disabled={isSubmitting}
                      aria-label={link.visible ? "Sembunyikan" : "Tampilkan"}
                      title={link.visible ? "Sembunyikan" : "Tampilkan"}
                    >
                      <Icon name={link.visible ? "eye" : "lock"} size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 26, height: 26 }}
                      onClick={() => {
                        setEditingId(link.id);
                        setNonce((current) => current + 1);
                      }}
                      aria-label="Sunting tautan"
                      title="Sunting"
                    >
                      <Icon name="pencil" size={11} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 26, height: 26, color: "var(--danger)" }}
                      onClick={() =>
                        setDeleteTarget({
                          kind: "social",
                          id: link.id,
                          title: link.label || SOCIAL_PLATFORM_LABELS[link.platform]
                        })
                      }
                      disabled={isSubmitting}
                      aria-label="Hapus tautan"
                      title="Hapus"
                    >
                      <Icon name="trash" size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {sortedLinks.length === 0 ? (
                <div className="admin-empty">
                  Belum ada tautan media sosial. Tambahkan Instagram, LinkedIn, atau Behance agar
                  pengunjung dapat menjangkau akun asli.
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">{editingId ? "Sunting Tautan" : "Tautan Baru"}</span>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => {
                  setEditingId(null);
                  setNonce((current) => current + 1);
                }}
              >
                <Icon name="plus" size={11} />
                Baru
              </button>
            </div>
            <SocialForm
              key={`social-${editingId ?? "new"}-${nonce}`}
              link={editing}
              onDone={() => {
                setEditingId(null);
                setNonce((current) => current + 1);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Pustaka Media</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              {sortedAssets.length} BERKAS · {formatBytes(totalBytes)}
            </span>
          </div>

          {sortedAssets.length === 0 ? (
            <div className="admin-empty">
              Belum ada berkas. Unggah foto profil di Konfigurasi, foto sertifikasi di Rekam
              Jejak, atau logo institusi di Bagian Profil.
            </div>
          ) : (
            <div className="panel__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12
                }}
              >
                {sortedAssets.map((asset) => (
                  <div key={asset.id} style={{ border: "1px solid var(--line)" }}>
                    <div
                      style={{
                        aspectRatio: "4 / 3",
                        background: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden"
                      }}
                    >
                      {asset.mimeType === "application/pdf" ? (
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Pratinjau ${asset.fileName}`}
                          style={{ display: "grid", placeItems: "center", gap: 8 }}
                        >
                          <Icon name="file" size={28} />
                          <span className="mono" style={{ fontSize: 8 }}>PDF</span>
                        </a>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.url}
                          alt={asset.fileName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div style={{ padding: 8, display: "grid", gap: 6 }}>
                      <span
                        className="mono"
                        style={{ fontSize: 9, wordBreak: "break-all", lineHeight: 1.5 }}
                      >
                        {asset.fileName}
                      </span>
                      <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                        {MEDIA_PURPOSE_LABELS[asset.purpose]} · {formatBytes(asset.byteSize)}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn--sm btn--quiet"
                          onClick={() => {
                            void navigator.clipboard?.writeText(asset.url);
                          }}
                          title="Salin URL media"
                        >
                          <Icon name="copy" size={11} />
                          URL
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--quiet"
                          style={{ color: "var(--danger)" }}
                          onClick={() =>
                            setDeleteTarget({
                              kind: "media",
                              id: asset.id,
                              title: asset.fileName
                            })
                          }
                          disabled={isSubmitting}
                        >
                          <Icon name="trash" size={11} />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus ${deleteTarget.title}?`}
          description={
            deleteTarget.kind === "social"
              ? "Tautan akan hilang dari profil publik. Tindakan ini menulis entri PURGE permanen pada log audit."
              : "Berkas dihapus permanen dari penyimpanan dan semua referensi yang menggunakannya dilepas dari situs. Tindakan ini menulis entri PURGE pada log audit."
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
