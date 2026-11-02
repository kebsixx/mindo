import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/site-header";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Maskot | Mindo",
  description:
    "Kenalan dengan kelelawar maskot Mindo, lengkap dengan warna dan aturan pemakaiannya.",
};

const SWATCHES = [
  { name: "Badan", hex: "#26C5FF" },
  { name: "Bayangan", hex: "#1FAFE4" },
  { name: "Garis dan telinga", hex: "#04587A" },
  { name: "Pipi", hex: "#F7ACB0" },
];

const SIZES = [32, 64, 128];

const RULES = [
  "Pakai di atas latar terang. Garis gelap dan badan cyan paling jelas di sana.",
  "Jaga proporsi. Jangan diregangkan, diputar, atau diberi bayangan tambahan.",
  "Beri ruang kosong minimal setengah lebar telinga di sekelilingnya.",
  "Maskot bukan tombol. Kalau perlu aksi, taruh tombol terpisah di dekatnya.",
];

export default function MaskotPage() {
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

        <section className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16">
          <div>
            <p className="text-[0.875rem] text-muted-foreground">Maskot</p>
            <h1 className="mt-2 max-w-[16ch] text-balance text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Kelelawar kecil yang mendengarkan kuliah Anda.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
              Kelelawar menemukan jalan lewat suara. Mindo bekerja dengan cara
              yang mirip: mendengarkan rekaman kuliah, lalu menyusunnya jadi
              ringkasan, mindmap, dan flashcard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/">Proses rekaman saya</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/demo">Lihat contoh hasil</Link>
              </Button>
            </div>
          </div>

          <div className="relative isolate rounded-[28px] bg-secondary p-8 sm:p-10">
            <div
              aria-hidden="true"
              className="absolute inset-8 -z-10 rounded-full bg-[#40D9FF]/30 blur-3xl"
            />
            <Mascot
              directions="/mascots/mindo-directions.webp"
              reactions="/mascots/mindo-reactions.webp"
              label="maskot Mindo"
              size={320}
              className="mx-auto max-w-full"
            />
            <p className="mt-4 text-center text-[0.875rem] text-muted-foreground">
              Gerakkan kursor dan klik maskotnya. Klik cepat empat kali, dia pusing.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="ukuran"
          className="mt-[clamp(3rem,8vw,6rem)] grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16"
        >
          <div>
            <h2
              id="ukuran"
              className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.02em]"
            >
              Tetap terbaca dari kecil sampai besar
            </h2>
            <p className="mt-2 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
              Bentuknya sederhana, jadi telinga, mata, dan sayap masih jelas di
              ukuran ikon.
            </p>
          </div>
          <div className="flex items-end justify-around gap-6 rounded-[28px] bg-secondary px-6 py-8">
            {SIZES.map((size) => (
              <figure key={size} className="flex flex-col items-center gap-3">
                <Image
                  src="/maskot.png"
                  alt=""
                  width={size}
                  height={Math.round(size * (533 / 498))}
                  style={{ width: size, height: "auto" }}
                />
                <figcaption className="font-mono text-[0.8125rem] font-medium tabular-nums text-muted-foreground">
                  {size} px
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="warna"
          className="mt-[clamp(3rem,8vw,6rem)] grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16"
        >
          <div>
            <h2
              id="warna"
              className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.02em]"
            >
              Warna maskot
            </h2>
            <p className="mt-2 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-muted-foreground">
              Cyan maskot lebih pekat daripada Cyan antarmuka (#40D9FF). Pakai
              untuk ilustrasi saja, bukan untuk latar tombol atau teks.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {SWATCHES.map((s) => (
              <li
                key={s.hex}
                className="flex items-center gap-3 rounded-2xl bg-secondary p-3"
              >
                <span
                  aria-hidden="true"
                  className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-foreground/10"
                  style={{ backgroundColor: s.hex }}
                />
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-medium leading-tight">
                    {s.name}
                  </span>
                  <span className="font-mono text-[0.8125rem] font-medium uppercase text-muted-foreground">
                    {s.hex}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="aturan"
          className="mt-[clamp(3rem,8vw,6rem)] rounded-[28px] bg-secondary px-6 py-8 sm:px-10 sm:py-10"
        >
          <h2
            id="aturan"
            className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.02em]"
          >
            Aturan pemakaian
          </h2>
          <ul className="mt-4 max-w-[60ch] space-y-3 text-[1.0625rem] leading-[1.55]">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
                />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
