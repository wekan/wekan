import marked from '../marked/lib/marked.js';

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
});

Markdown = marked;
