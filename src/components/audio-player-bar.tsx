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
  const progressPercent = Math.min(100, Math.max(0, (current / max) * 100))

  return (
    <aside
      aria-label="Pemutar Audio"
      className="fixed bottom-6 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-[24px] border border-border/80 bg-card p-3 shadow-xl sm:p-3.5"
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Jeda pemutaran" : "Lanjutkan pemutaran"}
          className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onStop}
          aria-label="Berhenti dan tutup pemutar"
          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="Berhenti"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
              <Volume2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{partLabel || "Audio rekaman"}</span>
            </span>
            <span className="shrink-0 tabular-nums font-mono text-[0.75rem] text-muted-foreground">
              {formatClock(current)} / {formatClock(max)}
            </span>
          </div>

          {/* Clean custom progress track */}
          <div className="relative flex h-5 items-center">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
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
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
