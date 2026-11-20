// Export a board as an OPML outline - the reverse of parseOpml in
// opmlOutline.js, which documents the mapping. Pure and dependency-free, so the
// shared export formatters can load it on both sides.
//
// Workflowy's attribute names are written (`_note`, `_complete`): Workflowy,
// Dynalist and Logseq all read them.

// Attribute values: a line break is written as &#10; so that an XML parser,
// which turns a literal one into a space, gives it back.
const escapeAttr = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\r\n|\r|\n/g, '&#10;').replace(/\t/g, '&#9;');

import { pagingOf, listTitlesOf, byListOrder, outlineMarks, joinPage, markKey } from './exportPaging.js';

// The same terminal-list heuristic the markdown and Leo formatters use.
const isClosed = listTitle => /done|closed|complete|archiv|finished/i.test(listTitle || '');

const outline = (text, { note, done, kids = [] }, indent) => {
  const attrs = `text="${escapeAttr(text)}"${note ? ` _note="${escapeAttr(note)}"` : ''}${done ? ' _complete="true"' : ''}`;
  return kids.length
    ? `${indent}<outline ${attrs}>\n${kids.map(k => k(`${indent}  `)).join('\n')}\n${indent}</outline>`
    : `${indent}<outline ${attrs}/>`;
};

// The whole board, or one page of it (models/lib/exportPaging.js: the pages
// come list by list, and together are the whole file). A list's outline opens
// before its first card and closes after its last; a list with no cards is
// written where it stands, between the cards of the lists around it.
export function formatOpml(collected) {
  const { board, lists } = collected;
  const { items, all, first, last } = pagingOf(collected);
  const titles = listTitlesOf(lists, collected.page ? all : items);
  const ordered = collected.page ? items : byListOrder(items, titles);
  const { marks, lastKnown } = outlineMarks(collected.page ? all : ordered, titles);
  const empty = index => outline(titles[index], {}, '    ');
  const lines = first ? [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${escapeAttr(board && board.title)}</title>`,
    '  </head>',
    '  <body>',
  ] : [];
  for (const i of ordered) {
    const mark = marks.get(markKey(i));
    if (mark.first) {
      for (let k = mark.before + 1; k < mark.list; k += 1) lines.push(empty(k));
      lines.push(`    <outline text="${escapeAttr(titles[mark.list])}">`);
    }
    lines.push(outline(i.title, {
      note: i.description || '',
      done: isClosed(i.listTitle),
      kids: (Array.isArray(i.checklists) ? i.checklists : []).map(c => ind => outline(c.title, {
        kids: (Array.isArray(c.items) ? c.items : []).map(x => ii => outline(x.title, { done: Boolean(x.done) }, ii)),
      }, ind)),
    }, '      '));
    if (mark.last) lines.push('    </outline>');
  }
  if (last) {
    for (let k = lastKnown + 1; k < titles.length; k += 1) lines.push(empty(k));
    lines.push('  </body>', '</opml>', '');
  }
  return joinPage(lines, first);
}
