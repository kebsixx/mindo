export interface ShareTemplateOptions {
  title: string
  headings?: string[]
  points?: string[]
  tone?: "casual" | "formal"
}

export function buildFallbackShareMessage(options: ShareTemplateOptions): string {
  const { title, headings = [], points = [], tone = "casual" } = options

  const safeTitle = title.trim() || "Catatan Kuliah"
  const items = points.length > 0 ? points : headings

  const topItems = items.slice(0, 3).map((item) => `- ${item.trim()}`).filter(Boolean)

  if (tone === "formal") {
    let msg = `Yth. Rekan-rekan,\n\nBerikut ringkasan materi "${safeTitle}":\n`
    if (topItems.length > 0) {
      msg += `\nPoin pembahasan:\n${topItems.join("\n")}\n`
    }
    msg += `\nDetail lengkap serta peta konsep terlampir. Semoga bermanfaat.`
    return msg
  }

  let msg = `Halo teman-teman, ini ringkasan catatan "${safeTitle}":\n`
  if (topItems.length > 0) {
    msg += `\nPoin pentingnya:\n${topItems.join("\n")}\n`
  }
  msg += `\nCatatan lengkap dan peta konsep ada di lampiran ya!`
  return msg
}

export function sanitizeShareText(text: string, maxLength: number = 2000): string {
  let clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  // Hindari em dash per aturan
  clean = clean.replace(/—/g, "-").replace(/–/g, "-")
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength - 3) + "..."
  }
  return clean
}

export function buildWhatsAppShareUrl(text: string): string {
  const sanitized = sanitizeShareText(text)
  return `https://wa.me/?text=${encodeURIComponent(sanitized)}`
}
