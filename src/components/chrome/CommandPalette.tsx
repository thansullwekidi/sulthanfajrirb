"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface PaletteItem {
  id: string;
  label: string;
  group: "Navigasi" | "Studio CMS" | "Tindakan";
  hint?: string;
  keywords?: string;
  href?: string;
  action?: () => void;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { id: "nav-ringkasan", label: "Ringkasan Eksekutif", group: "Navigasi", hint: "01", href: "/", keywords: "beranda home kpi" },
  { id: "nav-katalog", label: "Katalog Karya", group: "Navigasi", hint: "02", href: "/karya", keywords: "proyek projek portofolio" },
  { id: "nav-rekam", label: "Rekam Jejak & Keahlian", group: "Navigasi", hint: "03", href: "/rekam-jejak", keywords: "sertifikasi stack pengalaman pendidikan bahasa" },
  { id: "nav-jurnal", label: "Catatan Lab", group: "Navigasi", hint: "04", href: "/catatan-lab", keywords: "artikel jurnal tulisan" },
  { id: "nav-cv", label: "CV ATS 1 Halaman", group: "Navigasi", hint: "05", href: "/cv", keywords: "resume cetak pdf" },
  { id: "nav-kontak", label: "Kontak & Diskusi", group: "Navigasi", hint: "06", href: "/kontak", keywords: "email pesan formulir" },
  { id: "cms-proyek", label: "Manajer Proyek", group: "Studio CMS", hint: "01", href: "/admin#proyek", keywords: "crud edit split editor" },
  { id: "cms-sampah", label: "Tempat Sampah", group: "Studio CMS", hint: "02", href: "/admin#sampah", keywords: "trash arsip purge" },
  { id: "cms-rekam", label: "Rekam Jejak & Sertifikasi", group: "Studio CMS", hint: "03", href: "/admin#rekam-jejak", keywords: "pengalaman sertifikat" },
  { id: "cms-profil", label: "Bagian Profil LinkedIn", group: "Studio CMS", hint: "04", href: "/admin#profil", keywords: "pendidikan bahasa organisasi penghargaan publikasi paten relawan sorotan minat" },
  { id: "cms-stack", label: "Tech Stack", group: "Studio CMS", hint: "05", href: "/admin#tech-stack", keywords: "keahlian skill endorsements" },
  { id: "cms-jurnal", label: "Jurnal Lab", group: "Studio CMS", hint: "06", href: "/admin#jurnal", keywords: "artikel tulis" },
  { id: "cms-testimoni", label: "Rekomendasi", group: "Studio CMS", hint: "07", href: "/admin#rekomendasi", keywords: "testimoni endorsements" },
  { id: "cms-inbox", label: "Kotak Masuk", group: "Studio CMS", hint: "08", href: "/admin#kotak-masuk", keywords: "pesan inbox unread" },
  { id: "cms-media", label: "Media & Media Sosial", group: "Studio CMS", hint: "10", href: "/admin#media-sosial", keywords: "instagram linkedin behance unggah gambar pustaka foto logo" },
  { id: "cms-config", label: "Konfigurasi & Basis Data", group: "Studio CMS", hint: "11", href: "/admin#konfigurasi", keywords: "backup json import export reset identitas" },
  { id: "cms-audit", label: "Log Audit Sistem", group: "Studio CMS", hint: "12", href: "/admin#audit", keywords: "riwayat mutasi" }
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("dossier-theme", next);
    } catch {
      // Diabaikan: tema tetap berlaku pada sesi ini.
    }
  }, []);

  const items = useMemo<PaletteItem[]>(
    () => [
      ...PALETTE_ITEMS,
      {
        id: "act-theme",
        label: "Ganti Mode Warna",
        group: "Tindakan",
        hint: "Tema",
        keywords: "dark light gelap terang",
        action: toggleTheme
      },
      {
        id: "act-cv-print",
        label: "Buka CV & Cetak PDF",
        group: "Tindakan",
        hint: "Cetak",
        keywords: "print resume",
        href: "/cv"
      }
    ],
    [toggleTheme]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase().includes(term)
    );
  }, [items, query]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("dossier:palette", handleOpen);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("dossier:palette", handleOpen);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const node = document.getElementById(`palette-item-${activeIndex}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (item: PaletteItem | undefined) => {
    if (!item) return;
    close();
    if (item.href) {
      const [path, hash] = item.href.split("#");
      if (
        hash &&
        path === "/admin" &&
        window.location.pathname === "/admin"
      ) {
        // router.push memakai pushState sehingga tidak memicu hashchange.
        window.location.hash = hash;
        return;
      }
      router.push(item.href);
    }
    item.action?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (filtered.length === 0 ? 0 : (current + 1) % filtered.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : (current - 1 + filtered.length) % filtered.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  if (!open) return null;

  const groups: PaletteItem["group"][] = ["Navigasi", "Studio CMS", "Tindakan"];

  return (
    <div
      className="palette-backdrop command-palette-root"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Palet perintah"
        onKeyDown={handleKeyDown}
      >
        <div className="palette__input">
          <Icon name="search" size={15} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari halaman, modul Studio, atau tindakan…"
            aria-label="Cari perintah"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        <div className="palette__list" role="listbox" aria-label="Hasil perintah">
          {filtered.length === 0 ? (
            <div className="palette__empty">
              Tidak ada hasil untuk “{query}”. Coba kata kunci lain seperti “proyek” atau “backup”.
            </div>
          ) : (
            groups.map((group) => {
              const groupItems = filtered.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;
              return (
                <div key={group}>
                  <div className="palette__group">{group}</div>
                  {groupItems.map((item) => {
                    const index = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        id={`palette-item-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        className="palette__item"
                        data-active={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(item)}
                      >
                        <span className="palette__item-key">{item.hint ?? "→"}</span>
                        <span className="palette__item-label">{item.label}</span>
                        <span className="palette__item-hint">
                          {item.group === "Navigasi" ? "Buka" : item.action ? "Jalankan" : "Masuk"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="palette__foot">
          <span>↑ ↓ navigasi · ↵ pilih · esc tutup</span>
          <span>Studio CMS · {items.length} perintah</span>
        </div>
      </div>
    </div>
  );
}
