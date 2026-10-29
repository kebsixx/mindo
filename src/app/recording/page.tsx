"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Mic, Square, Loader2, ChevronLeft, Trash2, Save, Play, Pause, AlertTriangle, MicOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { openDB } from "@/lib/db"
import SiteHeader from "@/components/site-header"

const WARN_BYTES = 20 * 1024 * 1024

export default function RecordingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [processing, setProcessing] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const [overLimit, setOverLimit] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState<number[]>(() => new Array(24).fill(0.06))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const totalBytesRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const playbackRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
      audioCtxRef.current?.close().catch(() => {})
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    setMicDenied(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 24000 })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      totalBytesRef.current = 0
      setOverLimit(false)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
          totalBytesRef.current += e.data.size
          if (totalBytesRef.current > WARN_BYTES) setOverLimit(true)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        audioCtxRef.current?.close().catch(() => {})
        cancelAnimationFrame(rafRef.current)
        setVolume(new Array(24).fill(0.06))
      }

      mediaRecorder.onstart = () => {
        startTimeRef.current = Date.now()
        setDuration(0)
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 1000)
      }

      mediaRecorder.start(1000)
      setRecording(true)

      startVolumeMeter(stream)
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
      setMicDenied(denied)
      toast({
        title: denied ? "Izin mikrofon ditolak" : "Mikrofon tidak bisa dipakai",
        description: denied
          ? "Izinkan Mikrofon lewat ikon gembok di bilah alamat, lalu muat ulang halaman."
          : "Pastikan mikrofon tersambung, lalu coba lagi.",
      })
    }
  }

  const startVolumeMeter = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        const level = Math.min(1, rms * 4)
        setVolume((prev) => {
          const next = prev.slice(1)
          next.push(Math.max(0.06, level))
          return next
        })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      // meter nonaktif bukan alasan untuk membatalkan rekaman
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setDuration(0)
    setOverLimit(false)
    setPlaying(false)
    if (playbackRef.current) {
      playbackRef.current.pause()
      playbackRef.current.currentTime = 0
    }
  }

  const togglePlayback = () => {
    const el = playbackRef.current
    if (!el || !audioBlob) return
    if (!el.src) el.src = URL.createObjectURL(audioBlob)
    if (el.paused) {
      void el.play()
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
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
        audio: audioBlob,
      })

      router.push(`/processing?id=${materialId}`)
    } catch (e) {
      toast({
        title: "Gagal menyimpan rekaman",
        description: e instanceof Error ? "Penyimpanan browser penuh atau terkunci. Kosongkan penyimpanan lalu coba lagi." : "Coba lagi.",
      })
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
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground" aria-label="Kembali ke beranda">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Rekam Langsung</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Rekaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul materi (opsional)"
            />

            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold tabular-nums">{formatDuration(duration)}</div>

              <div className="flex h-12 items-end justify-center gap-1" aria-hidden="true">
                {volume.map((v, i) => (
                  <span
                    key={i}
                    className={cn("w-1.5 rounded-full transition-[height] duration-75", recording ? "bg-primary" : "bg-border")}
                    style={{ height: `${Math.round(v * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {recording ? "Merekam. Bicara dengan volume normal." : audioBlob ? "Rekaman selesai." : "Mikrofon siap dipakai."}
              </p>

              <div className="text-sm text-muted-foreground">
                {audioBlob ? `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB` : "Belum ada rekaman"}
              </div>
            </div>

            {overLimit && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Rekaman melewati 20 MB. Provider menolak file di atas 25 MB, jadi potong atau rekam ulang sekarang.</span>
              </div>
            )}

            {micDenied && !recording && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                <MicOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Izin mikrofon ditolak browser. Klik ikon gembok di bilah alamat, beri izin &quot;Mikrofon&quot; untuk halaman ini, lalu muat ulang.</span>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              {!recording && !audioBlob && (
                <Button size="lg" onClick={startRecording}>
                  <Mic className="h-5 w-5" />
                  Rekam
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
                  <Button variant="outline" onClick={togglePlayback}>
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    {playing ? "Jeda" : "Putar Ulang"}
                  </Button>
                  <Button onClick={saveRecording} disabled={processing}>
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Pakai Rekaman Ini
                  </Button>
                  <Button variant="outline" onClick={discardRecording}>
                    <Trash2 className="h-5 w-5" />
                    Hapus
                  </Button>
                </>
              )}
            </div>

            <audio ref={playbackRef} onEnded={() => setPlaying(false)} className="hidden" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
