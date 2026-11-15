import { NextResponse, type NextRequest } from "next/server";
import { DomainError } from "@/server/errors";
import { readMediaFile } from "@/server/repositories/media.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Penyaji berkas media publik.
 * Sengaja tanpa gerbang sesi: halaman publik memuat gambar ini lewat <img>,
 * sedangkan mutasi media tetap dijaga oleh `runAdmin` di rute POST/DELETE.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { buffer, mimeType, fileName } = await readMediaFile(id);
    const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": mimeType,
        "content-length": String(buffer.byteLength),
        "content-disposition": `${disposition}; filename="${fileName}"`,
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=60, s-maxage=60, must-revalidate"
      }
    });
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) {
      return new NextResponse("Media tidak ditemukan.", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }
    console.error("[media] gagal menyajikan berkas:", error);
    return new NextResponse("Berkas media tidak dapat disajikan.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }
}
