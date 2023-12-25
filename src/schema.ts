import { z } from "zod";

export const articleMetadataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["website", "article"]).default("website"),
  page: z.string(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  lang: z.enum(["en"]).default("en"),
  tags: z.array(z.string()).optional(),
});

export type PageMetadata = z.infer<typeof articleMetadataSchema>;

export type FilePageMetadata = {
  filename: string;
  path: string;
  metadata: PageMetadata;
};
