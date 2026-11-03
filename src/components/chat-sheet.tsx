"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

/**
 * Panel chat mobile: naik dari bawah, bisa ditarik ke atas sampai layar penuh.
 * Dua titik snap (82dvh / penuh) supaya pengguna tidak perlu menebak tinggi.
 */
export default function ChatSheet({
  open,
  onOpenChange,
  title,
  children,
}: ChatSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const [drag, setDrag] = useState(0)
  const startY = useRef<number | null>(null)
  const dragRef = useRef(0)

  const close = () => {
    setExpanded(false)
    setDrag(0)
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setExpanded(false)
      setDrag(0)
      onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Tutup Tanya Mindo"
        onClick={() => close()}
        className="absolute inset-0 cursor-default bg-foreground/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[28px] border border-border bg-card shadow-2xl",
          "transition-[height,transform] duration-200 ease-out motion-reduce:transition-none",
        )}
        style={{
          height: expanded ? "100dvh" : "82dvh",
          transform: `translateY(${Math.max(0, drag)}px)`,
        }}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center pb-1 pt-3 active:cursor-grabbing"
          onPointerDown={(e) => {
            startY.current = e.clientY
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (startY.current === null) return
            const dy = e.clientY - startY.current
            dragRef.current = dy
            setDrag(dy)
          }}
          onPointerUp={() => {
            const moved = dragRef.current
            startY.current = null
            dragRef.current = 0
            setDrag(0)
            if (moved < -60) setExpanded(true)
            else if (moved > 120) {
              if (expanded) setExpanded(false)
              else close()
            }
          }}
          onPointerCancel={() => {
            startY.current = null
            dragRef.current = 0
            setDrag(0)
          }}
        >
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Tutup"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
