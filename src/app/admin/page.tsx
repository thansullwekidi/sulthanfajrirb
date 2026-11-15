import type { Metadata } from "next";
import { StudioProvider } from "@/client/state/StudioProvider";
import { AdminLogin } from "@/components/cms/AdminLogin";
import { StudioShell } from "@/components/cms/StudioShell";
import { getAdminSession } from "@/server/services/auth.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio CMS",
  description: "Ruang kendali konten portofolio dengan audit trail permanen.",
  robots: { index: false, follow: false, nocache: true }
};

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    return <AdminLogin />;
  }

  return (
    <div className="shell">
      <StudioProvider>
        <StudioShell session={session} />
      </StudioProvider>
    </div>
  );
}
