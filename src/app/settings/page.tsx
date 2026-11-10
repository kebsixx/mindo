"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { openDB } from "@/lib/db";
import { importBundle } from "@/lib/export/import";
import ExportDialog from "@/components/export-dialog";
import { ProviderDetail } from "@/components/provider-detail";
import { ProviderPicker } from "@/components/provider-picker";
import {
  setProvider,
  setApiKey,
  setSaveMode,
  clearAllData,
  useStoredProvider,
  useStoredApiKey,
  useStoredSaveMode,
} from "@/lib/storage/settings";
import {
  PROVIDERS,
  providerIdsFor,
  ROLE_LABELS,
} from "@/lib/ai/providers";
import type { Provider, ProviderRole } from "@/lib/ai/providers";
import SiteHeader, { BackLink } from "@/components/site-header";

export default function SettingsPage() {
  const { toast } = useToast();
  const stt = useStoredProvider("stt");
  const llm = useStoredProvider("llm");
  const saveMode = useStoredSaveMode();
  const [materialIds, setMaterialIds] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const sttInfo = PROVIDERS[stt];
  const needsAnyKey = [stt, llm].some(
    (p) => !PROVIDERS[p].keyless,
  );

  const refreshMaterialIds = () => {
    openDB()
      .materials.toCollection()
      .primaryKeys()
      .then((ids) => setMaterialIds(ids.map((id) => Number(id))))
      .catch(() => setMaterialIds([]));
  };

  useEffect(() => {
    refreshMaterialIds();
  }, []);

  const chooseProvider = (role: ProviderRole, next: Provider) => {
    const current = role === "stt" ? stt : llm;
    if (next === current) return;
    setProvider(role, next);
    toast({
      title: "Provider disimpan",
      description: `${PROVIDERS[next].label} dipakai untuk ${
        role === "stt" ? "transkripsi" : "ringkasan & teks"
      } berikutnya.`,
    });
  };

  const chooseSaveMode = (next: "local" | "session") => {
    setSaveMode(next);
    toast({
      title: next === "local" ? "Key disimpan permanen" : "Key hanya sesi ini",
      description:
        next === "local"
          ? "Key tersimpan di browser dan bertahan ditutup browser."
          : "Key hilang saat tab/browser ditutup, maka harus diisi kembali.",
    });
  };

  const handleClearAll = () => {
    if (confirm("Hapus semua data? Tindakan ini tidak bisa dibatalkan.")) {
      clearAllData();
      toast({
        title: "Data dihapus",
        description: "Semua data berhasil dihapus.",
      });
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const { materials } = await importBundle(file);
      toast({
        title: `${materials} materi diimpor`,
        description: "Buka Riwayat di beranda untuk melihat materinya.",
      });
      refreshMaterialIds();
    } catch (e) {
      toast({
        title: "Impor gagal",
        description:
          e instanceof Error ? e.message : "File tidak bisa dibaca.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />

      <main className="mx-auto w-full max-w-180 flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-6">
        <BackLink label="Kembali" />
        <h1 className="mt-2 text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          Pengaturan
        </h1>
        <p className="mt-3 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          Pilih provider transkripsi dan provider ringkasan, tempel API key,
          lalu uji koneksinya sebelum memproses rekaman.
        </p>

        <div className="mt-10 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pilih Provider AI</CardTitle>
              <CardDescription>
                Transkripsi audio dan ringkasan teks bisa pakai provider
                beda. Tidak ada perpindahan otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-2xl bg-secondary p-4">
                <p className="text-[0.9375rem] font-medium">
                  {ROLE_LABELS.stt.title}
                </p>
                <p className="text-[0.9375rem] leading-[1.55] text-muted-foreground">
                  {ROLE_LABELS.stt.description}
                </p>
                <ProviderPicker
                  role="stt"
                  value={stt}
                  onChange={(next) => chooseProvider("stt", next)}
                />
              </div>

              <div className="space-y-3 rounded-2xl bg-secondary p-4">
                <p className="text-[0.9375rem] font-medium">
                  {ROLE_LABELS.llm.title}
                </p>
                <p className="text-[0.9375rem] leading-[1.55] text-muted-foreground">
                  {ROLE_LABELS.llm.description}
                </p>
                <ProviderPicker
                  role="llm"
                  value={llm}
                  onChange={(next) => chooseProvider("llm", next)}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-2xl bg-secondary p-4">
                  <p className="text-[0.8125rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Provider Transkripsi
                  </p>
                  <ProviderDetail provider={stt} />
                </div>
                <div className="space-y-2 rounded-2xl bg-secondary p-4">
                  <p className="text-[0.8125rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Provider Ringkasan
                  </p>
                  <ProviderDetail provider={llm} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="panduan-api-key" className="scroll-mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Cara mendapatkan API key</CardTitle>
              <CardDescription>
                Panduan singkat untuk setiap provider. Ikuti yang sesuai pilihan
                Anda di atas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {providerIdsFor("stt").map((id) => (
                  <GuideItem key={`stt-${id}`} provider={id} />
                ))}
                {providerIdsFor("llm").map((id) => (
                  <GuideItem key={`llm-${id}`} provider={id} />
                ))}
              </ol>
              <p className="mt-4 text-[0.9375rem] leading-[1.55] text-muted-foreground">
                Halaman ini hanya menautkan ke situs resmi provider. Mindo tidak
                pernah menerima key Anda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Key</CardTitle>
              <CardDescription>
                {needsAnyKey
                  ? stt === llm
                    ? `Masukkan API key ${sttInfo.label}. Key tiap provider disimpan terpisah.`
                    : "Masukkan API key untuk provider transkripsi dan provider ringkasan. Key tiap provider disimpan terpisah."
                  : "Provider transkripsi dan ringkasan Anda berjalan di komputer ini tanpa API key."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsAnyKey && (
                <div className="flex items-start justify-between gap-3 rounded-2xl bg-secondary p-4">
                  <div className="min-w-0">
                    <div className="text-[0.9375rem] font-medium">
                      Simpan di browser ini
                    </div>
                    <div className="mt-0.5 text-[0.875rem] leading-snug text-muted-foreground">
                      {saveMode === "local"
                        ? "Disimpan permanen di browser ini dan bertahan sampai key dihapus. Bisa dilihat lewat DevTools."
                        : "Hanya disimpan untuk sesi ini. Hilang saat tab/browser ditutup, maka harus diisi lagi."}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={saveMode === "local"}
                    aria-label="Simpan API key di browser"
                    onClick={() =>
                      chooseSaveMode(saveMode === "local" ? "session" : "local")
                    }
                    className={cn(
                      "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                      saveMode === "local" ? "bg-primary" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-card transition-all",
                        saveMode === "local" ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {stt === llm ? (
                  <KeyCard provider={stt} role="stt" />
                ) : (
                  <>
                    <KeyCard provider={stt} role="stt" />
                    <KeyCard provider={llm} role="llm" />
                  </>
                )}
              </div>

              {!needsAnyKey && (
                <div className="rounded-2xl bg-secondary p-4 text-[0.9375rem] leading-[1.55] text-muted-foreground">
                  Provider transkripsi dan ringkasan Anda berjalan di komputer
                  ini tanpa API key.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data</CardTitle>
              <CardDescription>
                Simpan arsip hasil, pindahkan materi ke perangkat lain, atau
                pulihkan dari file .zip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <ExportDialog
                  materialIds={materialIds}
                  label="Ekspor semua materi"
                  size="default"
                />
                <Button variant="outline" asChild>
                  <label
                    htmlFor="import-zip"
                    className={cn(
                      "cursor-pointer",
                      importing && "pointer-events-none opacity-50",
                    )}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {importing ? "Mengimpor…" : "Impor .zip"}
                  </label>
                </Button>
              </div>
              <input
                id="import-zip"
                type="file"
                accept=".zip,application/zip"
                className="sr-only"
                onChange={handleImport}
                disabled={importing}
              />
              <p className="max-w-[52ch] text-[0.9375rem] leading-[1.55] text-muted-foreground">
                Impor hanya menerima .zip mode “Pindah perangkat”. Materi yang
                masuk ditambahkan ke daftar, bukan menimpa yang lama.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertCircle className="h-5 w-5" />
                Zona Bahaya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleClearAll}>
                Hapus Semua Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-[0.9375rem] text-muted-foreground">
          Semua perubahan langsung tersimpan.{" "}
          <Link
            href="/"
            className="underline decoration-1 underline-offset-4 hover:text-foreground"
          >
            Kembali ke beranda
          </Link>
        </p>
      </main>
    </div>
  );
}

function GuideItem({ provider }: { provider: Provider }) {
  const p = PROVIDERS[provider];
  const usedForStt = providerIdsFor("stt").includes(provider);
  const usedForLlm = providerIdsFor("llm").includes(provider);

  return (
    <li>
      <div className="rounded-2xl bg-secondary p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-medium">{p.label}</p>
          {p.keyless && (
            <span className="text-xs text-muted-foreground">tanpa key</span>
          )}
        </div>
        <p className="mt-1.5 text-[0.9375rem] leading-[1.55]">
          {p.signup}
        </p>
        <p className="mt-1 text-[0.9375rem] leading-[1.55] text-muted-foreground">
          {p.note}
        </p>
        <a
          href={p.keysUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] underline decoration-1 underline-offset-4 hover:text-muted-foreground"
        >
          {p.keysLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(buka di tab baru)</span>
        </a>
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">
          {usedForStt && usedForLlm
            ? "Dipakai untuk transkripsi dan ringkasan."
            : usedForStt
              ? "Dipakai untuk transkripsi audio."
              : "Dipakai untuk ringkasan, mindmap, flashcard, dan tutor."}
        </p>
      </div>
    </li>
  );
}

function KeyCard({
  provider,
  role,
}: {
  provider: Provider;
  role: ProviderRole;
}) {
  const info = PROVIDERS[provider];
  const stored = useStoredApiKey(provider);
  const [draft, setDraft] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const value = draft ?? stored;

  const commit = (next: string) => {
    setDraft(next);
    setApiKey(next, provider);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = {};
      if (info.keyless) {
        // keyless provider tidak butuh header auth
      } else if (stored.trim()) {
        headers.Authorization = `Bearer ${stored.trim()}`;
      }
      const startedAt = performance.now();
      const res = await fetch(`${info.baseUrl}/models`, { headers });
      const elapsed = Math.round(performance.now() - startedAt);
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `Koneksi berhasil, respons ${elapsed} ms.`,
        });
      } else if (res.status === 401 || res.status === 403) {
        setTestResult({
          ok: false,
          message: "API key ditolak provider. Periksa kembali kuncinya.",
        });
      } else if (res.status === 429) {
        setTestResult({
          ok: false,
          message: "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
        });
      } else if (res.status === 404) {
        setTestResult({
          ok: false,
          message:
            "Provider tidak menyediakan endpoint daftar model. Koneksi belum bisa diuji dari sini.",
        });
      } else {
        setTestResult({
          ok: false,
          message: `Provider menolak permintaan (kode ${res.status}).`,
        });
      }
    } catch {
      setTestResult({
        ok: false,
        message: info.keyless
          ? `Tidak bisa menghubungi ${info.label}. Pastikan servernya berjalan di komputer ini.`
          : "Jaringan gagal menghubungi provider. Periksa koneksi internet Anda.",
      });
    } finally {
      setTesting(false);
    }
  };

  const title =
    role === "stt"
      ? info.keyless
        ? "Transkripsi"
        : `Transkripsi · ${info.label}`
      : info.keyless
        ? "Ringkasan & teks"
        : `Ringkasan · ${info.label}`;

  return (
    <div className="rounded-2xl bg-secondary p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.9375rem] font-medium">{title}</p>
        {info.keyless ? (
          <span className="text-[0.8125rem] text-muted-foreground">
            tanpa key
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={testing || !value.trim()}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            Uji Koneksi
          </Button>
        )}
      </div>

      {info.keyless ? (
        <p className="mt-2 text-[0.9375rem] leading-[1.55] text-muted-foreground">
          Provider ini berjalan di komputer Anda dan tidak memakai API key.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => commit(e.target.value)}
              placeholder={info.placeholder}
              aria-label={`API key ${info.label}`}
              autoComplete="off"
              spellCheck={false}
              className="h-11 rounded-full bg-card pr-12 pl-4 text-base"
            />
            <button
              type="button"
              aria-label={show ? "Sembunyikan API key" : "Lihat API key"}
              onClick={() => setShow((v) => !v)}
              className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-[0.875rem] leading-snug text-muted-foreground">
            Tersimpan otomatis begitu Anda mengetik. Tidak ada tombol simpan
            yang perlu ditekan.
          </p>
        </div>
      )}

      {testResult && (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm",
            testResult.ok
              ? "bg-primary/12 text-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {testResult.ok ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {testResult.message}
        </div>
      )}
    </div>
  );
}
