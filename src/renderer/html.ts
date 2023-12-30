import { Renderer, type RendererApi } from 'marked';
import slugify from 'slugify';

export const htmlRenderer: Partial<RendererApi> = {
  heading(text, level, raw) {
    const slug = slugify(text, { lower: true });
    return [`<h${level}>`, `<a name="${slug}" class="anchor" href="#${slug}">`, text, `</a>`, `</h${level}>`].join('');
  },
  listitem(text, task, checked) {
    const li = Renderer.prototype.listitem.call(this, text, task, checked);
    if (/^\<[ap][ \>]/.test(text)) {
      return li.replace(/^\<li([ \>])/, '<li class="linkitem"$1');
    }
    return li;
  },
  // INLINE
  link(href, title, text) {
    const processedHref = href.replace(/\.md$/, '.html');
    const targetAttr = /http[s]?:\/\//.test(processedHref) ? ' target="_blank"' : '';
    return `<a href="${processedHref}" title="${title || text || ''}"${targetAttr}>${text || processedHref}</a>`;
  },
};
