# Pitch Deck: Mindo

Versi siap tempel. Ikuti urutan 9 slide sesuai format Final Project UKM Software Development PENS
2026. Setiap slide punya isi teks, saran visual, dan naskah lisan.

- Target durasi: 6 menit presentasi, 4 menit tanya jawab.
- Placeholder yang harus diganti ditandai `[ISI ...]`.
- Bagian yang butuh bukti/angka ditandai `[BUTUH DATA]`. Jangan diisi angka karangan.
- Bahan mentah lengkap ada di `bahan-mentah.md`. Naskah terpisah ada di `naskah-60-detik.md`.

---

## Slide 1: Opening

**Judul**

MINDO

**Subjudul**

Dari rekaman kuliah jadi paham.

**Footer**

Final Project UKM Software Development PENS 2026
[Nama Tim] - [Anggota 1], [Anggota 2], [Anggota 3]

**Visual**

- Latar `#FCFCFC`.
- Logo Mindo di tengah, ukuran besar.
- Satu maskot Mindo di sudut kanan bawah, ukuran kecil, tidak menutupi teks.
- Satu garis aksen hijau `#53F16F` di bawah logo.
- Tanpa foto stok, tanpa ilustrasi buku, tanpa grafis otak.

**Naskah (20 detik)**

> Selamat pagi. Kami dari tim [Nama Tim]. Setiap kuliah, kami pulang membawa rekaman dua jam
> yang tidak pernah kami dengar lagi. Mindo lahir dari kebiasaan itu.

---

## Slide 2: Project Introduction

**Judul**

Mindo: asisten belajar dari rekaman kuliah

**Isi**

- **Apa:** aplikasi web yang mengubah audio atau video kuliah menjadi bahan belajar.
- **Hasil:** transkrip, ringkasan, peta konsep, flashcard, dan Tutor AI.
- **Untuk:** mahasiswa yang sudah merekam kuliah, tapi tidak pernah memutarnya lagi.
- **Tagline:** "Dari suara dosen jadi paham, sekali klik."
- **Tim:**
  - Hustler: [Nama], [peran singkat]
  - Hipster: [Nama], [peran singkat]
  - Hacker: [Nama], [peran singkat]

**Visual**

- Kiri: logo dan tagline.
- Kanan: mockup browser berisi halaman utama Mindo.
- Bawah: tiga kartu kecil berisi nama dan peran, ikon sederhana, tanpa foto stok.

**Naskah (35 detik)**

> Mindo adalah asisten belajar untuk mahasiswa. Rekaman kuliah masuk, keluar empat bahan:
> transkrip, ringkasan, peta konsep, dan flashcard. Ada juga Tutor AI yang bisa ditanya
> seputar rekaman itu. Tim kami tiga orang: [sebut peran dalam satu frasa masing-masing].

---

## Slide 3: Problem Background dan Target User

**Judul**

Rekamannya ada. Yang tidak ada: waktu untuk memutarnya lagi.

**Masalah (pilih 3, jangan 4)**

1. Kuliah dua jam menghasilkan rekaman dua jam. Mendengarkan ulang butuh dua jam. Itu bukan
   belajar, itu memutar waktu.
2. Catatan saat kuliah sibuk menulis, bukan memahami. Ide yang tidak sempat ditulis hilang.
3. Rekaman kuliah berisi materi yang tidak semestinya dititipkan ke server pihak ketiga.

**Akibatnya**

- Rekaman menumpuk di galeri, tidak pernah dibuka.
- Belajar jadi menebak bagian mana yang penting.

**Target user**

- **Utama:** mahasiswa S1, 18 sampai 24 SKS, aktif di banyak mata kuliah, sudah biasa merekam.
- **Momen:** 30 menit setelah pulang kampus, sudah capek, butuh bahan siap pakai.
- **Butuh:** "Saya mau bahan belajar yang bisa saya pakai lagi dalam 15 menit, tanpa merangkai
  sendiri."

**Bukti**

- `[BUTUH DATA]` 3 kutipan singkat dari wawancara atau pengamatan, maksimal satu baris tiap
  kutipan.
- Kalau wawancara belum sempat: ganti bagian ini dengan catatan jujur "hipotesis awal kami, belum
  divalidasi", dan letakkan sebagai rencana pengujian di Slide 8. Jangan tampilkan angka survei
  yang tidak ada.

**Visual**

- Kiri: tiga baris masalah dengan ikon.
- Kanan: kartu persona.
- Bila ada: dua sampai tiga kutipan wawancara dalam kartu kecil, ukuran teks 16pt ke atas.

**Naskah (45 detik)**

> Masalahnya bukan tidak punya materi. Masalahnya materi sudah ada, tapi mahal untuk dibuka
> lagi. Rekaman dua jam menuntut dua jam mendengarkan. Mahasiswa akhirnya mencatat buru-buru di
> kelas, lalu rekaman tetap ada di galeri tanpa pernah diputar. Mindo menargetkan mahasiswa yang
> sudah merekam, tapi belum pernah memanfaatkan rekamannya.

---

## Slide 4: Proposed Solution dan Innovation

**Judul**

Rekaman masuk. Empat bahan belajar keluar.

**Solusi**

```
Upload atau rekam
      |
      v
Transkrip ber-timestamp
      |
      +----> Ringkasan terstruktur
      +----> Peta konsep interaktif
      +----> Flashcard
      +----> Tutor AI dengan sitasi
```

**Fitur pembeda**

| Fitur | Otter dan Notta | Quizlet | Mindo |
|---|---|---|---|
| Hasil | transkrip | kartu | 4 bahan sekaligus |
| Dari sumber asli | ya | tidak | ya |
| Jawaban menunjuk detik rekaman | tidak | tidak | ya |
| Beberapa rekaman dalam satu materi | terbatas | tidak | ya, tambah bagian atau gabung materi |
| Akun | wajib | wajib | tidak ada |
| Data disimpan di mana | server mereka | server mereka | browser user |

Jangan menjadikan tabel ini sebagai kartu "kami lebih baik". Sebut saja barisnya saat bicara,
kalau ditanya.

**Inovasi**

1. **Local-first, bukan cloud-first.** Tidak ada server data. Audio, transkrip, dan hasil
   tersimpan di IndexedDB browser. Ekspor ZIP untuk pindah perangkat.
2. **BYOK.** Tidak ada langganan platform. User memilih provider sendiri dan membayar sesuai
   pemakaian, atau nol biaya dengan free tier Groq.
3. **Empat bentuk belajar sekaligus.** Bukan empat aplikasi. Transkripsi, ringkasan, peta konsep,
   flashcard, dan tutor semuanya berasal dari transkrip yang sama.
4. **Tutor yang mengaku tidak tahu.** Jawaban wajib bersitasi timestamp. Kalau tidak ada di
   rekaman, Tutor AI bilang tidak dibahas.
5. **Banyak rekaman, satu materi.** Satu mata kuliah sering punya beberapa sesi. Pengguna bisa
   menambah rekaman susulan tanpa mengulang transkripsi lama, atau menggabungkan materi lama jadi
   satu. Tiap rekaman tetap utuh sebagai bagian sendiri, pemutar berpindah berkas otomatis.

**Visual**

- Diagram dua lapis: kiri "satu input", kanan "empat output" dengan garis panah.
- Jangan pakai tabel kompetitor penuh di slide. Cukup tiga kolom pendek.
- Highlight dua kata: `local-first` dan `BYOK`.
- Kalau ada ruang, satu baris kecil di bawah: "bisa beberapa rekaman per materi".

**Naskah (60 detik)**

> Kalau transkripsi saja, itu sudah banyak. Yang Mindo lakukan tambahan: hasil transkrip diolah
> jadi ringkasan, peta konsep, flashcard, dan tutor yang bisa ditanya. Semua dari satu rekaman,
> jadi semua merujuk ke materi yang sama. Dan arsitekturnya sengaja dibalik: bukan data mahasiswa
> yang naik ke cloud kami, tapi proses yang turun ke browser mahasiswa. Satu materi juga tidak
> harus satu file: rekaman susulan bisa ditambahkan, dan beberapa materi bisa digabung tanpa
> mentranskripsi ulang.

---

## Slide 5: Product Design dan User Flow

**Judul**

Dari file ke pemahaman, dalam satu alur.

**User flow**

```
Buka Mindo
  -> Pengaturan: pilih provider, tempel API key (sekali)
  -> Dasbor: Upload file atau Rekam
  -> Processing: Transkrip -> Ringkasan + Peta Konsep + Flashcard (paralel)
  -> Halaman materi: 3 tab + transkrip + panel tutor
     Ringkasan | Peta Konsep | Flashcard   (Transkrip lewat tombol, Tutor lewat panel)
  -> Belajar: swipe kartu, tanya tutor, buka timestamp
  -> Tambah rekaman: berkas baru ditranskripsi, tiga hasil diperbarui
  -> Riwayat: Gabungkan rekaman, pilih 2 materi atau lebih
  -> Ekspor: Markdown atau PNG, atau ZIP untuk pindah perangkat
```

**Screenshot wajib (3 saja)**

1. Halaman dasbor dengan drop zone, tombol rekam, dan "Gabungkan rekaman".
2. Halaman processing dengan empat tahap.
3. Halaman materi, tab Peta Konsep atau panel Tutor dengan sitasi timestamp.

Kalau masih ada ruang di lampiran, tambahkan dialog "Tambah rekaman" dan banner hasil basi.
Sisanya letakkan di lampiran. Slide ini untuk menunjukkan bahwa produknya nyata, bukan untuk
dibaca.

**Prinsip desain yang dipakai**

- Tanpa akun: tidak ada layar registrasi di antara user dan tugasnya.
- Satu area kerja, bukan kumpulan kartu.
- Tiap layar data punya tiga kondisi: kosong, memuat, gagal. Gagal punya aksi ulang.
- Gagal satu tahap tidak mengulang tahap yang sudah selesai.
- Saat transkrip bertambah, hasil lama ditandai basi sampai ketiganya dibuat ulang.
- Kontras minimal AA, target sentuh 44 px, semua kontrol bisa dipakai keyboard.
- Gerak hanya saat menjelaskan perubahan state.

**Visual**

- Alur di atas digambar sebagai diagram horizontal dengan 5 node.
- Tiga screenshot di bawahnya, ukuran sama, diberi label 1, 2, 3.
- Gunakan sudut kartu 28 px, konsisten dengan produk.

**Naskah (60 detik)**

> Alurnya sengaja pendek. Pengaturan cuma sekali di awal. Setelah itu, buka, taruh file, tunggu,
> lalu masuk ke ruang belajar. Di dalamnya ada tiga cara memandang materi yang sama, plus transkrip
> dan tutor. Pengguna bisa membaca, melihat hubungan, menguji diri, atau bertanya. Kalau ada
> rekaman susulan, tambahkan saja; yang ditranskripsi hanya bagian baru. Kuncinya: kalau satu
> tahap gagal, tahap lain yang sudah selesai tidak hilang.

---

## Slide 6: AI Integration dan System Logic

**Judul**

Empat agen, satu transkrip, tanpa server data.

**AI yang dipakai**

| Fungsi | Teknologi | Kenapa |
|---|---|---|
| Transkripsi | Whisper `large-v3` lewat Groq, atau `whisper-1` lewat OpenAI | Akurasi Bahasa Indonesia dan istilah teknis |
| Ringkasan | LLM (`gpt-oss-120b`, `gpt-4o-mini`, `llama3.1`) | Output terstruktur, bukan teks bebas |
| Peta konsep | LLM yang sama, skema hierarki 3 level | Hasil bisa dirender, tidak asal poin |
| Flashcard | LLM yang sama, skema kartu | Konsisten: tanya, jawab, level, timestamp |
| Tutor AI | BM25 lokal + LLM | Tidak butuh embedding, jawaban bisa disitasi |

**Alur AI: Input, Processing, Model, Output**

```
[Audio/Video 25 MB per berkas]
      |
      v  di browser
[Satu baris sources per bagian, offset dihitung]
      |
      v
[Ekstrak + kirim ke provider]
      |
      v
[Whisper]  -> segmen {start, end, text}, digeser offset
      |
      +--> [LLM] -> ringkasan (JSON) -> Zod -> IndexedDB
      +--> [LLM] -> mindmap (JSON)   -> Zod -> IndexedDB
      +--> [LLM] -> flashcard (JSON) -> Zod -> IndexedDB
      |
      v
[Chunking] -> [BM25] -> Tutor AI -> jawaban + timestamp
```

**Arsitektur**

```
Browser mahasiswa
  Next.js 16 (static export, React 19)
  Dexie / IndexedDB: materials, sources (audio + offset), transcripts,
                     summaries, mindmaps, flashcards, chunks
  BM25 lokal untuk pencarian
        |
        | HTTPS langsung, tanpa server perantara
        v
  Provider AI pilihan user
  Groq | OpenAI | Gemini | OpenRouter | DeepSeek | Ollama
```

**Penjelasan teknis singkat**

- Tidak ada backend. Tidak ada API route yang menyimpan data.
- Satu materi bisa punya beberapa bagian. Tiap bagian punya berkas audio sendiri dan `offset` di
  satu timeline. Pemutar memilih berkas yang tepat saat pengguna melompat ke detik tertentu.
- Tambah rekaman: hanya bagian baru yang dikirim ke Whisper, lalu segmennya disambung ke transkrip
  lama dan ketiga output dibuat ulang. Banner "hasil basi" menandai hasil yang belum diperbarui.
- Gabung materi: transkrip tersimpan disalin dengan offset baru, tanpa transkripsi ulang. Materi
  asli tidak diubah dan audionya disalin ke materi baru.
- Tiga agen teks berjalan paralel setelah transkripsi (`Promise.all`).
- Semua output divalidasi Zod sebelum masuk database.
- Tutor AI mencari 5 chunk terbaik, menambahkan chunk sebelum dan sesudahnya, lalu melarang model
  memakai pengetahuan luar. Chunk tidak menyeberangi batas bagian. Field `found` dan `citations`
  memaksa kejujuran.
- Retrieval memakai BM25 buatan sendiri, bukan vector database. Untuk satu materi, ini cukup dan
  nol biaya.

**Visual**

- Satu diagram arsitektur dua kolom: kiri browser, kanan provider.
- Satu pita alur input, processing, model, output.
- Jangan campur keduanya dalam satu slide padat. Pilih diagram arsitektur, alur ditulis sebagai
  empat baris.

**Naskah (70 detik)**

> Kami tidak melatih model. Kami merangkai model yang sudah baik untuk tugas yang sempit. Audio
> pergi ke Whisper. Hasilnya dipecah, lalu tiga agen diminta mengisi skema JSON: ringkasan, peta
> konsep, dan kartu. Skema itu divalidasi sebelum disimpan, jadi kalau model mengarang format,
> kita menolak, bukan menampilkan sampah. Untuk tutor, kami mencari potongan transkrip dengan
> BM25, lalu memaksa model menjawab dari potongan itu dan menyebut detiknya. Kalau tidak ada,
> dia harus bilang tidak ada. Satu materi boleh punya beberapa bagian audio; yang menentukan
> bagian mana yang diputar adalah offset, bukan satu file gabungan.

---

## Slide 7: Implementation, Demo, dan Validation

**Judul**

Sudah jalan. Sekarang kita ukur seberapa berguna.

**Demo (3 menit, urutan pasti)**

1. Halaman Pengaturan: tunjukkan Groq dan tombol uji koneksi. API key tidak ditampilkan.
2. Dasbor: unggah satu file contoh yang sudah disiapkan, bukan file baru.
3. Processing: tunjukkan empat tahap berjalan dan tiga agen paralel.
4. Halaman materi: buka Ringkasan, lalu Peta Konsep, lalu Flashcard.
5. Panel Tutor: ajukan satu pertanyaan yang jawabannya ada, tunjukkan timestamp. Lalu satu
   pertanyaan yang tidak ada, tunjukkan jawaban jujur bahwa tidak dibahas.
6. Tambah rekaman: tunjukkan dialognya, jelaskan hanya bagian baru yang ditranskripsi, lalu
   tampilkan banner hasil basi. Jangan tunggu proses selesai di panggung.
7. Dasbor: tunjukkan "Gabungkan rekaman", pilih dua materi, jelaskan aslinya tidak berubah.
8. Ekspor ZIP, tunjukkan isi file berisi beberapa audio bagian.
9. Tutup browser, buka lagi, tunjukkan materi masih ada.

**Rencana cadangan**

- Rekaman demo 60 sampai 90 detik sudah disiapkan sebelum hari H.
- Satu materi yang sudah diproses penuh, jadi tidak perlu menunggu jaringan.
- Satu materi dengan dua bagian dan banner basi sudah disiapkan, kalau proses tambah rekaman
  terlalu lama untuk ditunggu.
- Video layar 3 menit sebagai cadangan kalau jaringan ruangan buruk.
- Jangan pernah demo dengan file 20 MB baru di panggung.

**Status verifikasi**

| Yang diuji | Hasil | Bukti |
|---|---|---|
| Target versi Next 16.4.6 | lulus | `next --version` |
| Type check | lulus | `tsc --noEmit` |
| Lint | lulus | `eslint` |
| Build produksi | lulus | `next build` |
| Kerentanan dependensi produksi | 0 | `npm audit --omit=dev` |
| Waktu proses 5 menit audio | `[BUTUH DATA]` | Ukur 3 kali, ambil median |
| Jumlah flashcard per rekaman | `[BUTUH DATA]` | Hitung di 3 materi |
| Akurasi transkrip | belum diukur | Butuh 5 rekaman berlabel |
| Timeline multi-bagian | lulus | `node src/lib/timeline.check.mts`, 7/7 |

**Validation plan (kalau data belum ada, slide ini menjelaskan caranya)**

- 5 wawancara mahasiswa: apakah pernah merekam, apakah pernah memutar ulang, kenapa berhenti.
- Uji tugas: beri satu rekaman 10 menit, minta membuat bahan belajar. Catat waktu dan hasil.
- Uji retensi kecil: 10 mahasiswa, pre-test dan post-test, bandingkan dengan kelompok yang hanya
  membaca transkrip mentah.
- Ukur biaya nyata per kuliah dari dashboard provider. Tanpa ini, klaim murah hanya opini.

**Visual**

- Kiri: tabel status verifikasi dengan tanda centang.
- Kanan: satu tangkapan layar halaman processing.
- Jangan taruh metrik karangan. Lebih baik satu sel bertuliskan "belum diukur" daripada angka
  yang tidak bisa dipertahankan saat ditanya.

**Naskah (55 detik)**

> Yang sudah bisa kami buktikan hari ini: produknya berjalan, build-nya bersih, dan tidak ada
> kerentanan di dependensi produksi. Yang belum kami ukur: seberapa besar penghematan waktu dan
> seberapa akurat ringkasan di mata mahasiswa. Kami sengaja tidak menampilkan angka itu, karena
> kami belum mengukurnya. Rencana pengukurannya ada di slide ini.

---

## Slide 8: Innovation Impact dan Roadmap

**Judul**

Belajar yang tidak menitipkan data.

**Dampak**

| Untuk | Dampak |
|---|---|
| Mahasiswa | Rekaman yang sudah ada berubah jadi bahan belajar dalam satu sesi |
| Mahasiswa dengan banyak sesi | Rekaman susulan ditambahkan tanpa mengulang transkripsi lama, atau beberapa materi digabung jadi satu |
| Mahasiswa hemat | Nol biaya platform, cukup free tier provider |
| Privasi | Tidak ada akun, tidak ada server data, tidak ada profil belajar yang dijual |
| Kampus | Audio tidak disimpan di server kampus atau server kami, hanya dikirim ke provider yang dipilih mahasiswa |

**Nilai pembeda**

1. **Bukan transkripsi, tapi jalur belajar.** Outputnya dipakai untuk recall, bukan dibaca sekali.
2. **Local-first yang sungguhan.** Bukan sekadar jargon: tidak ada database, tidak ada API
   penyimpanan.
3. **Biaya tidak menempel di platform.** BYOK memindahkan biaya ke pemakai, dalam jumlah kecil dan
   transparan.
4. **Jujur saat tidak tahu.** Tutor menyitasi detik, dan menolak menjawab di luar rekaman.

**Roadmap**

| Fase | Isi | Ukuran selesai |
|---|---|---|
| Sekarang | Fase 1: upload, rekam, transkrip, 4 output, tambah rekaman, gabung materi, ekspor ZIP | Bisa dipakai harian |
| Berikutnya | Validasi pengguna, ukur akurasi dan waktu, perbaiki alur onboarding API key | 5 wawancara, 3 metrik terukur |
| Berikutnya | Urutkan bagian sendiri, map-reduce untuk transkrip sangat panjang | Bisa atur urutan tanpa materi baru |
| Fase 2 | Transkripsi lokal via Whisper WebGPU, 100 persen offline | Tanpa koneksi, tanpa API key |
| Fase 2 | Sinkronisasi antar perangkat tanpa server (WebRTC atau file) | 2 perangkat, 1 materi |
| Fase 3 | Integrasi slide kuliah, cocokkan timestamp dengan halaman | Rekaman dan slide sejajar |
| Fase 3 | Paket kampus, kelola kuota bersama | 1 program studi |

Jangan menyebut tanggal yang belum dihitung. Fase dan ukuran selesai lebih aman daripada
"Q3 2027".

**Visual**

- Kiri: tiga kartu dampak.
- Kanan: roadmap satu garis horizontal dengan 4 titik.
- Titik pertama diberi warna hijau `#53F16F` dan label "sekarang".

**Naskah (50 detik)**

> Dampak terbesar Mindo bukan di fiturnya, tapi di keputusan arsitekturnya. Kami tidak menyimpan
> data, jadi tidak ada yang bisa bocor. Kami tidak menjual langganan, jadi tidak ada tekanan
> untuk menahan fitur. Ke depan, arah kami satu: membuat transkripsi berjalan di perangkat
> sendiri, supaya Mindo bisa dipakai tanpa internet dan tanpa API key.

---

## Slide 9: Closing

**Judul**

Mindo: dari rekaman, jadi paham.

**Isi**

- Tagline
- QR ke demo `[ISI QR/LINK]`
- Repo `[ISI LINK]`
- Kontak `[ISI EMAIL/IG]`
- Nama tim dan anggota
- Ucapan terima kasih

**Visual**

- Latar bersih, logo, satu baris tagline.
- QR code ukuran cukup besar untuk dipindai dari kursi juri.
- Jangan ada bullet panjang. Ini penutup, bukan ringkasan.

**Naskah (20 detik)**

> Mindo membuat rekaman kuliah berhenti jadi file mati. Terima kasih. Kami siap menjawab
> pertanyaan.

---

# Slide cadangan: Mindo dan NotebookLM

Jangan taruh di urutan utama. Jangan tampilkan tanpa ditanya. Sembilan slide utama sudah penuh,
dan membandingkan diri dengan produk Google tanpa diminta membuat juri ikut membandingkan.

Buka slide ini hanya kalau muncul pertanyaan "bedanya dengan NotebookLM apa" atau "kenapa tidak
pakai NotebookLM saja". Kalau tidak ada proyektor, jawab lisan saja, 20 detik, tanpa membuka file.

---

## Slide C1: Dua jalur, bukan dua peringkat

**Judul**

Sumber yang sama, pemegang yang berbeda.

**Isi (tabel dua kolom, tanpa logo NotebookLM)**

| | NotebookLM | Mindo |
|---|---|---|
| Sumber | PDF, web, YouTube, audio, Docs | Rekaman kuliah, audio dan video |
| Akun | Wajib akun Google | Tidak ada |
| Data | Tersimpan di akun Google | Tinggal di browser perangkat |
| Model | Gemini, ditentukan Google | 6 provider, dipilih user |
| Hasil | Terikat notebook dan akun | Markdown, PNG, ZIP, bisa diimpor balik |
| Kematangan | Produk jadi, model kelas atas | Proyek kampus, fokus satu alur |

**Naskah (20 detik)**

> NotebookLM menyimpan sumber di akun Google dan memakai Gemini. Mindo tidak punya akun dan tidak
> punya server data: rekaman tinggal di browser, modelnya dipilih sendiri. Untuk meringkas PDF,
> NotebookLM lebih baik. Bedanya di siapa yang memegang rekaman.

**Aturan penyampaian**

- Sebut keunggulan NotebookLM lebih dulu, minimal satu. Itu yang membuat sisa jawaban dipercaya.
- Jangan bilang "lebih aman". Bilang "tidak ada data di kami untuk bocor".
- Jangan bandingkan kualitas model. Kalau ditanya, jawab: "Gemini lebih kuat, dan itu bukan
  pertarungan kami."
- Kalau juri terus menekan, tutup dengan batasan yang diakui: "Mindo butuh API key. Itu friksi
  terbesar kami, dan kami tahu."

## Slide C2: Kalau ditanya "kenapa tidak pakai NotebookLM saja?"

Cukup satu kalimat, tanpa slide:

> "Untuk banyak orang, jawabannya memang NotebookLM. Mindo untuk rekaman kuliah yang tidak mau
> diunggah ke akun, dan untuk bahan belajar yang ingin jadi file milik sendiri."

---

# Checklist sebelum presentasi

## Konten

- [ ] Nama tim, anggota, dan peran sudah diisi, bukan `[ISI]`.
- [ ] Semua angka diberi label "target" atau hasil ukur, tidak ada yang ambigu.
- [ ] Bagian "belum diukur" sudah disiapkan jawabannya secara lisan.
- [ ] Satu kalimat tagline dipilih dan dipakai konsisten di semua slide.
- [ ] Tidak ada klaim "100 persen offline", "gratis selamanya", atau "akurat 95 persen".
- [ ] Tidak ada klaim "audio gabungan jadi satu file" atau "gabung menghemat penyimpanan".
- [ ] Sumber data pihak ketiga (batas free tier, harga) dicek ulang di hari presentasi.
- [ ] Jawaban soal gabung/tambah rekaman sudah dilatih: tanpa transkripsi ulang, audio tetap
      terpisah, urutan otomatis, materi asli tidak berubah.

## Teknis

- [ ] Demo memakai file yang sudah disiapkan, durasi 60 sampai 90 detik.
- [ ] Materi contoh sudah diproses penuh sebelum naik panggung.
- [ ] Materi kedua dan dialog gabung sudah disiapkan, supaya bagian gabung tidak dibuat mendadak.
- [ ] Satu materi dengan dua bagian dan banner basi tersedia sebagai cadangan demo tambah rekaman.
- [ ] API key aktif dan kuotanya masih ada. Siapkan satu cadangan.
- [ ] Video cadangan 3 menit tersimpan lokal, bukan di cloud.
- [ ] Repo dan build diuji dari commit terakhir, bukan dari working tree.
- [ ] `.next` dan `node_modules` tidak ikut presentasi sebagai bukti apa pun.

## Desain slide

- [ ] Latar `#FCFCFC`, teks `#111827`, aksen `#53F16F`.
- [ ] Tanpa font serif.
- [ ] Sudut kartu 28 px, kontrol berbentuk pil.
- [ ] Ukuran teks isi minimal 20pt untuk proyektor.
- [ ] Satu slide satu gagasan. Kalau ada dua judul, pecah.
- [ ] Grafik diberi label satuan dan sumber.
- [ ] Screenshot diberi bingkai tipis dan keterangan, bukan ditempel mentah.
- [ ] Kontras teks minimal AA, termasuk teks hijau di atas putih.

## Latihan

- [ ] Timing 6 menit diukur dengan stopwatch, bukan perkiraan.
- [ ] Setiap anggota tahu bagian mana yang dia ambil.
- [ ] Transisi antar pembicara ditulis, tidak mengandalkan "eh, lanjut ya".
- [ ] Jawaban untuk 16 pertanyaan di `bahan-mentah.md` bagian 14 dilatih lisan.
- [ ] Simulasi gangguan: internet mati, API key gagal, proyektor 4:3.
