"use client"

import { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: number
  question: string
  answer: string
  difficulty: string
}

type Grade = "known" | "repeat"

interface FlashcardSwiperProps {
  cards: Flashcard[]
  onGrade?: (id: number, grade: "known" | "repeat" | "unknown") => void
}

export default function FlashcardSwiper({ cards, onGrade }: FlashcardSwiperProps) {
  const [queue, setQueue] = useState<Flashcard[]>(cards)
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [wrong, setWrong] = useState<Flashcard[]>([])
  const [round, setRound] = useState(1)
  const [done, setDone] = useState(false)
  const [sessionKey, setSessionKey] = useState(() =>
    cards.map((c) => c.id).join(","),
  )

  const card = queue[pos]

  // Kartu datang dari IndexedDB secara asinkron dan array baru dibuat tiap render
  // induk. Bandingkan id-nya, bukan identitas array, supaya sesi tidak ter-reset.
  const cardsKey = cards.map((c) => c.id).join(",")
  if (sessionKey !== cardsKey) {
    setSessionKey(cardsKey)
    setQueue(cards)
    setPos(0)
    setWrong([])
    setRound(1)
    setDone(false)
    setFlipped(false)
  }

  function handleGrade(grade: Grade) {
    if (!card || done) return
    onGrade?.(card.id, grade)
    if (grade === "repeat") {
      setWrong((prev) =>
        prev.some((c) => c.id === card.id) ? prev : [...prev, card],
      )
    }
    setFlipped(false)
    if (pos < queue.length - 1) {
      setPos(pos + 1)
    } else {
      setDone(true)
    }
  }

  function restart(next: Flashcard[]) {
    setQueue(next)
    setPos(0)
    setWrong([])
    setRound((r) => r + 1)
    setDone(false)
    setFlipped(false)
  }

  useEffect(() => {
    if (!card || done) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleGrade("repeat")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleGrade("known")
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (cards.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Belum ada flashcard.</p>
  }

  if (done) {
    const known = queue.length - wrong.length
    return (
      <div className="space-y-5 py-6">
        <div className="text-center">
          <p className="text-lg font-medium">Sesi {round} selesai.</p>
          <p className="mt-1 text-[0.9375rem] tabular-nums text-muted-foreground">
            Paham {known} · Perlu diulang {wrong.length}
          </p>
        </div>

        {wrong.length > 0 && (
          <div className="rounded-[28px] bg-secondary p-5">
            <p className="text-sm font-medium">Pertanyaan yang harus diulang</p>
            <ul className="mt-3 space-y-2">
              {wrong.map((item, i) => (
                <li key={item.id} className="flex gap-2 text-[0.9375rem] leading-snug">
                  <span className="tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span>{item.question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {wrong.length > 0 && (
            <Button onClick={() => restart(wrong)} className="gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Ulangi {wrong.length} pertanyaan
            </Button>
          )}
          {wrong.length < queue.length && (
            <Button variant="outline" onClick={() => restart(cards)}>
              Ulangi semua {cards.length} kartu
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[0.9375rem] text-muted-foreground tabular-nums">
        <span>
          {pos + 1} / {queue.length}
        </span>
        {round > 1 && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground">
            Putaran {round}
          </span>
        )}
      </div>
      <Card
        className={cn("min-h-[200px] cursor-pointer transition-colors", flipped && "border-primary bg-primary/8")}
        onClick={() => setFlipped(!flipped)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Tampilkan pertanyaan" : "Tampilkan jawaban"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setFlipped((f) => !f)
          }
        }}
      >
        <CardContent className="flex min-h-[200px] items-center justify-center p-6">
          <div className="text-center">
            {!flipped ? (
              <p className="text-lg font-medium">{card.question}</p>
            ) : (
              <p className="text-lg">{card.answer}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Ketuk kartu untuk melihat jawaban. Pilih tombol setelah menilai jawaban.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => handleGrade("repeat")} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Ulangi nanti
        </Button>
        <Button onClick={() => handleGrade("known")} className="gap-2">
          <Check className="h-4 w-4" aria-hidden="true" />
          Sudah paham
        </Button>
      </div>
    </div>
  )
}
