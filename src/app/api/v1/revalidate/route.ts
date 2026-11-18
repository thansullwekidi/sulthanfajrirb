import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * On-demand revalidation endpoint.
 * Dipanggil setelah setiap mutasi CMS agar halaman publik langsung
 * menampilkan data terbaru tanpa menunggu revalidate interval (30 detik).
 *
 * Diamankan dengan secret sederhana agar tidak bisa dipanggil sembarangan.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.REVALIDATE_SECRET ?? process.env.STUDIO_SESSION_SECRET ?? "";
    const body = await request.json() as { secret?: string; paths?: string[] };

    if (secret && body.secret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Revalidate cache tag — hapus cache semua data portofolio
    revalidateTag("portfolio-db");

    // Revalidate halaman publik secara eksplisit
    const paths = body.paths ?? ["/", "/cv", "/kontak"];
    for (const p of paths) {
      revalidatePath(p);
    }

    return NextResponse.json({ ok: true, revalidated: paths });
  } catch (err) {
    console.error("[revalidate] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
