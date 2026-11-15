"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useMutationLock } from "@/client/state/useMutationLock";
import { Icon } from "@/components/ui/Icon";
import type { AdminSession } from "@/contracts/auth.contract";

export function AdminLogin() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { execute, isSubmitting } = useMutationLock();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    const envelope = await execute(() =>
      apiPost<{ session: AdminSession }>("/api/v1/auth/login", { passphrase })
    );
    if (!envelope) return;

    if (!envelope.ok) {
      setError(envelope.error?.message ?? "Autentikasi gagal.");
      setFieldError(envelope.error?.fields?.passphrase ?? null);
      return;
    }

    router.refresh();
  };

  return (
    <div className="shell">
      <div className="login-wrap">
        <aside className="login-aside">
          <span className="eyebrow eyebrow--accent">Studio CMS / Akses Terbatas</span>
          <h1 className="display" style={{ fontSize: "clamp(40px, 5vw, 72px)", maxWidth: "15ch" }}>
            Ruang kerja <em>pemilik sistem.</em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.75, maxWidth: "52ch" }}>
            Sesi admin diperlukan untuk seluruh mutasi data. Tanda tangan cookie diverifikasi di
            server sebelum controller menyentuh repositori; permintaan tanpa sesi valid menerima
            amplop <span className="mono">403 SESSION_REQUIRED</span>.
          </p>

          <dl className="meta-list" style={{ maxWidth: 420 }}>
            <div className="meta-row">
              <dt>Arsitektur</dt>
              <dd>5-lapis satu arah</dd>
            </div>
            <div className="meta-row">
              <dt>Penyimpanan</dt>
              <dd>Local persistence engine</dd>
            </div>
            <div className="meta-row">
              <dt>Audit</dt>
              <dd>Immutable trail</dd>
            </div>
            <div className="meta-row">
              <dt>Hapus</dt>
              <dd>2 tahap · slug confirm</dd>
            </div>
          </dl>

          <div
            style={{
              border: "1px solid var(--line)",
              padding: "14px 16px",
              maxWidth: 460,
              display: "flex",
              gap: 10
            }}
          >
            <Icon name="lock" size={15} />
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
              Kredensial demo lokal: frasa sandi <span className="mono">studio-2026</span>. Ganti
              melalui variabel lingkungan <span className="mono">STUDIO_ADMIN_PASSPHRASE</span> dan{" "}
              <span className="mono">STUDIO_SESSION_SECRET</span> sebelum deploy.
            </p>
          </div>
        </aside>

        <div className="login-form">
          <span className="eyebrow">Verifikasi Sesi</span>
          <h2 className="login-form__title">Masuk ke Studio</h2>
          <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
            Sesi berlaku 8 jam dan disimpan sebagai cookie <span className="mono">httpOnly</span>.
          </p>

          <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
            {error ? (
              <div className="form-status" role="alert">
                <Icon name="alert" size={14} />
                <span>{error}</span>
              </div>
            ) : null}

            <div className={`field ${fieldError ? "field--error" : ""}`}>
              <label htmlFor="passphrase">Frasa Sandi Admin</label>
              <input
                id="passphrase"
                type="password"
                className="input"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••"
                aria-invalid={Boolean(fieldError)}
                autoFocus
              />
              {fieldError ? <span className="field__error">{fieldError}</span> : null}
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="refresh" size={13} />
                  Memverifikasi…
                </>
              ) : (
                <>
                  <Icon name="lock" size={13} />
                  Buka Sesi Admin
                </>
              )}
            </button>
          </form>

          <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)", lineHeight: 1.7 }}>
            DENGAN MASUK, ANDA MENYETUJUI SELURUH MUTASI DICATAT PADA AUDIT LOG SISTEM.
          </span>
        </div>
      </div>
    </div>
  );
}
