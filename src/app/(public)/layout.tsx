import type { ReactNode } from "react";
import { SiteFooter } from "@/components/chrome/SiteFooter";

// Layout tidak fetch data — tidak perlu force-dynamic.
// Tiap page mengatur strategi cache-nya sendiri (revalidate / force-dynamic).

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="konten">{children}</main>
      <SiteFooter />
    </>
  );
}
