import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getSiteConfig } from "@/server/repositories/config.repository";

const MODULES = [
  { index: "01", label: "Ringkasan", href: "/" },
  { index: "02", label: "Katalog Karya", href: "/karya" },
  { index: "03", label: "Rekam Jejak", href: "/rekam-jejak" },
  { index: "04", label: "Catatan Lab", href: "/catatan-lab" },
  { index: "05", label: "CV ATS", href: "/cv" },
  { index: "06", label: "Kontak", href: "/kontak" }
];

export async function SiteFooter() {
  const config = await getSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-main">
          <div className="footer-col">
            <p className="footer-display">
              Sistem yang dapat diaudit, bukan sekadar tampak selesai.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12, maxWidth: "46ch", lineHeight: 1.7 }}>
              {config.fullName} — {config.headline}. Basis data portofolio dikelola melalui Studio
              CMS dengan protokol hapus dua tahap dan log audit permanen.
            </p>
          </div>

          <div className="footer-col">
            <span className="footer-col__title">Modul Publik</span>
            {MODULES.map((module) => (
              <Link key={module.href} href={module.href} className="footer-link">
                <span className="mono" style={{ fontSize: 9, opacity: 0.6 }}>
                  {module.index}
                </span>
                {module.label}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <span className="footer-col__title">Saluran</span>
            <a href={`mailto:${config.email}`} className="footer-link">
              <Icon name="mail" size={12} />
              {config.email}
            </a>
            {config.github ? (
              <a
                href={config.github}
                className="footer-link"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="github" size={12} />
                GitHub
              </a>
            ) : null}
            {config.linkedin ? (
              <a
                href={config.linkedin}
                className="footer-link"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="linkedin" size={12} />
                LinkedIn
              </a>
            ) : null}
            <Link href="/admin" className="footer-link">
              <Icon name="lock" size={12} />
              Studio CMS
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {config.fullName}
            {config.nim ? ` · NIM ${config.nim}` : ""}
          </span>
          <span>Next.js 15 · TypeScript Strict · Persistence Engine Lokal</span>
          <span>
            CV {config.cvVersion} · Diperbarui{" "}
            {new Intl.DateTimeFormat("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta"
            }).format(new Date(config.updatedAt))}
          </span>
        </div>
      </div>
    </footer>
  );
}
