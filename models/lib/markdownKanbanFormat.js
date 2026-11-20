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
import { pagingOf, byListOrder, outlineMarks, joinPage, markKey } from './exportPaging.js';

function isClosed(listTitle) {
  return /done|closed|complete|archiv|finished/i.test(listTitle || '');
}

// The whole board, or one page of it (models/lib/exportPaging.js: the pages
// come list by list, and together are the whole file): a list's heading is
// written before its first card and its blank line after its last.
export function formatMarkdownKanban(collected) {
  const { board, lists } = collected;
  const { items, all, first } = pagingOf(collected);
  const titles = [...new Set((lists || []).map(l => l.title))];
  const ordered = collected.page ? items : byListOrder(items, titles);
  const { marks } = outlineMarks(collected.page ? all : ordered, titles);
  const lines = first ? [`# ${(board && board.title) || 'Imported board'}`, ''] : [];
  ordered.forEach(i => {
    const mark = marks.get(markKey(i)) || { list: -1 };
    if (mark.list === -1) return; // a card of no list of the board
    if (mark.first) lines.push(`## ${titles[mark.list]}`, '');
    // The card line: its labels as #tags (a space as "-"), its due date as
    // @{day} and @@{time} - what parseMarkdownKanban reads back.
    const tags = (Array.isArray(i.labels) ? i.labels : []).filter(name => name && name !== 'done')
      .map(name => String(name).trim().replace(/[\s#]+/g, '-')).filter(name => /^[A-Za-z]/.test(name));
    const due = i.dueAt && !Number.isNaN(new Date(i.dueAt).getTime()) ? new Date(i.dueAt).toISOString() : '';
    const when = due ? ` @{${due.slice(0, 10)}}${due.slice(11, 16) === '00:00' ? '' : ` @@{${due.slice(11, 16)}}`}` : '';
    lines.push(`- [${isClosed(i.listTitle) ? 'x' : ' '}] ${i.title}${tags.map(t => ` #${t}`).join('')}${when}`);
    (i.description || '').split('\n').filter(Boolean).forEach(descLine => {
      // A description line that looks like a checklist item stays text.
      lines.push(`  ${descLine.replace(/^(\s*)(?=[-*+]\s+\[)/, '$1\\')}`);
    });
    for (const checklist of Array.isArray(i.checklists) ? i.checklists : []) {
      for (const entry of Array.isArray(checklist.items) ? checklist.items : []) {
        lines.push(`  - [${entry.done ? 'x' : ' '}] ${String(entry.title || '').replace(/\s+/g, ' ').trim() || 'Item'}`);
      }
    }
    if (mark.last) lines.push('');
  });
  return joinPage(lines, first);
}
