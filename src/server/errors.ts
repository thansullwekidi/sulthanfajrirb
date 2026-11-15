import type { ApiStatus } from "@/contracts/api-envelope";

/** Galat domain yang sudah membawa status HTTP dan kode mesin. */
export class DomainError extends Error {
  readonly status: ApiStatus;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    status: ApiStatus,
    code: string,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const notFound = (entity: string) =>
  new DomainError(404, "NOT_FOUND", `${entity} tidak ditemukan.`);

export const conflictSlug = (slug: string) =>
  new DomainError(
    409,
    "CONFLICT_DUPLICATE_SLUG",
    `Slug "${slug}" sudah dipakai entitas lain. Gunakan slug yang unik.`,
    { slug: `Slug "${slug}" sudah dipakai.` }
  );
