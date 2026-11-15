/**
 * Uji end-to-end kesetaraan fitur LinkedIn:
 * bagian Proyek, foto + tautan profil pemberi rekomendasi, dan keahlian unggulan.
 */
const BASE = "http://localhost:3000";
const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

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
    json = { raw: text.slice(0, 150) };
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

  const up = await call("POST", "/api/v1/media", {
    fileName: "pemberi rekomendasi.png",
    dataUrl: `data:image/png;base64,${PNG_1PX}`,
    purpose: "AVATAR"
  });
  check("unggah foto pemberi rekomendasi", up.json.ok === true, JSON.stringify(up.json.error ?? {}));
  const asset = up.json.data;

  console.log("\n== BAGIAN PROYEK ==");
  let snap = await snapshot();
  const tstBaseline = snap.database.testimonials.length;
  const skillsBaseline = snap.database.skills.length;
  const projectsSection = snap.database.profileSections.find((s) => s.kind === "PROJECTS");
  check("bagian Proyek tersedia", Boolean(projectsSection), "tidak ditemukan");

  const projEntry = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: projectsSection.id,
    entry: {
      title: "Sistem Identitas Visual TVRI",
      subtitle: "Desainer Grafis",
      meta: "",
      location: "",
      startDate: "2024",
      endDate: "2025",
      isCurrent: false,
      description: "Merancang panduan identitas visual untuk program berita.",
      url: "https://example.com/proyek/identitas-tvri",
      imageUrl: asset.url,
      logoUrl: "",
      authors: "Muhammad Sulthan Fajri Rabbani",
      publisher: "TVRI",
      tags: "Desain Grafis, Identitas Visual",
      visible: true
    }
  });
  check("tambah entri proyek", projEntry.json.ok === true, JSON.stringify(projEntry.json.error ?? {}));
  const projId = projEntry.json.data?.id;

  snap = await snapshot();
  const savedProj = snap.database.profileSections
    .find((s) => s.id === projectsSection.id)
    .entries.find((e) => e.id === projId);
  check("proyek tersimpan dengan gambar", savedProj?.imageUrl === asset.url, savedProj?.imageUrl);
  check("proyek menyimpan tautan", savedProj?.url === "https://example.com/proyek/identitas-tvri");
  check("proyek menyimpan peran", savedProj?.subtitle === "Desainer Grafis");

  console.log("\n== KEAHLIAN UNGGULAN ==");
  const skill = await call("POST", "/api/v1/collections/skills", {
    name: "Desain Identitas",
    category: "MEDIA_KREATIF",
    level: 90,
    context: "Panduan identitas visual untuk media penyiaran.",
    endorsements: 12,
    pinned: true
  });
  check("tambah keahlian unggulan", skill.json.ok === true, JSON.stringify(skill.json.error ?? {}));
  const skillId = skill.json.data?.id;

  snap = await snapshot();
  const savedSkill = snap.database.skills.find((s) => s.id === skillId);
  check("penanda unggulan tersimpan", savedSkill?.pinned === true, String(savedSkill?.pinned));
  check("dukungan tersimpan", savedSkill?.endorsements === 12);

  const unpin = await call("PATCH", `/api/v1/collections/skills/${skillId}`, {
    name: "Desain Identitas",
    category: "MEDIA_KREATIF",
    level: 90,
    context: "Panduan identitas visual untuk media penyiaran.",
    endorsements: 12,
    pinned: false
  });
  check("ubah status unggulan", unpin.json.ok === true && unpin.json.data?.pinned === false);

  console.log("\n== REKOMENDASI BERFOTO ==");
  const tst = await call("POST", "/api/v1/collections/testimonials", {
    author: "Ratna Kusuma",
    role: "Kepala Studio",
    organization: "TVRI Banten",
    relationship: "Atasan langsung",
    quote: "Sulthan mengubah cara tim kami memandang identitas visual program berita.",
    verifiedTag: "Terverifikasi",
    date: "2025-06-01",
    avatarUrl: asset.url,
    profileUrl: "https://www.linkedin.com/in/ratna-kusuma",
    isVisible: true
  });
  check("tambah rekomendasi berfoto", tst.json.ok === true, JSON.stringify(tst.json.error ?? {}));
  const tstId = tst.json.data?.id;

  snap = await snapshot();
  const savedTst = snap.database.testimonials.find((t) => t.id === tstId);
  check("foto pemberi rekomendasi tersimpan", savedTst?.avatarUrl === asset.url, savedTst?.avatarUrl);
  check(
    "tautan profil pemberi rekomendasi tersimpan",
    savedTst?.profileUrl === "https://www.linkedin.com/in/ratna-kusuma",
    savedTst?.profileUrl
  );

  const badProfile = await call("POST", "/api/v1/collections/testimonials", {
    author: "Uji Tolak",
    role: "Peran",
    organization: "Instansi",
    relationship: "",
    quote: "Kutipan uji yang cukup panjang untuk lolos validasi minimum.",
    verifiedTag: "Terverifikasi",
    date: "2025-06-01",
    avatarUrl: "",
    profileUrl: "bukan-url",
    isVisible: true
  });
  check("tolak tautan profil tidak valid", badProfile.json.ok === false);

  console.log("\n== RENDER PUBLIK ==");
  // Sematkan kembali satu keahlian agar bagian "Keahlian Unggulan" benar-benar teruji.
  const pinnedAgain = await call("PATCH", `/api/v1/collections/skills/${skillId}`, {
    name: "Desain Identitas",
    category: "MEDIA_KREATIF",
    level: 90,
    context: "Panduan identitas visual untuk media penyiaran.",
    endorsements: 12,
    pinned: true
  });
  check("sematkan ulang keahlian", pinnedAgain.json.ok === true && pinnedAgain.json.data?.pinned === true);

  const home = await (await fetch(`${BASE}/`)).text();
  check("beranda memuat label Keahlian Unggulan", home.includes("Keahlian Unggulan"));
  check("beranda memuat nama keahlian unggulan", home.includes("Desain Identitas"));
  check("beranda memuat foto pemberi rekomendasi", home.includes(asset.url));
  check("beranda memuat tautan profil pemberi rekomendasi", home.includes("linkedin.com/in/ratna-kusuma"));

  const rekam = await (await fetch(`${BASE}/rekam-jejak`)).text();
  check("rekam jejak memuat bagian Proyek", rekam.includes("Sistem Identitas Visual TVRI"));
  check("rekam jejak memuat tautan proyek", rekam.includes("example.com/proyek/identitas-tvri"));

  console.log("\n== PEMBERSIHAN ==");
  const delProj = await call("POST", "/api/v1/profile", {
    action: "entry.delete",
    sectionId: projectsSection.id,
    entryId: projId
  });
  check("hapus entri proyek", delProj.json.ok === true);

  const delSkill = await call("DELETE", `/api/v1/collections/skills/${skillId}`);
  check("hapus keahlian uji", delSkill.json.ok === true);

  const delTst = await call("DELETE", `/api/v1/collections/testimonials/${tstId}`);
  check("hapus rekomendasi uji", delTst.json.ok === true);

  const delMedia = await call("DELETE", "/api/v1/media", { id: asset.id });
  check("hapus aset media", delMedia.json.ok === true);

  snap = await snapshot();
  check("bagian Proyek kembali kosong",
    snap.database.profileSections.find((s) => s.id === projectsSection.id).entries.length === 0);
  check("rekomendasi bersih", snap.database.testimonials.length === tstBaseline);
  check("keahlian kembali ke jumlah awal", snap.database.skills.length === skillsBaseline, String(snap.database.skills.length));
  check("media bersih", snap.database.mediaAssets.length === 0);

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
