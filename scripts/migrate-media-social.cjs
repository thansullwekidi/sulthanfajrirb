/**
 * Migrasi sekali jalan: menambahkan koleksi media sosial & media,
 * field logo/penulis/penerbit, serta dua jenis bagian profil baru
 * (Layanan & Rekomendasi) tanpa menyentuh data yang sudah ada.
 */
const fs = require("node:fs");
const path = require("node:path");

const DB_FILE = path.join(process.cwd(), ".data", "portfolio.json");
const raw = fs.readFileSync(DB_FILE, "utf8");
const db = JSON.parse(raw);

const stamp = Date.now();
const backup = path.join(process.cwd(), ".data", `backup-pre-media-social-${stamp}.json`);
fs.writeFileSync(backup, raw, "utf8");

const now = new Date().toISOString();

// 1. Koleksi baru.
if (!Array.isArray(db.socialLinks)) db.socialLinks = [];
if (!Array.isArray(db.mediaAssets)) db.mediaAssets = [];

// 2. Field baru pada pengalaman.
for (const experience of db.experiences) {
  if (typeof experience.logoUrl !== "string") experience.logoUrl = "";
  if (typeof experience.organizationUrl !== "string") experience.organizationUrl = "";
}

// 3. Field baru pada sertifikasi.
for (const certification of db.certifications) {
  if (typeof certification.imageUrl !== "string") certification.imageUrl = "";
  if (typeof certification.issuerLogoUrl !== "string") certification.issuerLogoUrl = "";
}

// 4. Field baru pada setiap entri profil.
for (const section of db.profileSections) {
  if (!Array.isArray(section.entries)) section.entries = [];
  for (const entry of section.entries) {
    if (typeof entry.logoUrl !== "string") entry.logoUrl = "";
    if (typeof entry.authors !== "string") entry.authors = "";
    if (typeof entry.publisher !== "string") entry.publisher = "";
    if (typeof entry.imageUrl !== "string") entry.imageUrl = "";
    if (typeof entry.url !== "string") entry.url = "";
  }
}

// 5. Dua jenis bagian baru, hanya bila belum ada.
const kinds = new Set(db.profileSections.map((section) => section.kind));
const maxOrder = db.profileSections.reduce(
  (max, section) => Math.max(max, Number(section.sortOrder) || 0),
  0
);
const append = [];
if (!kinds.has("SERVICES")) {
  append.push({
    id: "prf_layanan",
    slug: "layanan",
    title: "Layanan",
    subtitle: "Jasa yang dapat dipesan",
    kind: "SERVICES",
    visible: true,
    sortOrder: maxOrder + append.length + 1,
    entries: [],
    createdAt: now,
    updatedAt: now
  });
}
if (!kinds.has("RECOMMENDATIONS")) {
  append.push({
    id: "prf_rekomendasi",
    slug: "rekomendasi",
    title: "Rekomendasi",
    subtitle: "Kata orang lain tentang kerja sama",
    kind: "RECOMMENDATIONS",
    visible: true,
    sortOrder: maxOrder + append.length + 1,
    entries: [],
    createdAt: now,
    updatedAt: now
  });
}
db.profileSections.push(...append);

// 6. Urutan bagian dirapikan agar tidak berlubang.
[...db.profileSections]
  .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
  .forEach((section, index) => {
    section.sortOrder = index + 1;
  });

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");

console.log("cadangan:", path.basename(backup));
console.log("bagian profil:", db.profileSections.length);
console.log("bagian baru:", append.map((item) => item.kind).join(", ") || "tidak ada");
console.log("socialLinks:", db.socialLinks.length, "mediaAssets:", db.mediaAssets.length);
