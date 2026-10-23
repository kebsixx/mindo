"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Brain, FileText, Zap, Shield, Sparkles } from "lucide-react"

export default function LandingPage() {
  const features = [
    { icon: Mic, title: "Transkripsi Cepat", desc: "Whisper large-v3 akurat untuk bahasa Indonesia, timestamp per segmen." },
    { icon: Brain, title: "Ringkasan Terstruktur", desc: "Poin-poin penting dikelompokkan per topik, siap diekspor ke Markdown." },
    { icon: FileText, title: "Mindmap Visual", desc: "Peta konsep interaktif 3 level, zoom & pan, ekspor PNG." },
    { icon: Zap, title: "Flashcard Interaktif", desc: "Swipe kanan/kiri, progres tersimpan, keyboard navigation." },
    { icon: Shield, title: "Privasi Lokal", desc: "Data di browser (IndexedDB), tanpa server, tanpa login." },
    { icon: Sparkles, title: "AI Tutor RAG", desc: "Tanya jawab berbasis transkrip, sitasi timestamp, jujur kalau tidak dibahas." },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Dari Suara Dosen Jadi Paham
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload rekaman kuliah atau rekam langsung. Dapatkan ringkasan, mindmap, flashcard, dan AI tutor
            dalam hitungan detik. Tanpa login, data 100% di browser kamu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/settings">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H7" />
                </svg>
                Mulai (Setup API Key)
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Lihat Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Butuh API Key?{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              Daftar gratis di Groq
            </a>{" "}
            atau gunakan OpenAI.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Fitur Utama</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Semua diproses di browser, API Key kamu tidak pernah keluar dari perangkat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <Card key={i} className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Siap Mengubah Kuliah Jadi Paham?</h2>
          <p className="text-muted-foreground">
            Gratis, tanpa login, data di tanganmu. Mulai sekarang.
          </p>
          <Link href="/settings">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H7" />
              </svg>
              Mulai Sekarang
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Final Project UKM Softdev — Smart Student Productivity</p>
          <div className="flex items-center gap-4">
            <a href="../PRD.md" className="hover:text-primary underline" target="_blank">PRD</a>
            <a href="../architecture.md" className="hover:text-primary underline" target="_blank">Arsitektur</a>
            <a href="../design.md" className="hover:text-primary underline" target="_blank">Desain</a>
          </div>
        </div>
      </footer>
    </div>
  )
}