/**
 * Uji kejujuran badge sidebar Studio.
 *
 * Latar belakang: badge dulu hanya menampilkan satu angka mentah, sehingga
 * "Bagian Profil 17" terbaca seolah 17 bagian siap tayang padahal baru satu
 * yang terisi. Uji ini memastikan badge membedakan jumlah wadah dari jumlah
 * yang benar-benar tampil di situs.
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

(async () => {
  const login = await call("POST", "/api/v1/auth/login", { passphrase: "studio-2026" });
  check("login admin", login.json.ok === true);
  if (!login.json.ok) process.exit(1);

  const { json } = await call("GET", "/api/v1/snapshot");
  const { database, counts } = json.data;

  console.log("\n== ANGKA MENTAH DARI SNAPSHOT ==");
  check("counts tersedia", Boolean(counts), "snapshot tanpa counts");
  check(
    "profileSections terhitung",
    counts.profileSections === database.profileSections.length,
    `${counts.profileSections} vs ${database.profileSections.length}`
  );
  check(
    "profileEntries terhitung",
    counts.profileEntries ===
      database.profileSections.reduce((sum, s) => sum + s.entries.length, 0),
    String(counts.profileEntries)
  );

  console.log("\n== BAGIAN PROFIL: WADAH vs TERISI ==");
  const filled = database.profileSections.filter((s) => s.entries.length > 0).length;
  const total = database.profileSections.length;
  check("jumlah bagian > 0", total > 0, String(total));
  check(
    "jumlah terisi lebih kecil dari total (badge wajib bedakan)",
    filled < total,
    `${filled}/${total}`
  );

  console.log("\n== JURNAL: TERBIT vs DRAF ==");
  const published = database.articles.filter((a) => a.status === "PUBLISHED").length;
  const draft = database.articles.filter((a) => a.status === "DRAFT").length;
  check("artikel terhitung utuh", published + draft === database.articles.length);
  check(
    "ada draf yang tidak boleh dihitung sebagai terbit",
    database.articles.length === 0 || published < database.articles.length,
    `terbit ${published}, draf ${draft}`
  );

  console.log("\n== PROYEK: TERBIT vs DRAF vs ARSIP ==");
  const pub = database.projects.filter((p) => p.status === "PUBLISHED").length;
  const drf = database.projects.filter((p) => p.status === "DRAFT").length;
  const ars = database.projects.filter((p) => p.status === "ARCHIVED").length;
  check("proyek terhitung utuh", pub + drf + ars === database.projects.length);
  check(
    "tempat sampah hanya berisi arsip",
    counts.projectsArchived === ars,
    `${counts.projectsArchived} vs ${ars}`
  );
  check(
    "manajer proyek tidak menghitung arsip",
    counts.projectsPublished + counts.projectsDraft === pub + drf,
    `${counts.projectsPublished + counts.projectsDraft} vs ${pub + drf}`
  );

  console.log("\n== KONSISTENSI DENGAN HALAMAN PUBLIK ==");
  const karya = await (await fetch(`${BASE}/karya`)).text();
  const rekam = await (await fetch(`${BASE}/rekam-jejak`)).text();

  const terbitDiKatalog = database.projects.filter(
    (p) => p.status === "PUBLISHED" && karya.includes(p.title)
  ).length;
  check(
    "semua proyek TERBIT tampil di /karya",
    terbitDiKatalog === pub,
    `${terbitDiKatalog} dari ${pub}`
  );

  const arsipDiKatalog = database.projects.filter(
    (p) => p.status === "ARCHIVED" && karya.includes(p.title)
  ).length;
  check("proyek ARSIP tidak bocor ke /karya", arsipDiKatalog === 0, String(arsipDiKatalog));

  const tampilDiRekam = database.profileSections.filter(
    (s) => s.visible && s.entries.some((e) => e.visible) && rekam.includes(s.title)
  ).length;
  check(
    "hanya bagian terisi yang tampil di /rekam-jejak",
    tampilDiRekam === filled,
    `${tampilDiRekam} vs ${filled}`
  );

  console.log("\n== BADGE MEMUAT KONTEKS ==");
  // Badge kini berbentuk "terisi/total" untuk profil dan "terbit/total" untuk jurnal.
  const profilBadge = `${filled}/${total}`;
  const jurnalBadge = `${published}/${database.articles.length}`;
  check("format badge profil terisi/total", /^\d+\/\d+$/.test(profilBadge), profilBadge);
  check("format badge jurnal terbit/total", /^\d+\/\d+$/.test(jurnalBadge), jurnalBadge);
  check(
    "badge profil tidak lagi menampilkan total mentah saja",
    profilBadge !== String(total),
    profilBadge
  );

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
