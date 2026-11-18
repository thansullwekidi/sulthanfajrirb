import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { ThemeScript } from "@/components/chrome/ThemeScript";
import { ToastProvider } from "@/client/state/ToastProvider";

const BASE_URL = "https://www.sulthanfajrirb.my.id";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Muhammad Sulthan Fajri Rabbani — Design Dossier",
    template: "%s — Sulthan Fajri Rabbani"
  },
  description:
    "Portofolio desain grafis dan media digital: identitas visual, produksi konten, dan pengolahan media. Mahasiswa desain komunikasi visual berbasis di Tangerang Selatan.",
  authors: [{ name: "Muhammad Sulthan Fajri Rabbani", url: BASE_URL }],
  creator: "Muhammad Sulthan Fajri Rabbani",
  keywords: [
    "desain grafis",
    "portofolio",
    "desain komunikasi visual",
    "Adobe Illustrator",
    "Adobe Photoshop",
    "produksi media",
    "Tangerang Selatan",
    "Sulthan Fajri Rabbani"
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: BASE_URL,
    siteName: "Sulthan Fajri Rabbani — Design Dossier",
    title: "Muhammad Sulthan Fajri Rabbani — Design Dossier",
    description:
      "Portofolio desain grafis, identitas visual, dan produksi media digital. Dikelola melalui Studio CMS."
  },
  twitter: {
    card: "summary",
    title: "Muhammad Sulthan Fajri Rabbani — Design Dossier",
    description: "Portofolio desain grafis dan media digital."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  alternates: {
    canonical: BASE_URL
  }
};

// JSON-LD: structured data untuk Google Rich Results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Muhammad Sulthan Fajri Rabbani",
  url: BASE_URL,
  jobTitle: "Desainer Grafis",
  description:
    "Mahasiswa desain grafis dan media digital berbasis di Tangerang Selatan. Spesialisasi identitas visual, produksi konten, dan media kreatif.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tangerang Selatan",
    addressCountry: "ID"
  },
  sameAs: [
    "https://github.com/thansullwekidi"
  ]
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
