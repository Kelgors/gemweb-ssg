import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';
import recursive from 'recursive-readdir';
import { generateFeeds } from './feed';
import { FormatType, renderMarkdown, renderTemplate } from './render';
import { FilePageMetadata, PageMetadata, pageMetadataSchema } from './schema';

function parseMetadata(data: unknown): PageMetadata {
  const result = pageMetadataSchema.safeParse(data);
  if (!result.success) {
    console.error(result.error);
    throw new Error('Unable to parse metadata');
  }
  const metadata = result.data;

  metadata.page = metadata.page.replace('{{ title }}', metadata.title);

  return metadata;
}

type FeedOptions = {
  domain: string;
  path: string;
  title: string;
  description?: string;
};
type BuildOptions = {
  author?: string;
  formats: FormatType[];
  feed?: FeedOptions;
};
export async function build(inputDir: string, outputDir: string, options: BuildOptions) {
  const inputDirReg = new RegExp(`^${inputDir}`);
  const files = await recursive(inputDir);
  const pagesMetadata: FilePageMetadata[] = [];

  for (const fullpath of files) {
    // ignore dotfiles
    if (path.basename(fullpath).startsWith('.')) {
      console.info('Ignoring(file: %s)', fullpath);
      continue;
    }
    if (!fullpath.endsWith('.md')) {
      // copy file foreach formats
      for (const format of options.formats) {
        const formattedOutputDir = path.join(outputDir, format);
        console.info('Copying(format: %s, file: %s)', format, fullpath);
        await fs.mkdir(path.dirname(fullpath).replace(inputDirReg, formattedOutputDir), { recursive: true });
        await fs.copyFile(fullpath, fullpath.replace(inputDirReg, formattedOutputDir));
      }
      continue;
    }

    console.log('Loading(file: %s)', fullpath);
    const fileContent = await fs.readFile(fullpath);
    const { data, content: markdown } = matter(fileContent.toString('utf-8'));

    const metadata = parseMetadata(data);
    pagesMetadata.push({
      filename: fullpath,
      path: fullpath.replace(inputDirReg, ''),
      metadata,
    });

    for (const format of options.formats) {
      console.info('Processing(format: %s, file: %s)', format, fullpath);
      const output = await renderMarkdown(markdown, { format });
      const ext = format === 'gemini' ? '.gmi' : '.html';
      const final = await renderTemplate(output, {
        ext,
        format,
        sourcePath: inputDir,
        relativePath: fullpath.replace(inputDirReg, ''),
        metadata,
      });
      const formattedOutputDir = path.join(outputDir, format);
      await fs.mkdir(path.dirname(fullpath).replace(inputDirReg, formattedOutputDir), { recursive: true });
      await fs.writeFile(fullpath.replace(inputDirReg, formattedOutputDir).replace(/\.md$/, ext), final);
    }
  }

  const feedOptions = options.feed;
  if (!feedOptions) return;

  const filteredPages = pagesMetadata.filter(({ path }) => path.startsWith(feedOptions.path));
  if (filteredPages.length === 0) return;

  for (const format of options.formats) {
    const { rss, atom, json1 } = await generateFeeds(filteredPages, {
      ext: format === 'gemini' ? '.gmi' : '.html',
      baseUrl: `${format === 'gemini' ? 'gemini://' : 'https://'}${feedOptions.domain}/`,
      path: feedOptions.path,
      author: options.author || '',
      title: feedOptions.title,
      description: feedOptions.description,
    });
    const formattedOutputDir = path.join(outputDir, format);
    await fs.writeFile(path.join(formattedOutputDir, `${feedOptions.path}/rss.xml`), rss);
    await fs.writeFile(path.join(formattedOutputDir, `${feedOptions.path}/atom.xml`), atom);
    await fs.writeFile(path.join(formattedOutputDir, `${feedOptions.path}/json1.json`), json1);
  }
}
