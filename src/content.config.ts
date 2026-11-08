import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

export const CATEGORIES = {
  stock: "증시",
  fx: "환율",
  crypto: "코인",
  realestate: "부동산",
} as const;

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(["stock", "fx", "crypto", "realestate"]),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    aiGenerated: z.boolean().default(true),
    sample: z.boolean().default(false),
    sources: z.array(z.object({ name: z.string(), url: z.string().optional() })).default([]),
    keyFigures: z
      .array(z.object({ label: z.string(), value: z.string(), change: z.string().optional(), direction: z.enum(["up", "down", "flat"]).optional() }))
      .default([]),
  }),
});

export const collections = { articles };
