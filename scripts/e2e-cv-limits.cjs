/**
 * Uji batas entri CV ATS yang dapat diatur lewat Konfigurasi.
 * Memastikan perubahan cvMaxCertifications langsung memengaruhi jumlah
 * sertifikasi yang dirender di /cv.
 */
const BASE = "http://localhost:3000";
let cookie = "";

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
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, json };
}

async function html(route) {
  return (await fetch(`${BASE}${route}`)).text();
}

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass += 1; console.log(`  OK   ${name}`); }
  else { fail += 1; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

(async () => {
  await call("POST", "/api/v1/auth/login", { passphrase: "studio-2026" });

  const snap = await call("GET", "/api/v1/snapshot");
  const cfg = snap.json.data.database.siteConfig;
  const certCount = snap.json.data.database.certifications.length;
  console.log(`sertifikasi di basis data: ${certCount}`);
  console.log(`batas saat ini: ${cfg.cvMaxCertifications}`);

  // 1. Naikkan batas menjadi 5.
  const patch = await call("PATCH", "/api/v1/config", {
    ...cfg,
    cvMaxCertifications: 5
  });
  check("naikkan batas sertifikasi ke 5", patch.json.ok === true, JSON.stringify(patch.json.error ?? {}));

  // 2. CV sekarang harus menampilkan SEMUA sertifikasi.
  const cvHtml = await html("/cv");
  const allCerts = snap.json.data.database.certifications;
  const allShown = allCerts.every((c) => cvHtml.includes(c.title.slice(0, 20)));
  check(`CV menampilkan semua ${allCerts.length} sertifikasi`, allShown, "ada yang tidak tampil");

  // 3. Turunkan batas menjadi 1.
  const patch2 = await call("PATCH", "/api/v1/config", {
    ...cfg,
    cvMaxCertifications: 1
  });
  check("turunkan batas sertifikasi ke 1", patch2.json.ok === true);

  // 4. CV sekarang hanya boleh menampilkan 1 sertifikasi.
  const cvHtml2 = await html("/cv");
  const shownCount = allCerts.filter((c) => cvHtml2.includes(c.title.slice(0, 20))).length;
  check("CV hanya menampilkan 1 sertifikasi", shownCount === 1, `${shownCount} muncul`);

  // 5. Kembalikan ke 3.
  const patch3 = await call("PATCH", "/api/v1/config", {
    ...cfg,
    cvMaxCertifications: 3
  });
  check("kembalikan batas ke 3", patch3.json.ok === true);

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
