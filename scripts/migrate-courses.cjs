/**
 * Migrasi idempoten: menambahkan bagian "Mata Kuliah" (Courses) yang ada di
 * daftar resmi LinkedIn tetapi belum pernah dibuat di basis data, lalu
 * menyeragamkan urutan bagian dengan daftar resmi.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-courses-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

const now = new Date().toISOString();

const ORDER = [
  "EDUCATION",
  "COURSES",
  "LANGUAGES",
  "ORGANIZATIONS",
  "HONORS",
  "PUBLICATIONS",
  "PATENTS",
  "TEST_SCORES",
  "VOLUNTEER",
  "PROJECTS",
  "CAREER_BREAK",
  "CAUSES",
  "FEATURED",
  "ACTIVITY",
  "INTERESTS",
  "SERVICES",
  "RECOMMENDATIONS",
  "CUSTOM"
];

const kinds = new Set(db.profileSections.map((section) => section.kind));
let added = false;

if (!kinds.has("COURSES")) {
  db.profileSections.push({
    id: "prf_mata-kuliah",
    slug: "mata-kuliah",
    title: "Mata Kuliah",
    subtitle: "Rangkaian studi yang ditempuh",
    kind: "COURSES",
    visible: true,
    sortOrder: 0,
    entries: [],
    createdAt: now,
    updatedAt: now
  });
  added = true;
}

const rank = (kind) => {
  const index = ORDER.indexOf(kind);
  return index < 0 ? ORDER.length : index;
};

[...db.profileSections]
  .sort((a, b) => rank(a.kind) - rank(b.kind))
  .forEach((section, index) => {
    section.sortOrder = index + 1;
  });

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan      :", path.basename(backup));
console.log("bagian profil :", db.profileSections.length, added ? "(+1 Mata Kuliah)" : "(tidak berubah)");
db.profileSections
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .forEach((s) => console.log(String(s.sortOrder).padStart(2, " "), s.kind.padEnd(15), s.title));
