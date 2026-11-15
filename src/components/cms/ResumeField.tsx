"use client";

import { useId, useRef, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { Field } from "@/components/cms/Field";
import { Icon } from "@/components/ui/Icon";
import { RESUME_MAX_BYTES, type MediaAsset } from "@/contracts/domain";
import { mediaUploadSchema } from "@/contracts/media.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Berkas CV tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

export function ResumeField({
  value,
  fileName,
  onChange
}: {
  value: string;
  fileName: string;
  onChange: (url: string) => void;
}) {
  const { run, isSubmitting } = useAdminAction();
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > RESUME_MAX_BYTES) {
      setError(
        `Ukuran CV melebihi batas ${Math.round(RESUME_MAX_BYTES / 1024 / 1024)} MB.`
      );
      return;
    }

    let dataUrl: string;
    try {
      dataUrl = await readAsDataUrl(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Berkas CV tidak dapat dibaca.");
      return;
    }

    const parsed = mediaUploadSchema.safeParse({
      fileName: file.name,
      dataUrl,
      purpose: "RESUME"
    });
    if (!parsed.success) {
      setError(fieldErrorsFromZod(parsed.error).dataUrl ?? "Unggah CV dalam format PDF.");
      return;
    }

    const envelope = await run(
      () => apiPost<MediaAsset>("/api/v1/media", parsed.data),
      {
        successTitle: "CV berhasil diunggah",
        successDescription: file.name
      }
    );
    if (envelope?.ok && envelope.data) onChange(envelope.data.url);
    else setError(envelope?.error?.message ?? "Unggahan CV gagal.");
  };

  return (
    <Field
      label="CV PDF"
      htmlFor={id}
      hint={`Unggah CV buatan Anda sendiri · PDF · maksimal ${Math.round(
        RESUME_MAX_BYTES / 1024 / 1024
      )} MB. Simpan Konfigurasi setelah upload.`}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          border: "1px solid var(--line)",
          padding: 12
        }}
      >
        <Icon name="file" size={20} aria-hidden="true" />
        <span className="mono" style={{ flex: 1, minWidth: 140, fontSize: 10 }}>
          {value ? fileName || "CV sudah diunggah" : "Belum ada CV yang diunggah"}
        </span>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={isSubmitting}
        >
          <Icon name="upload" size={11} />
          {value ? "Ganti PDF" : "Unggah PDF"}
        </button>
        {value ? (
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => onChange("")}
            disabled={isSubmitting}
          >
            Lepas
          </button>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer noopener"
          className="link-inline"
          style={{ marginTop: 6 }}
        >
          Pratinjau PDF yang diunggah
          <Icon name="arrow-up-right" size={11} />
        </a>
      ) : null}
      {error ? <span className="field__error">{error}</span> : null}
    </Field>
  );
}
