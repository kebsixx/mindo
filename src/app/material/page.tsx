"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText, Brain, Layers, Sparkles, MessageSquare, Mic, ChevronLeft, Copy, Download, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Search, ArrowUpRight, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { openDB, type Material, type Summary, type Mindmap, type Flashcard, type TranscriptSegment } from "@/lib/db"
import MarkmapView from "@/components/markmap-view"

export default function MaterialPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [mindmap, setMindmap] = useState<Mindmap | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) setMaterialId(id)
  }, [searchParams])

  useEffect(() => {
    if (!materialId) return
    loadData()
  }, [materialId])

  const loadData = async () => {
    setLoading(true)
    try {
      const db = openDB()
      const mat = await db.materials.get(parseInt(materialId!))
      setMaterial(mat || null)

      const sum = await db.summaries.get(parseInt(materialId!))
      setSummary(sum || null)

      const mm = await db.mindmaps.get(parseInt(materialId!))
      setMindmap(mm || null)

      const cards = await db.flashcards.where("materialId").equals(parseInt(materialId!)).toArray()
      setFlashcards(cards)

      const trans = await db.transcripts.get(parseInt(materialId!))
      setSegments(trans?.segments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{material?.title || "Materi"}</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="mindmap">Peta Konsep</TabsTrigger>
            <TabsTrigger value="flashcard">Flashcard</TabsTrigger>
            <TabsTrigger value="tutor">Tanya Mindo</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>{summary?.title || "Ringkasan"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary?.sections.map((section, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="font-semibold text-lg">{section.heading}</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {section.points.map((point, j) => (
                        <li key={j} className="text-muted-foreground">{point}</li>
                      ))}
                    </ul>
                    {section.keyTerms && section.keyTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {section.keyTerms.map((term, k) => (
                          <span key={k} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
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
                <CardTitle>{mindmap?.title || "Peta Konsep"}</CardTitle>
              </CardHeader>
              <CardContent>
                {mindmap ? (
                  <MarkmapView content={JSON.stringify(mindmap)} className="w-full h-[500px]" />
                ) : (
                  <p className="text-muted-foreground">Belum ada peta konsep.</p>
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
                {flashcards.length > 0 ? (
                  <div className="space-y-4">
                    {flashcards.map((card, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="font-medium">{card.question}</div>
                        <div className="text-muted-foreground mt-2">{card.answer}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {card.difficulty} • {Math.floor(card.timestampRef / 60)}:{String(Math.floor(card.timestampRef % 60)).padStart(2, "0")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Belum ada flashcard.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutor">
            <Card>
              <CardHeader>
                <CardTitle>Tanya Mindo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fitur tutor AI akan segera hadir.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}