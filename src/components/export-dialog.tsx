"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  downloadBlob,
  estimateBytes,
  exportBundle,
  formatBytes,
} from "@/lib/export/bundle"

type Mode = "archive" | "portable"

interface ExportDialogProps {
  materialIds: number[]
  label?: string
  size?: "sm" | "default"
}

const MODES: { id: Mode; name: string; description: string }[] = [
  {
    id: "archive",
    name: "Arsip hasil",
    description:
      "ringkasan.md, transkrip.txt, flashcard.csv, mindmap.png. Untuk dibaca sendiri atau dibagikan.",
  },
  {
    id: "portable",
    name: "Pindah perangkat",
    description:
      "File yang sama, ditambah mindo-data.json. Impor kembali lewat Pengaturan di perangkat lain.",
  },
]

export default function ExportDialog({
  materialIds,
  label = "Ekspor",
  size = "sm",
}: ExportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("archive")
  const [includeAudio, setIncludeAudio] = useState(false)
  const [estimate, setEstimate] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    estimateBytes(materialIds, mode === "portable", includeAudio)
      .then((bytes) => {
        if (!cancelled) setEstimate(bytes)
      })
      .catch(() => {
        if (!cancelled) setEstimate(null)
      })
    return () => {
      cancelled = true
    }
    // materialIds stabil per pemanggilan; isinya dibandingkan lewat join.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, includeAudio, materialIds.join(",")])

  const handleExport = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await exportBundle({
        materialIds,
        portable: mode === "portable",
        includeAudio: mode === "portable" && includeAudio,
      })
      downloadBlob(result.blob, result.filename)
      toast({
        title: "Ekspor siap",
        description: `${result.filename} (${formatBytes(result.bytes)}) diunduh.`,
      })
      setOpen(false)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Ekspor gagal. Coba lagi, atau kurangi jumlah materi.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={() => { setEstimate(null); setOpen(true) }}
        disabled={materialIds.length === 0}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 rounded-[1.75rem] p-6 sm:max-w-md">
          <DialogTitle className="text-xl">
            {materialIds.length > 1
              ? `Ekspor ${materialIds.length} materi`
              : "Ekspor materi"}
          </DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed">
            File dibuat di perangkat ini lalu diunduh sebagai satu .zip. Tidak
            ada yang dikirim ke server.
          </DialogDescription>

          <div
            role="radiogroup"
            aria-label="Jenis ekspor"
            className="mt-5 space-y-2"
          >
            {MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={mode === option.id}
                onClick={() => { setMode(option.id); setEstimate(null) }}
                className={cn(
                  "w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                  mode === option.id
                    ? "border-primary bg-primary/12"
                    : "border-border hover:bg-secondary",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {mode === option.id && (
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {mode === "portable" && (
            <button
              type="button"
              aria-pressed={includeAudio}
              onClick={() => { setIncludeAudio(!includeAudio); setEstimate(null) }}
              className={cn(
                "mt-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-full border px-4 py-3 text-left text-sm transition-colors",
                includeAudio
                  ? "border-primary bg-primary/12"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span>
                Sertakan audio asli
                <span className="block text-muted-foreground">
                  Tanpa audio, hasil tetap lengkap tetapi tidak bisa diputar
                  ulang.
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  includeAudio ? "bg-primary" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-card transition-all",
                    includeAudio ? "left-6" : "left-1",
                  )}
                />
              </span>
            </button>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            {estimate === null
              ? "Menghitung perkiraan ukuran…"
              : `Perkiraan ukuran ~${formatBytes(estimate)}`}
          </p>

          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={handleExport} disabled={busy} className="flex-1">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {busy ? "Menyiapkan…" : "Unduh .zip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
