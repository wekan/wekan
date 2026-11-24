// Websites as boards, and boards as websites
// (docs/Features/Board-Sidebar/Board-Settings/Import-Export/Website/README.md).
//
// Every website format WeKan reads is first read - on the server, by
// server/lib/websiteImport.js - into the same plain items:
//
//   { type: 'page' | 'post', title, html | markdown, status, date, author,
//     slug, tags, categories, ref, parentRef, comments: [{ author, html | text,
//     date }], attachments: [{ name, file (base64) }] }
//
// and siteBoard() below makes the board of them: a card per page or post, in
// the list of its status (Published, Draft, Pending review, Scheduled,
// Private), the swimlane Pages or Posts, its content as Markdown, its tags
// and categories as labels, its comments, its files as attachments. The
// writers do the opposite, from the items WeKan's export collects
// (models/lib/externalExporters.js): WordPress WXR, the WordPress REST API's
// JSON, Ghost's JSON, Blogger's Atom, a Markdown site (Hugo, Jekyll, Eleventy,
// Astro) and a plain HTML site. The Website board view
// (client/components/boards/websiteView.*) reads the same board.
//
// Plain JavaScript: tests/websiteFormat.test.cjs runs both directions in Node.

import MarkdownIt from 'markdown-it';
import { vikunjaHtmlToText } from './vikunjaFormat.js';

export const MAX_SITE_ITEMS = 50000;
const MAX_TEXT = 1024 * 1024;

// A site's statuses, as WordPress names them, and the lists they become.
export const STATUS_LISTS = Object.freeze({
  publish: 'Published', draft: 'Draft', pending: 'Pending review', future: 'Scheduled', private: 'Private',
});
const LIST_ORDER = ['Published', 'Draft', 'Pending review', 'Scheduled', 'Private'];
// And back: a list title to a status, in more than one language.
const LIST_STATUS = [
  [/^(published|publish|public|live|julkaistu|julkinen|veröffentlicht|publié|publicado|pubblicato)$/i, 'publish'],
  [/^(draft|drafts|luonnos|luonnokset|entwurf|brouillon|borrador|bozza)$/i, 'draft'],
  [/^(pending|pending review|review)$/i, 'pending'],
  [/^(scheduled|future|ajastettu)$/i, 'future'],
  [/^(private|yksityinen)$/i, 'private'],
];
export function statusOfList(title) {
  const t = String(title || '').trim();
  const hit = LIST_STATUS.find(([re]) => re.test(t));
  return hit ? hit[1] : 'draft';
}
export const isPublishedList = title => statusOfList(title) === 'publish';
export const isPagesSwimlane = title => /^(pages?|sivut|seiten|pagine|páginas)$/i.test(String(title || '').trim());

const str = value => (typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value));
const iso = value => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

// HTML comments, again and again until none is left (one pass leaves
// `<!-<!---->->` as a comment).
function stripComments(html) {
  let out = str(html);
  let prev;
  do {
    prev = out;
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  } while (out !== prev);
  return out;
}

// A page's content as the Markdown of a card's description.
export function contentMarkdown(item) {
  if (item.markdown !== undefined) return str(item.markdown).slice(0, MAX_TEXT).trim();
  const html = stripComments(item.html);
  return html.trim() ? vikunjaHtmlToText(html, { checklists: false }).text.slice(0, MAX_TEXT) : '';
}

export function slugify(value) {
  const s = str(value).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return s || 'page';
}

/**
 * The board of a site's items. `name` is the board's title; `unsupported`
 * what the reader could not bring (reported to the importer).
 */
export function siteBoard(items, { name = 'Imported website', unsupported = [] } = {}) {
  const list = (items || []).filter(i => i && STATUS_LISTS[i.status] && ['page', 'post'].includes(i.type));
  if (!list.length) throw new Error('The website has no pages or posts');
  const losses = [...unsupported];
  if (list.length > MAX_SITE_ITEMS) losses.push({ path: '/items', reason: `only the first ${MAX_SITE_ITEMS} pages and posts are imported` });
  const kept = list.slice(0, MAX_SITE_ITEMS);
  const columns = LIST_ORDER.filter(title => kept.some(i => STATUS_LISTS[i.status] === title));
  const swimlanes = ['Pages', 'Posts'].filter(s => kept.some(i => (i.type === 'page' ? 'Pages' : 'Posts') === s));
  const tasks = kept.map(item => ({
    title: str(item.title).trim().slice(0, 500) || `(${item.type})`,
    description: contentMarkdown(item),
    column_name: STATUS_LISTS[item.status],
    swimlane_name: item.type === 'page' ? 'Pages' : 'Posts',
    tags: [...new Set([...(item.categories || []), ...(item.tags || [])].map(t => str(t).trim()).filter(t => t && t !== 'Uncategorized'))],
    ...(item.ref ? { ref: str(item.ref) } : {}),
    ...(item.parentRef ? { parent_ref: str(item.parentRef) } : {}),
    ...(item.author ? { requested_by: str(item.author) } : {}),
    ...(iso(item.date) ? { date_creation: iso(item.date) } : {}),
    comments: (item.comments || []).map(c => ({
      text: c.text !== undefined ? str(c.text) : contentMarkdown({ html: c.html }),
      author: str(c.author), authorName: str(c.author), date: iso(c.date),
    })).filter(c => c.text.trim()),
    ...(Array.isArray(item.attachments) && item.attachments.length ? { attachments: item.attachments } : {}),
  }));
  return {
    board: { name: str(name).slice(0, 200) || 'Imported website' },
    columns: columns.map(title => ({ title })),
    swimlanes: swimlanes.map(n => ({ name: n })),
    tasks,
    warnings: [],
    unsupported: losses,
  };
}

// ---------------------------------------------------------------- writers

// What a website writer takes: the items of the export, as pages and posts.
export function siteItems(collected = {}) {
  const items = (collected.items || []).filter(i => i && !i.archived);
  return items.map((item, index) => ({
    id: index + 1,
    cardId: item.cardId,
    parentCardId: item.parentCardId,
    type: isPagesSwimlane(item.swimlaneTitle) ? 'page' : 'post',
    status: statusOfList(item.listTitle),
    title: str(item.title),
    markdown: str(item.description),
    slug: slugify(item.title),
    date: iso(item.createdAt) || iso(item.startAt) || new Date(0).toISOString(),
    author: str(item.creator || item.owner || ''),
    tags: (item.labels || []).map(str).filter(Boolean),
    comments: (item.comments || []).map(c => ({ author: str(c.author), text: str(c.text), date: iso(c.date) })),
    attachments: item.attachments || [],
  }));
}

// Markdown to the HTML a site shows: raw HTML in the Markdown is escaped,
// never passed on, so a card's text cannot script the exported site.
const md = new MarkdownIt({ html: false, linkify: true, breaks: false });
export const markdownHtml = text => md.render(str(text));

const xml = value => str(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '');
const cdata = value => `<![CDATA[${str(value).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
const sqlTime = value => (iso(value) || new Date(0).toISOString()).replace('T', ' ').slice(0, 19);
const WP_STATUS = { publish: 'publish', draft: 'draft', pending: 'pending', future: 'future', private: 'private' };

/** WordPress eXtended RSS 1.2: what Tools → Export writes and Tools → Import reads. */
export function formatWxr(collected = {}, { now = new Date() } = {}) {
  const items = siteItems(collected);
  const byCard = new Map(items.map(i => [i.cardId, i.id]));
  const title = str(collected.board && collected.board.title) || 'WeKan';
  const terms = [...new Set(items.flatMap(i => i.tags))];
  const authors = [...new Set(items.map(i => i.author).filter(Boolean))];
  const body = items.map(i => [
    '<item>',
    `<title>${xml(i.title)}</title>`,
    `<pubDate>${xml(new Date(i.date).toUTCString())}</pubDate>`,
    `<dc:creator>${cdata(i.author)}</dc:creator>`,
    `<content:encoded>${cdata(markdownHtml(i.markdown))}</content:encoded>`,
    '<excerpt:encoded><![CDATA[]]></excerpt:encoded>',
    `<wp:post_id>${i.id}</wp:post_id>`,
    `<wp:post_date_gmt>${cdata(sqlTime(i.date))}</wp:post_date_gmt>`,
    `<wp:post_name>${cdata(i.slug)}</wp:post_name>`,
    `<wp:status>${cdata(WP_STATUS[i.status])}</wp:status>`,
    `<wp:post_parent>${byCard.get(i.parentCardId) || 0}</wp:post_parent>`,
    `<wp:post_type>${cdata(i.type)}</wp:post_type>`,
    ...i.tags.map(t => `<category domain="post_tag" nicename="${xml(slugify(t))}">${cdata(t)}</category>`),
    ...i.comments.map((c, n) => ['<wp:comment>', `<wp:comment_id>${i.id * 1000 + n + 1}</wp:comment_id>`,
      `<wp:comment_author>${cdata(c.author)}</wp:comment_author>`, `<wp:comment_date_gmt>${cdata(sqlTime(c.date))}</wp:comment_date_gmt>`,
      `<wp:comment_content>${cdata(c.text)}</wp:comment_content>`, '<wp:comment_approved>1</wp:comment_approved>', '</wp:comment>'].join('')),
    '</item>',
  ].join('\n')).join('\n');
  return '<?xml version="1.0" encoding="UTF-8" ?>\n'
    + '<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/"'
    + ' xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">\n'
    + `<channel>\n<title>${xml(title)}</title>\n<pubDate>${xml(now.toUTCString())}</pubDate>\n<language>en</language>\n`
    + '<wp:wxr_version>1.2</wp:wxr_version>\n<generator>https://wekan.fi</generator>\n'
    + authors.map((a, n) => `<wp:author><wp:author_id>${n + 1}</wp:author_id><wp:author_login>${cdata(a)}</wp:author_login>`
      + `<wp:author_display_name>${cdata(a)}</wp:author_display_name></wp:author>`).join('\n') + (authors.length ? '\n' : '')
    + terms.map((t, n) => `<wp:tag><wp:term_id>${n + 1}</wp:term_id><wp:tag_slug>${cdata(slugify(t))}</wp:tag_slug>`
      + `<wp:tag_name>${cdata(t)}</wp:tag_name></wp:tag>`).join('\n') + (terms.length ? '\n' : '')
    + `${body}\n</channel>\n</rss>\n`;
}

/** The WordPress REST API's posts and pages (/wp-json/wp/v2/posts), as one JSON array. */
export function formatWordPressJson(collected = {}) {
  const items = siteItems(collected);
  const byCard = new Map(items.map(i => [i.cardId, i.id]));
  return items.map(i => ({
    id: i.id, date_gmt: i.date.slice(0, 19), slug: i.slug, status: WP_STATUS[i.status], type: i.type,
    title: { rendered: i.title }, content: { rendered: markdownHtml(i.markdown), protected: false },
    parent: byCard.get(i.parentCardId) || 0, tags_names: i.tags, author_name: i.author,
  }));
}

const GHOST_STATUS = { publish: 'published', draft: 'draft', pending: 'draft', future: 'scheduled', private: 'draft' };
/** Ghost's export (Settings → Labs → Export), which its import reads. */
export function formatGhost(collected = {}, { now = new Date() } = {}) {
  const items = siteItems(collected);
  const tagNames = [...new Set(items.flatMap(i => i.tags))];
  const tags = tagNames.map((name, n) => ({ id: String(n + 1), name, slug: slugify(name) }));
  const tagId = new Map(tags.map(t => [t.name, t.id]));
  return {
    db: [{
      meta: { exported_on: now.getTime(), version: '5.0.0' },
      data: {
        posts: items.map(i => ({
          id: String(i.id), title: i.title, slug: i.slug, html: markdownHtml(i.markdown), status: GHOST_STATUS[i.status],
          visibility: i.status === 'private' ? 'members' : 'public', type: i.type, created_at: i.date,
          published_at: i.status === 'publish' ? i.date : null,
        })),
        tags,
        posts_tags: items.flatMap(i => i.tags.map((t, n) => ({ id: `${i.id}-${n}`, post_id: String(i.id), tag_id: tagId.get(t), sort_order: n }))),
      },
    }],
  };
}

/** Blogger's export (Settings → Back up content): an Atom feed of posts, pages and comments. */
export function formatBlogger(collected = {}, { now = new Date() } = {}) {
  const items = siteItems(collected);
  const title = str(collected.board && collected.board.title) || 'WeKan';
  const entries = items.flatMap(i => [
    ['<entry>', `<id>tag:blogger.com,1999:blog-wekan.post-${i.id}</id>`, `<published>${i.date}</published>`,
      `<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/blogger/2008/kind#${i.type}"/>`,
      ...i.tags.map(t => `<category scheme="http://www.blogger.com/atom/ns#" term="${xml(t)}"/>`),
      `<title type="text">${xml(i.title)}</title>`, `<content type="html">${xml(markdownHtml(i.markdown))}</content>`,
      `<author><name>${xml(i.author || title)}</name></author>`,
      i.status === 'publish' ? '' : '<app:control xmlns:app="http://purl.org/atom/app#"><app:draft>yes</app:draft></app:control>',
      '</entry>'].filter(Boolean).join('\n'),
    ...i.comments.map((c, n) => ['<entry>', `<id>tag:blogger.com,1999:blog-wekan.post-${i.id}${n + 1}c</id>`,
      `<published>${c.date || i.date}</published>`,
      '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/blogger/2008/kind#comment"/>',
      `<content type="html">${xml(markdownHtml(c.text))}</content>`, `<author><name>${xml(c.author)}</name></author>`,
      `<thr:in-reply-to xmlns:thr="http://purl.org/syndication/thread/1.0" ref="tag:blogger.com,1999:blog-wekan.post-${i.id}"/>`,
      '</entry>'].join('\n')),
  ]).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n'
    + `<id>tag:blogger.com,1999:blog-wekan</id>\n<updated>${now.toISOString()}</updated>\n<title type="text">${xml(title)}</title>\n`
    + `${entries}\n</feed>\n`;
}

// A YAML string, quoted.
const yaml = value => JSON.stringify(str(value));

/**
 * A Markdown site, the files of Hugo's content/, Jekyll's _posts and pages,
 * Eleventy and Astro: a file per page and post with YAML front matter, the
 * attachments beside it. Returns { path: text } and the attachments to add,
 * [{ path, id }].
 */
export function markdownSiteFiles(collected = {}) {
  const items = siteItems(collected);
  const files = {};
  const attachments = [];
  const used = new Set();
  for (const i of items) {
    let base = `${i.type === 'page' ? 'content/pages' : 'content/posts'}/${i.type === 'post' ? `${i.date.slice(0, 10)}-` : ''}${i.slug}`;
    for (let n = 2; used.has(base); n += 1) base = `${base}-${n}`;
    used.add(base);
    const front = ['---', `title: ${yaml(i.title)}`, `date: ${i.date}`, `slug: ${yaml(i.slug)}`,
      i.status === 'publish' ? '' : 'draft: true', i.tags.length ? `tags: [${i.tags.map(yaml).join(', ')}]` : '',
      i.author ? `author: ${yaml(i.author)}` : '', '---'].filter(Boolean).join('\n');
    files[`${base}.md`] = `${front}\n\n${i.markdown}\n`;
    for (const a of i.attachments) attachments.push({ path: `${base}/${str(a.name).replace(/[\\/]/g, '_') || a.id}`, id: a.id });
  }
  return { files, attachments };
}

const PAGE_CSS = 'body{font-family:system-ui,sans-serif;max-width:46em;margin:0 auto;padding:1em;line-height:1.6;color:#222}'
  + 'nav a{margin-inline-end:1em}img{max-width:100%}header{border-bottom:1px solid #ddd;margin-bottom:1em}'
  + '.date{color:#666;font-size:.9em}.comments{border-top:1px solid #ddd;margin-top:2em}';

/**
 * The site itself, as plain HTML files that open from a disk or any web
 * server: index.html (the posts, newest first, or the first page), a file per
 * page and post, style.css, the attachments beside their page. Only what is
 * published is in it. Returns { files, attachments } like markdownSiteFiles.
 */
export function htmlSiteFiles(collected = {}) {
  const title = str(collected.board && collected.board.title) || 'WeKan';
  const items = siteItems(collected).filter(i => i.status === 'publish');
  const pages = items.filter(i => i.type === 'page');
  const posts = items.filter(i => i.type === 'post').sort((a, b) => b.date.localeCompare(a.date));
  const used = new Set();
  const fileOf = new Map();
  for (const i of [...pages, ...posts]) {
    let name = `${i.type === 'page' ? '' : 'posts/'}${i.slug}`;
    for (let n = 2; used.has(name) || name === 'index'; n += 1) name = `${name}-${n}`;
    used.add(name);
    fileOf.set(i, `${name}.html`);
  }
  const rel = (from, to) => `${from.includes('/') ? '../' : ''}${to}`;
  const shell = (file, heading, inner) => `<!DOCTYPE html>\n<html><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${xml(heading ? `${heading} - ${title}` : title)}</title>`
    + `<link rel="stylesheet" href="${rel(file, 'style.css')}"></head><body>\n<header><h1><a href="${rel(file, 'index.html')}">${xml(title)}</a></h1>`
    + `<nav>${pages.map(p => `<a href="${rel(file, fileOf.get(p))}">${xml(p.title)}</a>`).join('')}</nav></header>\n<main>${inner}</main>\n</body></html>\n`;
  const article = (i, file) => `<article><h2>${xml(i.title)}</h2>`
    + (i.type === 'post' ? `<p class="date">${xml(i.date.slice(0, 10))}</p>` : '')
    + markdownHtml(i.markdown)
    + (i.attachments.length ? `<ul class="files">${i.attachments.map(a => `<li><a href="${xml(attachmentPath(file, a))}">${xml(a.name)}</a></li>`).join('')}</ul>` : '')
    + (i.comments.length ? `<section class="comments">${i.comments.map(c => `<div><strong>${xml(c.author)}</strong> `
      + `<span class="date">${xml(str(c.date).slice(0, 10))}</span>${markdownHtml(c.text)}</div>`).join('')}</section>` : '')
    + '</article>';
  const files = { 'style.css': PAGE_CSS };
  const attachments = [];
  for (const [i, file] of fileOf) {
    files[file] = shell(file, i.title, article(i, file));
    for (const a of i.attachments) attachments.push({ path: attachmentPath(null, a, file), id: a.id });
  }
  files['index.html'] = shell('index.html', '', posts.length
    ? posts.map(p => `<article><h2><a href="${fileOf.get(p)}">${xml(p.title)}</a></h2><p class="date">${xml(p.date.slice(0, 10))}</p></article>`).join('\n')
    : (pages[0] ? article(pages[0], 'index.html') : ''));
  return { files, attachments };
}

// Where a page's attachment is: files/<page>/<name>, relative to the page.
function attachmentPath(fromFile, a, ofFile = fromFile) {
  const dir = `files/${str(ofFile).replace(/\.html$/, '').replace(/\//g, '_')}`;
  const path = `${dir}/${str(a.name).replace(/[\\/]/g, '_') || a.id}`;
  return fromFile && fromFile.includes('/') ? `../${path}` : path;
}
