/**
 * Cache tag yang dipakai seluruh repositori publik.
 * Setelah mutasi CMS, panggil revalidatePortfolioCache() agar
 * halaman publik langsung menerima data terbaru.
 */
export const PORTFOLIO_CACHE_TAG = "portfolio-db";

/**
 * Revalidate cache Next.js untuk seluruh data portofolio.
 * Dipanggil setelah setiap mutasi CMS.
 *
 * Strategi:
 * 1. revalidateTag() — hapus semua unstable_cache yang bertag "portfolio-db"
 * 2. revalidatePath() — tandai halaman statis untuk di-regenerasi ulang (ISR)
 */
export async function revalidatePortfolioCache(): Promise<void> {
  try {
    const { revalidateTag, revalidatePath } = await import("next/cache");

    // Invalidate semua query yang di-cache dengan tag ini
    revalidateTag(PORTFOLIO_CACHE_TAG);

    // Regenerasi ulang seluruh layout publik & halaman ISR
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/cv");
    revalidatePath("/kontak");
  } catch {
    // Di luar konteks Next.js (tes, dsb.) — abaikan
  }
}
