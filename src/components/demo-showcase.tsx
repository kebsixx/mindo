"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MarkmapView from "@/components/markmap-view"
import FlashcardSwiper from "@/components/flashcard-swiper"

export interface DemoData {
  title: string
  duration: number
  segments: { start: number; end: number; text: string }[]
  summary: {
    title: string
    sections: { heading: string; points: string[]; keyTerms?: string[] }[]
  }
  mindmap: { title: string; children: unknown[] }
  flashcards: {
    id: number
    question: string
    answer: string
    difficulty: "easy" | "medium" | "hard"
    timestampRef: number
  }[]
}

let cached: Promise<DemoData> | null = null

function loadDemo(): Promise<DemoData> {
  if (!cached) {
    cached = fetch("/demo.json").then((res) => {
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    })
    cached.catch(() => {
      cached = null
    })
  }
  return cached
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
}

export default function DemoShowcase() {
  const [data, setData] = useState<DemoData | null>(null)
  const [failed, setFailed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadDemo()
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  const seekAudio = (seconds: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.min(seconds, el.duration || seconds)
    void el.play().catch(() => {})
  }

  if (failed) {
    return (
      <p className="text-[1.0625rem] leading-[1.55] text-muted-foreground">
        Contoh hasil gagal dimuat. Muat ulang halaman untuk mencoba lagi.
      </p>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[240px] items-center justify-center" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Memuat contoh hasil</span>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-6">
        <p className="text-[1.0625rem] leading-[1.55]">
          Rekaman berita 47 detik. Empat tahap berjalan sekali, hasil ini yang Anda dapat.
        </p>
        <div className="mt-4 rounded-[28px] bg-secondary p-1.5">
          <audio ref={audioRef} src="/demo.mp3" controls preload="none" className="w-full" />
        </div>
        <p className="mt-3 text-[0.875rem] leading-snug text-muted-foreground">
          Putar rekaman lalu klik baris transkrip untuk melompat ke detiknya.
        </p>
      </div>

      <div className="min-w-0">
        <Tabs defaultValue="summary">
          <TabsList className="flex w-full justify-start overflow-x-auto sm:inline-flex sm:w-auto [&>*]:shrink-0">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
            <TabsTrigger value="flashcard">Flashcard</TabsTrigger>
            <TabsTrigger value="transcript">Transkrip</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{data.summary.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.summary.sections.map((section, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-[1.0625rem] font-semibold">{section.heading}</h4>
                    <ul className="max-w-[68ch] list-disc space-y-1 pl-5 text-[1.0625rem] leading-[1.6] text-muted-foreground">
                      {section.points.map((point, j) => (
                        <li key={j}>{point}</li>
                      ))}
                    </ul>
                    {section.keyTerms && section.keyTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {section.keyTerms.map((term, k) => (
                          <span key={k} className="rounded-full bg-primary/12 px-2.5 py-1 text-[0.8125rem] text-foreground">
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mindmap">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{data.mindmap.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkmapView content={JSON.stringify(data.mindmap)} className="h-[420px] w-full" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcard">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Flashcard</CardTitle>
              </CardHeader>
              <CardContent>
                <FlashcardSwiper cards={data.flashcards} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transkrip</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="max-h-[420px] space-y-1 overflow-y-auto">
                  {data.segments.map((seg, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => seekAudio(seg.start)}
                        className="flex w-full cursor-pointer gap-3 rounded-2xl p-2 text-left hover:bg-secondary"
                      >
                        <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">
                          {formatTime(seg.start)}
                        </span>
                        <span className="text-[1.0625rem] leading-[1.55]">{seg.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
