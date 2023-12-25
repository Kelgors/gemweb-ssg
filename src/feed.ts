import { assert } from "console";
import { Feed } from "feed";
import { FilePageMetadata, PageMetadata } from "./schema";
import path from 'node:path';

export type GenerateRssFeedOptions = {
  ext: string;
  baseUrl: string;
  feedPath: string;
  feedAuthor: string;
};
export async function generateFeeds(
  filePageMetadata: FilePageMetadata[],
  options: GenerateRssFeedOptions
) {
  console.log('metadata[]: %o', filePageMetadata)
  console.log('options: %o', options)
  assert(
    [...new Set(filePageMetadata.map(({ metadata }) => metadata.id))]
      .length === filePageMetadata.length,
    "metadata.id should be unique"
  );
  const firstIndexFile = filePageMetadata.find(
    (item) => item.path === path.join(options.feedPath, 'index.md')
  );
  if (!firstIndexFile) throw new Error("Missing /index.md");
  const sortedArticles = filePageMetadata
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
      atom: new URL(`${options.feedPath}/atom.xml`, options.baseUrl).toString(),
      rss: new URL(`${options.feedPath}/rss.xml`, options.baseUrl).toString(),
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
      title: metadata.title,
      description: metadata.description || "",
      date: metadata.created_at,
      link: url,
      author: [
        {
          name: options.feedAuthor,
        },
      ],
    });
  });

  return {
    atom: feed.atom1(),
    rss: feed.rss2(),
    json1: feed.json1()
  };
}
