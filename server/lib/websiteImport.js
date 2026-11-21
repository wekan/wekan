'use strict';
// Server-only: the website imports of the Import page
// (docs/Features/Board-Sidebar/Board-Settings/Import-Export/Website/Website.md). Each
// reader turns one format into the plain items models/lib/websiteFormat.js
// makes a board of. The XML is parsed with htmlparser2 (as Evernote's and
// OPML's are); a .zip is opened by server/lib/chatArchives.js openZip, with its
// size limits. Nothing a site's HTML says is run: it is read as text and
// turned into Markdown.
const { parseDocument, DomUtils } = require('htmlparser2');

const MAX_TEXT = 256 * 1024 * 1024;
const MAX_ITEMS = 50000;
const MAX_FILE = 64 * 1024 * 1024;
const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico|pdf|mp4|webm|mp3|ogg)$/i;

const str = value => (typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value));

function text(value, what) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Paste or choose the ${what}`);
  if (value.length > MAX_TEXT) throw new Error(`The ${what} is larger than ${MAX_TEXT} bytes`);
  return value;
}

const xmlDoc = value => parseDocument(value, { xmlMode: true, decodeEntities: true });
const children = (node, name) => (node && node.children ? node.children.filter(c => c.type === 'tag' && c.name === name) : []);
const child = (node, name) => children(node, name)[0];
const textOf = node => (node ? DomUtils.textContent(node).trim() : '');
const findAll = (doc, name) => DomUtils.findAll(n => n.name === name, doc.children);

// WordPress's MySQL time, in UTC: "2024-01-02 03:04:05".
const gmt = value => {
  const v = str(value).trim();
  if (!v || v.startsWith('0000')) return undefined;
  const d = new Date(`${v.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

// ---------------------------------------------------------------- WordPress WXR

/** WordPress eXtended RSS (Tools → Export, and Squarespace, Wix and others that write it). */
function readWxr(value) {
  const doc = xmlDoc(text(value, 'WordPress export (.xml)'));
  const channel = findAll(doc, 'channel')[0];
  if (!channel || !findAll(doc, 'wp:post_type').length) throw new Error('Not a WordPress export: it has no WordPress items');
  const items = [];
  let other = 0;
  for (const node of children(channel, 'item')) {
    const type = textOf(child(node, 'wp:post_type'));
    if (!['post', 'page'].includes(type)) { if (type !== 'nav_menu_item') other += 1; continue; }
    const status = textOf(child(node, 'wp:status'));
    if (status === 'trash' || status === 'auto-draft' || status === 'inherit') continue;
    const cats = children(node, 'category');
    items.push({
      type, status: ['publish', 'draft', 'pending', 'future', 'private'].includes(status) ? status : 'draft',
      title: textOf(child(node, 'title')), html: textOf(child(node, 'content:encoded')),
      date: gmt(textOf(child(node, 'wp:post_date_gmt'))) || (textOf(child(node, 'pubDate')) ? new Date(textOf(child(node, 'pubDate'))).toISOString() : undefined),
      author: textOf(child(node, 'dc:creator')), slug: textOf(child(node, 'wp:post_name')),
      ref: textOf(child(node, 'wp:post_id')), parentRef: textOf(child(node, 'wp:post_parent')) !== '0' ? textOf(child(node, 'wp:post_parent')) : '',
      categories: cats.filter(c => c.attribs && c.attribs.domain === 'category').map(textOf),
      tags: cats.filter(c => c.attribs && c.attribs.domain === 'post_tag').map(textOf),
      comments: children(node, 'wp:comment').filter(c => textOf(child(c, 'wp:comment_approved')) === '1').map(c => ({
        author: textOf(child(c, 'wp:comment_author')), html: textOf(child(c, 'wp:comment_content')),
        date: gmt(textOf(child(c, 'wp:comment_date_gmt'))),
      })),
    });
    if (items.length >= MAX_ITEMS) break;
  }
  const unsupported = other ? [{ path: '/attachments', reason: `${other} media file(s) and other items are not imported: their pages link to them where they are` }] : [];
  return { items, name: textOf(child(channel, 'title')) || 'Imported WordPress', unsupported };
}

// ---------------------------------------------------------------- WordPress REST API

/** /wp-json/wp/v2/posts and /pages as JSON: an array, or { posts, pages }. */
function readWordPressJson(value) {
  const data = typeof value === 'string' ? JSON.parse(text(value, 'WordPress JSON')) : value;
  const list = Array.isArray(data) ? data : [...(data && data.posts) || [], ...(data && data.pages) || []];
  if (!list.length || !list.every(p => p && p.title && p.content && 'rendered' in p.content)) {
    throw new Error('Not WordPress REST API JSON: posts with title.rendered and content.rendered');
  }
  const termName = p => ((p._embedded && p._embedded['wp:term']) || []).flat().map(t => t && t.name).filter(Boolean);
  return {
    name: 'Imported WordPress',
    unsupported: [],
    items: list.slice(0, MAX_ITEMS).map(p => ({
      type: p.type === 'page' ? 'page' : 'post', status: ['publish', 'draft', 'pending', 'future', 'private'].includes(p.status) ? p.status : 'draft',
      title: htmlToText(str(p.title.rendered)), html: str(p.content.rendered), date: p.date_gmt ? `${p.date_gmt}Z` : p.date, slug: p.slug,
      ref: str(p.id), parentRef: p.parent ? str(p.parent) : '', tags: Array.isArray(p.tags_names) ? p.tags_names : termName(p),
      author: str(p.author_name || ''),
    })),
  };
}

function htmlToText(html) {
  return DomUtils.textContent(parseDocument(str(html), { decodeEntities: true })).trim();
}

// ---------------------------------------------------------------- Ghost

const GHOST_STATUS = { published: 'publish', draft: 'draft', scheduled: 'future', sent: 'publish' };
/** Ghost's export (Settings → Labs → Export your content). */
function readGhost(value) {
  const data = typeof value === 'string' ? JSON.parse(text(value, 'Ghost export')) : value;
  const db = (data && Array.isArray(data.db) ? data.db[0] : data) || {};
  const d = db.data || (db.posts ? db : null);
  if (!d || !Array.isArray(d.posts)) throw new Error('Not a Ghost export: it has no posts');
  const tags = new Map((d.tags || []).map(t => [t.id, t.name]));
  const users = new Map((d.users || []).map(u => [u.id, u.name]));
  const tagsOf = new Map();
  for (const pt of d.posts_tags || []) {
    if (!tagsOf.has(pt.post_id)) tagsOf.set(pt.post_id, []);
    if (tags.has(pt.tag_id)) tagsOf.get(pt.post_id).push(tags.get(pt.tag_id));
  }
  const authorOf = new Map((d.posts_authors || []).map(pa => [pa.post_id, users.get(pa.author_id)]));
  return {
    name: (d.settings || []).find(s => s.key === 'title')?.value || 'Imported Ghost',
    unsupported: [],
    items: d.posts.slice(0, MAX_ITEMS).map(p => ({
      type: p.type === 'page' || p.page === true || p.page === 1 ? 'page' : 'post',
      status: p.visibility && p.visibility !== 'public' && p.status === 'published' ? 'private' : (GHOST_STATUS[p.status] || 'draft'),
      title: str(p.title), ...(p.html ? { html: p.html } : { markdown: str(p.plaintext || '') }),
      date: p.published_at || p.created_at, slug: p.slug, ref: str(p.id), tags: tagsOf.get(p.id) || [],
      author: authorOf.get(p.id) || users.get(p.author_id) || '',
    })),
  };
}

// ---------------------------------------------------------------- Blogger

/** Blogger's backup (Settings → Back up content, or Google Takeout): an Atom feed. */
function readBlogger(value) {
  const doc = xmlDoc(text(value, 'Blogger export (.xml)'));
  const feed = findAll(doc, 'feed')[0];
  if (!feed || !/blogger/i.test(textOf(child(feed, 'id')) + findAll(doc, 'category').map(c => (c.attribs || {}).term).join(' '))) {
    throw new Error('Not a Blogger export: an Atom feed of blogger.com entries');
  }
  const kindOf = entry => {
    const c = children(entry, 'category').find(x => /#kind$/.test((x.attribs || {}).scheme || ''));
    return c ? String(c.attribs.term).split('#').pop() : '';
  };
  // Takeout's newer feed names the kind in <blogger:type>.
  const typeOf = entry => kindOf(entry) || textOf(child(entry, 'blogger:type')).toLowerCase();
  const entries = children(feed, 'entry');
  const comments = new Map();
  for (const e of entries.filter(x => typeOf(x) === 'comment')) {
    const reply = child(e, 'thr:in-reply-to');
    const ref = reply ? reply.attribs.ref : textOf(child(e, 'blogger:parent'));
    if (!comments.has(ref)) comments.set(ref, []);
    comments.get(ref).push({ author: textOf(child(child(e, 'author'), 'name')), html: textOf(child(e, 'content')), date: textOf(child(e, 'published')) });
  }
  const items = entries.filter(x => ['post', 'page'].includes(typeOf(x))).slice(0, MAX_ITEMS).map(e => {
    const id = textOf(child(e, 'id'));
    const draft = /yes/i.test(textOf(child(child(e, 'app:control'), 'app:draft'))) || /draft/i.test(textOf(child(e, 'blogger:status')));
    return {
      type: typeOf(e), status: draft ? 'draft' : 'publish', title: textOf(child(e, 'title')), html: textOf(child(e, 'content')),
      date: textOf(child(e, 'published')), author: textOf(child(child(e, 'author'), 'name')), ref: id,
      tags: children(e, 'category').filter(c => /atom\/ns#$/.test((c.attribs || {}).scheme || '')).map(c => c.attribs.term),
      comments: comments.get(id) || [],
    };
  });
  return { items, name: textOf(child(feed, 'title')) || 'Imported Blogger', unsupported: [] };
}

// ---------------------------------------------------------------- Markdown sites

// Front matter: YAML between --- lines, or TOML between +++ (Hugo). Only the
// plain keys a page has - a string, a number, a boolean, a date, a list.
function frontMatter(source) {
  const m = /^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/.exec(source);
  if (!m) return { meta: {}, body: source };
  const meta = {};
  let listKey = null;
  for (const line of m[2].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) { meta[listKey].push(unquote(item[1])); continue; }
    const kv = m[1] === '+++' ? /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/.exec(line) : /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const raw = kv[2].trim();
    if (raw === '') { meta[key] = []; listKey = key; continue; }
    listKey = null;
    meta[key] = /^\[.*\]$/.test(raw) ? raw.slice(1, -1).split(',').map(unquote).filter(Boolean) : unquote(raw);
  }
  return { meta, body: source.slice(m[0].length) };
}

function unquote(value) {
  const v = str(value).trim().replace(/\s+#.*$/, '');
  if (/^"(.*)"$/.test(v)) { try { return JSON.parse(v); } catch (e) { return v.slice(1, -1); } }
  if (/^'(.*)'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

const list = value => (Array.isArray(value) ? value : value ? [value] : []).map(str).filter(Boolean);
const isTrue = value => value === true || /^(true|yes|1)$/i.test(str(value));

async function zipFiles(value, what) {
  const { openZip } = require('./chatArchives');
  const { entries, read, bytes } = await openZip(value, what);
  return { entries: entries.filter(e => !/(^|\/)(\.|__MACOSX)/.test(e.path)), read, bytes };
}

// The files of a page: those in the zip its text names, by path or by file
// name, attached to its card.
async function attachedFiles(body, entries, bytes, dir) {
  const out = [];
  const seen = new Set();
  const refs = [...str(body).matchAll(/(?:\]\(|src=["']|href=["'])([^)"'\s]+)/g)].map(m => decodeURIComponent(m[1].split(/[?#]/)[0]))
    .filter(r => !/^[a-z]+:/i.test(r) && IMAGE.test(r));
  for (const ref of refs) {
    const name = ref.split('/').pop();
    const clean = ref.replace(/^\.?\//, '');
    const entry = entries.find(e => e.path === clean || e.path === `${dir}${clean}` || e.path.endsWith(`/${clean}`))
      || entries.find(e => e.path.split('/').pop() === name);
    if (!entry || seen.has(entry.path) || Number(entry.size) > MAX_FILE) continue;
    seen.add(entry.path);
    out.push({ name, file: (await bytes(entry)).toString('base64') });
  }
  return out;
}

/**
 * A static site generator's sources as a .zip: Hugo's content/, Jekyll's
 * _posts and pages, Eleventy, Astro, Gatsby, Docusaurus, MkDocs - Markdown
 * files with front matter. Files under a posts/blog folder (or with a date in
 * the name) are posts, the rest pages.
 */
async function readMarkdownSite(value) {
  const { entries, read, bytes } = await zipFiles(value, 'Markdown site .zip');
  const md = entries.filter(e => /\.(md|markdown|mdx)$/i.test(e.path) && !/(^|\/)(node_modules|README\.md$|LICENSE)/i.test(e.path));
  if (!md.length) throw new Error('The .zip has no Markdown pages (.md)');
  const items = [];
  for (const entry of md.slice(0, MAX_ITEMS)) {
    const { meta, body } = frontMatter(String(await read(entry)));
    const file = entry.path.split('/').pop().replace(/\.(md|markdown|mdx)$/i, '');
    const dated = /^(\d{4}-\d\d-\d\d)-(.+)$/.exec(file);
    const isPost = /(^|\/)(_posts|posts|blog|articles|news)\//i.test(entry.path) || !!dated || meta.layout === 'post' || meta.type === 'post';
    const dir = entry.path.split('/').slice(0, -1).join('/');
    items.push({
      type: meta.type === 'page' || meta.layout === 'page' ? 'page' : (isPost ? 'post' : 'page'),
      status: isTrue(meta.draft) || meta.published === 'false' || meta.published === false ? 'draft' : 'publish',
      title: str(meta.title) || (dated ? dated[2] : file).replace(/[-_]+/g, ' '), markdown: body.trim(),
      date: str(meta.date) || (dated ? dated[1] : undefined), slug: str(meta.slug) || (dated ? dated[2] : file),
      tags: list(meta.tags), categories: list(meta.categories), author: str(meta.author),
      attachments: await attachedFiles(body, entries, bytes, dir ? `${dir}/` : ''),
    });
  }
  return { items, name: 'Imported website', unsupported: [] };
}

// The main text of an HTML page: its <main>, <article> or <body>, without
// scripts, styles, navigation, headers and footers.
function pageContent(html) {
  const doc = parseDocument(str(html), { decodeEntities: true });
  const drop = DomUtils.findAll(n => ['script', 'style', 'noscript', 'nav', 'header', 'footer', 'iframe', 'form'].includes(n.name), doc.children);
  for (const n of drop) DomUtils.removeElement(n);
  const pick = name => DomUtils.findOne(n => n.name === name, doc.children);
  const main = pick('main') || pick('article') || pick('body') || doc;
  const title = textOf(pick('title')) || textOf(DomUtils.findOne(n => n.name === 'h1', main.children || []));
  const h1 = DomUtils.findOne(n => n.name === 'h1', main.children || []);
  if (h1 && textOf(h1) === title) DomUtils.removeElement(h1);
  const time = DomUtils.findOne(n => n.name === 'time' && n.attribs && n.attribs.datetime, doc.children);
  return { title, html: DomUtils.getInnerHTML(main), date: time ? time.attribs.datetime : undefined };
}

/**
 * A website's files as a .zip: every .html page, its images and files with
 * it. Also Medium's export (posts/*.html) and a site saved with wget or
 * HTTrack. index.html is the first page; pages under posts/ or blog/ are posts.
 */
async function readHtmlSite(value) {
  const { entries, read, bytes } = await zipFiles(value, 'website .zip');
  const html = entries.filter(e => /\.html?$/i.test(e.path));
  if (!html.length) throw new Error('The .zip has no web pages (.html)');
  html.sort((a, b) => (/(^|\/)index\.html?$/i.test(b.path) - /(^|\/)index\.html?$/i.test(a.path)) || a.path.localeCompare(b.path));
  const items = [];
  for (const entry of html.slice(0, MAX_ITEMS)) {
    const page = pageContent(String(await read(entry)));
    const file = entry.path.split('/').pop().replace(/\.html?$/i, '');
    const dir = entry.path.split('/').slice(0, -1).join('/');
    // Medium names a draft draft_<title>.html.
    const draft = /^draft_/i.test(file);
    items.push({
      type: /(^|\/)(posts|blog|articles|news)\//i.test(entry.path) ? 'post' : 'page',
      status: draft ? 'draft' : 'publish', title: page.title || file.replace(/[-_]+/g, ' '), html: page.html, date: page.date,
      slug: file, attachments: await attachedFiles(page.html, entries, bytes, dir ? `${dir}/` : ''),
    });
  }
  return { items, name: 'Imported website', unsupported: [] };
}

/** Substack's export (Settings → Exports): posts.csv and posts/<id>.html. */
async function readSubstack(value) {
  const { entries, read } = await zipFiles(value, 'Substack export .zip');
  const csv = entries.find(e => /(^|\/)posts\.csv$/i.test(e.path));
  if (!csv) throw new Error('Not a Substack export: it has no posts.csv');
  const { readCsv } = require('/models/lib/todoistCsvFormat');
  const rows = readCsv(String(await read(csv)), 'Substack');
  const head = rows[0].map(h => str(h).trim().toLowerCase());
  const col = name => head.indexOf(name);
  const items = [];
  for (const r of rows.slice(1, MAX_ITEMS + 1)) {
    const id = str(r[col('post_id')]);
    if (!id) continue;
    const entry = entries.find(e => e.path.endsWith(`posts/${id}.html`));
    items.push({
      type: 'post', status: /true/i.test(str(r[col('is_published')])) ? 'publish' : 'draft',
      title: str(r[col('title')]) || id, html: entry ? String(await read(entry)) : str(r[col('subtitle')]),
      date: str(r[col('post_date')]) || undefined, slug: id.split('.').slice(1).join('.') || id, ref: id,
    });
  }
  return { items, name: 'Imported Substack', unsupported: [] };
}

const READERS = {
  wordpress: readWxr, wordpressjson: readWordPressJson, ghost: readGhost, blogger: readBlogger,
  markdownsite: readMarkdownSite, htmlsite: readHtmlSite, substack: readSubstack,
};
const WEBSITE_SOURCES = Object.keys(READERS);

// The board of an import (models/import.js).
async function parseWebsiteImport(source, value) {
  const reader = READERS[source];
  if (!reader) throw new Error(`Unknown website source: ${source}`);
  const { items, name, unsupported } = await reader(value);
  const { siteBoard } = require('/models/lib/websiteFormat');
  return siteBoard(items, { name, unsupported });
}

module.exports = {
  parseWebsiteImport, readWxr, readWordPressJson, readGhost, readBlogger, readMarkdownSite, readHtmlSite, readSubstack,
  frontMatter, pageContent, WEBSITE_SOURCES,
};
