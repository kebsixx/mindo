import type { MindmapNode } from "./db"

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

export interface MindmapTree {
  title: string
  children: MindmapNode[]
}

const MAX_LEVELS = 3
const MAX_BRANCHES = 8
const MAX_CHILDREN = 6

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function pickLabel(node: Record<string, unknown>): string {
  for (const key of ["label", "name", "content", "title", "text"]) {
    const text = asText(node[key])
    if (text) return text
  }
  return ""
}

function toNodes(raw: unknown, level: number, cap: number): MindmapNode[] {
  if (!Array.isArray(raw)) return []
  const nodes: MindmapNode[] = []
  for (const item of raw) {
    if (nodes.length >= cap) break
    if (typeof item === "string") {
      const label = item.trim()
      if (label) nodes.push({ label, children: [] })
      continue
    }
    if (!item || typeof item !== "object") continue
    const obj = item as Record<string, unknown>
    const label = pickLabel(obj)
    if (!label) continue
    const children =
      level < MAX_LEVELS
        ? toNodes(
            obj.children ?? obj.nodes ?? obj.items ?? obj.branches,
            level + 1,
            MAX_CHILDREN
          )
        : []
    nodes.push({ label, children })
  }
  return nodes
}

/**
 * Model jarang mengikuti tiga level persis: ada yang berhenti di dua, mengirim
 * leaf sebagai string, atau memakai `name`/`content`. Renderer sudah rekursif,
 * jadi yang ketat cukup skemanya, bukan hasilnya. Fungsi ini menyelamatkan peta
 * yang isinya benar tapi bentuknya meleset.
 */
export function normalizeMindmap(raw: unknown): MindmapTree {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Provider mengembalikan jawaban yang tidak bisa dibaca. Coba lagi.")
  }
  const obj = raw as Record<string, unknown>
  const title = pickLabel(obj) || "Peta Konsep"
  const children = toNodes(
    obj.children ?? obj.nodes ?? obj.branches ?? obj.map,
    1,
    MAX_BRANCHES
  )
  if (children.length < 2) {
    throw new Error("Provider mengembalikan jawaban yang tidak bisa dibaca. Coba lagi.")
  }
  return { title, children }
}
