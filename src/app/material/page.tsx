"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, FileText, MessageCircle, PanelRightClose, AlertCircle, RefreshCw, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatSheet from "@/components/chat-sheet";
import { cn } from "@/lib/utils";
import {
  openDB,
  type Material,
  type Summary,
  type Mindmap,
  type Flashcard,
  type TranscriptSegment,
} from "@/lib/db";
import MarkmapView from "@/components/markmap-view";
import SiteHeader from "@/components/site-header";
import { BackLink } from "@/components/site-header";
import FlashcardSwiper from "@/components/flashcard-swiper";
import TranscriptPanel from "@/components/transcript-panel";
import ExportDialog from "@/components/export-dialog";
import ChatPanel, { type TutorReply } from "@/components/chat-panel";
import { tutor } from "@/lib/ai/agents/tutor";
import { getApiKey, getProvider } from "@/lib/storage/settings";
import { PROVIDERS } from "@/lib/ai/providers";
import { humanError } from "@/lib/ai/errors";
import { runFlashcards, runMindmap, runSummary } from "@/lib/ai/pipeline";

function StageFallback({
  title,
  message,
  hasTranscript,
  materialId,
  retrying,
  busy,
  onRetry,
}: {
  title: string;
  message?: string;
  hasTranscript: boolean;
  materialId: string | null;
  retrying: boolean;
  busy: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            message ? "text-destructive" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[1.0625rem] font-medium">
            {message ? `${title} belum jadi` : `${title} belum dibuat`}
          </p>
          <p className="mt-1 max-w-[52ch] text-[0.9375rem] leading-[1.55] text-muted-foreground">
            {message
              ? "Bagian lain tidak terpengaruh. Kalau percobaan ini berhasil, hasilnya langsung muncul di tab ini."
              : hasTranscript
                ? "Transkrip sudah tersimpan, jadi bagian ini bisa dibuat tanpa mengunggah ulang rekaman."
                : "Transkrip belum ada. Jalankan pemrosesan dulu sebelum membuat bagian ini."}
          </p>
          {message && (
            <p
              role="alert"
              className="mt-2 max-w-[52ch] text-[0.9375rem] leading-snug text-destructive"
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {hasTranscript ? (
        <Button variant="outline" onClick={onRetry} disabled={busy}>
          {retrying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          {retrying ? "Mencoba..." : message ? "Coba lagi" : "Buat sekarang"}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={`/processing?id=${materialId ?? ""}`}>Buka Pemrosesan</Link>
        </Button>
      )}
    </div>
  );
}

export default function MaterialPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh items-center justify-center"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Memuat materi</span>
        </div>
      }
    >
      <MaterialView />
    </Suspense>
  );
}

function MaterialView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const materialId = searchParams.get("id");
  const [material, setMaterial] = useState<Material | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [stageErrors, setStageErrors] = useState<Record<string, string>>({});
  const [retryErrors, setRetryErrors] = useState<Record<string, string>>({});
  const [retrying, setRetrying] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const transcriptView = searchParams.get("view") === "transcript";
  const transcriptText = segments
    .map((segment) => segment.text)
    .join(" ")
    .trim();

  const loadData = async () => {
    const db = openDB();
    const mid = parseInt(materialId!, 10);
    const [mat, sum, mm, cards, trans] = await Promise.all([
      db.materials.get(mid),
      db.summaries.get(mid),
      db.mindmaps.get(mid),
      db.flashcards.where("materialId").equals(mid).toArray(),
      db.transcripts.get(mid),
    ]);
    return { mat, sum, mm, cards, trans };
  };

  const applyData = (data: Awaited<ReturnType<typeof loadData>>) => {
    setMaterial(data.mat || null);
    setSummary(data.sum || null);
    setMindmap(data.mm || null);
    setFlashcards(data.cards);
    setSegments(data.trans?.segments || []);
    setStageErrors(data.mat?.stageErrors || {});
  };

  useEffect(() => {
    if (!materialId) return;
    loadData()
      .then(applyData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  const startEditingTitle = () => {
    setEditedTitle(material?.title || "Materi");
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const saveTitle = async () => {
    if (!materialId || !material) return;
    const current = titleInputRef.current?.value ?? editedTitle;
    const trimmed = current.trim();
    if (!trimmed || trimmed === material.title) {
      cancelEditingTitle();
      return;
    }
    const mid = parseInt(materialId, 10);
    try {
      await openDB().materials.update(mid, { title: trimmed });
      setMaterial({ ...material, title: trimmed });
      setIsEditingTitle(false);
    } catch (err) {
      console.error("[mindo] gagal memperbarui judul materi", err);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditingTitle();
    }
  };

  const retryStage = async (stage: "summarize" | "mindmap" | "flashcard") => {
    if (!materialId || retrying) return;
    const mid = parseInt(materialId, 10);
    const db = openDB();
    const provider = getProvider("llm");
    const apiKey = getApiKey(provider);

    setRetrying(stage);
    setRetryErrors((prev) => {
      const next = { ...prev };
      delete next[stage];
      return next;
    });
    const cleaned = { ...stageErrors };
    delete cleaned[stage];
    setStageErrors(cleaned);
    await db.materials.update(mid, { stageErrors: cleaned });

    try {
      if (!PROVIDERS[provider].keyless && !apiKey.trim()) {
        throw new Error(
          "API key ringkasan belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider.",
        );
      }
      const saved = await db.transcripts.get(mid);
      const text =
        saved?.segments
          .map((segment) => segment.text)
          .join(" ")
          .trim() || transcriptText;
      if (!text) {
        throw new Error(
          "Transkrip belum tersedia. Jalankan ulang tahap Transkrip di halaman Pemrosesan.",
        );
      }
      const title = material?.title || "Materi";
      if (stage === "summarize") {
        await runSummary(mid, provider, apiKey, text);
      } else if (stage === "mindmap") {
        await runMindmap(mid, provider, apiKey, text, title);
      } else {
        await runFlashcards(mid, provider, apiKey, text, title);
      }

      const refreshed = await loadData();
      applyData(refreshed);
      const complete = Boolean(
        refreshed.sum && refreshed.mm && refreshed.cards.length > 0,
      );
      await db.materials.update(mid, {
        status: complete ? "done" : "partial",
        stageErrors: cleaned,
      });
    } catch (e) {
      console.error(`[mindo] coba lagi ${stage} gagal`, e);
      const message = humanError(e);
      const next = { ...stageErrors, [stage]: message };
      setRetryErrors((prev) => ({ ...prev, [stage]: message }));
      setStageErrors(next);
      await db.materials
        .update(mid, { status: "partial", stageErrors: next })
        .catch(() => {});
    } finally {
      setRetrying(null);
    }
  };

  const toggleTranscript = () => {
    router.replace(
      `/material?id=${materialId}${transcriptView ? "" : "&view=transcript"}`,
    );
  };

  const seekAudio = (seconds: number) => {
    const el = audioRef.current;
    if (!el || !material?.audio) return;
    if (!el.src) el.src = URL.createObjectURL(material.audio);
    el.currentTime = seconds;
    void el.play().catch(() => {});
  };

  const handleGrade = async (
    id: number,
    grade: "known" | "repeat" | "unknown",
  ) => {
    try {
      await openDB().flashcards.update(id, { grade });
    } catch {
      // nilai tetap terlihat selama sesi; penyimpanan bisa dicoba lagi
    }
  };

  const askTutor = async (question: string): Promise<TutorReply> => {
    const provider = getProvider("llm");
    const apiKey = getApiKey(provider);
    if (!apiKey && !PROVIDERS[provider].keyless) {
      return {
        text: "API key belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider.",
      };
    }
    const mid = parseInt(materialId!, 10);
    const chunks = await openDB()
      .chunks.where("materialId")
      .equals(mid)
      .toArray();
    if (chunks.length === 0) {
      return {
        text: "Transkrip belum tersedia. Jalankan ulang tahap Transkrip di halaman Pemrosesan.",
      };
    }
    const result = await tutor(provider, apiKey, question, chunks);
    if (!result.found) {
      return { text: "Tidak dibahas dalam rekaman ini.", notFound: true };
    }
    const atSec =
      result.citations.length > 0 ? Math.min(...result.citations) : undefined;
    return { text: result.answer, atSec };
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-label="Memuat materi"
          />
        </div>
      </div>
    );
  }

  const chat = <ChatPanel onSend={askTutor} onSeek={seekAudio} />;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-280 flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-6">
        <BackLink href="/" label="Kembali ke beranda" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {isEditingTitle ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="w-full min-w-[200px] rounded-xl border border-foreground/30 bg-card px-3 py-1.5 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-tight text-foreground outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={100}
                aria-label="Ubah judul materi"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void saveTitle()}
                aria-label="Simpan judul"
                className="h-10 w-10 shrink-0 text-foreground"
              >
                <Check className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelEditingTitle}
                aria-label="Batal ubah judul"
                className="h-10 w-10 shrink-0 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="group flex min-w-0 flex-1 items-center gap-2">
              <h1 className="truncate text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
                {material?.title || "Materi"}
              </h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={startEditingTitle}
                aria-label="Ubah nama materi"
                title="Ubah nama materi"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant={transcriptView ? "default" : "outline"}
            onClick={toggleTranscript}
            aria-pressed={transcriptView}
          >
            <FileText className="h-4 w-4" />
            {transcriptView ? "Kembali ke Materi" : "Transkrip"}
          </Button>
          <ExportDialog materialIds={[Number(materialId)]} />
        </div>

        <p className="mt-2 text-[0.9375rem] text-muted-foreground">
          <Link
            href="/demo"
            className="underline decoration-1 underline-offset-4 hover:text-foreground"
          >
            Bandingkan dengan contoh hasil
          </Link>
        </p>

        <div className="mt-8 flex items-start gap-6">
          <div className="min-w-0 flex-1">
            {transcriptView ? (
              <TranscriptPanel segments={segments} onSeek={seekAudio} />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                  <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
                  <TabsTrigger value="flashcard">Flashcard</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {summary?.title || "Ringkasan"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {summary?.sections.map((section, i) => (
                        <div key={i} className="space-y-2">
                          <h3 className="text-[1.0625rem] font-semibold">
                            {section.heading}
                          </h3>
                          <ul className="max-w-[68ch] list-disc space-y-1 pl-5 text-[1.0625rem] leading-[1.6] text-muted-foreground">
                            {section.points.map((point, j) => (
                              <li key={j}>{point}</li>
                            ))}
                          </ul>
                          {section.keyTerms && section.keyTerms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {section.keyTerms.map((term, k) => (
                                <span
                                  key={k}
                                  className="rounded-full bg-primary/12 px-2.5 py-1 text-[0.8125rem] text-foreground"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {!summary && (
                        <StageFallback
                          title="Ringkasan"
                          message={retryErrors.summarize ?? stageErrors.summarize}
                          hasTranscript={Boolean(transcriptText)}
                          materialId={materialId}
                          retrying={retrying === "summarize"}
                          busy={retrying !== null}
                          onRetry={() => retryStage("summarize")}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="mindmap">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {mindmap?.title || "Mindmap"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mindmap ? (
                        <MarkmapView
                          content={JSON.stringify(mindmap)}
                          className="h-125 w-full"
                        />
                      ) : (
                        <StageFallback
                          title="Mindmap"
                          message={retryErrors.mindmap ?? stageErrors.mindmap}
                          hasTranscript={Boolean(transcriptText)}
                          materialId={materialId}
                          retrying={retrying === "mindmap"}
                          busy={retrying !== null}
                          onRetry={() => retryStage("mindmap")}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="flashcard">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Flashcard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {flashcards.length > 0 ? (
                        <FlashcardSwiper
                          cards={flashcards
                            .filter((c) => c.id !== undefined)
                            .map((c) => ({ ...c, id: c.id as number }))}
                          onGrade={handleGrade}
                        />
                      ) : (
                        <StageFallback
                          title="Flashcard"
                          message={retryErrors.flashcard ?? stageErrors.flashcard}
                          hasTranscript={Boolean(transcriptText)}
                          materialId={materialId}
                          retrying={retrying === "flashcard"}
                          busy={retrying !== null}
                          onRetry={() => retryStage("flashcard")}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {!chatCollapsed && (
            <aside
              className="sticky top-6 hidden w-[480px] shrink-0 lg:block"
              aria-label="Tanya Mindo"
            >
              <Card className="flex h-[clamp(400px,60vh,640px)] flex-col">
                <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Tanya Mindo</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setChatCollapsed(true)}
                    aria-label="Sembunyikan Tanya Mindo"
                    aria-expanded={true}
                    title="Sembunyikan"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">{chat}</CardContent>
              </Card>
            </aside>
          )}

          {chatCollapsed && (
            <div className="sticky top-6 hidden shrink-0 lg:block">
              <Button
                variant="outline"
                onClick={() => setChatCollapsed(false)}
                aria-label="Tampilkan Tanya Mindo"
                aria-expanded={false}
                title="Tampilkan Tanya Mindo"
                className="h-11 rounded-full px-3"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="ml-2 text-[0.875rem]">Tanya Mindo</span>
              </Button>
            </div>
          )}
        </div>
      </main>

      <audio ref={audioRef} className="hidden" />

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        aria-label="Buka Tanya Mindo"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full",
          "bg-accent text-accent-foreground transition-transform hover:scale-105 lg:hidden",
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <ChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        title="Tanya Mindo"
      >
        {chat}
      </ChatSheet>
    </div>
  );
}
