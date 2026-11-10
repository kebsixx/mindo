import { useCallback, useSyncExternalStore } from "react"
import {
  DEFAULT_PROVIDERS,
  isProvider,
  supportsRole,
} from "@/lib/ai/providers"
import type { Provider, ProviderRole } from "@/lib/ai/providers"

export type { Provider, ProviderRole } from "@/lib/ai/providers"

export type SaveMode = "local" | "session"

const EVENT = "mindo:settings"
const SAVE_MODE_KEY = "mindo.saveMode"
const KEYS_KEY = "mindo.apiKeys"
const LEGACY_KEY = "mindo.apiKey"
const LEGACY_PROVIDER_KEY = "mindo.provider"

const PROVIDER_KEYS: Record<ProviderRole, string> = {
  stt: "mindo.provider.stt",
  llm: "mindo.provider.llm",
}

function notify(): void {
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

function storageFor(mode: SaveMode): Storage {
  return mode === "session" ? window.sessionStorage : window.localStorage
}

function readLegacyProvider(): Provider | null {
  try {
    const raw = localStorage.getItem(LEGACY_PROVIDER_KEY)
    return raw && isProvider(raw) ? raw : null
  } catch {
    return null
  }
}

function readKeyMap(storage: Storage): Partial<Record<Provider, string>> {
  const map: Partial<Record<Provider, string>> = {}
  try {
    const raw = storage.getItem(KEYS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [id, value] of Object.entries(parsed)) {
          if (isProvider(id) && typeof value === "string" && value) {
            map[id] = value
          }
        }
      }
    }

    // Satu key lama milik provider yang dulu aktif. Pindahkan sekali, lalu buang.
    const legacy = storage.getItem(LEGACY_KEY)
    if (legacy) {
      const owner = readLegacyProvider() ?? DEFAULT_PROVIDERS.llm
      if (!map[owner]) map[owner] = legacy
      storage.setItem(KEYS_KEY, JSON.stringify(map))
      storage.removeItem(LEGACY_KEY)
    }
  } catch {
    // storage tidak bisa dibaca atau JSON rusak
  }
  return map
}

function writeKeyMap(
  storage: Storage,
  map: Partial<Record<Provider, string>>
): void {
  try {
    storage.setItem(KEYS_KEY, JSON.stringify(map))
    storage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }
}

export function getSaveMode(): SaveMode {
  try {
    return localStorage.getItem(SAVE_MODE_KEY) === "session" ? "session" : "local"
  } catch {
    return "local"
  }
}

export function setSaveMode(mode: SaveMode): void {
  try {
    localStorage.setItem(SAVE_MODE_KEY, mode)
  } catch {
    // storage tidak bisa ditulis (private mode dsb)
  }
  notify()
}

export function getProvider(role: ProviderRole): Provider {
  if (typeof window === "undefined") return DEFAULT_PROVIDERS[role]
  try {
    const raw = localStorage.getItem(PROVIDER_KEYS[role])
    if (raw && isProvider(raw) && supportsRole(raw, role)) return raw

    // Nilai lama dari masa satu provider. Provider teks-saja tetap dipakai
    // untuk ringkasan, tapi transkripsi jatuh ke default yang bisa.
    const legacy = readLegacyProvider()
    if (legacy && supportsRole(legacy, role)) {
      localStorage.setItem(PROVIDER_KEYS[role], legacy)
      return legacy
    }
    localStorage.setItem(PROVIDER_KEYS[role], DEFAULT_PROVIDERS[role])
  } catch {
    // storage tidak bisa dibaca
  }
  return DEFAULT_PROVIDERS[role]
}

export function setProvider(role: ProviderRole, provider: Provider): void {
  if (typeof window === "undefined" || !supportsRole(provider, role)) return
  try {
    localStorage.setItem(PROVIDER_KEYS[role], provider)
  } catch {
    // ignore
  }
  notify()
}

export function getApiKey(provider: Provider): string {
  if (typeof window === "undefined") return ""
  return readKeyMap(storageFor(getSaveMode()))[provider] ?? ""
}

export function setApiKey(key: string, provider: Provider): void {
  if (typeof window === "undefined") return
  const storage = storageFor(getSaveMode())
  const map = readKeyMap(storage)
  const trimmed = key.trim()
  if (trimmed) {
    map[provider] = trimmed
  } else {
    delete map[provider]
  }
  writeKeyMap(storage, map)
  notify()
}

export function useStoredProvider(role: ProviderRole): Provider {
  const read = useCallback(() => getProvider(role), [role])
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PROVIDERS[role])
}

export function useStoredApiKey(provider: Provider): string {
  const read = useCallback(() => getApiKey(provider), [provider])
  return useSyncExternalStore(subscribe, read, () => "")
}

export function useStoredSaveMode(): SaveMode {
  return useSyncExternalStore(subscribe, getSaveMode, () => "local")
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(PROVIDER_KEYS.stt)
      storage.removeItem(PROVIDER_KEYS.llm)
      storage.removeItem(LEGACY_PROVIDER_KEY)
      storage.removeItem(KEYS_KEY)
      storage.removeItem(LEGACY_KEY)
    } catch {
      // ignore
    }
  }
  try {
    localStorage.removeItem("mindo.prefs")
    localStorage.removeItem(SAVE_MODE_KEY)
  } catch {
    // ignore
  }
  indexedDB.deleteDatabase("mindo")
  notify()
}
