"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Menu, Settings, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoredApiKey, useStoredProvider } from "@/lib/storage/settings";
import { PROVIDERS } from "@/lib/ai/providers";
import { openDB } from "@/lib/db";

export default function SiteHeader({ showHistory }: { showHistory?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const stt = useStoredProvider("stt");
  const llm = useStoredProvider("llm");
  const sttKey = useStoredApiKey(stt);
  const llmKey = useStoredApiKey(llm);
  const sttInfo = PROVIDERS[stt];
  const llmInfo = PROVIDERS[llm];
  const ready =
    (sttInfo.keyless || Boolean(sttKey.trim())) &&
    (llmInfo.keyless || Boolean(llmKey.trim()));
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
    { href: onHome ? "#faq" : "/#faq", label: "FAQ" },
  ];

  return (
    <div className="sticky top-0 z-40 w-full pt-3 sm:pt-4">
      <header className="relative mx-auto flex h-14 w-[calc(100%-1.5rem)] max-w-280 items-center justify-between gap-3 rounded-full border border-border/70 bg-card/85 px-4 shadow-xs backdrop-blur-md sm:h-15 sm:w-[calc(100%-3rem)] sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo-mindo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-[1.125rem] font-bold tracking-tight">MINDO</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[0.875rem] font-medium text-muted-foreground md:flex">
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

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/settings"
            aria-label="Buka Pengaturan"
            title="Pengaturan"
            aria-current={onSettings ? "page" : undefined}
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className:
                "h-9 w-9 rounded-full max-md:hidden! text-muted-foreground hover:text-foreground",
            })}
          >
            <Settings className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>
          <Button
            size="icon"
            variant="ghost"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="h-9 w-9 rounded-full md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <nav
            className="absolute inset-x-0 top-16 z-40 rounded-[28px] border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md md:hidden"
            aria-label="Menu utama"
          >
            <div className="flex flex-col text-base">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-2.5 text-muted-foreground transition-colors hover:bg-primary/12 hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/demo"
                className="rounded-2xl px-4 py-2.5 text-muted-foreground transition-colors hover:bg-primary/12 hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                Contoh hasil
              </Link>
              <Link
                href="/settings"
                aria-current={onSettings ? "page" : undefined}
                className={cn(
                  "mt-1 flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors",
                  onSettings
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-primary/12 hover:text-foreground",
                )}
                onClick={() => setMenuOpen(false)}
              >
                Pengaturan
                {ready && (
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
    </div>
  );
}

export function BackLink({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();

  return (
    <nav aria-label="Navigasi halaman">
      <button
        type="button"
        onClick={() => {
          if (href) {
            router.push(href);
          } else if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label ?? "Kembali"}
      </button>
    </nav>
  );
}
