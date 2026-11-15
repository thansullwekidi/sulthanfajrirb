/**
 * AUDIT FINAL: setiap field yang terisi di database harus tampil di web.
 * Termasuk konversi tanggal ISO -> format Indonesia.
 */
const fs = require("node:fs");
const path = require("node:path");

const BASE = "http://localhost:3000";

function inHtml(html, text) {
  if (!text || !text.toString().trim()) return true;
  const t = text.toString();
  if (html.includes(t)) return true;
  if (html.includes(JSON.stringify(t).slice(1, -1))) return true;
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  if (html.includes(esc)) return true;
  const frags = t.split(/[\n\r]+/).map(s => s.trim()).filter(s => s.length >= 8);
  for (const f of frags.slice(0, 5)) {
    if (html.includes(f)) return true;
    if (html.includes(JSON.stringify(f).slice(1, -1))) return true;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta"
      }).format(d);
      if (html.includes(formatted)) return true;
    }
  }
  return false;
}

(async () => {
  const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".data", "portfolio.json"), "utf8"));
  const pages = {};
  for (const r of ["/", "/karya", "/rekam-jejak", "/catatan-lab", "/cv", "/kontak"]) {
    pages[r] = await fetch(`${BASE}${r}`).then(res => res.text());
  }

  let ok = 0, bug = 0;
  const bugs = [];

  function check(label, html, val) {
    if (inHtml(html, val)) { ok++; }
    else { bug++; bugs.push(`${label}: "${String(val).slice(0,50)}"`); }
  }

  // PROYEK
  for (const p of db.projects.filter(p => p.status === "PUBLISHED")) {
    const h = pages["/karya"];
    for (const f of ["title","subtitle","challenge","solution","caseStudy","metricLabel","metricValue","diagramType","codeSnippet","category","commitHash"]) {
      if (p[f] && p[f].toString().trim()) check(`proyek ${p.slug}.${f}`, h, p[f]);
    }
    if (p.links) for (const k of ["github","live","notebook"]) if (p.links[k]) check(`proyek ${p.slug}.links.${k}`, h, p.links[k]);
    for (const tech of p.techStack) check(`proyek ${p.slug}.tech`, h, tech);
    if (p.isFeatured) check(`proyek ${p.slug} unggulan di /`, pages["/"], p.title);
  }

  // PENGALAMAN
  for (const e of db.experiences) {
    for (const f of ["role","organization","period","startDate","endDate","location","description"]) {
      if (e[f] && e[f].toString().trim()) {
        check(`pengalaman ${e.role}.${f} di /rekam-jejak`, pages["/rekam-jejak"], e[f]);
        check(`pengalaman ${e.role}.${f} di /cv`, pages["/cv"], e[f]);
      }
    }
    for (const hl of e.highlights) check(`pengalaman ${e.role}.highlight`, pages["/rekam-jejak"], hl);
    for (const sk of e.skills) check(`pengalaman ${e.role}.skill`, pages["/rekam-jejak"], sk);
  }

  // SERTIFIKASI
  for (const c of db.certifications) {
    for (const f of ["title","issuer","issueDate","expiryDate","credentialId","verifyUrl"]) {
      if (c[f] && c[f].toString().trim()) check(`sertifikasi ${c.title.slice(0,15)}.${f}`, pages["/rekam-jejak"], c[f]);
    }
  }

  // SKILL
  for (const s of db.skills) {
    // name wajib tampil di /, /rekam-jejak, /cv
    if (s.name && s.name.trim()) {
      check(`skill ${s.name}.name di /`, pages["/"], s.name);
      check(`skill ${s.name}.name di /rekam-jejak`, pages["/rekam-jejak"], s.name);
      check(`skill ${s.name}.name di /cv`, pages["/cv"], s.name);
    }
    // context keahlian ditampilkan di / dan /rekam-jejak (tidak wajib di CV ATS minimalis)
    if (s.context && s.context.trim()) {
      check(`skill ${s.name}.context di /`, pages["/"], s.context);
      check(`skill ${s.name}.context di /rekam-jejak`, pages["/rekam-jejak"], s.context);
    }
    if (s.level !== undefined) check(`skill ${s.name}.level di /`, pages["/"], String(s.level));
  }

  // TESTIMONI
  for (const t of db.testimonials) {
    for (const f of ["author","role","organization","relationship","quote","verifiedTag","date"]) {
      if (t[f] && t[f].toString().trim()) check(`testimoni ${t.author}.${f}`, pages["/"], t[f]);
    }
  }

  // ARTIKEL
  for (const a of db.articles.filter(a => a.status === "PUBLISHED")) {
    for (const f of ["title","summary","content","category","slug"]) {
      if (a[f] && a[f].toString().trim()) check(`artikel ${a.slug}.${f}`, pages["/catatan-lab"], a[f]);
    }
    if (a.readTime) check(`artikel ${a.slug}.readTime`, pages["/catatan-lab"], String(a.readTime));
  }

  // BAGIAN PROFIL
  for (const sec of db.profileSections) {
    for (const entry of sec.entries.filter(e => e.visible)) {
      // title selalu tampil di /rekam-jejak, dan di / /cv untuk EDUCATION
      if (entry.title && entry.title.trim()) {
        check(`profil [${sec.kind}] ${entry.title.slice(0,15)}.title di /rekam-jejak`, pages["/rekam-jejak"], entry.title);
        if (sec.kind === "EDUCATION") {
          check(`profil [EDUCATION] ${entry.title.slice(0,15)}.title di /`, pages["/"], entry.title);
          check(`profil [EDUCATION] ${entry.title.slice(0,15)}.title di /cv`, pages["/cv"], entry.title);
        }
      }
      // field detail hanya wajib di /rekam-jejak (CV ATS minimalis, beranda minimalis)
      for (const f of ["subtitle","description","meta","url","period","location"]) {
        if (entry[f] && entry[f].toString().trim()) {
          check(`profil [${sec.kind}] ${entry.title.slice(0,15)}.${f} di /rekam-jejak`, pages["/rekam-jejak"], entry[f]);
          if (sec.kind === "EDUCATION" && ["subtitle","period"].includes(f)) {
            check(`profil [EDUCATION] ${entry.title.slice(0,15)}.${f} di /cv`, pages["/cv"], entry[f]);
          }
        }
      }
    }
  }

  // KONFIGURASI
  const cfg = db.siteConfig;
  for (const f of ["fullName","headline","bio","location","email","phone","website","github","linkedin","cvVersion","education"]) {
    if (cfg[f] && cfg[f].toString().trim()) {
      const inAny = Object.values(pages).some(h => inHtml(h, cfg[f]));
      if (inAny) ok++; else { bug++; bugs.push(`konfigurasi ${f}: "${cfg[f]}"`); }
    }
  }

  console.log(`HASIL: ${ok} field terisi dan tampil, ${bug} bug`);
  if (bug > 0) {
    console.log("\n=== BUG ===");
    bugs.forEach(b => console.log(`  ! ${b}`));
  } else {
    console.log("\nNOL BUG — semua field yang terisi di CMS tampil di web.");
  }
  process.exit(bug === 0 ? 0 : 1);
})();
