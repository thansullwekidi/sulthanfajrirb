import type { NextRequest } from "next/server";
import {
  mediaDeleteAction,
  mediaListAction,
  mediaUploadAction
} from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/** Daftar aset media beserta total pemakaian penyimpanan. */
export async function GET() {
  return envelopeResponse(await mediaListAction());
}

/** Unggah gambar atau dokumen CV PDF (data URL base64). */
export async function POST(request: NextRequest) {
  return envelopeResponse(await mediaUploadAction(await readJsonBody(request)));
}

/** Hapus aset media berdasarkan id. */
export async function DELETE(request: NextRequest) {
  return envelopeResponse(await mediaDeleteAction(await readJsonBody(request)));
}
