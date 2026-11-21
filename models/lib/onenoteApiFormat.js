// Microsoft OneNote, as models/lib/apiImport/onenote.js fetches it from
// Microsoft Graph, read into WeKan's normalized board, and a board written
// as OneNote pages. Plain JavaScript without Meteor, so
// tests/onenoteApiImport.test.cjs runs the round trip in Node.
//
//   { onenote: true, notebooks: [{ id, displayName, sections: [{ id,
//     displayName, pages: [{ id, title, level, order, createdDateTime,
//     content }] }] }] }
//
// content is the page's HTML as GET /me/onenote/pages/{id}/content answers
// it: <html><head><title>, <meta name="created">, then <body> with a <div>
// per outline, paragraphs, lists, tables, <img> and <object> for files, and
// a note tag as data-tag on an element - "to-do" an open to-do box,
// "to-do:completed" a ticked one.
//
// A section is a list, a notebook a swimlane (the board is named after the
// notebook when there is one), a page a card: its text the description, its
// to-do boxes a "To-do" checklist, and a subpage (level 1, 2) a subtask of
// the page above it. Images and files have no WeKan place and are counted.
//
// Export: a .zip of one XHTML page per card, each as Graph's "create page"
// (POST /me/onenote/sections/{id}/pages) takes it - <title>, <meta
// name="created">, paragraphs and to-do boxes - under
// <notebook>/<section>/, with onenote.json beside them: the same pages in
// the shape above, which the import reads back. The XHTML is written after
// the export boundary (onenoteArchiveFiles).

import { vikunjaHtmlToText } from './vikunjaFormat.js';

export const MAX_ONENOTE_PAGES = 20000;
const TODO_CHECKLIST = 'To-do';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = value => (typeof value === 'string' ? value : '');
const list = value => (Array.isArray(value) ? value : []);
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
  if (code[0] === '#') {
    const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
  }
  return ENTITIES[code.toLowerCase()] ?? whole;
});
const stripTags = html => {
  let out = String(html || '');
  let prev;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return decode(out).replace(/\s+/g, ' ').trim();
};

// A page's HTML: { text, todos: [{ title, done }], images, files, created }.
export function onenotePage(html) {
  const created = (/<meta\s+name="created"\s+content="([^"]+)"/i.exec(str(html)) || [])[1] || '';
  let source = str(html);
  let prev;
  do {
    prev = source;
    source = source.replace(/<(head|style|script)\b[\s\S]*?<\/\1\s*>/gi, '');
  } while (source !== prev);
  source = source.replace(/<!--[\s\S]*?-->/g, '').replace(/<![^>]*>/g, '').replace(/<\?[\s\S]*?\?>/g, '');
  const todos = [];
  source = source.replace(/<(p|li|span|div|h[1-6])\b([^>]*\bdata-tag="([^"]*)"[^>]*)>([\s\S]*?)<\/\1\s*>/gi, (whole, tag, attrs, tags, inner) => {
    const kinds = tags.split(',').map(t => t.trim());
    const todo = kinds.find(t => /^to-do(:completed)?$/i.test(t));
    if (!todo) return whole;
    const title = stripTags(inner);
    if (title) todos.push({ title, done: /:completed$/i.test(todo) });
    return '';
  });
  const images = (source.match(/<img\b/gi) || []).length;
  const files = (source.match(/<object\b/gi) || []).length;
  source = source.replace(/<(img|object)\b[^>]*>(<\/object>)?/gi, '');
  const text = vikunjaHtmlToText(source, { checklists: false }).text;
  return { text, todos, images, files, created };
}

export function parseOnenoteApi(input) {
  let data = input;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (error) { throw new Error('OneNote data is not valid JSON'); }
  }
  if (!isObject(data) || data.onenote !== true || !Array.isArray(data.notebooks)) {
    throw new Error('OneNote data must be what the OneNote import fetched: { onenote: true, notebooks: [...] }');
  }
  const total = data.notebooks.reduce((sum, nb) => sum + list(nb && nb.sections).reduce((s, sec) => s + list(sec && sec.pages).length, 0), 0);
  if (total > MAX_ONENOTE_PAGES) throw new Error(`OneNote data has more than ${MAX_ONENOTE_PAGES} pages`);
  const notebooks = data.notebooks.filter(isObject);
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  const unsupported = [];
  let images = 0;
  let files = 0;
  notebooks.forEach((notebook, b) => {
    const swimlane = notebooks.length > 1 ? (str(notebook.displayName).trim() || `Notebook ${b + 1}`) : 'Default';
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    list(notebook.sections).filter(isObject).forEach(section => {
      const column = str(section.displayName).trim() || 'Section';
      if (!columns.includes(column)) columns.push(column);
      const above = [];
      list(section.pages).filter(isObject).slice().sort((x, y) => (Number(x.order) || 0) - (Number(y.order) || 0))
        .forEach((page, p) => {
          const parsed = onenotePage(page.content);
          images += parsed.images;
          files += parsed.files;
          const ref = str(page.id) || `${b}.${column}.${p}`;
          const level = Math.max(0, Math.min(2, Number(page.level) || 0));
          const parent = level ? above[level - 1] || '' : '';
          above[level] = ref;
          above.length = level + 1;
          const created = str(page.createdDateTime) || parsed.created;
          tasks.push({
            title: str(page.title).trim() || 'Untitled page',
            description: parsed.text,
            column_name: column,
            swimlane_name: swimlane,
            tags: [],
            ref,
            ...(parent ? { parent_ref: parent } : {}),
            ...(created && !Number.isNaN(Date.parse(created)) ? { date_creation: new Date(created).toISOString() } : {}),
            ...(parsed.todos.length ? { checklists: [{ title: TODO_CHECKLIST, items: parsed.todos }] } : {}),
          });
        });
    });
  });
  if (!columns.length) throw new Error('OneNote data has no sections');
  if (images) unsupported.push({ path: '/pages/images', reason: `${images} image(s) on OneNote pages are not imported` });
  if (files) unsupported.push({ path: '/pages/files', reason: `${files} file(s) on OneNote pages are not imported` });
  return {
    board: { name: notebooks.length === 1 ? str(notebooks[0].displayName).trim() || 'OneNote' : 'Imported OneNote' },
    columns: columns.map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// ------------------------------------------------------------------ export ---

const esc = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const slug = (value, fallback) => (String(value || '').normalize('NFKD').replace(/[^\w\s-]+/g, '').trim()
  .replace(/\s+/g, '-').slice(0, 60)) || fallback;

// One card as the XHTML Graph's create page takes.
export function onenotePageHtml(item) {
  const created = item.createdAt && !Number.isNaN(Date.parse(item.createdAt)) ? new Date(item.createdAt).toISOString() : '';
  const paragraphs = String(item.description || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `    <p>${p.split('\n').map(esc).join('<br />')}</p>`);
  const todos = list(item.checklists).flatMap(c => list(c && c.items))
    .map(entry => `    <p data-tag="${entry.done ? 'to-do:completed' : 'to-do'}">${esc(String(entry.title || '').trim())}</p>`);
  return [
    '<!DOCTYPE html>',
    '<html>',
    '  <head>',
    `    <title>${esc(String(item.title || '').trim() || 'Untitled page')}</title>`,
    ...(created ? [`    <meta name="created" content="${created}" />`] : []),
    '  </head>',
    '  <body>',
    ...paragraphs,
    ...todos,
    '  </body>',
    '</html>',
    '',
  ].join('\n');
}

// The board as OneNote, in two steps. formatOnenote makes the notebook of
// plain values - a section per list, a page per card in order, each subtask a
// subpage under its parent - which passes the export boundary like every
// other format's document. onenoteArchiveFiles then writes the pages' XHTML
// from those checked values, after the boundary: written before it, the
// boundary's HTML sanitizer took the pages' <html>, <head>, <title> and <meta>
// apart, as Vikunja's archive HTML is made after it for the same reason.
export function formatOnenote(collected = {}) {
  const items = list(collected.items);
  const board = String((collected.board && collected.board.title) || 'WeKan board');
  const names = [];
  const byList = new Map();
  for (const item of items) {
    const name = String(item.listTitle || 'Section');
    if (!byList.has(name)) { byList.set(name, []); names.push(name); }
    byList.get(name).push(item);
  }
  const sections = names.map(name => {
    const cards = byList.get(name);
    const ids = new Set(cards.map(c => c.cardId));
    const kids = new Map();
    const roots = [];
    for (const card of cards) {
      if (card.parentCardId && ids.has(card.parentCardId) && card.parentCardId !== card.cardId) {
        if (!kids.has(card.parentCardId)) kids.set(card.parentCardId, []);
        kids.get(card.parentCardId).push(card);
      } else roots.push(card);
    }
    const pages = [];
    const seen = new Set();
    const walk = (card, level) => {
      if (seen.has(card.cardId)) return;
      seen.add(card.cardId);
      pages.push({
        title: String(card.title || '').trim() || 'Untitled page',
        description: String(card.description || ''),
        level: Math.min(level, 2),
        ...(card.createdAt ? { createdAt: card.createdAt } : {}),
        todos: list(card.checklists).flatMap(c => list(c && c.items))
          .map(entry => ({ title: String((entry && entry.title) || '').trim(), done: Boolean(entry && entry.done) })),
      });
      for (const kid of kids.get(card.cardId) || []) walk(kid, level + 1);
    };
    roots.forEach(card => walk(card, 0));
    cards.forEach(card => walk(card, 0));
    return { name, pages };
  });
  return { onenote: true, title: board, sections };
}

// formatOnenote's notebook as the .zip's files: a page per card under
// <board>/<list>/ and onenote.json - the same pages in the shape the import
// reads. Only these paths are written.
export function onenoteArchiveFiles(built = {}) {
  const files = {};
  if (!isObject(built) || built.onenote !== true) return files;
  const board = String(built.title || 'WeKan board');
  const notebook = { id: 'wekan', displayName: board, sections: [] };
  const book = slug(board, 'notebook');
  list(built.sections).filter(isObject).forEach((section, s) => {
    const name = String(section.name || 'Section');
    const out = { id: `section-${s + 1}`, displayName: name, pages: [] };
    const folder = `${book}/${String(s + 1).padStart(2, '0')}-${slug(name, 'section')}`;
    list(section.pages).filter(isObject).forEach((page, p) => {
      const html = onenotePageHtml({ title: page.title, description: page.description, createdAt: page.createdAt,
        checklists: [{ items: list(page.todos) }] });
      files[`${folder}/${String(p + 1).padStart(4, '0')}-${slug(page.title, 'page')}.html`] = html;
      out.pages.push({ id: `page-${s + 1}-${p + 1}`, title: String(page.title || '').trim() || 'Untitled page',
        level: Math.max(0, Math.min(2, Number(page.level) || 0)), order: p,
        ...(page.createdAt ? { createdDateTime: page.createdAt } : {}), content: html });
    });
    notebook.sections.push(out);
  });
  files['onenote.json'] = JSON.stringify({ onenote: true, notebooks: [notebook] });
  return files;
}
