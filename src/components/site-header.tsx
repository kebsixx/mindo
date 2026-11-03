"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Menu, Settings, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoredApiKey } from "@/lib/storage/settings";
import { openDB } from "@/lib/db";

export default function SiteHeader({ showHistory }: { showHistory?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const storedKey = useStoredApiKey();
  const hasKey = Boolean(storedKey);
  const [hasMaterials, setHasMaterials] = useState(false);

  useEffect(() => {
    if (showHistory !== undefined) return;
    openDB()
      .materials.count()
      .then((n) => setHasMaterials(n > 0))
      .catch(() => setHasMaterials(false));
  }, [showHistory]);

  const historyVisible = showHistory ?? hasMaterials;

  const onHome = pathname === "/";
  const onSettings = pathname === "/settings";
  const navItems = [
    { href: onHome ? "#contoh" : "/#contoh", label: "Contoh" },
    ...(historyVisible
      ? [{ href: onHome ? "#riwayat" : "/#riwayat", label: "Riwayat" }]
      : []),
    { href: onHome ? "#cara-kerja" : "/#cara-kerja", label: "Cara kerja" },
    { href: onHome ? "#privasi" : "/#privasi", label: "Privasi" },
  ];

  const keyLabel = "Pengaturan";

  return (
    <header className="relative mx-auto flex h-16 w-full max-w-280 items-center justify-between gap-3 px-5 sm:h-18 sm:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <Image
          src="/logo-mindo.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="text-xl font-semibold tracking-tight">MINDO</span>
      </Link>

      <nav className="hidden items-center gap-6 text-[0.9375rem] text-muted-foreground md:flex">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/settings"
          aria-label="Buka Pengaturan"
          aria-current={onSettings ? "page" : undefined}
          className={buttonVariants({
            variant: hasKey && !onSettings ? "default" : "outline",
            size: "sm",
            className: "max-md:hidden! gap-2",
          })}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          {keyLabel}
        </Link>
        <Button
          size="icon"
          variant="ghost"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <nav
          className="absolute inset-x-4 top-16 z-40 rounded-[28px] bg-secondary p-2 md:hidden"
          aria-label="Menu utama"
        >
          <div className="flex flex-col text-base">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-muted-foreground transition-colors hover:bg-primary/12 hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/demo"
              className="rounded-2xl px-4 py-3 text-muted-foreground transition-colors hover:bg-primary/12 hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              Contoh hasil
            </Link>
            <Link
              href="/settings"
              aria-current={onSettings ? "page" : undefined}
              className={cn(
                "mt-1 flex items-center gap-2 rounded-2xl px-4 py-3 transition-colors",
                onSettings
                  ? "bg-card font-medium text-foreground"
                  : "text-muted-foreground hover:bg-primary/12 hover:text-foreground",
              )}
              onClick={() => setMenuOpen(false)}
            >
              Pengaturan
              {hasKey && (
                <span
                  className="ml-auto size-2 rounded-full bg-primary"
                  aria-label="API key aktif"
                />
              )}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();

  return (
    <nav aria-label="Navigasi halaman">
      <button
        type="button"
        onClick={() => router.push(href)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    </nav>
  );
}
