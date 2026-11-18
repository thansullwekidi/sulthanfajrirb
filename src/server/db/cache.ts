/**
 * Cache tag yang dipakai seluruh repositori publik.
 * Setelah mutasi CMS, panggil revalidatePortfolioCache() agar
 * halaman publik langsung menerima data terbaru.
 */
export const PORTFOLIO_CACHE_TAG = "portfolio-db";

/**
 * Revalidate cache Next.js untuk seluruh data portofolio.
 * Dipanggil setelah setiap mutasi CMS.
 */
export async function revalidatePortfolioCache(): Promise<void> {
  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(PORTFOLIO_CACHE_TAG);
  } catch {
    // Di luar konteks Next.js (tes, dsb.) — abaikan
  }
}
