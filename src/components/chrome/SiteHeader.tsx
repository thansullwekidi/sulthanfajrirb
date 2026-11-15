"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { index: "01", label: "Ringkasan", href: "/" },
  { index: "02", label: "Katalog Karya", href: "/karya" },
  { index: "03", label: "Rekam Jejak", href: "/rekam-jejak" },
  { index: "04", label: "Catatan Lab", href: "/catatan-lab" },
  { index: "05", label: "CV ATS", href: "/cv" },
  { index: "06", label: "Kontak", href: "/kontak" }
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent;
    if (/Mac|iPhone|iPad/.test(platform)) setShortcut("⌘ K");
  }, []);

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent("dossier:palette"));
  };

  return (
    <header className="site-header">
      <div className="shell">
        <div className="site-header__inner">
          <Link href="/" className="brand" aria-label="Beranda — Muhammad Sulthan Fajri Rabbani">
            <span className="brand__mark" aria-hidden="true">
              MS
            </span>
            <span className="brand__text">
              <span className="brand__name">Sulthan Fajri Rabbani</span>
              <span className="brand__sub">Design Dossier · 2026</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Navigasi utama">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="site-nav__link"
                data-active={isActive(pathname, item.href)}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                <span className="site-nav__index">{item.index}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-tools">
            <button
              type="button"
              className="palette-trigger"
              onClick={openPalette}
              aria-label="Buka palet perintah"
            >
              <Icon name="search" size={13} />
              <span className="label">Cari</span>
              <kbd className="kbd">{shortcut}</kbd>
            </button>
            <ThemeToggle />
            <Link href="/admin" className="studio-link">
              <span className="dot dot--pulse" aria-hidden="true" />
              <span className="label">Studio</span>
            </Link>
          </div>
        </div>

        <nav className="mobile-nav" aria-label="Navigasi utama seluler">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav__link"
              data-active={isActive(pathname, item.href)}
            >
              {item.index} / {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
