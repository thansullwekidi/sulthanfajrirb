"use client";

import { useMemo, useState } from "react";
import { apiDelete, apiPatch } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Icon } from "@/components/ui/Icon";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type Inquiry,
  type InquiryStatus
} from "@/contracts/domain";
import { formatDateTimeId } from "@/contracts/primitives";

type StatusFilter = "ALL" | InquiryStatus;

export function InboxModule({ inquiries }: { inquiries: Inquiry[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null);

  const sorted = useMemo(
    () => [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inquiries]
  );

  const counts = useMemo(
    () => ({
      ALL: sorted.length,
      UNREAD: sorted.filter((inquiry) => inquiry.status === "UNREAD").length,
      READ: sorted.filter((inquiry) => inquiry.status === "READ").length,
      ARCHIVED: sorted.filter((inquiry) => inquiry.status === "ARCHIVED").length
    }),
    [sorted]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sorted.filter((inquiry) => {
      if (filter !== "ALL" && inquiry.status !== filter) return false;
      if (!term) return true;
      return `${inquiry.senderName} ${inquiry.senderEmail} ${inquiry.organization} ${inquiry.category} ${inquiry.message}`
        .toLowerCase()
        .includes(term);
    });
  }, [filter, query, sorted]);

  const setStatus = async (inquiry: Inquiry, status: InquiryStatus) => {
    await run(
      () => apiPatch<Inquiry>(`/api/v1/inquiries/${inquiry.id}`, { status }),
      {
        successTitle:
          status === "UNREAD"
            ? "Ditandai belum dibaca"
            : status === "READ"
              ? "Ditandai sudah dibaca"
              : "Pesan diarsipkan",
        successDescription: `${inquiry.senderName} · ${inquiry.organization}`
      }
    );
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const envelope = await run(
      () => apiDelete<{ id: string }>(`/api/v1/inquiries/${deleteTarget.id}`),
      {
        successTitle: "Pesan dihapus",
        successDescription: `${deleteTarget.senderName} · ${deleteTarget.senderEmail}`
      }
    );
    if (envelope?.ok) setDeleteTarget(null);
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">08 / Kotak Masuk</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Pesan dari formulir kontak
          </h2>
          <p className="admin-head__sub">
            Seluruh pesan masuk lewat validasi server yang sama dengan formulir publik. Status
            belum dibaca ditampilkan sebagai lencana peringatan pada rail navigasi.
          </p>
        </div>
        <span className={`badge ${counts.UNREAD > 0 ? "badge--accent" : "badge--ok"}`}>
          {counts.UNREAD} BELUM DIBACA
        </span>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Icon name="search" size={12} />
          <span className="sr-only">Cari pesan</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, surel, instansi, atau isi pesan…"
            type="search"
          />
        </label>

        <div style={{ display: "flex", gap: 0 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setFilter("ALL")}
            style={
              filter === "ALL"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Semua ({counts.ALL})
          </button>
          {INQUIRY_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              className="btn btn--sm"
              onClick={() => setFilter(option)}
              style={
                filter === option
                  ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                  : { borderColor: "var(--line)", color: "var(--muted)" }
              }
            >
              {INQUIRY_STATUS_LABELS[option]} ({counts[option]})
            </button>
          ))}
        </div>

        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {String(filtered.length).padStart(2, "0")} DARI {String(sorted.length).padStart(2, "0")}{" "}
          PESAN
        </span>
      </div>

      <div className="admin-panel">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ border: "1px solid var(--line)", marginTop: 0 }}>
            <strong>Tidak ada pesan pada filter ini</strong>
            <span>Ubah status filter atau kata kunci untuk melihat pesan lain.</span>
          </div>
        ) : (
          <div className="inbox-list">
            {filtered.map((inquiry) => (
              <div
                key={inquiry.id}
                className="inbox-item"
                data-unread={inquiry.status === "UNREAD"}
              >
                <span className="inbox-item__marker" aria-hidden="true" />
                <div>
                  <div className="inbox-item__head">
                    <span className="inbox-item__name">{inquiry.senderName}</span>
                    <span className="badge">{inquiry.category}</span>
                    <span className="badge badge--warn">
                      {INQUIRY_STATUS_LABELS[inquiry.status]}
                    </span>
                    {inquiry.budgetTimeline ? (
                      <span className="inbox-item__meta">{inquiry.budgetTimeline}</span>
                    ) : null}
                  </div>
                  <div className="inbox-item__meta">
                    {inquiry.organization} · {inquiry.senderEmail} ·{" "}
                    {formatDateTimeId(inquiry.createdAt)}
                  </div>
                  <p className="inbox-item__message">{inquiry.message}</p>
                </div>
                <div className="inbox-item__actions">
                  {inquiry.status === "UNREAD" ? (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => setStatus(inquiry, "READ")}
                      disabled={isSubmitting}
                      title="Tandai sudah dibaca"
                    >
                      <Icon name="check" size={12} />
                      Dibaca
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => setStatus(inquiry, "UNREAD")}
                      disabled={isSubmitting}
                      title="Tandai belum dibaca"
                    >
                      <Icon name="mail" size={12} />
                      Belum
                    </button>
                  )}

                  {inquiry.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => setStatus(inquiry, "ARCHIVED")}
                      disabled={isSubmitting}
                      title="Arsipkan pesan"
                    >
                      <Icon name="archive" size={12} />
                      Arsip
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => setStatus(inquiry, "READ")}
                      disabled={isSubmitting}
                      title="Keluarkan dari arsip"
                    >
                      <Icon name="restore" size={12} />
                      Pulihkan
                    </button>
                  )}

                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "var(--danger)" }}
                    onClick={() => setDeleteTarget(inquiry)}
                    disabled={isSubmitting}
                    aria-label={`Hapus pesan dari ${inquiry.senderName}`}
                    title="Hapus permanen"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus pesan dari ${deleteTarget.senderName}?`}
          description={`Pesan dari ${deleteTarget.senderEmail} akan dihapus permanen dari kotak masuk dan basis data. Tindakan ini dicatat sebagai PURGE pada log audit.`}
          confirmLabel="Hapus Pesan"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
