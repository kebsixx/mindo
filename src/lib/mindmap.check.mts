import test from "node:test"
import assert from "node:assert/strict"

import { normalizeMindmap } from "./mindmap.ts"

test("bentuk kanonik tiga level diterima apa adanya", () => {
  const tree = normalizeMindmap({
    title: "Basis Data",
    children: [
      { label: "Normalisasi", children: [{ label: "1NF", children: [] }] },
      { label: "SQL", children: [] },
    ],
  })
  assert.equal(tree.title, "Basis Data")
  assert.equal(tree.children.length, 2)
  assert.equal(tree.children[0].children[0].label, "1NF")
})

test("model yang berhenti di dua level tetap lolos", () => {
  const tree = normalizeMindmap({
    title: "Jaringan",
    children: [{ label: "OSI" }, { label: "TCP/IP" }],
  })
  assert.deepEqual(tree.children, [
    { label: "OSI", children: [] },
    { label: "TCP/IP", children: [] },
  ])
})

test("leaf berupa string dan nama field lain diterima", () => {
  const tree = normalizeMindmap({
    title: "Hukum",
    children: [
      { name: "Pidana", nodes: ["Pasal 1", "Pasal 2"] },
      { content: "Perdata", children: [{ text: "Wanprestasi" }] },
    ],
  })
  assert.equal(tree.children[0].label, "Pidana")
  assert.equal(tree.children[0].children[0].label, "Pasal 1")
  assert.equal(tree.children[1].label, "Perdata")
  assert.equal(tree.children[1].children[0].label, "Wanprestasi")
})

test("kedalaman lebih dari tiga dipotong, bukan ditolak", () => {
  const tree = normalizeMindmap({
    title: "Dalam",
    children: [
      {
        label: "A",
        children: [
          {
            label: "B",
            children: [{ label: "C", children: [{ label: "D" }] }],
          },
        ],
      },
      { label: "E" },
    ],
  })
  const c = tree.children[0].children[0].children[0]
  assert.equal(c.label, "C")
  assert.deepEqual(c.children, [])
})

test("cabang kosong dibuang dan judul kosong dapat fallback", () => {
  const tree = normalizeMindmap({
    children: [{ label: "" }, { label: "Satu" }, { label: "Dua" }],
  })
  assert.equal(tree.title, "Peta Konsep")
  assert.deepEqual(
    tree.children.map((n) => n.label),
    ["Satu", "Dua"]
  )
})

test("hasil yang tidak bisa dipakai tetap gagal terang-terangan", () => {
  assert.throws(() => normalizeMindmap("bukan objek"))
  assert.throws(() => normalizeMindmap({ children: [{ label: "Hanya satu" }] }))
  assert.throws(() => normalizeMindmap({ children: [] }))
})
