"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MarkmapViewProps {
  content: string
  className?: string
}

export default function MarkmapView({ content, className }: MarkmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initMarkmap = async () => {
      try {
        const { Markmap } = await import("markmap-view")
        const { Transformer } = await import("markmap-lib")

        const transformer = new Transformer()
        const { root, features } = transformer.transform(content)

        containerRef.current!.innerHTML = ""

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute("width", "100%")
        svg.setAttribute("height", "100%")
        containerRef.current!.appendChild(svg)

        const mm = Markmap.create(svg, { autoFit: true }, root)
        await mm.fit()

        setLoaded(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load markmap")
      }
    }

    initMarkmap()
  }, [content])

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <div ref={containerRef} className={cn("w-full h-full", className)} />
  )
}