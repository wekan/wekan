'use strict';

// A GitHub wiki as cards, for the GitHub organization import and Board View /
// Version Control's Wiki tab. A GitHub wiki is a git repository of Markdown
// files (<repo>.wiki.git): one file is one page, its file name is the page
// name with spaces as hyphens, `Home` is the start page, and `_Sidebar` and
// `_Footer` are drawn around every page.
//
//   one page            one card in the board's "Wiki" list
//   page title          the card title, on the minicard
//   page text           the card's description, in the opened card
//   [[links]]           "link to card": the linked page's card is attached
//                       to the card, and the link in the text points at it
//   page history        the card's history: each commit that changed the
//                       file is an edit of the description, so History
//                       shows it and Restore brings back an older text
//
// Pure, no Meteor and no git: the server reads the repository
// (server/lib/githubWiki.js) and hands this the files and their revisions.
// tests/githubWiki.test.cjs.

const WIKI_LIST_TITLE = 'Wiki';
const PAGE_EXTENSIONS = /\.(md|markdown|mdown|mkdn|textile|rdoc|org|creole|mediawiki|wiki|rst|asciidoc|adoc|pod|txt)$/i;
const SPECIAL_PAGES = ['_Sidebar', '_Footer'];

/** The page name of a wiki file, or null when the file is not a page. */
function pageNameFromPath(file) {
  const name = String(file || '').split('/').pop();
  if (!PAGE_EXTENSIONS.test(name)) return null;
  return name.replace(PAGE_EXTENSIONS, '').replace(/-/g, ' ').trim() || null;
}

/** The key GitHub resolves a page by: case-insensitive, spaces and hyphens alike. */
function pageKey(name) {
  return String(name || '').trim().replace(/[\s-]+/g, '-').replace(/\.(md|markdown)$/i, '').toLowerCase();
}

function isSpecialPage(name) {
  return SPECIAL_PAGES.map(pageKey).includes(pageKey(name));
}

/**
 * Every wiki link of a page's text, as { name, text, start, end, kind }:
 *   [[Page]]  [[Text|Page]]  [[Page|Text]] (GitHub accepts both orders)
 *   [text](Page-Name)  [text](https://github.com/<o>/<r>/wiki/Page-Name)
 * `isPage(key)` decides which [[a|b]] half is the page.
 */
function wikiLinks(text, { repoWikiUrl = '', isPage = () => false } = {}) {
  const out = [];
  const body = String(text || '');
  const double = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;
  let m;
  while ((m = double.exec(body))) {
    let name = m[1].trim();
    let label = name;
    if (m[2]) {
      const a = m[1].trim();
      const b = m[2].trim();
      // GitHub reads [[Link Text|Page]]; MediaWiki habit is [[Page|Text]].
      [label, name] = isPage(pageKey(b)) || !isPage(pageKey(a)) ? [a, b] : [b, a];
    }
    out.push({ name, text: label, start: m.index, end: m.index + m[0].length, kind: 'wiki' });
  }
  const base = String(repoWikiUrl || '').replace(/\/+$/, '');
  const md = /(?<!!)\[([^\]\n]*)\]\(([^)\s]+)\)/g;
  while ((m = md.exec(body))) {
    let target = m[2];
    if (base && target.toLowerCase().startsWith(`${base.toLowerCase()}/`)) target = target.slice(base.length + 1);
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || target.startsWith('#')) continue;
    const name = decodeURIComponent(target.split('#')[0]);
    if (!name || /\.(png|jpe?g|gif|svg|pdf|zip)$/i.test(name)) continue;
    out.push({ name: name.replace(/-/g, ' '), text: m[1], start: m.index, end: m.index + m[0].length, kind: 'markdown' });
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * The text with each link to a page that became a card pointing at that
 * card, and the ids of those cards, for "link to card".
 *   cardFor(key) -> { _id, url } | null
 */
function rewriteWikiLinks(text, { repoWikiUrl, cardFor }) {
  const body = String(text || '');
  const isPage = key => Boolean(cardFor(key));
  const links = wikiLinks(body, { repoWikiUrl, isPage });
  let out = '';
  let at = 0;
  const linked = [];
  for (const link of links) {
    if (link.start < at) continue;
    const card = cardFor(pageKey(link.name));
    if (!card) continue;
    out += body.slice(at, link.start) + `[${link.text.replace(/[[\]]/g, '')}](${card.url})`;
    at = link.end;
    if (!linked.includes(card._id)) linked.push(card._id);
  }
  return { text: out + body.slice(at), linkedCardIds: linked };
}

/**
 * The history of one page, oldest first, as the edits of its card's
 * description: [{ previous, next, at, author, email, message, commit }].
 *   revisions: [{ commit, at, author, email, message, text }] oldest first,
 *   text null when the commit deleted the file.
 */
function pageHistory(revisions) {
  const out = [];
  let previous = null;
  for (const r of Array.isArray(revisions) ? revisions : []) {
    if (!r) continue;
    const next = r.text == null ? null : String(r.text);
    if (next === previous) continue;
    out.push({ previous, next, at: r.at, author: r.author || '', email: r.email || '', message: r.message || '', commit: r.commit || '' });
    previous = next;
  }
  return out;
}

/** The pages of a wiki, Home first, then by name - the order of GitHub's page list. */
function sortPages(pages) {
  return [...pages].sort((a, b) => {
    const home = p => (pageKey(p.name) === 'home' ? 0 : 1);
    return home(a) - home(b) || a.name.localeCompare(b.name);
  });
}

module.exports = {
  WIKI_LIST_TITLE,
  SPECIAL_PAGES,
  pageNameFromPath,
  pageKey,
  isSpecialPage,
  wikiLinks,
  rewriteWikiLinks,
  pageHistory,
  sortPages,
};
