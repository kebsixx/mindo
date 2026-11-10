"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PROVIDERS } from "@/lib/ai/providers"
import type { Provider } from "@/lib/ai/providers"
import {
  setApiKey,
  useStoredApiKey,
  useStoredProvider,
} from "@/lib/storage/settings"

function roleLabel(stt: Provider, llm: Provider, provider: Provider): string {
  if (provider === stt && provider === llm) return "Transkripsi & ringkasan"
  return provider === stt ? "Transkripsi" : "Ringkasan"
}

function privacyLine(stt: Provider, llm: Provider): string {
  const sttLocal = PROVIDERS[stt].keyless
  const llmLocal = PROVIDERS[llm].keyless
  if (stt === llm) {
    return sttLocal
      ? "Audio dan teks diproses di komputer ini."
      : `Audio dan teks dikirim ke ${PROVIDERS[stt].label}.`
  }
  if (sttLocal && llmLocal) {
    return "Audio dan teks diproses di komputer ini."
  }
  if (sttLocal) {
    return `Audio diproses di komputer ini. Teks transkrip dikirim ke ${PROVIDERS[llm].label}.`
  }
  if (llmLocal) {
    return `Audio dikirim ke ${PROVIDERS[stt].label}. Teks transkrip diproses di komputer ini.`
  }
  return `Audio dikirim ke ${PROVIDERS[stt].label}. Teks transkrip dikirim ke ${PROVIDERS[llm].label}.`
}

function KeyRow({ provider, role }: { provider: Provider; role: string }) {
  const info = PROVIDERS[provider]
  const stored = useStoredApiKey(provider)
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)
  const inputId = `api-key-${provider}`

  return (
    <li className="rounded-2xl bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] leading-tight text-muted-foreground">
            {role}
          </p>
          <p className="truncate text-[0.9375rem] font-medium">{info.label}</p>
        </div>
        {info.keyless ? (
          <span className="shrink-0 text-[0.8125rem] text-muted-foreground">
            tanpa key
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 shrink-0"
            aria-expanded={open}
            aria-controls={open ? inputId : undefined}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Tutup" : stored ? "Ganti" : "Isi"}
          </Button>
        )}
      </div>

      {info.keyless && (
        <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">
          Berjalan di komputer ini. Tidak ada key yang dikirim.
        </p>
      )}

      {open && !info.keyless && (
        <div className="relative mt-2">
          <Input
            id={inputId}
            type={show ? "text" : "password"}
            value={stored}
            onChange={(e) => setApiKey(e.target.value, provider)}
            placeholder={info.placeholder}
            aria-label={`API key ${info.label}`}
            autoComplete="off"
            spellCheck={false}
            className="h-11 rounded-full bg-secondary pr-12 text-base"
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
    </li>
  )
}

export default function ProviderKeyList() {
  const stt = useStoredProvider("stt")
  const llm = useStoredProvider("llm")
  const sttKey = useStoredApiKey(stt)
  const llmKey = useStoredApiKey(llm)
  const sttReady = PROVIDERS[stt].keyless || Boolean(sttKey)
  const llmReady = PROVIDERS[llm].keyless || Boolean(llmKey)
  const providers = stt === llm ? [stt] : [stt, llm]

  return (
    <div>
      <p className="text-[0.9375rem] font-medium">API Key</p>
      <ul className="mt-2 space-y-2">
        {providers.map((provider) => (
          <KeyRow
            key={provider}
            provider={provider}
            role={roleLabel(stt, llm, provider)}
          />
        ))}
      </ul>
      <p className="mt-2 text-[0.8125rem] leading-snug text-muted-foreground">
        {privacyLine(stt, llm)}
      </p>
      {(!sttReady || !llmReady) && (
        <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">
          <Link
            href="/settings#panduan-api-key"
            className="underline decoration-1 underline-offset-4 hover:text-foreground"
          >
            Cara mendapatkan API key
          </Link>
        </p>
      )}
    </div>
  )
}
