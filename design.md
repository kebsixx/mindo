# Desain UI/UX: Mindo

Dokumen ini adalah spesifikasi kebutuhan antarmuka untuk Mindo, bukan desain visual akhir. Arah visual, tipografi, warna, dan animasi diputuskan Hipster di Figma. Yang terkunci di sini adalah apa yang harus ada di layar, kondisi apa yang harus ditangani, dan batasan aksesibilitas yang tidak boleh ditawar.

Sumber kebutuhan: `PRD.md` bagian 6, 7, 8, dan 11.

Terakhir diverifikasi: 22 Oktober 2026.

## 1. Aturan yang mengikat semua layar

| Aturan | Nilai | Alasan |
|---|---|---|
| Bahasa antarmuka | Indonesia | Keputusan default di PRD bagian 15 |
| Bahasa data | Apa adanya dari transkrip, boleh ada istilah Inggris dari dosen | Memotong isi rekaman berarti memotong makna |
| Target sentuh | Minimal 44 x 44 px | NFR-04 |
| Kontras teks | Minimal AA | NFR-04 |
| Fokus keyboard | Always visible, tidak pernah dihapus tanpa pengganti yang jelas | NFR-04 |
| Scroll horizontal | Tidak ada di lebar 360 px | NFR-05 |
| State wajib | Kosong, memuat, gagal, untuk tiap layar data | PRD bagian 6 |
| Error | Bahasa user, menyebut aksi yang bisa dilakukan | NFR-06 |

## 2. Daftar layar

| Layar | Rute | Tujuan |
|---|---|---|
| Landing | `/` | Menjelaskan manfaat dan mengarahkan ke pengaturan |
| Pengaturan | `/settings` | Provider, API key, uji koneksi, hapus data |
| Dashboard | `/dashboard` | Daftar materi, upload, rekam |
| Pemrosesan | `/processing?id=<id>` | Status tiap tahap selama pipeline berjalan |
| Materi | `/material?id=<id>` | Empat tab hasil: Ringkasan, Peta Konsep, Flashcard, Tanya Mindo |
| Rekaman | `/recording`, `?id=` opsional | Rekaman langsung dari browser. Tanpa `id`, rekaman baru. Dengan `id`, rekaman tambahan untuk materi yang sudah ada. |

ID materi lewat query string, bukan segmen path. Alasannya di `architecture.md` bagian 6.

## 3. Landing

Elemen yang harus ada:
- Nama produk dan satu kalimat yang menjelaskan apa yang terjadi kalau user mengunggah rekaman kuliah.
- Satu tombol utama yang masuk ke alur pengaturan atau dashboard.
- Penjelasan singkat bahwa data tidak meninggalkan browser dan bahwa user memakai API key sendiri.
- Catatan bahwa diperlukan akun Groq atau OpenAI, supaya user tidak kaget saat diminta kunci.

Tidak perlu: daftar fitur panjang, testimonial, angka pengguna, pricing table. Tidak ada data pengguna yang bisa ditampilkan di sini.

## 4. Pengaturan

Isi layar:
- **Pilih Provider AI** — 2 pilihan utama:
  - **Groq (default)** — disarankan, CORS verified, free tier cukup, Whisper large-v3 kualitas Indonesia baik.
  - **OpenAI (alternatif)** — butuh akun mereka, kualitas tinggi, harga mahal.
- **Fitur Lanjut** — expandable/accordian di bawah pilihan utama:
  - **Provider Lainnya** (butuh konfigurasi manual di `opencode.json` atau `lib/ai/models.ts`):
    - Google Gemini 3.x (`gemini-3.8-flash-high`, `gemini-3.5-flash-low`, dll)
    - Anthropic Claude 4.x (`claude-sonnet-4-6`, `claude-opus-4-6-thinking`)
    - DeepSeek v4 (`deepseek-v4-pro`, `deepseek-v4-flash`)
  - **Model Lokal (Ollama)** — butuh instalasi Ollama di laptop user:
    - `ollama/gpt-oss:120b`, `ollama/qwen3.5`, `ollama/phi3`, dll
    - Cocok buat user laptop gaming, full lokal, nggak butuh API key
- Kolom API key, tipe password, dengan tombol tampilkan/sembunyikan.
- Tombol uji koneksi. Hasilnya berupa status dan pesan, bukan spinner tanpa ujung.
- Batas provider yang berlaku, misalnya batas 25 MB per file dan kuota harian free tier. Ini angka yang sudah diverifikasi dan ditampilkan apa adanya sebagai batas.
- Tombol hapus semua data, dengan dialog konfirmasi yang menyebut akibatnya.

Perilaku kunci:
- Kunci disimpan di localStorage, dikirim hanya ke origin provider yang dipilih.
- Sesi di browser dengan kunci yang salah harus tampilkan pesan 401 apa adanya, bukan "terjadi kesalahan".
- Setelah kunci disimpan, dashboard adalah tempat masuk, bukan halaman pengaturan.
- Fitur Lanjut default collapsed, hanya muncul kalau user klik "Lihat opsi lanjut".

## 5. Dashboard

Elemen yang harus ada:
- Dua aksi utama: unggah file dan rekam sekarang.
- Area drop file, dengan format yang diterima dan batas ukuran tertulis.
- Daftar materi tersimpan. Setiap baris memuat judul, tanggal, durasi, dan status tahap.
- Setiap baris punya aksi hapus dengan konfirmasi.

State kosong: penjelasan singkat kenapa belum ada materi, plus kedua aksi utama. Bukan ilustrasi besar tanpa fungsi.

State memuat: skeleton baris, bukan spinner di tengah halaman.

## 6. Pemrosesan

Empat tahap ditampilkan terpisah dengan status masing-masing: transkrip, ringkasan, peta konsep, flashcard. Satu tahap gagal tidak mengubah status tahap lain.

Tahap yang gagal menampilkan alasannya dan tombol coba lagi untuk tahap itu saja.

Tahap transkrip menampilkan durasi audio yang sudah diproses kalau provider memberi progres. Kalau tidak, teks yang jujur: sedang memproses, tanpa angka animasi yang tidak berasal dari data.

Ada tombol batal. Batal menghentikan request yang sedang jalan, dan hasil tahap yang sudah selesai tetap tersimpan.

## 7. Materi

Empat tab: Ringkasan, Peta Konsep, Flashcard, Tanya Mindo. Daftar segmen transkrip tidak jadi tab kelima. Dia muncul sebagai panel yang bisa dibuka dari header halaman materi, karena gunanya memeriksa satu bagian tertentu, bukan dibaca semua.

### Panel transkrip (bukan tab)

- Daftar segmen `{start, end, text}` ditampilkan berurutan, satu segmen satu baris.
- Setiap baris punya tombol putar dari detik segmen itu.
- Teks segmen bisa diklik untuk menyorot kata kunci dari ringkasan yang muncul di baris itu.
- Scroll ke segmen tertentu saat user mengklik sitasi di jawaban tutor.
- Audio asli diputar dari sumber yang sama dengan hasil transkrip, supaya user bisa membandingkan.
- Aksi ekspor transkrip ke Markdown.

### 7.1 Tab Ringkasan

- Judul rekaman dan metadata ringkas.
- Daftar bagian hasil ringkasan, tiap bagian punya judul dan poin-poin.
- Istilah kunci ditampilkan sebagai tag. Mengklik tag mengisi kotak pertanyaan tutor dengan topik itu, jadi user bisa langsung menggali istilah yang tadi ia baca.
- Aksi ekspor ke Markdown.

### 7.2 Tab Peta Konsep

- Peta interaktif: bisa digeser, di-zoom, dan tiap simpul bisa dibuka atau ditutup.
- Lebar peta mengikuti container, bukan fixed width, supaya tidak memunculkan scroll horizontal di HP.
- Di layar kecil, daftar simpul yang bisa dipilah jadi pengganti peta. Peta penuh jadi opsional, bukan satu-satunya jalan.
- Aksi ekspor ke PNG.
- Legenda warna simpul diberi label teks, bukan hanya warna.

### 7.3 Tab Flashcard

- Satu kartu per layar. Pertanyaan di atas, jawaban di balik atau di bawah.
- Swipe ke kanan berarti paham, ke kiri berarti ulang. Panah keyboard kanan dan kiri melakukan hal yang sama.
- Setelah swipe, kartu berikutnya muncul dan progres sesi bertambah, misalnya 7 dari 15.
- Status per kartu tersimpan. Kalau user menutup dan membuka lagi, kartu yang sudah dinilai tetap berstatus.
- Tersedia tombol "acak ulang" dan "ulangi yang salah".
- Aksi ekspor ke Markdown dengan pemisah yang jelas antara pertanyaan dan jawaban.

### 7.4 Tab Tanya Mindo

- Area percakapan. Pertanyaan user, jawaban tutor.
- Jawaban memuat markdown sederhana. Kalau jawaban menyertakan sitasi, sitasi tampil sebagai label waktu yang bisa diklik.
- Menampilkan sumber audio: pemutar atau tombol putar dari detik yang dikutip.
- Kalau jawaban menyatakan topik tidak dibahas di rekaman, tampilkan dengan label yang jelas, bukan seperti jawaban biasa.
- Kotak input tetap aktif saat jawaban sedang dibuat. User bisa langsung mengetik pertanyaan berikutnya.

## 8. Rekaman

- Tombol rekam dan stop, dengan indikator waktu berjalan yang nyata.
- Indikator level volume, supaya user tahu mikrofon menangkap suara.
- Setelah rekaman selesai, durasi dan ukuran file ditampilkan sebelum dikirim.
- Ukuran file dihitung selama rekaman, karena itu batas yang menentukan berhasil atau tidak.
- Peringatan muncul kalau rekaman mendekati 25 MB.

## 9. Daftar komponen

| Komponen | Dipakai di |
|---|---|
| Tombol | semua layar |
| Field input, Field password | pengaturan, chat |
| Panel tab | materi |
| Kartu flashcard | materi |
| Pemutar peta konsep | materi |
| Panel percakapan | materi |
| Panel transkrip | materi |
| Dialog konfirmasi | pengaturan, dashboard |
| Toast | hasil aksi, error singkat |
| Skeleton | daftar materi, daftar segmen transkrip |
| Pemutar audio | materi, tutor |

## 10. Inventaris keputusan visual

Keputusan berikut belum diambil dan milik Hipster. Daftar yang harus diisi:
- Tipografi: satu atau dua keluarga, skala, dan bobot.
- Palet: warna latar, permukaan, teks, aksen, plus warna status untuk setiap tahap.
- Bentuk: radius, garis, tinggi tombol, ketebalan border.
- Ikon: pakai satu set, bukan campuran.
- Animasi: durasi dan kurva untuk perpindahan tab, swipe kartu, dan perubahan status tahap.
- Kepadatan (density): berapa banyak informasi per layar tanpa membuat halaman terasa sesak.

## 11. Struktur file Figma yang disarankan

```
Mindo
  00 Cover
  01 Foundations   (warna, tipografi, spasi, komponen)
  02 Components
  03 Screens
     Landing
     Pengaturan
     Dashboard
     Pemrosesan
     Materi (4 tab, tiap tab desktop dan mobile, plus panel transkrip)
     Rekaman
  04 Prototype
  05 Archive
```

## 12. Checklist serah terima

- [ ] Semua layar punya state kosong, memuat, dan gagal.
- [ ] Semua elemen interaktif bisa diakses dengan keyboard saja, dengan fokus yang terlihat.
- [ ] Semua target sentuh minimal 44 x 44 px.
- [ ] Tidak ada scroll horizontal di 360 px.
- [ ] Kontras teks lolos AA.
- [ ] Setiap state gagal punya teks bahasa Indonesia dan aksi.
- [ ] Halaman mobile 375 px sudah dicek untuk empat tab materi.
- [ ] Prototype alur upload sampai review bisa diklik dari atas ke bawah tanpa bikin jarinya.