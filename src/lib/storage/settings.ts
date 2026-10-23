export type Provider = "groq" | "openai"

export function getProvider(): Provider {
  if (typeof window === "undefined") return "groq"
  return (localStorage.getItem("mindo.provider") as Provider) || "groq"
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return
  localStorage.setItem("mindo.provider", provider)
}

export function getApiKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("mindo.apiKey") || ""
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("mindo.apiKey", key)
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("mindo.provider")
  localStorage.removeItem("mindo.apiKey")
  localStorage.removeItem("mindo.prefs")
  indexedDB.deleteDatabase("mindo")
}