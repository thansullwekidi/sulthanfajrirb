/**
 * Uji end-to-end bagian "Jeda Karier" (Career Break) — bagian terakhir dari
 * daftar bagian profil yang aktif.
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
  const baselineEntryIds = new Set(career.entries.map((entry) => entry.id));

  check("bagian Jeda Karier terlihat publik", career.visible === true);

  console.log("\n== DAFTAR JENIS JEDA LINKEDIN ==");
  const totalSections = snap.database.profileSections.length;
  check("jumlah bagian profil 15", totalSections === 15, String(totalSections));

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
    "CAREER_BREAK",
    "CAUSES",
    "INTERESTS",
    "FEATURED",
    "ACTIVITY",
    "SERVICES",
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
  const oldRoute = await fetch(`${BASE}/rekam-jejak`, { redirect: "manual" });
  check("rute lama rekam jejak dialihkan", oldRoute.status === 307);
  const home = await (await fetch(`${BASE}/`)).text();
  check("beranda memuat bagian Jeda Karier", home.includes("Jeda Karier"));
  check("beranda memuat jenis jeda", home.includes("Mengasuh Anak Penuh Waktu"));
  check("beranda memuat deskripsi jeda", home.includes("mendampingi keluarga"));
  check("beranda memuat keahlian jeda", home.includes("Manajemen Waktu"));

  console.log("\n== PEMBERSIHAN ==");
  const del = await call("POST", "/api/v1/profile", {
    action: "entry.delete",
    sectionId: career.id,
    entryId
  });
  check("hapus entri jeda karier", del.json.ok === true);

  snap = await snapshot();
  const remainingEntryIds = snap.database.profileSections
    .find((s) => s.kind === "CAREER_BREAK")
    .entries.map((item) => item.id);
  check(
    "entri Jeda Karier awal tetap tersimpan",
    [...baselineEntryIds].every((id) => remainingEntryIds.includes(id)) &&
      !remainingEntryIds.includes(entryId)
  );

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exitCode = fail === 0 ? 0 : 1;
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
