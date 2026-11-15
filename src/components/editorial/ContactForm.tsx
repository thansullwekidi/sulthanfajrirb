"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useMutationLock } from "@/client/state/useMutationLock";
import { apiPost } from "@/client/state/api-client";
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_OPTIONS,
  inquiryInputSchema
} from "@/contracts/inquiry.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";
import type { Inquiry } from "@/contracts/domain";
import { formatDateTimeId } from "@/contracts/primitives";

interface FormState {
  senderName: string;
  senderEmail: string;
  organization: string;
  category: (typeof INQUIRY_CATEGORIES)[number];
  budgetTimeline: string;
  message: string;
}

const EMPTY: FormState = {
  senderName: "",
  senderEmail: "",
  organization: "",
  category: "Peluang Desain",
  budgetTimeline: "",
  message: ""
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Inquiry | null>(null);
  const { execute, isSubmitting } = useMutationLock();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setGeneralError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const parsed = inquiryInputSchema.safeParse(form);
    if (!parsed.success) {
      setFields(fieldErrorsFromZod(parsed.error));
      setGeneralError("Periksa kembali kolom yang ditandai. Pesan belum terkirim.");
      return;
    }

    const envelope = await execute(() => apiPost<Inquiry>("/api/v1/inquiries", parsed.data));
    if (!envelope) return;

    if (!envelope.ok) {
      setFields(envelope.error?.fields ?? {});
      setGeneralError(
        envelope.error?.message ?? "Pesan tidak dapat dikirim. Coba lagi beberapa saat lagi."
      );
      return;
    }

    if (envelope.data) setReceipt(envelope.data);
    setForm(EMPTY);
    setFields({});
  };

  if (receipt) {
    return (
      <div className="receipt" role="status" aria-live="polite">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="badge badge--ok">
            <Icon name="check" size={11} />
            Terkirim ke Kotak Masuk
          </span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
            {formatDateTimeId(receipt.createdAt)} WIB
          </span>
        </div>

        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Nomor Dispatch</span>
          <span className="receipt__ref">{receipt.id.toUpperCase()}</span>
        </div>

        <dl className="meta-list">
          <div className="meta-row">
            <dt>Pengirim</dt>
            <dd>{receipt.senderName}</dd>
          </div>
          <div className="meta-row">
            <dt>Instansi</dt>
            <dd>{receipt.organization}</dd>
          </div>
          <div className="meta-row">
            <dt>Kategori</dt>
            <dd>{receipt.category}</dd>
          </div>
          <div className="meta-row">
            <dt>Status</dt>
            <dd style={{ color: "var(--accent)" }}>BELUM DIBACA</dd>
          </div>
        </dl>

        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          Pesan tersimpan di basis data dan muncul pada modul Kotak Masuk Studio CMS. Balasan
          dikirim ke <span className="mono">{receipt.senderEmail}</span>.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--primary" onClick={() => setReceipt(null)}>
            <Icon name="plus" size={12} />
            Kirim Pesan Lain
          </button>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              setReceipt(null);
              setForm({
                ...EMPTY,
                senderName: receipt.senderName,
                senderEmail: receipt.senderEmail,
                organization: receipt.organization
              });
            }}
          >
            <Icon name="refresh" size={12} />
            Gunakan Data yang Sama
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="form-status" role="alert">
          <Icon name="alert" size={14} />
          <span>{generalError}</span>
        </div>
      ) : null}

      <div className={`field ${fields.senderName ? "field--error" : ""}`}>
        <label htmlFor="senderName">Nama Lengkap</label>
        <input
          id="senderName"
          className="input"
          value={form.senderName}
          onChange={(event) => update("senderName", event.target.value)}
          placeholder="Nama sesuai identitas"
          autoComplete="name"
          aria-invalid={Boolean(fields.senderName)}
          aria-describedby={fields.senderName ? "senderName-error" : undefined}
        />
        {fields.senderName ? (
          <span className="field__error" id="senderName-error">
            {fields.senderName}
          </span>
        ) : null}
      </div>

      <div className={`field ${fields.senderEmail ? "field--error" : ""}`}>
        <label htmlFor="senderEmail">Alamat Surel</label>
        <input
          id="senderEmail"
          className="input"
          type="email"
          value={form.senderEmail}
          onChange={(event) => update("senderEmail", event.target.value)}
          placeholder="nama@instansi.ac.id"
          autoComplete="email"
          aria-invalid={Boolean(fields.senderEmail)}
          aria-describedby={fields.senderEmail ? "senderEmail-error" : undefined}
        />
        {fields.senderEmail ? (
          <span className="field__error" id="senderEmail-error">
            {fields.senderEmail}
          </span>
        ) : null}
      </div>

      <div className={`field ${fields.organization ? "field--error" : ""}`}>
        <label htmlFor="organization">Instansi / Perusahaan</label>
        <input
          id="organization"
          className="input"
          value={form.organization}
          onChange={(event) => update("organization", event.target.value)}
          placeholder="Laboratorium, kampus, atau perusahaan"
          autoComplete="organization"
          aria-invalid={Boolean(fields.organization)}
        />
        {fields.organization ? <span className="field__error">{fields.organization}</span> : null}
      </div>

      <div className={`field ${fields.category ? "field--error" : ""}`}>
        <label htmlFor="category">Kategori Keperluan</label>
        <select
          id="category"
          className="select"
          value={form.category}
          onChange={(event) =>
            update("category", event.target.value as FormState["category"])
          }
        >
          {INQUIRY_CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {fields.category ? <span className="field__error">{fields.category}</span> : null}
      </div>

      <div className={`field field--full ${fields.budgetTimeline ? "field--error" : ""}`}>
        <label htmlFor="budgetTimeline">
          Rentang Waktu / Anggaran
          <span className="field__hint">opsional</span>
        </label>
        <input
          id="budgetTimeline"
          className="input"
          value={form.budgetTimeline}
          onChange={(event) => update("budgetTimeline", event.target.value)}
          placeholder="Contoh: kontrak 6 bulan, mulai Februari 2027"
        />
        {fields.budgetTimeline ? (
          <span className="field__error">{fields.budgetTimeline}</span>
        ) : null}
      </div>

      <div className={`field field--full ${fields.message ? "field--error" : ""}`}>
        <label htmlFor="message">
          Pesan Teknis
          <span className="field__hint">{form.message.trim().length} / 4000</span>
        </label>
        <textarea
          id="message"
          className="textarea"
          rows={7}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Jelaskan konteks sistem, kendala yang dihadapi, dan hasil yang diharapkan. Sertakan batasan teknis bila ada."
          aria-invalid={Boolean(fields.message)}
          aria-describedby={fields.message ? "message-error" : undefined}
        />
        {fields.message ? (
          <span className="field__error" id="message-error">
            {fields.message}
          </span>
        ) : null}
      </div>

      <div className="form-actions">
        <span className="form-note">
          Divalidasi dengan kontrak skema yang sama di klien dan server.
        </span>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Icon name="refresh" size={13} />
              Mengirim…
            </>
          ) : (
            <>
              <Icon name="arrow-right" size={13} />
              Kirim ke Kotak Masuk
            </>
          )}
        </button>
      </div>
    </form>
  );
}
