// A page of an export written a page of cards at a time
// (server/lib/renderExternalExport.js streamExternalExport). A formatter reads
// its page through pagingOf, so the same formatter writes a whole board (no
// page: every card, first and last) or one page of it:
//   items   the cards of this page, in full
//   all     every card of the board, light (no description, comment texts or
//           attachments): what a row refers to - a parent's number, a column
//           counted over the board, the order of the lists
//   offset  how many cards came before this page
//   first   this page writes the file's head; last, its tail
// The pages together are the file the whole board would have been written as.
export function pagingOf(collected = {}) {
  const items = Array.isArray(collected.items) ? collected.items : [];
  const page = collected.page || null;
  return {
    items,
    all: page && Array.isArray(page.all) ? page.all : items,
    offset: page ? page.offset : 0,
    first: page ? page.first : true,
    last: page ? page.last : true,
  };
}

// The order of the lists as a board's cards first name them, and the cards in
// that order, list by list - how the formats that group by list (Todoist's
// sections) write them, so the pages can come in the same order.
export function byFirstListOrder(items, listOf) {
  const rank = new Map();
  items.forEach(item => { if (!rank.has(listOf(item))) rank.set(listOf(item), rank.size); });
  return items.map((item, index) => ({ item, index }))
    .sort((a, b) => (rank.get(listOf(a.item)) - rank.get(listOf(b.item))) || (a.index - b.index))
    .map(({ item }) => item);
}

// The outlines that group cards under their lists (Markdown, OPML, Org mode):
// the lists in the board's order, then any list only a card names, in the
// order the cards first name it.
export function listTitlesOf(lists, all) {
  const titles = (lists || []).map(l => l.title);
  for (const item of all || []) if (item.listTitle && !titles.includes(item.listTitle)) titles.push(item.listTitle);
  return titles;
}

// The cards list by list in `titles` order, each list's cards in board order;
// a card of no list in `titles` goes last.
export function byListOrder(all, titles) {
  const rank = new Map(titles.map((title, i) => [title, i]));
  const at = item => (rank.has(item.listTitle) ? rank.get(item.listTitle) : titles.length);
  return all.map((item, index) => ({ item, index }))
    .sort((a, b) => (at(a.item) - at(b.item)) || (a.index - b.index))
    .map(({ item }) => item);
}

// For a page of an outline: where each of its cards stands in its list.
// cardId -> { list (index in titles, -1 when none), first, last, before }:
// first/last - the first/last card of its list on the whole board; before -
// the index of the list of the card before it on the board (-1 for none),
// so the lists between the two, which have no cards, are written there.
// `trailing` - the lists after the board's last card's, for the last page.
// A card is found by its id; a card written without one (a caller that is
// not the export) by itself.
export const markKey = item => (item && item.cardId !== undefined ? item.cardId : item);

export function outlineMarks(all, titles) {
  const rank = new Map(titles.map((title, i) => [title, i]));
  const listOf = item => (rank.has(item.listTitle) ? rank.get(item.listTitle) : -1);
  const marks = new Map();
  let lastKnown = -1;
  all.forEach((item, i) => {
    const list = listOf(item);
    const prev = i > 0 ? listOf(all[i - 1]) : -2;
    const next = i < all.length - 1 ? listOf(all[i + 1]) : -2;
    marks.set(markKey(item), { list, first: prev !== list, last: next !== list, before: lastKnown });
    if (list !== -1) lastKnown = list;
  });
  return { marks, lastKnown };
}

// A page's lines, joined so that the pages together are the whole file's
// lines joined with '\n': every line after the file's first starts with it.
export function joinPage(lines, first) {
  return lines.map((line, i) => (first && i === 0 ? line : `\n${line}`)).join('');
}

// The JSON documents that nest the cards under their lists by list id (Deck's
// stacks, Kanri's columns): the board's lists in order, then each list only a
// card names, in the order the cards first name it; each list's cards in
// board order. A list's cards are then one run, as the nested writer needs.
export function byListIdOrder(all, listIds) {
  const rank = new Map(listIds.map((id, i) => [id, i]));
  all.forEach(item => { if (!rank.has(item.listId || '')) rank.set(item.listId || '', rank.size); });
  return all.map((item, index) => ({ item, index }))
    .sort((a, b) => (rank.get(a.item.listId || '') - rank.get(b.item.listId || '')) || (a.index - b.index))
    .map(({ item }) => item);
}
