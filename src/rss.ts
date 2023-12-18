import { assert } from "console";
import { Feed } from "feed";
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
export async function generateFeeds(
  fileArticleMetadata: FileArticleMetadata[],
  options: GenerateRssFeedOptions
) {
  assert(
    [...new Set(fileArticleMetadata.map(({ metadata }) => metadata.id))]
      .length === fileArticleMetadata.length,
    "metadata.id should be unique"
  );
  const firstIndexFile = fileArticleMetadata.find(
    (item) => item.path === "/index.md"
  );
  if (!firstIndexFile) throw new Error("Missing /index.md");
  const sortedArticles = fileArticleMetadata
    .filter((item) => item.metadata.type === "article")
    .sort((a, b) => {
      // sort DESC
      return b.metadata.created_at.getTime() - a.metadata.created_at.getTime();
    });
  const feed = new Feed({
    id: options.baseUrl,
    title: firstIndexFile.metadata.title,
    description: firstIndexFile.metadata.description,
    link: options.baseUrl,
    copyright: "",
    updated: sortedArticles
      .map(({ metadata }) => metadata.updated_at)
      .sort((a, b) => b.getTime() - a.getTime())[0],
    feedLinks: {
      atom: new URL("/atom.xml", options.baseUrl).toString(),
      rss: new URL("/rss.xml", options.baseUrl).toString(),
    },
    language: "en",
    ttl: 2628000,
  });

  sortedArticles.forEach(({ path, metadata }) => {
    const url = new URL(
      path.replace(/\.md$/, options.ext),
      options.baseUrl
    ).toString();
    feed.addItem({
      id: url,
      guid: metadata.id,
      title: metadata.title,
      description: metadata.description || "",
      date: metadata.created_at,
      link: url,
    });
  });

  return {
    atom: feed.atom1(),
    rss: feed.rss2(),
  };
}
