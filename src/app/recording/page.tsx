"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Mic, Square, Loader2, Trash2, Save, Play, Pause, AlertTriangle, MicOff } from "lucide-react"
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
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <h1 className="text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">Rekam Langsung</h1>
        <p className="mt-3 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          Rekam langsung dari mikrofon perangkat. Hasilnya langsung diproses setelah Anda tekan Pakai Rekaman Ini.
        </p>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-lg">Status Rekaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul materi (opsional)"
              aria-label="Judul materi"
              className="h-11 rounded-full px-4 text-base"
            />

            <div className="space-y-4 rounded-2xl bg-secondary px-5 py-6 text-center">
              <p className="text-[clamp(2.5rem,7vw,3.5rem)] font-semibold leading-none tabular-nums tracking-[-0.03em]">
                {formatDuration(duration)}
              </p>

              <div className="flex h-12 items-end justify-center gap-1" aria-hidden="true">
                {volume.map((v, i) => (
                  <span
                    key={i}
                    className={cn("w-1.5 rounded-full", recording ? "bg-primary" : "bg-border")}
                    style={{ height: `${Math.round(v * 100)}%` }}
                  />
                ))}
              </div>
              <p className="text-[0.9375rem] text-muted-foreground">
                {recording ? "Merekam. Bicara dengan volume normal." : audioBlob ? "Rekaman selesai." : "Mikrofon siap dipakai."}
              </p>
              <p className="text-[0.9375rem] tabular-nums text-muted-foreground">
                {audioBlob ? `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB` : "Belum ada rekaman"}
              </p>
            </div>

            {overLimit && (
              <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-[0.9375rem] text-destructive" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Rekaman melewati 20 MB. Provider menolak file di atas 25 MB, jadi potong atau rekam ulang sekarang.</span>
              </div>
            )}

            {micDenied && !recording && (
              <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-[0.9375rem] text-destructive" role="alert">
                <MicOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Izin mikrofon ditolak browser. Klik ikon gembok di bilah alamat, beri izin &quot;Mikrofon&quot; untuk halaman ini, lalu muat ulang.</span>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
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

        <p className="mt-4 text-center text-[0.9375rem] text-muted-foreground">
          Atau kembali ke{" "}
          <Link href="/" className="underline decoration-1 underline-offset-4 hover:text-foreground">
            Beranda
          </Link>{" "}
          untuk memilih file.
        </p>
      </main>
    </div>
  )
}
