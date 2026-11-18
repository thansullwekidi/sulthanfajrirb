import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { ThemeScript } from "@/components/chrome/ThemeScript";
import { ToastProvider } from "@/client/state/ToastProvider";

export const metadata: Metadata = {
  title: {
    default: "Muhammad Sulthan Fajri Rabbani — Design Dossier",
    template: "%s — Sulthan Fajri Rabbani"
  },
  description:
    "Portofolio desain grafis dan media digital: identitas visual, produksi konten, dan pengolahan media. Dikelola melalui Studio CMS dengan log audit permanen.",
  authors: [{ name: "Muhammad Sulthan Fajri Rabbani" }],
  keywords: [
    "desain grafis",
    "portofolio",
    "Adobe Illustrator",
    "Adobe Photoshop",
    "produksi media",
    "Tangerang Selatan"
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "Muhammad Sulthan Fajri Rabbani — Design Dossier",
    description:
      "Dokumentasi karya desain grafis, identitas visual, dan produksi media digital."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect: browser mulai handshake lebih awal, gambar dan font muncul lebih cepat */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Supabase Storage — foto profil, sertifikat, logo */}
        <link rel="preconnect" href="https://gxunsxsmtusncztjkezt.supabase.co" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body>
        <a
          href="#konten"
          className="sr-only"
          style={{ position: "absolute", zIndex: 999 }}
        >
          Lewati ke konten utama
        </a>
        <ToastProvider>
          <SiteHeader />
          <CommandPalette />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
