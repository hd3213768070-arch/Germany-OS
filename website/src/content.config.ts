import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({
    base: new URL("../../database/content/", import.meta.url),
    pattern: "**/*.md"
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).optional()
  })
});

export const collections = { articles };
