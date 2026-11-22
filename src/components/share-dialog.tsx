"use client"

import { useCallback, useRef, useState } from "react"
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  RotateCw,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { Flashcard, Mindmap, Summary } from "@/lib/db"
import {
  buildFallbackShareMessage,
  buildWhatsAppShareUrl,
  sanitizeShareText,
} from "@/lib/share/links"
import { composeShareMessage } from "@/lib/ai/agents/share"
import { getApiKey, getProvider } from "@/lib/storage/settings"
import { downloadBlob, slugify } from "@/lib/export/bundle"
import { flashcardsToCsv, summaryToMarkdown } from "@/lib/export/markdown"
import { mindmapToPng } from "@/lib/export/mindmap"

interface ShareDialogProps {
  title: string
  summary: Summary | null
  mindmap: Mindmap | null
  flashcards: Flashcard[]
  transcriptExcerpt?: string
  disabled?: boolean
}

export default function ShareDialog({
  title,
  summary,
  mindmap,
  flashcards,
  transcriptExcerpt,
  disabled = false,
}: ShareDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<"casual" | "formal">("casual")
  // Simpan cache hasil pesan per tone agar tidak memanggil AI berulang kali
  const [cachedDrafts, setCachedDrafts] = useState<Record<"casual" | "formal", string>>({
    casual: "",
    formal: "",
  })

  const [message, setMessage] = useState("")
  const [customized, setCustomized] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pngBusy, setPngBusy] = useState(false)

  // Bottom sheet mobile: geser dari bawah, tarik ke bawah untuk menutup.
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ y: number; t: number } | null>(null)
  const closeTimer = useRef<number | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  const isMobileSheet = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches

  const requestClose = () => {
    if (!isMobileSheet()) {
      setOpen(false)
      return
    }
    // Turunkan panel dulu, baru unmount, supaya tidak hilang mendadak.
    setDragY(window.innerHeight)
    closeTimer.current = window.setTimeout(() => {
      setOpen(false)
      setDragY(0)
    }, 240)
  }

  // Tarik dari mana saja, kecuali kontrol interaktif dan isi yang sedang
  // tergulir. Kalau sheet sudah di posisi atas, tarikan ke bawah menutup panel.
  const onSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileSheet() || dragging || dragY !== 0) return
    const target = e.target as HTMLElement
    if (target.closest("button, a, input, textarea, select, [data-no-drag]")) return
    const scroller = sheetRef.current
    if (scroller && scroller.scrollTop > 0) return

    dragStart.current = { y: e.clientY, t: Date.now() }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    const dy = e.clientY - dragStart.current.y
    if (dy <= 0) {
      // Tarikan ke atas biarkan konten menggulir seperti biasa.
      if (dragY !== 0) setDragY(0)
      return
    }
    setDragY(dy)
  }

  const onSheetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    const dy = Math.max(0, e.clientY - dragStart.current.y)
    const elapsed = Date.now() - dragStart.current.t
    dragStart.current = null
    setDragging(false)

    const flicked = elapsed > 0 && dy / elapsed > 0.5
    if (dy > 110 || (flicked && dy > 40)) {
      requestClose()
    } else {
      setDragY(0)
    }
  }

  // Cek kapabilitas Web Share API tanpa synchronous setState in effect
  const [supportsShareFiles] = useState(() => {
    if (
      typeof navigator !== "undefined" &&
      !!navigator.share &&
      !!navigator.canShare
    ) {
      try {
        const dummy = new File(["test"], "test.txt", { type: "text/plain" })
        return navigator.canShare({ files: [dummy] })
      } catch {
        return false
      }
    }
    return false
  })

  // Refine draf lewat AI dengan sistem caching per tone
  const triggerAiRefinement = useCallback(
    (currentTone: "casual" | "formal", force = false) => {
      // Jika sudah ada di cache, langsung gunakan tanpa panggil AI
      if (!force && cachedDrafts[currentTone]) {
        setMessage(cachedDrafts[currentTone])
        return
      }

      const provider = getProvider("llm")
      const apiKey = getApiKey(provider)

      const summaryText = summary
        ? summary.sections
            .map((s) => `${s.heading}:\n${s.points.join("\n")}`)
            .join("\n\n")
        : transcriptExcerpt || ""

      const headings = summary?.sections.map((s) => s.heading) || []
      const points = summary?.sections.flatMap((s) => s.points) || []

      const fallback = buildFallbackShareMessage({
        title,
        headings,
        points,
        tone: currentTone,
      })

      if (!apiKey || summaryText.trim().length === 0) {
        setCachedDrafts((prev) => ({ ...prev, [currentTone]: fallback }))
        setMessage(fallback)
        return
      }

      setIsAiLoading(true)
      composeShareMessage(provider, apiKey, {
        title,
        summaryText,
        tone: currentTone,
        variation: force,
      })
        .then((aiMsg) => {
          const finalMsg = aiMsg.trim() || fallback
          setCachedDrafts((prev) => ({ ...prev, [currentTone]: finalMsg }))
          setMessage(finalMsg)
        })
        .catch(() => {
          setCachedDrafts((prev) => ({ ...prev, [currentTone]: fallback }))
          setMessage(fallback)
        })
        .finally(() => {
          setIsAiLoading(false)
        })
    },
    [cachedDrafts, summary, transcriptExcerpt, title]
  )

  const handleOpenDialog = () => {
    setTone("casual")
    setCustomized(false)
    if (cachedDrafts.casual) {
      setMessage(cachedDrafts.casual)
    } else {
      setMessage("")
    }

    if (isMobileSheet()) {
      // Mulai dari bawah layar, lalu meluncur naik setelah panel terpasang.
      setDragY(window.innerHeight)
      setOpen(true)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setDragY(0))
      )
    } else {
      setOpen(true)
    }

    if (!cachedDrafts.casual) triggerAiRefinement("casual")
  }

  const handleToneChange = (newTone: "casual" | "formal") => {
    if (newTone === tone) return
    setTone(newTone)
    if (!customized) {
      if (cachedDrafts[newTone]) {
        setMessage(cachedDrafts[newTone])
      } else {
        setMessage("")
        triggerAiRefinement(newTone)
      }
    }
  }

  const handleRegenerate = () => {
    if (isAiLoading) return
    // Draf yang sudah disunting akan hilang, jadi minta konfirmasi dulu.
    if (
      customized &&
      message.trim() &&
      !window.confirm(
        "Pesan yang Anda sunting akan diganti dengan draf baru. Lanjutkan?"
      )
    ) {
      return
    }
    setCustomized(false)
    triggerAiRefinement(tone, true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast({
        title: "Teks disalin",
        description: "Pesan siap ditempelkan di chat WhatsApp.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Gagal menyalin",
        description: "Salin teks langsung dari kotak pesan.",
      })
    }
  }

  const handleDownloadPng = async () => {
    if (!mindmap) return
    setPngBusy(true)
    try {
      const blob = await mindmapToPng(JSON.stringify(mindmap))
      downloadBlob(blob, `${slugify(title)}-peta-konsep.png`)
      toast({
        title: "Peta konsep diunduh",
        description: "File PNG siap dilampirkan ke pesan.",
      })
    } catch {
      toast({
        title: "Gagal mengunduh peta konsep",
        description: "Coba unduh lewat menu Ekspor.",
      })
    } finally {
      setPngBusy(false)
    }
  }

  const handleDownloadSummaryMd = () => {
    if (!summary) return
    const mdText = summaryToMarkdown(summary)
    const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8" })
    downloadBlob(blob, `${slugify(title)}-ringkasan.md`)
    toast({
      title: "Ringkasan diunduh",
      description: "File Markdown berhasil diunduh.",
    })
  }

  const handleDownloadFlashcardsCsv = () => {
    if (flashcards.length === 0) return
    const csvText = flashcardsToCsv(flashcards)
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, `${slugify(title)}-flashcard.csv`)
    toast({
      title: "Flashcard diunduh",
      description: "File CSV berhasil diunduh.",
    })
  }

  const openWhatsappUrl = () => {
    const url = buildWhatsAppShareUrl(message)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Kirim lewat Web Share (teks + lampiran bersama). true = sesuai terkirim.
  const sendViaWebShare = async (): Promise<boolean> => {
    if (!navigator.share) return false
    try {
      const shareData: ShareData = {
        title: `Catatan: ${title}`,
        text: message,
      }

      // Bila Web Share dengan file didukung, sertakan lampiran
      // (Peta Konsep, Ringkasan, Flashcard) sehingga bisa dikirim bersama
      if (supportsShareFiles) {
        const files: File[] = []
        if (mindmap) {
          try {
            const blob = await mindmapToPng(JSON.stringify(mindmap))
            files.push(
              new File([blob], `${slugify(title)}-peta-konsep.png`, {
                type: "image/png",
              })
            )
          } catch {
            // Lewatin error, share teks saja
          }
        }
        if (summary) {
          files.push(
            new File([summaryToMarkdown(summary)], `${slugify(title)}-ringkasan.md`, {
              type: "text/markdown",
            })
          )
        }
        if (flashcards.length > 0) {
          files.push(
            new File([flashcardsToCsv(flashcards)], `${slugify(title)}-flashcard.csv`, {
              type: "text/csv",
            })
          )
        }
        if (files.length > 0) {
          shareData.files = files
        }
      }

      await navigator.share(shareData)
      return true
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast({
          title: "Batal membagikan",
          description: "Coba salin teks saja.",
        })
      }
      return false
    }
  }

  // WhatsApp: lewati Web Share langsung (teks + lampiran). Yang nggak didukung,
  // buka WhatsApp URL. JANGAN buka URL setelah await, sebab popup
  // Android Chrome tersumbat saat activation telah dipakai oleh navigator.share.
  const handleOpenWhatsApp = async () => {
    if (supportsShareFiles) {
      await sendViaWebShare()
      return
    }
    openWhatsappUrl()
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenDialog}
        disabled={disabled}
      >
        <Share2 className="h-4 w-4" />
        Bagikan
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true)
          else requestClose()
        }}
      >
        <DialogContent
          ref={sheetRef}
          className={cn(
            "gap-0 p-5 sm:p-6",
            // Mobile: bottom sheet, posisi dan animasi diatur .sheet-mobile
            "sheet-mobile",
            // Desktop: centered dialog
            "sm:max-w-lg sm:rounded-[1.75rem]"
          )}
          onPointerDown={onSheetPointerDown}
          onPointerMove={onSheetPointerMove}
          onPointerUp={onSheetPointerUp}
          onPointerCancel={onSheetPointerUp}
          style={
            dragY !== 0 || dragging
              ? {
                  transform: `translateY(${dragY}px)`,
                  transition: dragging ? "none" : undefined,
                }
              : undefined
          }
        >
          {/* Area tarik: geser ke bawah untuk menutup sheet */}
          <div
            aria-hidden="true"
            className="sheet-handle -mx-5 -mt-5 flex h-9 items-center justify-center sm:hidden"
          >
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="sheet-drag-zone text-left">
            <DialogTitle className="text-xl">Bagikan ke Teman Kelas</DialogTitle>
            <DialogDescription className="mt-1 leading-relaxed">
              AI menyiapkan pesan WhatsApp dari materi ini. Tinjau pesan, lalu kirim
              lewat WhatsApp atau salin teksnya.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-between gap-2 border-b border-border pb-3">
            <span className="text-[0.875rem] font-medium text-muted-foreground">
              Gaya pesan:
            </span>
            <div className="inline-flex rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => handleToneChange("casual")}
                className={cn(
                  "h-9 rounded-full px-4 py-1 text-xs font-medium transition-colors touch-manipulation",
                  tone === "casual"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Santai
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("formal")}
                className={cn(
                  "h-9 rounded-full px-4 py-1 text-xs font-medium transition-colors touch-manipulation",
                  tone === "formal"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Formal
              </button>
            </div>
          </div>

          <div className="relative mt-3">
            <div className="flex items-center justify-between gap-2 pb-1.5 text-xs text-muted-foreground">
              <label htmlFor="share-message">Isi pesan (dapat disunting)</label>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isAiLoading}
                className="-mr-1 flex items-center gap-1.5 rounded-full px-2 py-1.5 font-medium transition-colors hover:text-foreground disabled:opacity-60 touch-manipulation"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCw className="h-3 w-3" />
                )}
                {isAiLoading ? "Menyusun..." : "Buat ulang"}
              </button>
              <span aria-live="polite" className="sr-only">
                {isAiLoading ? "AI sedang menyusun pesan" : ""}
              </span>
            </div>
            <div className="relative min-h-[160px]">
              {isAiLoading && !message ? (
                <div
                  aria-label="Memuat draf pesan"
                  className="flex h-[160px] w-full flex-col justify-center gap-2.5 rounded-2xl border border-border bg-secondary/30 p-4"
                >
                  <div className="h-3.5 w-2/5 animate-pulse rounded-md bg-muted-foreground/15" />
                  <div className="mt-1 h-3 w-4/5 animate-pulse rounded-md bg-muted-foreground/15" />
                  <div className="h-3 w-3/4 animate-pulse rounded-md bg-muted-foreground/15" />
                  <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted-foreground/15" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded-md bg-muted-foreground/15" />
                </div>
              ) : (
                <textarea
                  id="share-message"
                  value={message}
                  onChange={(e) => {
                    setCustomized(true)
                    setMessage(sanitizeShareText(e.target.value))
                  }}
                  rows={7}
                  className="w-full resize-y rounded-2xl border border-input bg-card p-3 text-[0.875rem] leading-relaxed outline-hidden transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Menyusun pesan..."
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              className="h-10 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover touch-manipulation"
              onClick={handleOpenWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              {supportsShareFiles ? "Kirim WhatsApp" : "Buka WhatsApp"}
            </Button>
            <Button
              variant="outline"
              className="h-10 touch-manipulation"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Disalin" : "Salin Teks"}
            </Button>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-secondary/50 p-3.5">
            <p className="text-xs font-medium text-foreground">
              Lampiran visual & dokumen
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              WhatsApp kirim langsung pesan dan lampiran bila browser mendukung
              Web Share; jika tidak, unduh lampiran berikut untuk dikirimkan
              bersama:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {mindmap && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPng}
                  disabled={pngBusy}
                  className="h-10 flex-1 text-xs touch-manipulation"
                >
                  {pngBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Peta Konsep (.png)
                </Button>
              )}
              {summary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadSummaryMd}
                  className="h-10 text-xs touch-manipulation text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Ringkasan (.md)
                </Button>
              )}
              {flashcards.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownloadFlashcardsCsv}
                  className="h-10 text-xs touch-manipulation text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Flashcard (.csv)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
