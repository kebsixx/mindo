import { z } from "zod"

// 1. Summarizer Schema
export const SUMMARY_SCHEMA = z.object({
  title: z.string().min(1).max(200),
  sections: z.array(
    z.object({
      heading: z.string().min(1).max(100),
      points: z.array(z.string().min(1).max(300)).min(2).max(6),
      keyTerms: z.array(z.string().min(1).max(50)).max(8).optional(),
    })
  ).min(3).max(12),
}).strict()

// 2. Mindmapper Schema (3 level explicit, no recursive refs)
const Level3Node = z.object({
  label: z.string().min(1).max(80),
  children: z.array(z.never()).default([]),
}).strict()

const Level2Node = z.object({
  label: z.string().min(1).max(80),
  children: z.array(Level3Node).max(4),
}).strict()

const Level1Node = z.object({
  label: z.string().min(1).max(80),
  children: z.array(Level2Node).max(6),
}).strict()

export const MINDMAP_SCHEMA = z.object({
  title: z.string().min(1).max(200),
  children: z.array(Level1Node).max(8),
}).strict()

// 3. Flashcarder Schema
export const FLASHCARD_SCHEMA = z.object({
  cards: z.array(
    z.object({
      question: z.string().min(1).max(300),
      answer: z.string().min(1).max(500),
      difficulty: z.enum(["easy", "medium", "hard"]),
      timestampRef: z.number().min(0),
    })
  ).min(8).max(20),
}).strict()

// 4. Tutor Schema
export const TUTOR_SCHEMA = z.object({
  found: z.boolean(),
  answer: z.string().min(1),
  citations: z.array(z.number().min(0)),
}).strict()