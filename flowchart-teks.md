# Alur Mindo (versi teks)

Versi teks biasa dari `flowchart.md`. Notasi: `->` langkah berikutnya, `?` pertanyaan/kondisi, `[Ya]`/`[Tidak]` cabang, `(db)` data disimpan.

## 1. Alur pengguna

```
MULAI: Beranda (/)

1. Cek API key
   ? API key sudah tersimpan
     [Belum] -> tempel API key Groq atau OpenAI (disimpan di localStorage)
     [Sudah] -> lanjut

2. Pilih sumber audio
   A. Upload file
      -> pilih file, drag-drop, atau muat rekaman contoh
      ? ukuran lebih dari 25 MB
        [Ya]    -> toast "File terlalu besar", kembali ke langkah 2
        [Tidak] -> klik Mulai
   B. Rekam langsung (/recording)
      -> minta izin mikrofon
      ? izin diberikan
        [Ditolak]   -> toast "Izinkan mikrofon", ulangi
        [Diizinkan] -> rekam (meter volume + timer)
      -> stop
      -> putar ulang, atau buang lalu rekam lagi
      -> klik Simpan

3. Simpan materi
   (db) materials.add { status: "pending", audio: file/blob }
   -> pindah ke /processing?id=<id>

4. Pemrosesan (lihat bagian 2)
   ? transkrip berhasil
     [Gagal]   -> tampil error + tombol "Coba Lagi" -> ulangi pemrosesan
     [Berhasil]-> tombol "Lihat Hasil" muncul setelah semua tahap selesai
   Kapan saja: klik "Batal" -> kembali ke Beranda

5. Halaman materi (/material?id=<id>)
   Isi halaman:
   - Tab Ringkasan
   - Tab Peta Konsep
   - Tab Flashcard (swipe: kiri = ulang, kanan = paham, grade disimpan)
   - Tanya Mindo (lihat bagian 3)
   - Tombol Transkrip (daftar segmen, klik untuk memutar audio di detik itu)
   - Ekspor (PNG peta konsep, Markdown ringkasan/flashcard/transkrip)

Jalur samping dari Beranda:
- Klik item riwayat   -> langsung ke /material?id=<id>
- Hapus materi        -> konfirmasi, hapus semua data materi itu, tetap di Beranda
- Lihat contoh        -> /demo
- Menu pengaturan     -> /settings (provider, API key, uji koneksi, hapus semua data)
```

## 2. Alur pemrosesan (/processing)

```
runPipeline()

1. ? API key ada
   [Tidak] -> tahap Transkrip GAGAL "API key belum diisi" -> berhenti
2. ? audio ada di IndexedDB
   [Tidak] -> tahap Transkrip GAGAL "File rekaman tidak ditemukan" -> berhenti
3. TAHAP 1: Transkrip (Whisper, language=id)
   ? berhasil
   [Error] -> GAGAL, pesan lewat humanError() -> berhenti
              (401 key ditolak, 413 file besar, 429 rate limit,
               jaringan, server tidak terjangkau, format ditolak, lainnya)
   [Ya]    -> (db) transcripts.put segmen
              (db) chunks.bulkPut (chunk ~60 detik)
              (db) materials.update { duration, status: "processing" }
4. ? teks transkrip kosong
   [Ya] -> GAGAL "Transkrip kosong, rekam ulang" -> berhenti
5. TAHAP 2-4: tiga agen jalan PARALEL (Promise.all)
   - Ringkasan  -> (db) summaries.put
   - Mindmap    -> (db) mindmaps.put
   - Flashcard  -> (db) flashcards: hapus lama, bulkAdd baru, grade = "unknown"
   Tiap agen punya status sendiri: pending -> running -> completed / failed
   Hasil disimpan segera saat agen itu selesai, tidak menunggu yang lain.
6. Status akhir materi
   ? semua agen sukses
     [Ya]    -> (db) materials.status = "done"
     [Tidak] -> (db) materials.status = "partial"

Retry ("Coba Lagi")
- Tahap Transkrip -> jalankan ulang seluruh pipeline dari langkah 1
- Tahap lain      -> hanya agen itu diulang, memakai transkrip yang sudah tersimpan
                     ? API key ada dan transkrip tersimpan, kalau tidak: tampil error
```

## 3. Alur Tanya Mindo (di /material)

```
1. User mengetik pertanyaan, kirim
2. ? API key ada
   [Tidak] -> balas "API key belum diisi"
3. Ambil chunks materi dari IndexedDB
   ? chunks kosong
   [Ya] -> balas "Transkrip belum tersedia"
4. Retrieval BM25 di browser (tanpa embedding, tanpa API tambahan)
5. LLM menjawab hanya dari potongan transkrip terpilih
   ? found
   [Tidak] -> balas "Tidak dibahas dalam rekaman ini"
   [Ya]    -> tampil jawaban + timestamp sitasi
6. Klik timestamp -> audio lompat dan diputar di detik itu
```

## Ringkasan satu baris

```
Beranda -> (API key) -> upload/rekam -> simpan ke IndexedDB -> Processing
  -> Transkrip -> [Ringkasan | Mindmap | Flashcard] paralel -> Materi
  -> review (tab, flashcard, tanya Mindo, ekspor)
```
