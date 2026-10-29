"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mic, Upload, Trash2, Loader2, Menu, Eye, EyeOff, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import ApiKeyLinkIcon from "@/components/api-key-link-icon"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { openDB, type Material } from "@/lib/db"
import { setApiKey, useStoredApiKey } from "@/lib/storage/settings"

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
  const storedKey = useStoredApiKey()
  const [keyDraft, setKeyDraft] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const apiKey = keyDraft ?? storedKey
  const hasStoredKey = Boolean(storedKey)
  const [editingDraft, setEditingDraft] = useState<boolean | null>(null)
  const editingKey = editingDraft ?? !hasStoredKey
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
      <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-full w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-mindo.png" alt="" width={32} height={32} className="h-8 w-8" />
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
            <Link
              href="/settings"
              className={buttonVariants({ variant: apiKey ? "default" : "outline", size: "sm", className: "gap-2" })}
            >
              <ApiKeyLinkIcon />
              {apiKey ? "API Key Aktif" : "Atur API Key"}
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav className="absolute inset-x-0 top-full border-b border-border bg-card px-5 py-4 md:hidden" aria-label="Menu utama">
            <div className="flex flex-col gap-4 text-sm">
              <a href="#cara-kerja" className="text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                Cara Kerja
              </a>
              <a href="#privasi" className="text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                Privasi
              </a>
              <a href="#riwayat" className="text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                Riwayat
              </a>
              <Link href="/settings" className="text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                Pengaturan
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(420px,520px)] lg:gap-16">
          <section className="lg:pt-8">
            <h1 className="text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              1 rekaman, 3 bahan ajar.
            </h1>
            <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
              Ubah rekaman kuliah jadi ringkasan, mindmap, dan flashcard. Diproses di perangkat Anda, tanpa akun.
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
                    <p className="text-xs text-muted-foreground">
                      Drag &amp; drop ke sini, atau klik Pilih File
                    </p>
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
                <label htmlFor={editingKey ? "api-key" : undefined} className="text-sm font-medium">
                  API Key
                </label>
                {editingKey ? (
                  <div className="flex gap-2">
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
                      className="h-11 rounded-full"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={showKey ? "Sembunyikan API key" : "Lihat API key"}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowKey((v) => !v)}
                      className="shrink-0"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-11 items-center justify-between gap-2 rounded-full border border-border bg-secondary pl-4 pr-1.5">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      API Key aktif
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setKeyDraft(storedKey)
                        setEditingDraft(true)
                      }}
                    >
                      Ganti
                    </Button>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="mt-6 w-full font-semibold text-foreground disabled:bg-primary disabled:text-foreground disabled:opacity-100"
                disabled={!ready || saving}
                onClick={handleStart}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Mulai Proses
              </Button>
              {reason ? <p className="mt-3 text-center text-sm text-muted-foreground">{reason}</p> : null}
            </div>
          </section>
        </div>

        <section id="riwayat" className="mt-16 scroll-mt-[88px] sm:mt-24">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Riwayat</h2>
            {materials.length > 3 && (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Tampilkan lebih sedikit" : "Lihat semua"}
              </button>
            )}
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
                {(showAll ? materials : materials.slice(0, 3)).map((m) => (
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

        <section id="cara-kerja" className="mt-16 scroll-mt-[88px] sm:mt-24">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Cara kerja</h2>
            <ol className="space-y-4 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. Taruh rekaman.</span> Pilih file audio sampai 25 MB
                atau rekam langsung dari browser, lalu tempel API key Groq atau OpenAI sekali.
              </li>
              <li>
                <span className="font-medium text-foreground">2. Proses berjalan di perangkat Anda.</span> Transkrip,
                ringkasan, peta konsep, dan flashcard dibuat oleh provider pilihan Anda, langsung dari browser.
              </li>
              <li>
                <span className="font-medium text-foreground">3. Hasilnya tersimpan lokal.</span> Semua hasil bisa
                dibuka lagi kapan saja dari Riwayat, tanpa akun dan tanpa unggah ulang.
              </li>
            </ol>
          </div>
        </section>

        <section id="privasi" className="mt-16 scroll-mt-[88px] sm:mt-24">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Privasi</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Rekaman, transkrip, dan seluruh hasil tersimpan di IndexedDB browser Anda. Tidak ada server Mindo
                yang menyimpan data: hosting hanya menyajikan file statis.
              </p>
              <p>
                API key hanya dikirim langsung ke provider yang Anda pilih, tidak pernah ke domain lain. Semua ini
                bisa Anda hapus sendiri lewat menu Pengaturan.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
