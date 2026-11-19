import type { Summary, TranscriptSegment, Flashcard } from "@/lib/db"
import { formatClock, sourceLabel } from "@/lib/timeline"

export function formatTimestamp(seconds: number): string {
  return formatClock(seconds)
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

/**
 * Transkrip ekspor memakai waktu absolut. Saat materi punya lebih dari satu
 * rekaman, awal tiap bagian ditandai supaya pembaca tahu batasnya.
 */
export function transcriptToText(
  segments: TranscriptSegment[],
  sources: { id?: number; order: number }[] = [],
): string {
  const labels = new Map<number, string>()
  for (const source of sources) {
    if (source.id !== undefined) labels.set(source.id, sourceLabel(source.order))
  }
  const multiple = sources.length > 1

  const lines: string[] = []
  let current: number | undefined
  let started = false

  for (const segment of segments) {
    if (multiple && (!started || segment.sourceId !== current)) {
      current = segment.sourceId
      started = true
      const label =
        segment.sourceId === undefined ? undefined : labels.get(segment.sourceId)
      if (lines.length > 0) lines.push("")
      lines.push(
        `## ${label ?? "Bagian"} (mulai ${formatClock(segment.start)})`,
        "",
      )
    }
    lines.push(`[${formatClock(segment.start)}] ${segment.text}`)
  }
  return lines.join("\n")
}

function csvField(value: string | number): string {
  const text = String(value).replace(/\r?\n/g, " ")
  return `"${text.replace(/"/g, '""')}"`
}

export function flashcardsToCsv(cards: Flashcard[]): string {
  const rows = [
    ["pertanyaan", "jawaban", "kesulitan", "waktu", "status"].join(","),
    ...cards.map((card) =>
      [
        csvField(card.question),
        csvField(card.answer),
        csvField(card.difficulty),
        csvField(formatTimestamp(card.timestampRef)),
        csvField(card.grade),
      ].join(","),
    ),
  ]
  return rows.join("\r\n")
}
