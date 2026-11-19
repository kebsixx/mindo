"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Mic, Upload, Trash2, Loader2, Pencil, Check, X, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import SiteHeader from "@/components/site-header";
import DemoShowcase from "@/components/demo-showcase";
import { Mascot } from "@/components/mascot";
import { useToast } from "@/components/ui/use-toast";
import { openDB, type Material } from "@/lib/db";
import { useStoredApiKey, useStoredProvider } from "@/lib/storage/settings";
import ProviderKeyList from "@/components/provider-key-list";
import { PROVIDERS } from "@/lib/ai/providers";
import { humanError } from "@/lib/ai/errors";
import { mergeMaterials } from "@/lib/sources";
import { cn } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = "audio/*,video/mp4";
const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac",
  mp4: "video/mp4",
};

const STEPS = [
  {
    title: "Siapkan rekaman.",
    body: "Pilih file audio atau video (MP4) hingga 25 MB, atau rekam langsung lewat mikrofon browser.",
  },
  {
    title: "Provider pilihan Anda yang memproses.",
    body: "Audio dikirim ke provider transkripsi pilihan Anda (Groq atau OpenAI), lalu teksnya diolah menjadi transkrip lengkap, ringkasan terstruktur, peta konsep (mindmap), dan kartu latihan (flashcard). Tidak lewat server perantara.",
  },
  {
    title: "Belajar interaktif dan simpan mandiri.",
    body: "Buka hasil kapan saja dari Riwayat, tanyakan materi ke Tutor AI, atau ekspor bahan ajar ke Markdown atau arsip ZIP untuk pindah perangkat tanpa akun.",
  },
];

const FAQS = [
  {
    q: "Apakah Mindo gratis atau berbayar?",
    a: "Mindo 100% gratis digunakan. Anda hanya membayar biaya penggunaan API langsung ke provider AI yang Anda pilih (seperti OpenAI atau Groq). Banyak provider menyediakan kuota gratis yang cukup untuk kebutuhan belajar harian.",
  },
  {
    q: "Bagaimana jika saya tidak punya kartu kredit untuk API key?",
    a: "Anda bisa memilih provider dengan tier gratis tanpa kartu kredit (seperti Groq) atau menjalankan model AI lokal di laptop sendiri memakai Ollama tanpa biaya sama sekali.",
  },
  {
    q: "Kenapa riwayat materi tidak otomatis muncul di perangkat lain?",
    a: "Mindo tidak memakai sistem akun atau server pusat. Seluruh audio, teks, dan flashcard tersimpan di IndexedDB browser perangkat Anda. Untuk memindahkannya, gunakan menu Ekspor di Pengaturan lalu Impor di perangkat baru.",
  },
  {
    q: "Apakah API key dan rekaman saya aman?",
    a: "Sangat aman. API key dan file Anda tidak pernah dikirim ke server Mindo. Panggilan transkripsi dan ringkasan dikirim langsung dari browser Anda ke endpoint resmi provider AI pilihan Anda.",
  },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BerandaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const stt = useStoredProvider("stt");
  const llm = useStoredProvider("llm");
  const sttKey = useStoredApiKey(stt);
  const llmKey = useStoredApiKey(llm);
  const sttInfo = PROVIDERS[stt];
  const llmInfo = PROVIDERS[llm];
  const canTranscribe = Boolean(sttInfo.stt);
  const sttReady = sttInfo.keyless || Boolean(sttKey.trim());
  const llmReady = llmInfo.keyless || Boolean(llmKey.trim());
  const [saving, setSaving] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("");
  const [mergeError, setMergeError] = useState("");
  const [merging, setMerging] = useState(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const loadMaterials = useCallback(async () => {
    const db = openDB();
    return db.materials.orderBy("createdAt").reverse().toArray();
  }, []);

  function pickFile(picked: File | null) {
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      toast({
        title: "File terlalu besar",
        description:
          "Maksimal 25 MB. Rekam langsung atau kompres dulu.",
      });
      return;
    }
    // Safari kadang memberi MIME kosong untuk mp3. Whisper butuh tipe yang jelas.
    if (!picked.type) {
      const ext = picked.name.split(".").pop()?.toLowerCase() ?? "";
      const type = AUDIO_TYPES[ext];
      if (type) {
        setFile(new File([picked], picked.name, { type }));
        return;
      }
    }
    setFile(picked);
  }

  useEffect(() => {
    loadMaterials()
      .then((rows) => setMaterials(rows))
      .catch(() =>
        toast({
          title: "Gagal membaca riwayat",
          description: "Muat ulang halaman untuk mencoba lagi.",
        }),
      )
      .finally(() => setLoading(false));
  }, [loadMaterials, toast]);

  async function loadSample() {
    setSampleLoading(true);
    try {
      const res = await fetch("/demo.mp3");
      if (!res.ok) throw new Error(String(res.status));
      pickFile(
        new File([await res.blob()], "demo.mp3", { type: "audio/mpeg" }),
      );
    } catch {
      toast({
        title: "Rekaman contoh gagal dimuat",
        description: "Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setSampleLoading(false);
    }
  }

  async function handleStart() {
    if (!file || !canTranscribe || !sttReady || !llmReady) return;
    setSaving(true);
    try {
      const db = openDB();
      const createdAt = new Date().toISOString();
      const materialId = await db.transaction(
        "rw",
        db.materials,
        db.sources,
        async () => {
          const id = await db.materials.add({
            title: file.name,
            createdAt,
            duration: 0,
            status: "pending",
            fileName: file.name,
            fileSize: file.size,
          });
          await db.sources.add({
            materialId: id,
            order: 0,
            fileName: file.name,
            fileSize: file.size,
            duration: 0,
            offset: 0,
            status: "pending",
            audio: file,
            createdAt,
          });
          return id;
        },
      );
      router.push(`/processing?id=${materialId}`);
    } catch {
      toast({
        title: "Gagal menyiapkan materi",
        description:
          "Penyimpanan browser menolak data baru. Kosongkan penyimpanan lalu coba lagi.",
      });
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const db = openDB();
    await db.materials.delete(id);
    await db.sources.where("materialId").equals(id).delete();
    await db.transcripts.delete(id);
    await db.summaries.delete(id);
    await db.mindmaps.delete(id);
    await db.flashcards.where("materialId").equals(id).delete();
    await db.chunks.where("materialId").equals(id).delete();
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setSelected((prev) => prev.filter((value) => value !== id));
    setDeleteTarget(null);
  }

  function toggleMergeMode() {
    setMergeMode((value) => !value);
    setSelected([]);
    setMergeError("");
  }

  function toggleSelected(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function openMergeDialog() {
    if (selected.length < 2) return;
    setMergeError("");
    setMergeTitle(`Gabungan ${selected.length} rekaman`);
    setMergeOpen(true);
  }

  async function handleMerge() {
    if (merging || selected.length < 2) return;
    // Riwayat tersusun dari yang terbaru. Gabungan mengikuti urutan rekaman
    // terlama lebih dulu supaya bagian 1 benar-benar bagian awal.
    const ordered = [...materials]
      .reverse()
      .filter((material) => material.id !== undefined && selected.includes(material.id))
      .map((material) => material.id!);
    setMerging(true);
    setMergeError("");
    try {
      const result = await mergeMaterials(ordered, mergeTitle);
      setMerging(false);
      setMergeOpen(false);
      setMergeMode(false);
      setSelected([]);
      router.push(`/processing?id=${result.materialId}`);
    } catch (e) {
      setMergeError(humanError(e));
      setMerging(false);
    }
  }

  function startRename(id: number, currentTitle: string) {
    setEditingId(id);
    setEditingTitle(currentTitle);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveRename(id: number) {
    const current = editInputRef.current?.value ?? editingTitle;
    const trimmed = current.trim();
    if (!trimmed) {
      cancelRename();
      return;
    }
    try {
      await openDB().materials.update(id, { title: trimmed });
      setMaterials((rows) =>
        rows.map((m) => (m.id === id ? { ...m, title: trimmed } : m)),
      );
      cancelRename();
    } catch {
      toast({
        title: "Gagal menyimpan nama",
        description: "Terjadi kesalahan saat memperbarui nama materi.",
      });
    }
  }

  function handleRenameKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    id: number,
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveRename(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  }

  const ready = Boolean(file) && canTranscribe && sttReady && llmReady;
  const reason = !file
    ? "Pilih file atau rekam dulu."
    : !canTranscribe
      ? `${sttInfo.label} belum mendukung transkripsi audio. Pilih Groq atau OpenAI di Pengaturan.`
      : !sttReady
        ? sttInfo.keyless
          ? "Provider transkripsi berjalan di komputer ini tanpa key."
          : `Tempel API key ${sttInfo.label} untuk transkripsi.`
        : !llmReady
          ? llmInfo.keyless
            ? "Provider ringkasan berjalan di komputer ini tanpa key."
            : `Tempel API key ${llmInfo.label} untuk ringkasan.`
          : null;
  const hasHistory = !loading && materials.length > 0;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader showHistory={hasHistory} />

      <main className="w-full flex-1">
        <section className="mx-auto w-full max-w-280 px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-14">
          <div className="flex items-end gap-6 lg:items-center">
            <h1 className="max-w-[13ch] text-balance text-[clamp(2.75rem,7.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
              Tiga bahan ajar dari satu rekaman.
            </h1>
            <div className="hidden shrink-0 lg:block">
              <Mascot
                directions="/mascots/mindo-directions.webp"
                reactions="/mascots/mindo-reactions.webp"
                label="maskot Mindo"
                size={132}
              />
            </div>
          </div>

          <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start lg:gap-16">
            <div className="max-w-[46ch] lg:pt-2">
              <p className="text-[1.0625rem] leading-[1.55] sm:text-[1.125rem]">
                Ubah rekaman kuliah jadi ringkasan, mindmap, dan flashcard.
                Tanpa akun, hasilnya tersimpan di browser Anda.
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                mp3, m4a, wav, webm, mp4 &middot; maksimal 25 MB
              </p>
              <div className="mt-10 lg:hidden">
                <Mascot
                  directions="/mascots/mindo-directions.webp"
                  reactions="/mascots/mindo-reactions.webp"
                  label="maskot Mindo"
                  size={132}
                />
              </div>
            </div>

            <div className="rounded-[28px] bg-secondary p-2.5 sm:p-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`flex min-h-37 flex-col items-start justify-center gap-3 rounded-[22px] border-2 border-dashed bg-card px-5 py-6 transition-colors ${
                  dragging
                    ? "border-primary bg-primary/12"
                    : "border-foreground/20"
                }`}
              >
                {file ? (
                  <>
                    <p className="w-full truncate text-lg font-medium">
                      {file.name}
                    </p>
                    <p className="text-[0.9375rem] tabular-nums text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Ganti file
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-[1.0625rem] font-medium">
                      Seret file rekaman ke sini
                    </p>
                    <p className="text-[0.9375rem] text-muted-foreground">
                      atau pilih dari perangkat
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => fileInput.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Pilih file
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/recording")}
                      >
                        <Mic className="h-4 w-4" />
                        Rekam
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={loadSample}
                      disabled={sampleLoading}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-[0.875rem] text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground disabled:no-underline"
                    >
                      {sampleLoading && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Coba dulu dengan rekaman contoh (47 detik)
                    </button>
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
                <ProviderKeyList />
              </div>

              {file && canTranscribe && !ready ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="mt-4 w-full font-semibold"
                >
                  <Link href="/settings">Isi API key untuk mulai</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="mt-4 w-full font-semibold text-foreground"
                  disabled={!ready || saving}
                  onClick={handleStart}
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Mulai Proses
                </Button>
              )}
              <p
                aria-live="polite"
                className="mt-3 px-2.5 text-center text-[0.875rem] text-muted-foreground"
              >
                {reason ?? "Siap diproses."}
              </p>
            </div>
          </div>
        </section>

        {hasHistory && (
          <section
            id="riwayat"
            className="mx-auto w-full max-w-280 scroll-mt-8 px-5 pb-14 sm:px-8 sm:pb-20"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
              <div>
                <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
                  Riwayat
                </h2>
                {materials.length > 1 && (
                  <div className="mt-4 flex flex-col items-start gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleMergeMode}
                      aria-pressed={mergeMode}
                    >
                      <Combine className="h-4 w-4" />
                      {mergeMode ? "Batal gabung" : "Gabungkan rekaman"}
                    </Button>
                    {materials.length > 3 && (
                      <button
                        type="button"
                        className="min-h-9 text-[0.9375rem] text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
                        onClick={() => setShowAll((v) => !v)}
                      >
                        {showAll
                          ? "Tampilkan lebih sedikit"
                          : `Lihat semua (${materials.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
              <ul className="space-y-2">
                {(showAll ? materials : materials.slice(0, 3)).map((m) => (
                  <li
                    key={m.id}
                    className="flex min-h-16 items-center gap-4 rounded-2xl bg-secondary px-5 py-3 sm:px-6"
                  >
                    {mergeMode && editingId !== m.id && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected.includes(m.id!)}
                        aria-label={`Pilih ${m.title}`}
                        onClick={() => toggleSelected(m.id!)}
                        className={cn(
                          "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                          selected.includes(m.id!)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-card hover:border-foreground/60",
                        )}
                      >
                        {selected.includes(m.id!) && <Check className="h-4 w-4" />}
                      </button>
                    )}
                    {editingId === m.id ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => handleRenameKeyDown(e, m.id!)}
                          className="w-full rounded-lg border border-foreground/30 bg-card px-2.5 py-1 text-[0.9375rem] font-medium text-foreground outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20"
                          maxLength={100}
                          aria-label="Ubah nama materi"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void saveRename(m.id!)}
                          aria-label="Simpan nama"
                          className="h-8 w-8 shrink-0 text-foreground"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelRename}
                          aria-label="Batal ubah"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : mergeMode ? (
                      <button
                        type="button"
                        onClick={() => toggleSelected(m.id!)}
                        aria-pressed={selected.includes(m.id!)}
                        className="min-w-0 flex-1 cursor-pointer py-0.5 text-left hover:text-muted-foreground"
                      >
                        <span className="block truncate text-[1.0625rem] font-medium">
                          {m.title}
                        </span>
                        <span className="mt-0.5 block text-[0.875rem] text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/material?id=${m.id}`}
                          className="min-w-0 flex-1 py-0.5 hover:text-muted-foreground"
                        >
                          <span className="block truncate text-[1.0625rem] font-medium">
                            {m.title}
                          </span>
                          <span className="mt-0.5 block text-[0.875rem] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                          <span className="mr-2 text-[0.875rem] tabular-nums text-muted-foreground">
                            {formatDuration(m.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Ubah nama ${m.title}`}
                            title="Ubah nama"
                            onClick={() => startRename(m.id!, m.title)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Hapus ${m.title}`}
                            title="Hapus materi"
                            onClick={() =>
                              setDeleteTarget({ id: m.id!, title: m.title })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {mergeMode && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
                  <p className="text-[0.9375rem] text-muted-foreground">
                    {selected.length === 0
                      ? "Pilih minimal dua rekaman."
                      : `${selected.length} rekaman dipilih.`}
                  </p>
                  <Button
                    onClick={openMergeDialog}
                    disabled={selected.length < 2}
                  >
                    <Combine className="h-4 w-4" />
                    Gabungkan{selected.length > 0 ? ` ${selected.length}` : ""}
                  </Button>
                </div>
              )}
              </div>
            </div>
          </section>
        )}

        <section
          id="contoh"
          className="mx-auto w-full max-w-280 scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
              Lihat hasilnya dulu
            </h2>
            <Link
              href="/demo"
              className="text-[0.9375rem] text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
            >
              Buka demo lengkap
            </Link>
          </div>
          <p className="mt-3 max-w-[52ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            Ini hasil dari satu rekaman berita berdurasi 47 detik. Untuk
            melihatnya, Anda belum perlu API key.
          </p>
          <div className="mt-8">
            <DemoShowcase />
          </div>
        </section>

        <section id="cara-kerja" className="w-full scroll-mt-8 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-280 px-5 sm:px-8">
            <div className="rounded-[28px] bg-secondary px-6 py-10 sm:px-12 sm:py-14">
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
                Cara kerja
              </h2>
              <ol className="mt-8 space-y-6 sm:mt-10">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="grid gap-1.5 rounded-2xl bg-card p-5 sm:grid-cols-[15rem_minmax(0,42ch)] sm:gap-8 sm:p-6"
                  >
                    <p className="text-[clamp(1.25rem,2vw,1.5rem)] font-semibold leading-[1.2] tracking-[-0.02em]">
                      <span className="mr-2 text-muted-foreground tabular-nums">
                        {i + 1}.
                      </span>
                      {step.title}
                    </p>
                    <p className="text-[1.0625rem] leading-[1.55]">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          id="privasi"
          className="mx-auto w-full max-w-280 scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
              Privasi
            </h2>
            <div className="max-w-[62ch] space-y-4 text-[1.0625rem] leading-[1.6]">
              <p>
                Rekaman, transkrip, dan seluruh hasil tersimpan di IndexedDB
                browser Anda. Tidak ada server Mindo yang menyimpan data rekaman:
                hosting hanya menyajikan file statis aplikasi.
              </p>
              <p>
                Kunci API (API key) tersimpan langsung di browser Anda dengan opsi
                permanen atau hanya selama tab aktif. Panggilan AI berjalan langsung
                dari perangkat ke penyedia resmi (Groq, OpenAI, Google, OpenRouter,
                atau Ollama lokal) tanpa server perantara.
              </p>
              <p>
                Anda memegang kendali penuh atas data: semua materi bisa diekspor
                ke arsip zip untuk pindah perangkat, atau dihapus bersih kapan saja lewat menu{" "}
                <Link
                  href="/settings"
                  className="underline decoration-1 underline-offset-4 hover:text-muted-foreground"
                >
                  Pengaturan
                </Link>
                .
              </p>
              <p className="text-muted-foreground">
                Untuk mengukur kecepatan halaman, hosting memakai Vercel
                Analytics dan Speed Insights. Keduanya mencatat kunjungan dan
                metrik performa tanpa cookie iklan, tanpa profil, dan tanpa isi
                rekaman Anda.
              </p>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto w-full max-w-280 scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <div>
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
                Pertanyaan umum
              </h2>
              <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                Ketahui cara kerja model Bring Your Own Key dan privasi data di Mindo.
              </p>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-[28px] border border-border bg-card p-5 transition-colors sm:p-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <span className="text-[1.0625rem] leading-snug">
                      {faq.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3.5 text-[0.9375rem] leading-[1.6] text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-280 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mindo.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-[1rem] font-bold tracking-tight text-foreground">
                MINDO
              </span>
              <span className="text-[0.875rem] text-muted-foreground">
                1 Rekaman, 3 Bahan Ajar
              </span>
            </div>
            <nav
              aria-label="Navigasi footer"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.875rem] text-muted-foreground"
            >
              <a
                href="#contoh"
                className="transition-colors hover:text-foreground"
              >
                Contoh
              </a>
              {hasHistory && (
                <a
                  href="#riwayat"
                  className="transition-colors hover:text-foreground"
                >
                  Riwayat
                </a>
              )}
              <a
                href="#cara-kerja"
                className="transition-colors hover:text-foreground"
              >
                Cara kerja
              </a>
              <a
                href="#privasi"
                className="transition-colors hover:text-foreground"
              >
                Privasi
              </a>
              <a
                href="#faq"
                className="transition-colors hover:text-foreground"
              >
                FAQ
              </a>
              <Link
                href="/settings"
                className="transition-colors hover:text-foreground"
              >
                Pengaturan
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-6 text-[0.8125rem] text-muted-foreground">
            <p>
              Semua data rekaman & API key tersimpan di browser Anda. Tidak ada data yang dikirim ke server Mindo.
            </p>
            <p className="tabular-nums">
              {new Date().getFullYear()} Mindo
            </p>
          </div>
        </div>
      </footer>

      <Dialog
        open={mergeOpen}
        onOpenChange={(open) => {
          if (!open && !merging) {
            setMergeOpen(false);
            setMergeError("");
          }
        }}
      >
        <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md">
          <DialogTitle className="text-xl leading-[1.25]">
            Gabungkan rekaman
          </DialogTitle>
          <DialogDescription className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {selected.length} rekaman menjadi satu materi baru, berurutan dari
            rekaman terlama.
          </DialogDescription>

          <label
            htmlFor="merge-title"
            className="mt-5 block text-[0.9375rem] font-medium"
          >
            Judul materi baru
          </label>
          <Input
            id="merge-title"
            value={mergeTitle}
            onChange={(e) => setMergeTitle(e.target.value)}
            maxLength={100}
            className="mt-2"
            autoFocus
          />

          <div className="mt-4 space-y-2 text-[0.875rem] leading-snug text-muted-foreground">
            <p>
              Transkrip lama dipakai ulang, jadi tidak ada transkripsi baru.
              Kuota penyedia terpakai untuk membuat ringkasan, mindmap, dan
              flashcard dari teks gabungan.
            </p>
            <p>Materi asli tetap utuh dan tidak diubah.</p>
          </div>

          {mergeError && (
            <p role="alert" className="mt-3 text-[0.9375rem] leading-snug text-destructive">
              {mergeError}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setMergeOpen(false);
                setMergeError("");
              }}
              disabled={merging}
            >
              Batal
            </Button>
            <Button
              onClick={() => void handleMerge()}
              disabled={merging || !mergeTitle.trim()}
            >
              {merging ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Combine className="h-4 w-4" aria-hidden="true" />
              )}
              {merging ? "Menggabungkan..." : "Gabungkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md">
          <DialogTitle className="text-xl">Hapus materi ini?</DialogTitle>
          <DialogDescription className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Materi <strong className="font-medium text-foreground">{deleteTarget?.title}</strong> beserta rekaman, transkrip, ringkasan, mindmap, dan flashcard akan dihapus permanen dari browser ini.
          </DialogDescription>
          <p className="mt-3 text-[0.875rem] leading-snug text-muted-foreground">
            Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void handleDelete(deleteTarget.id);
              }}
            >
              Hapus materi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
