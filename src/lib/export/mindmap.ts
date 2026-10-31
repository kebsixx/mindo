import { markmapRoot } from "@/lib/mindmap"

const PAD = 40
const TARGET_WIDTH = 2400
const MAX_ZOOM = 3
const SCALE = 2

// Markmap menggambar node sebagai <foreignObject> berisi HTML, jadi merasterkan
// SVG secara manual kehilangan teksnya. html-to-image membakar DOM (termasuk
// font yang sedang dimuat halaman) ke canvas.
export async function mindmapToPng(content: string): Promise<Blob> {
  const [{ Markmap }, { toPng }] = await Promise.all([
    import("markmap-view"),
    import("html-to-image"),
  ])

  const host = document.createElement("div")
  host.setAttribute("aria-hidden", "true")
  // html-to-image menyalin posisi absolut node; kalau host digeser ke luar layar,
  // isinya ikut tergeser dan hasilnya kosong. Jadi tetap di 0,0, disembunyikan
  // di belakang halaman saja.
  host.style.cssText =
    "position:fixed;left:0;top:0;background:#FCFCFC;z-index:-1;pointer-events:none"
  document.body.appendChild(host)

  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "1600")
    svg.setAttribute("height", "1200")
    host.appendChild(svg)

    const instance = Markmap.create(svg, { autoFit: false })
    await instance.setData(markmapRoot(content))
    // Markmap memudarkan node masuk lewat transisi; menangkap terlalu cepat
    // menghasilkan PNG kosong.
    await new Promise((resolve) => setTimeout(resolve, 700))
    // fit() membingkai seluruh isi peta ke dalam kontainer sementara.
    await instance.fit()

    const group = svg.querySelector("g")
    if (!group) throw new Error("Peta konsep tidak tergambar.")
    const bounds = group.getBoundingClientRect()
    if (bounds.width < 2 || bounds.height < 2) {
      throw new Error("Peta konsep kosong. Coba proses ulang materi ini.")
    }

    // Potong kanvas ke ukuran isi, lalu perbesar sampai selebar TARGET_WIDTH
    // supaya teks tidak tenggelam di bidang kosong.
    const zoom = Math.min(MAX_ZOOM, Math.max(1, TARGET_WIDTH / bounds.width))
    const width = Math.round(bounds.width * zoom + PAD * 2)
    const height = Math.round(bounds.height * zoom + PAD * 2)

    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g")
    wrap.setAttribute(
      "transform",
      `translate(${PAD - bounds.left * zoom}, ${PAD - bounds.top * zoom}) scale(${zoom})`,
    )
    host.style.width = `${width}px`
    host.style.height = `${height}px`
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    svg.appendChild(wrap)
    wrap.appendChild(group)

    await new Promise((resolve) => requestAnimationFrame(resolve))

    const dataUrl = await toPng(host, {
      backgroundColor: "#FCFCFC",
      pixelRatio: SCALE,
      width,
      height,
    })
    const res = await fetch(dataUrl)
    return await res.blob()
  } finally {
    host.remove()
  }
}
