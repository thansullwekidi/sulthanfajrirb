"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiPost } from "@/client/state/api-client";
import { useStudio } from "@/client/state/StudioProvider";
import { AuditModule } from "@/components/cms/AuditModule";
import { InboxModule } from "@/components/cms/InboxModule";
import { JournalModule } from "@/components/cms/JournalModule";
import { ProfileModule } from "@/components/cms/ProfileModule";
import { ProjectsModule } from "@/components/cms/ProjectsModule";
import { SettingsModule } from "@/components/cms/SettingsModule";
import { SkillsModule } from "@/components/cms/SkillsModule";
import { SocialModule } from "@/components/cms/SocialModule";
import { TestimonialsModule } from "@/components/cms/TestimonialsModule";
import { TrajectoryModule } from "@/components/cms/TrajectoryModule";
import { TrashModule } from "@/components/cms/TrashModule";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { AdminSession } from "@/contracts/auth.contract";
import { formatDateTimeId } from "@/contracts/primitives";

type ModuleKey =
  | "proyek"
  | "sampah"
  | "rekam-jejak"
  | "profil"
  | "tech-stack"
  | "jurnal"
  | "rekomendasi"
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
  { key: "proyek", index: "01", label: "Manajer Proyek", icon: "grid", hash: "#proyek" },
  { key: "sampah", index: "02", label: "Tempat Sampah", icon: "archive", hash: "#sampah" },
  { key: "rekam-jejak", index: "03", label: "Rekam Jejak", icon: "clock", hash: "#rekam-jejak" },
  { key: "profil", index: "04", label: "Bagian Profil", icon: "user", hash: "#profil" },
  { key: "tech-stack", index: "05", label: "Tech Stack", icon: "code", hash: "#tech-stack" },
  { key: "jurnal", index: "06", label: "Jurnal Lab", icon: "book", hash: "#jurnal" },
  { key: "rekomendasi", index: "07", label: "Rekomendasi", icon: "star", hash: "#rekomendasi" },
  { key: "kotak-masuk", index: "08", label: "Kotak Masuk", icon: "mail", hash: "#kotak-masuk" },
  { key: "media-sosial", index: "10", label: "Media & Sosial", icon: "spark", hash: "#media-sosial" },
  { key: "konfigurasi", index: "11", label: "Konfigurasi", icon: "lock", hash: "#konfigurasi" },
  { key: "audit", index: "12", label: "Log Audit", icon: "table", hash: "#audit" }
];

const MODULE_KEYS = new Set<string>(MODULES.map((module) => module.key));

function readHash(): ModuleKey {
  const raw = window.location.hash.replace(/^#/, "").trim();
  const alias = raw === "testimoni" ? "rekomendasi" : raw;
  return MODULE_KEYS.has(alias) ? (alias as ModuleKey) : "proyek";
}

export function StudioShell({ session }: { session: AdminSession }) {
  const router = useRouter();
  const { snapshot, loading, error, lastSyncedAt, refresh } = useStudio();
  const [active, setActive] = useState<ModuleKey>("proyek");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const sync = () => setActive(readHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

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
        proyek: null,
        sampah: null,
        "rekam-jejak": null,
        profil: null,
        "tech-stack": null,
        jurnal: null,
        rekomendasi: null,
        "kotak-masuk": null,
        "media-sosial": null,
        konfigurasi: null,
        audit: null
      };
    }

    const { counts: c, database } = snapshot;
    const activeProjects = c.projectsPublished + c.projectsDraft;
    const filledSections = database.profileSections.filter(
      (section) => section.entries.length > 0
    ).length;
    const publishedArticles = database.articles.filter(
      (article) => article.status === "PUBLISHED"
    ).length;
    const unread = c.inquiriesUnread;

    return {
      proyek: {
        text: String(activeProjects),
        hint:
          `${c.projectsPublished} terbit, ${c.projectsDraft} draf, ` +
          `${c.projectsArchived} di tempat sampah`
      },
      sampah: {
        text: String(c.projectsArchived),
        hint: `${c.projectsArchived} proyek menunggu hapus permanen`
      },
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
      jurnal: {
        text: `${publishedArticles}/${c.articles}`,
        hint: `${publishedArticles} terbit, ${c.articles - publishedArticles} draf`
      },
      rekomendasi: {
        text: String(database.testimonials.length),
        hint: `${database.testimonials.length} rekomendasi`
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
      case "proyek":
        return <ProjectsModule projects={database.projects} />;
      case "sampah":
        return <TrashModule projects={database.projects} />;
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
      case "jurnal":
        return <JournalModule articles={database.articles} />;
      case "rekomendasi":
        return <TestimonialsModule testimonials={database.testimonials} />;
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

        <nav className="admin-nav" aria-label="Modul Studio">
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
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--muted)" }}>
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">K</kbd>
            <span className="admin-rail__meta">palet perintah</span>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
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

          <span className="mono" style={{ fontSize: 8, color: "var(--muted)", lineHeight: 1.6 }}>
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
