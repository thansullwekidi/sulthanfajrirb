import type { Inquiry, InquiryStatus } from "@/contracts/domain";
import type { InquiryInput } from "@/contracts/inquiry.contract";
import { readDatabase, withTransaction } from "@/server/db/store";
import { notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

export async function listInquiries(): Promise<Inquiry[]> {
  const inquiries = (await readDatabase()).inquiries;
  return [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countUnreadInquiries(): Promise<number> {
  const inquiries = (await readDatabase()).inquiries;
  return inquiries.filter((inquiry) => inquiry.status === "UNREAD").length;
}

/** Dipanggil dari formulir publik — tanpa sesi admin, tetap tercatat di audit. */
export async function createInquiry(input: InquiryInput): Promise<Inquiry> {
  return withTransaction((draft) => {
    const entity: Inquiry = {
      id: createEntityId("inq"),
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      organization: input.organization,
      category: input.category,
      budgetTimeline: input.budgetTimeline,
      message: input.message,
      status: "UNREAD",
      createdAt: new Date().toISOString()
    };
    draft.inquiries.unshift(entity);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "INQUIRY",
      entitySlug: `${entity.senderName} <${entity.senderEmail}>`.slice(0, 90),
      commitHash: createCommitHash(entity.id),
      summary: `Pesan masuk baru dari ${entity.senderName} (${entity.organization}).`
    });
    return structuredClone(entity);
  });
}

export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
  return withTransaction((draft) => {
    const inquiry = draft.inquiries.find((item) => item.id === id);
    if (!inquiry) throw notFound("Pesan");
    inquiry.status = status;
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "INQUIRY",
      entitySlug: `${inquiry.senderName} <${inquiry.senderEmail}>`.slice(0, 90),
      commitHash: createCommitHash(`inquiry:${id}:${status}`),
      summary:
        status === "READ"
          ? `Menandai pesan dari ${inquiry.senderName} sudah dibaca.`
          : `Menandai pesan dari ${inquiry.senderName} belum dibaca.`
    });
    return structuredClone(inquiry);
  });
}

export async function deleteInquiry(id: string): Promise<void> {
  await withTransaction((draft) => {
    const index = draft.inquiries.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Pesan");
    const [removed] = draft.inquiries.splice(index, 1);
    if (!removed) throw notFound("Pesan");
    appendAudit(draft, {
      action: "PURGE",
      entityType: "INQUIRY",
      entitySlug: `${removed.senderName} <${removed.senderEmail}>`.slice(0, 90),
      commitHash: createCommitHash(`inquiry-del:${id}`),
      summary: `Menghapus pesan dari ${removed.senderName}.`
    });
  });
}
