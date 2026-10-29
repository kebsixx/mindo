"use client"

import { useLinkStatus } from "next/link"
import { KeyRound, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Slot ikon untuk tautan API key. Harus jadi turunan <Link>.
// Navigasi normal selesai di bawah 100 ms, jadi crossfade ditunda 100 ms:
// tanpa jeda itu spinner berkedip sekali lalu hilang, dan menambah elemen
// baru akan melebarkan tombol selama pending.
export default function ApiKeyLinkIcon() {
  const { pending } = useLinkStatus()
  const fade = "absolute inset-0 h-4 w-4 transition-opacity duration-100 delay-100"

  return (
    <span className="relative h-4 w-4 shrink-0" aria-hidden>
      <KeyRound className={cn(fade, pending ? "opacity-0" : "opacity-100")} />
      <Loader2 className={cn(fade, pending ? "animate-spin opacity-100" : "opacity-0")} />
    </span>
  )
}
