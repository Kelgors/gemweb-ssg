import he from 'he';
import { type RendererApi } from 'marked';
import { table } from 'table';

export const gmiRenderer: RendererApi = {
  code(code, infostring, escaped) {
    return ['```', code, '```'].join('\n') + '\n\n';
  },
  blockquote(quote) {
    return (
      quote
        .split('\n')
        .map((line) => `> ${he.decode(line)}`)
        .join('\n') + '\n'
    );
  },
  html(html, block) {
    return html
      .replace(/\<!--.*--\>/g, '')
      .trim()
      .replace(/\<br\>/g, '\n');
  },
  heading(text, level, raw) {
    return `${new Array(level).fill('#').join('')} ${he.decode(text)}\n\n`;
  },
  hr() {
    return '---';
  },
  list(body, ordered, start) {
    return body + '\n';
  },
  listitem(text, task, checked) {
    const listitem = ['*', `[${checked ? 'x' : ' '}]`, he.decode(text).trim(), '\n'];
    if (!task) listitem.splice(1, 1);
    if (text.startsWith('=> ')) listitem.splice(0, 1);
    return listitem.join(' ');
  },
  checkbox(checked) {
    return checked ? 'x' : ' ';
  },
  paragraph(text) {
    return [he.decode(text).trim(), '\n', '\n'].join('');
  },
  table(header, body) {
    const data = [...JSON.parse(`[${header.slice(0, -1)}]`), ...JSON.parse(`[${body.slice(0, -1)}]`)];
    return table(data) + '\n';
  },
  tablerow(content) {
    return `[${content.slice(0, -1)}],`;
  },
  tablecell(text, flags) {
    return JSON.stringify(he.decode(text)) + ',';
  },
  // INLINE
  strong(text) {
    return `**${he.decode(text)}**`;
  },
  em(text) {
    return `*${he.decode(text)}*`;
  },
  codespan(text) {
    return `\`${he.decode(text)}\``;
  },
  br() {
    return '\n';
  },
  del(text) {
    return `~~${he.decode(text)}~~`;
  },
  link(href, title, text) {
    const processedHref = href.replace(/\.md$/, '.gmi');
    return `=> ${processedHref} ${text ? he.decode(text) : processedHref}`;
  },
  image(href, title, text) {
    return `=> ${href} ${he.decode(text)}`;
  },
  text(text) {
    return he.decode(text);
  },
};
