/**
 * Migrasi idempoten: menambahkan bagian profil "Proyek" (khas LinkedIn),
 * kolom foto/tautan profil pada rekomendasi, dan penanda keahlian unggulan.
 * Data yang sudah ada tidak ditimpa.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-linkedin-parity-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

const now = new Date().toISOString();

// 1. Bagian Proyek, hanya bila belum ada.
const kinds = new Set(db.profileSections.map((section) => section.kind));
let addedSection = false;
if (!kinds.has("PROJECTS")) {
  const maxOrder = db.profileSections.reduce(
    (max, section) => Math.max(max, Number(section.sortOrder) || 0),
    0
  );
  db.profileSections.push({
    id: "prf_proyek",
    slug: "proyek",
    title: "Proyek",
    subtitle: "Karya yang dikerjakan langsung",
    kind: "PROJECTS",
    visible: true,
    sortOrder: maxOrder + 1,
    entries: [],
    createdAt: now,
    updatedAt: now
  });
  addedSection = true;
}

// 2. Kolom baru pada rekomendasi.
for (const testimonial of db.testimonials ?? []) {
  if (typeof testimonial.avatarUrl !== "string") testimonial.avatarUrl = "";
  if (typeof testimonial.profileUrl !== "string") testimonial.profileUrl = "";
}

// 3. Penanda keahlian unggulan.
for (const skill of db.skills ?? []) {
  if (typeof skill.pinned !== "boolean") skill.pinned = false;
}

// 4. Urutan bagian dirapikan agar tidak berlubang atau ganda.
[...db.profileSections]
  .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
  .forEach((section, index) => {
    section.sortOrder = index + 1;
  });

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan      :", path.basename(backup));
console.log("bagian profil :", db.profileSections.length, addedSection ? "(+1 Proyek)" : "(tidak berubah)");
console.log("rekomendasi   :", (db.testimonials ?? []).length);
console.log("keahlian      :", (db.skills ?? []).length);
