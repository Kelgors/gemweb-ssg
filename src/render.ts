import handlebars from "handlebars";
import { marked } from "marked";
import fs from "node:fs/promises";
import path from "node:path";
import { default as slugify } from "slugify";
import { gmiRenderer } from "./renderer/gemini";
import { htmlRenderer } from "./renderer/html";
import { PageMetadata } from "./schema";

handlebars.registerHelper("formatDate", function(date) {
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
});
handlebars.registerHelper("join", function(array, separator = " ") {
  return array.join(typeof separator === "string" ? separator : " ");
});
handlebars.registerHelper("slug", function(text) {
  return slugify(text, { lower: true });
});
handlebars.registerHelper("replace", function(text, pattern, b) {
  return text.replace(new RegExp(pattern), b);
});

export type FormatType = "html" | "gemini";
export type RenderMarkdownOptions = {
  format: FormatType;
};

export function renderMarkdown(
  markdown: string,
  options: RenderMarkdownOptions
) {
  return marked.parse(markdown, {
    async: true,
    gfm: true,
    breaks: true,
    renderer: Object.assign(
      new marked.Renderer(),
      options.format === "gemini" ? gmiRenderer : htmlRenderer
    ),
  });
}

export type RenderTemplateOptions = {
  format: FormatType;
  ext: string;
  sourcePath: string;
  relativePath: string;
  metadata: PageMetadata;
};
export async function renderTemplate(
  body: string,
  options: RenderTemplateOptions
) {
  const template = await fs.readFile(
    path.join(
      path.normalize(path.join(options.sourcePath, "../partials")),
      `/template${options.ext}.hbs`
    )
  );
  return handlebars.compile(template.toString("utf-8"))({
    content: body.trim(),
    path: options.relativePath.replace(/\.md$/, options.ext),
    format: options.format,
    isArticle: options.metadata.type === "article",
    isWebsite: options.metadata.type === "website",
    meta: options.metadata,
  });
}
