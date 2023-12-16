import { assert } from "console";
import RSS from "rss";
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

export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;

export type FileArticleMetadata = {
  filename: string;
  path: string;
  metadata: ArticleMetadata;
};
export type GenerateRssFeedOptions = {
  ext: string;
  baseUrl: string;
};
export async function generateRssFeed(
  fileArticleMetadata: FileArticleMetadata[],
  options: GenerateRssFeedOptions
) {
  assert(
    [...new Set(fileArticleMetadata.map(({ metadata }) => metadata.id))]
      .length === fileArticleMetadata.length,
    "metadata.id should be unique"
  );
  const url = new URL(options.baseUrl);
  const firstIndexFile = fileArticleMetadata.find(
    (item) => item.path === "/index.md"
  );
  if (!firstIndexFile) throw new Error("Missing /index.md");
  url.pathname = "/rss.xml";
  const feed = new RSS({
    title: firstIndexFile.metadata.title,
    description: firstIndexFile.metadata.description,
    feed_url: url.toString(),
    site_url: options.baseUrl,
    language: "en",
    pubDate: firstIndexFile.metadata.created_at,
    ttl: 2628000,
  });
  fileArticleMetadata
    .filter((item) => item.metadata.type === "article")
    .sort((a, b) => {
      // sort DESC
      return b.metadata.created_at.getTime() - a.metadata.created_at.getTime();
    })
    .forEach(({ path, metadata }) => {
      url.pathname = path.replace(/\.md$/, options.ext);
      feed.item({
        title: metadata.title,
        description: metadata.description || "",
        date: metadata.created_at,
        guid: metadata.id,
        url: url.toString(),
        author: "Kelgors",
      });
    });
  return feed.xml();
}
