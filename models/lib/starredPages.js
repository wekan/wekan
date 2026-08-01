'use strict';

// Starred PAGES: the same star, on a page that is not a board.
//
// A board could be starred and reached from the dropdown in the first header
// bar. Every other page - All Boards / Remaining, a workspace, Admin Panel /
// Settings / Version - could not, so the one control for "keep this where I can
// get at it" worked on one kind of destination and was simply absent on the
// rest, even though those pages have had their own addresses since the All
// Boards and Admin Panel URLs landed.
//
// A starred page is its URL and its TITLE - the same words the browser tab
// shows, "Product name - All Boards / Remaining" - because the title is what
// the dropdown lists, and a row saying `/allboards/remaining` would make the
// reader parse a path to find out where it goes.
//
// The URL is RELATIVE. What is stored has to survive the site moving to another
// host, and an absolute URL pins a bookmark to the hostname it was made on.
//
// Pure: an array in, an array out. No Meteor, no collections, no router, so the
// same rules run on the client, on the server and in a unit test.
// docs/Features/Board/Starred.md

// A cap, because this is a dropdown. Starring is one click and unstarring is
// one click, so a list that grows without limit is a list that quietly stops
// being useful - and the oldest entry is the one the reader has stopped using.
const MAX_STARRED_PAGES = 50;

// Is this a page address this app can star?
//
// A relative path, starting with `/`. Anything else - an absolute URL, a
// `javascript:` URL, an empty string - is refused rather than cleaned up:
// storing it would put whatever it is into an `href` the reader clicks.
function isStarrablePageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/')) return false;
  // `//host/path` is protocol-relative - it leaves the site, and it starts with
  // a slash, so the test above lets it through.
  if (trimmed.startsWith('//')) return false;
  return true;
}

// The stored form: the path, without the origin, and with any trailing slash
// left alone (a trailing slash is a different address to the router, and
// second-guessing it here would star a page and highlight another).
function normalizePageUrl(url) {
  return isStarrablePageUrl(url) ? url.trim() : '';
}

// One stored entry, or null when the page cannot be starred. A title is
// optional in the sense that a page always has one by the time this is called;
// an empty one falls back to the URL so a row is never blank.
function pageEntry(url, title) {
  const href = normalizePageUrl(url);
  if (!href) return null;
  const text = typeof title === 'string' ? title.trim() : '';
  return { url: href, title: text || href };
}

// Entries whose URL survives a round trip. Anything else in the profile - an
// entry written by an older version, a hand-edited document - is dropped rather
// than drawn.
function starredPagesOf(pages) {
  if (!Array.isArray(pages)) return [];
  return pages
    .map(p => (p && typeof p === 'object' ? pageEntry(p.url, p.title) : null))
    .filter(Boolean);
}

function isPageStarred(pages, url) {
  const href = normalizePageUrl(url);
  if (!href) return false;
  return starredPagesOf(pages).some(p => p.url === href);
}

// Star it, or unstar it if it is already starred. One function rather than two,
// because the button is one button: the reader clicks the star to put the page
// in the list and clicks it again to take it out.
//
// A page that is starred again with a NEW title (the page was renamed, the
// admin changed the product name) keeps its place in the list and takes the new
// title - moving it to the end would reorder a list the reader has learned.
function toggleStarredPage(pages, url, title) {
  const entry = pageEntry(url, title);
  if (!entry) return starredPagesOf(pages);

  const current = starredPagesOf(pages);
  const at = current.findIndex(p => p.url === entry.url);
  if (at !== -1) {
    return current.filter((_, i) => i !== at);
  }
  // Newest last, so the list reads in the order the reader built it - and the
  // cap drops from the FRONT, which is the entry starred longest ago.
  const next = [...current, entry];
  return next.length > MAX_STARRED_PAGES
    ? next.slice(next.length - MAX_STARRED_PAGES)
    : next;
}

// Move a bookmark so it sits where another one is, and shift the rest along.
//
// The ORDER is the reader's, and it is one order: the tiles in All Boards /
// Starred and the rows of the header dropdown are two views of this array, so
// dragging a tile past another rearranges the menu too. Anything else would be
// two lists that disagree about the same bookmarks.
//
// Both URLs are matched by VALUE rather than by index, because the two views
// are rendered separately and an index from one of them is a guess about the
// other. An unknown URL, or a move onto itself, is a no-op.
function moveStarredPage(pages, url, beforeUrl) {
  const current = starredPagesOf(pages);
  const from = current.findIndex(p => p.url === normalizePageUrl(url));
  if (from === -1) return current;

  const moved = current[from];
  const without = current.filter((_, i) => i !== from);

  // No target: the end of the list. Dropping past the last tile is how a
  // bookmark is sent to the back.
  const target = normalizePageUrl(beforeUrl);
  if (!target) return [...without, moved];

  const to = without.findIndex(p => p.url === target);
  if (to === -1) return current;
  return [...without.slice(0, to), moved, ...without.slice(to)];
}

// The words in the browser tab, and the words the dropdown lists.
//
//   "Product name - All Boards / Remaining"
//
// The product name first, because it is the constant: a row of tabs from one
// WeKan then lines up under one word, and the part that differs is where the
// eye is already travelling. When there is no path - a page with nothing to say
// beyond its own name - the product name is the whole title, which is what it
// was before.
function pageDocumentTitle(productName, path) {
  const name = (typeof productName === 'string' ? productName : '').trim();
  const trail = (typeof path === 'string' ? path : '').trim();
  if (!name) return trail;
  if (!trail) return name;
  return `${name} - ${trail}`;
}

module.exports = {
  MAX_STARRED_PAGES,
  isStarrablePageUrl,
  normalizePageUrl,
  pageEntry,
  starredPagesOf,
  isPageStarred,
  toggleStarredPage,
  moveStarredPage,
  pageDocumentTitle,
};
