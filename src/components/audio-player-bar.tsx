"use client"

import { Button } from "@/components/ui/button"
import { formatClock } from "@/lib/timeline"
import { Play, Pause, Square, Volume2 } from "lucide-react"

interface AudioPlayerBarProps {
  isPlaying: boolean
  currentTime: number
  totalDuration: number
  partLabel?: string
  onTogglePlay: () => void
  onStop: () => void
  onSeek: (seconds: number) => void
}

export default function AudioPlayerBar({
  isPlaying,
  currentTime,
  totalDuration,
  partLabel,
  onTogglePlay,
  onStop,
  onSeek,
}: AudioPlayerBarProps) {
  const max = Math.max(1, Math.round(totalDuration))
  const current = Math.min(max, Math.max(0, Math.round(currentTime)))

  return (
    <aside
      aria-label="Pemutar Audio"
      className="fixed bottom-6 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-[28px] border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur-md transition-all sm:p-4"
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Jeda pemutaran" : "Lanjutkan pemutaran"}
          className="h-10 w-10 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onStop}
          aria-label="Berhenti dan tutup pemutar"
          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          title="Berhenti"
        >
          <Square className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
              <Volume2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{partLabel || "Audio rekaman"}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatClock(current)} / {formatClock(max)}
            </span>
          </div>

          <label className="sr-only" htmlFor="audio-timeline-slider">
            Posisi rekaman
          </label>
          <input
            id="audio-timeline-slider"
            type="range"
            min={0}
            max={max}
            step={1}
            value={current}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-accent"
          />
        </div>
      </div>
    </aside>
  )
}
