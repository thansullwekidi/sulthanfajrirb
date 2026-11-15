import type { ReactNode } from "react";
import { SiteFooter } from "@/components/chrome/SiteFooter";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="konten">{children}</main>
      <SiteFooter />
    </>
  );
}
