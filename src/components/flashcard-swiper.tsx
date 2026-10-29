"use client"

import { useEffect, useState } from "react"
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
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState<Record<number, Grade>>({})
  const [done, setDone] = useState(false)

  const card = cards[index]

  function handleGrade(grade: Grade) {
    if (!card || done) return
    onGrade?.(card.id, grade)
    setGrades((prev) => ({ ...prev, [card.id]: grade }))
    setFlipped(false)
    if (index < cards.length - 1) {
      setIndex(index + 1)
    } else {
      setDone(true)
    }
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
    const known = Object.values(grades).filter((g) => g === "known").length
    const repeat = cards.length - known
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-lg font-medium">Selesai {cards.length} kartu.</p>
        <p className="text-[0.9375rem] tabular-nums text-muted-foreground">
          Paham {known} · Ulang {repeat}
        </p>
        <Button
          onClick={() => {
            const firstWrong = cards.findIndex((c) => grades[c.id] !== "known")
            setIndex(firstWrong === -1 ? 0 : firstWrong)
            setGrades({})
            setDone(false)
            setFlipped(false)
          }}
        >
          Ulangi yang salah
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-[0.9375rem] text-muted-foreground tabular-nums">
        {index + 1} / {cards.length}
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
        Ketuk kartu untuk membalik · panah kiri Ulang, panah kanan Paham
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => handleGrade("repeat")}>
          Ulang
        </Button>
        <Button onClick={() => handleGrade("known")}>
          Paham
        </Button>
      </div>
    </div>
  )
}
