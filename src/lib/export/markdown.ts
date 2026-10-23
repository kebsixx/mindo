import type { Summary, TranscriptSegment, Mindmap, Flashcard } from "@/lib/db"

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

export function flashcardsToMarkdown(cards: Flashcard[]): string {
  let md = "# Flashcard\n\n"
  for (const card of cards) {
    md += `## ${card.question}\n\n`
    md += `${card.answer}\n\n`
    md += `> Tingkat: ${card.difficulty} | Ref: ${Math.floor(card.timestampRef / 60)}:${String(Math.floor(card.timestampRef % 60)).padStart(2, "0")}\n\n`
    md += "---\n\n"
  }
  return md
}

export function transcriptToMarkdown(segments: TranscriptSegment[]): string {
  let md = "# Transkrip\n\n"
  for (const seg of segments) {
    const m = Math.floor(seg.start / 60)
    const s = Math.floor(seg.start % 60)
    md += `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}] ${seg.text}\n`
  }
  return md
}

export function mindmapToMarkdown(mindmap: Mindmap): string {
  let md = `# ${mindmap.title}\n\n`
  function walk(node: { label: string; children: { label: string; children: unknown[] }[] }, depth: number) {
    const indent = "  ".repeat(depth)
    md += `${indent}- ${node.label}\n`
    for (const child of node.children) {
      walk(child as { label: string; children: { label: string; children: unknown[] }[] }, depth + 1)
    }
  }
  for (const child of mindmap.children) {
    walk(child, 0)
  }
  return md
}