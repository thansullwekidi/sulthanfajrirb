/**
 * Migrasi idempoten untuk penanda keahlian unggulan.
 * Bagian profil yang telah dihapus dipurge sebelum berkas disimpan.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-linkedin-parity-${stamp}.json`);
db.profileSections = db.profileSections.filter(
  (section) => !["PROJECTS", "RECOMMENDATIONS"].includes(section.kind)
);
delete db.projects;
delete db.testimonials;
fs.writeFileSync(backup, JSON.stringify(db, null, 2), "utf8");

// Tambahkan penanda keahlian unggulan.
for (const skill of db.skills ?? []) {
  if (typeof skill.pinned !== "boolean") skill.pinned = false;
}

// Rapikan urutan bagian yang tersisa.
[...db.profileSections]
  .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
  .forEach((section, index) => {
    section.sortOrder = index + 1;
  });

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan      :", path.basename(backup));
console.log("bagian profil :", db.profileSections.length);
console.log("keahlian      :", (db.skills ?? []).length);
