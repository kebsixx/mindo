import { useCallback, useSyncExternalStore } from "react"

export type Provider = "groq" | "openai"

export type SaveMode = "local" | "session"

const EVENT = "mindo:settings"
const SAVE_MODE_KEY = "mindo.saveMode"

function notify(): void {
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

function readApiKey(): string {
  const mode = getSaveMode()
  const storage = mode === "session" ? window.sessionStorage : window.localStorage
  try {
    return storage.getItem("mindo.apiKey") || ""
  } catch {
    return ""
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
  if (typeof window === "undefined") return "groq"
  // Nilai lama (gemini/claude/deepseek/ollama) pernah tersimpan walau tidak
  // didukung. Jangan teruskan ke endpoint yang salah.
  return localStorage.getItem("mindo.provider") === "openai" ? "openai" : "groq"
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return
  localStorage.setItem("mindo.provider", provider)
  notify()
}

export function getApiKey(): string {
  if (typeof window === "undefined") return ""
  return readApiKey()
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return
  const mode = getSaveMode()
  const storage = mode === "session" ? window.sessionStorage : window.localStorage
  try {
    storage.setItem("mindo.apiKey", key)
  } catch {
    // ignore
  }
  notify()
}

export function useStoredProvider(): Provider {
  return useSyncExternalStore(subscribe, getProvider, () => "groq")
}

export function useStoredApiKey(): string {
  return useSyncExternalStore(subscribe, getApiKey, () => "")
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
  localStorage.removeItem("mindo.provider")
  localStorage.removeItem("mindo.apiKey")
  localStorage.removeItem("mindo.prefs")
  localStorage.removeItem(SAVE_MODE_KEY)
  try {
    sessionStorage.removeItem("mindo.apiKey")
  } catch {
    // ignore
  }
  indexedDB.deleteDatabase("mindo")
  notify()
}
