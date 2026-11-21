'use strict';

// Board View / Website (docs/Features/Board-Sidebar/Board-Settings/Board-View.md,
// docs/Features/Board-Sidebar/Board-Settings/Import-Export/Website/Website.md): the
// board as the website it was imported from - or one written on it - built
// straight from its lists, swimlanes, cards and attachments. Chosen as the
// board's public view in Board Settings / Board View, it is what a visitor
// sees at the public board's address instead of the kanban.
//
//   on the site   the cards of a list named Published (any language
//                 models/lib/websiteFormat.js knows), or of every list when
//                 the board has none; never an archived card
//   pages         the cards of a swimlane named Pages, in board order, a
//                 subtask under its parent card - the menu
//   posts         every other card, newest first - the front page
//   content       the card's description (Markdown), its attachments its
//                 images and files
//
// Pure, no Meteor: tests/websiteView.test.cjs.

const PUBLISHED = /^(published|publish|public|live|julkaistu|julkinen|veröffentlicht|publié|publicado|pubblicato)$/i;
const PAGES = /^(pages?|sivut|seiten|pagine|páginas)$/i;

const str = value => (typeof value === 'string' ? value : '');
const time = value => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
};

/**
 * @param {Object} board  { lists: [{ _id, title, sort }], swimlanes: [{ _id, title }],
 *                          cards: [{ _id, title, listId, swimlaneId, sort, parentId, archived, createdAt, receivedAt, startAt }] }
 * @returns {{ pages, posts, home, byId }}
 */
function websiteOf({ lists = [], swimlanes = [], cards = [] } = {}) {
  const published = lists.filter(l => l && !l.archived && PUBLISHED.test(str(l.title).trim())).map(l => l._id);
  const onSite = new Set(published.length ? published : lists.filter(l => l && !l.archived).map(l => l._id));
  const pageLanes = new Set(swimlanes.filter(s => s && PAGES.test(str(s.title).trim())).map(s => s._id));
  const listSort = new Map(lists.map(l => [l._id, Number(l.sort) || 0]));
  const visible = cards.filter(c => c && !c.archived && onSite.has(c.listId));
  const ids = new Set(visible.map(c => c._id));
  const bySort = (a, b) => (listSort.get(a.listId) - listSort.get(b.listId)) || ((Number(a.sort) || 0) - (Number(b.sort) || 0))
    || str(a.title).localeCompare(str(b.title));
  const pageCards = visible.filter(c => pageLanes.has(c.swimlaneId)).sort(bySort);
  // The menu: top-level pages, each with the pages under it.
  const pages = pageCards.filter(c => !c.parentId || !ids.has(c.parentId)).map(c => ({
    _id: c._id, title: str(c.title),
    children: pageCards.filter(x => x.parentId === c._id).map(x => ({ _id: x._id, title: str(x.title) })),
  }));
  const when = c => time(c.receivedAt) || time(c.startAt) || time(c.createdAt);
  const posts = visible.filter(c => !pageLanes.has(c.swimlaneId))
    .sort((a, b) => when(b) - when(a) || bySort(a, b))
    .map(c => ({ _id: c._id, title: str(c.title), date: when(c) ? new Date(when(c)).toISOString().slice(0, 10) : '' }));
  return {
    pages,
    posts,
    // The front page: the posts, or - on a site of pages only - the first page.
    home: posts.length ? { posts: true } : (pages[0] ? { cardId: pages[0]._id } : { empty: true }),
    byId: new Set(visible.map(c => c._id)),
  };
}

// The card the address asks for, when it is on the site; otherwise the front
// page. A card that is not on the site - a draft - is never shown by its id.
function pageFor(site, cardId) {
  return cardId && site.byId.has(cardId) ? { cardId } : site.home;
}

module.exports = { websiteOf, pageFor };
