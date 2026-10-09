'use strict';

// Obsidian Kanban plugin boards (models/lib/obsidianKanbanFormat.js), following
// the plugin's parser and writer (mgmeyers/obsidian-kanban src/parsers).
// Run: node tests/obsidianKanban.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// What the plugin writes (boardToMd), including a Complete lane, a card limit,
// the Archive and the settings footer.
const SAMPLE = [
  '---', '', 'kanban-plugin: board', '', '---', '',
  '## Backlog', '',
  '- [ ] Write importer #wekan @{2026-10-15} @@{14:30}',
  '- [ ] Multi-line card',
  '    second line of description',
  '    owner:: Lauri',
  '    - [x] read the parser',
  '    - [ ] write the tests',
  '', '', '',
  '## Doing (3)', '',
  '- [ ] Review PR [[Lauri]] 📅 2026-10-10 🛫 2026-10-01 ⏫ 🆔 rev1 ⛔ imp1',
  '', '', '',
  '## Done', '',
  '**Complete**',
  '- [x] Ship release ✅ 2026-10-07',
  '', '', '',
  '***', '',
  '## Archive', '',
  '- [x] Old card',
  '',
  '%% kanban:settings',
  '```',
  '{"kanban-plugin":"board","list-collapse":[false,false,false]}',
  '```',
  '%%',
].join('\n');

async function main() {
  const { parseObsidianKanban, formatObsidianKanban, obsidianDate } = await import('../models/lib/obsidianKanbanFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a plugin board maps lanes, limits, cards, tags, dates, priority, fields, checklist and archive', () => {
    const board = parseObsidianKanban(SAMPLE);
    assert.deepEqual(board.columns, [{ title: 'Backlog' }, { title: 'Doing', wip_limit: 3 }, { title: 'Done' }]);
    const [write, multi, review, ship, old] = board.tasks;
    assert.equal(write.title, 'Write importer');
    assert.deepEqual(write.tags, ['wekan']);
    assert.equal(write.date_due, '2026-10-15T14:30:00.000Z', '@{date} with @@{time}');
    assert.equal(multi.description, 'second line of description');
    assert.deepEqual(multi.custom_fields, { owner: 'Lauri' }, 'a Dataview field');
    assert.deepEqual(multi.checklists, [{ title: 'Checklist', items: [{ title: 'read the parser', done: true }, { title: 'write the tests', done: false }] }]);
    assert.equal(review.title, 'Review PR [[Lauri]]', 'wikilinks stay text');
    assert.equal(review.date_due, '2026-10-10T00:00:00.000Z');
    assert.equal(review.date_started, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(review.custom_fields, { Priority: 'High' });
    assert.equal(review.ref, 'rev1');
    assert.deepEqual(review.dependencies, [{ ref: 'imp1', type: 'is-blocked-by' }]);
    assert.deepEqual(ship.tags, ['done'], 'a Complete lane marks its cards done');
    assert.equal(ship.date_end, '2026-10-07T00:00:00.000Z');
    assert.equal(old.archived, true);
    assert.equal(planImportedTask(old).card.archived, true);
    assert.deepEqual(board.unsupported, [], 'nothing of the plugin\'s own file is unrecognised');
  });

  test('the board\'s own date-format, date-trigger and the older "basic" value are honoured', () => {
    const board = parseObsidianKanban([
      '---', 'kanban-plugin: basic', 'date-format: DD.MM.YYYY', 'date-trigger: "!"', '---',
      '## A', '- [ ] Due later !{31.12.2026}', '- [ ] Linked ![[2026-11-01]]',
    ].join('\n'));
    assert.equal(board.tasks[0].date_due, '2026-12-31T00:00:00.000Z');
    assert.equal(board.unsupported.length, 1, 'a wikilinked date in another format is reported');
    assert.equal(obsidianDate('2026-02-30'), undefined, 'an impossible day is refused');
    assert.equal(obsidianDate('3/7/2026', 'M/D/YYYY'), '2026-03-07T00:00:00.000Z');
  });

  test('negative: what has no WeKan place is reported, and a non-board file is refused', () => {
    const board = parseObsidianKanban([
      '---', 'kanban-plugin: board', 'aliases: plan', '---',
      'stray paragraph',
      '## A',
      '- [ ] Weekly 🔁 every week 📅 2026-10-10 ❌ 2026-10-11',
    ].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/frontmatter\/aliases /);
    assert.match(reasons, /stray|not a lane/);
    assert.match(reasons, /recurrence "🔁 every week" is imported once/);
    assert.match(reasons, /cancelled/);
    assert.equal(board.tasks[0].title, 'Weekly');
    assert.equal(board.tasks[0].date_due, '2026-10-10T00:00:00.000Z');
    assert.throws(() => parseObsidianKanban('## A\n- [ ] x'), /starts with its --- frontmatter/);
    assert.throws(() => parseObsidianKanban('---\ntitle: notes\n---\n## A'), /not an Obsidian Kanban board/);
    assert.throws(() => parseObsidianKanban('---\nkanban-plugin: board\n'), /no closing ---/);
    assert.throws(() => validateImportSourceShape('obsidian', ''), /Invalid obsidian/);
  });

  test('export writes the plugin\'s layout, and it imports back', () => {
    const md = formatters.obsidian({
      lists: [{ title: 'To do' }, { title: 'Doing', wipLimit: { value: 2, enabled: true } }, { title: 'Done' }],
      items: [
        { title: 'Order valves', listTitle: 'To do', description: 'Two of them\nDN50', labels: ['urgent', 'Two words'],
          dueAt: '2026-10-20T08:30:00.000Z', startAt: '2026-10-01T00:00:00.000Z',
          customFields: { Priority: 'Highest', Vendor: 'ACME' },
          checklists: [{ title: 'C', items: [{ title: 'Quote', done: true }, { title: 'Order', done: false }] }] },
        { title: 'Ship it', listTitle: 'Done', endAt: '2026-10-07T00:00:00.000Z' },
      ],
    });
    assert.ok(md.startsWith('---\n\nkanban-plugin: board\n\n---\n\n## To do\n\n- [ ] Order valves'), md);
    assert.match(md, /## Doing \(2\)\n\n\n\n\n## Done/, 'an empty lane keeps its limit');
    assert.match(md, /%% kanban:settings\n```\n\{"kanban-plugin":"board"\}\n```\n%%\n$/);
    const back = parseObsidianKanban(md);
    assert.deepEqual(back.columns.map(c => [c.title, c.wip_limit]), [['To do', undefined], ['Doing', 2], ['Done', undefined]]);
    const [order, ship] = back.tasks;
    assert.equal(order.title, 'Order valves');
    assert.equal(order.description, 'Two of them\nDN50');
    assert.deepEqual(order.tags, ['urgent', 'Two-words']);
    assert.equal(order.date_due, '2026-10-20T08:30:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(order.custom_fields, { Priority: 'Highest', Vendor: 'ACME' });
    assert.deepEqual(order.checklists[0].items, [{ title: 'Quote', done: true }, { title: 'Order', done: false }]);
    assert.deepEqual(ship.tags, ['done']);
    assert.equal(ship.date_end, '2026-10-07T00:00:00.000Z');
    assert.deepEqual(back.unsupported, []);
  });

  test('wired into import, export, the import page and the export menu; columns carry WIP limits', () => {
    assert.equal(EXTERNAL_PARSERS.obsidian, parseObsidianKanban);
    assert.equal(formatters.obsidian, formatObsidianKanban);
    assert.match(read('models/import.js'), /case 'obsidian':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.obsidian\(importedBoard\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /obsidian: 'text\/markdown'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'obsidian', name: 'Obsidian Kanban'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'obsidian', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'obsidian'[^}]*path: 'export\/obsidian', ext: 'md'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-obsidian'], /Kanban board/);
    // KanboardCreator turns a column's wip_limit (or Kanboard's task_limit) into the list's WIP limit.
    const creator = read('models/kanboardCreator.js');
    assert.match(creator, /Number\(column\.wip_limit \?\? column\.task_limit\)/);
    assert.match(creator, /\.\.\.\(limit \? \{ wipLimit: \{ value: limit, enabled: true, soft: false \} \} : \{\}\)/);
    assert.match(read('models/lib/externalParsers.js'), /Number\(c\.task_limit\) > 0 \? \{ task_limit: Number\(c\.task_limit\) \}/);
  });

  console.log(`\nobsidianKanban: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
