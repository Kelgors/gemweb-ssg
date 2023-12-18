import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import recursive from "recursive-readdir";
import { FORMATS, renderMarkdown, renderTemplate } from "./render";
import {
  FileArticleMetadata,
  articleMetadataSchema,
  generateFeeds,
} from "./rss";

export async function build(inputDir: string, outputDir: string) {
  const inputDirReg = new RegExp(`^${inputDir}`);
  const files = await recursive(inputDir);
  const articlesMetadata: FileArticleMetadata[] = [];

  for (const fullpath of files) {
    if (!fullpath.endsWith(".md")) {
      // ignore dotfiles
      if (path.basename(fullpath).startsWith(".")) {
        console.info("Ignoring(file: %s)", fullpath);
        continue;
      }
      // copy file foreach formats
      for (const format of FORMATS) {
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
    articlesMetadata.push({
      filename: fullpath,
      path: fullpath.replace(inputDirReg, ""),
      metadata,
    });

    if (typeof metadata.lang === "undefined") metadata.lang = "en";
    if (typeof metadata.type === "undefined") metadata.type = "website";
    if (typeof metadata.author === "undefined") metadata.author = "Kelgors";

    for (const format of FORMATS) {
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

  for (const format of FORMATS) {
    const { rss, atom } = await generateFeeds(articlesMetadata, {
      ext: format === "gemini" ? ".gmi" : ".html",
      baseUrl: `${
        format === "gemini" ? "gemini://" : "https://www."
      }kelgors.me/`,
    });
    const formattedOutputDir = path.join(outputDir, format);
    await fs.writeFile(path.join(formattedOutputDir, "rss.xml"), rss);
    await fs.writeFile(path.join(formattedOutputDir, "atom.xml"), atom);
  }
}
