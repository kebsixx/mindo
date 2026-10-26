# Prompt Stitch & Iterasi UI

Berkas prompt untuk Google Stitch, v0, atau Claude UI Generator.

---

## 1. Prompt Utama (Generasi Awal)

Gunakan jika ingin membuat tampilan dari nol.

```text
STITCH PROMPT: MINIMALIST NEON LANDING PAGE & LOCAL-FIRST APP

Role: Senior UI/UX Web Designer & Frontend Developer.
Task: Design a clean, high-converting Minimalist Neon Landing Page & Single Page Web App for "MINDO" (An AI audio learning tool for students). 

IMPORTANT: DO NOT CREATE a complex SaaS enterprise multi-sidebar dashboard. Mindo is a LOCAL-FIRST, NO-LOGIN web application!

Visual Style:
- Clean Off-White Canvas background (#FCFCFC) with a subtle notebook graph grid (rgba(225,231,239,0.6)).
- Soft ambient neon glow gradients floating behind the dropzone (#53F16F Lime Green and #40D9FF Cyan Blue).
- Floating Pure White cards (#FFFFFF) with 28px border-radius and soft drop shadows.
- Pill-shaped buttons and inputs (border-radius: 9999px).
- Dark Charcoal primary text (#111827) and Muted Gray descriptions (#6B7280).

Layout:
1. Top Nav Bar: Logo Cyan (#40D9FF) + links ("Cara Kerja", "Privasi Local-First", "Riwayat") + BYOK status badge.
2. Hero Section: Headline ("Dari suara dosen jadi paham, sekali klik.") + Subheadline + Central Pure White Dropzone Card (Drag & Drop audio, Live Record button, API Key input, Lime CTA button).
```

---

## 2. Prompt Iterasi: State Hasil Materi (Active Workspace View)

Gunakan pada UI yang **sudah di-generate** untuk memunculkan tampilan saat audio selesai diproses.

```text
ITERATION PROMPT: MATERIAL RESULT WORKSPACE & AI TUTOR PANEL

Based on the generated design, update the main viewport to show the ACTIVE RESULT STATE after audio processing is complete:

1. Viewport Header Switcher:
   - Replace the dropzone card with a 3-segment pill container: [ Ringkasan ] [ Peta Konsep ] [ Flashcard ].
   - Active segment "Ringkasan" styled in crisp White pill with Lime Green (#53F16F) backdrop.

2. Primary Workspace Panel:
   - Display a floating Pure White container (28px radius) filled with structured markdown lecture notes:
     * Section headings with Lime bullet indicators.
     * Highlighted key terms formatted as clickable White pill tags.
     * Clean typography hierarchy with generous whitespace.

3. Integrated Right Sidebar (Tanya Mindo AI Tutor):
   - Add a docked right panel (~360px width) with Cyan (#40D9FF) accents.
   - Show AI chat message history with audio timestamp chips like [04:12] and [12:45].
   - Pinned chat input box at the bottom with a Cyan send button.

Maintain exact visual harmony, off-white background (#FCFCFC), and soft ambient neon glows!
```

---

## 3. Prompt Iterasi: State Pemrosesan (Processing Progress)

Gunakan untuk membuat tampilan saat AI sedang mentranskrip dan merangkum.

```text
ITERATION PROMPT: AUDIO PROCESSING PROGRESS STATE

Update the hero dropzone card into an ACTIVE PROCESSING STATE:

1. Card Content:
   - Display audio file metadata (e.g. "Kuliah_Anatomi_Bab3.mp3 • 18.4 MB • 45:12").
   - Show a 4-step vertical progress indicator:
     * [✓] Transkrip Audio (Selesai - Cyan checkmark)
     * [⟳] Ekstraksi Ringkasan (Sedang Memproses - Pulse animation)
     * [ ] Generasi Peta Konsep (Menunggu)
     * [ ] Pembuatan Flashcard (Menunggu)

2. Action Controls:
   - Add a subtle "Batal" (Cancel) outline pill button at the bottom.
   - Maintain the soft Lime Green (#53F16F) ambient glow behind the card.
```

---

## 4. Prompt Refinement (Polishing Checklist)

Gunakan jika UI hasil generate kurang rapi atau terlalu ramai.

```text
POLISH PROMPT: CLEANUP & SPACING ENHANCEMENT

Refine the current UI generation with these rules:
- Increase padding inside floating cards to 32px for extra breathability.
- Ensure all buttons have full pill geometry (border-radius 9999px).
- Remove any dark heavy borders (border: none or border 1px rgba(229,231,235,0.8)).
- Replace any generic icons with clean, single-line Lucide icon equivalents.
- Ensure text contrast is sharp (#111827 on white/lime).
```
