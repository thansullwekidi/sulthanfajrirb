# Design Dossier Sulthan — Portofolio & Studio CMS

Portofolio desain grafis berbahasa Indonesia yang terhubung langsung dengan studio CMS headless. Seluruh konten publik dibaca dari satu basis data lokal, sementara studio admin menyediakan dua belas modul pengelolaan dengan validasi berlapis, jejak audit immutable, dan mekanisme hapus dua tahap.

## Profil Aktif

Data di bawah ini adalah keadaan basis data saat ini, diselaraskan dengan profil LinkedIn pemilik situs.

| Kolom | Nilai |
| --- | --- |
| Nama lengkap | Muhammad Sulthan Fajri Rabbani |
| Judul spesialisasi | Graphic Design |
| Domisili | Kota Tangerang Selatan, Banten, Indonesia |
| Pendidikan | UIN Sultan Maulana Hasanuddin Banten |
| LinkedIn | <https://www.linkedin.com/in/muhammad-sulthan-fajri-rabbani-ba2863300/> |
| Surel kontak | `sulthan.fajrirb@gmail.com` |
| NIM / ID | *kosong — diisi sendiri lewat Studio* |
| GitHub | *kosong — diisi sendiri lewat Studio* |

Field kosong sengaja dibiarkan agar tidak mengarang data. NIM, GitHub, dan catatan ketersediaan kini **opsional** dan otomatis disembunyikan dari halaman publik, CV, dan footer bila tidak diisi.

### Isi Basis Data

- **6 proyek** berstatus `ARCHIVED` (tersimpan di Tempat Sampah, dapat dipulihkan atau dihapus permanen).
- **2 pengalaman** di TVRI Stasiun DKI Jakarta: Desain grafis (Apprenticeship) dan asisten redaktur (Internship), keduanya Feb–Jul 2023, lengkap dengan jenis kerja, lokasi, mode kerja, deskripsi, dan keahlian terkait.
- **8 keahlian** desain: Adobe Illustrator, Adobe Premiere Pro, CorelDRAW, Desain Logo, Graphic Design, Komunikasi, Adobe Photoshop, After Effects.
- **4 artikel** berstatus `DRAFT` (tidak tampil di `/catatan-lab` sampai diterbitkan).
- **0 sertifikasi** dan **0 rekomendasi** karena tidak tercantum di profil sumber.
- **17 bagian profil** ala LinkedIn: Pendidikan (terisi UIN), Mata Kuliah, Bahasa, Organisasi, Penghargaan, Publikasi, Paten, Skor Tes, Pengalaman Relawan, Proyek, Jeda Karier, Kepedulian, Sorotan, Aktivitas, Minat, Layanan, dan Rekomendasi. Enam belas bagian lain sengaja kosong untuk diisi sendiri.
- **0 tautan media sosial** dan **0 aset media** — keduanya diisi sendiri lewat Studio.
- **2 pesan** di Kotak Masuk. Log audit terus bertambah setiap mutasi dan sengaja tidak dibatasi.

> Tingkat keahlian disetel `75` sebagai placeholder yang dapat diedit. LinkedIn tidak memuat angka kemahiran, jadi nilai ini bukan klaim terukur.

## Teknologi

- Next.js 15.5.4 (App Router) + React 19.1 + TypeScript strict
- Zod 3.25 untuk kontrak skema dan validasi input
- CSS tunggal bertoken (`src/app/globals.css`), tanpa Tailwind
- Penyimpanan JSON atomik lokal di `.data/portfolio.json`

## Menjalankan

Prasyarat: Node.js 20+ dan npm.

```bash
npm install
npm run dev
```

- Situs publik: <http://localhost:3000>
- Studio admin: <http://localhost:3000/admin>
- Passphrase bawaan: `studio-2026`
- Label sesi bawaan: `admin@msfr.dev`

Untuk mode produksi:

```bash
npm run build
npm run start
```

## Variabel Lingkungan

Semua variabel bersifat opsional untuk pengembangan lokal. Salin `.env.example` menjadi `.env.local` bila ingin menimpanya.

| Variabel | Fungsi | Nilai bawaan |
| --- | --- | --- |
| `STUDIO_ADMIN_PASSPHRASE` | Passphrase masuk studio | `studio-2026` |
| `STUDIO_SESSION_SECRET` | Kunci HMAC cookie sesi (minimal 16 karakter) | `obsidian-studio-local-secret-2026` |
| `STUDIO_ADMIN_LABEL` | Label identitas sesi pada bilah studio | `admin@msfr.dev` |
| `PORTFOLIO_DB_PATH` | Lokasi berkas basis data | `.data/portfolio.json` |
| `MEDIA_DIR` | Lokasi penyimpanan berkas media | `.data/media` |

> Ganti passphrase dan secret sebelum deploy. Cookie sesi bersifat `httpOnly`, ditandatangani HMAC, dan berlaku 8 jam.

## Arsitektur Lima Lapis

| Lapis | Lokasi | Tanggung jawab |
| --- | --- | --- |
| 1. Kontrak & skema | `src/contracts` | Tipe domain, skema Zod, sanitasi, envelope, generator Markdown ATS |
| 2. Persistensi | `src/server/db`, `src/server/repositories` | Mesin penyimpanan atomik, mutex antrean, rollback snapshot, repositori entitas |
| 3. Kendali | `src/server/controllers`, `src/app/api` | Orkestrasi validasi + mutasi, penjaga sesi admin, envelope respons |
| 4. State klien | `src/client/state` | `useAdminAction`, kunci mutasi, toast, sinkronisasi snapshot |
| 5. Presentasi | `src/components`, `src/app` | Komponen murni tanpa akses langsung ke penyimpanan |

Alur mutasi: UI memanggil hook state → `api-client` → route API → controller memvalidasi dengan Zod → repositori menulis secara atomik → respons envelope `{ ok, status, data, error, timestamp }` → hook memperbarui state, memetakan error per field, menampilkan toast, lalu memuat ulang snapshot.

## Halaman Publik

| Rute | Modul |
| --- | --- |
| `/` | 01 Ringkasan — dossier, KPI, karya unggulan, matriks 4-domain, rekomendasi |
| `/karya` | 02 Katalog — filter kategori, pencarian, tabel/grid, modal studi kasus |
| `/rekam-jejak` | 03 Rekam Jejak — linimasa, sertifikasi, distribusi stack, bagian profil LinkedIn |
| `/catatan-lab` | 04 Catatan Lab — daftar artikel dan modal pembaca |
| `/cv` | 05 CV ATS — satu halaman, cetak, salin Markdown |
| `/kontak` | 06 Kontak — formulir tervalidasi yang masuk ke kotak masuk admin |

Karena katalog dan jurnal masih kosong, `/karya` dan `/catatan-lab` menampilkan keadaan kosong yang disengaja hingga karya atau artikel asli ditambahkan.

## Modul Studio

1. Manajer Proyek (`#proyek`) — editor layar terbagi, pratinjau langsung, arsip
2. Tempat Sampah (`#sampah`) — pulihkan atau hapus permanen dengan konfirmasi slug
3. Rekam Jejak (`#rekam-jejak`) — pengalaman (jenis kerja, lokasi, mode kerja, deskripsi, keahlian) dan sertifikasi (masa berlaku, keahlian)
4. Bagian Profil (`#profil`) — bagian dan entri ala LinkedIn, dapat ditambah, diubah, diurutkan, disembunyikan, dan dihapus
5. Tech Stack (`#tech-stack`) — keahlian beserta tingkat penguasaan dan jumlah dukungan
6. Jurnal Lab (`#jurnal`) — artikel dengan slug otomatis
7. Rekomendasi (`#rekomendasi`) — testimoni dengan hubungan kerja dan sakelar tampil
8. Kotak Masuk (`#kotak-masuk`) — status baca, balas, hapus
10. Media & Sosial (`#media-sosial`) — CRUD tautan media sosial (18 platform) dan pustaka media
11. Konfigurasi (`#konfigurasi`) — identitas global (telepon, situs, alamat, unggah foto profil/sampul, kata ganti, koneksi, pengikut, Open to Work), ekspor/impor JSON, reset
12. Log Audit (`#audit`) — filter dan pencarian jejak mutasi

Palet perintah dapat dibuka dengan `Ctrl+K` / `Cmd+K` dari halaman mana pun.

### Arti angka pada sidebar

Badge di samping tiap modul **tidak selalu berisi satu angka mentah**. Untuk modul yang punya dua keadaan, badge memakai format `terisi/total` agar tidak terbaca menyesatkan. Arahkan kursor ke badge untuk melihat rinciannya sebagai tooltip.

| Modul | Badge | Arti |
| --- | --- | --- |
| Manajer Proyek | `0` | Proyek terbit + draf (arsip tidak dihitung) |
| Tempat Sampah | `6` | Proyek berstatus `ARCHIVED` |
| Rekam Jejak | `2` | Pengalaman + sertifikasi |
| Bagian Profil | `1/17` | Bagian terisi dari total bagian — **17 wadah, 1 terisi** |
| Tech Stack | `8` | Jumlah keahlian |
| Jurnal Lab | `0/4` | Artikel terbit dari total artikel — **4 artikel, semua draf** |
| Rekomendasi | `0` | Jumlah testimoni |
| Kotak Masuk | `1` | Pesan belum dibaca |
| Media & Sosial | `0` | Tautan media sosial |
| Log Audit | `403` | Jumlah catatan audit |

Bagian profil atau artikel yang kosong/draf **tidak dirender** di situs. Jadi bila badge menunjukkan `1/17`, hanya satu bagian yang muncul di `/rekam-jejak` — itu perilaku benar, bukan data hilang.

### Pemetaan ke akar skema LinkedIn

Tujuh bagian inti dipetakan langsung ke skema referensi LinkedIn, bukan ditiru dari tampilannya. Kolom di kiri adalah nama field LinkedIn, di kanan tempat penyimpanannya di proyek ini.

| Bagian | Field akar LinkedIn | Disimpan sebagai |
| --- | --- | --- |
| **Pengalaman** (Position) | `title`, `companyName`, `description`, `startMonthYear`, `endMonthYear`, `geoPositionLocation.displayLocationName` | `role`, `organization`, `description`, `startDate`, `endDate` (kosong = masih berlangsung), `location` |
| **Pendidikan** (Education) | `schoolName`, `degreeName`, `fieldsOfStudy.fieldOfStudyName`, `grade.grade`, `activities`, `notes`, `startMonthYear`, `endMonthYear` | `title`, `subtitle`, `fieldOfStudy`, `meta`, `description`, `notes`, `startDate`, `endDate` |
| **Lisensi & Sertifikasi** (Certification) | `name`, `authority`, `licenseNumber`, `startMonthYear`, `endMonthYear`, `url` | `title`, `issuer`, `credentialId`, `issueDate`, `expiryDate`, `verifyUrl` |
| **Keahlian** (Skill) | `name` (+ `endorsement` dan Top Skills) | `name`, `endorsements`, `pinned` |
| **Publikasi** (Publication) | `name`, `authors[].name`, `publisher`, `date`, `description`, `url` | `title`, `authors`, `publisher`, `startDate`, `description`, `url` |
| **Penghargaan** (Honor) | `title`, `issuer`, `issueDate`, `occupation`, `description` | `title`, `subtitle`, `startDate`, `meta`, `description` (+ `notes`) |
| **Proyek** (Project) | `title`, `description`, `members[].name`, `occupation`, `startMonthYear`, `endMonthYear`, `url` | `title`, `description`, `authors`, `subtitle`, `startDate`, `endDate`, `url` |

Perbedaan yang disengaja: LinkedIn menyimpan tanggal sebagai objek `{month, year}` dan nama sebagai `MultiLocaleString` karena mendukung banyak bahasa. Situs ini satu bahasa, jadi tanggal disimpan sebagai teks `"Feb 2023"` dan nama sebagai string biasa — struktur field-nya sama, bentuk serialisasinya lebih sederhana.

Kolom `fieldOfStudy` dan `notes` hanya muncul pada jenis bagian yang memilikinya (Pendidikan, Penghargaan), mengikuti `PROFILE_ENTRY_LABELS`. Keduanya dirender kondisional di halaman publik.

### Bagian Profil ala LinkedIn

Modul **Bagian Profil** memetakan seluruh bagian profil LinkedIn ke satu model data generik: `ProfileSection` (dengan `kind`) berisi `ProfileEntry`. **Tujuh belas jenis bagian** tersedia, mengikuti daftar resmi tombol *Add profile section* LinkedIn, masing-masing dengan label kolom sendiri (`PROFILE_ENTRY_LABELS`) dan tata letak publik otomatis (`PROFILE_SECTION_LAYOUT`: linimasa, daftar, kartu, atau unggahan).

Daftar resmi LinkedIn dan padanannya di sini:

| Kelompok LinkedIn | Bagian | Jenis di proyek |
| --- | --- | --- |
| **Core** | About | Bio pada Konfigurasi Situs |
| | Education | `EDUCATION` — Pendidikan |
| | Position | `Experience` — Pengalaman (modul 03) |
| | Services | `SERVICES` — Layanan |
| | Career break | `CAREER_BREAK` — Jeda Karier |
| | Skills | `Skill` — Keahlian (modul 05) |
| **Recommended** | Featured | `FEATURED` — Sorotan |
| | Licenses & certifications | `Certification` — Sertifikasi (modul 03) |
| | Projects | `PROJECTS` — Proyek |
| | Courses | `COURSES` — Mata Kuliah |
| | Recommendations | `Testimonial` — Rekomendasi (modul 07) |
| **Additional** | Volunteer experience | `VOLUNTEER` — Pengalaman Relawan |
| | Publications | `PUBLICATIONS` — Publikasi |
| | Patents | `PATENTS` — Paten |
| | Honors & awards | `HONORS` — Penghargaan |
| | Test scores | `TEST_SCORES` — Skor Tes |
| | Languages | `LANGUAGES` — Bahasa |
| | Organizations | `ORGANIZATIONS` — Organisasi |
| | Causes | `CAUSES` — Kepedulian |

Selain itu ada `INTERESTS` (Minat), `ACTIVITY` (Aktivitas), dan `CUSTOM` (Bagian Kustom) sebagai pelengkap — LinkedIn menampilkannya otomatis dari aktivitas akun, sedangkan di sini dapat diisi manual.

Setiap bagian maupun entri dapat diubah judulnya, digeser naik/turun, disembunyikan dari halaman publik, atau dihapus permanen. Seluruh aksi ditulis ke log audit sebagai `CREATE`, `UPDATE`, `REORDER`, atau `PURGE`.

Kolom media bersifat kondisional dan hanya dirender bila terisi:

| Kolom | Dipakai pada | Keterangan |
| --- | --- | --- |
| `logoUrl` | Pendidikan, Organisasi, Relawan, Proyek | Logo institusi tampil sebagai lencana di samping judul |
| `imageUrl` | Publikasi, Paten, Sorotan, Aktivitas, Layanan, Rekomendasi, Proyek, Kustom | Sampul publikasi, tangkapan layar proyek, atau foto kegiatan |
| `authors`, `publisher` | Publikasi, Paten, Proyek, Kustom | Ditampilkan sebagai baris penulis/penerbit |
| `fieldOfStudy`, `notes` | Pendidikan, Penghargaan | Bidang studi terpisah dari gelar; catatan tambahan terpisah dari deskripsi |

**Publikasi dan paten wajib menyertakan tautan langsung** ke dokumen aslinya. Aturan ini ditegakkan dua kali: di formulir Studio dan di repositori (`ENTRY_URL_REQUIRED`), sehingga tidak dapat dilewati lewat pemanggilan API langsung. Tautan mesin pencari (Google/Bing) ditolak karena bukan sumber publikasi.

### Keahlian Unggulan dan Rekomendasi

Meniru **Top Skills** LinkedIn, setiap keahlian punya sakelar `pinned`. Keahlian yang disematkan tampil sebagai deret "Keahlian Unggulan" di atas matriks kompetensi beranda, lengkap dengan jumlah dukungan bila ada. Jumlahnya tidak dibatasi agar Anda bebas menentukan prioritas.

Rekomendasi (modul `07`) menyimpan **foto pemberi rekomendasi** (`avatarUrl`) dan **tautan profilnya** (`profileUrl`), persis seperti rekomendasi LinkedIn. Foto tampil di samping kutipan dan tautan profil dirender sebagai "Lihat profil" — keduanya hanya muncul bila terisi.

### Media dan Media Sosial

Berkas gambar disimpan sebagai biner di `.data/media` (bukan di `public/`, yang bersifat statis setelah build) dan disajikan lewat rute `/api/v1/media/<id>`. Metadata aset tercatat di `Database.mediaAssets`.

- Unggahan memakai data URL base64; tipe MIME **dideteksi dari magic bytes**, bukan dari nama berkas atau MIME klien.
- Hanya PNG, JPEG, WebP, GIF, dan AVIF yang diterima. SVG ditolak karena dapat memuat skrip. Batas ukuran 2 MB.
- Bila pencatatan basis data gagal, berkas yang sudah ditulis dihapus kembali agar tidak ada berkas yatim.
- Rute `GET /api/v1/media/<id>` bersifat publik (dipakai `<img>` di halaman publik); mutasi tetap dijaga sesi admin.

Media sosial adalah koleksi terpisah `Database.socialLinks` dengan 18 platform (`SOCIAL_PLATFORMS`): LinkedIn, Instagram, Behance, Dribbble, GitHub, YouTube, TikTok, X, Facebook, Threads, Telegram, WhatsApp, Medium, Substack, Pinterest, Spotify, Situs Web, dan Lainnya. Setiap tautan dapat ditambah, diubah, diurutkan, disembunyikan, dan dihapus, lalu dirender kondisional di beranda, `/rekam-jejak`, dan `/kontak`.

### Kategori Kotak Masuk

Formulir publik menampilkan kategori desain: **Peluang Desain, Kolaborasi Kreatif, Produksi Media, Konsultasi Visual, Lainnya**. Nilai lama (`Peluang Rekayasa`, `Kolaborasi Riset`, `Audit Teknis`, `Diskusi Arsitektur`) tetap diterima oleh skema agar pesan lama dan berkas impor lama tidak rusak.

## Data, Cadangan, dan Audit

- Setiap penulisan memakai berkas sementara lalu `rename`, dengan salinan `.bak` dan rollback snapshot bila terjadi kegagalan.
- Berkas rusak dikarantina, lalu basis data dibangun ulang dari data seed.
- Ekspor JSON menghasilkan salinan penuh; impor memvalidasi ulang seluruh kolom sebelum menimpa basis data.
- Aksi `CREATE`, `UPDATE`, `ARCHIVE`, `RESTORE`, `PURGE`, `REORDER`, `IMPORT`, dan `RESET` dicatat permanen.
- `normalizeSortOrder()` menjaga urutan tampil selalu rapat `1..N` setelah pembuatan, penyusunan ulang, pengarsipan, dan pembersihan.

### Cadangan Sebelum Migrasi LinkedIn

Sebelum data diselaraskan, seluruh basis data lama diekspor ke:

```text
.data/backup-pre-linkedin-2026.json
```

Berkas ini memuat 6 proyek teknik, 12 keahlian, 4 pengalaman, dan konfigurasi lama (NIM `241730091`, GitHub `sulthanfajrirb`, pendidikan UPI). Gunakan **Impor Basis Data** di Studio untuk memulihkannya bila diperlukan.

Penambahan `profileSections` pada basis data live juga dicadangkan otomatis ke `.data/backup-pre-profile-sections-<timestamp>.json` sebelum migrasi. Folder `.data` diabaikan oleh Git, jadi simpan salinan berkas-berkas ini di tempat lain bila ingin menyimpannya jangka panjang.

### Perilaku Reset

**Reset Basis Data** memuat ulang data pabrik dari `src/server/db/seed.ts`. Seed tersebut kini berisi **baseline profil desain**: 2 pengalaman TVRI, 8 keahlian desain, 17 bagian profil (hanya Pendidikan yang terisi), tanpa proyek, artikel, sertifikasi, rekomendasi, tautan media sosial, atau aset media. NIM, GitHub, telepon, situs, alamat, dan foto dibiarkan kosong agar tidak mengarang data.

Reset mencatat aksi `RESET` pada log audit.

### Migrasi Media & Media Sosial

Penambahan `socialLinks`, `mediaAssets`, kolom logo/penulis/penerbit, serta dua jenis bagian profil baru (Layanan & Rekomendasi) dicadangkan otomatis ke `.data/backup-pre-media-social-<timestamp>.json` sebelum migrasi dijalankan:

```bash
node scripts/migrate-media-social.cjs
```

Skrip ini idempoten: koleksi dan kolom yang sudah ada tidak ditimpa, dan bagian baru hanya ditambahkan bila belum ada.

## Skrip

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan pada port 3000 |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run typecheck` | Pemeriksaan TypeScript tanpa emit |
| `node scripts/e2e-media-social.cjs` | Uji end-to-end media, media sosial, dan entri profil (server harus berjalan) |
| `node scripts/e2e-linkedin-parity.cjs` | Uji kesetaraan LinkedIn: Proyek, keahlian unggulan, rekomendasi berfoto |
| `node scripts/e2e-linkedin-depth.cjs` | Uji kedalaman struktur 7 bagian vs akar skema LinkedIn (tanggal terstruktur, bidang studi, catatan, posisi penghargaan) |
| `node scripts/e2e-career-break.cjs` | Uji bagian Jeda Karier dan kelengkapan 17 jenis bagian LinkedIn |
| `node scripts/e2e-studio-badge.cjs` | Uji kejujuran badge sidebar Studio dan konsistensi data dengan halaman publik |
| `node scripts/migrate-media-social.cjs` | Migrasi basis data live ke skema media & sosial |
| `node scripts/migrate-linkedin-parity.cjs` | Migrasi basis data live: bagian Proyek, foto/tautan rekomendasi, keahlian unggulan |
| `node scripts/migrate-linkedin-depth.cjs` | Migrasi basis data live: tanggal terstruktur pengalaman, bidang studi, catatan entri |
| `node scripts/migrate-career-break.cjs` | Migrasi basis data live: bagian Jeda Karier |
| `node scripts/migrate-courses.cjs` | Migrasi basis data live: bagian Mata Kuliah + urutan resmi |

## Catatan Desain

- Dua tema: Obsidian dan Warm Stone, dengan aksen oranye `#FF4F00`, hijau `#10B981`, kuning `#F59E0B`, dan merah `#EF4444`.
- Tiga tingkat tipografi: Instrument Serif (display), Inter (teks), JetBrains Mono (teknis).
- Garis rambut 1px, sudut tajam, tanpa bayangan berat, tanpa glassmorphism, dan tanpa gambar placeholder eksternal.
- Diagram arsitektur dirender sebagai SVG teknis dinamis sesuai kategori proyek. Kode kategori masih memakai nama domain lama (`REKAYASA_WEB`, `MACHINE_LEARNING`, `OTOMASI_SISTEM`, `MEDIA_KREATIF`), sedangkan label tampilannya netral: Web & Interaktif, Data & Analitik, Sistem & Alur Kerja, Media & Desain.

## Yang Perlu Dilengkapi

1. Isi **NIM / ID**, **tautan GitHub**, **telepon**, **situs web**, **alamat**, serta **foto profil/sampul** (unggah langsung, bukan URL) melalui Studio → Konfigurasi.
2. Tambahkan **tautan media sosial** asli (Instagram, Behance, LinkedIn, dst.) lewat Studio → Media & Sosial agar pengunjung dapat menjangkau akun sebenarnya.
3. Sesuaikan **tingkat keahlian** agar tidak menyisakan placeholder `75`, lalu tambahkan jumlah dukungan bila ada.
4. Lengkapi **16 bagian profil** yang masih kosong (Mata Kuliah, Bahasa, Organisasi, Penghargaan, Publikasi, Paten, Skor Tes, Relawan, Proyek, Jeda Karier, Kepedulian, Sorotan, Aktivitas, Minat, Layanan, Rekomendasi) lewat Studio → Bagian Profil. Unggah **logo institusi** pada Pendidikan, dan **tautan langsung** pada setiap Publikasi/Paten.
5. Unggah **logo instansi** pada pengalaman kerja dan **foto sertifikat** pada sertifikasi lewat Studio → Rekam Jejak.
6. Tambahkan **karya desain** dan **artikel** asli lewat Studio agar katalog serta jurnal terisi.
7. Pulihkan atau hapus permanen 6 proyek lama di Tempat Sampah setelah dipastikan tidak diperlukan.
