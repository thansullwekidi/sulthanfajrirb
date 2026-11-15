import { NextResponse, type NextRequest } from "next/server";
import type { ApiResponse } from "@/contracts/api-envelope";
import type { CollectionName } from "@/contracts/domain";
import { envelopeError } from "@/contracts/api-envelope";

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return {};
  }
}

export function envelopeResponse<T>(envelope: ApiResponse<T>): NextResponse {
  return NextResponse.json(envelope, {
    status: envelope.status,
    headers: { "cache-control": "no-store" }
  });
}

const COLLECTIONS: CollectionName[] = [
  "experiences",
  "certifications",
  "skills",
  "articles",
  "testimonials"
];

export function asCollectionName(value: string): CollectionName | null {
  return (COLLECTIONS as string[]).includes(value) ? (value as CollectionName) : null;
}

export function unknownCollection(value: string): NextResponse {
  return envelopeResponse(
    envelopeError(
      404,
      "UNKNOWN_COLLECTION",
      `Koleksi "${value}" tidak dikenali oleh Studio.`
    )
  );
}

export function methodNotAllowed(): NextResponse {
  return envelopeResponse(
    envelopeError(400, "METHOD_NOT_ALLOWED", "Metode permintaan tidak didukung.")
  );
}
