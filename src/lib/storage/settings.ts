import { useSyncExternalStore } from "react"

export type Provider = "groq" | "openai"

const EVENT = "mindo:settings"

function notify(): void {
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

export function getProvider(): Provider {
  if (typeof window === "undefined") return "groq"
  return (localStorage.getItem("mindo.provider") as Provider) || "groq"
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return
  localStorage.setItem("mindo.provider", provider)
  notify()
}

export function getApiKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("mindo.apiKey") || ""
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("mindo.apiKey", key)
  notify()
}

export function useStoredProvider(): Provider {
  return useSyncExternalStore(subscribe, getProvider, () => "groq")
}

export function useStoredApiKey(): string {
  return useSyncExternalStore(subscribe, getApiKey, () => "")
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("mindo.provider")
  localStorage.removeItem("mindo.apiKey")
  localStorage.removeItem("mindo.prefs")
  indexedDB.deleteDatabase("mindo")
  notify()
}