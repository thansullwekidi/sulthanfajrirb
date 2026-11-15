/**
 * UJI INTEGRASI MENYELURUH: setiap field CMS vs setiap halaman publik.
 *
 * Memeriksa dua hal:
 * 1. Konten yang terlihat user (strip HTML) — tidak ada undefined/NaN.
 * 2. Data field di RSC payload (dengan JSON escaping) — data dikirim ke browser.
 *
 * Catatan: field yang dirender di dalam modal (challenge, solution, caseStudy,
 * content artikel) tidak muncul di teks yang terlihat saat halaman dimuat,
 * tapi ADA di RSC payload dan akan dirender saat user mengklik baris.
 */
const fs = require("node:fs");
const path = require("node:path");

const BASE = "http://localhost:3000";

let pass = 0, fail = 0;
const issues = [];

function check(cat, name, ok, detail) {
  if (ok) { pass += 1; }
  else { fail += 1; issues.push(`[${cat}] ${name}${detail ? ` — ${detail}` : ""}`); }
  console.log(`  ${ok ? "OK  " : "FAIL"} ${name}${ok ? "" : (detail ? ` — ${detail}` : "")}`);
}

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ");
}

// Cari teks di HTML mentah, dengan toleransi JSON escaping & HTML entity
function textInHtml(html, text) {
  if (!text) return true;
  // Versi mentah
  if (html.includes(text)) return true;
  // Versi JSON-escaped (\n -> \\n, " -> \", \\ -> \\\\)
  const jsonEsc = JSON.stringify(text).slice(1, -1);
  if (html.includes(jsonEsc)) return true;
  // Versi HTML entity encoded (&lt; &gt; &amp; &#x2F;)
  const htmlEsc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  if (html.includes(htmlEsc)) return true;
  // Potongan pendek — untuk field panjang, cari beberapa fragmen
  // yang tidak mengandung newline atau karakter khusus
  if (text.length > 20) {
    // Pecah teks menjadi fragmen berdasarkan whitespace/newline,
    // ambil fragmen terpanjang yang bersih (tidak ada \n " < > &)
    const fragments = text.split(/[\n\r]+/).map((s) => s.trim()).filter((s) => s.length >= 8);
    for (const frag of fragments.slice(0, 5)) {
      if (html.includes(frag)) return true;
      if (html.includes(JSON.stringify(frag).slice(1, -1))) return true;
    }
  }
  return false;
}

(async () => {
  const db = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), ".data", "portfolio.json"), "utf8")
  );

  const routes = ["/", "/karya", "/rekam-jejak", "/catatan-lab", "/cv", "/kontak"];
  const raw = {};
  const stripped = {};
  for (const route of routes) {
    const res = await fetch(`${BASE}${route}`);
    const html = await res.text();
    raw[route] = html;
    stripped[route] = strip(html);
  }

  // === KEBERSIHAN KONTEN ===
  console.log("== KEBERSIHAN KONTEN ==");
  for (const route of routes) {
    const t = stripped[route].toLowerCase();
    check("00", `${route} tidak ada "undefined"`, !t.includes("undefined"));
    check("00", `${route} tidak ada "NaN"`, !stripped[route].includes("NaN"));
    check("00", `${route} tidak ada "[object Object]"`, !t.includes("[object object]"));
  }

  // === MODUL 01: PROYEK ===
  console.log("\n== MODUL 01: MANAJER PROYEK ==");
  for (const p of db.projects.filter((p) => p.status === "PUBLISHED")) {
    const h = raw["/karya"];
    check("01", `proyek "${p.slug}" title`, textInHtml(h, p.title));
    check("01", `proyek "${p.slug}" subtitle`, textInHtml(h, p.subtitle));
    check("01", `proyek "${p.slug}" challenge`, textInHtml(h, p.challenge));
    check("01", `proyek "${p.slug}" solution`, textInHtml(h, p.solution));
    check("01", `proyek "${p.slug}" caseStudy`, textInHtml(h, p.caseStudy));
    check("01", `proyek "${p.slug}" metricLabel`, textInHtml(h, p.metricLabel));
    check("01", `proyek "${p.slug}" metricValue`, textInHtml(h, p.metricValue));
    if (p.links?.github) check("01", `proyek "${p.slug}" links.github`, textInHtml(h, p.links.github));
    if (p.links?.live) check("01", `proyek "${p.slug}" links.live`, textInHtml(h, p.links.live));
    if (p.links?.notebook) check("01", `proyek "${p.slug}" links.notebook`, textInHtml(h, p.links.notebook));
    for (const tech of p.techStack) {
      check("01", `proyek "${p.slug}" tech "${tech}"`, textInHtml(h, tech));
    }
    if (p.isFeatured) {
      check("01", `UNGGULAN "${p.slug}" di /`, textInHtml(raw["/"], p.title));
    }
  }
  for (const p of db.projects.filter((p) => p.status !== "PUBLISHED")) {
    check("01", `proyek ${p.status} "${p.slug}" TIDAK bocor`, !textInHtml(raw["/karya"], p.title));
  }

  // === MODUL 03: PENGALAMAN ===
  console.log("\n== MODUL 03: PENGALAMAN ==");
  for (const exp of db.experiences) {
    check("03", `pengalaman "${exp.role}" di /rekam-jejak`, textInHtml(raw["/rekam-jejak"], exp.role));
    check("03", `pengalaman "${exp.role}" di /cv`, textInHtml(raw["/cv"], exp.role));
  }

  // === MODUL 03: SERTIFIKASI ===
  console.log("\n== MODUL 03: SERTIFIKASI ==");
  for (const cert of db.certifications) {
    check("03", `sertifikasi "${cert.title.slice(0,25)}" di /rekam-jejak`, textInHtml(raw["/rekam-jejak"], cert.title));
    check("03", `sertifikasi issuer "${cert.issuer}" di /rekam-jejak`, textInHtml(raw["/rekam-jejak"], cert.issuer));
  }

  // === MODUL 04: BAGIAN PROFIL ===
  console.log("\n== MODUL 04: BAGIAN PROFIL ==");
  for (const section of db.profileSections) {
    for (const entry of section.entries.filter((e) => e.visible)) {
      check("04", `entri [${section.kind}] "${entry.title.slice(0,20)}" di /rekam-jejak`, textInHtml(raw["/rekam-jejak"], entry.title));
      if (section.kind === "EDUCATION") {
        check("04", `pendidikan "${entry.title.slice(0,20)}" di /`, textInHtml(raw["/"], entry.title));
        check("04", `pendidikan "${entry.title.slice(0,20)}" di /cv`, textInHtml(raw["/cv"], entry.title));
      }
    }
  }

  // === MODUL 05: TECH STACK ===
  console.log("\n== MODUL 05: TECH STACK ==");
  for (const skill of db.skills) {
    check("05", `keahlian "${skill.name}" di /`, textInHtml(raw["/"], skill.name));
    check("05", `keahlian "${skill.name}" di /rekam-jejak`, textInHtml(raw["/rekam-jejak"], skill.name));
    check("05", `keahlian "${skill.name}" di /cv`, textInHtml(raw["/cv"], skill.name));
  }

  // === MODUL 06: JURNAL LAB ===
  console.log("\n== MODUL 06: JURNAL LAB ==");
  for (const a of db.articles.filter((a) => a.status === "PUBLISHED")) {
    const h = raw["/catatan-lab"];
    check("06", `artikel "${a.slug}" title`, textInHtml(h, a.title));
    check("06", `artikel "${a.slug}" summary`, textInHtml(h, a.summary));
    check("06", `artikel "${a.slug}" content`, textInHtml(h, a.content));
    check("06", `artikel "${a.slug}" category`, textInHtml(h, a.category));
    check("06", `artikel "${a.slug}" readTime`, textInHtml(h, String(a.readTime)));
  }
  for (const a of db.articles.filter((a) => a.status !== "PUBLISHED")) {
    check("06", `artikel ${a.status} "${a.slug}" TIDAK bocor`, !textInHtml(raw["/catatan-lab"], a.title));
  }

  // === MODUL 07: REKOMENDASI ===
  console.log("\n== MODUL 07: REKOMENDASI ==");
  for (const t of db.testimonials) {
    check("07", `testimoni "${t.author}" di /`, textInHtml(raw["/"], t.author));
    if (t.quote) check("07", `testimoni quote "${t.author}" di /`, textInHtml(raw["/"], t.quote));
    if (t.role) check("07", `testimoni role "${t.author}" di /`, textInHtml(raw["/"], t.role));
  }

  // === MODUL 11: KONFIGURASI ===
  console.log("\n== MODUL 11: KONFIGURASI ==");
  const cfg = db.siteConfig;
  for (const route of routes) {
    check("11", `nama di ${route}`, textInHtml(raw[route], cfg.fullName));
  }
  check("11", "headline di /", textInHtml(raw["/"], cfg.headline));
  check("11", "bio di /", textInHtml(raw["/"], cfg.bio.slice(0, 30)));
  check("11", "lokasi di /", textInHtml(raw["/"], cfg.location));
  check("11", "email di /kontak", textInHtml(raw["/kontak"], cfg.email));
  if (cfg.linkedin) check("11", "LinkedIn di / atau /kontak", textInHtml(raw["/"], "linkedin") || textInHtml(raw["/kontak"], "linkedin"));

  // === RINGKASAN ===
  console.log(`\n${"=".repeat(60)}`);
  console.log(`HASIL: ${pass} lolos, ${fail} gagal`);
  console.log(`${"=".repeat(60)}`);
  if (issues.length > 0) {
    console.log("\n=== MASALAH DITEMUKAN ===");
    for (const i of issues) console.log(`  ! ${i}`);
  }
  process.exit(fail === 0 ? 0 : 1);
})();
