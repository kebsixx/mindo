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

  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrolledPast = currentY > 24;
      setIsScrolled(scrolledPast);

      // Selama masih di bagian atas halaman (scrollY <= 140),
      // berikan jeda agar pengguna sempat melihat wujud kapsul navbar
      if (currentY <= 140) {
        setIsVisible(true);
      } else if (currentY > lastY + 14) {
        // Scroll ke bawah lebih dari 14px: sembunyikan navbar
        setIsVisible(false);
        setMenuOpen(false);
      } else if (currentY < lastY - 8) {
        // Scroll ke atas: tampilkan kembali navbar
        setIsVisible(true);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div
      className={cn(
        "sticky top-0 z-40 w-full pointer-events-none",
        isScrolled ? "pt-2 sm:pt-3" : "pt-0",
      )}
    >
      <header
        className={cn(
          "relative mx-auto flex items-center justify-between gap-3 pointer-events-auto",
          !isVisible && "-translate-y-24 opacity-0 pointer-events-none scale-[0.98]",
          isScrolled
            ? "h-14 w-[calc(100%-1.5rem)] max-w-280 rounded-full border border-border/80 bg-card/85 px-4 shadow-sm backdrop-blur-md sm:h-15 sm:w-[calc(100%-3rem)] sm:px-6"
            : "h-16 w-full max-w-280 rounded-none border border-transparent bg-transparent px-5 sm:h-18 sm:px-8",
        )}
        style={{
          transitionProperty:
            "transform, opacity, border-radius, background-color, border-color, box-shadow",
          transitionDuration: isVisible
            ? "var(--duration-medium, 350ms)"
            : "var(--duration-fast, 250ms)",
          transitionTimingFunction: "var(--ease-smooth-out)",
        }}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo-mindo.png"
            alt=""
            width={isScrolled ? 28 : 32}
            height={isScrolled ? 28 : 32}
            className={cn(
              "transition-all",
              isScrolled ? "h-7 w-7" : "h-8 w-8",
            )}
            style={{
              transitionDuration: "var(--duration-fast, 250ms)",
              transitionTimingFunction: "var(--ease-smooth-out)",
            }}
          />
          <span
            className={cn(
              "font-bold tracking-tight transition-all",
              isScrolled ? "text-[1.125rem]" : "text-xl",
            )}
            style={{
              transitionDuration: "var(--duration-fast, 250ms)",
              transitionTimingFunction: "var(--ease-smooth-out)",
            }}
          >
            MINDO
          </span>
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-6 font-medium text-muted-foreground md:flex transition-colors",
            isScrolled ? "text-[0.875rem]" : "text-[0.9375rem]",
          )}
          style={{
            transitionDuration: "var(--duration-fast, 250ms)",
            transitionTimingFunction: "var(--ease-smooth-out)",
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="-my-1 py-1 transition-colors hover:text-foreground"
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
              className: cn(
                "rounded-full max-md:hidden! text-muted-foreground hover:text-foreground transition-all",
                isScrolled ? "h-9 w-9" : "h-10 w-10",
              ),
            })}
            style={{
              transitionDuration: "var(--duration-fast, 250ms)",
              transitionTimingFunction: "var(--ease-smooth-out)",
            }}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Button
            size="icon"
            variant="ghost"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "rounded-full md:hidden transition-all",
              isScrolled ? "h-9 w-9" : "h-10 w-10",
            )}
            style={{
              transitionDuration: "var(--duration-fast, 250ms)",
              transitionTimingFunction: "var(--ease-smooth-out)",
            }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <nav
            className={cn(
              "absolute z-40 rounded-[28px] border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md md:hidden",
              isScrolled ? "inset-x-0 top-16" : "inset-x-4 top-16 sm:top-18",
            )}
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
