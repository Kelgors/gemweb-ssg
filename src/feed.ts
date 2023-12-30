import { assert } from 'console';
import { Feed } from 'feed';
import { FilePageMetadata } from './schema';

export type GenerateRssFeedOptions = {
  ext: string;
  baseUrl: string;
  path: string;
  author: string;
  title: string;
  description?: string;
};
export async function generateFeeds(filePageMetadata: FilePageMetadata[], options: GenerateRssFeedOptions) {
  const { ext } = options;

  const sortedPages = filePageMetadata
    .filter(({ filename }) => !filename.endsWith('/index.md'))
    .sort((a, b) => {
      // sort DESC
      return b.metadata.created_at.getTime() - a.metadata.created_at.getTime();
    });

  const feed = new Feed({
    id: options.baseUrl,
    title: options.title,
    description: options.description || '',
    link: options.baseUrl,
    copyright: '',
    updated: sortedPages.map(({ metadata }) => metadata.updated_at).sort((a, b) => b.getTime() - a.getTime())[0],
    feedLinks: {
      atom: new URL(`${options.path}/atom.xml`, options.baseUrl).toString(),
      rss: new URL(`${options.path}/rss.xml`, options.baseUrl).toString(),
      json1: new URL(`${options.path}/json1.json`, options.baseUrl).toString(),
    },
    language: 'en',
    ttl: 2628000,
  });

  sortedPages.forEach(({ path, metadata }) => {
    if (!metadata.title) {
      throw new Error(`Missing title for ${path}`);
    }
    const url = new URL(path.replace(/\.md$/, ext), options.baseUrl).toString();
    feed.addItem({
      id: url,
      title: metadata.title,
      description: metadata.description || '',
      date: metadata.created_at,
      link: url,
      author: [
        {
          name: metadata.author || options.author,
        },
      ],
    });
  });

  return {
    atom: feed.atom1(),
    rss: feed.rss2(),
    json1: feed.json1(),
  };
}
