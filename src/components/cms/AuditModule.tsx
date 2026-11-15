"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  ACTION_LABELS,
  AUDIT_ACTIONS,
  type AuditAction,
  type AuditLog
} from "@/contracts/domain";
import { formatDateTimeId } from "@/contracts/primitives";

type ActionFilter = "ALL" | AuditAction;

export function AuditModule({ logs }: { logs: AuditLog[] }) {
  const [action, setAction] = useState<ActionFilter>("ALL");
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [logs]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sorted.filter((log) => {
      if (action !== "ALL" && log.action !== action) return false;
      if (!term) return true;
      return `${log.summary} ${log.entityType} ${log.entitySlug} ${log.commitHash}`
        .toLowerCase()
        .includes(term);
    });
  }, [action, query, sorted]);

  const actionCount = (target: AuditAction) =>
    logs.filter((log) => log.action === target).length;

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">10 / Audit</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Jejak mutasi yang tidak dapat diubah
          </h2>
          <p className="admin-head__sub">
            Setiap CREATE, UPDATE, ARCHIVE, RESTORE, PURGE, REORDER, IMPORT, dan RESET ditulis
            dalam transaksi yang sama dengan perubahan data. Tidak ada endpoint yang dapat
            menyunting atau menghapus entri audit.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="lock" size={13} />
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
            APPEND-ONLY · {logs.length} ENTRI
          </span>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Icon name="search" size={12} />
          <span className="sr-only">Cari log audit</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari ringkasan, entitas, slug, atau hash commit…"
            type="search"
          />
        </label>

        <div className="admin-toolbar__spacer" />

        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {String(filtered.length).padStart(2, "0")} DARI {String(sorted.length).padStart(2, "0")}{" "}
          ENTRI
        </span>
      </div>

      <div className="admin-toolbar" style={{ borderTop: 0, paddingTop: 0 }}>
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setAction("ALL")}
            style={
              action === "ALL"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Semua ({logs.length})
          </button>
          {AUDIT_ACTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className="btn btn--sm"
              onClick={() => setAction(option)}
              style={
                action === option
                  ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                  : { borderColor: "var(--line)", color: "var(--muted)" }
              }
            >
              {ACTION_LABELS[option]} ({actionCount(option)})
            </button>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Log Aktivitas Sistem</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              TERBARU DI ATAS
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table audit-table">
              <thead>
                <tr>
                  <th style={{ width: 155 }}>Waktu (WIB)</th>
                  <th style={{ width: 120 }}>Aksi</th>
                  <th style={{ width: 145 }}>Entitas</th>
                  <th style={{ width: 90 }}>Commit</th>
                  <th>Ringkasan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="mono" style={{ fontSize: 9 }}>
                        {formatDateTimeId(log.timestamp)}
                      </span>
                    </td>
                    <td>
                      <span className="audit-action" data-action={log.action}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="eyebrow">{log.entityType}</div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 8.5,
                          color: "var(--muted)",
                          marginTop: 2,
                          wordBreak: "break-word"
                        }}
                      >
                        {log.entitySlug || "—"}
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 9 }}>
                        {log.commitHash}
                      </span>
                    </td>
                    <td>{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="admin-empty">
                Tidak ada entri yang cocok. Ubah filter aksi atau kata kunci pencarian.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
