// The markdown "task list" kanban formatter, pulled out of
// externalExporters.js so it has no Meteor/ReactiveCache import of its own
// (externalParsers.js's parseMarkdownKanban is the same way) - which is what
// lets both sides of the round trip be unit-tested in plain Node, with no
// server/database to stand up.
//
// The convention several markdown-kanban tools use (Obsidian Kanban and
// similar): `## List name` headings, `- [ ]`/`- [x]` items underneath,
// indented continuation lines as an item's description.

// A WeKan list maps to a checked "done" item when its name looks terminal -
// the same heuristic externalExporters.js's other formatters use for a
// closed issue/task state.
function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}

export function formatMarkdownKanban({ board, lists, items }) {
  const lines = [`# ${(board && board.title) || 'Imported board'}`, ''];
  (lists || []).forEach(l => {
    const inList = (items || []).filter(i => i.listTitle === l.title);
    if (!inList.length) return;
    lines.push(`## ${l.title}`, '');
    inList.forEach(i => {
      lines.push(`- [${isClosed(i.listTitle) ? 'x' : ' '}] ${i.title}`);
      (i.description || '').split('\n').filter(Boolean).forEach(descLine => {
        lines.push(`  ${descLine}`);
      });
    });
    lines.push('');
  });
  return lines.join('\n');
}
