"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
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
  privacySummary,
  providerIdsFor,
  ROLE_LABELS,
} from "@/lib/ai/providers";
import type { Provider, ProviderRole } from "@/lib/ai/providers";
import SiteHeader, { BackLink } from "@/components/site-header";

const GUIDED_PROVIDERS: Provider[] = Array.from(
  new Set([...providerIdsFor("stt"), ...providerIdsFor("llm")]),
);

export default function SettingsPage() {
  const { toast } = useToast();
  const stt = useStoredProvider("stt");
  const llm = useStoredProvider("llm");
  const saveMode = useStoredSaveMode();
  const [materialIds, setMaterialIds] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const keyProviders = stt === llm ? [stt] : [stt, llm];
  const needsAnyKey = keyProviders.some((p) => !PROVIDERS[p].keyless);

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

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-6">
        <BackLink label="Kembali" />
        <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          Pengaturan
        </h1>
        <p className="mt-2 max-w-[56ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
          Pilih provider untuk transkripsi dan ringkasan, isi API key, lalu uji
          koneksinya. Perubahan langsung tersimpan.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-8">
          <div className="space-y-4">
            <RoleCard
              role="stt"
              provider={stt}
              onChange={(next) => chooseProvider("stt", next)}
            />
            <RoleCard
              role="llm"
              provider={llm}
              onChange={(next) => chooseProvider("llm", next)}
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <div className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold">API Key</h2>
                <p className="mt-1 text-[0.875rem] leading-snug text-muted-foreground">
                  {needsAnyKey
                    ? "Key disimpan terpisah untuk setiap provider. Uji dulu sebelum memproses rekaman."
                    : "Kedua peran berjalan di komputer ini, jadi tidak ada key yang perlu diisi."}
                </p>

                <div className="mt-4 space-y-5">
                  {keyProviders.map((provider) => (
                    <KeyField
                      key={provider}
                      provider={provider}
                      roles={
                        stt === llm
                          ? "Transkripsi & ringkasan"
                          : provider === stt
                            ? "Transkripsi"
                            : "Ringkasan"
                      }
                    />
                  ))}
                </div>

                {needsAnyKey && (
                  <div className="mt-5 border-t border-border pt-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={saveMode === "local"}
                      onClick={() =>
                        chooseSaveMode(
                          saveMode === "local" ? "session" : "local",
                        )
                      }
                      className="flex min-h-11 w-full cursor-pointer items-start justify-between gap-4 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-medium">
                          Simpan di browser ini
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted-foreground">
                          {saveMode === "local"
                            ? "Permanen sampai key dihapus. Bisa dilihat lewat DevTools."
                            : "Hanya sesi ini. Hilang saat tab/browser ditutup."}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
                          saveMode === "local" ? "bg-primary" : "bg-border",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-all",
                            saveMode === "local" ? "left-6" : "left-1",
                          )}
                        />
                      </span>
                    </button>
                  </div>
                )}

                <p className="mt-4 text-[0.8125rem] leading-snug text-muted-foreground">
                  {privacySummary(stt, llm)}
                </p>
              </div>
            </Card>
          </div>
        </div>

        <section id="panduan-api-key" className="mt-10 scroll-mt-24">
          <h2 className="text-lg font-semibold">Cara mendapatkan API key</h2>
          <p className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground">
            Panduan singkat per provider. Mindo hanya menautkan ke situs resmi.
          </p>
          <div className="mt-3 rounded-[28px] border border-border bg-card px-5 py-1 sm:px-6">
            {GUIDED_PROVIDERS.map((provider) => (
              <GuideItem key={provider} provider={provider} />
            ))}
          </div>
        </section>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border bg-card px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium">Data</p>
              <p className="mt-0.5 text-[0.875rem] leading-snug text-muted-foreground">
                Ekspor arsip atau impor .zip mode “Pindah perangkat”.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ExportDialog
                materialIds={materialIds}
                label="Ekspor semua"
                size="default"
              />
              <Button
                variant="outline"
                asChild
                className={cn(
                  importing && "pointer-events-none opacity-50",
                )}
              >
                <label htmlFor="import-zip" className="cursor-pointer">
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? "Mengimpor…" : "Impor .zip"}
                </label>
              </Button>
            </div>
          </div>
          <input
            id="import-zip"
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={handleImport}
            disabled={importing}
          />
          <p className="px-1 text-[0.8125rem] leading-snug text-muted-foreground">
            Impor hanya menerima .zip mode “Pindah perangkat”. Materi yang masuk
            ditambahkan ke daftar, bukan menimpa yang lama.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium">Hapus semua data</p>
              <p className="mt-0.5 text-[0.875rem] leading-snug text-muted-foreground">
                Materi, riwayat, pilihan provider, dan API key di browser ini.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="border-destructive/40 text-destructive hover:bg-destructive/5"
            >
              Hapus semua data
            </Button>
          </div>
        </div>

        <p className="mt-6 text-[0.875rem] text-muted-foreground">
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

function RoleCard({
  role,
  provider,
  onChange,
}: {
  role: ProviderRole;
  provider: Provider;
  onChange: (provider: Provider) => void;
}) {
  const meta = ROLE_LABELS[role];

  return (
    <Card>
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{meta.title}</h2>
        <p className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground">
          {meta.description}
        </p>
        <div className="mt-4">
          <ProviderPicker role={role} value={provider} onChange={onChange} />
        </div>
        <div className="mt-4 border-t border-border pt-1">
          <ProviderDetail provider={provider} />
        </div>
      </div>
    </Card>
  );
}

function GuideItem({ provider }: { provider: Provider }) {
  const p = PROVIDERS[provider];

  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
        <span>{p.label}</span>
        <span className="flex items-center gap-2 text-[0.8125rem] font-normal text-muted-foreground">
          {p.keyless ? "tanpa key" : p.keysLabel}
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <div className="pb-4 text-[0.9375rem] leading-[1.55]">
        <p>{p.signup}</p>
        <p className="mt-1 text-muted-foreground">{p.note}</p>
        <a
          href={p.keysUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 underline decoration-1 underline-offset-4 hover:text-muted-foreground"
        >
          {p.keysLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(buka di tab baru)</span>
        </a>
      </div>
    </details>
  );
}

function KeyField({
  provider,
  roles,
}: {
  provider: Provider;
  roles: string;
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
      if (!info.keyless && stored.trim()) {
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

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium">{info.label}</p>
          <p className="text-[0.8125rem] text-muted-foreground">{roles}</p>
        </div>
        {info.keyless ? (
          <span className="pt-0.5 text-[0.8125rem] text-muted-foreground">
            tanpa key
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 shrink-0"
            onClick={testConnection}
            disabled={testing || !value.trim()}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            Uji
          </Button>
        )}
      </div>

      {info.keyless ? (
        <p className="mt-1 text-[0.875rem] leading-snug text-muted-foreground">
          Berjalan di komputer ini. Tidak ada key yang dikirim.
        </p>
      ) : (
        <div className="relative mt-2">
          <Input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => commit(e.target.value)}
            placeholder={info.placeholder}
            aria-label={`API key ${info.label}`}
            autoComplete="off"
            spellCheck={false}
            className="h-11 rounded-full bg-background pr-12 pl-4 text-base"
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
      )}

      {testResult && (
        <p
          className={cn(
            "mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug",
            testResult.ok ? "text-foreground" : "text-destructive",
          )}
        >
          {testResult.ok ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {testResult.message}
        </p>
      )}
    </div>
  );
}
