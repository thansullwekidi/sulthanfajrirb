import type { NextRequest } from "next/server";
import { socialMutationAction } from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";

/** Mutasi tautan media sosial: tambah, ubah, hapus, urutkan, sembunyikan. */
export async function POST(request: NextRequest) {
  return envelopeResponse(await socialMutationAction(await readJsonBody(request)));
}
