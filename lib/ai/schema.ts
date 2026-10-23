// JSON Schema zod untuk tiap agen AI
// Diverifikasi 22 Oktober 2026 - semua skema gunung strict mode
// Konversi otomatis via z.toJSONSchema() zod 4.6.7

// 1. Summarizer schema
// Output: { title: string, sections: [{ heading, points[], keyTerms[] }] }
// Aturan: additionalProperties: false, semua field wajib
// Sections: 3 sampai 12 item, Points: 2 sampai 6 per bagian, KeyTerms: max 8 item
// Prompt meminta 5 sampai 10 bagian, skema lebih longgar 3 sampai 12

// 2. Mindmapper schema
// Output: { title: string, children: [{ label, children: [{ label, children: [] }] }] }
// Aturan: 3 level eksplisit (bukan $ref rekursif)
// Level 1: max 8 cabang, Level 2: max 6 sub-cabang, Level 3: max 4 daun
// Total node maksimal 60
// content dibaca sebagai HTML → label wajib di-escape

// 3. Flashcarder schema
// Output: { cards: [{ question, answer, difficulty: "easy"|"medium"|"hard", timestampRef }] }
// Aturan: difficulty enum tiga nilai, timestampRef detik dari awal rekaman
// Jumlah kartu: 10 sampai 20 (prompt), skema batas bawah 8 (biar model sedikit kartu tetap lolos validasi)
// Client validasi timestampRef terhadap daftar segmen transkrip

// 4. Tutor schema
// Output: { found: boolean, answer: string (markdown), citations: [number] }
// Aturan: found false = rekaman tidak membahas topik, answer satu kalimat penegas
// Citations detik yang mengelilingi bukti di transkrip
// Kalau citations kosong padahal found true → UI menampilkan "tanpa sumber terverifikasi"

// 5. Transcriber normalisasi (bukan LLM schema, tapi format disimpan)
// Output segments: [{ id, start, end, text }] dari Whisper verbose_json
// Normalisasi: buang segmen kosong, gabung segmen jeda <0.5 detik, simpan apa adanya

// 6. Schema Zentral (schema.ts)
// Semua skema di-import dari sini dan dikonversi ke JSON Schema lewat z.toJSONSchema()
// Client-side divalidasi ulang zod karena strict mode tidak dijamin di semua provider
// Error handling: retry 1x dengan pesan error, lalu ganti model (120b -> 20b), lalu gagal