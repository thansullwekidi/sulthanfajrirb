import { createHash, randomUUID } from "node:crypto";
import type { AuditAction, AuditLog, Database } from "@/contracts/domain";

export function createEntityId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function createCommitHash(seed: string): string {
  return createHash("sha1")
    .update(`${seed}:${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 7);
}

export interface AuditInput {
  action: AuditAction;
  entityType: string;
  entitySlug: string;
  commitHash: string;
  summary: string;
}

/** Wajib dipanggil di dalam transaksi yang sama dengan mutasi. */
export function appendAudit(draft: Database, input: AuditInput): AuditLog {
  const entry: AuditLog = {
    id: createEntityId("aud"),
    timestamp: new Date().toISOString(),
    action: input.action,
    entityType: input.entityType,
    entitySlug: input.entitySlug,
    commitHash: input.commitHash,
    summary: input.summary
  };
  draft.auditLogs.unshift(entry);
  return entry;
}

export function auditSlugFallback(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
