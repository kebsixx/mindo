# Arsitektur: Mindo

Sistem: frontend Next.js, tanpa backend, tanpa database server. Semua pemrosesan AI jalan di browser user, langsung ke provider yang dipilih user.

Terakhir diverifikasi: 22 Oktober 2026.

---

## 1. Prinsip

1. **Local-first.** Data user tinggal di IndexedDB browser. Tidak ada server yang menyimpan apa pun.
2. **BYOK.** User memakai API key sendiri. Kunci disimpan lokal dan hanya dikirim ke provider itu.
3. **Serverless.** Hosting cuma menyajikan file statis. Tidak ada proses server, tidak ada biaya.
4. **Privacy by construction.** Tidak ada jalur kode yang mengirim audio atau transkrip ke domain kita.
5. **Degradable.** Kalau satu tahap AI gagal, tahap lain tetap utuh. Tidak ada kegagalan total.

## 2. Diagram

```
+--------------------------------------------------------------+
|  Browser user                                               |
|  +--------------------------------------------------------+ |
|  |  Next.js (App Router, static export)                   | |
|  |  +--------------+   +--------------+   +-------------+  | |
|  |  | UI (React)   |<->| Agent       |<->| IndexedDB   |  | |
|  |  | Tailwind     |   | Orchestrator |   | + Dexie     |  | |
|  |  +--------------+   +------+-------+   +-------------+  | |
|  +-------------------------|----------------------------+ |
+----------------------------|------------------------------+
                              | HTTPS, kunci milik user
                              v
               +-------------------------------+
               |  Provider AI                 |
               |  Groq (default) / OpenAI     |
               |  Provider Lain: Gemini,      |
               |  Claude, DeepSeek, Ollama    |
               |  (config di models.ts)       |
               |  STT + LLM                   |
               +-------------------------------+
```

Domain kita hanya menyajikan HTML, JS, dan CSS. Tidak ada endpoint API. Kalau ada request POST ke domain kita, itu bug.

## 3. Stack

| Lapisan | Pilihan | Versi terverifikasi | Alasan |
|---|---|---|---|
| Framework | Next.js App Router, output statis | 16.4.2 | Static export, tanpa runtime server, deploy sekali di Vercel. Semua rute statis, ID lewat query string. Lihat bagian 6. |
| UI | React | 19.3.1 | Ikut Next.js |
| Styling | Tailwind CSS | 4.3.3 | Config CSS-first, tanpa file config JS |
| Animasi | motion (penerus framer-motion) | 14.5.0 | Swipe flashcard, spring physics |
| Mindmap | markmap-view | 0.18.12 | Render JSON hierarki jadi SVG interaktif, zoom dan pan. Peer dependency `markmap-common` 0.18.9 ikut terpasang otomatis. `markmap-lib` tidak perlu karena Mindo membangun pohon sendiri, bukan mem-parsing markdown. |
| Penyimpanan | Dexie di atas IndexedDB | 4.4.6 | API promise, mudah migration |
| State | Zustand | 5.0.15 | Ringan, cukup untuk state ui dan pipeline |
| Ikon | lucide-react | 1.61.0 | Tree-shakeable |
| Validasi | zod | 4.6.7 | Validasi respons LLM dan input user |
| Test | Vitest | - | Ringan, jalan di Node tanpa browser |

Tidak ada LangChain, tidak ada vector database, tidak ada ORM. Alasannya di bagian 5.

## 4. Model AI

Semua nama model ada di satu file: `lib/ai/models.ts`. Ganti di satu tempat kalau provider berubah.

```ts
export const MODELS = {
  groq: {
    stt: "whisper-large-v3",
    llm: "openai/gpt-oss-120b",
    llmFast: "openai/gpt-oss-20b",
    embed: null,          // Groq tidak punya endpoint embeddings
  },
  openai: {
    stt: "whisper-1",
    llm: "gpt-4o-mini",
    embed: "text-embedding-3-small",
  },
} as const;
```

**Provider Tambahan (tersedia di environment OpenCode, butuh config manual):**

| Provider | Model LLM (tersedia) | STT | Embedding | Catatan |
|---|---|---|---|---|
| **Gemini 3.x** | `gemini-3.8-flash-high`, `gemini-3.5-flash-low`, `gemini-2.5-pro` | — | `gemini-embedding-001` | Butuh akun Google Cloud, config di `opencode.json` |
| **Claude 4.x** | `claude-sonnet-4-6`, `claude-opus-4-6-thinking` | — | — | Butuh akun Anthropic, config di `opencode.json` |
| **DeepSeek v4** | `deepseek-v4-pro`, `deepseek-v4-flash`, `deepseek-reasoner` | — | — | Butuh akun DeepSeek, config di `opencode.json` |
| **Ollama (Lokal)** | `ollama/gpt-oss:120b`, `ollama/qwen3.5`, `ollama/phi3` | `whisper-large-v3` (via Ollama) | — | Butuh Ollama terinstall di laptop, cocok user gaming |

**Peringatan deprecation.** `llama-3.3-70b-versatile` dan `llama-3.1-8b-instant` sudah dimatikan Groq pada 16 Agustus 2026. Jangan pakai. Pengganti resmi: `openai/gpt-oss-120b` atau `qwen/qwen3.8-27b`.

**Model reasoning.** `openai/gpt-oss-*` adalah model reasoning. Balasannya memuat field `reasoning` terpisah dari `content`. Set `include_reasoning: false` supaya reasoning tidak ikut tampil di UI, dan `reasoning_effort: "low"` untuk pekerjaan ekstraksi yang tidak butuh berpikir lama.

**UI Settings:** Hanya 2 pilihan utama (Groq + OpenAI). Provider lain & lokal di "Fitur Lanjut" (lihat `design.md` bagian 4).

## 5. Retrieval tanpa vector database

Draf awal menyebut embedding OpenAI plus vector store. Itu berarti user harus punya dua akun (Groq dan OpenAI) hanya untuk satu fitur. Dua fakta yang mengubah hitungannya:

- Transkrip satu jam bahasa Indonesia itu sekitar 15.000 token. Context window model 131.072 token. Jadi transkrip penuh muat.
- RAG dengan ChromaDB itu pencarian di corpus besar. Corpus kita satu dokumen.

**Keputusan: pakai retrieval leksikal (BM25) di browser, tanpa embedding, tanpa API tambahan.**

Alasannya:
- Satu provider saja, satu API key, satu akun. Sesuai janji BYOK.
- Nol request tambahan saat memproses rekaman, nol biaya embedding.
- Chunking per 60 detik, jadi sekitar 60 chunk untuk rekaman 1 jam. BM25 di atas 60 chunk berjalan milidetik di browser.
- Tidak ada dependensi browser baru.

Trade-off yang diterima: BM25 tidak paham sinonim seperti embedding. Mitigasi: jawaban selalu menyertakan kutipan dan timestamp supaya user bisa verifikasi sendiri. Kalau user merasa jawabannya meleset, tanya dengan istilah yang dipakai dosen, bukan sinonim.

**Naik kelas (opsional, tidak untuk v1):** kalau user memilih OpenAI, `text-embedding-3-small` bisa dipakai untuk retrieval vektor. Skema antarmuka retrieval dibuat sama (satu fungsi, dua implementasi) supaya tidak ada refactor besar nanti.

**Alternatif yang dipertimbangkan dan ditolak:** kirim semua transkrip ke LLM tiap kali ditanya. Murah secara implementasi, tapi boros token, lambat, dan tidak bisa menunjuk sumber jawaban dengan akurat.

## 6. Struktur folder

```
mindo/
  app/
    layout.tsx
    page.tsx                    landing
    (app)/
      dashboard/page.tsx        daftar materi
      processing/page.tsx       status tahap pipeline
      material/page.tsx         4 tab hasil
      recording/page.tsx        rekaman langsung
      settings/page.tsx         provider, API key, uji koneksi
  components/
    ui/                      tombol, tab, dialog, toast
    flashcard/               kartu swipe
    mindmap/                 wrapper markmap, ekspor PNG
    chat/                    tutor AI
    transcript/              panel daftar segmen
    recorder/                rekam lewat MediaRecorder
  lib/
    ai/
      models.ts              konfigurasi model
      client.ts              fetch ke provider, tanpa SDK
      schema.ts              JSON schema zod untuk tiap agen
      agents/
        transcribe.ts
        summarize.ts
        mindmap.ts
        flashcard.ts
        tutor.ts
    db/
      schema.ts              definisi Dexie
    retrieval/
      bm25.ts                implementasi BM25
      chunk.ts               segmentasi transkrip jadi chunk
    export/
      markdown.ts            ringkasan, flashcard, transkrip ke Markdown
      png.ts                 peta konsep ke PNG
    storage/
      settings.ts            localStorage untuk kunci dan preferensi
  public/
```

Tugas per file: satu file, satu tanggung jawab. Isi `agents/` sekumpulan fungsi murni yang menerima input dan mengembalikan output terstruktur, tanpa menyentuh DOM.

### ID materi lewat query string

ID materi dibuat di browser saat user mengunggah rekaman. Build Next.js terjadi sebelum itu, jadi path dinamis seperti `/material/[id]` tidak bisa dipakai bersama static export: dokumentasi Next.js menyatakan dynamic route tanpa `generateStaticParams` tidak didukung saat `output: 'export'`.

Keputusan: ID dibawa lewat query string, misalnya `/material?id=42`. Semua rute jadi file statis, tidak ada `generateStaticParams` yang perlu diisi.

Dua detail teknis yang harus dijaga:
- Halaman material membaca `id` di dalam `useEffect` dari `window.location.search`. Cara ini tidak memicu aturan Suspense boundary yang berlaku untuk `useSearchParams` saat halaman di-prerender.
- Kalau nanti tetap mau `useSearchParams`, komponen pembaca ID harus dibungkus `<Suspense>`. Tanpa itu, build gagal dengan "Missing Suspense boundary with useSearchParams".

Alternatif yang ditolak: App Router tanpa static export, cukup `next dev` dan `next build` biasa. Kekurangannya, ada runtime Node.js di Vercel yang sebenarnya tidak dipakai. Static export lebih jujur dengan arsitektur Mindo: hostingnya benar-benar cuma file statis.

### Dua hal yang bikin build gagal kalau dilupakan

Halaman di-prerender saat build, di server, tanpa browser. Semua akses ke browser harus dijaga.

1. `localStorage`, `indexedDB`, dan `navigator` tidak ada di server. Akses ke localStorage untuk API key harus di dalam `useEffect`, bukan di luar komponen. Dexie dipakai lewat `db` yang diinstansiasi di modul `lib/db/schema.ts`, jadi file itu hanya boleh di-import dari komponen berlabel `"use client"`.
2. Route Handler, Server Action, dan dynamic route tidak didukung static export. `next dev` dan `next build` sama-sama menolak features itu, jadi tidak ada ketidakcocokan antara dev dan build. Kalau muncul error yang menyebut fitur ini, berarti ada yang tidak sengaja masuk ke folder `app/`.

Alternatif stack yang dipertimbangkan dan ditolak: Vite plus React Router. Lebih ringan untuk SPA murni, tapi tim sudah memutuskan memakai Next.js dan App Router memberi satu tempat untuk semua konfigurasi. Kalau nanti static export jadi merepotkan, Vite adalah opsi yang lebih bersih.

## 7. Alur pemrosesan

```
1. User pilih file atau rekam
2. Cek ukuran (<= 25 MB) dan format
3. Kirim ke endpoint transkrip provider, response_format=verbose_json, language=id
4. Simpan segmen ke IndexedDB
5. Pecah transkrip jadi chunk (kelompok segmen 60 detik)
6. Jalankan 3 agen paralel: summarize, mindmap, flashcard
   - tiap agen pakai structured outputs dengan JSON schema
   - tiap agen punya status sendiri: pending, running, done, failed
7. Simpan tiap hasil langsung ke IndexedDB saat selesai (bukan menunggu semua)
8. Update UI: tab Ringkasan, Peta Konsep, Flashcard, Tanya Mindo aktif
```

Langkah 7 penting: kalau kartu gagal tapi peta konsep jadi, user tetap punya peta konsep. Retry per agen, bukan ulangi seluruh pipeline.

**Chunking.** Chunk dibentuk dari segmen Whisper yang berdekatan sampai total sekitar 60 detik, tanpa memotong segmen di tengah. Satu chunk kira-kira 250 token. Setiap chunk menyimpan rentang timestamp, jadi jawaban tutor bisa menunjuk detik yang tepat di audio.

**Structured outputs.** Groq menyediakan mode strict (constrained decoding) untuk `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, dan `qwen/qwen3.8-27b`. Semua field wajib, `additionalProperties: false`. Ini menghapus kelas bug "JSON valid tapi bentuknya salah". Skema didefinisikan di `lib/ai/schema.ts` dan divalidasi ulang dengan zod di sisi client, karena mode strict hanya dijamin di provider tertentu.

**Streaming.** Structured outputs tidak mendukung streaming. Jadi kelima agen itu non-streaming, respons penuh. Mode streaming untuk tutor ada di daftar ide ke depan, bukan di v1.

## 8. Penyimpanan

**localStorage** (kecil, sinkron, string)

| Kunci | Isi |
|---|---|
| `mindo.provider` | "groq" atau "openai" |
| `mindo.apiKey` | API key user |
| `mindo.prefs` | tema, bahasa, kartu terakhir yang dibaca |

**IndexedDB via Dexie** (besar, terstruktur)

```ts
db.version(1).stores({
  materials: "++id, title, createdAt, status",
  transcripts: "materialId",
  summaries: "materialId",
  mindmaps: "materialId",
  flashcards: "++id, materialId",
  chunks: "materialId, start",
});
```

`transcripts`, `summaries`, dan `mindmaps` memakai `materialId` sebagai primary key karena isinya satu per materi, jadi satu query sudah cukup.

`flashcards` berbeda. Satu materi punya banyak kartu dan tiap kartu punya status belajar sendiri (`grade`). Kalau `materialId` jadi primary key, hanya satu kartu bisa tersimpan per materi. Karena itu `++id` untuk kartu, dengan `materialId` sebagai index untuk mengambil semua kartu satu materi. `grade` ditulis ulang tiap kali user swipe, jadi tabel ini yang berubah paling sering.

`chunks` memakai primary key gabungan `materialId` plus `start`, karena tiap chunk punya detik awal sendiri dalam satu materi.

## 9. Keamanan

| Item | Keputusan |
|---|---|
| Kunci API | localStorage, dikirim hanya ke origin provider. Tidak pernah masuk request ke domain kita. Tidak pernah di-commit. |
| XSS | CSP ketat: `default-src 'self'`, allowlist origin provider, tanpa inline script, tanpa script pihak ketiga yang tidak perlu. |
| Dependency | Sedikit, semua terverifikasi. Tidak ada package UI pihak ketiga yang kuat. |
| Log | Tidak ada analytics yang mengidentifikasi user. Vercel Analytics opsional tanpa cookie, kalau dipakai. |
| Demo | Kunci tim dirotasi setelah presentasi. Kunci demo tidak di-commit ke repo, dimasukkan manual di laptop presentasi. |

**CORS terverifikasi.** Probe pada 22 Oktober 2026:

| Provider | Preflight OPTIONS | Header respons | Kesimpulan |
|---|---|---|---|
| Groq | 204, `access-control-allow-headers: authorization,content-type` | `access-control-allow-origin: *` | Panggilan dari browser langsung jalan |
| OpenAI | 200, echo origin | respons error tidak membawa header CORS | Preflight lulus, jalur error perlu diuji ulang sebelum dipakai sebagai cadangan |

Kesimpulan praktis: pakai Groq sebagai jalur utama. Jangan pakai SDK resmi yang memblokir pemanggilan dari browser. Panggil `fetch` langsung ke `https://api.groq.com/openai/v1/...` supaya tidak ada flag `dangerouslyAllowBrowser` yang perlu dipertanggungjawabkan di code review.

## 10. Batas provider yang harus dihormati UI

| Batas | Nilai | Dampak di UI |
|---|---|---|
| Ukuran file STT | 25 MB | Validasi sebelum upload, pesan jelas, tawarkan rekam langsung |
| Audio per hari | 28.800 detik (8 jam) di free tier | Tampilkan sisa kuota di pengaturan kalau provider mengizinkan |
| Request per menit | 20 (STT), 30 (LLM) | Retry dengan backoff, bukan request paralel tanpa batas |
| Token per menit | 200K | 3 agen paralel, total sekitar 47K token per rekaman, masih di bawah batas |
| Model mati | Ada daftar deprecation | Semua ID model terpusat di `models.ts` |

**Audio panjang.** 90 menit mp3 128 kbps sekitar 85 MB, gagal. Opsi: rekam lewat browser (24 kbps opus memberi sekitar 11 MB per jam), atau kompres di browser sebelum kirim, atau pecah jadi beberapa file. Untuk v1: rekam lewat browser adalah jalur utama untuk rekaman panjang, upload file dibatasi 25 MB.

## 11. Kinerja

| Tahap | Target |
|---|---|
| Audio 5 menit sampai transkrip selesai | Bawah 60 detik, sama dengan target NFR-01 di PRD |
| Transkrip ke 3 agen paralel | Bawah 25 detik |
| Render peta konsep | Bawah 1 detik |
| Swipe flashcard | 60 fps, tanpa jank |
| Jawab tutor | Bawah 3 detik |

Angka-angka ini target engineering, bukan klaim. Ukur di perangkat target dan catat hasilnya di checklist PRD bagian 11.

## 12. Deploy

Konfigurasi build:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
```

Hasil build ada di folder `out`. Tailwind CSS 4 memakai plugin PostCSS sendiri, jadi `postcss.config.mjs` isinya:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Dan di `app/globals.css` cukup `@import "tailwindcss";`. Tailwind 4 memindai file secara otomatis, tidak perlu `tailwind.config.js`.

Langkah deploy:
- Vercel, static export, branch preview per push.
- Environment variables: tidak ada yang sensitif di v1. Kalau nanti butuh key server, itu fitur baru yang menambah satu reverse proxy.
- Domain: pakai domain sendiri kalau ada, kalau tidak `*.vercel.app` cukup.
- Preview build: setiap PR dapat URL untuk diuji Hipster dan Hacker.
- Hosting lain juga bisa: folder `out` bisa langsung diunggah ke Netlify, Cloudflare Pages, atau GitHub Pages.

## 13. Batasan yang diketahui

1. User butuh akun provider dan kuota. Free tier Groq cukup untuk pemakaian per orang, bukan untuk kelas besar sekaligus.
2. Data tidak sinkron antar perangkat. Ini konsekuensi desain local-first, bukan bug.
3. Retrieval berbasis BM25, bukan vektor. Kurang akurat untuk pertanyaan yang memakai sinonim.
4. File di atas 25 MB tidak bisa dikirim tanpa kompresi client-side.
5. Kunci API terlihat di network tab. Diterima sebagai konsekuensi BYOK.
6. Rekam langsung butuh izin mikrofon dan browser yang mendukung MediaRecorder.
7. Ekspor PDF tidak ada di v1.

## 14. Ide ke depan

- [ ] Sesi flashcard dengan spaced repetition (SR-3) dan ekspor ke Anki.
- [ ] Sinkronisasi antar perangkat dengan login opsional.
- [ ] On-device inference lewat WebGPU untuk mode offline.
- [ ] Kompresi audio client-side (ffmpeg.wasm) supaya file panjang bisa diupload.
- [ ] Embedding opsional untuk provider OpenAI sebagai upgrade retrieval.