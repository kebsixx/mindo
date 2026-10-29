"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ChevronLeft, FileText, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { openDB, type Material, type Summary, type Mindmap, type Flashcard, type TranscriptSegment } from "@/lib/db"
import MarkmapView from "@/components/markmap-view"
import SiteHeader from "@/components/site-header"
import FlashcardSwiper from "@/components/flashcard-swiper"
import TranscriptPanel from "@/components/transcript-panel"
import ChatPanel, { type TutorReply } from "@/components/chat-panel"
import { tutor } from "@/lib/ai/agents/tutor"
import { getApiKey, getProvider } from "@/lib/storage/settings"

export default function MaterialPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Memuat materi</span>
        </div>
      }
    >
      <MaterialView />
    </Suspense>
  )
}

function MaterialView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const materialId = searchParams.get("id")
  const [material, setMaterial] = useState<Material | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [mindmap, setMindmap] = useState<Mindmap | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const [chatOpen, setChatOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const transcriptView = searchParams.get("view") === "transcript"

  const loadData = async () => {
    const db = openDB()
    const mid = parseInt(materialId!, 10)
    const [mat, sum, mm, cards, trans] = await Promise.all([
      db.materials.get(mid),
      db.summaries.get(mid),
      db.mindmaps.get(mid),
      db.flashcards.where("materialId").equals(mid).toArray(),
      db.transcripts.get(mid),
    ])
    return { mat, sum, mm, cards, trans }
  }

  useEffect(() => {
    if (!materialId) return
    loadData()
      .then(({ mat, sum, mm, cards, trans }) => {
        setMaterial(mat || null)
        setSummary(sum || null)
        setMindmap(mm || null)
        setFlashcards(cards)
        setSegments(trans?.segments || [])
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  const toggleTranscript = () => {
    router.replace(`/material?id=${materialId}${transcriptView ? "" : "&view=transcript"}`)
  }

  const seekAudio = (seconds: number) => {
    const el = audioRef.current
    if (!el || !material?.audio) return
    if (!el.src) el.src = URL.createObjectURL(material.audio)
    el.currentTime = seconds
    void el.play().catch(() => {})
  }

  const handleGrade = async (id: number, grade: "known" | "repeat" | "unknown") => {
    try {
      await openDB().flashcards.update(id, { grade })
    } catch {
      // nilai tetap terlihat selama sesi; penyimpanan bisa dicoba lagi
    }
  }

  const askTutor = async (question: string): Promise<TutorReply> => {
    const apiKey = getApiKey()
    if (!apiKey) {
      return { text: "API key belum diisi. Tempel API key di halaman beranda atau Pengaturan." }
    }
    const mid = parseInt(materialId!, 10)
    const chunks = await openDB().chunks.where("materialId").equals(mid).toArray()
    if (chunks.length === 0) {
      return { text: "Transkrip belum tersedia. Jalankan ulang tahap Transkrip di halaman Pemrosesan." }
    }
    const result = await tutor(getProvider(), apiKey, question, chunks)
    if (!result.found) {
      return { text: "Tidak dibahas dalam rekaman ini.", notFound: true }
    }
    const atSec = result.citations.length > 0 ? Math.min(...result.citations) : undefined
    return { text: result.answer, atSec }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Memuat materi" />
        </div>
      </div>
    )
  }

  const chat = (
    <ChatPanel onSend={askTutor} onSeek={seekAudio} />
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground" aria-label="Kembali ke beranda">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold">{material?.title || "Materi"}</h1>
          <Button size="sm" variant="outline" onClick={toggleTranscript} aria-pressed={transcriptView}>
            <FileText className="h-4 w-4" />
            {transcriptView ? "Kembali ke Materi" : "Transkrip"}
          </Button>
        </div>

        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            {transcriptView ? (
              <TranscriptPanel segments={segments} onSeek={seekAudio} />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                  <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
                  <TabsTrigger value="flashcard">Flashcard</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <Card>
                    <CardHeader>
                      <CardTitle>{summary?.title || "Ringkasan"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {summary?.sections.map((section, i) => (
                        <div key={i} className="space-y-2">
                          <h3 className="text-lg font-semibold">{section.heading}</h3>
                          <ul className="list-disc space-y-1 pl-5">
                            {section.points.map((point, j) => (
                              <li key={j} className="text-muted-foreground">{point}</li>
                            ))}
                          </ul>
                          {section.keyTerms && section.keyTerms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {section.keyTerms.map((term, k) => (
                                <span key={k} className="rounded-full bg-primary/12 px-2 py-1 text-xs text-foreground">
                                  {term}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {!summary && <p className="text-muted-foreground">Belum ada ringkasan.</p>}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="mindmap">
                  <Card>
                    <CardHeader>
                      <CardTitle>{mindmap?.title || "Mindmap"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mindmap ? (
                        <MarkmapView content={JSON.stringify(mindmap)} className="h-[500px] w-full" />
                      ) : (
                        <p className="text-muted-foreground">Belum ada mindmap.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="flashcard">
                  <Card>
                    <CardHeader>
                      <CardTitle>Flashcard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FlashcardSwiper
                        cards={flashcards
                          .filter((c) => c.id !== undefined)
                          .map((c) => ({ ...c, id: c.id as number }))}
                        onGrade={handleGrade}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <aside className="sticky top-24 hidden w-[360px] shrink-0 lg:block" aria-label="Tanya Mindo">
            <Card>
              <CardHeader>
                <CardTitle>Tanya Mindo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">{chat}</CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        aria-label="Buka Tanya Mindo"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="px-4 pt-4">Tanya Mindo</DialogTitle>
          <div className="max-h-[85vh]">{chat}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
