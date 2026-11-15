/**
 * Uji end-to-end kedalaman struktur 7 bagian profil terhadap akar skema LinkedIn:
 * Position (tanggal terstruktur), Education (fieldsOfStudy + notes),
 * Honor (occupation + issueDate), Publication (authors/publisher/url).
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

function sectionByKind(snap, kind) {
  return snap.database.profileSections.find((s) => s.kind === kind);
}

const EXP_BASE = {
  role: "Desainer Uji",
  organization: "Instansi Uji",
  type: "KARIER",
  highlights: "Satu poin.",
  employmentType: "FULL_TIME",
  location: "Jakarta",
  workMode: "ON_SITE",
  description: "",
  skills: "",
  logoUrl: "",
  organizationUrl: ""
};

(async () => {
  const login = await call("POST", "/api/v1/auth/login", { passphrase: "studio-2026" });
  check("login admin", login.json.ok === true);
  if (!login.json.ok) process.exit(1);

  console.log("\n== PENGALAMAN: TANGGAL TERSTRUKTUR (POSITION) ==");
  const expCurrent = await call("POST", "/api/v1/collections/experiences", {
    ...EXP_BASE,
    period: "",
    startDate: "Feb 2023",
    endDate: "",
    isCurrent: true
  });
  check(
    "tambah posisi berjalan tanpa periode bebas",
    expCurrent.json.ok === true,
    JSON.stringify(expCurrent.json.error ?? {})
  );
  const expCurrentId = expCurrent.json.data?.id;

  let snap = await snapshot();
  const savedCurrent = snap.database.experiences.find((e) => e.id === expCurrentId);
  check("tanggal mulai tersimpan", savedCurrent?.startDate === "Feb 2023", savedCurrent?.startDate);
  check("status berjalan tersimpan", savedCurrent?.isCurrent === true);

  const expRange = await call("POST", "/api/v1/collections/experiences", {
    ...EXP_BASE,
    period: "",
    startDate: "Jan 2024",
    endDate: "Des 2024",
    isCurrent: false
  });
  check("tambah posisi dengan rentang", expRange.json.ok === true);
  const expRangeId = expRange.json.data?.id;

  const noDate = await call("POST", "/api/v1/collections/experiences", {
    ...EXP_BASE,
    period: "",
    startDate: "",
    endDate: "",
    isCurrent: false
  });
  check("tolak posisi tanpa periode & tanggal", noDate.json.ok === false);

  const badCurrent = await call("POST", "/api/v1/collections/experiences", {
    ...EXP_BASE,
    period: "",
    startDate: "Jan 2024",
    endDate: "Des 2024",
    isCurrent: true
  });
  check("tolak posisi berjalan yang punya tanggal selesai", badCurrent.json.ok === false);

  console.log("\n== PENDIDIKAN: BIDANG STUDI & CATATAN (EDUCATION) ==");
  snap = await snapshot();
  const edu = sectionByKind(snap, "EDUCATION");
  const eduEntry = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: edu.id,
    entry: {
      title: "Universitas Uji",
      subtitle: "Sarjana Desain",
      meta: "3.75",
      location: "Banten",
      startDate: "2020",
      endDate: "2024",
      isCurrent: false,
      description: "Aktif di himpunan mahasiswa.",
      fieldOfStudy: "Desain Komunikasi Visual",
      notes: "Skripsi tentang identitas visual media penyiaran.",
      url: "",
      imageUrl: "",
      logoUrl: "",
      authors: "",
      publisher: "",
      tags: "",
      visible: true
    }
  });
  check(
    "tambah pendidikan dengan bidang studi",
    eduEntry.json.ok === true,
    JSON.stringify(eduEntry.json.error ?? {})
  );
  const eduEntryId = eduEntry.json.data?.id;

  snap = await snapshot();
  const savedEdu = sectionByKind(snap, "EDUCATION").entries.find((e) => e.id === eduEntryId);
  check("gelar tersimpan di subtitle", savedEdu?.subtitle === "Sarjana Desain", savedEdu?.subtitle);
  check(
    "bidang studi tersimpan terpisah",
    savedEdu?.fieldOfStudy === "Desain Komunikasi Visual",
    savedEdu?.fieldOfStudy
  );
  check(
    "catatan tersimpan terpisah",
    savedEdu?.notes === "Skripsi tentang identitas visual media penyiaran.",
    savedEdu?.notes
  );
  check(
    "aktivitas tetap di deskripsi",
    savedEdu?.description === "Aktif di himpunan mahasiswa.",
    savedEdu?.description
  );

  console.log("\n== PENGHARGAAN: POSISI & TANGGAL (HONOR) ==");
  const honors = sectionByKind(snap, "HONORS");
  const honorEntry = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: honors.id,
    entry: {
      title: "Penghargaan Uji",
      subtitle: "Penerbit Uji",
      meta: "Desainer Grafis",
      location: "",
      startDate: "2024",
      endDate: "",
      isCurrent: false,
      description: "Diberikan atas kontribusi desain.",
      fieldOfStudy: "",
      notes: "Diumumkan pada acara tahunan.",
      url: "",
      imageUrl: "",
      logoUrl: "",
      authors: "",
      publisher: "",
      tags: "",
      visible: true
    }
  });
  check("tambah penghargaan", honorEntry.json.ok === true, JSON.stringify(honorEntry.json.error ?? {}));
  const honorEntryId = honorEntry.json.data?.id;

  snap = await snapshot();
  const savedHonor = sectionByKind(snap, "HONORS").entries.find((e) => e.id === honorEntryId);
  check("posisi saat menerima tersimpan", savedHonor?.meta === "Desainer Grafis", savedHonor?.meta);
  check("catatan penghargaan tersimpan", savedHonor?.notes === "Diumumkan pada acara tahunan.");

  console.log("\n== PUBLIKASI: PENULIS, PENERBIT, TAUTAN ==");
  const pubs = sectionByKind(snap, "PUBLICATIONS");
  const pubEntry = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: pubs.id,
    entry: {
      title: "Publikasi Uji",
      subtitle: "Jurnal Uji",
      meta: "Vol. 1",
      location: "",
      startDate: "2025",
      endDate: "",
      isCurrent: false,
      description: "Ringkasan publikasi uji.",
      fieldOfStudy: "",
      notes: "",
      url: "https://doi.org/10.1234/uji",
      imageUrl: "",
      logoUrl: "",
      authors: "Sulthan, Rekan",
      publisher: "Jurnal Uji",
      tags: "",
      visible: true
    }
  });
  check("tambah publikasi", pubEntry.json.ok === true, JSON.stringify(pubEntry.json.error ?? {}));
  const pubId = pubEntry.json.data?.id;

  snap = await snapshot();
  const savedPub = sectionByKind(snap, "PUBLICATIONS").entries.find((e) => e.id === pubId);
  check("penulis tersimpan", savedPub?.authors === "Sulthan, Rekan");
  check("tautan publikasi tersimpan", savedPub?.url === "https://doi.org/10.1234/uji");

  const pubNoUrl = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: pubs.id,
    entry: {
      title: "Publikasi Tanpa Tautan",
      subtitle: "Jurnal Uji",
      meta: "",
      location: "",
      startDate: "2025",
      endDate: "",
      isCurrent: false,
      description: "Tanpa tautan.",
      fieldOfStudy: "",
      notes: "",
      url: "",
      imageUrl: "",
      logoUrl: "",
      authors: "Sulthan",
      publisher: "Jurnal Uji",
      tags: "",
      visible: true
    }
  });
  check("tolak publikasi tanpa tautan", pubNoUrl.json.ok === false);

  console.log("\n== RENDER PUBLIK ==");
  const rekam = await (await fetch(`${BASE}/rekam-jejak`)).text();
  check("rekam jejak memuat tanggal mulai terstruktur", rekam.includes("Jan 2024"));
  check("rekam jejak memuat status berjalan", rekam.includes("Sekarang"));
  check("rekam jejak memuat bidang studi", rekam.includes("Desain Komunikasi Visual"));
  check("rekam jejak memuat catatan pendidikan", rekam.includes("Skripsi tentang identitas visual"));
  check("rekam jejak memuat posisi penghargaan", rekam.includes("Desainer Grafis"));
  check("rekam jejak memuat penulis publikasi", rekam.includes("Sulthan, Rekan"));

  const cv = await (await fetch(`${BASE}/cv`)).text();
  // Halaman CV hanya memuat 3 pengalaman teratas, jadi yang diuji adalah entri
  // berjalan (sortOrder 3) — bukan rentang Jan 2024 yang berada di urutan ke-4.
  check("CV memuat status berjalan terstruktur", cv.includes("Feb 2023 — Sekarang"));

  console.log("\n== PEMBERSIHAN ==");
  for (const id of [expCurrentId, expRangeId]) {
    const del = await call("DELETE", `/api/v1/collections/experiences/${id}`);
    check(`hapus pengalaman uji ${id}`, del.json.ok === true);
  }
  for (const [sectionId, entryId, label] of [
    [edu.id, eduEntryId, "pendidikan"],
    [honors.id, honorEntryId, "penghargaan"],
    [pubs.id, pubId, "publikasi"]
  ]) {
    const del = await call("POST", "/api/v1/profile", {
      action: "entry.delete",
      sectionId,
      entryId
    });
    check(`hapus entri ${label} uji`, del.json.ok === true);
  }

  snap = await snapshot();
  check("pengalaman kembali 2", snap.database.experiences.length === 2, String(snap.database.experiences.length));
  check(
    "pendidikan kembali 1 entri",
    sectionByKind(snap, "EDUCATION").entries.length === 1,
    String(sectionByKind(snap, "EDUCATION").entries.length)
  );
  check("penghargaan bersih", sectionByKind(snap, "HONORS").entries.length === 0);
  check("publikasi bersih", sectionByKind(snap, "PUBLICATIONS").entries.length === 0);

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
