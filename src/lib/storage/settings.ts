import { useCallback, useSyncExternalStore } from "react"
import {
  DEFAULT_PROVIDER,
  isProvider,
} from "@/lib/ai/providers"
import type { Provider } from "@/lib/ai/providers"

export type { Provider } from "@/lib/ai/providers"

export type SaveMode = "local" | "session"

const EVENT = "mindo:settings"
const SAVE_MODE_KEY = "mindo.saveMode"
const PROVIDER_KEY = "mindo.provider"
const KEYS_KEY = "mindo.apiKeys"
const LEGACY_KEY = "mindo.apiKey"

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

    // Satu key lama untuk provider aktif. Pindahkan sekali, lalu buang.
    const legacy = storage.getItem(LEGACY_KEY)
    if (legacy) {
      const active = getProvider()
      if (!map[active]) map[active] = legacy
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

export function getProvider(): Provider {
  if (typeof window === "undefined") return DEFAULT_PROVIDER
  try {
    const raw = localStorage.getItem(PROVIDER_KEY)
    return raw && isProvider(raw) ? raw : DEFAULT_PROVIDER
  } catch {
    return DEFAULT_PROVIDER
  }
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PROVIDER_KEY, provider)
  } catch {
    // ignore
  }
  notify()
}

export function getApiKey(provider: Provider = getProvider()): string {
  if (typeof window === "undefined") return ""
  return readKeyMap(storageFor(getSaveMode()))[provider] ?? ""
}

export function setApiKey(key: string, provider: Provider = getProvider()): void {
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

export function useStoredProvider(): Provider {
  return useSyncExternalStore(subscribe, getProvider, () => DEFAULT_PROVIDER)
}

export function useStoredApiKey(provider?: Provider): string {
  const read = useCallback(() => getApiKey(provider), [provider])
  return useSyncExternalStore(subscribe, read, () => "")
}

export function useStoredSaveMode(): SaveMode {
  return useSyncExternalStore(subscribe, getSaveMode, () => "local")
}

export function useStoredSetSaveMode(): (mode: SaveMode) => void {
  const set = useCallback((mode: SaveMode): void => {
    try {
      localStorage.setItem(SAVE_MODE_KEY, mode)
    } catch {
      // ignore
    }
    notify()
  }, [])
  return set
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(PROVIDER_KEY)
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
