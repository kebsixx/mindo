"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, XCircle, FileText, Brain, Network, Layers, RefreshCw, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { openDB } from "@/lib/db"
import { transcribe } from "@/lib/ai/agents/transcribe"
import { summarize } from "@/lib/ai/agents/summarize"
import { mindmap } from "@/lib/ai/agents/mindmap"
import { flashcard } from "@/lib/ai/agents/flashcard"
import { chunkTranscript } from "@/lib/retrieval/chunk"
import { getApiKey, getProvider } from "@/lib/storage/settings"
import SiteHeader from "@/components/site-header"
import type { Provider } from "@/lib/ai/client"

type StageStatus = "pending" | "running" | "completed" | "failed"

interface ProcessingStage {
  id: string
  label: string
  icon: React.ReactNode
  status: StageStatus
  error?: string
  finishedAt?: string
}

const INITIAL_STAGES: ProcessingStage[] = [
  { id: "transcribe", label: "Transkrip", icon: <FileText className="h-5 w-5" />, status: "pending" },
  { id: "summarize", label: "Ringkasan", icon: <Brain className="h-5 w-5" />, status: "pending" },
  { id: "mindmap", label: "Mindmap", icon: <Network className="h-5 w-5" />, status: "pending" },
  { id: "flashcard", label: "Flashcard", icon: <Layers className="h-5 w-5" />, status: "pending" },
]

function nowTime(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

function humanError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "")
  if (/401|unauthorized|invalid api key|incorrect api key/i.test(raw)) {
    return "API key ditolak provider. Periksa di menu Pengaturan."
  }
  if (/413|too large|maximum file size|file too large/i.test(raw)) {
    return "File terlalu besar untuk diproses. Batasnya 25 MB."
  }
  if (/429|rate limit|too many requests/i.test(raw)) {
    return "Terlalu banyak permintaan ke provider. Tunggu sebentar lalu coba lagi."
  }
  if (/failed to fetch|networkerror|load failed|cors/i.test(raw)) {
    return "Tidak bisa menghubungi provider. Periksa koneksi internet."
  }
  if (/ECONNREFUSED|ENOTFOUND|certificate/i.test(raw)) {
    return "Server provider tidak terjangkau. Coba lagi nanti."
  }
  if (/invalid json|unexpected token|schema/i.test(raw)) {
    return "Jawaban model tidak sesuai format. Coba lagi."
  }
  return "Proses gagal. Coba lagi, atau ganti API key di menu Pengaturan."
}

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Memuat halaman pemrosesan</span>
        </div>
      }
    >
      <ProcessingView />
    </Suspense>
  )
}

function ProcessingView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const materialId = searchParams.get("id")
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES)
  const stagesRef = useRef<ProcessingStage[]>(INITIAL_STAGES)
  const transcriptTextRef = useRef("")
  const startedRef = useRef(false)

  const updateStage = (id: string, updates: Partial<ProcessingStage>) => {
    const next = stagesRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s))
    stagesRef.current = next
    setStages(next)
  }

  async function runPipeline() {
    const mid = parseInt(materialId!, 10)
    const db = openDB()
    const apiKey = getApiKey()
    const provider = getProvider()

    updateStage("transcribe", { status: "running", error: undefined, finishedAt: undefined })
    if (!apiKey) {
      updateStage("transcribe", { status: "failed", error: "API key belum diisi. Tempel API key di halaman beranda atau Pengaturan." })
      return
    }

    let text = ""
    let title = "Materi"
    try {
      const material = await db.materials.get(mid)
      if (!material?.audio) {
        updateStage("transcribe", {
          status: "failed",
          error: "File rekaman tidak ditemukan. Pilih atau rekam ulang file.",
        })
        return
      }
      title = material.title
      const result = await transcribe(provider, apiKey, material.audio)
      text = result.segments.map((s) => s.text).join(" ").trim()
      transcriptTextRef.current = text
      await db.transcripts.put({ materialId: mid, segments: result.segments })
      await db.chunks.bulkPut(chunkTranscript(mid, result.segments))
      await db.materials.update(mid, { duration: Math.round(result.duration), status: "processing" })
      updateStage("transcribe", { status: "completed", finishedAt: nowTime() })
    } catch (e) {
      updateStage("transcribe", { status: "failed", error: humanError(e) })
      return
    }

    if (!text) {
      updateStage("transcribe", { status: "failed", error: "Transkrip kosong. Rekam ulang dengan audio yang lebih jelas." })
      return
    }

    const results = await Promise.all([
      runSummarize(mid, provider, apiKey, text),
      runMindmap(mid, provider, apiKey, text, title),
      runFlashcard(mid, provider, apiKey, text, title),
    ])

    await db.materials.update(mid, { status: results.every(Boolean) ? "done" : "partial" })
  }

  async function runSummarize(mid: number, provider: Provider, apiKey: string, text: string): Promise<boolean> {
    updateStage("summarize", { status: "running", error: undefined, finishedAt: undefined })
    try {
      const result = await summarize(provider, apiKey, text)
      await openDB().summaries.put({ materialId: mid, title: result.title, sections: result.sections })
      updateStage("summarize", { status: "completed", finishedAt: nowTime() })
      return true
    } catch (e) {
      updateStage("summarize", { status: "failed", error: humanError(e) })
      return false
    }
  }

  async function runMindmap(mid: number, provider: Provider, apiKey: string, text: string, title: string): Promise<boolean> {
    updateStage("mindmap", { status: "running", error: undefined, finishedAt: undefined })
    try {
      const result = await mindmap(provider, apiKey, text, title)
      await openDB().mindmaps.put({ materialId: mid, title: result.title, children: result.children })
      updateStage("mindmap", { status: "completed", finishedAt: nowTime() })
      return true
    } catch (e) {
      updateStage("mindmap", { status: "failed", error: humanError(e) })
      return false
    }
  }

  async function runFlashcard(mid: number, provider: Provider, apiKey: string, text: string, title: string): Promise<boolean> {
    updateStage("flashcard", { status: "running", error: undefined, finishedAt: undefined })
    try {
      const result = await flashcard(provider, apiKey, text, title)
      const db = openDB()
      await db.flashcards.where("materialId").equals(mid).delete()
      await db.flashcards.bulkAdd(
        result.cards.map((c) => ({
          materialId: mid,
          question: c.question,
          answer: c.answer,
          difficulty: c.difficulty,
          timestampRef: c.timestampRef,
          grade: "unknown" as const,
        }))
      )
      updateStage("flashcard", { status: "completed", finishedAt: nowTime() })
      return true
    } catch (e) {
      updateStage("flashcard", { status: "failed", error: humanError(e) })
      return false
    }
  }

  async function handleRetry(id: string) {
    if (id === "transcribe") {
      await runPipeline()
      return
    }
    const apiKey = getApiKey()
    const provider = getProvider()
    const mid = parseInt(materialId!, 10)
    if (!apiKey) {
      updateStage(id, { status: "failed", error: "API key belum diisi. Tempel API key di halaman beranda atau Pengaturan." })
      return
    }

    let text = transcriptTextRef.current
    if (!text) {
      const saved = await openDB().transcripts.get(mid)
      text = saved?.segments.map((s) => s.text).join(" ").trim() ?? ""
    }
    if (!text) {
      updateStage(id, { status: "failed", error: "Transkrip belum ada. Jalankan ulang tahap Transkrip dulu." })
      return
    }
    const material = await openDB().materials.get(mid)
    const title = material?.title ?? "Materi"

    if (id === "summarize") await runSummarize(mid, provider, apiKey, text)
    if (id === "mindmap") await runMindmap(mid, provider, apiKey, text, title)
    if (id === "flashcard") await runFlashcard(mid, provider, apiKey, text, title)
  }

  useEffect(() => {
    if (!materialId || startedRef.current) return
    startedRef.current = true
    void runPipeline()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  const allDone = stages.every((s) => s.status === "completed" || s.status === "failed")
  const transcribeDone = stages.find((s) => s.id === "transcribe")?.status === "completed"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground" aria-label="Kembali ke beranda">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Memproses Materi</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Tahap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-lg border p-4",
                  stage.status === "running" && "border-primary/50"
                )}
              >
                <div className="flex-shrink-0">
                  {stage.status === "pending" && (
                    <span className="block h-5 w-5 rounded-full border-2 border-muted-foreground" aria-hidden="true" />
                  )}
                  {stage.status === "running" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary" aria-hidden="true">
                      <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                    </span>
                  )}
                  {stage.status === "completed" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary" aria-hidden="true">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </span>
                  )}
                  {stage.status === "failed" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15" aria-hidden="true">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {stage.icon}
                    {stage.label}
                  </div>
                  {stage.status === "running" && <p className="text-sm text-muted-foreground">Sedang diproses</p>}
                  {stage.status === "completed" && stage.finishedAt && (
                    <p className="text-sm text-muted-foreground">Selesai pukul {stage.finishedAt}</p>
                  )}
                  {stage.status === "failed" && stage.error && (
                    <p className="text-sm text-destructive" aria-live="assertive">
                      {stage.error}
                    </p>
                  )}
                </div>
                {stage.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleRetry(stage.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Coba Lagi
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            Batal
          </Button>
          {allDone && transcribeDone && (
            <Button onClick={() => router.push(`/material?id=${materialId}`)}>Lihat Hasil</Button>
          )}
        </div>
      </div>
    </div>
  )
}
