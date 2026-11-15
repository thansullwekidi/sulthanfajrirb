/** Uji alur avatar/sampul memakai URL media internal, persis seperti MediaField. */
const BASE = "http://localhost:3000";
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

let cookie = "";
let pass = 0;
let fail = 0;
const check = (name, ok, detail) => {
  if (ok) {
    pass += 1;
    console.log(`  OK   ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

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

(async () => {
  const login = await call("POST", "/api/v1/auth/login", { passphrase: "studio-2026" });
  check("login", login.json.ok === true);
  if (!login.json.ok) process.exit(1);

  const up = await call("POST", "/api/v1/media", {
    fileName: "foto profil.png",
    dataUrl: `data:image/png;base64,${PNG}`,
    purpose: "AVATAR"
  });
  check("unggah avatar", up.json.ok === true, JSON.stringify(up.json.error ?? {}));
  const asset = up.json.data;

  const snap = await call("GET", "/api/v1/snapshot");
  const config = { ...snap.json.data.database.siteConfig };
  config.avatarUrl = asset.url;
  config.coverImageUrl = asset.url;

  const save = await call("PATCH", "/api/v1/config", config);
  check(
    "simpan konfigurasi dengan URL media internal",
    save.json.ok === true,
    JSON.stringify(save.json.error?.fields ?? save.json.error ?? {})
  );
  check("avatar tersimpan", save.json.data?.avatarUrl === asset.url, save.json.data?.avatarUrl);
  check("sampul tersimpan", save.json.data?.coverImageUrl === asset.url);

  const home = await (await fetch(`${BASE}/`)).text();
  check("beranda merender avatar", home.includes(asset.url));

  const cv = await (await fetch(`${BASE}/cv`)).text();
  check("CV tetap sehat", cv.length > 1000);

  // Kembalikan keadaan awal lalu bersihkan aset.
  config.avatarUrl = "";
  config.coverImageUrl = "";
  const revert = await call("PATCH", "/api/v1/config", config);
  check("avatar dikosongkan kembali", revert.json.ok === true && revert.json.data?.avatarUrl === "");

  const del = await call("DELETE", "/api/v1/media", { id: asset.id });
  check("hapus aset media", del.json.ok === true);

  const home2 = await (await fetch(`${BASE}/`)).text();
  check("beranda tidak lagi memuat avatar", !home2.includes(asset.url));

  const finalSnap = await call("GET", "/api/v1/snapshot");
  check(
    "koleksi media bersih",
    finalSnap.json.data.database.mediaAssets.length === 0,
    String(finalSnap.json.data.database.mediaAssets.length)
  );
  check(
    "konfigurasi bersih",
    finalSnap.json.data.database.siteConfig.avatarUrl === "" &&
      finalSnap.json.data.database.siteConfig.coverImageUrl === ""
  );

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
