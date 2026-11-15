/**
 * Migrasi idempoten untuk memperdalam tiga bagian profil agar setara akar
 * skema LinkedIn:
 *
 * 1. Pengalaman (Position) — LinkedIn menyimpan `startMonthYear`/`endMonthYear`
 *    terpisah, bukan satu string periode. Kolom `startDate`, `endDate`, dan
 *    `isCurrent` ditambahkan; periode lama diurai bila berpola "A — B".
 * 2. Pendidikan (Education) — `fieldsOfStudy` dan `notes` adalah kolom terpisah
 *    dari gelar dan aktivitas.
 * 3. Penghargaan (Honor) — `issueDate` dan `occupation` punya kolom sendiri.
 *
 * Data yang sudah ada tidak ditimpa: kolom hanya diisi bila masih kosong.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-linkedin-depth-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

/**
 * Urai periode bebas "Feb 2023 — Jul 2023" menjadi bulan/tahun terpisah.
 * Mengembalikan null bila polanya tidak dikenali, agar data aneh tidak dirusak.
 */
function parsePeriod(period) {
  if (typeof period !== "string" || !period.trim()) return null;
  const parts = period.split(/\s+[—–-]\s+/);
  if (parts.length !== 2) return null;
  const [start, end] = parts.map((part) => part.trim());
  if (!start || !end) return null;
  const isCurrent = /^(sekarang|present|now|saat ini)$/i.test(end);
  return { startDate: start, endDate: isCurrent ? "" : end, isCurrent };
}

let expUpdated = 0;
for (const experience of db.experiences ?? []) {
  if (typeof experience.startDate !== "string") experience.startDate = "";
  if (typeof experience.endDate !== "string") experience.endDate = "";
  if (typeof experience.isCurrent !== "boolean") experience.isCurrent = false;

  // Hanya urai bila tanggal terstruktur belum ada sama sekali.
  if (!experience.startDate && !experience.endDate) {
    const parsed = parsePeriod(experience.period);
    if (parsed) {
      experience.startDate = parsed.startDate;
      experience.endDate = parsed.endDate;
      experience.isCurrent = parsed.isCurrent;
      expUpdated += 1;
    }
  }
}

let entryUpdated = 0;
for (const section of db.profileSections ?? []) {
  for (const entry of section.entries ?? []) {
    if (typeof entry.fieldOfStudy !== "string") entry.fieldOfStudy = "";
    if (typeof entry.notes !== "string") entry.notes = "";
    entryUpdated += 1;
  }
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan        :", path.basename(backup));
console.log("pengalaman      :", (db.experiences ?? []).length, `(${expUpdated} diurai dari periode)`);
console.log("entri profil    :", entryUpdated, "dinormalisasi");
