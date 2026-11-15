import { NextResponse, type NextRequest } from "next/server";
import { readMediaFile } from "@/server/repositories/media.repository";

export const dynamic = "force-dynamic";

/**
 * Penyaji berkas media publik.
 * Sengaja tanpa gerbang sesi: halaman publik memuat gambar ini lewat <img>,
 * sedangkan mutasi media tetap dijaga oleh `runAdmin` di rute POST/DELETE.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { buffer, mimeType } = await readMediaFile(id);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": mimeType,
        "content-length": String(buffer.byteLength),
        // Aset bersifat immutable: nama berkas memuat id unik.
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Media tidak ditemukan.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }
}
