"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Play, Pause } from "lucide-react"
import { formatClock, sourceLabel } from "@/lib/timeline"

interface TranscriptSegment {
  start: number
  end: number
  text: string
  sourceId?: number
}

interface SourceRef {
  id?: number
  order: number
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[]
  sources?: SourceRef[]
  activeTime?: number
  isPlaying?: boolean
  onSeek?: (time: number) => void
}

export default function TranscriptPanel({
  segments,
  sources = [],
  activeTime,
  isPlaying = false,
  onSeek,
}: TranscriptPanelProps) {
  const [search, setSearch] = useState("")

  const filtered = segments.filter((s) =>
    s.text.toLowerCase().includes(search.toLowerCase())
  )

  const labels = new Map<number, string>()
  for (const source of sources) {
    if (source.id !== undefined) labels.set(source.id, sourceLabel(source.order))
  }
  const multiple = sources.length > 1

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
          <p className="py-8 text-center text-[0.9375rem] text-muted-foreground">
            Belum ada transkrip. Proses materi ini dulu.
          </p>
        )}
        {segments.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-[0.9375rem] text-muted-foreground">
            Tidak ada segmen yang cocok dengan pencarian.
          </p>
        )}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((seg, i) => {
              const previous = i > 0 ? filtered[i - 1] : undefined
              const startsSection = multiple && seg.sourceId !== previous?.sourceId
              const label =
                seg.sourceId === undefined ? undefined : labels.get(seg.sourceId)

              const isCurrent =
                activeTime !== undefined &&
                activeTime >= seg.start &&
                activeTime < seg.end

              return (
                <div key={i}>
                  {startsSection && (
                    <p
                      className={
                        i === 0
                          ? "mb-2 text-[0.875rem] font-medium text-muted-foreground"
                          : "mb-2 mt-5 border-t border-border pt-4 text-[0.875rem] font-medium text-muted-foreground"
                      }
                    >
                      {label ?? "Bagian"}
                    </p>
                  )}
                  <div
                    className={
                      isCurrent
                        ? "flex gap-2 rounded-2xl bg-secondary/80 p-2 transition-colors ring-1 ring-border"
                        : "flex gap-2 rounded-2xl p-2 transition-colors hover:bg-secondary"
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        isCurrent && isPlaying
                          ? `Jeda di ${formatClock(seg.start)}`
                          : `Putar dari ${formatClock(seg.start)}`
                      }
                      className="relative h-8 w-8 flex-shrink-0 touch-manipulation before:absolute before:-inset-1.5 before:content-['']"
                      onClick={() => onSeek?.(seg.start)}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <span className="text-[0.875rem] tabular-nums text-muted-foreground">
                        {formatClock(seg.start)}
                      </span>
                      <p className="text-[1.0625rem] leading-[1.55]">{seg.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
