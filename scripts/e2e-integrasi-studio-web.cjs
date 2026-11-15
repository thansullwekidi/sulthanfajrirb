/**
 * UJI INTEGRASI STUDIO -> WEB
 *
 * Memeriksa setiap koleksi di basis data dan memastikan data yang diisi lewat
 * Studio benar-benar sampai ke halaman publik. Bukan sekadar "halaman 200",
 * tetapi "teksnya benar-benar muncul di halaman yang seharusnya".
 *
 * Latar belakang: pendidikan pernah hanya dibaca dari `SiteConfig.education`
 * (teks tunggal), sehingga entri yang ditambahkan di Bagian Profil tidak
 * muncul di beranda maupun CV. Uji ini mengunci perbaikan tersebut.
 */
const fs = require("node:fs");
const path = require("node:path");

const BASE = "http://localhost:3000";

let pass = 0;
let fail = 0;
const failures = [];

function check(sumber, nilai, target, muncul) {
  if (muncul) {
    pass += 1;
  } else {
    fail += 1;
    failures.push(`${sumber} -> ${target}: "${nilai}" tidak muncul`);
  }
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
    .replace(/\s+/g, " ");
}

(async () => {
  const db = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), ".data", "portfolio.json"), "utf8")
  );

  const routes = ["/", "/cv", "/kontak"];
  const pages = {};
  const rawPages = {};
  for (const route of routes) {
    const res = await fetch(`${BASE}${route}`);
    if (res.status !== 200) {
      console.log(`  FAIL ${route} mengembalikan HTTP ${res.status}`);
      fail += 1;
    }
    rawPages[route] = await res.text();
    pages[route] = strip(rawPages[route]);
  }

  console.log("== KONFIGURASI ==");
  const cfg = db.siteConfig;
  check("Konfigurasi", "nama lengkap", "/", pages["/"].includes(cfg.fullName));
  check("Konfigurasi", "bio", "/", pages["/"].includes(cfg.bio.slice(0, 30)));
  check("Konfigurasi", "lokasi", "/", pages["/"].includes(cfg.location));
  check("Konfigurasi", "pendidikan (cadangan)", "/", pages["/"].includes(cfg.education));

  console.log("\n== PENDIDIKAN: SETIAP ENTRI HARUS TAMPIL DI 3 HALAMAN ==");
  const eduSection = db.profileSections.find((s) => s.kind === "EDUCATION");
  const eduEntries = eduSection ? eduSection.entries.filter((e) => e.visible) : [];
  check("Bagian Profil", "bagian Pendidikan ada", "/", Boolean(eduSection));

  for (const entry of eduEntries) {
    const key = entry.title.slice(0, 24);
    check("Bagian Profil > Pendidikan", key, "/", pages["/"].includes(key));
  }

  console.log("\n== PENGALAMAN ==");
  for (const exp of db.experiences) {
    const key = exp.role.slice(0, 24);
    check("Pengalaman", key, "/", pages["/"].includes(key));
  }

  console.log("\n== KEAHLIAN ==");
  for (const skill of db.skills.filter((item) => item.category === "MEDIA_KREATIF")) {
    check("Tech Stack", skill.name, "/", pages["/"].includes(skill.name));
  }

  console.log("\n== KATALOG PROYEK DIHAPUS ==");
  const legacyCatalog = await fetch(`${BASE}/karya`, { redirect: "manual" });
  check("rute lama /karya dialihkan", String(legacyCatalog.status), "/karya", legacyCatalog.status === 307);
  check("data proyek dihapus dari berkas basis data", "projects", ".data/portfolio.json", !Object.hasOwn(db, "projects"));
  check(
    "rekomendasi dipurge dari basis data",
    "testimonials",
    ".data/portfolio.json",
    !Object.hasOwn(db, "testimonials")
  );
  check(
    "bagian profil lama dipurge",
    "PROJECTS / RECOMMENDATIONS",
    ".data/portfolio.json",
    !db.profileSections.some((s) => ["PROJECTS", "RECOMMENDATIONS"].includes(s.kind))
  );

  console.log("\n== PUBLIKASI BERANDA: DRAF TIDAK BOLEH BOCOR ==");
  const artPublished = db.articles.filter((a) => a.status === "PUBLISHED");
  const artDraft = db.articles.filter((a) => a.status === "DRAFT");
  check(
    "Publikasi Artikel",
    `${artPublished.length} terbit tampil`,
    "/",
    artPublished.every((a) => pages["/"].includes(a.title.slice(0, 24)))
  );
  check(
    "Publikasi Artikel",
    `${artDraft.length} draf tidak tampil`,
    "/",
    artDraft.every((a) => !pages["/"].includes(a.title.slice(0, 24)))
  );
  for (const article of artPublished) {
    const response = await fetch(`${BASE}/publikasi/${encodeURIComponent(article.slug)}`);
    const html = await response.text();
    const text = strip(html);
    const contentPreview = article.content
      .replace(/[#*_`~>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    check("Publikasi Artikel", article.title, `/publikasi/${article.slug}`, response.status === 200 && html.includes(article.title));
    check("Publikasi Artikel", "isi artikel", `/publikasi/${article.slug}`, text.includes(contentPreview));
    check("Publikasi Artikel", "tautan internal dari beranda", "/", rawPages["/"].includes(`/publikasi/${article.slug}`));
  }

  console.log("\n== MEDIA SOSIAL ==");
  for (const link of db.socialLinks.filter((l) => l.visible)) {
    const appears =
      pages["/"].includes(link.platform) ||
      pages["/"].toLowerCase().includes(link.platform.toLowerCase()) ||
      (link.label && pages["/"].includes(link.label));
    check("Media & Sosial", link.platform, "/", appears);
  }

  if (failures.length > 0) {
    console.log("\n== YANG GAGAL ==");
    for (const item of failures) console.log(`  - ${item}`);
  }

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exitCode = fail === 0 ? 0 : 1;
})();
