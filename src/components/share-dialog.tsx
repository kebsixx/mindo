"use client"

import { useCallback, useState } from "react"
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  Share2,
  Sparkles,
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
  const headings = summary?.sections.map((s) => s.heading) || []
  const points = summary?.sections.flatMap((s) => s.points) || []

  const initialDraft = buildFallbackShareMessage({
    title,
    headings,
    points,
    tone: "casual",
  })

  const [message, setMessage] = useState(initialDraft)
  const [customized, setCustomized] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pngBusy, setPngBusy] = useState(false)

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

  // Refine draf lewat AI
  const triggerAiRefinement = useCallback(
    (currentTone: "casual" | "formal") => {
      const provider = getProvider("llm")
      const apiKey = getApiKey(provider)

      const summaryText = summary
        ? summary.sections
            .map((s) => `${s.heading}:\n${s.points.join("\n")}`)
            .join("\n\n")
        : transcriptExcerpt || ""

      if (!apiKey || summaryText.trim().length === 0) return

      setIsAiLoading(true)
      composeShareMessage(provider, apiKey, {
        title,
        summaryText,
        tone: currentTone,
      })
        .then((aiMsg) => {
          if (aiMsg.trim()) {
            setIsFading(true)
            setTimeout(() => {
              setMessage(aiMsg)
              setIsFading(false)
            }, 120)
          }
        })
        .catch(() => {
          // Gagal AI: fallback deterministik tetap terpasang aman
        })
        .finally(() => {
          setIsAiLoading(false)
        })
    },
    [summary, transcriptExcerpt, title]
  )

  const handleOpenDialog = () => {
    setTone("casual")
    setCustomized(false)
    setMessage(
      buildFallbackShareMessage({
        title,
        headings,
        points,
        tone: "casual",
      })
    )
    setOpen(true)
    triggerAiRefinement("casual")
  }

  const handleToneChange = (newTone: "casual" | "formal") => {
    if (newTone === tone) return
    setTone(newTone)
    if (!customized) {
      const nextTemplate = buildFallbackShareMessage({
        title,
        headings,
        points,
        tone: newTone,
      })
      setIsFading(true)
      setTimeout(() => {
        setMessage(nextTemplate)
        setIsFading(false)
      }, 100)
      triggerAiRefinement(newTone)
    }
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

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppShareUrl(message)
    window.open(url, "_blank", "noopener,noreferrer")
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

  const handleWebShare = async () => {
    if (!navigator.share) return
    try {
      const shareData: ShareData = {
        title: `Catatan: ${title}`,
        text: message,
      }

      // Bila ada mindmap dan didukung, sertakan file PNG
      if (supportsShareFiles && mindmap) {
        try {
          const blob = await mindmapToPng(JSON.stringify(mindmap))
          const file = new File([blob], `${slugify(title)}-peta-konsep.png`, {
            type: "image/png",
          })
          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file]
          }
        } catch {
          // Abaikan error file, bagikan teks saja
        }
      }

      await navigator.share(shareData)
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast({
          title: "Batal membagikan",
          description: "Gunakan tombol Buka WhatsApp atau Salin Teks.",
        })
      }
    }
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 rounded-[1.75rem] p-6 sm:max-w-lg">
          <DialogHeader className="text-left">
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
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
            <div className="flex h-5 items-center justify-between pb-1.5 text-xs text-muted-foreground">
              <span>Isi pesan (dapat disunting)</span>
              <span
                className={cn(
                  "flex items-center gap-1.5 font-medium text-emerald-600 transition-opacity duration-200",
                  isAiLoading ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                aria-live="polite"
              >
                <Sparkles className="h-3 w-3 animate-spin" />
                AI sedang menyusun...
              </span>
            </div>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setCustomized(true)
                  setMessage(sanitizeShareText(e.target.value))
                }}
                rows={7}
                className={cn(
                  "w-full resize-y rounded-2xl border border-input bg-card p-3 text-[0.875rem] leading-relaxed outline-hidden transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20",
                  isFading && "opacity-40 scale-[0.995]",
                  isAiLoading && "border-primary/40 bg-primary/[0.02]"
                )}
                placeholder="Menyusun pesan..."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={handleOpenWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              Buka WhatsApp
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Disalin" : "Salin Teks"}
            </Button>
            {supportsShareFiles && (
              <Button variant="outline" onClick={handleWebShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-secondary/50 p-3.5">
            <p className="text-xs font-medium text-foreground">
              Lampiran visual & dokumen
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              WhatsApp link hanya memuat teks pesan. Unduh lampiran berikut untuk
              dikirimkan bersama:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {mindmap && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPng}
                  disabled={pngBusy}
                  className="h-8 text-xs"
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
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
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
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
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
