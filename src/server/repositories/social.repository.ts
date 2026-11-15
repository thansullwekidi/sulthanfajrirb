import type { SocialLink } from "@/contracts/domain";
import type { SocialLinkInput } from "@/contracts/media.contract";
import { readDatabase, withTransaction } from "@/server/db/store";
import { notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/**
 * Repositori media sosial profil. Setiap tautan dapat ditambah, diubah,
 * diurutkan, disembunyikan, dan dihapus — sama seperti bagian profil lain.
 */

function nextOrder(items: ReadonlyArray<{ sortOrder: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

function sortByOrder(items: SocialLink[]): SocialLink[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeOrders(items: SocialLink[]): void {
  sortByOrder(items).forEach((item, index) => {
    item.sortOrder = index + 1;
  });
}

export async function listSocialLinks(visibleOnly = false): Promise<SocialLink[]> {
  const links = sortByOrder((await readDatabase()).socialLinks);
  return visibleOnly ? links.filter((link) => link.visible) : links;
}

export async function createSocialLink(input: SocialLinkInput): Promise<SocialLink> {
  return withTransaction((draft) => {
    const link: SocialLink = {
      id: createEntityId("soc"),
      platform: input.platform,
      label: input.label,
      url: input.url,
      visible: input.visible,
      sortOrder: nextOrder(draft.socialLinks),
      createdAt: new Date().toISOString()
    };
    draft.socialLinks.push(link);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "SOCIAL_LINK",
      entitySlug: input.platform.toLowerCase(),
      commitHash: createCommitHash(link.id),
      summary: `Menambahkan tautan media sosial ${input.platform}.`
    });
    return structuredClone(link);
  });
}

export async function updateSocialLink(
  id: string,
  input: SocialLinkInput
): Promise<SocialLink> {
  return withTransaction((draft) => {
    const link = draft.socialLinks.find((item) => item.id === id);
    if (!link) throw notFound("Media sosial");
    link.platform = input.platform;
    link.label = input.label;
    link.url = input.url;
    link.visible = input.visible;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "SOCIAL_LINK",
      entitySlug: input.platform.toLowerCase(),
      commitHash: createCommitHash(`social:${id}`),
      summary: `Memperbarui tautan media sosial ${input.platform}.`
    });
    return structuredClone(link);
  });
}

export async function deleteSocialLink(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.socialLinks.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Media sosial");
    const [removed] = draft.socialLinks.splice(index, 1);
    if (!removed) throw notFound("Media sosial");
    normalizeOrders(draft.socialLinks);
    appendAudit(draft, {
      action: "PURGE",
      entityType: "SOCIAL_LINK",
      entitySlug: removed.platform.toLowerCase(),
      commitHash: createCommitHash(`social-del:${id}`),
      summary: `Menghapus tautan media sosial ${removed.platform}.`
    });
  });
}

export async function moveSocialLink(
  id: string,
  direction: "UP" | "DOWN"
): Promise<SocialLink[]> {
  return withTransaction((draft) => {
    const ordered = sortByOrder(draft.socialLinks);
    const index = ordered.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Media sosial");
    const target = direction === "UP" ? index - 1 : index + 1;
    if (target >= 0 && target < ordered.length) {
      const current = ordered[index];
      const other = ordered[target];
      if (current && other) {
        const swap = current.sortOrder;
        current.sortOrder = other.sortOrder;
        other.sortOrder = swap;
        normalizeOrders(draft.socialLinks);
      }
    }
    const link = draft.socialLinks.find((item) => item.id === id);
    appendAudit(draft, {
      action: "REORDER",
      entityType: "SOCIAL_LINK",
      entitySlug: link?.platform.toLowerCase() ?? id,
      commitHash: createCommitHash(`social-move:${id}:${Date.now()}`),
      summary: `Menggeser tautan media sosial ke ${direction === "UP" ? "atas" : "bawah"}.`
    });
    return structuredClone(sortByOrder(draft.socialLinks));
  });
}

export async function setSocialLinkVisibility(
  id: string,
  visible: boolean
): Promise<SocialLink> {
  return withTransaction((draft) => {
    const link = draft.socialLinks.find((item) => item.id === id);
    if (!link) throw notFound("Media sosial");
    link.visible = visible;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "SOCIAL_LINK",
      entitySlug: link.platform.toLowerCase(),
      commitHash: createCommitHash(`social-visibility:${id}`),
      summary: `${visible ? "Menampilkan" : "Menyembunyikan"} tautan media sosial ${link.platform}.`
    });
    return structuredClone(link);
  });
}
