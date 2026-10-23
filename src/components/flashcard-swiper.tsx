"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: number
  question: string
  answer: string
  difficulty: string
}

interface FlashcardSwiperProps {
  cards: Flashcard[]
  onGrade?: (id: number, grade: "known" | "repeat" | "unknown") => void
}

export default function FlashcardSwiper({ cards, onGrade }: FlashcardSwiperProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (cards.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Belum ada flashcard.</p>
  }

  const card = cards[index]

  const handleGrade = (grade: "known" | "repeat" | "unknown") => {
    onGrade?.(card.id, grade)
    setFlipped(false)
    if (index < cards.length - 1) {
      setIndex(index + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center">
        {index + 1} / {cards.length}
      </div>
      <Card
        className={cn("min-h-[200px] cursor-pointer transition-all", flipped && "bg-accent")}
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="flex items-center justify-center p-6 min-h-[200px]">
          <div className="text-center">
            {!flipped ? (
              <p className="text-lg font-medium">{card.question}</p>
            ) : (
              <p className="text-lg">{card.answer}</p>
            )}
          </div>
        </CardContent>
      </Card>
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