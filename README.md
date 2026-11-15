# Design Dossier Sulthan — Portofolio & Studio CMS

Portofolio desain grafis berbahasa Indonesia yang terhubung langsung dengan Studio CMS headless. Seluruh konten publik dibaca dari satu basis data lokal; CV dibuat terpisah oleh pemilik dan dapat diunggah sebagai PDF melalui CMS.

## Profil Dasar yang Dipulihkan

Basis data saat ini dipulihkan dari profil dasar yang masih tersedia di riwayat kode. Data CMS terbaru sebelum pengosongan—termasuk sertifikasi, artikel, foto unggahan, tautan sosial, dan perubahan lain—tidak tersedia pada cadangan yang ditemukan dan perlu dimasukkan kembali lewat Studio CMS.

Seed pemulihan berisi **2 pengalaman**, **8 keahlian**, serta **15 bagian profil** (Pendidikan terisi). Sertifikasi, artikel, tautan sosial, media, dan kotak masuk kosong.

## Teknologi

- Next.js 15.5.4 (App Router) + React 19.1 + TypeScript strict
- Zod 3.25 untuk kontrak skema dan validasi input
- CSS tunggal bertoken (`src/app/globals.css`), tanpa Tailwind
- Pengembangan lokal memakai JSON atomik; production memakai Supabase Postgres dan Supabase Storage

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

Variabel autentikasi bersifat opsional hanya untuk pengembangan lokal. Salin `.env.example` menjadi `.env.local` dan isi nilai rahasia sebelum deploy.

| Variabel | Fungsi | Nilai bawaan |
| --- | --- | --- |
| `STUDIO_ADMIN_PASSPHRASE` | Passphrase masuk studio (production: wajib, minimal 16 karakter) | `studio-2026` hanya lokal |
| `STUDIO_SESSION_SECRET` | Kunci HMAC cookie sesi (production: wajib, minimal 32 karakter) | Rahasia lokal hanya untuk development |
| `SUPABASE_URL` | URL project Supabase (production wajib) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci server-only Supabase untuk Postgres RPC dan Storage | — |
| `STUDIO_ADMIN_LABEL` | Label identitas sesi pada bilah studio | `admin@msfr.dev` |
| `PORTFOLIO_DB_PATH` | Path JSON saat Supabase tidak dipakai (lokal) | `.data/portfolio.json` |
| `MEDIA_DIR` | Folder media saat Supabase tidak dipakai (lokal) | `.data/media` |

> Jangan gunakan nilai lokal di production. Aplikasi menolak passphrase/secret yang tidak diatur atau terlalu pendek saat berjalan dalam mode production. Cookie sesi bersifat `httpOnly`, ditandatangani HMAC, dan berlaku 8 jam.

## Deploy ke Vercel + Supabase

Production menggunakan satu dokumen JSONB `portfolio_state` pada Supabase Postgres. Setiap perubahan memakai revision compare-and-swap di RPC agar mutasi paralel tidak saling menimpa. Media disimpan di bucket private Supabase Storage dan tetap disajikan lewat API situs; cache berkas dibatasi agar penghapusan tidak menetap di CDN. JSON lokal hanya fallback untuk development; Vercel menolak start bila Supabase atau rahasia admin belum dikonfigurasi.

1. Buat project Supabase dan jalankan seluruh SQL dalam `supabase/migrations/20261115000000_portfolio_storage.sql` lewat **SQL Editor**. Skrip membuat tabel ber-RLS, RPC terbatas untuk server, dan bucket media private.
2. Pada Vercel, impor repository Git dan pilih preset **Next.js**. Jangan set output standalone atau custom static build.
3. Tambahkan Environment Variables untuk Production (dan Preview bila perlu): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STUDIO_ADMIN_PASSPHRASE`, `STUDIO_SESSION_SECRET`, serta opsional `STUDIO_ADMIN_LABEL`. Ambil URL dan server-side service/secret key dari dashboard Supabase. Kunci Supabase hanya di Vercel server environment, **jangan** beri awalan `NEXT_PUBLIC_` dan jangan kirim/commit ke Git.
4. Gunakan passphrase acak minimal 16 karakter dan session secret acak minimal 32 karakter. Deploy dari Vercel. Build command standar `npm run build`, install `npm install`/`npm ci`; Node.js 20 atau lebih baru.
5. Setelah deploy, buka `/admin`, masuk dengan passphrase production, dan periksa beranda, `/cv`, `/kontak`, serta uji unggah dan hapus media. API media berjalan di Node.js runtime; unggahan foto maksimal 2 MB dan CV PDF maksimal 3 MB agar payload base64 tetap di bawah batas body request Vercel.

Database Supabase dibuat dari seed saat aplikasi pertama kali mengaksesnya. Untuk memindahkan data lokal, unduh ekspor JSON melalui **Studio → Konfigurasi** sebelum deploy, lalu impor file itu melalui CMS setelah deploy. Ekspor JSON tidak berisi biner media; unggah ulang media ke CMS. Jangan menimpa data production dengan ekspor lama setelah mulai mengedit situs.

Jangan gunakan `PORTFOLIO_DB_PATH` atau `MEDIA_DIR` sebagai penyimpanan production di Vercel: filesystem function tidak persisten. Supabase service/secret key memiliki akses administratif penuh; batasi pemakaiannya di server, aktifkan MFA pada akun, dan buat backup Supabase berkala. Perubahan key dari dashboard perlu diikuti pembaruan variable dan redeploy Vercel.

Validasi lokal: `npm run typecheck`, `npm run build`. Integrasi Supabase nyata memerlukan project URL dan key di environment lokal/Preview; jangan menaruh rahasia pada file yang di-commit.

## Arsitektur Lima Lapis

| Lapis | Lokasi | Tanggung jawab |
| --- | --- | --- |
| 1. Kontrak & skema | `src/contracts` | Tipe domain, skema Zod, sanitasi, envelope |
| 2. Persistensi | `src/server/db`, `src/server/repositories` | Supabase Postgres JSONB dengan revision compare-and-swap di production; penyimpanan JSON atomik sebagai fallback lokal; Supabase Storage untuk media production |
| 3. Kendali | `src/server/controllers`, `src/app/api` | Orkestrasi validasi + mutasi, penjaga sesi admin, envelope respons |
| 4. State klien | `src/client/state` | `useAdminAction`, kunci mutasi, toast, sinkronisasi snapshot |
| 5. Presentasi | `src/components`, `src/app` | Komponen murni tanpa akses langsung ke penyimpanan |

Alur mutasi: UI memanggil hook state → `api-client` → route API → controller memvalidasi dengan Zod → repositori menulis secara atomik → respons envelope `{ ok, status, data, error, timestamp }` → hook memperbarui state, memetakan error per field, menampilkan toast, lalu memuat ulang snapshot.

## Halaman Publik

| Rute | Modul |
| --- | --- |
| `/` | Ringkasan — dossier, linimasa pengalaman, sertifikasi, Media & Desain, dan publikasi artikel |
| `/cv` | 02 CV — menampilkan dan mengunduh PDF pribadi yang diunggah melalui Studio |
| `/kontak` | 03 Kontak — formulir tervalidasi yang masuk ke kotak masuk admin |

Katalog `/karya`, halaman Rekam Jejak, Catatan Lab, dan indikator kinerja beranda telah dihapus dari tampilan publik; alamat lama mengarah kembali ke beranda. Data katalog proyek dihapus dari basis data utama dan cadangannya. Linimasa, sertifikasi, Media & Desain, dan publikasi artikel dikelola melalui CMS. Rekomendasi lama tidak lagi ditampilkan atau dapat diubah.
Unggah atau pilih foto potret tersimpan dan unggah CV PDF melalui **Studio → Konfigurasi**. Foto langsung digunakan pada ringkasan beranda; CV ditampilkan dan dapat diunduh pada `/cv`. Situs tidak menyusun atau membuat isi CV otomatis. Artikel terbit tampil pada beranda dan dapat ditautkan ke publikasi eksternal dari CMS.

## Modul Studio

1. Pengalaman & Sertifikasi (`#rekam-jejak`) — kelola data linimasa dan sertifikasi yang ditampilkan di beranda
2. Bagian Profil (`#profil`) — bagian dan entri ala LinkedIn, dapat ditambah, diubah, diurutkan, disembunyikan, dan dihapus
3. Media & Desain (`#tech-stack`) — kelola keahlian Media & Desain
4. Publikasi Artikel (`#publikasi`) — semua artikel berstatus terbit tampil di beranda; draf hanya tersimpan di CMS
5. Kotak Masuk (`#kotak-masuk`) — status baca, balas, hapus
6. Media & Sosial (`#media-sosial`) — tautan media sosial dan pustaka media
7. Konfigurasi (`#konfigurasi`) — identitas global, unggah foto profil/sampul dan CV PDF, pengaturan bagian beranda, ekspor/impor JSON, reset
8. Log Audit (`#audit`) — filter dan pencarian jejak mutasi

Palet perintah dapat dibuka dengan `Ctrl+K` / `Cmd+K` dari halaman mana pun.

### Arti angka pada sidebar

Badge di samping tiap modul **tidak selalu berisi satu angka mentah**. Untuk modul yang punya dua keadaan, badge memakai format `terisi/total` agar tidak terbaca menyesatkan. Arahkan kursor ke badge untuk melihat rinciannya sebagai tooltip.

| Modul | Badge | Arti |
| --- | --- | --- |
| Pengalaman & Sertifikasi | `2` | Data untuk linimasa dan sertifikasi beranda |
| Bagian Profil | `1/17` | Bagian terisi dari total bagian — **17 wadah, 1 terisi** |
| Tech Stack | `8` | Jumlah keahlian |
| Publikasi Artikel | `0/4` | Artikel terbit dari total artikel |
| Kotak Masuk | `1` | Pesan belum dibaca |
| Media & Sosial | `0` | Tautan media sosial |
| Log Audit | `403` | Jumlah catatan audit |

Bagian profil atau artikel yang kosong/draf **tidak dirender** di situs. Rekam Jejak tidak lagi menjadi halaman publik terpisah; data pengalaman dan sertifikasi tetap tersedia di CMS dan bagian beranda. Artikel impor lama yang memiliki properti proyek diabaikan agar katalog yang dihapus tidak dapat muncul kembali.

### Pemetaan ke akar skema LinkedIn

Tujuh bagian inti dipetakan langsung ke skema referensi LinkedIn, bukan ditiru dari tampilannya. Kolom di kiri adalah nama field LinkedIn, di kanan tempat penyimpanannya di proyek ini.

| Bagian | Field akar LinkedIn | Disimpan sebagai |
| --- | --- | --- |
| **Pengalaman** (Position) | `title`, `companyName`, `description`, `startMonthYear`, `endMonthYear`, `geoPositionLocation.displayLocationName` | `role`, `organization`, `description`, `startDate`, `endDate` (kosong = masih berlangsung), `location` |
| **Pendidikan** (Education) | `schoolName`, `degreeName`, `fieldsOfStudy.fieldOfStudyName`, `grade.grade`, `activities`, `notes`, `startMonthYear`, `endMonthYear` | `title`, `subtitle`, `fieldOfStudy`, `meta`, `description`, `notes`, `startDate`, `endDate` |
| **Lisensi & Sertifikasi** (Certification) | `name`, `authority`, `licenseNumber`, `startMonthYear`, `endMonthYear` | `title`, `issuer`, `credentialId`, `issueDate`, `expiryDate`, foto lampiran |
| **Keahlian** (Skill) | `name` (+ `endorsement` dan Top Skills) | `name`, `endorsements`, `pinned` |
| **Publikasi** (Publication) | `name`, `authors[].name`, `publisher`, `date`, `description`, `url` | `title`, `authors`, `publisher`, `startDate`, `description`, `url` |
| **Penghargaan** (Honor) | `title`, `issuer`, `issueDate`, `occupation`, `description` | `title`, `subtitle`, `startDate`, `meta`, `description` (+ `notes`) |

Perbedaan yang disengaja: LinkedIn menyimpan tanggal sebagai objek `{month, year}` dan nama sebagai `MultiLocaleString` karena mendukung banyak bahasa. Situs ini satu bahasa, jadi tanggal disimpan sebagai teks `"Feb 2023"` dan nama sebagai string biasa — struktur field-nya sama, bentuk serialisasinya lebih sederhana.

Kolom `fieldOfStudy` dan `notes` hanya muncul pada jenis bagian yang memilikinya (Pendidikan, Penghargaan), mengikuti `PROFILE_ENTRY_LABELS`. Keduanya dirender kondisional di halaman publik.

### Bagian Profil ala LinkedIn

Modul **Bagian Profil** memetakan bagian profil ke satu model data generik: `ProfileSection` (dengan `kind`) berisi `ProfileEntry`. **Enam belas jenis aktif** tersedia, termasuk bagian kustom, dengan label kolom sendiri (`PROFILE_ENTRY_LABELS`) dan tata letak publik otomatis (`PROFILE_SECTION_LAYOUT`: linimasa, daftar, kartu, atau unggahan). Jenis Proyek dan Rekomendasi telah dihapus.

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
| | Courses | `COURSES` — Mata Kuliah |
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
| `logoUrl` | Pendidikan, Organisasi, Relawan | Logo institusi tampil sebagai lencana di samping judul |
| `imageUrl` | Publikasi, Paten, Sorotan, Aktivitas, Layanan, Kustom | Sampul publikasi atau foto kegiatan |
| `authors`, `publisher` | Publikasi, Paten, Kustom | Ditampilkan sebagai baris penulis/penerbit |
| `fieldOfStudy`, `notes` | Pendidikan, Penghargaan | Bidang studi terpisah dari gelar; catatan tambahan terpisah dari deskripsi |

**Publikasi dan paten wajib menyertakan tautan langsung** ke dokumen aslinya. Aturan ini ditegakkan dua kali: di formulir Studio dan di repositori (`ENTRY_URL_REQUIRED`), sehingga tidak dapat dilewati lewat pemanggilan API langsung. Tautan mesin pencari (Google/Bing) ditolak karena bukan sumber publikasi.

### Keahlian Unggulan dan Rekomendasi

Meniru **Top Skills** LinkedIn, setiap keahlian punya sakelar `pinned`. Keahlian yang disematkan tampil sebagai deret "Keahlian Unggulan" di atas matriks kompetensi beranda, lengkap dengan jumlah dukungan bila ada. Jumlahnya tidak dibatasi agar Anda bebas menentukan prioritas.

Data rekomendasi lama, bagian Proyek, dan konfigurasi fitur yang sudah dihapus dipurge dari basis data, ekspor, serta cadangan JSON lokal saat aplikasi melakukan migrasi.

### Media dan Media Sosial

Berkas gambar disimpan sebagai biner di `.data/media` (bukan di `public/`, yang bersifat statis setelah build) dan disajikan lewat rute `/api/v1/media/<id>`. Metadata aset tercatat di `Database.mediaAssets`.

- Lampiran sertifikasi berupa foto/hasil pindai yang diunggah lewat kolom **Foto Lampiran Sertifikat**. URL tidak digunakan untuk melampirkan sertifikat.
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

Cadangan historis tidak digunakan untuk pemulihan lewat CMS; data fitur yang sudah dihapus dipurge otomatis saat aplikasi dimulai.

Penambahan `profileSections` pada basis data live juga dicadangkan otomatis ke `.data/backup-pre-profile-sections-<timestamp>.json` sebelum migrasi. Folder `.data` diabaikan oleh Git, jadi simpan salinan berkas-berkas ini di tempat lain bila ingin menyimpannya jangka panjang.

### Perilaku Reset

**Reset Basis Data** memulihkan profil dasar yang tersedia di `src/server/db/seed.ts`.

Reset mencatat aksi `RESET` pada log audit.

### Migrasi Media & Media Sosial

Penambahan `socialLinks`, `mediaAssets`, kolom logo/penulis/penerbit, serta bagian Layanan dicadangkan otomatis ke `.data/backup-pre-media-social-<timestamp>.json` sebelum migrasi dijalankan. Cadangan sudah dibersihkan dari data bagian yang dihapus:

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
| `node scripts/e2e-linkedin-parity.cjs` | Uji kesetaraan LinkedIn: penghapusan bagian lama dan keahlian unggulan |
| `node scripts/e2e-linkedin-depth.cjs` | Uji kedalaman struktur 7 bagian vs akar skema LinkedIn (tanggal terstruktur, bidang studi, catatan, posisi penghargaan) |
| `node scripts/e2e-career-break.cjs` | Uji bagian Jeda Karier dan kelengkapan 15 bagian profil |
| `node scripts/e2e-studio-badge.cjs` | Uji kejujuran badge sidebar Studio dan konsistensi data dengan halaman publik |
| `node scripts/e2e-integrasi-studio-web.cjs` | Uji integrasi menyeluruh: setiap data Studio wajib muncul di halaman publik yang tepat |
| `node scripts/e2e-field-parity.cjs` | Uji parity 160 titik: setiap field CMS (termasuk modal) terkirim ke browser |
| `node scripts/migrate-media-social.cjs` | Migrasi basis data live ke skema media & sosial |
| `node scripts/migrate-linkedin-parity.cjs` | Migrasi basis data live: purge bagian lama dan keahlian unggulan |
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
4. Lengkapi **14 bagian profil** yang masih kosong (Mata Kuliah, Bahasa, Organisasi, Penghargaan, Publikasi, Paten, Skor Tes, Relawan, Jeda Karier, Kepedulian, Sorotan, Aktivitas, Minat, Layanan) lewat Studio → Bagian Profil. Unggah **logo institusi** pada Pendidikan, dan **tautan langsung** pada setiap Publikasi/Paten.
5. Unggah **logo instansi** pada pengalaman kerja dan **foto sertifikat** pada sertifikasi lewat Studio → Pengalaman & Sertifikasi.
6. Tambahkan **karya desain** dan **artikel** asli lewat Studio; tautkan URL publikasi pada artikel agar tombolnya membuka sumber tersebut.
