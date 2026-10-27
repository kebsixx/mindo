# PRD: Mindo

**Tagline:** Dari suara dosen jadi paham, sekali klik.

| Field | Isi |
|---|---|
| Nama produk | Mindo (Mind + Audio) |
| Tema final project | Smart Student Productivity (Tema 1) |
| Fokus AI | Speech-to-Text, LLM generation, retrieval-augmented QA |
| Model akses | Tanpa login, local-first, BYOK (Bring Your Own Key) |
| Tim | Hustler, Hipster, Hacker (UKM Softdev) |
| Status | Fase 1 selesai, siap masuk Fase 2 |
| Terakhir diverifikasi | 22 Oktober 2026 |

Dokumen ini adalah sumber kebenaran produk. Detail teknis agent AI ada di `ai-agents.md`, detail sistem ada di `architecture.md`, kerangka UI ada di `design.md`.

---

## 1. Ringkasan

Mindo mengubah rekaman kuliah menjadi tiga aset belajar: ringkasan terstruktur, peta konsep (mindmap), dan bank flashcard. Semua diolah di perangkat user, tanpa server penyimpanan, tanpa akun.

- **Ringkasan terstruktur**: poin penting per sub-topik.
- **Peta konsep**: hierarki ide yang bisa digeser dan dibuka.
- **Flashcard dan tutor AI**: latihan active recall plus tanya-jawab yang sumber jawabannya persis rekaman yang sama.

## 2. Masalah

1. **Konteks hilang saat mencatat.** Saat mencatat, mahasiswa menulis, bukan memahami. Ide dosen yang tidak sempat ditulis hilang.
2. **Review pasca-kuliah mahal.** Rangkuman, mindmap, dan flashcard buatan sendiri memakan waktu lama.
3. **Transkrip bukan belajar.** Notulensi menghasilkan teks panjang. Tidak ada yang memaksa mahasiswa memakai kembali materinya.
4. **Enggan menitipkan rekaman.** Rekaman kuliah bisa berisi materi yang tidak ingin disimpan pihak ketiga.

**Status bukti:** poin 1 sampai 3 adalah hipotesis, belum diuji. Sebelum presentasi Minggu 10, Hustler melakukan 5 wawancara singkat dengan mahasiswa dan mencatat hasilnya.

## 3. Persona dan kebutuhan

**Persona utama:** mahasiswa S1, 18 sampai 24 SKS, aktif di lebih dari satu mata kuliah semester ini.

**Job to be done:** "Setelah kuliah selesai, saya mau punya bahan belajar yang bisa saya pakai lagi dalam 15 menit, tanpa harus merangkai sendiri."

**Kapan dipakai:** sekitar 30 menit setelah pulang dari kampus, di laptop, sambil sudah setengah capek. Sesi pendek, sering di HP, kadang di laptop.

## 4. Solusi dan proposisi nilai

**Yang dijual Mindo:** dari rekaman mentah ke bahan siap pakai dalam satu alur, tanpa akun, tanpa data yang dikumpulkan.

| Keunggulan | Bukti nyata yang bisa ditunjukkan |
|---|---|
| Tanpa hambatan akses | Buka halaman, tempel API key sekali, langsung proses. Tidak ada form registrasi. |
| Data milik user | Audio dan transkrip tidak pernah menyentuh server kami. Bisa dihapus dari browser kapan saja. |
| Biaya server nol | Tidak ada backend, tidak ada database, tidak ada tagihan hosting. |
| Output yang bisa dipakai | Peta konsep bisa diekspor ke PNG, ringkasan, flashcard, dan transkrip ke Markdown. Bukan cuma teks di layar. |

Catatan jujur: BYOK berarti user butuh akun dan kuota di penyedia AI. Groq menyediakan free tier dengan batas yang cukup untuk pemakaian kampus per orang. Klaim "gratis" merujuk free tier itu, bukan akses tanpa akun.

## 5. Scope MVP

**Di luar scope (v1)**

- Login, sinkronisasi antar perangkat, dashboard multi-user.
- Ekspor PDF sebagai fitur utama. v1 cukup PNG dan Markdown.
- On-device inference lewat WebGPU.
- Kolaborasi flashcard antar mahasiswa.

**Di dalam scope (v1)**

- Upload file audio atau video, plus rekaman langsung dari browser.
- Transkrip berbahasa Indonesia dengan timestamp.
- Ringkasan, peta konsep, dan flashcard yang dihasilkan dari transkrip.
- Tutor AI berbasis retrieval dari transkrip yang sama.
- Penyimpanan lokal di browser dengan riwayat materi.
- Halaman pengaturan untuk provider dan API key.

## 6. Alur pengguna

```
Landing
  -> CTA "Proses rekaman kuliah"
Pengaturan (sekali): pilih provider, tempel API key
  -> Dashboard: [Upload file] [Rekam audio]
     -> Processing: status per tahap (transkrip -> ringkasan -> peta konsep -> flashcard)
        -> Halaman materi, 4 tab: Ringkasan | Peta Konsep | Flashcard | Tanya Mindo
           -> Review: swipe flashcard, tanya tutor, ekspor
```

Setiap layar data punya tiga kondisi: kosong (belum ada materi), memuat (proses berjalan), dan gagal (error jelas plus aksi ulang). Gagal di satu tahap tidak mengulang tahap yang sudah sukses.

## 7. Kebutuhan fungsional

| ID | Kebutuhan | Kriteria penerimaan (target, bukan klaim) |
|---|---|---|
| FR-01 | Upload file audio atau video | Menerima mp3, m4a, wav, webm, mp4. Menolak file di atas 25 MB dengan pesan yang menjelaskan cara memperkecil. |
| FR-02 | Rekam audio langsung | Rekaman di browser, format webm opus, bitrate dibatasi 24 kbps mono supaya 1 jam menghasilkan sekitar 11 MB, jauh di bawah batas 25 MB. Indikator durasi berjalan, pengguna bisa stop. |
| FR-03 | Transkrip berbahasa Indonesia | Mengirim `language=id` ke Whisper. Hasil punya timestamp per segmen dan disimpan apa adanya. Daftar segmen bisa dibuka dari halaman materi, jadi user bisa mengoreksi bagian yang salah dengar dan membandingkannya dengan audio asli. |
| FR-04 | Ringkasan terstruktur | Menghasilkan JSON terstruktur: judul, 5 sampai 10 bagian, tiap bagian berisi poin kunci dan istilah kunci. UI merendernya jadi markdown, dan ekspor markdown berasal dari data yang sama. |
| FR-05 | Peta konsep | JSON hierarki maksimal 3 level yang dirender jadi mindmap interaktif. Bisa diekspor PNG. |
| FR-06 | Bank flashcard | 10 sampai 20 kartu per rekaman, tiap kartu berisi pertanyaan, jawaban, tingkat kesulitan, dan referensi timestamp. |
| FR-07 | Mode belajar flashcard | Swipe kiri berarti ulang, swipe kanan berarti paham. Status per kartu tersimpan dan progres sesi tampil. Tombol keyboard panah kiri dan kanan harus jalan. |
| FR-08 | Tanya Mindo (tutor AI) | Menjawab hanya dari potongan transkrip yang ditemukan lewat retrieval. Setiap jawaban mencantumkan timestamp. Kalau tidak ada di rekaman, jawab jujur bahwa tidak dibahas. |
| FR-09 | Riwayat materi lokal | Daftar materi tersimpan di browser, bisa dibuka lagi, bisa dihapus satu per satu dari daftar. Judul materi bisa diedit, nilai awal diambil dari nama file lalu dari tanggal rekam. |
| FR-10 | Pengaturan provider | Dua pilihan: Groq (default, direkomendasikan) dan OpenAI. API key disimpan lokal, bisa diganti, bisa dihapus. Ada tombol uji koneksi. |
| FR-11 | Ekspor | Peta konsep ke PNG, ringkasan, flashcard, dan transkrip ke Markdown. Semua berjalan di browser tanpa server. |
| FR-12 | Hapus data | Satu tombol hapus semua data di browser, dengan konfirmasi. Menghapus API key juga. |

## 8. Kebutuhan non-fungsional

| ID | Aspek | Target |
|---|---|---|
| NFR-01 | Kecepatan | Audio 5 menit selesai ditranskrip di bawah 60 detik, memakai provider yang dipilih dan jaringan normal. |
| NFR-02 | Parallelisme | Ringkasan, peta konsep, dan flashcard dihasilkan paralel setelah transkrip selesai, bukan berurutan. |
| NFR-03 | Privasi | Tidak ada request ke domain kami selain file statis. Audio, transkrip, dan kunci API hanya ada di localStorage dan IndexedDB. |
| NFR-04 | Aksesibilitas | Semua kontrol bisa dipakai keyboard, ada focus ring yang terlihat, kontras teks minimal AA, target sentuh minimal 44 px. |
| NFR-05 | Responsif | Landing dan dashboard nyaman di 360 px sampai 1440 px. Tidak ada scroll horizontal. |
| NFR-06 | Ketahanan | Gagal satu tahap tidak menghapus hasil tahap lain. Error ditampilkan dalam bahasa user, lengkap dengan aksi. |
| NFR-07 | Biaya | Nol biaya hosting. Batas pemakaian mengikuti free tier provider, ditampilkan di pengaturan. |
| NFR-08 | Browser | Chrome, Edge, Firefox, dan Safari versi terbaru (2 tahun terakhir). |

## 9. Model data

Semua di IndexedDB, kecuali pengaturan yang kecil dan sinkron. Detail skema tabel di `architecture.md` bagian 8.

| Entitas | Isi | Kunci |
|---|---|---|
| Material | metadata rekaman, durasi, nama file, status tahap | `id` |
| Transcript | array segmen `{start, end, text}` | `materialId` |
| Summary | JSON terstruktur `{title, sections[{heading, points, keyTerms}]}` | `materialId` |
| Mindmap | JSON hierarki | `materialId` |
| Flashcards | array kartu `{id, question, answer, difficulty, timestampRef, grade}` | `id` |
| Chunks | potongan transkrip beserta daftar token hasil tokenisasi, dipakai retrieval | `materialId` plus urutan |
| Settings | provider, API key, preferensi UI | localStorage |

Field `grade` per kartu (`unknown`, `repeat`, `known`) menyimpan progres belajar. Tanpa ini, swipe cuma jadi kontrol yang tidak melakukan apa pun.

## 10. Konsep AI

Lima agen, detail lengkap di `ai-agents.md`.

| Agen | Input | Output | Peran |
|---|---|---|---|
| Transcriber | file audio | segmen dan timestamp | model STT, bukan LLM |
| Summarizer | transkrip | JSON bagian | LLM dengan skema terstruktur |
| Mindmapper | transkrip plus ringkasan | JSON pohon | LLM dengan skema terstruktur |
| Flashcarder | transkrip plus ringkasan | JSON kartu | LLM dengan skema terstruktur |
| Tutor | pertanyaan dan potongan transkrip | JSON jawaban plus timestamp sumber | retrieval lokal, lalu LLM |

Kunci: tiga agen keluaran JSON memakai structured outputs dengan skema yang didefinisikan di kode, bukan Instruksi "kembalikan JSON" lalu berharap beruntung. Sumber kebenarannya satu: transkrip.

## 11. Verifikasi demo (checklist, bukan klaim)

Semua butir ini harus lulus dan direkam sebelum demo final.

- [ ] Audio 5 menit selesai ditranskrip di bawah 60 detik.
- [ ] Peta konsep ter-render rapi dari JSON, level maksimal 3.
- [ ] Flashcard bisa di-swipe, progres tersimpan setelah refresh.
- [ ] Tutor menjawab pertanyaan spesifik dengan timestamp yang benar.
- [ ] Tutor ditanya hal di luar rekaman, dia menjawab jujur tidak dibahas, tidak mengarang.
- [ ] Data masih ada setelah refresh, dan bisa dihapus total.
- [ ] API key salah menampilkan pesan jelas, bukan layar putih.
- [ ] Layout mobile 375 px tanpa scroll horizontal.

## 12. Privasi dan keamanan

**Yang tidak kita lakukan**

- Tidak menyimpan audio, transkrip, atau ringkasan di server.
- Tidak meminta email, nama, atau kata sandi.
- Tidak mengumpulkan analitik yang mengidentifikasi pengguna.

**Yang kami lakukan**

- API key user disimpan di browser dan hanya dikirim ke provider yang dipilih user.
- Audio, transkrip, ringkasan, peta konsep, dan flashcard bisa diekspor dari perangkat dan bisa dihapus total.
- Kunci tidak pernah ditulis di dalam kode atau konfigurasi yang di-commit.

**Risiko yang kami akui**

- Kunci API tersimpan di browser bisa dibaca skrip pihak ketiga jika ada celah XSS di origin kita. Mitigasi: tidak ada script pihak ketiga yang tidak perlu, CSP ketat, dependensi sedikit.
- Kunci terlihat di network tab. Ini konsekuensi BYOK dan diterima, karena kunci itu milik user sendiri.
- Kalau tim memakai satu kunci demo di laptop presentasi, kunci itu harus dirotasi setelah demo.

## 13. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Free tier provider kena rate limit | Demo gagal di saat penting | Batas 25 MB, kompres audio sebelum kirim, dan satu dry run sebelum presentasi. Cadangan: pindah provider lewat pengaturan. |
| Model AI dinonaktifkan provider | Fitur mati | Semua nama model ada di satu file konfigurasi. Lihat `architecture.md`. |
| Kualitas transkrip bahasa Indonesia jelek | Ringkasan dan flashcard jadi sampah | Kirim `language=id`, pakai model large, simpan audio asli untuk cek ulang, sediakan akses ke segmen transkrip dari setiap hasil. |
| Rekaman panjang di atas 1 jam | Kena limit file, bukan batas durasi | Rekam lewat browser dengan bitrate 24 kbps, sekitar 11 MB per jam. |
| Scope memblud | Tidak selesai Minggu 13 | Fitur di luar daftar FR harus lewat request eksplisit tim. |

## 14. Timeline dan peran

| Fase | Isi | Selesai kalau |
|---|---|---|
| 1. Ideation | PRD, nama, tema | PRD ini disetujui tim |
| 2. Concept dan UI/UX (Minggu 10) | Pitch deck, wireframe, prototype klik | Juri paham masalah dan nilai, prototype alur upload sampai review bisa diklik |
| 3. Implementasi (Minggu 11 sampai 13) | Koding fitur inti, integrasi AI | Checklist bagian 11 lolos untuk 4 fitur pertama |
| 4. Presentasi final (Minggu 14) | Live demo atau video demo | Alur lengkap jalan tanpa intervensi manual |

Tanggung jawab:
- **Hustler**: problem statement, value proposition, pitch deck, riset 5 mahasiswa, menyiapkan skenario demo.
- **Hipster**: wireframe dan high fidelity di Figma, halaman pengaturan, swipe flashcard, tampilan peta konsep.
- **Hacker**: pipeline AI di browser, structured outputs, retrieval, penyimpanan lokal, ekspor.

## 15. Pertanyaan terbuka

Perlu diputuskan tim sebelum Fase 2 selesai.

1. Key demo: satu kunci Groq tim dipakai bersama laptop presentasi, atau tiap anggota demo dengan kunci sendiri? Default: satu kunci tim, dirotasi setelah demo.
2. Bahasa antarmuka: Indonesia saja atau ada mode Inggris untuk demo ke juri? Default: Indonesia saja.
3. Mata kuliah mana yang dipakai sebagai bahan demo? Pilot 3 rekaman, pilih yang paling representatif.
4. Ekspor PDF masuk v1 atau ditunda? Default: ditunda, v1 cukup PNG dan Markdown.

## 16. Lampiran: fakta provider terverifikasi dan koreksi draf

Diverifikasi langsung ke dokumentasi dan probe jaringan pada 22 Oktober 2026.

**Groq (rekomendasi default)**

| Item | Nilai |
|---|---|
| Transkrip | `whisper-large-v3` ($0.111 per jam) dan `whisper-large-v3-turbo` ($0.04 per jam), multibahasa termasuk Indonesia |
| LLM | `openai/gpt-oss-120b` ($0.15 input, $0.60 output per 1M token), `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` |
| Limit file | 25 MB (free tier), 100 MB (dev tier, harus lewat URL) |
| Free tier | whisper: 20 RPM, 2.000 request per hari, 7.200 detik audio per jam, 28.800 detik audio per hari. LLM: 30 RPM, 1.000 request per hari, 200K token per menit |
| Konteks | 131.072 token, cukup memuat transkrip 1 jam tanpa dipecah |
| Structured outputs | Mode strict tersedia di `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b` |
| CORS | Terverifikasi lewat probe: respons membawa `access-control-allow-origin: *`, preflight OPTIONS balas 204. Panggilan langsung dari browser dimungkinkan |

**OpenAI (provider sekunder)**

| Item | Nilai |
|---|---|
| Transkrip | `whisper-1`, limit file 25 MB |
| LLM | `gpt-4o-mini` |
| Embedding | `text-embedding-3-small`, tidak ada padanan di Groq |
| CORS | Preflight lulus, tapi respons error tidak membawa header CORS saat probe. Perlakukan sebagai jalur cadangan |

**Provider Tambahan (tersedia di environment, bukan default UI)**

| Provider | Model Tersedia (OpenCode 9router) | Catatan |
|---|---|---|
| **Gemini 3.x** | `gemini-3.8-flash-high`, `gemini-3.5-flash-low`, `gemini-2.5-pro`, `gemini-2.5-flash` | Butuh akun Google Cloud, config manual di `opencode.json` atau `lib/ai/models.ts` |
| **Claude 4.x** | `claude-sonnet-4-6`, `claude-opus-4-6-thinking` | Butuh akun Anthropic, config manual |
| **DeepSeek v4** | `deepseek-v4-pro`, `deepseek-v4-flash`, `deepseek-reasoner` | Butuh akun DeepSeek, config manual |
| **Ollama (Lokal)** | `ollama/gpt-oss:120b`, `ollama/qwen3.5`, `ollama/phi3`, `ollama/glm-5` | Butuh instalasi Ollama di laptop user. Cocok buat laptop gaming. STT via Whisper di Ollama. |

**Koreksi terhadap draf awal**

| Draf awal | Kenyataan per 22 Oktober 2026 |
|---|---|
| `llama-3.3-70b-versatile` via Groq | Dimatikan 16 Agustus 2026. Permintaan ke model ID itu sekarang error. Pengganti resmi: `openai/gpt-oss-120b` atau `qwen/qwen3.8-27b` |
| `llama-3.1-8b-instant` | Dimatikan 16 Agustus 2026, sama |
| Embedding `text-embedding-3-small` untuk RAG | Butuh akun OpenAI kedua, sedangkan Groq tidak punya endpoint embeddings. Mindo memakai retrieval leksikal di browser, lihat `architecture.md` |
| `markmap-react` | Tidak pernah ada di npm. Pakai `markmap-view` 0.18.12 dengan wrapper React kecil. `markmap-lib` tidak perlu karena pohonnya dibangun dari JSON, bukan dari markdown |
| "Audio di atas 30 menit perlu dipecah" | Penyebabnya ukuran file 25 MB, bukan durasi. Mp3 90 menit 128 kbps sekitar 85 MB, gagal terkirim |
| Rute `/material/[id]` | Dengan static export, dynamic route tanpa `generateStaticParams` ditolak. ID materi dibuat di browser, jadi ID lewat query string. Lihat `architecture.md` bagian 6 |
| Tutor streaming | Structured outputs tidak mendukung streaming. Lima agen berjalan non-streaming. Mode streaming ada di daftar ide ke depan |
| Backend Python (FastAPI) plus LangChain dan ChromaDB | Dibatalkan di draf yang sama setelah mode BYOK dipilih. Semua pemrosesan jalan di browser, jadi tidak ada server yang menjalankan pipeline |
| Vector store in-memory dengan cosine similarity | Dihapus. Butuh embedding, sedangkan Groq tidak punya endpoint embeddings. Retrieval memakai BM25 leksikal di browser, lihat `architecture.md` bagian 5 |