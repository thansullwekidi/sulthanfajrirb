import type { SiteConfig } from "@/contracts/domain";
import type { SiteConfigInput } from "@/contracts/config.contract";
import { unstable_cache } from "next/cache";
import { readDatabase, withTransaction } from "@/server/db/store";
import { appendAudit, createCommitHash } from "./audit.repository";
import { PORTFOLIO_CACHE_TAG, revalidatePortfolioCache } from "@/server/db/cache";

const _getSiteConfig = unstable_cache(
  async (): Promise<SiteConfig> => (await readDatabase()).siteConfig,
  ["portfolio-site-config"],
  { tags: [PORTFOLIO_CACHE_TAG], revalidate: 60 }
);

export async function getSiteConfig(): Promise<SiteConfig> {
  return _getSiteConfig();
}

export async function updateSiteConfig(input: SiteConfigInput): Promise<SiteConfig> {
  const result = await withTransaction((draft) => {
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
  await revalidatePortfolioCache();
  return result;
}
