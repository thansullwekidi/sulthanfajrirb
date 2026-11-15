/**
 * Uji end-to-end bagian "Jeda Karier" (Career Break) — bagian terakhir dari
 * daftar resmi "Add profile section" LinkedIn yang belum ada di proyek.
 */
const BASE = "http://localhost:3000";

let cookie = "";
let pass = 0;
let fail = 0;

function check(name, ok, detail) {
  if (ok) {
    pass += 1;
    console.log(`  OK   ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length) cookie = raw.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function snapshot() {
  const { json } = await call("GET", "/api/v1/snapshot");
  return json.data;
}

(async () => {
  const login = await call("POST", "/api/v1/auth/login", { passphrase: "studio-2026" });
  check("login admin", login.json.ok === true);
  if (!login.json.ok) process.exit(1);

  console.log("\n== BAGIAN JEDA KARIER ==");
  let snap = await snapshot();
  const career = snap.database.profileSections.find((s) => s.kind === "CAREER_BREAK");
  check("bagian Jeda Karier tersedia", Boolean(career), "tidak ditemukan");
  if (!career) process.exit(1);

  check("bagian Jeda Karier terlihat publik", career.visible === true);

  console.log("\n== DAFTAR JENIS JEDA LINKEDIN ==");
  const totalSections = snap.database.profileSections.length;
  check("jumlah bagian profil 17", totalSections === 17, String(totalSections));

  const kinds = snap.database.profileSections.map((s) => s.kind);
  const expected = [
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
    "INTERESTS",
    "FEATURED",
    "ACTIVITY",
    "SERVICES",
    "RECOMMENDATIONS"
  ];
  const missing = expected.filter((kind) => !kinds.includes(kind));
  check("semua jenis bagian LinkedIn tersedia", missing.length === 0, missing.join(", "));

  console.log("\n== TAMBAH ENTRI JEDA KARIER ==");
  const entry = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: career.id,
    entry: {
      title: "Mengasuh Anak Penuh Waktu",
      subtitle: "Fokus keluarga",
      meta: "Mengasuh Anak Penuh Waktu",
      location: "Banten, Indonesia",
      startDate: "2024",
      endDate: "2025",
      isCurrent: false,
      description:
        "Mengambil jeda dari pekerjaan penuh waktu untuk mendampingi keluarga, sambil mempertajam keterampilan desain secara mandiri.",
      fieldOfStudy: "",
      notes: "",
      url: "",
      imageUrl: "",
      logoUrl: "",
      authors: "",
      publisher: "",
      tags: "Manajemen Waktu, Desain Mandiri",
      visible: true
    }
  });
  check("tambah entri jeda karier", entry.json.ok === true, JSON.stringify(entry.json.error ?? {}));
  const entryId = entry.json.data?.id;

  snap = await snapshot();
  const saved = snap.database.profileSections
    .find((s) => s.kind === "CAREER_BREAK")
    .entries.find((e) => e.id === entryId);

  check("jenis jeda tersimpan", saved?.meta === "Mengasuh Anak Penuh Waktu", saved?.meta);
  check("tanggal mulai tersimpan", saved?.startDate === "2024");
  check("tanggal selesai tersimpan", saved?.endDate === "2025");
  check("lokasi tersimpan", saved?.location === "Banten, Indonesia");
  check(
    "keahlian yang dikembangkan tersimpan",
    Array.isArray(saved?.tags) && saved.tags.includes("Manajemen Waktu"),
    JSON.stringify(saved?.tags)
  );

  console.log("\n== RENDER PUBLIK ==");
  const rekam = await (await fetch(`${BASE}/rekam-jejak`)).text();
  check("rekam jejak memuat bagian Jeda Karier", rekam.includes("Jeda Karier"));
  check("rekam jejak memuat jenis jeda", rekam.includes("Mengasuh Anak Penuh Waktu"));
  check("rekam jejak memuat deskripsi jeda", rekam.includes("mendampingi keluarga"));
  check("rekam jejak memuat keahlian jeda", rekam.includes("Manajemen Waktu"));

  console.log("\n== PEMBERSIHAN ==");
  const del = await call("POST", "/api/v1/profile", {
    action: "entry.delete",
    sectionId: career.id,
    entryId
  });
  check("hapus entri jeda karier", del.json.ok === true);

  snap = await snapshot();
  check(
    "bagian Jeda Karier kembali kosong",
    snap.database.profileSections.find((s) => s.kind === "CAREER_BREAK").entries.length === 0
  );

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
