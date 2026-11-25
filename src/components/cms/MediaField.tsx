"use client";

import { useId, useRef, useState } from "react";
import { apiPost, apiRequest } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Icon } from "@/components/ui/Icon";
import { MEDIA_MAX_BYTES, type MediaAsset, type MediaPurpose } from "@/contracts/domain";
import { mediaUploadSchema } from "@/contracts/media.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";

/**
 * Kolom unggah satu berkas gambar.
 * Alur: berkas → data URL → `POST /api/v1/media` → URL aset disimpan ke kolom entitas.
 * Nilai akhir tetap berupa URL sehingga entri dapat dirujuk dari mana pun.
 */

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

function maxDimensionForPurpose(purpose: MediaPurpose): number {
  switch (purpose) {
    case "ORGANIZATION_LOGO":
    case "EDUCATION_LOGO":
      return 256;
    case "AVATAR":
      return 720;
    default:
      return 1600;
  }
}

async function optimizeImageFile(file: File, purpose: MediaPurpose): Promise<File> {
  if (!["image/jpeg", "image/png"].includes(file.type) || file.size <= 80 * 1024) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = maxDimensionForPurpose(purpose);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Berkas tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

export function MediaField({
  label,
  hint,
  purpose,
  value,
  onChange,
  onUploaded,
  error,
  id,
  previewSize = 46
}: {
  label: string;
  hint?: string;
  purpose: MediaPurpose;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => Promise<void>;
  error?: string;
  id?: string;
  previewSize?: number;
}) {
  const { run, isSubmitting } = useAdminAction();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const fieldId = id ?? `media-${autoId}`;
  const [localError, setLocalError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const upload = async (file: File) => {
    setLocalError(null);

    if (file.size > MEDIA_MAX_BYTES) {
      setLocalError(
        `Ukuran berkas ${Math.round(file.size / 1024)} KB melebihi batas ${Math.round(
          MEDIA_MAX_BYTES / 1024 / 1024
        )} MB.`
      );
      return;
    }

    const optimized = await optimizeImageFile(file, purpose);

    let dataUrl: string;
    try {
      dataUrl = await readAsDataUrl(optimized);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Berkas tidak dapat dibaca.");
      return;
    }

    const parsed = mediaUploadSchema.safeParse({ fileName: optimized.name, dataUrl, purpose });
    if (!parsed.success) {
      const fields = fieldErrorsFromZod(parsed.error);
      setLocalError(fields.dataUrl ?? fields.fileName ?? "Berkas tidak valid.");
      return;
    }

    const envelope = await run(
      () => apiPost<MediaAsset>("/api/v1/media", parsed.data),
      {
        successTitle: "Gambar diunggah",
        successDescription: optimized.name
      }
    );

    if (envelope?.ok) {
      const asset = envelope.data as MediaAsset;
      onChange(asset.url);
      await onUploaded?.(asset.url);
    } else {
      setLocalError(envelope?.error?.message ?? "Unggahan gagal.");
    }
  };

  const mediaId =
    /\/(?:api\/v1\/media\/|portfolio-media\/)(med_[A-Za-z0-9_-]+)(?:\.[a-z0-9]+)?$/i.exec(
      value
    )?.[1] ?? "";
  const deleteUploadedImage = async () => {
    if (!mediaId) {
      setLocalError("Foto ini bukan aset unggahan lokal yang dapat dihapus.");
      return;
    }

    const envelope = await run(
      () =>
        apiRequest<{ id: string }>("/api/v1/media", {
          method: "DELETE",
          body: JSON.stringify({ id: mediaId })
        }),
      {
        successTitle: "Foto dihapus permanen",
        successDescription: "Foto dan semua pemakaiannya di situs telah dihapus."
      }
    );

    if (envelope?.ok) {
      onChange("");
      setDeleteOpen(false);
    } else {
      setLocalError(envelope?.error?.message ?? "Foto gagal dihapus.");
    }
  };

  return (
    <div className={`field ${error || localError ? "field--error" : ""}`}>
      <label htmlFor={fieldId}>
        {label}
        <span className="field__hint">{hint ?? "PNG, JPEG, WebP, GIF, AVIF · maks 2 MB"}</span>
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 8,
          border: "1px solid var(--line)"
        }}
      >
        <div
          style={{
            width: previewSize,
            height: previewSize,
            flex: "0 0 auto",
            border: "1px solid var(--line)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            background: "var(--surface)"
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Icon name="user" size={16} />
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
          >
            <Icon name="upload" size={11} />
            {value ? "Ganti" : "Unggah"}
          </button>
          {value ? (
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => onChange("")}
              disabled={isSubmitting}
              title="Lepaskan foto dari kolom ini; berkas tetap ada di pustaka media"
            >
              Lepas
            </button>
          ) : null}
          {mediaId ? (
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => setDeleteOpen(true)}
              disabled={isSubmitting}
              style={{ color: "var(--danger)" }}
            >
              <Icon name="trash" size={11} />
              Hapus permanen
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => setManual((current) => !current)}
          >
            <Icon name="code" size={11} />
            {manual ? "Sembunyikan URL" : "URL manual"}
          </button>
        </div>

        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>

      {manual ? (
        <input
          className="input mono"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          spellCheck={false}
          aria-label={`URL ${label}`}
        />
      ) : null}

      {error || localError ? (
        <span className="field__error">{error ?? localError}</span>
      ) : null}

      {deleteOpen ? (
        <ConfirmModal
          title="Hapus foto permanen?"
          description="Berkas akan dihapus dari penyimpanan dan semua referensi foto ini pada situs akan dilepas. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus Foto"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void deleteUploadedImage()}
        />
      ) : null}
    </div>
  );
}
