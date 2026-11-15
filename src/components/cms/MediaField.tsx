"use client";

import { useId, useRef, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
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
  error,
  id
}: {
  label: string;
  hint?: string;
  purpose: MediaPurpose;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  id?: string;
}) {
  const { run, isSubmitting } = useAdminAction();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const fieldId = id ?? `media-${autoId}`;
  const [localError, setLocalError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

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

    let dataUrl: string;
    try {
      dataUrl = await readAsDataUrl(file);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Berkas tidak dapat dibaca.");
      return;
    }

    const parsed = mediaUploadSchema.safeParse({ fileName: file.name, dataUrl, purpose });
    if (!parsed.success) {
      const fields = fieldErrorsFromZod(parsed.error);
      setLocalError(fields.dataUrl ?? fields.fileName ?? "Berkas tidak valid.");
      return;
    }

    const envelope = await run(
      () => apiPost<MediaAsset>("/api/v1/media", parsed.data),
      {
        successTitle: "Gambar diunggah",
        successDescription: file.name
      }
    );

    if (envelope?.ok) {
      const asset = envelope.data as MediaAsset;
      onChange(asset.url);
    } else {
      setLocalError(envelope?.error?.message ?? "Unggahan gagal.");
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
            width: 46,
            height: 46,
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
            >
              <Icon name="trash" size={11} />
              Lepas
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
    </div>
  );
}
