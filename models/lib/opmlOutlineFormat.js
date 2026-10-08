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

// The same terminal-list heuristic the markdown and Leo formatters use.
const isClosed = listTitle => /done|closed|complete|archiv|finished/i.test(listTitle || '');

export function formatOpml({ board, lists, items }) {
  const outline = (text, { note, done, kids = [] }, indent) => {
    const attrs = `text="${escapeAttr(text)}"${note ? ` _note="${escapeAttr(note)}"` : ''}${done ? ' _complete="true"' : ''}`;
    return kids.length
      ? `${indent}<outline ${attrs}>\n${kids.map(k => k(`${indent}  `)).join('\n')}\n${indent}</outline>`
      : `${indent}<outline ${attrs}/>`;
  };
  const listTitles = (lists || []).map(l => l.title);
  for (const item of items || []) if (item.listTitle && !listTitles.includes(item.listTitle)) listTitles.push(item.listTitle);
  const body = listTitles.map(title => outline(title, {
    kids: (items || []).filter(i => i.listTitle === title).map(i => indent => outline(i.title, {
      note: i.description || '',
      done: isClosed(i.listTitle),
      kids: (Array.isArray(i.checklists) ? i.checklists : []).map(c => ind => outline(c.title, {
        kids: (Array.isArray(c.items) ? c.items : []).map(x => ii => outline(x.title, { done: Boolean(x.done) }, ii)),
      }, ind)),
    }, indent)),
  }, '    '));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${escapeAttr(board && board.title)}</title>`,
    '  </head>',
    '  <body>',
    ...body,
    '  </body>',
    '</opml>',
    '',
  ].join('\n');
}
