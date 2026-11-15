"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useStudio } from "@/client/state/StudioProvider";
import { AuditModule } from "@/components/cms/AuditModule";
import { InboxModule } from "@/components/cms/InboxModule";
import { ProfileModule } from "@/components/cms/ProfileModule";
import { PublicationsModule } from "@/components/cms/PublicationsModule";
import { SettingsModule } from "@/components/cms/SettingsModule";
import { SkillsModule } from "@/components/cms/SkillsModule";
import { SocialModule } from "@/components/cms/SocialModule";
import { TrajectoryModule } from "@/components/cms/TrajectoryModule";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { AdminSession } from "@/contracts/auth.contract";
import { formatDateTimeId } from "@/contracts/primitives";

type ModuleKey =
  | "rekam-jejak"
  | "profil"
  | "tech-stack"
  | "publikasi"
  | "kotak-masuk"
  | "media-sosial"
  | "konfigurasi"
  | "audit";

interface ModuleDefinition {
  key: ModuleKey;
  index: string;
  label: string;
  icon: IconName;
  hash: string;
}

/**
 * Badge ringkas pada sidebar. `text` sengaja pendek agar tata letak kolom
 * tidak berubah; penjelasan lengkap dipindahkan ke `hint` sebagai tooltip.
 */
interface ModuleBadge {
  text: string;
  hint: string;
}

const MODULES: ModuleDefinition[] = [
  { key: "rekam-jejak", index: "01", label: "Pengalaman & Sertifikasi", icon: "clock", hash: "#rekam-jejak" },
  { key: "profil", index: "02", label: "Bagian Profil", icon: "user", hash: "#profil" },
  { key: "tech-stack", index: "03", label: "Media & Desain", icon: "spark", hash: "#tech-stack" },
  { key: "publikasi", index: "04", label: "Publikasi Artikel", icon: "book", hash: "#publikasi" },
  { key: "kotak-masuk", index: "05", label: "Kotak Masuk", icon: "mail", hash: "#kotak-masuk" },
  { key: "media-sosial", index: "06", label: "Media & Sosial", icon: "spark", hash: "#media-sosial" },
  { key: "konfigurasi", index: "07", label: "Konfigurasi", icon: "lock", hash: "#konfigurasi" },
  { key: "audit", index: "08", label: "Log Audit", icon: "table", hash: "#audit" }
];

const MODULE_KEYS = new Set<string>(MODULES.map((module) => module.key));

function readHash(): ModuleKey {
  const raw = window.location.hash.replace(/^#/, "").trim();
  if (raw === "jurnal") return "publikasi";
  return MODULE_KEYS.has(raw) ? (raw as ModuleKey) : "rekam-jejak";
}

export function StudioShell({ session }: { session: AdminSession }) {
  const router = useRouter();
  const { snapshot, loading, error, lastSyncedAt, refresh } = useStudio();
  const [active, setActive] = useState<ModuleKey>("rekam-jejak");
  const [signingOut, setSigningOut] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sync = () => setActive(readHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const select = (key: ModuleKey) => {
    setActive(key);
    if (window.location.hash !== `#${key}`) {
      window.history.replaceState(null, "", `#${key}`);
    }
  };

  const logout = async () => {
    setSigningOut(true);
    await apiPost<{ signedOut: boolean }>("/api/v1/auth/logout", {});
    router.refresh();
    setSigningOut(false);
  };

  const counts = snapshot?.counts;

  /**
   * Badge sidebar sengaja membedakan "jumlah wadah" dari "jumlah yang tampil
   * di situs". Tanpa ini, angka seperti 17 pada Bagian Profil terbaca seolah
   * 17 bagian siap tayang, padahal baru satu yang terisi.
   */
  const moduleBadge = useMemo<Record<ModuleKey, ModuleBadge | null>>(() => {
    if (!snapshot) {
      return {
        "rekam-jejak": null,
        profil: null,
        "tech-stack": null,
        publikasi: null,
        "kotak-masuk": null,
        "media-sosial": null,
        konfigurasi: null,
        audit: null
      };
    }

    const { counts: c, database } = snapshot;
    const filledSections = database.profileSections.filter(
      (section) => section.entries.length > 0
    ).length;
    const publishedArticles = database.articles.filter(
      (article) => article.status === "PUBLISHED"
    ).length;
    const unread = c.inquiriesUnread;

    return {
      "rekam-jejak": {
        text: String(database.experiences.length + database.certifications.length),
        hint: `${database.experiences.length} pengalaman, ${database.certifications.length} sertifikasi`
      },
      profil: {
        text: `${filledSections}/${c.profileSections}`,
        hint:
          `${filledSections} dari ${c.profileSections} bagian terisi ` +
          `(${c.profileEntries} entri). Bagian kosong tidak tampil di situs.`
      },
      "tech-stack": {
        text: String(c.skills),
        hint: `${c.skills} keahlian`
      },
      publikasi: {
        text: `${publishedArticles}/${c.articles}`,
        hint: `${publishedArticles} terbit, ${c.articles - publishedArticles} draf`
      },
      "kotak-masuk": {
        text: String(unread),
        hint: `${unread} pesan belum dibaca`
      },
      "media-sosial": {
        text: String(c.socialLinks),
        hint: `${c.socialLinks} tautan sosial, ${c.mediaAssets} aset media`
      },
      konfigurasi: null,
      audit: {
        text: String(c.auditLogs),
        hint: `${c.auditLogs} catatan audit`
      }
    };
  }, [snapshot]);

  const content = useMemo(() => {
    if (!snapshot) return null;
    const database = snapshot.database;

    switch (active) {
      case "rekam-jejak":
        return (
          <TrajectoryModule
            experiences={database.experiences}
            certifications={database.certifications}
          />
        );
      case "profil":
        return <ProfileModule sections={database.profileSections} />;
      case "tech-stack":
        return <SkillsModule skills={database.skills} />;
      case "publikasi":
        return <PublicationsModule articles={database.articles} />;
      case "kotak-masuk":
        return <InboxModule inquiries={database.inquiries} />;
      case "media-sosial":
        return (
          <SocialModule
            socialLinks={database.socialLinks}
            mediaAssets={database.mediaAssets}
          />
        );
      case "konfigurasi":
        return <SettingsModule config={database.siteConfig} />;
      case "audit":
        return <AuditModule logs={database.auditLogs} />;
    }
  }, [active, snapshot]);

  return (
    <div className="admin-shell">
      <aside className="admin-rail">
        <div className="admin-rail__head">
          <span className="eyebrow eyebrow--accent">Studio CMS / Ruang Kendali</span>
          <span className="admin-rail__title">Dossier Sulthan</span>
          <span className="admin-rail__meta">
            {session.label} · sesi s.d. {formatDateTimeId(session.expiresAt)}
          </span>
        </div>

        <nav ref={navRef} className="admin-nav" aria-label="Modul Studio">
          {MODULES.map((module) => {
            const badge = moduleBadge[module.key];
            const isAlert = module.key === "kotak-masuk" && Boolean(badge && counts?.inquiriesUnread);
            return (
              <button
                key={module.key}
                type="button"
                className="admin-nav__item"
                data-active={active === module.key}
                onClick={() => select(module.key)}
                aria-current={active === module.key ? "page" : undefined}
                title={badge?.hint}
              >
                <span className="admin-nav__index">{module.index}</span>
                <span className="admin-nav__label">
                  <Icon name={module.icon} size={11} />
                  {module.label}
                </span>
                {badge ? (
                  <span
                    className={`admin-nav__count ${isAlert ? "admin-nav__count--alert" : ""}`}
                    aria-label={badge.hint}
                  >
                    {badge.text}
                  </span>
                ) : (
                  <span />
                )}
              </button>
            );
          })}
        </nav>

        <div className="admin-rail__foot">
          <div className="admin-rail__sync">
            <span className="admin-rail__meta">
              {loading ? "MENYINKRONKAN…" : lastSyncedAt ? `SINKRON ${formatDateTimeId(lastSyncedAt)}` : "BELUM TERSINKRON"}
            </span>
            <button
              type="button"
              className="icon-btn"
              style={{ width: 26, height: 26 }}
              onClick={() => void refresh()}
              disabled={loading}
              aria-label="Sinkronkan ulang snapshot"
              title="Sinkronkan ulang"
            >
              <Icon name="refresh" size={11} />
            </button>
          </div>

          <div className="admin-rail__shortcut">
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">K</kbd>
            <span className="admin-rail__meta">palet perintah</span>
          </div>

          <div className="admin-rail__actions">
            <Link href="/" className="btn btn--sm" style={{ flex: 1, justifyContent: "center" }}>
              <Icon name="arrow-up-right" size={11} />
              Situs
            </Link>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => void logout()}
              disabled={signingOut}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Icon name="logout" size={11} />
              {signingOut ? "Keluar…" : "Keluar"}
            </button>
          </div>

          <span className="admin-rail__note mono">
            SELURUH MUTASI DICATAT PADA LOG AUDIT IMMUTABLE.
          </span>
        </div>
      </aside>

      <main className="admin-main" id="konten">
        {error && snapshot ? (
          <div className="form-status" style={{ marginBottom: 16 }} role="alert">
            <Icon name="alert" size={14} />
            <span>{error} Menampilkan snapshot terakhir yang tersedia.</span>
          </div>
        ) : null}

        {!snapshot && loading ? (
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Memuat Snapshot Studio</span>
            </div>
            <div className="admin-empty">Menyinkronkan proyek, konten, dan log audit…</div>
          </div>
        ) : null}

        {!snapshot && !loading ? (
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">Snapshot Tidak Tersedia</span>
            </div>
            <div className="panel__body stack" style={{ gap: 14 }}>
              <div className="form-status" role="alert">
                <Icon name="alert" size={14} />
                <span>{error ?? "Sesi admin tidak dapat memuat data."}</span>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                style={{ alignSelf: "flex-start" }}
                onClick={() => void refresh()}
              >
                <Icon name="refresh" size={12} />
                Coba Lagi
              </button>
            </div>
          </div>
        ) : null}

        {content}
      </main>
    </div>
  );
}
