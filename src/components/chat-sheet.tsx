"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

/**
 * Panel chat mobile: slide up dari bawah, bisa ditarik ke atas sampai layar
 * penuh. Dua titik snap (82dvh / penuh). Seluruh badan panel bisa ditarik
 * (kecuali target interaktif dan area yang sedang tergulir: scroll
 * diberi ruang supaya guliran tetap berjalan).
 *
 * Masuk/tutup: panel meluncur dari bawah (di-slide keluar saat tutup),
 * durasi 300 ms.
 */
export default function ChatSheet({
  open,
  onOpenChange,
  title,
  children,
}: ChatSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const [drag, setDrag] = useState(() => (open ? window.innerHeight : 0))
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  const startY = useRef<number | null>(null)
  const dragRef = useRef(0)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<number | null>(null)

  // Buka dari bawah: sebelum paint panel off-screen, lalu rAF ke drag 0
  // (slide up 300 ms melalui className transition).
  if (open !== prevOpen) {
    setPrevOpen(open)
    setDrag(open ? window.innerHeight : 0)
  }

  const close = useCallback(() => {
    if (leaving) return
    setDragging(false)
    setExpanded(false)
    setLeaving(true)
    setDrag(window.innerHeight)
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setLeaving(false)
      onOpenChange(false)
    }, 300)
  }, [leaving, onOpenChange])

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => setDrag(0))
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
  }, [])

  const isScrolledArea = (el: EventTarget | null): boolean => {
    let node = el instanceof HTMLElement ? el : null
    while (node && sheetRef.current && node !== sheetRef.current) {
      if (node.scrollTop > 0) return true
      node = node.parentElement
    }
    return false
  }

  const isInteractive = (el: EventTarget | null): boolean =>
    el instanceof HTMLElement &&
    !!el.closest("button, a, input, textarea, select, [data-no-drag]")

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, close])

  if (!open && !leaving) return null

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", leaving && "pointer-events-none")}>
      <button
        type="button"
        aria-label="Tutup Tanya Mindo"
        onClick={() => close()}
        className="absolute inset-0 cursor-default bg-foreground/40"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 touch-action-none flex flex-col overflow-hidden rounded-t-[28px] border border-border bg-card shadow-2xl",
          "transition-[height,transform] duration-300 ease-out motion-reduce:transition-none",
        )}
        style={{
          height: expanded ? "100dvh" : "82dvh",
          transform: `translateY(${Math.max(0, drag)}px)`,
          transition: dragging ? "none" : undefined,
        }}
        onPointerDown={(e) => {
          if (leaving || dragging) return
          if (isInteractive(e.target) || isScrolledArea(e.target)) return
          startY.current = e.clientY
          dragRef.current = 0
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (startY.current === null) return
          const dy = e.clientY - startY.current
          dragRef.current = Math.max(0, dy)
          setDrag(dragRef.current)
        }}
        onPointerUp={() => {
          const moved = dragRef.current
          startY.current = null
          dragRef.current = 0
          setDragging(false)
          setDrag(0)
          if (moved > 120) {
            if (expanded) setExpanded(false)
            else close()
          } else if (moved < -60) {
            setExpanded(true)
          }
        }}
        onPointerCancel={() => {
          startY.current = null
          dragRef.current = 0
          setDragging(false)
          setDrag(0)
        }}
      >
        <div className="flex shrink-0 cursor-grab touch-action-none flex-col items-center pb-1 pt-3 active:cursor-grabbing">
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
