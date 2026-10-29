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
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
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
}

class MindoDB extends Dexie {
  materials!: Table<Material, number>
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
  }
}

let db: MindoDB | null = null

export function openDB(): MindoDB {
  if (!db) {
    db = new MindoDB()
  }
  return db
}