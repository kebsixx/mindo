"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText, Brain, Sparkles, Layers, RefreshCw, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ProcessingStage {
  id: string
  label: string
  icon: React.ReactNode
  status: "pending" | "running" | "completed" | "failed"
  progress?: number
  error?: string
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
  const { toast } = useToast()
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: "transcribe", label: "Transkrip", icon: <FileText className="h-5 w-5" />, status: "pending" },
    { id: "summarize", label: "Ringkasan", icon: <Brain className="h-5 w-5" />, status: "pending" },
    { id: "mindmap", label: "Peta Konsep", icon: <Sparkles className="h-5 w-5" />, status: "pending" },
    { id: "flashcard", label: "Flashcard", icon: <Layers className="h-5 w-5" />, status: "pending" },
  ])

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) setMaterialId(id)
  }, [searchParams])

  const updateStage = (id: string, updates: Partial<ProcessingStage>) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const handleCancel = () => {
    router.push("/dashboard")
  }

  const allDone = stages.every((s) => s.status === "completed" || s.status === "failed")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Memproses Materi</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Tahap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border",
                  stage.status === "completed" && "bg-green-50 border-green-200",
                  stage.status === "failed" && "bg-red-50 border-red-200",
                  stage.status === "running" && "bg-blue-50 border-blue-200"
                )}
              >
                <div className="flex-shrink-0">
                  {stage.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                  {stage.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                  {stage.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {stage.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {stage.icon}
                    {stage.label}
                  </div>
                  {stage.error && <p className="text-sm text-red-600 mt-1">{stage.error}</p>}
                </div>
                {stage.status === "failed" && (
                  <Button size="sm" variant="outline" onClick={() => updateStage(stage.id, { status: "pending", error: undefined })}>
                    <RefreshCw className="h-4 w-4" />
                    Coba Lagi
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Batal
          </Button>
          {allDone && (
            <Button onClick={() => router.push(`/material?id=${materialId}`)}>
              Lihat Hasil
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}