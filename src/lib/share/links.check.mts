import assert from "node:assert/strict"
import {
  buildFallbackShareMessage,
  sanitizeShareText,
  buildWhatsAppShareUrl,
} from "./links.ts"

// 1. Template casual
const casual = buildFallbackShareMessage({
  title: "Sistem Terdistribusi",
  points: ["Konsensus Paxos", "Replikasi Raft", "Partisi Jaringan"],
  tone: "casual",
})
assert.ok(casual.includes("Halo teman-teman"))
assert.ok(casual.includes("Sistem Terdistribusi"))
assert.ok(casual.includes("- Konsensus Paxos"))
assert.ok(!casual.includes("—"))

// 2. Template formal
const formal = buildFallbackShareMessage({
  title: "Etika Profesi",
  headings: ["Prinsip Dasar", "Kode Etik"],
  tone: "formal",
})
assert.ok(formal.includes("Yth. Rekan-rekan"))
assert.ok(formal.includes("Etika Profesi"))

// 3. Sanitasi em dash dan batas panjang
const textWithDash = "Poin penting — harus diperhatikan"
const sanitized = sanitizeShareText(textWithDash)
assert.ok(!sanitized.includes("—"))
assert.ok(sanitized.includes("-"))

const longText = "a".repeat(2500)
const truncated = sanitizeShareText(longText, 100)
assert.equal(truncated.length, 100)
assert.ok(truncated.endsWith("..."))

// 4. WhatsApp URL
const url = buildWhatsAppShareUrl("Halo dunia!")
assert.equal(url, "https://wa.me/?text=Halo%20dunia!")

console.log("Semua cek share/links lolos.")
