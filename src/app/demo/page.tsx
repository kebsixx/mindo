"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SiteHeader from "@/components/site-header"
import MarkmapView from "@/components/markmap-view"
import FlashcardSwiper from "@/components/flashcard-swiper"

interface DemoData {
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

export default function DemoPage() {
  const [data, setData] = useState<DemoData | null>(null)
  const [failed, setFailed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch("/demo.json")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
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
      <div className="flex min-h-dvh flex-col overflow-x-clip">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-16 sm:px-8">
          <h1 className="text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
            Contoh belum bisa dimuat
          </h1>
          <p className="mt-3 text-[1.0625rem] leading-[1.55] text-muted-foreground">
            Coba muat ulang halaman ini. Kalau tetap gagal, buka beranda untuk memproses rekaman Anda sendiri.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Ke beranda</Link>
          </Button>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Memuat contoh hasil</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[0.8125rem] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Contoh hasil dari rekaman demo, bukan rekaman Anda
        </p>

        <h1 className="mt-4 max-w-[24ch] text-balance text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
          {data.summary.title}
        </h1>

        <div className="mt-6 rounded-[28px] bg-secondary p-1.5">
          <audio ref={audioRef} src="/demo.mp3" controls preload="none" className="w-full" />
        </div>

        <div className="mt-10">
          <Tabs defaultValue="summary">
            <TabsList>
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
                      <h3 className="text-[1.0625rem] font-semibold">{section.heading}</h3>
                      <ul className="max-w-[68ch] list-disc space-y-1 pl-5 text-[1.0625rem] leading-[1.6] text-muted-foreground">
                        {section.points.map((point, j) => (
                          <li key={j}>{point}</li>
                        ))}
                      </ul>
                      {section.keyTerms && section.keyTerms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
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
                  <MarkmapView content={JSON.stringify(data.mindmap)} className="h-[500px] w-full" />
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
                  <ul className="max-h-[500px] space-y-2 overflow-y-auto">
                    {data.segments.map((seg, i) => (
                      <li key={i} className="flex gap-3 rounded-2xl p-2 hover:bg-secondary">
                        <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">
                          {String(Math.floor(seg.start / 60)).padStart(2, "0")}:
                          {String(Math.floor(seg.start % 60)).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => seekAudio(seg.start)}
                          className="cursor-pointer text-left text-[1.0625rem] leading-[1.55] hover:text-muted-foreground"
                        >
                          {seg.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-12 rounded-[28px] bg-secondary px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            Hasil Anda akan berbentuk seperti ini.
          </h2>
          <p className="mt-2 max-w-[52ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            Tempel API key sekali, lalu unggah rekaman kuliah Anda. Empat tahap berjalan di browser dan hasilnya tersimpan
            lokal.
          </p>
          <Button asChild className="mt-5">
            <Link href="/">Proses rekaman saya</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
