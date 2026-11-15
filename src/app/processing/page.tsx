"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Check, XCircle, FileText, Brain, Network, Layers, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { openDB, type Flashcard, type Material, type Mindmap, type Summary } from "@/lib/db"
import { transcribe } from "@/lib/ai/agents/transcribe"
import { chunkTranscript } from "@/lib/retrieval/chunk"
import { getApiKey, getProvider } from "@/lib/storage/settings"
import { PROVIDERS } from "@/lib/ai/providers"
import { humanError } from "@/lib/ai/errors"
import { runFlashcards, runMindmap, runSummary } from "@/lib/ai/pipeline"
import SiteHeader from "@/components/site-header"
import { Mascot } from "@/components/mascot"

type StageStatus = "pending" | "running" | "completed" | "failed"

interface ProcessingStage {
  id: string
  label: string
  icon: React.ReactNode
  status: StageStatus
  error?: string
  finishedAt?: string
}

interface ExistingResults {
  material?: Material
  text: string
  summary?: Summary
  mindmap?: Mindmap
  flashcards: Flashcard[]
}

const LLM_STAGES = ["summarize", "mindmap", "flashcard"] as const

const INITIAL_STAGES: ProcessingStage[] = [
  { id: "transcribe", label: "Transkrip", icon: <FileText className="h-5 w-5" />, status: "pending" },
  { id: "summarize", label: "Ringkasan", icon: <Brain className="h-5 w-5" />, status: "pending" },
  { id: "mindmap", label: "Mindmap", icon: <Network className="h-5 w-5" />, status: "pending" },
  { id: "flashcard", label: "Flashcard", icon: <Layers className="h-5 w-5" />, status: "pending" },
]

function nowTime(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

async function loadExistingResults(mid: number): Promise<ExistingResults> {
  const db = openDB()
  const [material, transcript, summary, mindmap, flashcards] = await Promise.all([
    db.materials.get(mid),
    db.transcripts.get(mid),
    db.summaries.get(mid),
    db.mindmaps.get(mid),
    db.flashcards.where("materialId").equals(mid).toArray(),
  ])
  const text =
    transcript?.segments
      .map((s) => s.text)
      .join(" ")
      .trim() ?? ""
  return { material, text, summary, mindmap, flashcards }
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
  const stageErrorsRef = useRef<Record<string, string>>({})
  const transcriptTextRef = useRef("")
  const startedRef = useRef(false)

  const updateStage = (id: string, updates: Partial<ProcessingStage>) => {
    const next = stagesRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s))
    stagesRef.current = next
    setStages(next)
  }

  const markRunning = (id: string) => {
    delete stageErrorsRef.current[id]
    updateStage(id, { status: "running", error: undefined, finishedAt: undefined })
  }

  const markCompleted = (id: string) => {
    delete stageErrorsRef.current[id]
    updateStage(id, { status: "completed", error: undefined, finishedAt: nowTime() })
  }

  const markFailed = (id: string, message: string) => {
    stageErrorsRef.current[id] = message
    updateStage(id, { status: "failed", error: message })
  }

  /**
   * Simpan status akhir ke materi supaya halaman Materi tahu bagian mana yang
   * gagal dan tidak menawarkan hasil kosong tanpa jalan keluar.
   */
  const persistOutcome = async (mid: number) => {
    const status = Object.fromEntries(stagesRef.current.map((s) => [s.id, s.status]))
    const allLlmDone = LLM_STAGES.every((id) => status[id] === "completed")
    const someLlmDone = LLM_STAGES.some((id) => status[id] === "completed")
    const overall =
      status.transcribe !== "completed"
        ? "failed"
        : allLlmDone
          ? "done"
          : someLlmDone
            ? "partial"
            : "failed"
    await openDB().materials.update(mid, {
      status: overall,
      stageErrors: { ...stageErrorsRef.current },
    })
  }

  async function runStage(
    id: string,
    action: () => Promise<void>
  ): Promise<boolean> {
    markRunning(id)
    try {
      await action()
      markCompleted(id)
      return true
    } catch (e) {
      console.error(`[mindo] tahap ${id} gagal`, e)
      markFailed(id, humanError(e))
      return false
    }
  }

  async function runLlmStages(
    mid: number,
    text: string,
    title: string,
    existing: Pick<ExistingResults, "summary" | "mindmap" | "flashcards">
  ) {
    const llmProvider = getProvider("llm")
    const llmInfo = PROVIDERS[llmProvider]
    const llmApiKey = getApiKey(llmProvider)

    const has = {
      summarize: Boolean(existing.summary),
      mindmap: Boolean(existing.mindmap),
      flashcard: existing.flashcards.length > 0,
    }

    // Hasil yang sudah tersimpan menang atas catatan gagal lama.
    for (const id of LLM_STAGES) {
      if (has[id]) {
        delete stageErrorsRef.current[id]
        updateStage(id, { status: "completed", error: undefined, finishedAt: undefined })
      }
    }

    if (!llmInfo.keyless && !llmApiKey.trim()) {
      const message =
        "API key ringkasan belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider."
      for (const id of LLM_STAGES) {
        if (!has[id]) markFailed(id, message)
      }
      await persistOutcome(mid)
      return
    }

    // Kegagalan sebelumnya hanya dijalankan ulang lewat tombol Coba lagi.
    for (const id of LLM_STAGES) {
      if (!has[id] && stageErrorsRef.current[id]) {
        updateStage(id, { status: "failed", error: stageErrorsRef.current[id] })
      }
    }

    const jobs: Promise<boolean>[] = []
    if (!has.summarize && !stageErrorsRef.current.summarize) {
      jobs.push(runStage("summarize", () => runSummary(mid, llmProvider, llmApiKey, text)))
    }
    if (!has.mindmap && !stageErrorsRef.current.mindmap) {
      jobs.push(runStage("mindmap", () => runMindmap(mid, llmProvider, llmApiKey, text, title)))
    }
    if (!has.flashcard && !stageErrorsRef.current.flashcard) {
      jobs.push(
        runStage("flashcard", () => runFlashcards(mid, llmProvider, llmApiKey, text, title))
      )
    }

    await Promise.all(jobs)
    await persistOutcome(mid)
  }

  async function runPipeline() {
    const mid = parseInt(materialId ?? "", 10)
    if (!Number.isFinite(mid)) {
      markFailed("transcribe", "Materi tidak ditemukan. Buka lagi dari Riwayat.")
      return
    }

    const db = openDB()
    const existing = await loadExistingResults(mid)
    if (existing.material?.stageErrors) {
      stageErrorsRef.current = { ...existing.material.stageErrors }
    }

    if (existing.text) {
      // Transkripsi tidak diulang saat halaman dimuat ulang.
      updateStage("transcribe", { status: "completed", error: undefined, finishedAt: undefined })
      transcriptTextRef.current = existing.text
      await runLlmStages(
        mid,
        existing.text,
        existing.material?.title ?? "Materi",
        existing
      )
      return
    }

    const storedTranscribeError = stageErrorsRef.current.transcribe
    if (storedTranscribeError) {
      updateStage("transcribe", { status: "failed", error: storedTranscribeError })
      return
    }

    const sttProvider = getProvider("stt")
    const sttInfo = PROVIDERS[sttProvider]
    const sttApiKey = getApiKey(sttProvider)

    if (!sttInfo.stt) {
      markFailed(
        "transcribe",
        `${sttInfo.label} belum mendukung transkripsi audio. Pilih Groq atau OpenAI di Pengaturan.`
      )
      await persistOutcome(mid)
      return
    }
    if (!sttInfo.keyless && !sttApiKey.trim()) {
      markFailed(
        "transcribe",
        "API key transkripsi belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider."
      )
      await persistOutcome(mid)
      return
    }
    if (!existing.material?.audio) {
      markFailed("transcribe", "File rekaman tidak ditemukan. Pilih atau rekam ulang file.")
      await persistOutcome(mid)
      return
    }

    markRunning("transcribe")
    try {
      const result = await transcribe(sttProvider, sttApiKey, existing.material.audio)
      const text = result.segments
        .map((s) => s.text)
        .join(" ")
        .trim()
      if (!text) {
        markFailed("transcribe", "Transkrip kosong. Rekam ulang dengan audio yang lebih jelas.")
        await persistOutcome(mid)
        return
      }
      transcriptTextRef.current = text
      await db.transcripts.put({ materialId: mid, segments: result.segments })
      await db.chunks.bulkPut(chunkTranscript(mid, result.segments))
      await db.materials.update(mid, {
        duration: Math.round(result.duration),
        status: "processing",
      })
      markCompleted("transcribe")
      await runLlmStages(mid, text, existing.material.title, {
        summary: undefined,
        mindmap: undefined,
        flashcards: [],
      })
    } catch (e) {
      console.error("[mindo] tahap transcribe gagal", e)
      markFailed("transcribe", humanError(e))
      await persistOutcome(mid)
    }
  }

  async function handleRetry(id: string) {
    const mid = parseInt(materialId ?? "", 10)
    if (!Number.isFinite(mid)) return

    if (id === "transcribe") {
      // Hapus catatan gagal lama dulu, kalau tidak runPipeline akan
      // memulihkannya dari DB dan langsung berhenti tanpa mencoba.
      const nextErrors = { ...stageErrorsRef.current }
      delete nextErrors.transcribe
      stageErrorsRef.current = nextErrors
      await openDB().materials.update(mid, { stageErrors: nextErrors })
      await runPipeline()
      return
    }

    const llmProvider = getProvider("llm")
    const llmApiKey = getApiKey(llmProvider)
    if (!PROVIDERS[llmProvider].keyless && !llmApiKey.trim()) {
      markFailed(
        id,
        "API key ringkasan belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider."
      )
      await persistOutcome(mid)
      return
    }

    let text = transcriptTextRef.current
    if (!text) {
      const saved = await openDB().transcripts.get(mid)
      text = saved?.segments.map((s) => s.text).join(" ").trim() ?? ""
    }
    if (!text) {
      markFailed(id, "Transkrip belum ada. Jalankan ulang tahap Transkrip dulu.")
      await persistOutcome(mid)
      return
    }
    const material = await openDB().materials.get(mid)
    const title = material?.title ?? "Materi"

    if (id === "summarize") {
      await runStage("summarize", () => runSummary(mid, llmProvider, llmApiKey, text))
    } else if (id === "mindmap") {
      await runStage("mindmap", () => runMindmap(mid, llmProvider, llmApiKey, text, title))
    } else if (id === "flashcard") {
      await runStage("flashcard", () => runFlashcards(mid, llmProvider, llmApiKey, text, title))
    }
    await persistOutcome(mid)
  }

  useEffect(() => {
    if (!materialId || startedRef.current) return
    startedRef.current = true
    void runPipeline().catch((e) => {
      console.error("[mindo] pemrosesan berhenti", e)
      markFailed("transcribe", humanError(e))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  const allDone = stages.every((s) => s.status === "completed" || s.status === "failed")
  const transcribeDone = stages.find((s) => s.id === "transcribe")?.status === "completed"
  const failedParts = stages.filter(
    (s) => LLM_STAGES.includes(s.id as (typeof LLM_STAGES)[number]) && s.status === "failed"
  ).length

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <div className="flex items-center gap-4">
          <h1 className="min-w-0 flex-1 text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">Memproses Materi</h1>
          <Mascot
            directions="/mascots/mindo-directions.webp"
            reactions="/mascots/mindo-reactions.webp"
            label="maskot Mindo"
            size={96}
          />
        </div>
        <p className="mt-3 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          Transkrip dikerjakan lebih dulu, lalu ringkasan, mindmap, dan flashcard berjalan bersamaan.
        </p>

        {transcribeDone && failedParts > 0 && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5"
          >
            <p className="text-[0.9375rem] font-medium">
              {failedParts} dari 3 bagian belum jadi.
            </p>
            <p className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground">
              Hasil yang selesai tetap tersimpan. Coba lagi bagian yang gagal, atau buka hasil
              yang sudah ada.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-2" aria-live="polite">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-2xl px-4 py-4",
                stage.status === "running" ? "bg-primary/12" : "bg-secondary"
              )}
            >
              <div className="flex-shrink-0">
                {stage.status === "pending" && (
                  <span className="block h-6 w-6 rounded-full border-2 border-muted-foreground/40" aria-hidden="true" />
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
                {stage.status === "running" && <p className="text-[0.9375rem] text-muted-foreground">Sedang diproses</p>}
                {stage.status === "completed" && (
                  <p className="text-[0.9375rem] tabular-nums text-muted-foreground">
                    {stage.finishedAt ? `Selesai pukul ${stage.finishedAt}` : "Sudah tersimpan"}
                  </p>
                )}
                {stage.status === "failed" && stage.error && (
                  <p className="text-[0.9375rem] text-destructive" aria-live="assertive">
                    {stage.error}
                  </p>
                )}
              </div>
              {stage.status === "failed" && (
                <Button
                  variant="outline"
                  className="w-full bg-card sm:w-auto"
                  onClick={() => handleRetry(stage.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba lagi
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            Batal
          </Button>
          {allDone && transcribeDone && (
            <Button onClick={() => router.push(`/material?id=${materialId}`)}>
              {failedParts > 0 ? "Lihat hasil yang selesai" : "Lihat Hasil"}
            </Button>
          )}
        </div>

        <p className="mt-6 text-[0.9375rem] leading-snug text-muted-foreground">
          Jangan tutup tab ini sampai tahap terakhir selesai. Semua panggilan berjalan dari browser
          Anda. Membuka ulang halaman ini tidak mengulang transkripsi yang sudah tersimpan.
        </p>
      </main>
    </div>
  )
}
