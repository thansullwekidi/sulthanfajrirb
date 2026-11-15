import type { SiteConfig } from "@/contracts/domain";
import type { SiteConfigInput } from "@/contracts/config.contract";
import { readDatabase, withTransaction } from "@/server/db/store";
import { appendAudit, createCommitHash } from "./audit.repository";

export async function getSiteConfig(): Promise<SiteConfig> {
  return (await readDatabase()).siteConfig;
}

export async function updateSiteConfig(input: SiteConfigInput): Promise<SiteConfig> {
  return withTransaction((draft) => {
    draft.siteConfig = {
      ...input,
      updatedAt: new Date().toISOString()
    };
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "SITE_CONFIG",
      entitySlug: "konfigurasi-global",
      commitHash: createCommitHash(`config:${Date.now()}`),
      summary: `Memperbarui konfigurasi global (${input.fullName}).`
    });
    return structuredClone(draft.siteConfig);
  });
}
