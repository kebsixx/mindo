"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"
import { Mic, MicOff, Square, Loader2, CheckCircle, XCircle, AlertCircle, ChevronLeft, Volume2, VolumeX, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { openDB } from "@/lib/db"

export default function RecordingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 24000 })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(1000)
      setRecording(true)
      startTimeRef.current = Date.now() - pausedTimeRef.current
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (e) {
      toast({ title: "Gagal akses mikrofon", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const saveRecording = async () => {
    if (!audioBlob) return

    setProcessing(true)
    try {
      const finalTitle = title.trim() || `Rekaman ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`

      const db = openDB()
      const materialId = await db.materials.add({
        title: finalTitle,
        createdAt: new Date().toISOString(),
        duration,
        status: "pending",
        fileName: `recording-${Date.now()}.webm`,
        fileSize: audioBlob.size,
      })

      router.push(`/processing?id=${materialId}`)
    } catch (e) {
      toast({ title: "Gagal simpan", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setProcessing(false)
    }
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Rekam Langsung</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Rekaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold">{formatDuration(duration)}</div>
              <div className="text-sm text-muted-foreground">
                {audioBlob ? `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB` : "Belum ada rekaman"}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!recording && !audioBlob && (
                <Button size="lg" onClick={startRecording}>
                  <Mic className="h-5 w-5" />
                  Mulai Rekam
                </Button>
              )}
              {recording && (
                <Button size="lg" variant="destructive" onClick={stopRecording}>
                  <Square className="h-5 w-5" />
                  Stop
                </Button>
              )}
              {audioBlob && !recording && (
                <>
                  <Button variant="outline" onClick={() => { setAudioBlob(null); setDuration(0); pausedTimeRef.current = 0 }}>
                    <Trash2 className="h-5 w-5" />
                    Ulang
                  </Button>
                  <Button onClick={saveRecording} disabled={processing}>
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Simpan & Proses
                  </Button>
                </>
              )}
            </div>

            {audioBlob && (
              <div className="space-y-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul materi (opsional)"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}