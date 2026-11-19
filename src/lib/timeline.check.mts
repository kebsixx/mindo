import test from "node:test"
import assert from "node:assert/strict"

import {
  chunkBySource,
  formatClock,
  isOutputsStale,
  nextOffset,
  resolveAt,
  shiftSegment,
} from "./timeline.ts"

test("formatClock menampilkan jam hanya bila perlu", () => {
  assert.equal(formatClock(0), "00:00")
  assert.equal(formatClock(65), "01:05")
  assert.equal(formatClock(3599), "59:59")
  assert.equal(formatClock(3600), "1:00:00")
  assert.equal(formatClock(3725), "1:02:05")
  assert.equal(formatClock(-4), "00:00")
})

test("nextOffset memakai ujung terjauh", () => {
  assert.equal(nextOffset([]), 0)
  assert.equal(
    nextOffset([
      { order: 0, offset: 0, duration: 600 },
      { order: 1, offset: 600, duration: 300 },
    ]),
    900,
  )
  assert.equal(
    nextOffset([
      { order: 0, offset: 0, duration: 600 },
      { order: 1, offset: 500, duration: 300 },
    ]),
    800,
  )
})

test("shiftSegment menggeser waktu dan mempertahankan teks", () => {
  assert.deepEqual(shiftSegment({ start: 10, end: 20, text: "halo" }, 600, 4), {
    start: 610,
    end: 620,
    text: "halo",
    sourceId: 4,
  })
})

test("resolveAt memilih sumber dan waktu lokal", () => {
  const sources = [
    { id: 1, order: 0, offset: 0, duration: 100 },
    { id: 2, order: 1, offset: 100, duration: 50 },
  ]
  assert.deepEqual(resolveAt(sources, 0), { source: sources[0], local: 0 })
  assert.deepEqual(resolveAt(sources, 99.5), { source: sources[0], local: 99.5 })
  assert.deepEqual(resolveAt(sources, 100), { source: sources[1], local: 0 })
  assert.deepEqual(resolveAt(sources, 130), { source: sources[1], local: 30 })
  // Lewat ujung timeline tetap menempel ke sumber terakhir.
  assert.deepEqual(resolveAt(sources, 900), { source: sources[1], local: 800 })
  assert.equal(resolveAt([], 10), null)
})

test("isOutputsStale hanya benar saat hasil tertinggal", () => {
  assert.equal(isOutputsStale(undefined, 3), false)
  assert.equal(isOutputsStale(2, 3), true)
  assert.equal(isOutputsStale(3, 3), false)
  assert.equal(isOutputsStale(4, 3), false)
})

test("chunkBySource tidak menyeberangi dua rekaman", () => {
  const segments = [
    { start: 0, end: 30, text: "a", sourceId: 1 },
    { start: 30, end: 55, text: "b", sourceId: 1 },
    { start: 100, end: 130, text: "c", sourceId: 2 },
    { start: 130, end: 150, text: "d", sourceId: 2 },
  ]
  const chunks = chunkBySource(7, segments)
  assert.equal(chunks.length, 2)
  assert.deepEqual(
    chunks.map((chunk) => ({ start: chunk.start, end: chunk.end, sourceId: chunk.sourceId })),
    [
      { start: 0, end: 55, sourceId: 1 },
      { start: 100, end: 150, sourceId: 2 },
    ],
  )
  assert.ok(chunks.every((chunk) => chunk.materialId === 7))
})

test("chunkBySource menerima transkrip lama tanpa sourceId", () => {
  const chunks = chunkBySource(3, [
    { start: 0, end: 30, text: "lama" },
    { start: 30, end: 60, text: "tetap" },
  ])
  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].sourceId, undefined)
})
