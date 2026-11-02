# Flowchart: Mindo

Diagram alur aplikasi, disusun dari kode di `src/app/*` dan `src/lib/*`. Versi teks biasa ada di `flowchart-teks.md`.

## 1. Alur pengguna (antar halaman)

```mermaid
flowchart TD
    A([Beranda /]) --> B{Sudah ada API key?}
    B -- Belum --> C[Tempel API key Groq/OpenAI<br/>disimpan di localStorage]
    B -- Sudah --> D
    C --> D{Sumber audio}

    D -- Upload file --> E[Pilih file atau drag-drop<br/>atau muat rekaman contoh]
    D -- Rekam langsung --> R[/recording/]

    E --> F{Ukuran lebih dari 25 MB?}
    F -- Ya --> G[Toast: File terlalu besar] --> D
    F -- Tidak --> H[Klik Mulai]

    R --> R1{Izin mikrofon?}
    R1 -- Ditolak --> R2[Toast: izinkan mikrofon] --> R
    R1 -- Diizinkan --> R3[Rekam + meter volume + timer]
    R3 --> R4[Stop, putar ulang atau buang]
    R4 --> R5[Simpan rekaman]

    H --> S[(IndexedDB<br/>materials.add, status pending)]
    R5 --> S
    S --> P[/processing?id=.../]

    P --> Q[Pipeline AI<br/>lihat diagram 2]
    Q --> T{Transkrip berhasil?}
    T -- Gagal --> T1[Tampil error + tombol Coba Lagi]
    T1 --> Q
    T -- Berhasil --> U[Tombol Lihat Hasil]
    P -. Batal .-> A

    U --> M[/material?id=.../]
    A -. Klik riwayat .-> M
    A -. Hapus materi .-> A

    M --> M1[Tab Ringkasan]
    M --> M2[Tab Peta Konsep]
    M --> M3[Tab Flashcard]
    M --> M4[Tanya Mindo]
    M --> M5[Transkrip + putar audio per timestamp]
    M --> M6[Ekspor]

    A -. Lihat contoh .-> DM[/demo/]
    A -. Menu .-> ST[/settings/<br/>provider, API key, uji koneksi, hapus data/]
```

## 2. Alur pemrosesan (`/processing`)

```mermaid
flowchart TD
    A([runPipeline]) --> B{API key ada?}
    B -- Tidak --> X1[Transkrip gagal:<br/>API key belum diisi]
    B -- Ya --> C{Audio ada di IndexedDB?}
    C -- Tidak --> X2[Transkrip gagal:<br/>rekaman tidak ditemukan]
    C -- Ya --> D[Tahap 1: Transkrip<br/>Whisper, language=id]
    D --> E{Berhasil?}
    E -- Error --> X3[humanError:<br/>401, 413, 429, jaringan, dll]
    E -- Ya --> F[Simpan transcripts + chunks<br/>chunking 60 detik]
    F --> G{Teks kosong?}
    G -- Ya --> X4[Transkrip gagal:<br/>audio kurang jelas]
    G -- Tidak --> H[Promise.all, tiga agen paralel]

    H --> I[Ringkasan]
    H --> J[Mindmap]
    H --> K[Flashcard]

    I --> I1[(summaries)]
    J --> J1[(mindmaps)]
    K --> K1[(flashcards, grade = unknown)]

    I1 --> L{Semua sukses?}
    J1 --> L
    K1 --> L
    L -- Ya --> M[(materials.status = done)]
    L -- Ada yang gagal --> N[(materials.status = partial)]

    X1 --> R[Tombol Coba Lagi]
    X2 --> R
    X3 --> R
    X4 --> R
    R -- Tahap Transkrip --> A
    R -. Tahap lain, hanya agen itu .-> H
    M --> Z([Lihat Hasil])
    N --> Z
```

## 3. Alur Tanya Mindo (tutor AI di `/material`)

```mermaid
flowchart TD
    A([User kirim pertanyaan]) --> B{API key ada?}
    B -- Tidak --> B1[Pesan: API key belum diisi]
    B -- Ya --> C[Ambil chunks dari IndexedDB]
    C --> D{Chunks kosong?}
    D -- Ya --> D1[Pesan: transkrip belum tersedia]
    D -- Tidak --> E[Retrieval BM25 di browser]
    E --> F[LLM menjawab dari potongan terpilih]
    F --> G{found?}
    G -- Tidak --> G1[Tidak dibahas dalam rekaman ini]
    G -- Ya --> H[Jawaban + timestamp sitasi]
    H --> I[Klik timestamp: audio lompat ke detik itu]
```

## Catatan

- Tidak ada backend. Browser memanggil provider (Groq/OpenAI) langsung, data tinggal di IndexedDB dan localStorage.
- Kegagalan per tahap terisolasi. Satu agen gagal, hasil agen lain tetap tersimpan (status `partial`). Retry agen hanya mengulang agen itu. Hanya retry transkrip yang mengulang seluruh pipeline.
- PRD menyebut "Dashboard" terpisah. Di kode, `/` sekaligus jadi landing, input upload, dan riwayat.
