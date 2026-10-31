export interface MarkmapNode {
  content: string
  children: MarkmapNode[]
}

interface RawNode {
  label?: string
  children?: RawNode[]
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function toNode(node: RawNode): MarkmapNode {
  return {
    content: escapeHtml(node.label ?? ""),
    children: (node.children ?? []).map(toNode),
  }
}

// Format tersimpan di IndexedDB (title/label) bukan format markmap
// (content/children), dan Transformer hanya memproses markdown,
// jadi pohonnya dibangun langsung di sini.
export function markmapRoot(content: string): MarkmapNode {
  const parsed = JSON.parse(content) as { title?: string; children?: RawNode[] }
  return {
    content: escapeHtml(parsed.title ?? ""),
    children: (parsed.children ?? []).map(toNode),
  }
}
