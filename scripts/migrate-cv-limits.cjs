/**
 * Migrasi idempoten: menambahkan batas entri CV ATS (cvMaxExperiences,
 * cvMaxProjects, cvMaxCertifications) ke basis data live. Nilai default 3
 * mempertahankan perilaku sebelum migrasi.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-cv-limits-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

const cfg = db.siteConfig;
let changed = false;

if (typeof cfg.cvMaxExperiences !== "number") {
  cfg.cvMaxExperiences = 3;
  changed = true;
}
if (typeof cfg.cvMaxProjects !== "number") {
  cfg.cvMaxProjects = 3;
  changed = true;
}
if (typeof cfg.cvMaxCertifications !== "number") {
  cfg.cvMaxCertifications = 3;
  changed = true;
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan      :", path.basename(backup));
console.log("perubahan     :", changed ? "ya (+3 field batas CV)" : "tidak (sudah ada)");
console.log("cvMaxExperiences :", cfg.cvMaxExperiences);
console.log("cvMaxProjects    :", cfg.cvMaxProjects);
console.log("cvMaxCertifications:", cfg.cvMaxCertifications);
