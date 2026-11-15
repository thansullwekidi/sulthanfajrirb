/**
 * LAPISAN 3 — Kontrak Amplop Respons Standar.
 * Setiap respons API (sukses maupun gagal) memakai bentuk yang sama
 * sehingga Lapisan 4 dapat memprosesnya secara deterministik.
 */

export type ApiStatus = 200 | 201 | 400 | 403 | 404 | 409 | 422 | 500;

export interface ApiFieldErrors {
  [field: string]: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: ApiFieldErrors;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: ApiStatus;
  data: T | null;
  error: ApiErrorBody | null;
  timestamp: string;
  requestId: string;
  invalidatedTags: string[];
}

export function envelopeOk<T>(
  data: T,
  options: { status?: ApiStatus; invalidatedTags?: string[]; requestId?: string } = {}
): ApiResponse<T> {
  return {
    ok: true,
    status: options.status ?? 200,
    data,
    error: null,
    timestamp: new Date().toISOString(),
    requestId: options.requestId ?? createRequestId(),
    invalidatedTags: options.invalidatedTags ?? []
  };
}

export function envelopeError(
  status: ApiStatus,
  code: string,
  message: string,
  fields?: ApiFieldErrors,
  requestId?: string
): ApiResponse<never> {
  return {
    ok: false,
    status,
    data: null,
    error: { code, message, ...(fields && Object.keys(fields).length > 0 ? { fields } : {}) },
    timestamp: new Date().toISOString(),
    requestId: requestId ?? createRequestId(),
    invalidatedTags: []
  };
}

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function isEnvelope(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.ok === "boolean" && typeof candidate.status === "number";
}
