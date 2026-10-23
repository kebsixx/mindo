"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"
import { Upload, Mic, Trash2, Loader2, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { openDB, type Material } from "@/lib/db"
import { getApiKey, getProvider } from "@/lib/storage/settings"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showRecord, setShowRecord] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const db = openDB()
      const mats = await db.materials.orderBy("createdAt").reverse().toArray()
      setMaterials(mats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 25 MB. Kompres atau rekam langsung." })
      return
    }

    setUploading(true)
    try {
      const db = openDB()
      const materialId = await db.materials.add({
        title: file.name,
        createdAt: new Date().toISOString(),
        duration: 0,
        status: "pending",
        fileName: file.name,
        fileSize: file.size,
      })

      const arrayBuffer = await file.arrayBuffer()
      // Store file temporarily in IndexedDB for processing
      // In real implementation, process through transcribe agent

      setShowUpload(false)
      router.push(`/processing?id=${materialId}`)
    } catch (e) {
      toast({ title: "Gagal upload", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus materi ini?")) return
    try {
      const db = openDB()
      await db.materials.delete(id)
      await db.transcripts.delete(id)
      await db.summaries.delete(id)
      await db.mindmaps.delete(id)
      await db.flashcards.where("materialId").equals(id).delete()
      await db.chunks.where("materialId").equals(id).delete()
      setMaterials(materials.filter((m) => m.id !== id))
      toast({ title: "Materi dihapus" })
    } catch (e) {
      toast({ title: "Gagal hapus", description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Kelola materi kuliah, upload file baru, atau rekam langsung.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Unggah File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unggah File Audio/Video</DialogTitle>
                </DialogHeader>
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Input
                    type="file"
                    accept="audio/*,video/mp4"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="w-full"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground mt-2">Menyimpan...</p>}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showRecord} onOpenChange={setShowRecord}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Mic className="h-4 w-4" />
                  Rekam Langsung
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rekam Langsung</DialogTitle>
                </DialogHeader>
                <p className="py-4 text-center text-muted-foreground">
                  Fitur rekam langsung akan membuka halaman Recording.
                </p>
                <div className="flex justify-end">
                  <Button onClick={() => { setShowRecord(false); router.push("/recording"); }}>Buka Recording</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Materi Tersimpan ({materials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Belum ada materi. Upload file atau rekam langsung untuk memulai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Link href={`/material?id=${m.id}`} className="flex-1">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("id-ID")} • {Math.floor(m.duration / 60)}:{String(m.duration % 60).padStart(2, "0")} • {m.status}
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}