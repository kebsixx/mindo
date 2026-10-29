"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, Upload, Trash2, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SiteHeader from "@/components/site-header"
import { useToast } from "@/components/ui/use-toast"
import { openDB, type Material } from "@/lib/db"
import { setApiKey, useStoredApiKey } from "@/lib/storage/settings"

const MAX_BYTES = 25 * 1024 * 1024
const ACCEPT = "audio/*,video/mp4"

const STEPS = [
  {
    title: "Taruh rekaman.",
    body: "Pilih file audio sampai 25 MB atau rekam langsung dari browser, lalu tempel API key Groq atau OpenAI sekali.",
  },
  {
    title: "Proses di perangkat Anda.",
    body: "Transkrip, ringkasan, mindmap, dan flashcard dibuat oleh provider pilihan Anda, langsung dari browser.",
  },
  {
    title: "Hasil tersimpan lokal.",
    body: "Semua hasil bisa dibuka lagi kapan saja dari Riwayat, tanpa akun dan tanpa unggah ulang.",
  },
]

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
  const storedKey = useStoredApiKey()
  const [keyDraft, setKeyDraft] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const apiKey = keyDraft ?? storedKey
  const hasStoredKey = Boolean(storedKey)
  const [editingDraft, setEditingDraft] = useState<boolean | null>(null)
  const editingKey = editingDraft ?? !hasStoredKey
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const loadMaterials = useCallback(async () => {
    const db = openDB()
    return db.materials.orderBy("createdAt").reverse().toArray()
  }, [])

  useEffect(() => {
    loadMaterials()
      .then((rows) => setMaterials(rows))
      .catch(() =>
        toast({
          title: "Gagal membaca riwayat",
          description: "Muat ulang halaman untuk mencoba lagi.",
        })
      )
      .finally(() => setLoading(false))
  }, [loadMaterials, toast])

  function persistKey() {
    const trimmed = apiKey.trim()
    setApiKey(trimmed)
    setKeyDraft(trimmed)
    if (trimmed) setEditingDraft(false)
  }

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
      const trimmed = apiKey.trim()
      setApiKey(trimmed)
      setKeyDraft(trimmed)
      const db = openDB()
      const materialId = await db.materials.add({
        title: file.name,
        createdAt: new Date().toISOString(),
        duration: 0,
        status: "pending",
        fileName: file.name,
        fileSize: file.size,
        audio: file,
      })
      router.push(`/processing?id=${materialId}`)
    } catch {
      toast({
        title: "Gagal menyiapkan materi",
        description: "Penyimpanan browser menolak data baru. Kosongkan penyimpanan lalu coba lagi.",
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
  const reason = !file ? "Pilih atau rekam satu file dulu." : !apiKey.trim() ? "Paste API key Groq atau OpenAI." : null

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />

      <main className="w-full flex-1">
        <section className="mx-auto w-full max-w-[1120px] px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-14">
          <h1 className="max-w-[13ch] text-balance text-[clamp(2.75rem,7.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Tiga bahan ajar dari satu rekaman.
          </h1>

          <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start lg:gap-16">
            <div className="max-w-[46ch] lg:pt-2">
              <p className="text-[1.0625rem] leading-[1.55] sm:text-[1.125rem]">
                Ubah rekaman kuliah jadi ringkasan, mindmap, dan flashcard. Diproses di perangkat Anda, tanpa akun.
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                mp3, m4a, wav, webm, mp4 &middot; maksimal 25 MB
              </p>
            </div>

            <div className="rounded-[28px] bg-secondary p-2.5 sm:p-3">
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
                className={`flex min-h-[148px] flex-col items-start justify-center gap-3 rounded-[22px] bg-card px-5 py-6 transition-colors ${
                  dragging ? "bg-primary/25" : ""
                }`}
              >
                {file ? (
                  <>
                    <p className="w-full truncate text-lg font-medium">{file.name}</p>
                    <p className="text-[0.9375rem] tabular-nums text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                      Ganti file
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-[1.0625rem] font-medium">Taruh rekaman di sini</p>
                    <p className="text-[0.9375rem] text-muted-foreground">Seret dari file manager, atau:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => fileInput.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Pilih file
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/recording")}>
                        <Mic className="h-4 w-4" />
                        Rekam langsung
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

              <div className="px-2.5 pb-1 pt-5">
                <label htmlFor={editingKey ? "api-key" : "api-key-status"} className="text-[0.9375rem] font-medium">
                  API Key
                </label>
                {editingKey ? (
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="api-key"
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      onBlur={persistKey}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          persistKey()
                        }
                      }}
                      placeholder="Paste API key Groq atau OpenAI"
                      autoComplete="off"
                      spellCheck={false}
                      aria-describedby="api-key-hint"
                      className="h-11 rounded-full bg-card px-4 text-base"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={showKey ? "Sembunyikan API key" : "Lihat API key"}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowKey((v) => !v)}
                      className="shrink-0"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex h-11 items-center justify-between gap-2 rounded-full bg-card pl-4 pr-1.5">
                    <span id="api-key-status" className="flex items-center gap-2 text-[0.9375rem]">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      API Key aktif
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Ganti API key"
                      onClick={() => {
                        setKeyDraft(storedKey)
                        setEditingDraft(true)
                      }}
                    >
                      Ganti
                    </Button>
                  </div>
                )}
                <p id="api-key-hint" className="mt-2 text-[0.8125rem] leading-snug text-muted-foreground">
                  Kunci hanya dikirim ke provider yang Anda pilih, disimpan di browser ini.
                </p>
              </div>

              <Button
                size="lg"
                className="mt-4 w-full font-semibold text-foreground disabled:bg-primary disabled:text-foreground disabled:opacity-100"
                disabled={!ready || saving}
                onClick={handleStart}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Mulai Proses
              </Button>
              {reason ? (
                <p aria-live="polite" className="mt-3 px-2.5 text-center text-[0.875rem] text-muted-foreground">
                  {reason}
                </p>
              ) : (
                <p aria-live="polite" className="mt-3 px-2.5 text-center text-[0.875rem] text-muted-foreground">
                  Siap diproses.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="riwayat" className="mx-auto w-full max-w-[1120px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <div>
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">Riwayat</h2>
              {materials.length > 3 && (
                <button
                  type="button"
                  className="mt-4 text-[0.9375rem] text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? "Tampilkan lebih sedikit" : "Lihat semua"}
                </button>
              )}
            </div>

            <div>
              {loading ? (
                <div className="space-y-2" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <p className="max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
                  Belum ada materi. Rekaman pertama Anda akan muncul di sini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(showAll ? materials : materials.slice(0, 3)).map((m) => (
                    <li
                      key={m.id}
                      className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-secondary px-4 py-1"
                    >
                      <Link
                        href={`/material?id=${m.id}`}
                        className="min-w-0 flex-1 py-3 hover:text-muted-foreground"
                      >
                        <span className="block truncate text-[1.0625rem] font-medium">{m.title}</span>
                        <span className="mt-0.5 block text-[0.875rem] text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </Link>
                      <span className="text-[0.875rem] tabular-nums text-muted-foreground">
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
          </div>
        </section>

        <section id="cara-kerja" className="w-full scroll-mt-8 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
            <div className="rounded-[28px] bg-secondary px-6 py-10 sm:px-12 sm:py-14">
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">Cara kerja</h2>
              <ol className="mt-8 space-y-6 sm:mt-10">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="grid gap-1.5 rounded-2xl bg-card p-5 sm:grid-cols-[15rem_minmax(0,42ch)] sm:gap-8 sm:p-6"
                  >
                    <p className="text-[clamp(1.25rem,2vw,1.5rem)] font-semibold leading-[1.2] tracking-[-0.02em]">
                      <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="text-[1.0625rem] leading-[1.55]">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="privasi" className="mx-auto w-full max-w-[1120px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em]">Privasi</h2>
            <div className="max-w-[62ch] space-y-4 text-[1.0625rem] leading-[1.6]">
              <p>
                Rekaman, transkrip, dan seluruh hasil tersimpan di IndexedDB browser Anda. Tidak ada server Mindo yang
                menyimpan data: hosting hanya menyajikan file statis.
              </p>
              <p>
                API key hanya dikirim langsung ke provider yang Anda pilih, tidak pernah ke domain lain. Semua ini bisa
                Anda hapus sendiri lewat menu{" "}
                <Link href="/settings" className="underline decoration-1 underline-offset-4 hover:text-muted-foreground">
                  Pengaturan
                </Link>
                .
              </p>
              <p className="text-muted-foreground">
                Untuk mengukur kecepatan halaman, hosting memakai Vercel Analytics dan Speed Insights. Keduanya mencatat
                kunjungan dan metrik performa tanpa cookie iklan, tanpa profil, dan tanpa isi rekaman Anda.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
