# Desain UI/UX: Mindo

Spesifikasi antarmuka Mindo. Visual memakai tema Minimalist Neon / Ambient Tech. Fungsi mengikuti `PRD.md`. Struktur data mengikuti `architecture.md`.

Terakhir diperbarui: 29 Oktober 2026.

---

## 1. Konsep

Satu alur, tiga hasil. User membuka halaman, menempel API key sekali, menaruh rekaman, lalu mendapat ringkasan, peta konsep, dan flashcard.

- **Atmosfer**: Clean Ambient Tech. Kertas off-white dengan pendaran neon lembut di balik elemen utama.
- **Kepadatan**: Aplikasi harian. Satu area kerja, bukan bento kartu sejajar.
- **Varians**: Rendah sampai sedang. Hero asimetris, area kerja simetris.
- **Gerak**: Tertahan. Hanya transisi yang menjelaskan perubahan state.

Yang dijual bukan animasi, tapi waktu yang dihemat. Layar pertama harus langsung menunjukkan aksi.

---

## 2. Warna

| Token | Nilai | Dipakai untuk |
|---|---|---|
| Canvas | `#FCFCFC` | Latar halaman |
| Surface | `#FFFFFF` | Kartu, panel, input |
| Lime | `#53F16F` | CTA utama, segmen tab aktif, status sukses |
| Lime Hover | `#47CD5E` | Latar tombol Lime saat hover (kontras cukup jelas, teks tetap Ink) |
| Cyan | `#40D9FF` | Logo, tombol Tanya Mindo, chip timestamp |
| Ink | `#111827` | Judul dan teks utama |
| Muted | `#6B7280` | Teks sekunder, metadata |
| Grid | `rgba(225, 231, 239, 0.7)` | Pola garis 16 px |
| Border | `rgba(17, 24, 39, 0.08)` | Garis 1 px pemisah |
| Danger | `#DC2626` | Error, hapus data |
| Glow Lime | `rgba(83, 241, 111, 0.35)` | Pendaran di balik hero |
| Glow Cyan | `rgba(64, 217, 255, 0.30)` | Pendaran di balik hero |

Aturan pemakaian:

- Lime dan Cyan hanya untuk latar elemen, bukan warna teks. Teks di atas keduanya selalu Ink.
- Putih di atas Cyan `#40D9FF` kontras 1,6:1, gagal AA. Putih di atas Lime juga gagal. Jangan pernah dipakai untuk teks.
- Teks muted `#6B7280` di atas Canvas `#FCFCFC` kontras 4,8:1, lolos AA untuk teks normal.
- Ink di atas Lime kontras 12,6:1, di atas Cyan 10,4:1. Aman untuk label tombol.
- Glow hanya dekoratif. Tidak boleh jadi satu-satunya penanda state, dan tidak boleh dipasang pada elemen interaktif.

---

## 3. Tipografi

| Peran | Font | Ukuran | Berat | Lainnya |
|---|---|---|---|---|
| Display | Geist | `clamp(2rem, 5vw, 3.5rem)` | 600 | `letter-spacing: -0.03em`, `line-height: 1.05` |
| Judul bagian | Geist | 1.5 rem | 600 | `-0.02em`, 1.2 |
| Subjudul | Geist | 1.125 rem | 500 | 1.35 |
| Body | Geist | 1 rem | 400 | 1.65, lebar maks 65 karakter |
| Kecil | Geist | 0.875 rem | 400 | 1.5, warna Muted |
| Angka dan waktu | Geist Mono | 0.8125 rem | 500 | `tabular-nums`, untuk durasi, timestamp, progres kartu |
| Tombol | Geist | 0.9375 rem | 500 | Tanpa huruf kapital semua |

- Fallback: `Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` dan `Geist Mono, ui-monospace, SFMono-Regular, monospace`.
- Inter tidak dipakai. Font serif tidak dipakai.
- Semua ukuran body minimal 14 px. Di bawah itu hanya metadata Mono.

---

## 4. Geometri dan jarak

| Token | Nilai |
|---|---|
| Radius kartu | 28 px |
| Radius kartu kecil | 16 px |
| Radius kontrol | 9999 px (pill) |
| Lebar isi maks | 1120 px |
| Padding kartu | 32 px, turun ke 20 px di bawah 640 px |
| Skala jarak | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| Jarak antar bagian | `clamp(3rem, 8vw, 6rem)` |
| Tinggi navbar | 72 px |
| Panel Tanya Mindo | 360 px, tetap di bawah 1024 px |
| Kolom riwayat desktop | 280 px |

Grid latar:

- Pola garis 16 x 16 px, warna Grid, hanya terlihat di dua area (pojok kiri atas dan kanan bawah) lewat `mask-image` radial; bagian tengah halaman bersih supaya konten tetap terbaca.
- Dipasang di `body::before` sebagai `background-image` linear-gradient ganda, bukan elemen tambahan.

---

## 5. Breakpoint

| Nama | Rentang | Perubahan |
|---|---|---|
| Mobile | 360 sampai 767 px | Satu kolom. Panel chat jadi drawer. Navbar jadi logo plus tombol menu |
| Tablet | 768 sampai 1023 px | Dua kolom untuk kartu hasil. Panel chat masih drawer |
| Desktop | 1024 px ke atas | Sidebar riwayat 280 px muncul, panel chat 360 px menetap |

Tidak ada scroll horizontal di semua rentang. Uji di 360 px dan 1440 px.

---

## 6. Gerak

| Kejadian | Durasi | Easing |
|---|---|---|
| Hover tombol | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Tekan tombol | 80 ms | translasi Y -1 px, lalu kembali |
| Ganti tab | 180 ms | opacity plus translasi 8 px |
| Panel chat buka | 240 ms | `cubic-bezier(0.16, 1, 0.3, 1)`, translasi X |
| Baris riwayat masuk | 240 ms | selang 40 ms antar baris |
| Denyut tahap berjalan | 1400 ms | `ease-in-out`, tak terbatas |
| Skeleton | 1600 ms | kilau bergerak, tak terbatas |

Aturan:

- Hanya `transform` dan `opacity` yang dianimasikan. Tidak ada animasi lebar, tinggi, atau posisi.
- `prefers-reduced-motion: reduce` mematikan semua denyut, kilau, dan selang. Transisi jadi 0 ms, state tetap terlihat.
- Tidak ada animasi yang harus selesai sebelum konten bisa dibaca.

---

## 7. Aksesibilitas

| Aturan | Nilai |
|---|---|
| Kontras teks | Minimal 4,5:1 untuk teks normal, 3:1 untuk teks besar dan ikon |
| Target sentuh | Minimal 44 x 44 px, termasuk ikon kecil |
| Focus ring | `outline: 3px solid #40D9FF`, `outline-offset: 3px`, tidak pernah dihapus |
| Urutan fokus | Mengikuti urutan baca, tidak melompat |
| Label | Setiap tombol ikon punya `aria-label` berbahasa Indonesia |
| Status hidup | Progres pemrosesan memakai `aria-live="polite"`, error memakai `aria-live="assertive"` |
| Flashcard | Tombol panah kiri dan kanan berfungsi, tidak hanya swipe |
| Drag and drop | Selalu ada tombol pilih file sebagai alternatif |
| Zoom | Layout tetap utuh pada zoom 200 persen |

---

## 8. Layar

Semua layar rute tunggal. ID materi lewat query string.

| Layar | Rute | Isi |
|---|---|---|
| Beranda | `/` | Navbar, hero, dropzone, riwayat ringkas |
| Pemrosesan | `/processing?id=` | Empat tahap terpisah |
| Materi | `/material?id=` | Tab Ringkasan, Peta Konsep, Flashcard, panel Tanya Mindo |
| Transkrip | `/material?id=&view=transcript` | Daftar segmen |
| Rekaman | `/recording` | Rekam langsung |
| Pengaturan | `/settings` | Provider, API key, uji koneksi, hapus data |

### 8.1 Navbar

Berlaku di semua layar. Tinggi 72 px, latar Surface dengan border bawah 1 px.

- Kiri: ikon gelombang Cyan plus kata MINDO, ukuran 24 px, Ink.
- Tengah, desktop saja: tautan Cara Kerja, Privasi, Riwayat. Warna Muted, Ink saat aktif.
- Kanan: badge status penyimpanan lokal, lalu tombol pill API Key.
  - API key belum diisi: pill berlatar Surface, border 1 px, teks "Atur API Key".
  - API key sudah tersimpan: pill berlatar Lime tipis dengan titik hijau, teks "API Key Aktif".
  - API key gagal diuji: titik merah, teks "API Key Bermasalah".
- Mobile: tengah dan kanan dilipat ke tombol menu 44 x 44 px.

### 8.2 Beranda

Hero asimetris, teks kiri, dropzone kanan. Di bawah 1024 px turun jadi satu kolom.

Teks:

- Display: "1 rekaman, 3 bahan ajar."
- Subjudul, maks 60 karakter per baris: "Ubah rekaman kuliah jadi ringkasan, mindmap, dan flashcard. Diproses di perangkat Anda, tanpa akun."
- Satu baris Muted kecil: format yang diterima dan batas 25 MB.

Kartu dropzone:

- Latar Surface, radius 28 px, padding 32 px, glow Lime dan Cyan sebagai lapisan di belakangnya.
- Area drop setinggi minimal 200 px, border putus-putus 1 px warna Border, radius 16 px.
- Saat file diseret ke atasnya: border jadi Lime, latar Lime 6 persen.
- Dua aksi di dalam: tombol "Pilih File" dan tombol sekunder "Rekam Langsung" berikon mikrofon.
- Di bawah dropzone: input API key berbentuk pill, tombol lihat kunci, dan indikator status.
- CTA utama: pill Lime penuh, teks Ink, "Mulai Proses". Nonaktif sampai ada file dan API key valid, dengan alasan tertulis di bawahnya, bukan hanya tombol abu-abu.

Riwayat ringkas:

- Di bawah hero, jarak `clamp(3rem, 8vw, 6rem)`.
- Judul bagian dan tautan "Lihat semua".
- Desktop: tiga baris terakhir dalam daftar. Mobile: dua baris.
- Tiap baris: judul, tanggal, durasi Mono, tombol hapus.
- Kosong: satu kalimat "Belum ada materi. Rekaman pertama Anda akan muncul di sini." tanpa ilustrasi besar.

### 8.3 Pemrosesan

Kartu tunggal di tengah, lebar maks 640 px.

- Kepala: nama file, ukuran, durasi, semuanya Mono untuk angka.
- Empat baris tahap: Transkrip, Ringkasan, Peta Konsep, Flashcard.
- Tiap baris punya tiga keadaan:
  - Menunggu: ikon lingkaran kosong, teks Muted.
  - Berjalan: ikon berdenyut Lime, label "Sedang diproses".
  - Selesai: ikon centang Lime, waktu selesai.
  - Gagal: ikon seru Danger, satu kalimat alasan, tombol "Coba lagi" khusus tahap itu.
- Bawah: tombol "Batal" bergaya outline. Batal menghentikan request berjalan, hasil yang sudah selesai tetap tersimpan.
- Baris ringkasan, peta konsep, dan flashcard berjalan bersamaan setelah transkrip selesai, jadi jangan tampilkan sebagai antrean.
- Seluruh daftar memakai `aria-live="polite"`.

### 8.4 Materi

Susunan desktop: sidebar riwayat 280 px, area kerja fleksibel, panel chat 360 px. Di bawah 1024 px: switcher tab, area kerja, tombol Tanya Mindo mengambang.

Kepala area kerja:

- Judul materi, tanggal, durasi. Judul bisa diedit langsung, klik lalu ketik, simpan saat blur atau Enter. Escape membatalkan.
- Tombol ikon: buka transkrip, ekspor, menu hapus.
- Switcher pill tiga segmen: Ringkasan, Peta Konsep, Flashcard. Segmen aktif berlatar Lime dengan teks Ink, dua lainnya berlatar Surface dengan teks Muted.

Tab Ringkasan:

- Kartu Surface radius 28 px.
- Bagian berurutan, tiap bagian punya judul dan poin.
- Istilah kunci tampil sebagai chip pill kecil berlatar Lime 12 persen. Diklik, chip mengisi kotak Tanya Mindo dan memfokuskan input.
- Markdown yang dirender dari JSON, bukan teks bebas. Tidak ada heading level satu karena judul sudah ada di kepala.

Tab Peta Konsep:

- Kanvas di dalam kartu, bisa digeser dan di-zoom.
- Kontrol zoom di pojok: plus, minus, muat ulang tampilan.
- Tombol ekspor PNG di kepala tab.
- Di bawah 768 px, sediakan tampilan daftar bertingkat sebagai alternatif karena kanvas sempit sulit dipakai.
- Fokus keyboard memindah antar simpul, Enter membuka cabang.

Tab Flashcard:

- Satu kartu putih di tengah, radius 28 px, tinggi tetap supaya tidak melompat saat dibalik.
- Ketuk atau Enter membalik.
- Bawah kartu: dua tombol "Ulang" dan "Paham", plus progres Mono "7 / 15".
- Panah kiri berarti Ulang, panah kanan berarti Paham.
- Setelah kartu terakhir, layar ringkas: jumlah paham, jumlah ulang, tombol "Ulangi yang salah".
- Progres disimpan per kartu di IndexedDB, bertahan setelah refresh.

Kosong dan gagal:

- Ringkasan gagal sendiri tidak mengosongkan tab lain.
- Tab yang gagal menampilkan satu kalimat dan tombol "Buat ulang bagian ini".

### 8.5 Tanya Mindo

Bukan tab keempat.

Desktop: panel kanan 360 px, menetap, selalu terbuka.

Mobile: tombol bulat Cyan 56 px di kanan bawah, membuka drawer setinggi 85 persen.

Isi:

- Riwayat pesan user dan tutor.
- Jawaban tutor menampilkan chip waktu Cyan, misalnya `05:12`. Klik memutar audio dari detik itu dan menggulir transkrip ke segmen yang sama.
- Jawaban untuk topik yang tidak ada di rekaman tampil berbeda: latar Surface dengan border Danger tipis dan teks "Tidak dibahas dalam rekaman ini". Bukan gaya jawaban biasa.
- Chip pertanyaan saran di atas input saat percakapan masih kosong.
- Input di bawah, pill, tetap bisa diketik saat jawaban sedang dibuat.
- Tombol kirim 44 x 44 px.

### 8.6 Transkrip

Dibuka dari kepala materi, bukan tab kelima.

- Satu segmen satu baris, waktu Mono di kiri, teks di kanan.
- Tombol putar per segmen.
- Segmen yang sedang diputar ditandai latar Lime 8 persen.
- Ekspor Markdown.
- Segmen bisa dikoreksi manual.

### 8.7 Rekaman

- Judul, indikator volume bergerak, dan waktu berjalan Mono.
- Tombol utama besar: Rekam, lalu Stop.
- Setelah stop: durasi, ukuran file, tombol Putar Ulang, tombol Pakai Rekaman Ini, tombol Hapus.
- Peringatan muncul saat ukuran melewati 20 MB, bukan setelah 25 MB gagal.
- Izin mikrofon ditolak: satu kalimat penjelasan dan cara memperbaikinya di browser.

### 8.8 Pengaturan

- Provider utama: Groq (disarankan) dan OpenAI. Kartu pilihan, bukan dropdown.
- Opsi lanjut tertutup: Gemini, Claude, DeepSeek, Ollama. Dibuka lewat tautan "Provider lain".
- Input API key bertipe password dengan tombol lihat.
- Tombol Uji Koneksi menampilkan tiga hasil: berhasil dengan waktu respons, kunci ditolak, jaringan gagal. Tidak ada spinner tanpa akhir.
- Batas 25 MB dan sisa kuota free tier ditampilkan apa adanya.
- Hapus semua data: dialog yang menyebut yang hilang, termasuk API key, riwayat, dan transkrip.

---

## 9. State wajib

| State | Aturan |
|---|---|
| Kosong | Satu kalimat sebab plus aksi yang relevan. Tanpa ilustrasi besar |
| Memuat | Skeleton dengan ukuran sama seperti konten asli. Spinner tidak dipakai sendirian |
| Gagal | Alasan dalam bahasa user plus satu aksi. Kode error mentah tidak ditampilkan |
| Sebagian gagal | Tahap yang sukses tetap terlihat, tahap gagal punya tombol ulang sendiri |
| Offline | Bilah atas "Koneksi terputus. Pemrosesan dijeda." |

---

## 10. Keputusan yang berbeda dari PRD

| PRD | Keputusan UI | Alasan |
|---|---|---|
| Empat tab termasuk Tanya Mindo | Tiga tab, Tanya Mindo jadi panel | Tutor dipakai sambil membaca, bukan halaman terpisah |
| Dashboard sebagai layar utama setelah landing | Beranda dan daftar materi jadi satu halaman | Tidak ada login, tidak perlu dua layar |
| Pengaturan sebagai langkah wajib sebelum upload | Input API key langsung di dropzone, pengaturan tetap ada | Menghapus satu perpindahan layar |
| Rute `/material/[id]` | `/material?id=` | Static export menolak dynamic route tanpa `generateStaticParams` |
| Satu materi per rekaman | Tidak ada gabung beberapa rekaman ke satu materi | v1 fokus alur upload sampai review. Judul materi yang bisa diedit sudah cukup untuk memisahkan pertemuan. Gabung rekaman menyentuh skema transkrip, pipeline regenerasi, dan penanganan gagal, jadi ditunda ke v1.1 |

---

## 11. Yang tidak boleh

- Border hitam tebal atau bayangan bergaya brutalisme.
- Sidebar folder bertingkat, avatar profil, atau menu bergaya enterprise.
- Tab keempat untuk chat.
- Teks putih di atas Lime atau Cyan.
- Glow sebagai satu-satunya penanda state aktif.
- Tiga kartu fitur sejajar dengan ukuran sama.
- Teks gradient pada judul.
- Emoji dekoratif di judul atau tombol.
- Spinner sebagai satu-satunya state memuat.
- Angka karangan seperti "99 persen akurat" tanpa bukti.
- API key ditulis di dalam repo.
- Menghapus Pengaturan, Pemrosesan, Rekaman, atau Transkrip karena tidak masuk desain awal.
