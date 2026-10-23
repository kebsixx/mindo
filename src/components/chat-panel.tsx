"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  onSend: (message: string) => Promise<string>
}

export default function ChatPanel({ onSend }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)
    try {
      const response = await onSend(userMsg)
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Terjadi kesalahan." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "p-3 rounded-lg max-w-[80%]",
              msg.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-muted p-3 rounded-lg max-w-[80%]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-2 p-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Tanya tentang materi..."
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}