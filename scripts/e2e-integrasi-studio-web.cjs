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

  const routes = ["/", "/karya", "/rekam-jejak", "/catatan-lab", "/cv", "/kontak"];
  const pages = {};
  for (const route of routes) {
    const res = await fetch(`${BASE}${route}`);
    if (res.status !== 200) {
      console.log(`  FAIL ${route} mengembalikan HTTP ${res.status}`);
      fail += 1;
    }
    pages[route] = strip(await res.text());
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
  check("Bagian Profil", "bagian Pendidikan ada", "/rekam-jejak", Boolean(eduSection));

  for (const entry of eduEntries) {
    const key = entry.title.slice(0, 24);
    check("Bagian Profil > Pendidikan", key, "/", pages["/"].includes(key));
    check("Bagian Profil > Pendidikan", key, "/rekam-jejak", pages["/rekam-jejak"].includes(key));
    check("Bagian Profil > Pendidikan", key, "/cv", pages["/cv"].includes(key));
  }

  console.log("\n== PENGALAMAN ==");
  for (const exp of db.experiences) {
    const key = exp.role.slice(0, 24);
    check("Rekam Jejak > Pengalaman", key, "/rekam-jejak", pages["/rekam-jejak"].includes(key));
    check("Rekam Jejak > Pengalaman", key, "/cv", pages["/cv"].includes(key));
  }

  console.log("\n== KEAHLIAN ==");
  for (const skill of db.skills.slice(0, 3)) {
    check("Tech Stack", skill.name, "/", pages["/"].includes(skill.name));
    check("Tech Stack", skill.name, "/rekam-jejak", pages["/rekam-jejak"].includes(skill.name));
  }

  console.log("\n== PROYEK: ARSIP TIDAK BOLEH BOCOR ==");
  const archived = db.projects.filter((p) => p.status === "ARCHIVED");
  const published = db.projects.filter((p) => p.status === "PUBLISHED");
  check(
    "Manajer Proyek",
    `${published.length} terbit tampil`,
    "/karya",
    published.every((p) => pages["/karya"].includes(p.title.slice(0, 24)))
  );
  check(
    "Manajer Proyek",
    `${archived.length} arsip tidak tampil`,
    "/karya",
    archived.every((p) => !pages["/karya"].includes(p.title.slice(0, 24)))
  );

  console.log("\n== ARTIKEL: DRAF TIDAK BOLEH BOCOR ==");
  const artPublished = db.articles.filter((a) => a.status === "PUBLISHED");
  const artDraft = db.articles.filter((a) => a.status === "DRAFT");
  check(
    "Jurnal Lab",
    `${artPublished.length} terbit tampil`,
    "/catatan-lab",
    artPublished.every((a) => pages["/catatan-lab"].includes(a.title.slice(0, 24)))
  );
  check(
    "Jurnal Lab",
    `${artDraft.length} draf tidak tampil`,
    "/catatan-lab",
    artDraft.every((a) => !pages["/catatan-lab"].includes(a.title.slice(0, 24)))
  );

  console.log("\n== BAGIAN PROFIL LAIN ==");
  for (const section of db.profileSections) {
    if (section.kind === "EDUCATION") continue;
    const visible = section.entries.filter((e) => e.visible);
    if (!visible.length) continue;
    for (const entry of visible.slice(0, 1)) {
      check(
        `Bagian Profil > ${section.kind}`,
        entry.title.slice(0, 24),
        "/rekam-jejak",
        pages["/rekam-jejak"].includes(entry.title.slice(0, 24))
      );
    }
  }

  console.log("\n== MEDIA SOSIAL ==");
  for (const link of db.socialLinks.filter((l) => l.visible)) {
    check("Media & Sosial", link.platform, "/", pages["/"].includes(link.platform));
  }

  if (failures.length > 0) {
    console.log("\n== YANG GAGAL ==");
    for (const item of failures) console.log(`  - ${item}`);
  }

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
