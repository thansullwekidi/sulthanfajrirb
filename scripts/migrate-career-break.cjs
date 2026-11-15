/**
 * Migrasi idempoten: menambahkan bagian profil "Jeda Karier" (Career Break),
 * satu-satunya bagian dari daftar resmi "Add profile section" LinkedIn yang
 * belum ada di proyek ini.
 *
 * Daftar resmi LinkedIn — Core: About, Education, Position, Services,
 * Career break, Skills. Recommended: Featured, Licenses & certifications,
 * Projects, Courses, Recommendations. Additional: Volunteer experience,
 * Publications, Patents, Honors & awards, Test scores, Languages,
 * Organizations, Causes.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-career-break-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

const now = new Date().toISOString();

const kinds = new Set((db.profileSections ?? []).map((section) => section.kind));
let added = false;

if (!kinds.has("CAREER_BREAK")) {
  const maxOrder = (db.profileSections ?? []).reduce(
    (max, section) => Math.max(max, Number(section.sortOrder) || 0),
    0
  );
  db.profileSections.push({
    id: "prf_jeda-karier",
    slug: "jeda-karier",
    title: "Jeda Karier",
    subtitle: "Waktu di luar jalur karier linear",
    kind: "CAREER_BREAK",
    visible: true,
    sortOrder: maxOrder + 1,
    entries: [],
    createdAt: now,
    updatedAt: now
  });
  added = true;
}

// Rapikan urutan agar tidak berlubang atau ganda.
[...db.profileSections]
  .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
  .forEach((section, index) => {
    section.sortOrder = index + 1;
  });

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan      :", path.basename(backup));
console.log("bagian profil :", db.profileSections.length, added ? "(+1 Jeda Karier)" : "(tidak berubah)");
