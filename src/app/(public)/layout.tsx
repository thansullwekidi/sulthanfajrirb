import type { ReactNode } from "react";
import { SiteFooter } from "@/components/chrome/SiteFooter";

// ISR: seluruh layout publik (termasuk SiteFooter) direvalidasi otomatis saat CMS disimpan
export const revalidate = 300;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="konten">{children}</main>
      <SiteFooter />
    </>
  );
}
