"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import ApiKeyLinkIcon from "@/components/api-key-link-icon"
import { useStoredApiKey } from "@/lib/storage/settings"

export default function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const storedKey = useStoredApiKey()
  const hasKey = Boolean(storedKey)

  const onHome = pathname === "/"
  const navItems = [
    { href: onHome ? "#riwayat" : "/#riwayat", label: "Riwayat" },
    { href: onHome ? "#cara-kerja" : "/#cara-kerja", label: "Cara kerja" },
    { href: onHome ? "#privasi" : "/#privasi", label: "Privasi" },
  ]

  return (
    <header className="relative mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-5 sm:h-[72px] sm:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo-mindo.png" alt="" width={32} height={32} className="h-8 w-8" />
        <span className="text-xl font-semibold tracking-tight">MINDO</span>
      </Link>

      <nav className="hidden items-center gap-6 text-[0.9375rem] text-muted-foreground md:flex">
        {navItems.map((item) => (
          <a key={item.label} href={item.href} className="transition-colors hover:text-foreground">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className={buttonVariants({ variant: hasKey ? "default" : "outline", size: "sm", className: "gap-2" })}
        >
          <ApiKeyLinkIcon />
          {hasKey ? "API Key Aktif" : "Atur API Key"}
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <nav
          className="absolute inset-x-4 top-16 z-40 rounded-[28px] bg-secondary px-4 py-3 md:hidden"
          aria-label="Menu utama"
        >
          <div className="flex flex-col gap-1 text-base">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="py-3 text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/settings"
              className="py-3 text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Pengaturan
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
