import Dexie, { type Table } from "dexie"

export interface Material {
  id?: number
  title: string
  createdAt: string
  duration: number
  status: string
  fileName: string
  fileSize: number
  audio?: Blob
  /** Pesan siap-tampil per tahap yang gagal. Kunci: transcribe, summarize, mindmap, flashcard. */
  stageErrors?: Record<string, string>
  /** Jumlah sumber saat ringkasan, mindmap, dan flashcard terakhir dibuat. */
  derivedSourceCount?: number
}

export type SourceStatus = "pending" | "transcribing" | "done" | "failed"

/**
 * Satu rekaman di dalam materi. Materi hasil gabungan punya beberapa sumber
 * dengan `offset` sebagai titik mulai di timeline gabungan.
 *
 * `audio` menyimpan blob aslinya. Materi lama belum punya baris sumber; baris
 * itu dibuat saat pertama kali dibutuhkan, tanpa memindahkan blob lama.
 */
export interface AudioSource {
  id?: number
  materialId: number
  order: number
  fileName: string
  fileSize: number
  duration: number
  offset: number
  status: SourceStatus
  audio?: Blob
  createdAt: string
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  sourceId?: number
}

export interface Transcript {
  materialId: number
  segments: TranscriptSegment[]
}

export interface Summary {
  materialId: number
  title: string
  sections: { heading: string; points: string[]; keyTerms?: string[] }[]
}

export interface MindmapNode {
  label: string
  children: MindmapNode[]
}

export interface Mindmap {
  materialId: number
  title: string
  children: MindmapNode[]
}

export interface Flashcard {
  id?: number
  materialId: number
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  timestampRef: number
  grade: "unknown" | "repeat" | "known"
}

export interface Chunk {
  materialId: number
  start: number
  end: number
  text: string
  sourceId?: number
}

class MindoDB extends Dexie {
  materials!: Table<Material, number>
  sources!: Table<AudioSource, number>
  transcripts!: Table<Transcript, number>
  summaries!: Table<Summary, number>
  mindmaps!: Table<Mindmap, number>
  flashcards!: Table<Flashcard, number>
  chunks!: Table<Chunk, [number, number]>

  constructor() {
    super("mindo")
    this.version(1).stores({
      materials: "++id, title, createdAt, status",
      transcripts: "materialId",
      summaries: "materialId",
      mindmaps: "materialId",
      flashcards: "++id, materialId",
      chunks: "[materialId+start], materialId, start",
    })
    // Sumber rekaman ditambahkan tanpa memindahkan audio materi lama. Baris
    // sumber untuk materi lama dibuat saat pertama kali dibaca.
    this.version(2).stores({
      sources: "++id, materialId, [materialId+order]",
    })
  }
}

let db: MindoDB | null = null

export function openDB(): MindoDB {
  if (!db) {
    db = new MindoDB()
  }
  return db
}