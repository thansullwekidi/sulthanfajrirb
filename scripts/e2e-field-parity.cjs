/**
 * AUDIT FINAL: setiap field konten yang relevan tampil di halaman publik.
 * CV ditampilkan sebagai PDF unggahan terpisah, bukan hasil gabungan field profil.
 */
const fs = require("node:fs");
const path = require("node:path");

const BASE = "http://localhost:3000";
const EXPERIENCE_LABELS = { AKADEMIK: "Akademik", PROYEK: "Proyek", KARIER: "Karier" };
const EMPLOYMENT_LABELS = {
  FULL_TIME: "Penuh Waktu",
  PART_TIME: "Paruh Waktu",
  SELF_EMPLOYED: "Wiraswasta",
  FREELANCE: "Lepas",
  CONTRACT: "Kontrak",
  INTERNSHIP: "Magang",
  APPRENTICESHIP: "Pemagangan",
  SEASONAL: "Musiman",
  VOLUNTEER: "Relawan"
};
const WORK_MODE_LABELS = { ON_SITE: "Di Kantor", HYBRID: "Hibrida", REMOTE: "Jarak Jauh" };

function inHtml(html, text) {
  if (!text || !text.toString().trim()) return true;
  const t = text.toString();
  if (html.includes(t)) return true;
  if (html.includes(JSON.stringify(t).slice(1, -1))) return true;
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  if (html.includes(esc)) return true;
  const frags = t.split(/[\n\r]+/).map(s => s.trim()).filter(s => s.length >= 8);
  for (const f of frags.slice(0, 5)) {
    if (html.includes(f)) return true;
    if (html.includes(JSON.stringify(f).slice(1, -1))) return true;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta"
      }).format(d);
      if (html.includes(formatted)) return true;
    }
  }
  return false;
}

(async () => {
  const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".data", "portfolio.json"), "utf8"));
  const pages = {};
  for (const r of ["/", "/rekam-jejak", "/catatan-lab", "/cv", "/kontak"]) {
    pages[r] = await fetch(`${BASE}${r}`).then(res => res.text());
  }

  let ok = 0, bug = 0;
  const bugs = [];

  function check(label, html, val) {
    if (inHtml(html, val)) { ok++; }
    else { bug++; bugs.push(`${label}: "${String(val).slice(0,50)}"`); }
  }

  function checkResult(label, passed, detail) {
    if (passed) { ok++; }
    else { bug++; bugs.push(`${label}: "${detail}"`); }
  }

  // KATALOG PROYEK SUDAH DIHAPUS
  const catalogResponse = await fetch(`${BASE}/karya`, { redirect: "manual" });
  checkResult("rute katalog lama dialihkan", catalogResponse.status === 307, "/karya");
  checkResult("data proyek dihapus dari basis data", !Object.hasOwn(db, "projects"), "projects");

  // PENGALAMAN
  for (const e of db.experiences) {
    for (const f of ["role","organization","startDate","endDate","location","description"]) {
      if (e[f] && e[f].toString().trim()) {
        check(`pengalaman ${e.role}.${f} di /`, pages["/"], e[f]);
      }
    }
    if (e.logoUrl) check(`pengalaman ${e.role}.logoUrl di /`, pages["/"], e.logoUrl);
    if (e.organizationUrl) check(`pengalaman ${e.role}.organizationUrl di /`, pages["/"], e.organizationUrl);
    check(`pengalaman ${e.role}.type di /`, pages["/"], EXPERIENCE_LABELS[e.type]);
    check(`pengalaman ${e.role}.employmentType di /`, pages["/"], EMPLOYMENT_LABELS[e.employmentType]);
    check(`pengalaman ${e.role}.workMode di /`, pages["/"], WORK_MODE_LABELS[e.workMode]);
    if (!e.startDate && !e.endDate && e.period) {
      check(`pengalaman ${e.role}.period di /`, pages["/"], e.period);
    }
    e.highlights.forEach((hl) => check(`pengalaman ${e.role}.highlight di /`, pages["/"], hl));
    e.skills.forEach((skill) => check(`pengalaman ${e.role}.skill di /`, pages["/"], skill));
  }

  // BAGIAN PROFIL
  for (const section of db.profileSections.filter(
    (item) => item.visible && item.entries.some((entry) => entry.visible)
  )) {
    check(`bagian profil ${section.title}`, pages["/"], section.title);
    for (const entry of section.entries.filter((item) => item.visible)) {
      check(`entri profil ${section.title}.${entry.title}`, pages["/"], entry.title);
      for (const f of [
        "subtitle",
        "meta",
        "location",
        "startDate",
        "endDate",
        "description",
        "fieldOfStudy",
        "notes",
        "url",
        "imageUrl",
        "logoUrl",
        "authors",
        "publisher"
      ]) {
        if (entry[f]) check(`profil ${section.title}.${entry.title}.${f}`, pages["/"], entry[f]);
      }
      entry.tags.forEach((tag) => check(`profil ${section.title}.${entry.title}.tag`, pages["/"], tag));
      if (entry.isCurrent) check(`profil ${section.title}.${entry.title}.isCurrent`, pages["/"], "Berlangsung");
    }
  }

  // SERTIFIKASI
  for (const c of db.certifications) {
    for (const f of ["title", "issuer", "issueDate", "expiryDate", "credentialId"]) {
      if (c[f] && c[f].toString().trim()) check(`sertifikasi ${c.title.slice(0,15)}.${f} di /`, pages["/"], c[f]);
    }
    for (const f of ["imageUrl", "issuerLogoUrl"]) {
      if (c[f]) check(`sertifikasi ${c.title.slice(0,15)}.${f} di /`, pages["/"], c[f]);
    }
    c.skills.forEach((skill) => check(`sertifikasi ${c.title.slice(0,15)}.skill di /`, pages["/"], skill));
  }

  // SKILL
  for (const s of db.skills.filter((skill) => skill.category === "MEDIA_KREATIF")) {
    if (s.name && s.name.trim()) {
      check(`skill ${s.name}.name di /`, pages["/"], s.name);
      check(`skill ${s.name}.context di /`, pages["/"], s.context);
      check(`skill ${s.name}.level di /`, pages["/"], String(s.level));
      if (s.endorsements > 0) {
        check(`skill ${s.name}.endorsements di /`, pages["/"], `${s.endorsements} dukungan`);
      }
    }
  }

  // ARTIKEL
  for (const a of db.articles.filter(a => a.status === "PUBLISHED")) {
    for (const f of ["title","summary","category","externalUrl"]) {
      if (a[f] && a[f].toString().trim()) check(`artikel ${a.slug}.${f}`, pages["/"], a[f]);
    }
    if (a.readTime) check(`artikel ${a.slug}.readTime`, pages["/"], String(a.readTime));
  }

  // KONFIGURASI
  const cfg = db.siteConfig;
  for (const f of [
    "fullName",
    "headline",
    "bio",
    "location",
    "address",
    "email",
    "phone",
    "website",
    "github",
    "linkedin",
    "education",
    "pronouns",
    "coverImageUrl"
  ]) {
    if (cfg[f] && cfg[f].toString().trim()) {
      const inAny = Object.values(pages).some(h => inHtml(h, cfg[f]));
      if (inAny) ok++; else { bug++; bugs.push(`konfigurasi ${f}: "${cfg[f]}"`); }
    }
    if (cfg.resumeUrl) check("CV PDF terunggah di /cv", pages["/cv"], cfg.resumeUrl);
    else check("keadaan CV belum diunggah di /cv", pages["/cv"], "CV belum diunggah");
  }

  console.log(`HASIL: ${ok} field terisi dan tampil, ${bug} bug`);
  if (bug > 0) {
    console.log("\n=== BUG ===");
    bugs.forEach(b => console.log(`  ! ${b}`));
  } else {
    console.log("\nNOL BUG — semua field yang terisi di CMS tampil di web.");
  }
  process.exitCode = bug === 0 ? 0 : 1;
})();
