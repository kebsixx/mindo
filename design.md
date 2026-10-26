# Desain UI/UX: Mindo (Minimalist Neon / Ambient Tech)

Spesifikasi antarmuka resmi Mindo. Mengusung konsep **Minimalist Neon / Ambient Tech** untuk aplikasi web *local-first* tanpa akun dan tanpa dashboard enterprise yang rumit. Fungsi utama tetap mengikuti `PRD.md`.

Terakhir diperbarui: 26 Oktober 2026.

---

## 1. Filosofi & Konsep Visual

Mindo menggunakan antarmuka halaman tunggal (*Single Page Web App*) yang lapang, elegan, dan berfokus pada alur kerja cepat: **Upload/Rekam Audio → Olah AI → Pelajari Hasil**.

* **Atmosfer**: Clean Ambient Tech. Latar off-white lembut dengan pendaran gradien neon radial yang halus di balik elemen hero utama.
* **Geometri**: Sudut kartu sangat bulat (*radius 28px*) dengan tombol dan kontrol berbentuk *pill* penuh (*border-radius 9999px*).
* **Grid Paper**: Latar belakang memiliki pola grid buku catatan tipis transparan (`rgba(225, 231, 239, 0.6)`).
* **Simplisitas Local-First**: Tanpa login, tanpa sidebar folder kompleks, tanpa hirarki berbelit.

---

## 2. Palet Warna & Token Visual

| Token Name | Hex Code / Value | Penggunaan Visual |
|---|---|---|
| **Canvas Off-White** | `#FCFCFC` | Latar belakang kanvas utama |
| **Surface Pure White** | `#FFFFFF` | Latar kartu melayang (*dropzone card*, modal, panel) |
| **Neon Lime Green** | `#53F16F` | Aksen utama, tombol CTA upload, segmen tab aktif |
| **Neon Cyan Blue** | `#40D9FF` | Logo MINDO, aksen glow, tombol AI Tutor |
| **Deep Charcoal** | `#111827` | Teks judul utama & ikon utama |
| **Muted Gray** | `#6B7280` | Teks deskripsi sekunder & metadata |
| **Subtle Grid Line** | `rgba(225, 231, 239, 0.6)` | Pola garis grid buku catatan di latar belakang |
| **Radius Kartu** | `28px` | Kartu melayang & container kerja |
| **Radius Kontrol** | `9999px` (Pill) | Tombol CTA, tab switcher, input field |

---

## 3. Struktur & Arsitektur Layout (Single Page Web App)

### A. Minimalist Top Navbar
* **Kiri**: Logo Gelombang Mindo + Logotype "MINDO" warna Neon Cyan (`#40D9FF`).
* **Tengah**: Navigasi ringkas (`Cara Kerja` \| `Privasi Local-First` \| `Riwayat`).
* **Kanan**: Badge status "BYOK (API Key)" + Indikator hijau "Penyimpanan Lokal Aktif".

### B. Hero Section & Central Interactive Dropzone
* **Headline Utama**: Teks judul besar bergaya *Minimalist Clean* ("*Dari suara dosen jadi paham, sekali klik.*").
* **Sub-headline**: Penjelasan singkat Mindo sebagai asisten belajar AI local-first (100% aman di perangkat, tanpa akun).
* **Central Interactive Dropzone Card**:
  * Kartu melayang putih bersih (*Pure White Card*, radius `28px`) di tengah layar dengan pendaran *ambient neon glow* (`#53F16F` & `#40D9FF`) di belakangnya.
  * **Area Drag & Drop**: Dukungan file audio/video (`.mp3`, `.m4a`, `.wav` maks 25 MB).
  * **Tombol Rekam Langsung**: Tombol pill berikon mikrofon untuk rekam audio kuliah secara *live*.
  * **Field API Key Quick Setup**: Input pill simpel untuk menempelkan Groq / OpenAI API Key dengan indikator status siap pakai.
  * **Tombol Utama CTA**: Tombol pill besar Neon Lime (`#53F16F`) *"Mulai Proses Rekaman"*.

### C. Material Result Workspace (Tampil Setelah Audio Diproses)
* **3-Segment Tab Switcher Bar**: Kapsul pill di bagian atas (`Ringkasan` \| `Peta Konsep` \| `Flashcard`).
* **Workspace Panel**: Area menampilkan hasil olahan AI dalam satu container melayang yang lapang (`#FFFFFF`).
* **Tanya Mindo AI Tutor**:
  * Desktop: Panel samping kanan terintegrasi (~360px).
  * Mobile: Floating Action Button (FAB) bulat Cyan (`#40D9FF`) kanan bawah yang membuka modal chat drawer.

---

## 4. Aturan Aksesibilitas & UI/UX

1. **Target Sentuh**: Minimal `44px x 44px` untuk semua elemen interaktif.
2. **Kontras Teks**: Minimal tingkat AA (WCAG 2.1). Teks di atas warna Lime/Cyan menggunakan warna Deep Charcoal (`#111827`).
3. **Fokus Keyboard**: Ring fokus terpotret jelas untuk navigasi tanpa tetikus.
4. **State Wajib**: Selalu sediakan state Kosong (*Empty*), Memuat (*Loading skeleton*), dan Gagal (*Error with retry*).
5. **Responsif**: Tidak ada scroll horizontal di viewport seluler (360px ke atas).

---

## 5. Yang Dilarang (Anti-Patterns)

* **TIDAK BRUTALIST**: Dilarang menggunakan border hitam tebal 3px atau bayangan brutalisme kaku.
* **TIDAK DASHBOARD SAAS KOMPLEKS**: Dilarang membuat multi-sidebar folder, user profile avatar, atau menu enterprise yang membingungkan.
* **TIDAK EMOJI ABU-ABU**: Dilarang menggunakan emoji dekoratif acak di headline.
* **TIDAK TEKS GRADIENT BERLEBIHAN**: Gunakan warna solid jernih untuk legibilitas maksimal.
