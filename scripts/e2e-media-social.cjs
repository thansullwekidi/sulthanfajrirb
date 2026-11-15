/**
 * Uji end-to-end lapisan media, media sosial, dan entri profil.
 * Memakai cookie sesi admin hasil login, lalu memverifikasi setiap mutasi
 * benar-benar tersimpan (bukan hanya dibalas 200).
 */
const BASE = "http://localhost:3000";
const PASSPHRASE = "studio-2026";

let cookie = "";
let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  OK   ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function call(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) cookie = setCookie.map((item) => item.split(";")[0]).join("; ");
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: response.status, json };
}

/** PNG 1×1 piksel valid, untuk menguji deteksi magic bytes. */
const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

async function snapshot() {
  const { json } = await call("GET", "/api/v1/snapshot");
  return json.data;
}

(async () => {
  console.log("\n== LOGIN ==");
  const login = await call("POST", "/api/v1/auth/login", { passphrase: PASSPHRASE });
  check("login admin", login.json.ok === true, JSON.stringify(login.json.error ?? {}));
  if (!login.json.ok) process.exit(1);

  console.log("\n== UNGGAH MEDIA ==");
  const upload = await call("POST", "/api/v1/media", {
    fileName: "logo uji.png",
    dataUrl: `data:image/png;base64,${PNG_1PX}`,
    purpose: "EDUCATION_LOGO"
  });
  check("unggah PNG valid", upload.json.ok === true, JSON.stringify(upload.json.error ?? {}));
  const asset = upload.json.data;
  check("URL media menunjuk rute API", asset?.url === `/api/v1/media/${asset?.id}`, asset?.url);

  const fileRes = await fetch(`${BASE}${asset.url}`);
  check("berkas media dapat diambil", fileRes.status === 200, `HTTP ${fileRes.status}`);
  check(
    "content-type berkas benar",
    fileRes.headers.get("content-type") === "image/png",
    fileRes.headers.get("content-type")
  );

  const fake = await call("POST", "/api/v1/media", {
    fileName: "palsu.png",
    dataUrl: `data:image/png;base64,${Buffer.from("bukan gambar").toString("base64")}`,
    purpose: "AVATAR"
  });
  check("tolak berkas bukan gambar", fake.json.ok === false, JSON.stringify(fake.json.error ?? {}));

  const svg = await call("POST", "/api/v1/media", {
    fileName: "x.svg",
    dataUrl: `data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`,
    purpose: "AVATAR"
  });
  check("tolak SVG", svg.json.ok === false, JSON.stringify(svg.json.error ?? {}));

  const noSession = await fetch(`${BASE}/api/v1/media`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: "a.png",
      dataUrl: `data:image/png;base64,${PNG_1PX}`,
      purpose: "AVATAR"
    })
  });
  check("unggah tanpa sesi ditolak", noSession.status === 403, `HTTP ${noSession.status}`);

  console.log("\n== MEDIA SOSIAL ==");
  // Bersihkan sisa uji sebelumnya agar urutan dapat diuji secara deterministik.
  const existing = await snapshot();
  for (const stale of existing.database.socialLinks) {
    await call("POST", "/api/v1/social", { action: "social.delete", id: stale.id });
  }
  const baseline = await snapshot();
  check("koleksi sosial bersih sebelum uji", baseline.database.socialLinks.length === 0);

  const created = await call("POST", "/api/v1/social", {
    action: "social.create",
    link: {
      platform: "INSTAGRAM",
      label: "Instagram",
      url: "https://www.instagram.com/sulthanfajri",
      visible: true
    }
  });
  check("tambah media sosial", created.json.ok === true, JSON.stringify(created.json.error ?? {}));
  const socialId = created.json.data?.id;

  const second = await call("POST", "/api/v1/social", {
    action: "social.create",
    link: {
      platform: "BEHANCE",
      label: "Behance",
      url: "https://www.behance.net/sulthanfajri",
      visible: true
    }
  });
  check("tambah media sosial kedua", second.json.ok === true);
  const secondId = second.json.data?.id;

  const badUrl = await call("POST", "/api/v1/social", {
    action: "social.create",
    link: { platform: "X", label: "", url: "bukan-url", visible: true }
  });
  check("tolak URL sosial tidak valid", badUrl.json.ok === false);

  const moved = await call("POST", "/api/v1/social", {
    action: "social.move",
    id: secondId,
    direction: "UP"
  });
  check(
    "urutkan media sosial",
    moved.json.ok === true && moved.json.data?.[0]?.id === secondId,
    JSON.stringify(moved.json.data?.map?.((item) => item.platform) ?? {})
  );

  const hidden = await call("POST", "/api/v1/social", {
    action: "social.visibility",
    id: socialId,
    visible: false
  });
  check("sembunyikan media sosial", hidden.json.ok === true && hidden.json.data?.visible === false);

  const updated = await call("POST", "/api/v1/social", {
    action: "social.update",
    id: socialId,
    link: {
      platform: "INSTAGRAM",
      label: "Instagram Resmi",
      url: "https://www.instagram.com/sulthan.fajri",
      visible: true
    }
  });
  check(
    "ubah media sosial",
    updated.json.ok === true && updated.json.data?.label === "Instagram Resmi"
  );

  console.log("\n== ENTRI PROFIL (PENDIDIKAN + LOGO) ==");
  let snap = await snapshot();
  const education = snap.database.profileSections.find((section) => section.kind === "EDUCATION");
  const eduEntry = education.entries[0];

  const updateEntry = await call("POST", "/api/v1/profile", {
    action: "entry.update",
    sectionId: education.id,
    entryId: eduEntry.id,
    entry: {
      ...eduEntry,
      logoUrl: asset.url,
      url: "https://uinbanten.ac.id",
      subtitle: "S1 Desain Komunikasi Visual",
      startDate: "2022",
      endDate: "2026"
    }
  });
  check("simpan logo institusi pendidikan", updateEntry.json.ok === true, JSON.stringify(updateEntry.json.error ?? {}));

  snap = await snapshot();
  const savedEdu = snap.database.profileSections
    .find((section) => section.id === education.id)
    .entries.find((entry) => entry.id === eduEntry.id);
  check("logo tersimpan di basis data", savedEdu.logoUrl === asset.url, savedEdu.logoUrl);
  check("subtitle pendidikan tersimpan", savedEdu.subtitle === "S1 Desain Komunikasi Visual");
  check("tanggal pendidikan tersimpan", savedEdu.startDate === "2022" && savedEdu.endDate === "2026");

  console.log("\n== PUBLIKASI WAJIB TAUTAN ==");
  const publications = snap.database.profileSections.find(
    (section) => section.kind === "PUBLICATIONS"
  );

  const pubNoUrl = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: publications.id,
    entry: {
      title: "Tanpa Tautan",
      subtitle: "Jurnal Uji",
      meta: "",
      location: "",
      startDate: "2025",
      endDate: "",
      isCurrent: false,
      description: "",
      url: "",
      imageUrl: "",
      logoUrl: "",
      authors: "Sulthan",
      publisher: "Jurnal Uji",
      tags: "",
      visible: true
    }
  });
  check("publikasi tanpa tautan ditolak", pubNoUrl.json.ok === false, JSON.stringify(pubNoUrl.json.error?.fields ?? {}));

  const pubSearch = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: publications.id,
    entry: {
      title: "Lewat Google",
      subtitle: "Jurnal Uji",
      meta: "",
      location: "",
      startDate: "2025",
      endDate: "",
      isCurrent: false,
      description: "",
      url: "https://www.google.com/search?q=publikasi",
      imageUrl: "",
      logoUrl: "",
      authors: "",
      publisher: "",
      tags: "",
      visible: true
    }
  });
  check("tautan mesin pencari ditolak", pubSearch.json.ok === false, JSON.stringify(pubSearch.json.error?.fields ?? {}));

  const pubOk = await call("POST", "/api/v1/profile", {
    action: "entry.create",
    sectionId: publications.id,
    entry: {
      title: "Desain Grafis dan Identitas Visual",
      subtitle: "Jurnal Desain Nusantara",
      meta: "Vol. 4 No. 2",
      location: "",
      startDate: "2025",
      endDate: "",
      isCurrent: false,
      description: "Kajian identitas visual pada media penyiaran publik.",
      url: "https://doi.org/10.1234/jdn.v4i2.99",
      imageUrl: asset.url,
      logoUrl: "",
      authors: "Muhammad Sulthan Fajri Rabbani, Dosen Pembimbing",
      publisher: "Jurnal Desain Nusantara",
      tags: "Desain Grafis, Identitas Visual",
      visible: true
    }
  });
  check("publikasi dengan tautan langsung diterima", pubOk.json.ok === true, JSON.stringify(pubOk.json.error ?? {}));
  const pubId = pubOk.json.data?.id;

  snap = await snapshot();
  const savedPub = snap.database.profileSections
    .find((section) => section.id === publications.id)
    .entries.find((entry) => entry.id === pubId);
  check("penulis publikasi tersimpan", savedPub.authors.includes("Sulthan"), savedPub.authors);
  check("penerbit publikasi tersimpan", savedPub.publisher === "Jurnal Desain Nusantara");
  check("tautan publikasi tersimpan", savedPub.url === "https://doi.org/10.1234/jdn.v4i2.99");

  console.log("\n== SERTIFIKASI & PENGALAMAN ==");
  const cert = await call("POST", "/api/v1/collections/certifications", {
    title: "Sertifikasi Desain Uji",
    issuer: "Lembaga Uji",
    issueDate: "2025-01-15",
    expiryDate: "",
    credentialId: "UJI-001",
    verifyUrl: "https://example.com/verify/uji-001",
    skills: "Desain Grafis",
    imageUrl: asset.url,
    issuerLogoUrl: asset.url
  });
  check("tambah sertifikasi dengan foto", cert.json.ok === true, JSON.stringify(cert.json.error ?? {}));
  const certId = cert.json.data?.id;

  snap = await snapshot();
  const savedCert = snap.database.certifications.find((item) => item.id === certId);
  check("foto sertifikasi tersimpan", savedCert.imageUrl === asset.url);
  check("logo penerbit tersimpan", savedCert.issuerLogoUrl === asset.url);

  const exp = await call("POST", "/api/v1/collections/experiences", {
    period: "2024 — 2025",
    role: "Desainer Uji",
    organization: "Instansi Uji",
    type: "KARIER",
    highlights: "Merancang materi visual.",
    employmentType: "FULL_TIME",
    location: "Jakarta",
    workMode: "ON_SITE",
    description: "Uji lapisan logo instansi.",
    skills: "Desain Grafis",
    logoUrl: asset.url,
    organizationUrl: "https://example.com/instansi"
  });
  check("tambah pengalaman dengan logo", exp.json.ok === true, JSON.stringify(exp.json.error ?? {}));
  const expId = exp.json.data?.id;

  snap = await snapshot();
  const savedExp = snap.database.experiences.find((item) => item.id === expId);
  check("logo instansi tersimpan", savedExp.logoUrl === asset.url);
  check("tautan instansi tersimpan", savedExp.organizationUrl === "https://example.com/instansi");

  console.log("\n== HALAMAN PUBLIK ==");
  const home = await (await fetch(`${BASE}/`)).text();
  check("beranda memuat tautan Instagram", home.includes("instagram.com"));
  check("beranda memuat label media sosial", home.includes("Media Sosial"));

  const rekam = await (await fetch(`${BASE}/rekam-jejak`)).text();
  check("rekam jejak memuat logo media", rekam.includes(`/api/v1/media/${asset.id}`));
  check("rekam jejak memuat tautan publikasi", rekam.includes("doi.org/10.1234"));
  check("rekam jejak memuat nama penulis", rekam.includes("Sulthan"));

  const kontak = await (await fetch(`${BASE}/kontak`)).text();
  check("kontak memuat media sosial", kontak.includes("instagram.com"));

  console.log("\n== PEMBERSIHAN ==");
  const delPub = await call("POST", "/api/v1/profile", {
    action: "entry.delete",
    sectionId: publications.id,
    entryId: pubId
  });
  check("hapus entri publikasi", delPub.json.ok === true);

  const delCert = await call("DELETE", `/api/v1/collections/certifications/${certId}`);
  check("hapus sertifikasi", delCert.json.ok === true);

  const delExp = await call("DELETE", `/api/v1/collections/experiences/${expId}`);
  check("hapus pengalaman", delExp.json.ok === true);

  const delSocial = await call("POST", "/api/v1/social", {
    action: "social.delete",
    id: secondId
  });
  check("hapus media sosial", delSocial.json.ok === true);

  const delMedia = await call("DELETE", "/api/v1/media", { id: asset.id });
  check("hapus media", delMedia.json.ok === true);

  const after = await fetch(`${BASE}/api/v1/media/${asset.id}`);
  check("berkas media terhapus", after.status === 404, `HTTP ${after.status}`);

  snap = await snapshot();
  check(
    "koleksi media bersih",
    snap.database.mediaAssets.every((item) => item.id !== asset.id)
  );
  check(
    "audit mencatat mutasi media",
    snap.database.auditLogs.some((log) => log.entityType === "MEDIA")
  );
  check(
    "audit mencatat mutasi media sosial",
    snap.database.auditLogs.some((log) => log.entityType === "SOCIAL_LINK")
  );

  // Kembalikan entri pendidikan ke keadaan semula.
  await call("POST", "/api/v1/profile", {
    action: "entry.update",
    sectionId: education.id,
    entryId: eduEntry.id,
    entry: {
      ...eduEntry,
      logoUrl: "",
      url: "",
      subtitle: "",
      startDate: "",
      endDate: ""
    }
  });
  await call("POST", "/api/v1/social", { action: "social.delete", id: socialId });

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
