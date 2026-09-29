// Export a board as a Leo .leo outline - the reverse of parseLeo in
// leoOutline.js, which documents the mapping. Pure and dependency-free, so the
// shared export formatters can load it on both sides.

const escapeXml = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// The same terminal-list heuristic the markdown formatter uses for `- [x]`.
const isClosed = listTitle => /done|closed|complete|archiv|finished/i.test(listTitle || '');

export function formatLeo({ board, lists, items }) {
  let next = 0;
  const bodies = [];
  const node = (headline, body, marked, kids, indent) => {
    next += 1;
    const gnx = `wekan.1.${next}`;
    if (body) bodies.push(`<t tx="${gnx}">${escapeXml(body)}</t>`);
    const open = `${indent}<v t="${gnx}"${marked ? ' a="M"' : ''}><vh>${escapeXml(headline)}</vh>`;
    return kids.length ? `${open}\n${kids.map(k => k(`${indent}  `)).join('\n')}\n${indent}</v>` : `${open}</v>`;
  };
  const leaf = (headline, marked) => indent => node(headline, '', marked, [], indent);
  const vnodes = (lists || []).map(l => {
    const cards = (items || []).filter(i => i.listTitle === l.title).map(i => indent => node(
      i.title, i.description || '', isClosed(i.listTitle),
      (Array.isArray(i.checklists) ? i.checklists : []).map(c => ind => node(c.title, '', false,
        (Array.isArray(c.items) ? c.items : []).map(x => leaf(x.title, Boolean(x.done))), ind)),
      indent));
    return node(l.title, '', false, cards, '');
  });
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<leo_file xmlns:leo="http://leoeditor.com/namespaces/leo-python-editor/1.1">',
    `<leo_header file_format="2" wekan_board="${escapeXml(board && board.title)}"/>`,
    '<vnodes>',
    ...vnodes,
    '</vnodes>',
    '<tnodes>',
    ...bodies,
    '</tnodes>',
    '</leo_file>',
    '',
  ].join('\n');
}
