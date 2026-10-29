"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { Markmap as MarkmapInstance } from "markmap-view"

interface MarkmapViewProps {
  content: string
  className?: string
}

interface RawMindmapNode {
  label?: string
  children?: RawMindmapNode[]
}

interface RawMindmap {
  title?: string
  children?: RawMindmapNode[]
}

// Bentuk minimum yang diterima Markmap.create (IPureNode): konten HTML + anak.
interface MapNode {
  content: string
  children: MapNode[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function toMapNode(node: RawMindmapNode): MapNode {
  return {
    content: escapeHtml(node.label ?? ""),
    children: (node.children ?? []).map(toMapNode),
  }
}

export default function MarkmapView({ content, className }: MarkmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setError(null)

    let observer: ResizeObserver | null = null
    let mm: MarkmapInstance | null = null
    // Import dan setData asinkron; kalau komponen sudah unmount (pindah tab,
    // StrictMode, content berubah) instance yang lahir belakangan tidak boleh
    // menyentuh DOM lagi.
    let cancelled = false

    const initMarkmap = async () => {
      try {
        const { Markmap } = await import("markmap-view")
        if (cancelled) return

        // Format tersimpan di IndexedDB (title/label) bukan format markmap
        // (content/children), dan Transformer hanya memproses markdown,
        // jadi pohonnya dibangun langsung di sini.
        const parsed = JSON.parse(content) as RawMindmap
        const root: MapNode = {
          content: escapeHtml(parsed.title ?? ""),
          children: (parsed.children ?? []).map(toMapNode),
        }

        if (!containerRef.current) return
        container.innerHTML = ""
        const rect = container.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width))
        const height = Math.max(1, Math.round(rect.height))

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        // d3-zoom membaca atribut width/height sebagai SVGLength; "100%" adalah
        // relative length yang gagal dibaca Chromium, jadi pakai piksel nyata.
        svg.setAttribute("width", String(width))
        svg.setAttribute("height", String(height))
        container.appendChild(svg)

        // fit() dihitung dari getBoundingClientRect(): kalau container masih
        // display:none (0x0), n/d = 0/0 = NaN dan d3 menembakkan
        // translate(NaN) ke ratusan callback zoom. Jadi autoFit dimatikan dan
        // fit dipanggil manual hanya saat ukurannya benar-benar ada.
        const instance = Markmap.create(svg, { autoFit: false })
        mm = instance
        await instance.setData(root)
        if (cancelled) return

        const fitIfVisible = () => {
          if (cancelled) return
          const box = svg.getBoundingClientRect()
          if (box.width > 0 && box.height > 0) void instance.fit()
        }
        fitIfVisible()

        let lastW = width
        let lastH = height
        observer = new ResizeObserver((entries) => {
          const box = entries[0]?.contentRect
          if (!box) return
          const w = Math.round(box.width)
          const h = Math.round(box.height)
          svg.setAttribute("width", String(Math.max(1, w)))
          svg.setAttribute("height", String(Math.max(1, h)))
          // Refit hanya saat ukuran benar-benar berubah dan layar terlihat;
          // fit pada container tersembunyi (0x0) merusak transform.
          if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
            lastW = w
            lastH = h
            void instance.fit()
          }
        })
        observer.observe(container)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Peta konsep gagal dimuat. Muat ulang halaman.")
        }
      }
    }

    void initMarkmap()

    return () => {
      cancelled = true
      observer?.disconnect()
      mm?.destroy()
      mm = null
    }
  }, [content])

  if (error) {
    return <div className="p-4 text-destructive">{error}</div>
  }

  return (
    <div ref={containerRef} className={cn("w-full h-full", className)} />
  )
}
