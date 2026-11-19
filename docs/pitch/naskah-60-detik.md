# Naskah Pitch: Mindo

Dua versi: 60 detik untuk pembuka atau sesi singkat, dan 6 menit untuk presentasi penuh.
Ganti `[A]`, `[B]`, `[C]` dengan nama pembicara. Jangan membaca kata per kata. Hafalkan tiga
kalimat kunci tiap bagian, sisanya improvisasi.

Kalimat kunci ditandai **tebal**.

---

## Versi 60 detik

**Tujuan:** membuat pendengar paham masalah, solusi, dan pembeda, tanpa perlu slide.

| Detik | Bagian | Isi |
|---|---|---|
| 0-8 | Hook | "Setiap kuliah dua jam, kami pulang membawa file rekaman dua jam. Dan tidak pernah kami buka lagi." |
| 8-20 | Masalah | "Bukan karena malas. Memutarnya ulang butuh dua jam lagi. Mencatat sambil mendengar itu mustahil. Akhirnya rekaman menumpuk, dan belajar cuma mengandalkan ingatan." |
| 20-32 | Solusi | "Mindo mengubah rekaman itu jadi empat bahan: transkrip, ringkasan, peta konsep, dan flashcard. Plus tutor AI yang bisa ditanya, dan menjawab dengan menunjuk detik rekamannya." |
| 32-45 | Pembeda | "Yang membedakan: tidak ada akun, tidak ada server data. Semua tersimpan di browser. Biaya AI dibayar langsung ke provider pilihan, dan dengan Groq, free tier-nya cukup untuk harian." |
| 45-55 | Bukti | "Hari ini Mindo sudah jalan. Upload, proses, belajar, ekspor. Build bersih, tanpa kerentanan dependensi produksi." |
| 55-60 | Ajakan | "Namanya Mindo. Dari rekaman, jadi paham." |

**Catatan penyampaian**

- Jangan buru-buru di 8 detik pertama. Hook harus terasa seperti cerita, bukan pengumuman.
- Angka "dua jam" diulang tiga kali dengan sengaja. Itu jangkar ingatan.
- Di detik 45, turunkan kecepatan. Itu bagian yang membuat orang percaya.

---

## Versi 6 menit

Pembagian waktu: pembuka 0:00, masalah 0:45, solusi 1:45, produk 3:00, AI 3:45, demo dan bukti
5:00, dampak dan penutup 5:30.

| Waktu | Slide | Pembicara | Bagian |
|---|---|---|---|
| 0:00-0:20 | 1 | [A] | Pembuka |
| 0:20-0:55 | 2 | [A] | Perkenalan produk dan tim |
| 0:55-1:45 | 3 | [A] | Masalah dan target |
| 1:45-3:00 | 4 | [B] | Solusi dan pembeda |
| 3:00-3:45 | 5 | [B] | Alur produk dan desain |
| 3:45-5:00 | 6 | [C] | Arsitektur AI dan logika |
| 5:00-5:30 | 7 | [C] | Demo dan validasi |
| 5:30-6:00 | 8-9 | [A] | Dampak, roadmap, penutup |

---

### 0:00-0:20, Slide 1, [A]

Pembuka. Berdiri diam, tidak di depan layar.

> Selamat pagi. Kami dari tim [Nama Tim].
>
> Sebelum mulai, satu pertanyaan. Siapa di sini pernah merekam kuliah, lalu tidak pernah memutar
> rekaman itu lagi?

Tunggu dua detik. Jangan menunggu jawaban benar-benar diangkat tangan.

> Kami juga. Dan itu justru masalah yang kami bawa ke sini.

**Jangan:** membuka dengan "Kami akan mempresentasikan produk bernama Mindo yang merupakan
aplikasi berbasis AI". Itu membuang 8 detik pertama.

---

### 0:20-0:55, Slide 2, [A]

> Mindo adalah asisten belajar dari rekaman kuliah. Satu rekaman masuk, keluar empat bahan:
> transkrip, ringkasan, peta konsep, dan flashcard. Ada juga Tutor AI yang bisa ditanya seputar
> rekaman itu.
>
> Tagline kami sederhana: **dari suara dosen jadi paham, sekali klik.**
>
> Saya [A], di tim ini sebagai Hustler. Bersama saya, [B] sebagai Hipster, dan [C] sebagai Hacker.
> Tiga peran, satu alur: masalah, desain, lalu kode.

**Jangan:** menyebut nama tim tanpa arti. Kalau namanya punya makna, satu kalimat cukup. Kalau
tidak, langsung ke produk.

---

### 0:55-1:45, Slide 3, [A]

> Yang kami lihat di kelas: rekaman menghasilkan rekaman baru. Kuliah dua jam, file dua jam.
> Mahasiswa memutar dua jam lagi. Itu bukan belajar, itu memutar ulang waktu.
>
> Ada tiga hal yang bikin rekaman tidak pernah dibuka.
>
> Pertama, biaya waktunya. Mendengarkan sambil mencatat itu tidak bisa dua-duanya. Hasilnya catatan
> setengah, ingatan setengah.
>
> Kedua, tidak ada peta. Setelah kuliah selesai, kita tidak tahu menit ke berapa yang penting.
> Mencari satu istilah berarti menebak sambil menggeser pemutar.
>
> Ketiga, privasi. Rekaman kuliah kadang berisi diskusi internal, contoh kasus, atau sekadar suara
> dosen yang tidak nyaman diunggah ke server orang lain. Tool populer meminta akun dulu, baru
> boleh memproses.
>
> Pengguna yang kami targetkan bukan semua mahasiswa. Yang kami targetkan adalah **mahasiswa yang
> sudah punya rekaman, tapi tidak pernah membukanya lagi.** Mereka sudah punya bahan baku. Yang
> belum ada: jalurnya.

**Jangan:** bilang "berdasarkan survei kami, 90 persen mahasiswa". Kalau belum ada survei, juri
akan menanyakan instrumennya.

---

### 1:45-3:00, Slide 4, [B]

> Mindo mengubah rekaman jadi bahan belajar dalam satu alur. Input satu: audio atau video, upload
> atau rekam langsung dari browser. Hasilnya empat.
>
> Ringkasan terstruktur, untuk tahu garis besar. Peta konsep, untuk melihat hubungan antar ide.
> Flashcard, untuk menguji diri. Dan Tutor AI, untuk bertanya saat bagian tertentu belum jelas.
>
> Semuanya berasal dari transkrip yang sama. Itu penting, karena artinya tidak ada dua versi
> materi yang saling bertentangan.
>
> Sekarang, apa yang berbeda.
>
> Pertama, **bukan cuma transkripsi.** Otter dan Notta berhenti di teks. Mindo lanjut ke bentuk yang
> benar-benar dipakai untuk belajar.
>
> Kedua, **tanpa akun dan tanpa server data.** Audio dan hasilnya tinggal di IndexedDB di browser.
> Pindah perangkat pakai ekspor ZIP, bukan sinkronisasi diam-diam.
>
> Ketiga, **BYOK.** Kita tidak memungut langganan. Pengguna memilih provider sendiri. Groq punya
> free tier permanen tanpa kartu kredit. OpenAI untuk yang mau kualitas lebih tinggi. Enam provider
> total, empat di antaranya teks, Ollama jalan lokal.
>
> Keempat, **tutor yang mengaku tidak tahu.** Setiap jawaban menunjuk timestamp. Kalau tidak ada
> di rekaman, dia bilang tidak ada.

**Transisi:** bagian yang paling sering ditanyakan: bagaimana bentuk produknya?

**Jangan:** menyebut "gratis selamanya". Sebut "tanpa langganan platform" dan "ada free tier".

---

### 3:00-3:45, Slide 5, [B]

> Alurnya lima langkah.
>
> Pengaturan, sekali saja: pilih provider, tempel API key, uji koneksi.
>
> Dasbor: tarik file, atau rekam.
>
> Processing: transkripsi dulu, lalu tiga agen jalan paralel.
>
> Ruang materi: empat tab, satu sumber.
>
> Ekspor: Markdown, PNG untuk peta konsep, atau ZIP untuk seluruh materi.
>
> Yang tidak kelihatan di screenshot tapi kami anggap penting: setiap layar data punya tiga
> kondisi. Kosong, memuat, gagal. Kalau satu tahap gagal, misalnya ringkasan, kami tidak
> mengulang transkripsi. Tahap yang sudah sukses disimpan, dan pengguna bisa mencoba ulang tahap
> yang gagal saja.
>
> Desainnya sengaja tenang. Latar off-white, teks hampir hitam, satu aksen hijau. Gerak hanya
> dipakai saat menjelaskan perubahan state. Ini supaya bahan belajar yang dibaca, bukan animasinya.

---

### 3:45-5:00, Slide 6, [C]

> Dari sisi sistem, pertanyaannya: kalau tidak ada backend, apa yang sebenarnya terjadi?
>
> Pertama, audio tidak pernah mampir ke kami. File dipilih di browser, lalu dikirim langsung ke
> endpoint provider yang dipilih pengguna. Kami tidak punya API route yang menampung data.
>
> Transkripsi memakai Whisper. Groq menjalankan `whisper-large-v3`, OpenAI `whisper-1`. Bahasa
> dipaksa Indonesia. Hasilnya segmen bertimestamp, bukan satu blok teks.
>
> Setelah transkrip selesai, tiga agen teks jalan **paralel**, bukan berurutan. Kenapa paralel?
> Karena tidak ada yang saling bergantung. Total waktu jadi ditentukan agen paling lambat, bukan
> jumlah ketiganya.
>
> Tiap agen mengisi skema JSON. Ringkasan: judul, lima sampai sepuluh bagian, poin dan istilah.
> Peta konsep: node hierarkis maksimal tiga level. Flashcard: pertanyaan, jawaban, tingkat
> kesulitan, timestamp rujukan.
>
> Di sini bagian yang sering diabaikan: **validasi.** JSON dari model tidak langsung dipercaya.
> Kami validasi dengan Zod. Kalau bentuknya salah, ditolak. Lebih baik gagal terang-terangan
> daripada menampilkan data rusak.
>
> Untuk Tutor AI, kami tidak memakai vector database. Satu rekaman hanya punya ratusan chunk.
> Kami potong transkrip, lalu cari dengan **BM25**, yang jalan di browser tanpa biaya. Ambil
> lima chunk terbaik, tambahkan tetangganya sebagai konteks. Untuk pertanyaan menyeluruh seperti
> "poin utamanya apa", kami sebar dua belas chunk supaya model melihat seluruh rekaman.
>
> Model dipaksa menjawab hanya dari konteks. Outputnya punya field `found` dan `citations`. Kalau
> tidak ada dasar, dia bilang topik itu tidak dibahas. Bukan mengarang.
>
> Semua hasil berakhir di IndexedDB lewat Dexie. Itu sebabnya aplikasi bisa jalan sebagai static
> export, tanpa server aplikasi sama sekali.

**Jangan:** menyebut "vector database" sebagai hal yang lebih canggih. Kalau ditanya, jawab
BM25 dipilih karena cukup, murah, dan mudah diperiksa. Bukan karena tidak mampu.

---

### 5:00-5:30, Slide 7, [C]

Demo 60 sampai 90 detik, sambil bicara.

> Saya pilih satu rekaman yang sudah disiapkan. Di sini empat tahapnya.
>
> Transkrip selesai. Sekarang perhatikan: ringkasan, peta konsep, dan flashcard selesai hampir
> bersamaan, karena memang paralel.
>
> Saya buka peta konsep. Node bisa dibuka dan digeser.
>
> Sekarang Tutor. Saya tanya hal yang ada di rekaman. Jawabannya menyebut menit dan detik.
>
> Saya tanya hal yang tidak ada di rekaman. Dia bilang tidak dibahas. Ini yang kami maksud
> kejujuran yang dipaksa oleh sistem.
>
> Terakhir, ekspor. ZIP ini berisi seluruh materi, bisa diimpor di perangkat lain.

Kalau demo gagal, langsung pindah ke video cadangan. Jangan memperbaiki di panggung lebih dari
sepuluh detik.

> Kalau soal validasi: build bersih, type check bersih, lint bersih, dan nol kerentanan di
> dependensi produksi. Yang sengaja belum kami klaim: akurasi transkrip dan penghematan waktu.
> Itu butuh uji berlabel dan pengguna nyata, dan itu agenda terdekat kami.

---

### 5:30-6:00, Slide 8 dan 9, [A]

> Dampaknya sederhana. Rekaman yang sudah ada jadi berguna. Tidak ada biaya langganan. Tidak ada
> profil belajar mahasiswa yang berpindah tangan.
>
> Nilai yang kami pertahankan: **alat belajar tidak seharusnya menahan data yang dipelajari.**
>
> Ke depan, arah kami satu. Transkripsi lokal lewat WebGPU, supaya Mindo bisa dipakai tanpa
> internet dan tanpa API key. Setelah itu, sinkronisasi tanpa server, lalu pakai bersama di
> tingkat program studi.
>
> Mindo. Dari rekaman, jadi paham.
>
> Terima kasih. Kami siap menjawab pertanyaan.

**Jangan:** menutup dengan "demikian presentasi dari kami, mohon maaf bila ada kekurangan".
Itu menghapus seluruh kesan terakhir.

---

## Jawaban pendek untuk sesi tanya jawab

Aturan: maksimal 20 detik per jawaban. Kalau butuh lebih, berarti belum dikuasai.

**"Ini cuma wrapper ChatGPT ya?"**
> Bukan. ChatGPT tidak menyimpan rekaman, tidak memberi segmen bertimestamp, dan tidak punya
> ruang kerja berisi riwayat materi. Kami membangun pipeline: transkripsi, tiga agen terstruktur,
> retrieval BM25, sitasi detik, lalu penyimpanan lokal. Model hanya salah satu komponen.

**"Bedanya dengan NotebookLM apa? Bukannya itu sudah bisa semua?"**
> "Betul, NotebookLM lebih matang. Dia menyimpan sumber di akun Google dan memakai Gemini.
> Mindo tidak punya akun dan tidak punya server data: rekaman tinggal di browser, provider
> dipilih sendiri, hasilnya keluar sebagai file. Untuk meringkas PDF, NotebookLM lebih baik.
> Bedanya di siapa yang memegang rekaman."

**"Jadi Mindo cuma NotebookLM versi lokal?"**
> "Bukan. NotebookLM ruang riset dengan banyak jenis sumber. Mindo satu jalur spesifik: rekaman
> kuliah masuk, satu paket bahan belajar keluar, tanpa akun. Yang mirip sebagian outputnya. Yang
> beda justru yang menentukan: siapa menyimpan, siapa memilih model, dan apakah hasilnya bisa
> dibawa pergi."

**"Mindo berarti lebih aman dari Google?"**
> "Tidak. Yang bisa saya klaim cuma: tidak ada data di kami. Audio tetap dikirim ke provider
> yang dipilih, dan provider itu punya kebijakan sendiri. Tidak ada audit, tidak ada sertifikasi.
> Kalau soal keamanan perusahaan, Google punya lebih banyak sumber daya."

**"Kenapa tidak pakai vector database? Kan lebih modern."**
> Untuk satu rekaman, chunk-nya ratusan. BM25 cukup, nol biaya, jalan di browser. Vector database
> menambah server dan biaya tanpa lompatan kualitas yang sepadan di skala ini. Kalau nanti
> pencarian lintas banyak materi, kami evaluasi.

**"API key di browser itu tidak aman."**
> Betul, dan itu batasannya. Key tidak pernah dikirim ke domain kami, hanya ke provider yang
> dipilih. Tapi key di perangkat bersama tetap berisiko. Karena itu ada tombol hapus key, dan
> kami tidak menganjurkan pemakaian di komputer publik. Untuk versi kampus, key sebaiknya
> dikelola di tingkat program studi.

**"Kalau user hapus data browser, datanya hilang?"**
> Ya. Itu konsekuensi local-first, dan kami sebutkan di produk. Mitigasinya ekspor ZIP. Sinkronisasi
> otomatis belum ada.

**"Bagaimana kalau internet mati di kelas?"**
> Tahap AI berhenti. Materi yang sudah ada tetap terbuka. Untuk offline penuh, rencananya
> transkripsi lokal lewat WebGPU, belum di versi ini.

**"Berapa biayanya per mahasiswa?"**
> Tergantung provider. Dengan Groq free tier, nol. Dengan OpenAI, dihitung per menit audio dan per
> token. Kami belum mengukur rata-rata karena belum punya pengguna nyata. Yang pasti: tidak ada
> biaya server di sisi kami.

**"Apa bagian tersulit?"**
> Membuat pipeline yang tahan gagal. Satu tahap gagal tidak boleh menghapus hasil tahap lain,
> dan retry tidak boleh mengulang transkripsi yang sudah selesai. Itu terlihat sepele sampai
> dipakai di jaringan kampus.

**"Apa yang belum selesai?"**
> Validasi pengguna dan pengukuran akurasi. Produknya jalan, buktinya belum cukup. Itu jujur, dan
> itu agenda berikutnya.

---

## Kalimat yang tidak boleh diucapkan

| Jangan | Ganti dengan |
|---|---|
| "Gratis selamanya" | "Tanpa langganan platform, dan ada free tier provider" |
| "100 persen offline" | "Data tersimpan lokal, transkripsi masih butuh internet" |
| "Data tidak pernah keluar dari perangkat" | "Data tidak pernah lewat server kami" |
| "Akurat 95 persen" | "Akurasi belum kami ukur" |
| "Dipakai banyak mahasiswa" | "Dibangun untuk mahasiswa, validasi berikutnya" |
| "NotebookLM belum bisa audio" | "NotebookLM punya Audio Overview, dan itu bagus" |
| "NotebookLM belum bisa flashcard" | "Bedanya bukan fitur, tapi arsitektur: akun dan tempat data" |
| "Mindo lebih aman" | "Tidak ada data di kami yang bisa bocor" |
| "Tidak ada koneksi ke AI" | "Langsung ke provider pilihan pengguna" |
| "Revolusioner" | Sebut hal konkret yang berubah |
| "Ekosistem" | Sebut produknya |
| "Sinergi" | Sebut kerja samanya |
| "Menggantikan dosen" | "Membantu mahasiswa mengolah materi" |
| "AI kami" | "Model yang kami pakai" |

---

## Latihan

1. Rekam suara versi 6 menit. Dengarkan ulang tanpa melihat naskah.
2. Tandai setiap "eh", "gitu", "kayak", "jadi". Latihan kedua: hilangkan.
3. Latihan dengan timer berjalan di depan mata. Kelebihan waktu biasanya di bagian masalah.
4. Latihan menjawab 8 pertanyaan di atas dalam 20 detik, direkam.
5. Latihan demo dengan jaringan dimatikan, untuk tahu di titik mana gagal dan apa yang dikatakan.
6. Latihan terakhir: tanpa slide. Kalau masih bisa menjelaskan alurnya, slide-nya sudah tidak
   menopang apa pun.
