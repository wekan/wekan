'use strict';

// Markdown "task list" kanban import/export (models/lib/externalParsers.js'
// parseMarkdownKanban, models/lib/markdownKanbanFormat.js's formatter, which
// externalExporters.js's `markdown` entry is just an alias for).
// Run: node tests/markdownImportExport.test.cjs
//
// The convention several markdown-kanban tools use (Obsidian Kanban and
// similar): `## List name` headings, `- [ ]`/`- [x]` items underneath,
// indented continuation lines as an item's description. This pins the
// export -> import round trip, and that a plain bulleted to-do list with no
// checkboxes at all (the shape a human is more likely to actually have)
// still imports as open cards rather than being silently dropped.

const assert = require('assert');

async function main() {
  const { parseMarkdownKanban } = await import('../models/lib/externalParsers.js');
  const { formatMarkdownKanban } = await import('../models/lib/markdownKanbanFormat.js');
  const formatters = { markdown: formatMarkdownKanban };

  let passed = 0;
  function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

  console.log('markdownImportExport:');

  test('a heading starts a list, checkbox items become cards', () => {
    const md = [
      '# My Board', '',
      '## To Do', '',
      '- [ ] Write the spec',
      '  extra detail line',
      '- [ ] Buy milk', '',
      '## Done', '',
      '- [x] Ship it', '',
    ].join('\n');
    const out = parseMarkdownKanban(md);
    assert.strictEqual(out.board.name, 'My Board');
    assert.deepStrictEqual(out.columns.map(c => c.title), ['To Do', 'Done']);
    assert.strictEqual(out.tasks.length, 3);
    assert.strictEqual(out.tasks[0].title, 'Write the spec');
    assert.strictEqual(out.tasks[0].description, 'extra detail line');
    assert.strictEqual(out.tasks[0].column_name, 'To Do');
    assert.deepStrictEqual(out.tasks[0].tags, []);
    assert.deepStrictEqual(out.tasks[2].tags, ['done'], 'a checked item is tagged done');
  });

  test('a plain bulleted list with no checkboxes still imports as open cards', () => {
    const out = parseMarkdownKanban('## Inbox\n\n- Call the plumber\n- Renew the passport\n');
    assert.strictEqual(out.tasks.length, 2);
    assert.deepStrictEqual(out.tasks.map(t => t.title), ['Call the plumber', 'Renew the passport']);
    assert.deepStrictEqual(out.tasks[0].tags, []);
  });

  test('a line matching no known construct is reported, not silently dropped', () => {
    const out = parseMarkdownKanban('## List\n\nsome stray paragraph\n');
    assert.ok(out.unsupported.some(u => /stray paragraph|no known/.test(u.reason)));
  });

  test('an export round-trips back through the parser', () => {
    const board = { title: 'Round Trip' };
    const lists = [{ title: 'Open' }, { title: 'Done' }];
    const items = [
      { title: 'First card', description: 'line one\nline two', listTitle: 'Open' },
      { title: 'Second card', description: '', listTitle: 'Done' },
    ];
    const md = formatters.markdown({ board, lists, items });
    assert.match(md, /^# Round Trip/);
    assert.match(md, /## Open/);
    assert.match(md, /## Done/);
    assert.match(md, /- \[ \] First card/);
    assert.match(md, /- \[x\] Second card/, '"Done" is a closed-looking list name');

    const reparsed = parseMarkdownKanban(md);
    assert.strictEqual(reparsed.board.name, 'Round Trip');
    assert.deepStrictEqual(reparsed.tasks.map(t => t.title), ['First card', 'Second card']);
    assert.strictEqual(reparsed.tasks[0].description, 'line one\nline two');
    assert.deepStrictEqual(reparsed.tasks[1].tags, ['done']);
  });

  test('empty input imports as an empty board, not a crash', () => {
    const out = parseMarkdownKanban('');
    assert.strictEqual(out.tasks.length, 0);
    assert.strictEqual(out.board.name, 'Imported Markdown board');
  });

  console.log(`\nmarkdownImportExport: ${passed} tests passed`);
}

main().catch(e => { console.error(e); process.exit(1); });
