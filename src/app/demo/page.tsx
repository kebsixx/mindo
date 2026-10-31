"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/site-header";
import DemoShowcase from "@/components/demo-showcase";

export default function DemoPage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-280 flex-1 px-5 pb-16 pt-4 sm:px-8 sm:pt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke beranda
        </Link>

        <p className="mt-2 text-[0.875rem] text-muted-foreground">
          Contoh hasil dari rekaman demo, bukan rekaman Anda
        </p>
        <h1 className="mt-2 max-w-[26ch] text-balance text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">
          Satu rekaman, empat bahan belajar
        </h1>

        <div className="mt-8">
          <DemoShowcase />
        </div>

        <div className="mt-12 rounded-[28px] bg-secondary px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            Rekaman Anda akan menghasilkan ini juga.
          </h2>
          <p className="mt-2 max-w-[52ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            Tempel API key sekali, lalu unggah rekaman kuliah. Empat tahap
            berjalan di browser dan hasilnya tersimpan lokal.
          </p>
          <Button asChild className="mt-5">
            <Link href="/">Proses rekaman saya</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
