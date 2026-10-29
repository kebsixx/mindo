"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  notFound?: boolean
  atSec?: number
}

export interface TutorReply {
  text: string
  notFound?: boolean
  atSec?: number
}

interface ChatPanelProps {
  onSend: (message: string) => Promise<TutorReply>
  onSeek?: (seconds: number) => void
}

const SUGGESTIONS = [
  "Apa poin utama rekaman ini?",
  "Jelaskan istilah yang paling sulit",
  "Ringkas bagian akhirnya",
]

export default function ChatPanel({ onSend, onSeek }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg = text.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)
    try {
      const reply = await onSend(userMsg)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.text, notFound: reply.notFound, atSec: reply.atSec },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Jawaban gagal dibuat. Coba lagi sebentar lagi." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`

  return (
    <div className="flex h-[400px] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && !loading && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="cursor-pointer rounded-full border border-border bg-primary/12 px-3 py-1.5 text-[0.8125rem] text-foreground transition-colors hover:bg-primary/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl p-3 text-[0.9375rem] leading-[1.5]",
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : msg.notFound
                  ? "border border-destructive/50 bg-background text-foreground"
                  : "bg-muted"
            )}
          >
            {msg.role === "assistant" && typeof msg.atSec === "number" && (
              <button
                type="button"
                onClick={() => onSeek?.(msg.atSec!)}
                className="mb-1.5 mr-2 inline-block cursor-pointer rounded-full bg-accent/20 px-2 py-0.5 text-[0.8125rem] tabular-nums text-foreground"
              >
                {formatTime(msg.atSec)}
              </button>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%] rounded-lg bg-muted p-3" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-label="Membuat jawaban" />
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          placeholder="Tanya tentang materi..."
          aria-label="Pertanyaan untuk Mindo"
        />
        <Button onClick={() => void send(input)} disabled={loading || !input.trim()} size="icon" aria-label="Kirim pertanyaan">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
