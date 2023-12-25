import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import recursive from "recursive-readdir";
import { generateFeeds } from "./feed";
import { FormatType, renderMarkdown, renderTemplate } from "./render";
import { FilePageMetadata, PageMetadata, articleMetadataSchema } from "./schema";

type BuildOptions = { author: string; domain: string; feed: string; formats: FormatType[] };
export async function build(inputDir: string, outputDir: string, options: BuildOptions) {
  const inputDirReg = new RegExp(`^${inputDir}`);
  const files = await recursive(inputDir);
  const pagesMetadata: FilePageMetadata[] = [];

  for (const fullpath of files) {
    if (!fullpath.endsWith(".md")) {
      // ignore dotfiles
      if (path.basename(fullpath).startsWith(".")) {
        console.info("Ignoring(file: %s)", fullpath);
        continue;
      }
      // copy file foreach formats
      for (const format of options.formats) {
        const formattedOutputDir = path.join(outputDir, format);
        console.info("Copying(format: %s, file: %s)", format, fullpath);
        await fs.mkdir(
          path.dirname(fullpath).replace(inputDirReg, formattedOutputDir),
          { recursive: true }
        );
        await fs.copyFile(
          fullpath,
          fullpath.replace(inputDirReg, formattedOutputDir)
        );
      }
      continue;
    }

    const fileContent = await fs.readFile(fullpath);
    const { data, content: markdown } = matter(fileContent.toString("utf-8"));

    const result = articleMetadataSchema.safeParse(data);
    if (!result.success) {
      console.error(result.error);
      throw new Error("Unable to parse metadata of " + fullpath);
    }
    const metadata = result.data;
    pagesMetadata.push({
      filename: fullpath,
      path: fullpath.replace(inputDirReg, ""),
      metadata,
    });

    if (typeof metadata.lang === "undefined") metadata.lang = "en";
    if (typeof metadata.type === "undefined") metadata.type = "website";
    if (typeof metadata.author === "undefined") metadata.author = options.author;

    for (const format of options.formats) {
      console.info("Processing(format: %s, file: %s)", format, fullpath);
      const output = await renderMarkdown(markdown, { format });
      const ext = format === "gemini" ? ".gmi" : ".html";
      const final = await renderTemplate(output, {
        ext,
        format,
        sourcePath: inputDir,
        relativePath: fullpath.replace(inputDirReg, ""),
        metadata,
      });
      const formattedOutputDir = path.join(outputDir, format);
      await fs.mkdir(
        path.dirname(fullpath).replace(inputDirReg, formattedOutputDir),
        { recursive: true }
      );
      await fs.writeFile(
        fullpath.replace(inputDirReg, formattedOutputDir).replace(/\.md$/, ext),
        final
      );
    }
  }

  const filteredPages = pagesMetadata.filter(({ path }) => path.startsWith(options.feed))
  if (filteredPages.length === 0) return;

  for (const format of options.formats) {
    const { rss, atom, json1 } = await generateFeeds(filteredPages, {
      ext: format === "gemini" ? ".gmi" : ".html",
      baseUrl: `${format === "gemini" ? "gemini://" : "https://"
        }${options.domain}/`,
      feedPath: options.feed,
      feedAuthor: options.author
    });
    const formattedOutputDir = path.join(outputDir, format);
    await fs.writeFile(path.join(formattedOutputDir, `${options.feed}/rss.xml`), rss);
    await fs.writeFile(path.join(formattedOutputDir, `${options.feed}/atom.xml`), atom);
    await fs.writeFile(path.join(formattedOutputDir, `${options.feed}/json1.json`), json1);
  }
}
