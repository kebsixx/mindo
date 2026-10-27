"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, Upload, Trash2, Loader2, KeyRound, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { openDB, type Material } from "@/lib/db"
import { getApiKey, setApiKey } from "@/lib/storage/settings"

const MAX_BYTES = 25 * 1024 * 1024
const ACCEPT = "audio/*,video/mp4"

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function BerandaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [apiKey, setKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadMaterials = useCallback(async () => {
    try {
      const db = openDB()
      const rows = await db.materials.orderBy("createdAt").reverse().limit(3).toArray()
      setMaterials(rows)
    } catch (e) {
      toast({
        title: "Gagal membaca riwayat",
        description: e instanceof Error ? e.message : "Coba muat ulang halaman.",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    setKey(getApiKey())
    loadMaterials()
  }, [loadMaterials])

  function pickFile(picked: File | null) {
    if (!picked) return
    if (picked.size > MAX_BYTES) {
      toast({
        title: "File terlalu besar",
        description: "Maksimal 25 MB. Rekam langsung atau kompres dulu.",
      })
      return
    }
    setFile(picked)
  }

  async function handleStart() {
    if (!file || !apiKey.trim()) return
    setSaving(true)
    try {
      setApiKey(apiKey.trim())
      const db = openDB()
      const materialId = await db.materials.add({
        title: file.name,
        createdAt: new Date().toISOString(),
        duration: 0,
        status: "pending",
        fileName: file.name,
        fileSize: file.size,
      })
      router.push(`/processing?id=${materialId}`)
    } catch (e) {
      toast({
        title: "Gagal menyiapkan materi",
        description: e instanceof Error ? e.message : "Coba lagi.",
      })
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus materi ini beserta seluruh hasilnya?")) return
    const db = openDB()
    await db.materials.delete(id)
    await db.transcripts.delete(id)
    await db.summaries.delete(id)
    await db.mindmaps.delete(id)
    await db.flashcards.where("materialId").equals(id).delete()
    await db.chunks.where("materialId").equals(id).delete()
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  const ready = Boolean(file && apiKey.trim())
  const reason = !file ? "Pilih atau rekam satu file dulu." : !apiKey.trim() ? "Tempel API key Groq atau OpenAI." : null

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-full w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" aria-hidden="true">
              <path
                d="M2 12h3l2-6 3 12 3-9 2 3h7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xl font-semibold tracking-tight">MINDO</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">
              Cara Kerja
            </a>
            <a href="#privasi" className="transition-colors hover:text-foreground">
              Privasi
            </a>
            <a href="#riwayat" className="transition-colors hover:text-foreground">
              Riwayat
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Penyimpanan Lokal
            </span>
            <Link href="/settings">
              <Button size="sm" variant={apiKey ? "default" : "outline"} className="gap-2">
                <KeyRound className="h-4 w-4" />
                {apiKey ? "API Key Aktif" : "Atur API Key"}
              </Button>
            </Link>
            <Button size="icon" variant="ghost" className="md:hidden" aria-label="Buka menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(420px,520px)] lg:gap-16">
          <section className="lg:pt-8">
            <h1 className="text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Dari suara dosen jadi paham, sekali klik.
            </h1>
            <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
              Ubah rekaman kuliah jadi ringkasan, peta konsep, dan flashcard. Diproses di perangkat Anda, tanpa akun.
            </p>
            <p className="mt-3 font-mono text-[0.8125rem] text-muted-foreground">
              mp3, m4a, wav, webm, mp4 &middot; maks 25 MB
            </p>
          </section>

          <section className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[48px] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(83,241,111,0.35), transparent 60%), radial-gradient(circle at 70% 70%, rgba(64,217,255,0.30), transparent 60%)",
              }}
            />
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_50px_-24px_rgba(17,24,39,0.25)] sm:p-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pickFile(e.dataTransfer.files?.[0] ?? null)
                }}
                className={`flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-6 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                {file ? (
                  <>
                    <p className="max-w-full truncate font-medium">{file.name}</p>
                    <p className="font-mono text-[0.8125rem] text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                      Ganti file
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Taruh file audio di sini</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button variant="outline" onClick={() => fileInput.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Pilih File
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/recording")}>
                        <Mic className="h-4 w-4" />
                        Rekam Langsung
                      </Button>
                    </div>
                  </>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mt-6 space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Tempel API key Groq atau OpenAI"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 rounded-full"
                  />
                  <Button variant="outline" onClick={() => setShowKey((v) => !v)} className="shrink-0">
                    {showKey ? "Sembunyikan" : "Lihat"}
                  </Button>
                </div>
              </div>

              <Button size="lg" className="mt-6 w-full" disabled={!ready || saving} onClick={handleStart}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Mulai Proses
              </Button>
              {reason ? <p className="mt-3 text-center text-sm text-muted-foreground">{reason}</p> : null}
            </div>
          </section>
        </div>

        <section id="riwayat" className="mt-16 sm:mt-24">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Riwayat</h2>
            <a href="#riwayat" className="text-sm text-muted-foreground hover:text-foreground">
              Lihat semua
            </a>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
                Belum ada materi. Rekaman pertama Anda akan muncul di sini.
              </p>
            ) : (
              <ul className="space-y-3">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4"
                  >
                    <Link href={`/material?id=${m.id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{m.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </Link>
                    <span className="font-mono text-[0.8125rem] tabular-nums text-muted-foreground">
                      {formatDuration(m.duration)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${m.title}`}
                      onClick={() => handleDelete(m.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
