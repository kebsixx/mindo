# AI Agents: Mindo

Terakhir diverifikasi: 22 Oktober 2026.

Istilah "agent" di dokumen ini berarti satu langkah pipeline dengan kontrak masuk dan keluar yang tegas. Tidak ada agent yang berloop, memakai alat, atau mengambil keputusan sendiri. Orkestrator di browser menjalankan langkah-langkah itu, sebagian paralel, sebagian berurutan.

Empat dari lima agen mengembalikan JSON yang divalidasi skema. Agen kelima, tutor, mengembalikan jawaban teks beserta daftar timestamp sumber, juga dalam JSON dengan skema yang sama.

## 1. Peta kontrak

| Agen | File | Model | Masukan | Keluaran | Skema ketat | Streaming |
|---|---|---|---|---|---|---|
| Transcriber | `lib/ai/agents/transcribe.ts` | `whisper-large-v3` | file audio | segmen bertimestamp | tidak | tidak |
| Summarizer | `lib/ai/agents/summarize.ts` | `openai/gpt-oss-120b` | transkrip | JSON bagian | ya | tidak |
| Mindmapper | `lib/ai/agents/mindmap.ts` | `openai/gpt-oss-120b` | transkrip, ringkasan | JSON pohon | ya | tidak |
| Flashcarder | `lib/ai/agents/flashcard.ts` | `openai/gpt-oss-120b` | transkrip, ringkasan | JSON kartu | ya | tidak |
| Tutor | `lib/ai/agents/tutor.ts` | `openai/gpt-oss-120b` | pertanyaan, potongan transkrip | JSON jawaban | ya | tidak |

Skema ketat berarti `response_format: { type: "json_schema", json_schema: { strict: true, schema } }` di sisi provider. Mode ini tersedia di Groq untuk `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, dan `qwen/qwen3.8-27b`. Konsekuensinya: streaming tidak bisa dipakai, dan semua field harus wajib.

## 2. Aturan yang berlaku untuk semua agen

1. Sumber kebenaran hanya transkrip. Agen tidak boleh menambahkan fakta dari pengetahuannya sendiri.
2. Kalau informasinya tidak ada di transkrip, agen menyatakan tidak ada. Bukan menebak, bukan mengisi dengan kalimat umum.
3. Bahasa keluaran Indonesia, gaya kalimat akademik yang wajar.
4. Skema didefinisikan sekali di `lib/ai/schema.ts` dengan zod, lalu dikonversi ke JSON Schema lewat `z.toJSONSchema()`. Hasil respons divalidasi ulang dengan zod di sisi client, karena skema ketat tidak dijamin di semua provider.
5. `temperature: 0` untuk agen ekstraksi, `0.3` untuk tutor.
6. `include_reasoning: false` dan `reasoning_effort: "low"`. Model gpt-oss adalah model reasoning, field `reasoning` akan kosong di respons kalau dimatikan.

## 3. Agen 1: Transcriber

Bukan LLM. Panggil endpoint transkripsi provider.

**Request**

```
POST https://api.groq.com/openai/v1/audio/transcriptions
Content-Type: multipart/form-data
```

| Field | Nilai | Alasan |
|---|---|---|
| `file` | blob audio | maks 25 MB |
| `model` | `whisper-large-v3` | akurasi bahasa Indonesia di atas `whisper-large-v3-turbo` |
| `language` | `id` | memaksa model agar tidak salah deteksi bahasa Indonesia sebagai bahasa lain |
| `response_format` | `verbose_json` | satu-satunya mode yang mengembalikan segmen dan timestamp |
| `timestamp_granularities[]` | `segment` | timestamp per segmen, cukup untuk chunking dan sitasi |
| `temperature` | `0` | transkrip deterministik |

**Respons provider**

```json
{
  "text": "...",
  "segments": [{ "id": 0, "start": 0.0, "end": 4.2, "text": "..." }],
  "language": "indonesian",
  "duration": 3612.4
}
```

**Normalisasi sebelum disimpan**

- Buang segmen dengan teks kosong setelah `trim`.
- Buang segmen yang `end`-nya lebih kecil dari `start`.
- Simpan `segments` apa adanya, tidak digabung dan tidak diurutkan ulang. Field `text` dipakai untuk pencarian dan pengukuran, `segments` untuk detail dan sitasi.

**Batas ukuran.** 25 MB adalah batas unggahan Groq di free tier. Batas ini dicek di browser sebelum request. Audio 90 menit mp3 128 kbps sekitar 85 MB dan pasti ditolak provider.

## 4. Agen 2: Summarizer

**Tujuan.** Mengubah transkrip jadi bagian-bagian yang bisa dipindai, bukan ringkasan paragraf.

**Kontrak keluaran**

```json
{
  "title": "string",
  "sections": [
    {
      "heading": "string",
      "points": ["string"],
      "keyTerms": ["string"]
    }
  ]
}
```

Aturan skema: `additionalProperties: false` di semua objek, semua field wajib, `sections` 3 sampai 12 item, `points` 2 sampai 6 item per bagian, `keyTerms` maksimal 8 item.

Rentang skema lebih longgar dari yang diminta prompt. Prompt meminta 5 sampai 10 bagian, skema menerima 3 sampai 12. Ini disengaja: model yang terlalu sedikit atau terlalu banyak bagian tidak langsung gagal, tapi di luar rentang target.

**Strategi prompt.** Instruksi sistem berbahasa Indonesia:

```
Kamu adalah analis materi kuliah. Sumber tunggalmu adalah teks transkrip di bawah.
Aturan:
1. Jangan menambahkan informasi yang tidak ada di transkrip.
2. Kalau sebuah bagian tidak menjelaskan sub-topik apa pun, jangan sertakan.
3. Tulis poin sebagai kalimat lengkap, bukan frasa kunci.
4. keyTerms berisi istilah dari materi, bukan istilah umum seperti "materi" atau "pembahasan".
5. Buat 5 sampai 10 bagian, mengikuti urutan pembahasan di rekaman.
6. Balas hanya JSON sesuai skema.
```

Transkrip dikirim dengan penanda waktu, satu segmen per baris:

```
[00:00-00:04] Selamat pagi, hari ini kita akan membahas ...
[00:04-00:11] Yang pertama perlu kita pahami adalah ...
```

**Batas konteks.** Transkrip satu jam bahasa Indonesia sekitar 15.000 token. Context window model 131.072 token, jadi muat penuh. Kalau perkiraan token melewati 80.000 (rekaman lebih dari 5 jam), transkrip dipecah jadi beberapa bagian, tiap bagian disummarikan terpisah, lalu hasilnya digabung dalam satu panggilan kedua dengan prompt "gabungkan".

**Fallback.** Kalau `gpt-oss-120b` mengembalikan 429 atau 503, pakai `gpt-oss-20b`. Kalau tetap gagal, status agen jadi `failed` dan pipeline lain berjalan.

## 5. Agen 3: Mindmapper

**Tujuan.** Peta hierarki yang bisa digeser dan dibuka. Maksimal 3 level supaya peta tidak terlalu padat.

**Kontrak keluaran**

```json
{
  "title": "string",
  "children": [
    {
      "label": "string",
      "children": [
        {
          "label": "string",
          "children": []
        }
      ]
    }
  ]
}
```

Level 3 adalah daun: `children` harus array kosong. Skema ditulis dengan tiga tingkat eksplisit, bukan `$ref` rekursif, supaya mode `strict` dijamin diterima provider dan validator zod bisa menulis aturan per level. Aturan: `children` level 1 maksimal 8 item, level 2 maksimal 6 item, level 3 maksimal 4 item, total node maksimal 60.

**Strategi prompt.** Inputnya transkrip plus ringkasan hasil agen Summarizer, karena ringkasan sudah memisahkan sub-topik. Instruksi ke model: buat 4 sampai 8 cabang utama yang mengikuti urutan pembahasan di rekaman, bukan pengelompokan berdasarkan teori atau kategori.

**Pemetaan ke render.** `markmap-view` menerima `IPureNode`, yaitu `{ content, children }`. Dua hal yang perlu diperhatikan:
- `content` dibaca sebagai HTML, bukan teks biasa. Label dari LLM wajib di-escape sebelum masuk ke `content`, supaya karakter seperti `<` dan `&` tidak jadi tag.
- `setData` mengembalikan promise, jadi pemanggil harus `await` sebelum memanggil `fit()`.

Konversinya cuma pemetaan nama field, tanpa transformasi struktur. Peta dibangun dengan `Markmap.create(svg, opts, data)`, lalu di-update dengan `setData`. Gaya bawaan sudah menyuntikkan CSS global ke dalam SVG, jadi tidak perlu file CSS terpisah untuk markmap.

**Fallback.** Kalau hasil tidak valid skema (misalnya level lebih dalam dari 3), validator memangkas level 4 ke bawah dan menandai hasilnya sebagai hasil yang dipangkas. Kalau JSON-nya rusak total, retry sekali dengan pesan error validasi, lalu tukar model, lalu gagal.

## 6. Agen 4: Flashcarder

**Tujuan.** Bank soal active recall yang jawabannya bisa dicek ke rekaman.

**Kontrak keluaran**

```json
{
  "cards": [
    {
      "question": "string",
      "answer": "string",
      "difficulty": "easy",
      "timestampRef": 125.4
    }
  ]
}
```

`difficulty` punya tiga nilai: `easy`, `medium`, `hard`. `timestampRef` adalah detik dari awal rekaman, harus menunjuk segmen yang benar-benar memuat jawabannya.

Inputnya transkrip plus ringkasan hasil agen Summarizer. Ringkasan dipakai sebagai peta: kartu sebaiknya tersebar ke semua sub-topik, bukan menumpuk di bagian pertama saja.

**Strategi prompt.** Instruksi sistem:

```
Buat flashcard dari materi ini.
Aturan:
1. Satu kartu satu konsep. Jangan menggabung dua topik dalam satu pertanyaan.
2. Pertanyaan harus bisa dijawab dari materi, bukan dari cerita pribadi atau opini.
3. Jawaban maksimal dua kalimat.
4. difficulty easy untuk definisi, medium untuk hubungan antar konsep, hard untuk rumus, pembeda, atau kasus.
5. Isi timestampRef dengan detik saat konsep itu dibahas.
6. Pastikan tiap sub-topik dalam ringkasan punya minimal satu kartu.
7. Balas hanya JSON sesuai skema.
```

Jumlah kartu diminta 10 sampai 20 sesuai PRD bagian 7. Batas bawah skema 8, bukan 10, supaya model yang terlalu sedikit kartunya tidak langsung gagal validasi.

**Validasi timestamp.** Client memvalidasi `timestampRef` terhadap daftar segmen: nilai harus jatuh di dalam rentang salah satu segmen. Nilai yang jatuh di luar rentang dipetakan ke segmen terdekat dan ditandai supaya bisa diperiksa manual. Kartu tanpa timestamp yang valid dibuang.

**Grading.** Field `grade` (`unknown`, `repeat`, `known`) ada di database, bukan di respons LLM. LLM tidak boleh menentukan apakah mahasiswa paham.

## 7. Agen 5: Tutor

**Tujuan.** Menjawab pertanyaan mahasiswa hanya dari isi rekaman yang sama.

**Langkah 1: retrieval, di browser.**

1. Transkrip sudah dipecah jadi chunk 60 detik saat pipeline berjalan, sebelum agen apa pun dipanggil. Lihat `architecture.md` bagian 7.
2. `lib/retrieval/bm25.ts` menghitung skor BM25 atas chunk untuk pertanyaan user.
3. Ambil 5 chunk teratas. Untuk tiap chunk, sertakan juga chunk sebelum dan sesudahnya sebagai konteks, supaya kalimat tidak terpotong di batas chunk. Total sekitar 15 chunk, kira-kira 3.750 token.
4. Kalau skor terbaik di bawah ambang batas, agen menjawab "tidak dibahas" tanpa memanggil LLM sama sekali. Ini menghemat kuota dan mencegah jawaban karangan.

**Kontrak keluaran**

```json
{
  "found": true,
  "answer": "string berisi markdown",
  "citations": [125.4, 340.8]
}
```

`found` false berarti rekaman tidak membahas topik itu. `answer` pada kasus itu boleh satu kalimat penegas, tanpa spekulasi. `citations` adalah detik yang mengelilingi bukti di transkrip.

**Strategi prompt.** Instruksi sistem:

```
Kamu adalah tutor untuk satu rekaman kuliah. Kamu hanya boleh memakai konteks yang diberikan.
Aturan:
1. Kalau konteks tidak memuat jawabannya, isi found dengan false dan answer dengan satu kalimat yang menyatakan topik itu tidak dibahas di rekaman.
2. Kalau konteks memuat jawabannya, jawab ringkas tapi lengkap. Sertakan kutipan singkat dari transkrip.
3. Isi citations dengan detik yang sesuai dengan bagian yang kamu pakai.
4. Jangan memakai pengetahuan di luar konteks. Kalau kamu merasa perlu, itu tanda konteksnya kurang.
5. Balas hanya JSON sesuai skema.
```

**Tampilan.** `citations` diklik untuk menjalankan pemutar audio ke detik tersebut. Kalau `citations` kosong padahal `found` true, UI menampilkan label "tanpa sumber terverifikasi" supaya user tahu untuk memeriksa sendiri.

**Perubahan yang belum ada.** Kalau jawaban terasa lambat, tambahkan mode streaming: model streamed sebagai teks dengan penanda `[mm:ss]`, client mem-parsing penanda itu jadi citations. Kontrak JSON di atas tidak bisa dipakai bersamaan dengan streaming, jadi itu perubahan nyata, bukan tambahan kecil.

## 8. Validasi dan retry

Urutan penanganan error, sama untuk semua agen:

1. Respons tiba, `JSON.parse` dicoba.
2. Kalau gagal, retry sekali dengan pesan error validasi ikut dalam percakapan.
3. Kalau gagal lagi, ganti model (`gpt-oss-120b` ke `gpt-oss-20b`), retry sekali.
4. Kalau gagal lagi, agen ditandai `failed` dengan pesan yang bisa dibaca user. Hasil agen lain tetap utuh.

| Kode atau gejala | Tindakan |
|---|---|
| 401 `invalid_api_key` | Hentikan pipeline. Arahkan user ke halaman pengaturan. Jangan retry. |
| 413 `file too large` | Tampilkan batas 25 MB dengan saran kompresi. Jangan retry. |
| 429 `rate_limit_exceeded` | Tunggu sesuai header `retry-after`, lalu coba lagi. Maksimal 3 kali. |
| 503 `model_overloaded` | Ganti model, lalu retry. |
| Timeout jaringan | Retry dengan backoff 2 detik, 4 detik, 8 detik. |
| JSON rusak | Retry dengan pesan error validasi, lalu ganti model. |
| JSON valid tapi tidak sesuai skema | Validasi zod menolak. Retry dengan pesan error, lalu pangkas kalau mungkin, lalu gagal. |

## 9. Perkiraan token

Perkiraan kasar pakai panjang karakter dibagi 3,5 untuk teks Indonesia.

| Bagian | Estimasi token |
|---|---|
| Transkrip rekaman 1 jam | 15.000 |
| Ringkasan | 1.200 |
| Peta konsep | 800 |
| Flashcard 15 kartu | 2.000 |
| Potongan retrieval untuk tutor | 3.750 |

Tiga agen dibuat paralel setelah transkrip selesai. Summarizer membawa 15.000 token input, Mindmapper membawa 16.200 (transkrip plus ringkasan), Flashcarder membawa 16.200 dengan cara yang sama. Total sekitar 47.400 token per rekaman, dengan batas 200.000 token per menit di free tier Groq. Masih ada ruang untuk rekaman berikutnya di menit yang sama.

## 10. Uji

- **Unit.** Chunking batas 60 detik, BM25 dengan fixture 5 chunk, skema zod menerima dan menolak kasus yang salah.
- **Kontrak.** Fixture respons provider yang sudah dibersihkan dari kunci disimpan di repo. Tiap parser agen diuji terhadap fixture-nya. Ini mengunci format tanpa memanggil API.
- **Manual.** Satu skrip yang menjalankan pipeline penuh dengan kunci sendiri, dipakai sebelum demo. Lihat `architecture.md` bagian 12 untuk alur deploy.

Pengujian otomatis tidak memanggil API. Kunci tidak pernah ada di CI.