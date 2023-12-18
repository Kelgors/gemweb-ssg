# gemweb-ssg

Generate an HTTP website and Gemini capsule from markdown.

```sh
yarn # or npm install
yarn build # or npm run build
yarn install --prod # or npm install --omit dev
sudo bin/install
# gemweb <source directory> <destination directory>
gemweb content public
```

Using this filesystem structure:

```
- website
|- content
  |- index.md
  |- about.md
|- partials
  |- template.gmi.hbs
  |- template.html.hbs
```

## Template variables & helpers

### helpers

- `{{formatDate metadata.created_at}}` format a date to YYYY-MM-DD
- `{{join array 'separator'}}` format the following array `[1,2,3]` to `1separator2separator3`
- `{{slug meta.title}}` transform the argument to a url friendly, lowercased equivalent

### variables

- `{{{ content }}}` should be the page content
- `{{ path }}` should be the page pathname
- `{{ format }}` could be gemini or html
- `{{ isArticle }}` if your metadata.type is article
- `{{ isWebsite }}` if your metadata.type is website or undefined
- `{{ meta }}` should be your markdown metadata

### Gemini partial example

```gmi
# {{meta.title}}

{{formatDate meta.created_at}}

{{{content}}}

{{#if meta.tags}}> Tags: {{join meta.tags}}{{/if}}
{{#if meta.updated_at}}> Last-Updated: {{formatDate meta.updated_at}}{{/if}}
```

### Html partial example

```html
<!DOCTYPE html>
<html lang="{{meta.lang}}">
  <head>
    <title>{{meta.page}}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="{{ meta.author }}" />
    {{#if meta.description}}
    <meta name="description" content="{{ meta.description }}" />
    {{/if}} {{#if meta.tags}}
    <meta name="keywords" content="{{join meta.tags ',' }}" />
    {{/if}}
  </head>
  <body>
    <main>
      <h1 id="{{slug meta.title }}">{{meta.title}}</h1>
      {{#if isArticle}}
      <p>
        <time datetime="{{formatDate meta.created_at}}T12:00:00.000Z">
          {{formatDate meta.created_at}} :: {{meta.author}}
        </time>
      </p>
      {{/if}}
      <div>{{{ content }}}</div>
      <p>
        Last-Updated:
        <time datetime="{{formatDate meta.updated_at}}T12:00:00.000Z">
          {{formatDate meta.updated_at}}
        </time>
      </p>
    </main>
  </body>
</html>
```
