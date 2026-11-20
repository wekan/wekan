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
