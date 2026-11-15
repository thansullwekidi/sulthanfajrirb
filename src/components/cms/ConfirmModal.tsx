"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Konfirmasi",
  tone = "default",
  busy = false,
  onCancel,
  onConfirm
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="modal modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="modal__bar">
          <div className="modal__bar-meta">Konfirmasi Tindakan</div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Tutup">
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="modal__body">
          <h2 className="modal__title" id="confirm-title" style={{ fontSize: 28 }}>
            {title}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>{description}</p>
          <div className="form-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>
              Batalkan
            </button>
            <button
              type="button"
              className={tone === "danger" ? "btn btn--danger" : "btn btn--primary"}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? <Icon name="refresh" size={12} /> : <Icon name="check" size={12} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
