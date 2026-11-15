/**
 * Uji end-to-end bagian profil yang dihapus dan keahlian unggulan.
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

  console.log("\n== BAGIAN YANG DIHAPUS ==");
  let snap = await snapshot();
  const skillsBaseline = snap.database.skills.length;
  check("rekomendasi terhapus dari basis data", !Object.hasOwn(snap.database, "testimonials"));
  check(
    "bagian Proyek dan Rekomendasi tidak ada",
    !snap.database.profileSections.some((s) => ["PROJECTS", "RECOMMENDATIONS"].includes(s.kind))
  );
  for (const kind of ["PROJECTS", "RECOMMENDATIONS"]) {
    const removedSection = await call("POST", "/api/v1/profile", {
      action: "section.create",
      section: { title: "Bagian dihapus", kind, visible: true }
    });
    check(`API menolak bagian ${kind}`, removedSection.json.ok === false);
  }

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

  console.log("\n== REKOMENDASI DINONAKTIFKAN ==");
  const legacyRecommendation = await call("POST", "/api/v1/collections/testimonials", {});
  check("endpoint rekomendasi lama dinonaktifkan", legacyRecommendation.status === 404);

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
  check("beranda kosong tidak menampilkan label bagian yang belum diaktifkan", !home.includes("Keahlian Unggulan"));
  check("beranda kosong tidak menampilkan keahlian yang belum diaktifkan", !home.includes("Desain Identitas"));
  check("beranda tidak menampilkan rekomendasi lama", !home.includes("Rekomendasi Terverifikasi"));

  console.log("\n== BAGIAN KUSTOM TAMPIL SETELAH ADA ENTRI ==");
  const customTitle = `Bagian Kustom Uji ${Date.now()}`;
  const customSection = await call("POST", "/api/v1/profile", {
    action: "section.create",
    section: {
      title: customTitle,
      subtitle: "Subjudul bagian kustom",
      kind: "CUSTOM",
      visible: true
    }
  });
  check("tambah bagian kustom", customSection.json.ok === true);
  const customSectionId = customSection.json.data?.id;
  const homeWithoutCustomEntry = await (await fetch(`${BASE}/`)).text();
  check(
    "bagian kosong belum tampil di beranda",
    !homeWithoutCustomEntry.includes(customTitle)
  );
  const customEntryTitle = `Konten Uji ${Date.now()}`;
  const customEntry = customSectionId
    ? await call("POST", "/api/v1/profile", {
        action: "entry.create",
        sectionId: customSectionId,
        entry: {
          title: customEntryTitle,
          url: "",
          imageUrl: "",
          logoUrl: "",
          visible: true
        }
      })
    : { json: { ok: false } };
  check(
    "tambah entri bagian kustom",
    customEntry.json.ok === true,
    JSON.stringify(customEntry.json.error ?? customEntry.json)
  );
  const homeWithCustomEntry = await (await fetch(`${BASE}/`)).text();
  check("judul bagian tampil setelah menambah entri", homeWithCustomEntry.includes(customTitle));
  check(
    "subjudul bagian tampil setelah menambah entri",
    homeWithCustomEntry.includes("Subjudul bagian kustom")
  );
  check(
    "konten entri bagian kustom tampil di beranda",
    homeWithCustomEntry.includes(customEntryTitle)
  );
  if (customSectionId) {
    const deletedSection = await call("POST", "/api/v1/profile", {
      action: "section.delete",
      id: customSectionId
    });
    check("hapus bagian kustom uji", deletedSection.json.ok === true);
  } else {
    check("hapus bagian kustom uji", false, "ID bagian tidak tersedia");
  }

  console.log("\n== PEMBERSIHAN ==");
  const delSkill = await call("DELETE", `/api/v1/collections/skills/${skillId}`);
  check("hapus keahlian uji", delSkill.json.ok === true);

  snap = await snapshot();
  check("rekomendasi tetap terhapus", !Object.hasOwn(snap.database, "testimonials"));
  check("keahlian kembali ke jumlah awal", snap.database.skills.length === skillsBaseline, String(snap.database.skills.length));

  console.log(`\nHASIL: ${pass} lolos, ${fail} gagal\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("Kesalahan uji:", error);
  process.exit(1);
});
