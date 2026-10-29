"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Play } from "lucide-react"

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[]
  onSeek?: (time: number) => void
}

export default function TranscriptPanel({ segments, onSeek }: TranscriptPanelProps) {
  const [search, setSearch] = useState("")

  const filtered = segments.filter((s) =>
    s.text.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transkrip</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari di transkrip..."
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {segments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada transkrip. Proses materi ini dulu.
          </p>
        )}
        {segments.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada segmen yang cocok dengan pencarian.
          </p>
        )}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((seg, i) => (
              <div key={i} className="flex gap-2 rounded-2xl p-2 transition-colors hover:bg-secondary">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Putar dari ${formatTime(seg.start)}`}
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => onSeek?.(seg.start)}
                >
                  <Play className="h-3 w-3" />
                </Button>
                <div className="flex-1">
                  <span className="text-[0.8125rem] tabular-nums text-muted-foreground">
                    {formatTime(seg.start)}
                  </span>
                  <p className="text-[1.0625rem] leading-[1.55]">{seg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}