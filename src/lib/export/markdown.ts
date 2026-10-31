import type { Summary, TranscriptSegment, Flashcard } from "@/lib/db"

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function summaryToMarkdown(summary: Summary): string {
  let md = `# ${summary.title}\n\n`
  for (const section of summary.sections) {
    md += `## ${section.heading}\n\n`
    for (const point of section.points) {
      md += `- ${point}\n`
    }
    if (section.keyTerms && section.keyTerms.length > 0) {
      md += `\n**Istilah kunci:** ${section.keyTerms.join(", ")}\n`
    }
    md += "\n"
  }
  return md
}

export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
    .join("\n")
}

function csvField(value: string | number): string {
  const text = String(value).replace(/\r?\n/g, " ")
  return `"${text.replace(/"/g, '""')}"`
}

// Kolom Pertanyaan/Jawaban dikenali Anki dan Quizlet saat impor CSV.
export function flashcardsToCsv(cards: Flashcard[]): string {
  const rows = cards.map((card) =>
    [
      csvField(card.question),
      csvField(card.answer),
      csvField(card.difficulty),
      csvField(formatTimestamp(card.timestampRef)),
    ].join(","),
  )
  return ["Pertanyaan,Jawaban,Kesulitan,Waktu", ...rows].join("\r\n")
}
