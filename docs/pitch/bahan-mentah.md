# Bahan Mentah Pitch Deck: Mindo

Dokumen ini bukan presentasi. Ini kumpulan fakta yang bisa dipotong, ditempel, dan ditulis ulang
sesuka hati untuk pitch deck. Semua klaim diberi label sumber supaya tidak ada angka karangan.

Terakhir disusun: 19 November 2026
Sumber utama: `PRD.md`, `design.md`, `architecture.md`, `ai-agents.md`, dan kode di `src/`.

---

## 0. Cara pakai

1. Baca bagian 13 (pemetaan ke format PENS). Itu menentukan slide mana butuh bahan apa.
2. Ambil hanya bagian yang relevan. Dokumen ini sengaja tidak rapi secara naratif.
3. Jangan pakai kalimat berlabel `[HIPOTESIS]` atau `[BELUM ADA]` sebagai klaim di depan juri.
   Pakai sebagai rencana validasi, atau jangan dipakai sama sekali.
4. Semua `[ISI NAMA]`, `[ISI ANGKA]`, `[ISI LINK]` wajib diganti sebelum presentasi.

### Arti label

| Label | Arti |
|---|---|
| `[KODE]` | Ada bukti di source code repo ini. Aman diklaim. |
| `[PRD]` | Tertulis di PRD. Bisa diklaim, tapi sebaiknya dicek apakah sudah jalan. |
| `[TARGET]` | Angka target di PRD. Belum tentu tercapai. Jangan bilang "hasil". |
| `[HIPOTESIS]` | Belum diuji ke pengguna. Boleh jadi latar belakang, jangan jadi bukti. |
| `[BELUM ADA]` | Tidak ada di repo. Jangan diklaim ada. |

---

## 1. Identitas

| Field | Isi | Label |
|---|---|---|
| Nama produk | Mindo | `[PRD]` |
| Asal nama | Mind + Audio | `[PRD]` |
| Tagline PRD | "Dari suara dosen jadi paham, sekali klik." | `[PRD]` |
| Tagline alternatif | "Ubah rekaman kuliah jadi ringkasan, mindmap, dan tutor AI." | usulan |
| Tagline alternatif 2 | "Learn smarter, not longer." | usulan |
| Tema final project | Smart Student Productivity (Tema 1) | `[PRD]` |
| Fokus AI | Speech-to-Text, LLM generation, retrieval-augmented QA | `[PRD]` |
| Model akses | Tanpa login, local-first, BYOK (Bring Your Own Key) | `[KODE]` |
| Status | Fase 1 selesai (MVP berjalan), siap Fase 2 | `[PRD]` |
| Nama tim | [ISI NAMA TIM] | `[ISI]` |
| Anggota | [ISI NAMA] | `[ISI]` |
| Hustler | [ISI NAMA] | `[ISI]` |
| Hipster | [ISI NAMA] | `[ISI]` |
| Hacker | [ISI NAMA] | `[ISI]` |
| Demo | [ISI LINK] | `[ISI]` |
| Repo | [ISI LINK] | `[ISI]` |

---

## 2. Kalimat siap pakai

**Satu kalimat (tagline):**
Mindo mengubah rekaman kuliah menjadi ringkasan, peta konsep, flashcard, dan tutor AI yang
menjawab hanya dari rekaman itu.

**Satu paragraf (deskripsi):**
Mindo adalah aplikasi web asisten belajar untuk mahasiswa. Pengguna mengunggah rekaman audio atau
video kuliah, atau merekam langsung dari browser. Mindo mentranskripsinya, lalu menghasilkan
ringkasan terstruktur, peta konsep interaktif, dan bank flashcard. Beberapa rekaman bisa disatukan
dalam satu materi: tambahkan bagian baru, atau gabungkan materi lama jadi satu. Ada juga Tutor AI
yang menjawab pertanyaan berdasarkan transkrip yang sama dan menyertakan timestamp sebagai rujukan.
Tidak ada akun, tidak ada server penyimpanan, dan tidak ada langganan platform. Materi tersimpan
di browser pengguna, dan biaya AI dibayar langsung ke provider yang dipilih lewat API key sendiri.

**Elevator 30 detik:**
Setiap kuliah dua jam, mahasiswa pulang dengan file rekaman yang tidak pernah didengar ulang.
Mendengarkannya butuh dua jam lagi, dan itu tetap belajar pasif. Mindo memotong jalur itu: rekaman
masuk, keluar ringkasan, mindmap, flashcard, dan tutor AI. Prosesnya di browser, datanya tidak
pernah dikirim ke server kami, dan tidak butuh akun. Mahasiswa cuma perlu satu API key gratis dari
Groq.

---

## 3. Problem

Empat masalah dari PRD, status bukti apa adanya.

| No | Masalah | Status | Bukti yang tersedia |
|---|---|---|---|
| 1 | Konteks hilang saat mencatat. Mahasiswa menulis, bukan memahami. | `[HIPOTESIS]` | Observasi umum, belum ada catatan wawancara |
| 2 | Review pasca-kuliah mahal. Rangkuman, mindmap, flashcard buatan sendiri makan waktu lama. | `[HIPOTESIS]` | Belum ada data waktu |
| 3 | Transkrip bukan belajar. Notulensi menghasilkan teks panjang, tidak ada yang memaksa materi dipakai ulang. | `[HIPOTESIS]` | Belum ada data |
| 4 | Enggan menitipkan rekaman. Rekaman kuliah bisa berisi materi yang tidak ingin disimpan pihak ketiga. | `[PRD]` | Belum ada data |

Catatan penting: **PRD sendiri menyatakan poin 1 sampai 3 belum diuji**. Sebelum presentasi,
Hustler perlu 5 wawancara singkat. Kalau tidak sempat, di slide cukup sebut "hipotesis awal",
jangan sebut "hasil survei".

**Konsekuensi yang bisa dijelaskan tanpa data:**
- Rekaman 2 jam butuh 2 jam untuk didengarkan ulang. Tidak ada cara mempercepat selain transkripsi.
- Transkrip mentah tidak membantu ujian. Yang dibutuhkan recall aktif: ringkasan, peta konsep,
  pertanyaan berulang.
- Tool populer mensyaratkan akun dan menyimpan audio di server mereka. Untuk materi kuliah,
  itu keputusan menyerahkan data yang harusnya bisa dihindari.

---

## 4. Target user

| Field | Isi | Label |
|---|---|---|
| Persona utama | Mahasiswa S1, 18 sampai 24 SKS, aktif di lebih dari satu mata kuliah | `[PRD]` |
| Job to be done | "Setelah kuliah selesai, saya mau punya bahan belajar yang bisa saya pakai lagi dalam 15 menit, tanpa harus merangkai sendiri." | `[PRD]` |
| Momen pakai | Sekitar 30 menit setelah pulang kampus, di laptop, sudah setengah capek | `[PRD]` |
| Frekuensi sesi | Sesi pendek, sering di HP, kadang di laptop | `[PRD]` |
| Perilaku kunci | Sudah merekam kuliah, tapi rekaman tidak pernah dibuka lagi | `[HIPOTESIS]` |
| Segmen sekunder | Asisten lab, peserta riset, mahasiswa kelas daring | usulan, butuh validasi |
| Prodi prioritas | Yang sarat materi lisan: hukum, kedokteran, teknik, ekonomi | usulan, butuh validasi |

**Wedge awal yang paling bisa dipertahankan:** mahasiswa yang sudah punya kebiasaan merekam
kuliah. Bukan mengajari orang merekam, tapi membuat rekaman yang sudah ada jadi berguna.

---

## 5. Solusi

Alur inti. Satu input, empat output.

```
Rekaman (upload atau mic browser)
    |
    v
Transkrip ber-timestamp (Whisper)
    |
    +---> Ringkasan terstruktur
    +---> Peta konsep (mindmap)
    +---> Flashcard
    +---> Tutor AI (retrieval dari chunk transkrip)
```

Sejak fitur multi-rekaman, satu materi bisa berisi beberapa berkas audio. Tiap berkas menjadi
"bagian" dengan titik mulai (`offset`) di satu timeline. Pemutar memilih berkas yang tepat saat
pengguna melompat ke detik tertentu. Tidak ada penggabungan file audio jadi satu berkas.

Dua cara menambah bagian:

| Cara | Yang terjadi | Transkripsi baru? |
|---|---|---|
| Tambah rekaman ke materi | Satu berkas baru masuk sebagai bagian terakhir, transkripnya disambung, tiga output teks dibuat ulang | Hanya berkas baru |
| Gabungkan materi | Beberapa materi digabung jadi materi baru, urut dari yang terlama, transkrip lama disalin dengan offset | Tidak ada |

Materi asli tidak diubah pada kedua cara. Materi gabungan menyimpan salinan audio tiap bagian,
jadi pemakaian penyimpanan browser bertambah. Menggabung tidak memicu transkripsi baru, tapi tiga
output teks tetap dibuat ulang dari transkrip gabungan, jadi kuota teks provider terpakai.

| Output | Bentuk | Bisa diekspor? |
|---|---|---|
| Transkrip | Segmen dengan waktu mulai dan selesai, dikelompokkan per bagian | Markdown |
| Ringkasan | Judul, 5 sampai 10 bagian, poin, istilah kunci | Markdown |
| Peta konsep | Node hierarki maksimal 3 level, interaktif (zoom/pan) | PNG |
| Flashcard | Pertanyaan, jawaban, tingkat kesulitan, timestamp rujukan | Markdown |
| Tutor AI | Jawaban plus sitasi timestamp | Tidak diekspor, hanya sesi |
| Seluruh materi | Satu bundel | ZIP (ekspor dan impor) |

Catatan: ZIP export/import ada di `src/lib/export/bundle.ts` dan `src/lib/export/import.ts`.
Versi 2 menyertakan daftar `sources` beserta audionya. Impor masih menerima versi 1, dan baris
sumber untuk arsip lama dibuat saat materi pertama dibuka. Bentuk ZIP inilah yang dipakai untuk
pindah perangkat, jadi klaim "local storage, multi device" harus dijelaskan sebagai **manual
pindah lewat file**, bukan sinkronisasi otomatis.

---

## 6. Fitur aktual

Ini daftar fitur yang ada di kode. Urut dari yang paling terlihat saat demo.

| Fitur | Status | Target acceptance | Bukti |
|---|---|---|---|
| Upload audio/video | Ada | mp3, m4a, wav, webm, mp4, maks 25 MB | FR-01, `page.tsx` |
| Rekam langsung dari browser | Ada | webm opus, mono, sekitar 24 kbps | FR-02 |
| Transkripsi Bahasa Indonesia | Ada | `language=id`, timestamp per segmen | FR-03 |
| Ringkasan terstruktur | Ada | judul, 5 sampai 10 bagian, poin, istilah | FR-04 |
| Peta konsep | Ada | 3 level, zoom/pan, ekspor PNG | FR-05 |
| Flashcard | Ada | pertanyaan, jawaban, difficulty, timestamp | FR-06 |
| Mode belajar flashcard | Ada | swipe kiri ulang, kanan paham, progres tersimpan | FR-07, key `grade` di DB |
| Tutor AI | Ada | retrieval BM25, sitasi timestamp, jujur kalau tidak ada | FR-08, `src/lib/retrieval/bm25.ts` |
| Riwayat materi lokal | Ada | daftar, buka, hapus, ubah judul | FR-09 |
| Gabung materi | Ada | pilih minimal 2 materi, urut terlama, materi baru, asli tidak diubah | `sources.ts` |
| Tambah rekaman ke materi | Ada | hanya berkas baru ditranskripsi, tiga output diperbarui | `material/page.tsx` |
| Penanda hasil basi | Ada | banner dan tombol perbarui setelah transkrip bertambah | `timeline.ts` |
| Pemutar multi-bagian | Ada | lompat ke detik absolut, berkas dipilih otomatis | `timeline.ts` |
| Pengaturan provider | Ada | 6 provider, API key lokal, tombol uji koneksi | FR-10, `providers.ts` |
| Ekspor | Ada | PNG mindmap, Markdown ringkasan/flashcard/transkrip, ZIP | FR-11 |
| Impor ZIP | Ada | pindah materi antar perangkat | `export/import.ts` |
| Hapus data | Ada | konfirmasi, termasuk API key | FR-12 |
| Retry per tahap | Ada | gagal satu tahap tidak mengulang tahap sukses | `processing/page.tsx` |
| Tanpa login | Ada | tidak ada auth sama sekali | `[KODE]` |
| Maskot interaktif | Ada | kursor dan reaksi, `page-mascot` | `src/app` |

Yang belum ada:
- Login, akun, dashboard multi-user. `[BELUM ADA]`
- Sinkronisasi otomatis antar perangkat. `[BELUM ADA]`
- Kolaborasi flashcard. `[BELUM ADA]`
- On-device inference lewat WebGPU. `[BELUM ADA]`
- Ekspor PDF. `[BELUM ADA]`
- Aplikasi mobile native. `[BELUM ADA]`
- Menyatukan beberapa bagian audio jadi satu file. Pemutar berpindah berkas per bagian. `[BELUM ADA]`
- Mengatur sendiri urutan bagian saat menggabung. Sekarang urut dari materi terlama. `[BELUM ADA]`
- Deteksi bagian yang tumpang tindih atau duplikat. `[BELUM ADA]`
- Map-reduce untuk transkrip yang melewati context window model. `[BELUM ADA]`

---

## 7. AI stack

### Provider

| Provider | Label | Transkripsi | Model teks | Biaya | Catatan |
|---|---|---|---|---|---|
| Groq | Default | `whisper-large-v3` | `openai/gpt-oss-120b`, `gpt-oss-20b` | Free tier permanen | Tanpa kartu kredit, 8 jam audio/hari |
| OpenAI | Kualitas tinggi | `whisper-1` | `gpt-4o-mini` | Bayar per pakai | Saldo harus diisi |
| Gemini | Teks saja | Tidak | `gemini-2.5-flash`, `flash-lite` | Free tier + bayar | Data free tier dipakai Google |
| OpenRouter | Teks saja | Tidak | `llama-3.3-70b-instruct:free` | Free + bayar | 20 req/menit, 50/hari di model gratis |
| DeepSeek | Teks saja | Tidak | `deepseek-flash` | Bayar | Off-peak lebih murah |
| Ollama | Lokal | Tidak | `llama3.1` | Gratis | Jalan di laptop, tanpa key |

Penting untuk slide AI: **v1 hanya mendukung transkripsi lewat Groq dan OpenAI.** Empat provider
lain untuk teks saja. Kalau ditanya "bisa offline penuh?", jawabannya belum: Ollama menghilangkan
biaya dan server untuk teks, tapi transkripsi tetap perlu Groq atau OpenAI.

### Alur pemrosesan

1. File di ekstrak di sisi klien. Tidak ada upload ke server Mindo.
2. Transkripsi: audio dikirim langsung ke endpoint provider yang dipilih. Hasil disimpan sebagai
   segmen `{ start, end, text }` milik satu bagian, lalu digeser sebesar `offset` bagian itu.
3. Saat menambah rekaman ke materi yang sudah ada, hanya berkas baru yang dikirim ke provider.
   Segmen bagian baru disambung ke transkrip lama, lalu tiga agen teks dijalankan ulang dari
   transkrip lengkap.
4. Saat menggabungkan beberapa materi, tidak ada transkripsi baru. Transkrip tersimpan disalin
   dengan offset baru ke materi hasil gabungan.
5. Setelah transkrip lengkap, tiga agen teks dijalankan **paralel** dengan `Promise.all`:
   ringkasan, peta konsep, flashcard. Ini sesuai NFR-02.
6. Untuk Tutor AI, transkrip dipotong jadi chunk, disimpan di IndexedDB, lalu dicari dengan
   **BM25** yang diimplementasikan sendiri (`src/lib/retrieval/bm25.ts`), bukan embedding.
   - Chunk tidak menyeberangi batas bagian.
   - Ambil maksimal 5 chunk terbaik.
   - Sertakan chunk sebelum dan sesudahnya sebagai konteks.
   - Kalau pertanyaan bersifat menyeluruh ("poin utama", "istilah tersulit", "bagian akhir"),
     ambil 12 chunk yang tersebar merata.
   - Kalau tidak ada bukti di konteks, model wajib menjawab `found: false` dan bilang topik itu
     tidak dibahas di rekaman.
7. Output model divalidasi dengan skema Zod (`src/lib/ai/schema.ts`). JSON rusak ditolak, bukan
   dipasang diam-diam.
8. Hasil ditulis ke IndexedDB lewat Dexie (`src/lib/db.ts`). API key disimpan lokal, tidak pernah
   dikirim ke domain Mindo.

### Kenapa pilihan ini

| Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|
| Whisper API | Akurasi Bahasa Indonesia dan istilah teknis jauh di atas Web Speech API | Web Speech API gratisan, tapi sering salah istilah |
| Groq sebagai default | Free tier permanen tanpa kartu kredit, latency rendah | OpenAI, bayar di depan |
| BYOK | Nol biaya server, user pegang kendali kuota dan data | Key milik kami, risiko biaya dan penyalahgunaan |
| Tanpa backend | Tidak ada data untuk disimpan, tidak ada tagihan hosting | Server + database, lebih mahal dan lebih berisiko |
| BM25 bukan embedding | Ringan, jalan di browser, tanpa biaya embedding, cukup untuk satu materi | Vector DB, butuh server dan biaya |
| IndexedDB | Data bertahan tanpa akun, ukuran cukup untuk audio | localStorage, batas 5 MB |

---

## 8. Data dan privasi

| Pertanyaan | Jawaban | Bukti |
|---|---|---|
| Di mana audio disimpan? | IndexedDB browser, tabel `sources`, field `audio` (Blob) per bagian, plus `offset` di timeline | `db.ts`, `sources.ts` |
| Apakah materi lama tetap kompatibel? | Ya. Materi tanpa baris `sources` dibuatkan satu bagian saat pertama dibuka; audio lamanya tidak dipindahkan | `ensureSources` |
| Apakah audio digabung jadi satu file? | Tidak. Tiap bagian tetap berkas terpisah, pemutar berpindah berkas | `timeline.ts` |
| Apakah menggabung materi menyalin audio? | Ya, materi gabungan menyimpan salinan tiap bagian supaya materi asli tetap utuh | `mergeMaterials` |
| Apakah audio dikirim ke server Mindo? | Tidak. Mindo tidak punya backend. | `architecture.md`, tidak ada API route |
| Ke mana audio pergi? | Langsung ke endpoint provider transkripsi yang dipilih, dan hanya untuk bagian yang belum punya transkrip | `src/lib/ai/client.ts` |
| Di mana API key disimpan? | Lokal di browser | `src/lib/storage/settings.ts` |
| Apakah ada akun? | Tidak | `[KODE]` |
| Apakah ada tracking? | Vercel Analytics dan Speed Insights | `package.json` |
| Bagaimana pindah perangkat? | Ekspor ZIP versi 2, termasuk audio per bagian, impor di perangkat baru | `export/bundle.ts`, `export/import.ts` |
| Bagaimana hapus data? | Satu tombol dengan konfirmasi, termasuk API key; menghapus materi ikut menghapus semua bagiannya | FR-12 |
| Apakah data dilatih ke model? | Tergantung provider. Groq dan OpenAI API default tidak melatih. | `providers.ts` |

Kalimat privasi yang aman diucapkan:
"Audio dan transkrip tidak pernah menyentuh server kami, karena kami tidak punya server data.
Yang terjadi adalah koneksi langsung dari browser mahasiswa ke penyedia AI yang dia pilih sendiri.
Konsekuensinya jujur: ke mana data pergi tetap ditentukan provider itu, bukan oleh kami."

Kalimat yang **jangan** diucapkan:
- "100% offline." Transkripsi masih butuh internet.
- "Data tidak pernah keluar dari perangkat." Salah, audio keluar ke provider.
- "Gratis selamanya." Gratis hanya selama provider punya free tier.
- "Aman seperti bank." Tidak ada dasar untuk klaim ini.

---

## 9. Tech stack

| Lapisan | Teknologi | Versi |
|---|---|---|
| Framework | Next.js, App Router | 16.4.6 |
| UI | React | 19.3.1 |
| Bahasa | TypeScript | 5.9.x |
| Styling | Tailwind CSS v4 | 4.3.5 |
| Komponen | Radix UI primitives | 1.x dan 2.x |
| Ikon | lucide-react | 1.76.0 |
| Animasi | CSS transitions, motion tokens sendiri | tanpa library |
| Database lokal | Dexie (IndexedDB) | 4.4.7 |
| Mindmap | markmap-lib, markmap-view | 0.8.1, 0.18.13 |
| Validasi output | Zod | 4.6.7 |
| Tanggal | date-fns | 4.x |
| Kompresi bundel | fflate | 0.8.x |
| Screenshot mindmap | html-to-image | 1.11.x |
| Maskot | page-mascot | 0.1.x |
| Analitik | Vercel Analytics, Speed Insights | 2.x |
| Deploy | Static export (`output: "export"`) | tanpa server |

Detail teknis yang bisa jadi bahan pembicaraan:
- `experimental.agentUpgrade: "security"` dipasang di `next.config.ts`.
- Seluruh aplikasi bisa di-`export` jadi HTML statis. Tidak ada runtime server.
- Maskot bukan gambar diam, tapi komponen yang bereaksi ke kursor dan aksi pengguna.

---

## 10. Batasan jujur

Sebut ini sebelum juri menemukannya. Mengaku batasan lebih kuat daripada ketahuan.

| Batasan | Angka | Alasan | Rencana |
|---|---|---|---|
| Ukuran file | 25 MB | Batas API Whisper | Batas tetap per berkas, tidak bertambah karena gabung |
| Rekaman langsung | webm opus, mono | Hasil ukur desain | 1 jam sekitar 11 MB, masih di bawah 25 MB |
| Jumlah bagian per materi | belum dibatasi di UI | Batas praktis penyimpanan browser | Tampilkan peringatan ruang, atau batasi jumlah |
| Audio gabungan | tidak ada file gabungan | Tiap bagian tetap berkas terpisah | Pemutar berpindah berkas, tanpa encode ulang |
| Penyimpanan saat gabung | audio tiap bagian disalin | Materi asli harus tetap utuh | Hapus materi asli manual setelah yakin |
| Urutan bagian | otomatis dari materi terlama | Belum ada pengaturan urutan | Tambah pilihan urut di fase berikutnya |
| Transkrip sangat panjang | dikirim utuh ke LLM | Bisa melewati context window | Rencana map-reduce per bagian |
| Transkripsi | Butuh internet | Ini API, bukan model lokal | Fase 2 coba Whisper WebGPU |
| Provider | 6 pilihan, 2 untuk audio | Batas kompatibilitas | Tambah provider transkripsi |
| Biaya | Bukan benar-benar nol | User bayar kuota provider | Free tier Groq, atau Ollama untuk teks |
| Sinkronisasi | Manual lewat ZIP | Belum ada backend | Fase 2 atau 3 |
| Akurasi transkrip | Tidak diukur | Belum ada ground truth | Buat uji 5 rekaman berlabel |
| Akurasi ringkasan | Tidak diukur | Sama | Minta 2 dosen/asisten menilai |

Catatan tentang kata "gratis": Mindo tidak menyediakan server AI sendiri, jadi biaya komputasi
ada di sisi provider. Klaim yang benar: "Mindo tidak memungut biaya langganan. Dengan Groq free
tier, pemakaian harian mahasiswa bisa tanpa biaya." Klaim "gratis" tanpa syarat akan dipatahkan
juri.

---

## 11. Metrik

Belum ada satu pun angka hasil pengukuran di repo. Yang ada target di PRD. Jadi di slide, semua
angka harus diberi kata "target", atau diukur dulu sebelum hari H.

| Metrik | Nilai | Sumber | Cara mengukur cepat |
|---|---|---|---|
| Waktu transkrip audio 5 menit | di bawah 60 detik | `[TARGET]` NFR-01 | Stopwatch, 3 percobaan, ambil median |
| Paralelisme | 3 agen paralel | `[KODE]` | Lihat Network tab, urutan request |
| Ukuran rekaman 1 jam | sekitar 11 MB | `[PRD]` hitungan kodek | Rekam 1 jam uji, cek ukuran file |
| Batas audio Groq | 8 jam per hari (free) | `[PRD]` dan docs Groq | Baca dashboard Groq |
| Rate limit Groq LLM | 30 req/menit, 200K token/menit | `[PRD]` | Baca docs |
| Rate limit OpenRouter free | 20 req/menit, 50/hari | `[PRD]` | Baca docs |
| Jumlah flashcard | 10 sampai 20 per rekaman | `[TARGET]` PRD | Hitung di 3 materi |
| Kedalaman mindmap | maksimal 3 level | `[TARGET]` PRD | Cek 3 output |
| Retensi materi | tidak diukur | `[BELUM ADA]` | Butuh pre/post test, jangan diklaim |
| Akurasi transkrip | tidak diukur | `[BELUM ADA]` | Butuh uji manual 5 rekaman |
| Beban biaya per kuliah | tidak diukur | `[BELUM ADA]` | Catat token dan menit di dashboard |

Kalau temanmu mau satu tabel yang kredibel untuk Slide 7, isi tiga baris ini saja: waktu proses
audio 5 menit, jumlah flashcard per rekaman, dan ukuran berkas hasil rekam 1 jam. Selebihnya
jangan dipaksakan.

Cara menghitung biaya bila memakai OpenAI, tanpa mengarang angka:
tarif `whisper-1` per menit audio ditambah tarif `gpt-4o-mini` per token input dan output, lalu
kalikan 4 pemakaian per materi. Isi sendiri dari halaman harga resmi saat itu.

---

## 12. Aset visual

Screenshot yang perlu diambil sebelum menyusun slide:

| No | Objek | Untuk slide | Catatan |
|---|---|---|---|
| 1 | Landing page, viewport penuh | 1, 2 | Logo dan maskot terlihat |
| 2 | Drop zone file | 2 | Tunjukkan "seret file" dan tombol rekam |
| 3 | Halaman Pengaturan, pilihan provider | 2 | Sorot Groq sebagai default |
| 4 | Halaman Processing, tahap berjalan | 4, 6 | Empat tahap terlihat |
| 5 | Halaman materi, tab Ringkasan | 5 | Judul dan section |
| 6 | Tab Peta Konsep, node terbuka | 5 | Tunjukkan zoom |
| 7 | Tab Flashcard, kartu jawaban | 5 | Tunjukkan difficulty |
| 8 | Tanya Mindo, jawaban dengan sitasi | 5 | Sitasi timestamp terlihat |
| 9 | Riwayat materi | 5 | Bukti local storage |
| 10 | Ekspor ZIP | 5 | Bukti data bisa dibawa |
| 11 | Mobile 390px | 5, 8 | Responsif |
| 12 | Mindmap hasil ekspor PNG | 7 | Kualitas file |
| 13 | Dialog "Gabungkan rekaman" | 5 | Pilih materi, judul, penjelasan biaya |
| 14 | Dialog "Tambah rekaman" | 5 | Konfirmasi, hanya bagian baru yang ditranskripsi |
| 15 | Banner hasil basi | 5 | Tombol "Perbarui hasil" setelah transkrip bertambah |
| 16 | Transkrip dengan label Bagian 1 dan 2 | 5 | Bukti transkrip gabungan tetap rapi |

Aset yang sudah ada di repo:
- Logo: `public/logo-mindo.png`
- Maskot: `public/mascots/mindo-directions.webp`, `public/mascots/mindo-reactions.webp`
- Halaman yang bisa dipakai demo: `/demo`, `/history`, `/material`, `/page-maskot`, `/recording`,
  `/settings`

Jangan pakai foto stok mahasiswa untuk slide orang. Pakai screenshot produk, atau satu foto
tim sendiri kalau ada.

---

## 13. Pemetaan ke format PENS

Format di `FORMAT PENYUSUNAN PITCH DECK FP UKM SOFTDEV 2026.md` punya 9 bagian. Berikut bahan
mana yang mengisi tiap bagian.

| Bagian format | Isi yang dipakai | Sumber |
|---|---|---|
| 1. Opening | Cover, nama tim, tagline | Bagian 1, 2 |
| 2. Project Introduction | Nama, logo, deskripsi, tagline, tim dan peran, gambaran fungsi | Bagian 1, 2, 5 |
| 3. Problem Background dan Target User | 4 masalah, persona, JTBD, dampak | Bagian 3, 4 |
| 4. Proposed Solution dan Innovation | Alur satu input empat output, fitur utama, baru dibanding solusi lama, peran AI | Bagian 5, 6, 7 |
| 5. Product Design dan User Flow | Screenshot, penjelasan fitur, diagram alur pengguna | Bagian 6, 12, alur di bawah |
| 6. AI Integration dan System Logic | Model, API, alasan, alur input sampai output, arsitektur | Bagian 7, 8, 9 |
| 7. Implementation, Demo, dan Validation | Demo, metrik | Bagian 10, 11 |
| 8. Innovation Impact dan Roadmap | Manfaat, pembeda, roadmap | Bagian 3, 5, 7, 10, 11 |
| 9. Closing | Ajakan, kontak, QR | Bagian 1 |

### Alur pengguna untuk Slide 5

```
Buka Mindo
  -> Pengaturan: pilih provider, tempel API key (sekali saja)
  -> Dasbor: [Upload file] atau [Rekam]
     -> Processing: Transkrip -> Ringkasan / Mindmap / Flashcard (paralel)
        -> Halaman materi: tab Ringkasan | Peta Konsep | Flashcard
           (Transkrip lewat tombol, Tutor lewat panel)
           -> Belajar: swipe kartu, tanya tutor, baca sitasi
              -> Tambah rekaman: berkas baru ditranskripsi, tiga hasil diperbarui
              -> Ekspor: Markdown, PNG, atau ZIP
  -> Riwayat: [Gabungkan rekaman], pilih 2 materi atau lebih
     -> Materi baru berisi beberapa bagian, transkrip lama dipakai ulang
```

Tiga kondisi yang wajib ada di setiap layar data, dan sudah jadi keputusan desain:
kosong (belum ada materi), memuat (proses berjalan), gagal (error jelas plus aksi ulang).
Gagal satu tahap tidak mengulang tahap yang sudah sukses. Saat transkrip bertambah, banner
"hasil basi" muncul sampai ketiga output selesai dibuat ulang.

---

## 14. Q&A yang kemungkinan ditanya juri

Jawaban di bawah ini aman, tidak melebih-lebihkan.

**1. Bedanya dengan Otter.ai, Notta, atau transkrip Zoom?**
Mereka berhenti di teks. Mindo lanjut ke bentuk yang dipakai belajar: ringkasan, peta konsep,
flashcard, dan tutor yang bisa ditanya. Mereka juga menaruh data di server. Mindo tidak punya
server data.

**2. Bedanya dengan ChatGPT biasa?**
ChatGPT tidak menyimpan rekaman kuliah, tidak memberi timestamp per segmen, dan tidak punya
ruang kerja berisi riwayat materi. Mindo menempelkan jawaban ke detik tertentu di rekaman yang
sama, dan bisa bilang "tidak dibahas" kalau memang tidak ada.

**3. Kalau tidak ada server, bagaimana kalian dapat uang?**
Model sekarang: tanpa biaya, karena biaya AI dibayar user langsung ke provider. Kalau ingin
usaha, yang masuk akal adalah lisensi kampus, bukan langganan mahasiswa. Tapi itu belum
divalidasi, jangan diklaim sebagai rencana pasti.

**4. Apakah data mahasiswa aman?**
Tidak ada data di kami untuk bocor, karena tidak ada backend. Yang perlu diperjelas: audio tetap
dikirim ke provider AI pilihan user. Kami menampilkan provider dan kebijakan datanya di halaman
pengaturan, dan user boleh memilih Ollama untuk teks yang sepenuhnya lokal.

**5. Butuh API key, berarti tidak ramah pengguna?**
Tempel sekali di Pengaturan. Groq memberi free tier tanpa kartu kredit. Kalau ini tetap dianggap
hambatan, itu risiko adopsi terbesar kami, dan kami akui.

**6. Akurasi transkripsi berapa persen?**
Belum diukur dengan ground truth. Yang bisa dikatakan: Whisper large-v3 adalah model yang kami
pakai, dan user bisa mengoreksi segmen sambil memutar audio aslinya.

**7. Apa yang terjadi kalau internet mati?**
Tahap AI berhenti. Data yang sudah ada tetap aman di browser. Rekaman baru tidak bisa diproses.
Offline penuh adalah rencana Fase 2 lewat WebGPU, bukan fitur sekarang.

**8. Kenapa tidak pakai vector database untuk tutor?**
Satu materi hanya punya ratusan chunk. BM25 cukup, jalan di browser, tanpa biaya embedding, dan
mudah dijelaskan. Kalau nanti lintas materi, embedding masuk hitungan.

**9. Bagaimana kalau user hapus browser data?**
Materi ikut hilang. Karena itu ada ekspor ZIP. Ini konsekuensi local-first, dan kami sebutkan
di produk, bukan disembunyikan.

**10. Kalian ini proyek kampus atau produk?**
Jawaban jujur yang aman: ini final project yang dibangun sampai bisa dipakai. Validasi pengguna
yang sebenarnya masih menjadi pekerjaan berikutnya.

**11. Apa bagian tersulit saat membangun?**
Alur pemrosesan yang tahan gagal: satu tahap gagal tidak boleh menghapus hasil tahap lain, dan
retry tidak boleh mengulang transkripsi yang sudah selesai. Ini tertulis di NFR-06 dan sudah
diimplementasikan di halaman processing.

**12. Apakah AI-nya halusinasi?**
Tutor AI dibatasi: konteks dicari dulu dengan BM25, prompt melarang pengetahuan luar, output
punya field `found` dan `citations`, dan skema divalidasi Zod. Kalau tidak ada dasar, dia
diarahkan menjawab tidak ada. Ringkasan tetap bisa keliru karena model generatif, jadi ada
transkrip sumber untuk dicek.

**13. Bisa menggabungkan beberapa rekaman jadi satu materi?**
Bisa. Pilih dua materi atau lebih di Riwayat, tekan "Gabungkan rekaman". Hasilnya materi baru
berurutan dari rekaman terlama. Transkrip lama dipakai ulang, jadi tidak ada transkripsi baru,
dan materi asli tidak diubah. Tiga output teks dibuat ulang dari transkrip gabungan, jadi kuota
teks provider tetap terpakai.

**14. Kalau ada rekaman susulan, harus mengulang semuanya?**
Tidak. Buka materi, tekan "Tambah rekaman". Hanya berkas baru yang dikirim ke provider untuk
ditranskripsi. Segmennya disambung ke transkrip lama, lalu ringkasan, mindmap, dan flashcard
dibuat ulang. Banner di halaman materi menandai bahwa hasil lama belum mencakup bagian baru.

**15. Apakah audio gabungan jadi satu file?**
Belum. Tiap bagian tetap berkas terpisah, dan pemutar berpindah berkas saat waktu melewati batas
bagian. Ini disengaja: tidak ada decode atau encode ulang, jadi kualitas asli tetap utuh dan
proses gabung berjalan cepat. Konsekuensinya, ekspor ZIP berisi beberapa berkas audio, bukan satu
file panjang.

**16. Urutan bagian bisa diatur?**
Belum. Gabungan mengikuti waktu materi dibuat, dari yang terlama. Kalau urutannya salah, pengguna
bisa menyusun ulang lewat materi baru, atau menunggu fitur pengaturan urutan. Ini batasan yang
kami sebutkan, bukan disembunyikan.

---

## 15. Angka yang boleh dan tidak boleh diucapkan

| Aman | Kenapa |
|---|---|
| "Maksimal 25 MB per file" | Ada validasi |
| "Sekitar 11 MB per jam" | Hasil desain kodek, sebutkan "sekitar" |
| "6 provider, 2 untuk audio" | Isi `providers.ts` |
| "Maksimal 5 chunk, plus tetangganya" | Isi `bm25.ts` dan `tutor.ts` |
| "12 chunk untuk pertanyaan menyeluruh" | Isi `tutor.ts` |
| "Target 5 menit audio di bawah 60 detik" | NFR-01, sebut "target" |
| "3 agen jalan paralel" | `Promise.all` |
| "8 jam audio per hari di free tier Groq" | Batas provider |
| "Menggabung materi tidak memicu transkripsi baru" | Transkrip lama disalin di `mergeMaterials` |
| "Menambah rekaman hanya mentranskripsi berkas baru" | `append` memproses satu bagian saja |
| "Audio tetap terpisah per bagian" | Pemutar berpindah berkas, tanpa encode ulang |

| Jangan | Kenapa |
|---|---|
| "Akurasi 95 persen" | Tidak pernah diukur |
| "12 detik untuk 10 menit audio" | Angka karangan dari draf awal |
| "Menghemat 80 persen waktu" | Tidak ada data sebelum/sesudah |
| "100 persen offline" | Butuh internet untuk transkripsi |
| "Data tidak pernah keluar perangkat" | Audio dikirim ke provider |
| "Gratis selamanya" | Tergantung free tier provider |
| "Digunakan 1.000 mahasiswa" | Tidak ada pengguna terdaftar, tidak ada akun |
| "Terverifikasi keamanan" | Tidak ada audit |
| "Audio hasil gabungan jadi satu file" | Tiap bagian tetap berkas terpisah |
| "Gabung rekaman menghemat penyimpanan" | Audio tiap bagian disalin ke materi baru |
| "Transkrip panjang selalu aman" | Dikirim utuh, bisa lewat context window |

---

## 16. Glosarium

| Istilah | Arti singkat untuk juri |
|---|---|
| BYOK | Bring Your Own Key. User memakai API key miliknya, bukan kuota milik platform. |
| Local-first | Data utama tinggal di perangkat user, bukan di server. |
| IndexedDB | Database di dalam browser, ukuran besar, tidak hilang saat tab ditutup. |
| STT | Speech to Text. Audio jadi teks. |
| LLM | Large Language Model. Model yang menulis ringkasan dan menjawab. |
| RAG | Retrieval-Augmented Generation. Cari potongan sumber dulu, baru jawab. |
| BM25 | Metode pencarian kata kunci klasik, dipakai sebelum embedding populer. |
| Whisper | Model STT dari OpenAI, dipakai lewat API. |
| Static export | Build jadi file HTML/JS, tanpa server aplikasi. |
| Chunk | Potongan transkrip, dipakai untuk pencarian dan sitasi. |
| Timestamp | Penanda detik, dasar sitasi Tutor AI. |
| Zod | Pustaka validasi skema di runtime. |
| Dexie | Pembungkus IndexedDB. |
| Bagian | Satu berkas audio di dalam materi. Satu materi bisa punya beberapa bagian. |
| Offset | Detik mulai sebuah bagian di timeline materi. Dipakai memilih berkas saat lompat waktu. |
| Materi gabungan | Materi baru hasil `mergeMaterials`, berisi salinan bagian dari materi asal. |
| Hasil basi | Tiga output teks yang dibuat sebelum transkrip bertambah, ditandai `derivedSourceCount`. |

---

## 17. Cheat sheet satu halaman

```
Nama        : Mindo (Mind + Audio)
Tema        : Smart Student Productivity
Tagline     : Dari suara dosen jadi paham, sekali klik.
Masalah     : Rekaman kuliah tidak pernah dipakai ulang. Review terlalu mahal.
User        : Mahasiswa S1, 18-24 SKS, banyak kelas
Solusi      : Rekaman -> transkrip -> ringkasan + mindmap + flashcard + tutor AI
Beda        : Output belajar lengkap, bukan cuma teks. Tanpa akun. Tanpa server data. BYOK.
              Bisa beberapa rekaman dalam satu materi: tambah bagian atau gabung materi.
AI          : Whisper (Groq/OpenAI), LLM gpt-oss-120b atau gpt-4o-mini, BM25 + sitasi
Data        : IndexedDB (tabel sources per bagian), key di browser, ekspor ZIP v2
Stack       : Next 16.4.6, React 19.3.1, Tailwind 4, Dexie, markmap
Batasan     : 25 MB, butuh internet, butuh API key, sync manual, tanpa urutan bagian manual,
              tanpa file audio gabungan, transkrip panjang bisa lewat context window
Target      : 5 menit audio < 60 detik (belum diukur)
Belum ada   : akun, sync otomatis, mobile native, PDF, WebGPU, data pengguna, audio gabungan
Tim         : [ISI]
```

---

## 18. Banding dengan NotebookLM / Gemini Notebook

Bagian ini untuk pertanyaan yang paling mungkin datang dari koordinator UKM: "Apa bedanya dengan
NotebookLM Google?" Jawab dengan arsitektur dan alur, bukan dengan daftar fitur. Daftar fitur
akan kalah, dan juri tahu itu.

Status fakta: dicek 19 November 2026 dari halaman bantuan resmi Google. Produk kini tampil
sebagai **Gemini Notebook** di `notebook.google`, halaman bantuannya di
`support.google.com/gemininotebook`. Cek ulang sehari sebelum presentasi, nama dan batasannya
masih bergerak.

### 18.1 Kalimat pembuka yang aman

> "NotebookLM itu produk bagus, dan untuk banyak tugas saya akan menyarankannya. Bedanya bukan
> siapa yang lebih pintar. Bedanya di siapa yang memegang rekaman dan siapa yang menentukan model."

Jangan membuka dengan merendahkan NotebookLM. Juri kemungkinan besar sudah memakainya, dan
mengalahkan produk Google di kualitas model adalah pertarungan yang tidak bisa dimenangkan.

### 18.2 Satu paragraf positioning

NotebookLM adalah ruang riset di cloud Google. Anda memasukkan sumber, dia menyimpan salinan di
akun Anda, lalu Gemini yang membacanya. Kualitas modelnya tinggi, ragam sumbernya luas, dan
hasilnya bisa langsung jadi audio. Mindo adalah jalur dari rekaman kuliah ke bahan belajar yang
berjalan di browser mahasiswa: tanpa akun, tanpa salinan di server kami, dengan provider dan
model yang dipilih sendiri, dan hasil yang bisa dibawa keluar sebagai file biasa. Keduanya
mengerjakan hal yang mirip. Yang berbeda adalah siapa yang menyimpan, siapa yang memilih model,
dan seberapa mudah hasilnya dipindahkan.

### 18.3 Tabel pembeda

Isi tabel ini hanya kalau ditanya. Di slide, cukup satu atau dua baris.

| Aspek | Mindo | NotebookLM / Gemini Notebook | Sumber |
|---|---|---|---|
| Akun | Tidak ada auth sama sekali | Wajib akun Google dan sign-in | `[KODE]` vs docs Google |
| Tempat data | IndexedDB di browser user | Cloud Google, terikat akun | `[KODE]` vs docs |
| Server data milik pembuat | Tidak ada. Static export. | Ada, dikelola Google | `[KODE]` |
| Pilihan model | 6 provider, user yang memilih | Model Gemini, ditentukan Google | `providers.ts` |
| Biaya | Langsung ke provider, BYOK, ada free tier Groq | Gratis dengan batas, atau Google AI plan | `providers.ts` vs docs |
| Input utama | Audio atau video kuliah, termasuk rekam langsung di browser | PDF, web, YouTube, audio, Docs, Slides, Sheets, gambar, Word, txt, md, CSV, pptx, ePub, Play Books, Gemini Chats | `[PRD]` vs docs |
| Keluaran | Transkrip, ringkasan, peta konsep, flashcard, tutor bersitasi | Ringkasan, chat, Audio/Video Overview, Mind Map, Flashcards, Quizzes, Infografis, Slide Deck, Reports | `[KODE]` vs docs |
| Format hasil | Markdown, PNG, ZIP, bisa diimpor balik | Terikat notebook dan akun | `export/` |
| Bisa di-host sendiri | Ya, build statis | Tidak | `next.config.ts` |
| Bisa diaudit kodenya | Ya, repo terbuka | Tidak, produk tertutup | repo |
| Aplikasi mobile | Tidak ada, hanya web responsif | Ada, versi awal | `[BELUM ADA]` vs docs |
| Kolaborasi | Tidak ada | Berbagi notebook | `[BELUM ADA]` vs docs |
| Kualitas model | Bergantung provider pilihan user | Gemini, kelas atas | jujur: Google unggul |
| Biaya untuk user | API key sendiri, bisa nol lewat free tier | Gratis dengan batas | `[KODE]` vs docs |

Fakta batas NotebookLM yang boleh disebut, dengan catatan "per dokumentasi saat ini":
satu sumber maksimal 500.000 kata atau 200 MB; free tier 50 sumber per notebook dan 100 notebook;
audio lokal ditranskripsi saat diimpor; ada aplikasi mobile versi awal. Angka ini bisa berubah,
sebut sebagai "batas versi gratis yang kami baca di dokumentasinya", bukan sebagai kebenaran
abadi.

### 18.4 Empat pembeda yang jujur

Urut dari yang paling sulit ditiru, bukan dari yang paling keren.

1. **Tidak ada akun, jadi tidak ada yang bisa disandera.** Tidak ada email, tidak ada login,
   tidak ada profil belajar. Untuk mahasiswa yang merekam diskusi kelas atau materi yang belum
   publik, ini bukan fitur kecil. Konsekuensinya juga nyata: tidak ada pemulihan akun, dan data
   hilang kalau browser dibersihkan. Karena itu ada ekspor ZIP.
2. **Tidak ada server data milik kami.** Bukan "data Anda aman di server kami", tapi "kami tidak
   punya server data". Audio pergi dari browser langsung ke provider yang dipilih. Ini klaim
   arsitektur, bukan klaim keamanan. Jangan bilang "lebih aman dari Google".
3. **Model dan biaya bisa diganti user.** Enam provider, termasuk Ollama yang jalan di laptop
   sendiri untuk tugas teks. Kalau Groq berubah harga atau limit, user pindah provider tanpa
   menunggu kami merilis versi baru. NotebookLM: model dan harga ditentukan Google.
4. **Hasilnya file, bukan isi akun.** Markdown, PNG, ZIP, dan ZIP itu bisa diimpor balik. Bisa
   dihosting sendiri, bisa dibaca tanpa Mindo, bisa masuk repo catatan. NotebookLM menyimpan
   notebook di akun dan berbagi lewat Google.

Pembeda yang **jangan** dipakai karena sudah tidak benar:

- "NotebookLM belum bisa audio." Salah. Ada Audio Overview dan impor audio.
- "NotebookLM belum bisa flashcard atau mind map." Salah. Ada Flashcards, Quizzes, Mind Map.
- "NotebookLM belum bisa sitasi." Salah. Ada sitasi in-line ke sumber.
- "Mindo lebih akurat." Tidak diukur. Jangan diucapkan.
- "Mindo lebih cepat." Tidak diukur. Jangan diucapkan.
- "Mindo lebih murah." Tergantung provider dan pemakaian. Yang benar: tidak ada biaya platform.

### 18.5 Yang NotebookLM menangkan, sebut sendiri

Menyebut keunggulan lawan lebih dulu membuat sisa jawaban dipercaya.

- **Kualitas model.** Gemini kelas atas, tanpa user perlu memilih apa pun.
- **Ragam sumber.** PDF, web, YouTube, Docs, Slides, Sheets, gambar, ePub, dan lainnya. Mindo
  hanya audio dan video.
- **Audio dan Video Overview.** Mindo tidak punya. Ini fitur yang paling sering membuat orang
  jatuh cinta pada NotebookLM.
- **Aplikasi mobile.** Mindo hanya web.
- **Kolaborasi dan berbagi.** Mindo tidak punya.
- **Nol setup.** Buka, login, unggah. Mindo minta API key dulu. Ini friksi terbesar Mindo, dan
  harus diakui sebelum ditanya.
- **Gratis tanpa kartu dan tanpa key.** Batasnya ada, tapi tidak ada langkah teknis.

### 18.6 Kapan Mindo kalah, kapan Mindo menang

Kalah kalau: tugasnya meringkas banyak PDF dan web, butuh Audio Overview, butuh dikerjakan
bersama tim, atau penggunanya tidak mau menyentuh API key. Untuk semua itu, jawab saja
"pakai NotebookLM". Kejujuran ini menghemat waktu dan menaikkan kredibilitas.

Menang kalau: sumbernya rekaman kuliah sendiri; ingin satu paket transkrip bertimestamp plus
bahan belajar dari rekaman yang sama; tidak ingin materi masuk ke akun cloud; ingin memilih
provider atau memakai model lokal; ingin hasilnya jadi file yang bisa dibawa dan diarsipkan;
atau ingin membaca dan mengaudit kodenya karena ini proyek kampus.

### 18.7 Jawaban 20 detik

> "NotebookLM menyimpan sumber Anda di akun Google dan memakai Gemini. Mindo tidak punya akun
> dan tidak punya server data: rekaman tinggal di browser, dan modelnya Anda pilih sendiri.
> Fiturnya lebih sedikit, dan untuk meringkas PDF NotebookLM lebih baik. Bedanya di siapa yang
> memegang rekaman."

### 18.8 Jawaban 45 detik

> "Kalau dinilai sebagai produk jadi, NotebookLM menang di banyak hal: modelnya lebih kuat,
> sumbernya lebih beragam, ada Audio Overview, ada aplikasi mobile, ada kolaborasi, dan tidak
> perlu API key. Kami tidak mencoba menandingi itu.
>
> Yang kami kejar berbeda. NotebookLM adalah ruang riset di cloud: sumber masuk ke akun, Gemini
> yang membacanya. Mindo adalah jalur dari rekaman kuliah ke bahan belajar yang berjalan di
> browser mahasiswa: tanpa akun, tanpa salinan di server kami, provider dipilih sendiri, dan
> hasilnya keluar sebagai Markdown, PNG, atau ZIP yang bisa diimpor balik.
>
> Jadi untuk meringkas PDF, pakai NotebookLM. Untuk rekaman kuliah yang tidak ingin diunggah
> ke akun siapa pun, dan untuk hasil yang ingin dimiliki sendiri, itu celah yang Mindo isi."

### 18.9 Kalau ditanya "berarti cuma soal privasi?"

> "Privasi itu alasan pertama, bukan satu-satunya. Yang kedua kepemilikan hasil: Markdown dan ZIP
> bisa dibaca tanpa Mindo, tanpa akun, sepuluh tahun lagi. Yang ketiga ketergantungan: kalau
> provider A berubah harga, pengguna pindah ke B tanpa menunggu kami. Dua yang terakhir juga
> berlaku untuk orang yang tidak peduli privasi."

### 18.10 Kalau ditanya "kenapa tidak pakai NotebookLM saja?"

> "Untuk banyak orang, jawabannya memang NotebookLM saja. Mindo untuk kasus yang berbeda:
> rekaman kuliah dua jam yang tidak mau diunggah, dan mahasiswa yang ingin bahan belajarnya
> jadi file miliknya sendiri. Kalau tidak ada kebutuhan itu, NotebookLM pilihan yang lebih
> matang."

Jangan berdebat. Mengakui produk lain lebih matang bukan kekalahan, itu tanda tahu posisi.

### 18.11 Kalimat yang boleh dan tidak boleh

| Boleh | Tidak boleh |
|---|---|
| "Mindo tidak punya akun dan tidak punya server data." | "Mindo 100 persen offline." |
| "Audio dikirim langsung ke provider pilihan user." | "Data tidak pernah keluar dari perangkat." |
| "Model ditentukan user, bukan kami." | "Model kami lebih baik dari Gemini." |
| "Hasilnya Markdown, PNG, dan ZIP yang bisa diimpor balik." | "NotebookLM tidak bisa ekspor." |
| "Mindo bisa dihosting sendiri dan kodenya terbuka." | "Mindo lebih aman dari Google." |
| "NotebookLM unggul di kualitas model, ragam sumber, dan fitur jadi." | "NotebookLM cuma mainan." |
| "Untuk meringkas PDF, NotebookLM lebih tepat." | "Mindo menggantikan NotebookLM." |
| "Ini proyek kampus yang dibangun sampai bisa dipakai." | "Mindo siap produksi untuk kampus." |

### 18.12 Tiga jebakan saat menjawab

1. **Menyerang Google, bukan menjelaskan posisi.** Juri tidak peduli siapa yang lebih hebat.
   Mereka menilai apakah tim paham pilihan desainnya sendiri.
2. **Mengklaim lebih aman tanpa bukti.** Tidak ada audit, tidak ada sertifikasi. Yang bisa
   diklaim cuma "tidak ada data di kami". Itu beda dengan "aman".
3. **Menjawab dengan daftar fitur.** NotebookLM punya lebih banyak fitur. Jawab dengan
   arsitektur, satu kalimat, lalu berhenti. Jawaban panjang terdengar seperti pembelaan.

### 18.13 Kalau ditanya "jadi ini cuma NotebookLM versi lokal?"

> "Bukan. NotebookLM adalah ruang riset dengan banyak jenis sumber. Mindo satu jalur spesifik:
> rekaman kuliah masuk, satu paket bahan belajar keluar, di browser, tanpa akun. Yang mirip
> hanya sebagian outputnya. Yang berbeda justru hal yang paling menentukan: siapa yang
> menyimpan, siapa yang memilih model, dan apakah hasilnya bisa dibawa pergi."
