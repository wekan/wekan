// Export a board as a Leo .leo outline - the reverse of parseLeo in
// leoOutline.js, which documents the mapping. Pure and dependency-free, so the
// shared export formatters can load it on both sides.

import { pagingOf, byListOrder, joinPage, markKey } from './exportPaging.js';

const escapeXml = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// The same terminal-list heuristic the markdown formatter uses for `- [x]`.
const isClosed = listTitle => /done|closed|complete|archiv|finished/i.test(listTitle || '');

// The whole board, or one page of it (models/lib/exportPaging.js: the pages
// come list by list). The outline (<vnodes>) is made on the first page from
// the board's light first pass - titles and checklists, which is all it
// holds - and each page then writes its own cards' texts (<tnodes>), under
// the node numbers the outline gave them; together the pages are the whole
// file. A list's node comes before its cards, a card's before its checklists.
export function formatLeo(collected) {
  const { board, lists } = collected;
  const { items, all, first, last } = pagingOf(collected);
  const titles = [...new Set((lists || []).map(l => l.title))];
  const ordered = collected.page ? items : byListOrder(items, titles);
  const outlineCards = collected.page ? all : ordered;
  let next = 0;
  const gnxOf = new Map();
  const node = (headline, marked, kids, indent, card) => {
    next += 1;
    const gnx = `wekan.1.${next}`;
    if (card) gnxOf.set(markKey(card), gnx);
    const open = `${indent}<v t="${gnx}"${marked ? ' a="M"' : ''}><vh>${escapeXml(headline)}</vh>`;
    return kids.length ? `${open}\n${kids.map(k => k(`${indent}  `)).join('\n')}\n${indent}</v>` : `${open}</v>`;
  };
  const leaf = (headline, marked) => indent => node(headline, marked, [], indent);
  const vnodes = titles.map(title => {
    const cards = outlineCards.filter(i => i.listTitle === title).map(i => indent => node(
      i.title, isClosed(i.listTitle),
      (Array.isArray(i.checklists) ? i.checklists : []).map(c => ind => node(c.title, false,
        (Array.isArray(c.items) ? c.items : []).map(x => leaf(x.title, Boolean(x.done))), ind)),
      indent, i));
    return node(title, false, cards, '');
  });
  const lines = first ? [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<leo_file xmlns:leo="http://leoeditor.com/namespaces/leo-python-editor/1.1">',
    `<leo_header file_format="2" wekan_board="${escapeXml(board && board.title)}"/>`,
    '<vnodes>',
    ...vnodes,
    '</vnodes>',
    '<tnodes>',
  ] : [];
  for (const i of ordered) {
    const gnx = gnxOf.get(markKey(i));
    if (gnx && i.description) lines.push(`<t tx="${gnx}">${escapeXml(i.description)}</t>`);
  }
  if (last) lines.push('</tnodes>', '</leo_file>', '');
  return joinPage(lines, first);
}
