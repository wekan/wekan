'use strict';

// Kanri's JSON export: import and export (models/lib/kanriFormat.js). The
// fixtures are written here from the structure Kanri's types and import
// schemas define (types/kanban-types.d.ts, types/json-schemas.ts in the Kanri
// repository; see docs/Features/ImportExport/Format-Coverage.md). No Kanri
// code is copied.
// Run: node tests/kanriFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// A single-board export, as Kanri's Partial Export writes it.
function kanriBoard(overrides = {}) {
  return {
    id: 'k8f2m1q9x0abcd1234efgh56',
    title: 'Website',
    columns: [
      {
        id: 'c1v0lq2m3n4o5p6q7r8s9t0u',
        title: 'Todo',
        cards: [
          {
            id: 'd2w1x0y9z8a7b6c5d4e3f2g1',
            name: 'Write copy',
            description: 'Draft the intro',
            color: 'bg-pink-600',
            dueDate: '2025-06-01T12:00:00.000Z',
            isDueDateCounterRelative: false,
            isDueDateCompleted: true,
            tasks: [{ id: 't1', name: 'Intro', finished: true }, { id: 't2', name: 'Outro', finished: false }],
            tags: [
              { id: 'g1', text: 'copy', color: '#e44057', style: 'background-color: #e44057; color: #f4f4f5' },
              { id: 'g2', text: 'web', style: 'background-color: #3cb500' },
              { id: 'g3', text: 'plain' },
            ],
          },
          { name: 'Pick colors', color: '#ABC', dueDate: null, tags: null },
        ],
      },
      { id: 'e3r4t5y6u7i8o9p0a1s2d3f4', title: 'Done', cards: [{ id: 'x1', name: 'Teal one', color: 'bg-teal-600' }] },
    ],
    background: null,
    globalTags: [{ id: 'g1', text: 'copy', color: '#e44057' }, { id: 'g9', text: 'unused' }],
    lastEdited: '2025-05-02T08:00:00.000Z',
    createdAt: '2025-05-01T10:00:00.000Z',
    ...overrides,
  };
}

async function main() {
  const { parseKanri, formatKanri, kanriCardColor, kanriCardColorOf, kanriTagColor, kanriHex, WEKAN_COLOR_HEX } =
    await import('../models/lib/kanriFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLabels } = await import('../models/lib/importedTaskPlan.js');
  const WEKAN_COLORS = Object.keys(WEKAN_COLOR_HEX);
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('a Kanri board maps columns, cards, description, due date, tasks, tags and colors', async () => {
    const board = parseKanri(kanriBoard());
    assert.equal(board.board.name, 'Website');
    assert.deepEqual(board.columns.map(c => c.title), ['Todo', 'Done']);
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    const [first, second, third] = board.tasks;
    assert.equal(first.title, 'Write copy');
    assert.equal(first.description, 'Draft the intro');
    assert.equal(first.column_name, 'Todo');
    assert.equal(first.ref, 'd2w1x0y9z8a7b6c5d4e3f2g1');
    assert.equal(first.date_due, '2025-06-01T12:00:00.000Z');
    assert.equal(first.due_complete, true);
    assert.equal(first.color, 'pink', 'Kanri palette class to WeKan color');
    assert.deepEqual(first.tags, [{ name: 'copy', color: '#e44057' }, { name: 'web', color: 'green' }, { name: 'plain' }],
      'tag color from color, else from style; a hex WeKan draws becomes its name');
    assert.deepEqual(first.checklists, [{ title: 'Tasks', items: [{ title: 'Intro', done: true }, { title: 'Outro', done: false }] }]);
    assert.equal(second.ref, undefined, 'older cards have no id');
    assert.equal(second.date_due, undefined);
    assert.equal(second.color, '#aabbcc', 'a short custom hex is expanded');
    assert.deepEqual(second.tags, []);
    assert.equal(third.column_name, 'Done');
    assert.equal(third.color, '#0d9488', 'teal has no WeKan name and keeps its hex');
    assert.deepEqual(board.unsupported.map(u => u.path), ['/globalTags']);
    assert.match(board.unsupported[0].reason, /unused/);
    // What KanboardCreator then writes.
    const plan = planImportedTask(first, { allowedColors: WEKAN_COLORS });
    assert.equal(plan.card.color, 'pink');
    assert.equal(plan.card.dueComplete, true);
    assert.equal(plan.card.dueAt.toISOString(), '2025-06-01T12:00:00.000Z');
    assert.deepEqual(plan.checklists[0].items.map(i => [i.title, i.isFinished]), [['Intro', true], ['Outro', false]]);
    assert.deepEqual(planImportedLabels(board.tasks, WEKAN_COLORS),
      [{ name: 'copy', color: '#e44057' }, { name: 'web', color: 'green' }, { name: 'plain', color: 'black' }]);
    assert.equal(planImportedTask(second, { allowedColors: WEKAN_COLORS }).card.color, '#aabbcc');
  });

  await test('the JSON text and the parsed object import the same', async () => {
    assert.deepEqual(parseKanri(JSON.stringify(kanriBoard())), parseKanri(kanriBoard()));
  });

  // Every board of an all-data export is read, each into a swimlane named
  // after it, so "One board per project" (models/lib/importSplit.js) gives
  // each its own WeKan board - the mass import of a Kanri app, as a Trello
  // .zip is of Trello. (It used to read the first board and report the rest.)
  await test('all data: every board is read into its own swimlane, and splits into one board each', async () => {
    const { splitBySwimlane } = await import('../models/lib/importSplit.js');
    const all = {
      activeTheme: 'dark',
      colors: { accent: '#fff' },
      pins: [{ id: 'p', title: 'Website' }],
      lastInstalledVersion: '0.8.1',
      boards: [kanriBoard(), kanriBoard({ id: 'b2', title: 'Garden' }), kanriBoard({ id: 'b3', title: 'Website' })],
    };
    const board = parseKanri(all);
    assert.equal(board.board.name, 'Kanri');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Website', 'Garden', 'Website (2)'], 'two boards with one title stay two');
    assert.equal(board.tasks.length, 9, 'every card of every board');
    assert.deepEqual([...new Set(board.tasks.map(t => t.swimlane_name))], ['Website', 'Garden', 'Website (2)']);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.doesNotMatch(reasons, /is not imported: one import makes one board/);
    assert.match(reasons, /^\/ Kanri app settings \(activeTheme, colors, pins\)/m);
    assert.match(reasons, /\/boards\/0\/globalTags/);
    const parts = splitBySwimlane(board);
    assert.deepEqual(parts.map(p => p.board.name), ['Website', 'Garden', 'Website (2)']);
    assert.ok(parts.every(p => p.tasks.length === 3 && p.swimlanes.length === 1));
    assert.deepEqual(parts[1].columns, board.swimlane_columns.Garden.map(title => ({ title })), 'each board keeps its own columns');
    assert.ok(parts.every(p => p.swimlane_columns === undefined));
    // One board in the all-data export is one board, not one swimlane.
    const single = parseKanri({ boards: [kanriBoard()] });
    assert.equal(single.board.name, 'Website');
    assert.deepEqual(single.swimlanes, [{ name: 'Default' }]);
  });

  await test('KanbanElectron\'s lists, which Kanri also imports, read as columns', async () => {
    const board = parseKanri({ id: 'e', title: 'Old', lists: [{ id: 'l', title: 'A', cards: [{ name: 'One' }] }] });
    assert.deepEqual(board.columns, [{ title: 'A' }]);
    assert.equal(board.tasks[0].title, 'One');
  });

  await test('negative: what has no WeKan place is reported, never invented', async () => {
    const board = parseKanri(kanriBoard({
      background: { blur: '0px', brightness: '100%', src: 'C:\\Users\\me\\Pictures\\sky.png' },
      globalTags: null,
      columns: [
        { id: 'a', title: 'Todo', cards: [
          { name: 'Countdown', dueDate: '2025-06-01T12:00:00.000Z', isDueDateCounterRelative: true },
          { name: 'Bad date', dueDate: 'next week', isDueDateCompleted: true },
          { name: 'Odd color', color: 'bg-rainbow-600', tags: [{ text: 'x', color: 'chartreuse-ish' }] },
          'not a card',
        ] },
        { id: 'b', title: 'Todo', cards: [{ name: 'Second todo' }] },
      ],
    }));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/background Kanri background image "C:\\Users\\me\\Pictures\\sky\.png" is a file/);
    assert.match(reasons, /\/columns\/0\/cards\/0\/isDueDateCounterRelative .*countdown/);
    assert.match(reasons, /\/columns\/0\/cards\/1\/dueDate Kanri due date "next week" is not a date/);
    assert.match(reasons, /\/columns\/0\/cards\/2\/color Kanri card color "bg-rainbow-600"/);
    assert.match(reasons, /\/columns\/0\/cards\/2\/tags Kanri tag "x" color "chartreuse-ish"/);
    assert.match(reasons, /\/columns\/0\/cards\/3 a Kanri card that is not an object/);
    assert.match(reasons, /\/columns\/1\/title Kanri has two columns named "Todo"; this one is imported as "Todo \(2\)"/);
    assert.deepEqual(board.columns.map(c => c.title), ['Todo', 'Todo (2)'], 'a repeated title does not merge two lists');
    assert.equal(board.tasks.find(t => t.title === 'Second todo').column_name, 'Todo (2)');
    const bad = board.tasks.find(t => t.title === 'Bad date');
    assert.equal(bad.date_due, undefined);
    assert.equal(bad.due_complete, undefined, 'a done flag without a due date is not stored');
    const odd = board.tasks.find(t => t.title === 'Odd color');
    assert.equal(odd.color, undefined);
    assert.deepEqual(odd.tags, [{ name: 'x' }]);
    assert.equal(kanriCardColor('bg-elevation-2'), null, 'Kanri\'s default is no color');
    assert.equal(kanriCardColor(''), null);
    assert.equal(kanriHex('#12345'), undefined);
    assert.equal(kanriTagColor({ text: 'a', style: 'color: red' }), undefined);
    // due_complete alone, without a due date, is not set on the card.
    assert.equal(planImportedTask({ title: 'x', due_complete: true }).card.dueComplete, undefined);
  });

  await test('negative: a document that is not a Kanri export is refused', async () => {
    assert.throws(() => parseKanri('not json'), /not valid JSON/);
    assert.throws(() => parseKanri([]), /must be a JSON object/);
    assert.throws(() => parseKanri({ title: 'No columns' }), /needs a columns array/);
    assert.throws(() => parseKanri({ boards: [], colors: {} }), /has no boards/);
    assert.throws(() => parseKanri({ id: 'b', title: 'Big', columns: [{ id: 'c', title: 'A', cards: new Array(20001).fill({ name: 'x' }) }] }),
      /more than 20000 cards/);
    assert.throws(() => validateImportSourceShape('kanri', { title: 'x' }), /Invalid kanri/);
    assert.throws(() => validateImportSourceShape('kanri', 'text'), /Invalid kanri/);
    assert.doesNotThrow(() => validateImportSourceShape('kanri', { columns: [] }));
    assert.doesNotThrow(() => validateImportSourceShape('kanri', { boards: [] }));
  });

  await test('export writes a Kanri single-board file, and it imports back', async () => {
    const collected = {
      board: {
        _id: 'B1', title: 'Launch', createdAt: new Date('2026-10-01T00:00:00.000Z'), modifiedAt: new Date('2026-10-05T00:00:00.000Z'),
        labels: [{ _id: 'L1', name: 'copy', color: 'red' }, { _id: 'L2', name: 'web', color: '#e44057' },
          { _id: 'L3', name: '', color: 'green' }, { _id: 'L4', name: 'unused', color: 'blue' }],
      },
      lists: [{ _id: 'l1', title: 'To do' }, { _id: 'l2', title: 'Done' }],
      items: [
        { cardId: 'c1', listId: 'l1', listTitle: 'To do', title: 'Write copy', description: 'Draft *it*', color: 'pink',
          dueAt: '2026-10-20T00:00:00.000Z', dueComplete: true, labelIds: ['L1', 'L2', 'L3'], labels: ['copy', 'web'],
          checklists: [{ title: 'One', items: [{ title: 'Intro', done: true }] }, { title: 'Two', items: [{ title: 'Outro', done: false }] }] },
        { cardId: 'c2', listId: 'l2', listTitle: 'Done', title: 'Ship', color: 'navy', labelIds: [] },
        { cardId: 'c3', listId: 'gone', listTitle: 'Archived list', title: 'Orphan', color: '#0d9488' },
      ],
    };
    const out = formatters.kanri(collected);
    // The keys Kanri's import schema requires, and no tag color set to null
    // (its schema allows a missing color, not a null one).
    assert.equal(out.id, 'B1');
    assert.equal(out.title, 'Launch');
    assert.equal(out.lastEdited, '2026-10-05T00:00:00.000Z');
    assert.equal(out.background, null);
    assert.deepEqual(out.columns.map(c => [c.id, c.title]), [['l1', 'To do'], ['l2', 'Done'], ['gone', 'Archived list']]);
    const [first] = out.columns[0].cards;
    assert.equal(first.color, 'bg-pink-600');
    assert.equal(first.dueDate, '2026-10-20T00:00:00.000Z');
    assert.equal(first.isDueDateCompleted, true);
    assert.deepEqual(first.tasks.map(t => [t.name, t.finished]), [['Intro', true], ['Outro', false]], 'checklists flatten into one task list');
    assert.deepEqual(first.tags, [
      { id: 'L1', text: 'copy', color: '#eb4646', style: 'background-color: #eb4646; color: #f4f4f5' },
      { id: 'L2', text: 'web', color: '#e44057', style: 'background-color: #e44057; color: #f4f4f5' },
    ], 'an unnamed label has no Kanri tag text and is left out');
    assert.deepEqual(out.globalTags.map(t => t.text), ['copy', 'web'], 'globalTags are the tags the exported cards use');
    assert.equal(out.columns[1].cards[0].color, '#000080', 'a WeKan color Kanri has no class for is written as hex');
    assert.equal(out.columns[1].cards[0].dueDate, null);
    assert.equal(out.columns[1].cards[0].isDueDateCompleted, false);
    assert.equal(out.columns[2].cards[0].color, 'bg-teal-600');
    for (const card of out.columns.flatMap(c => c.cards)) {
      assert.equal(typeof card.name, 'string');
      for (const tag of card.tags) assert.ok(tag.color === undefined || typeof tag.color === 'string');
    }
    // It survives JSON and imports back.
    const back = parseKanri(JSON.stringify(out, null, 2));
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done', 'Archived list']);
    const [b1, b2, b3] = back.tasks;
    assert.equal(b1.ref, 'c1');
    assert.equal(b1.description, 'Draft *it*');
    assert.equal(b1.color, 'pink');
    assert.equal(b1.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(b1.due_complete, true);
    assert.deepEqual(b1.tags, [{ name: 'copy', color: 'red' }, { name: 'web', color: '#e44057' }], 'label colors round-trip');
    assert.deepEqual(b1.checklists[0].items, [{ title: 'Intro', done: true }, { title: 'Outro', done: false }]);
    assert.equal(b2.color, 'navy', 'the hex of a WeKan color reads back as that color');
    assert.equal(b3.color, '#0d9488');
    assert.deepEqual(back.unsupported, []);
    assert.equal(kanriCardColorOf(''), '');
    assert.equal(kanriCardColorOf('#ABCDEF'), '#abcdef');
  });

  await test('the format is wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.kanri, parseKanri);
    assert.equal(formatters.kanri, formatKanri);
    const imp = read('models/import.js');
    assert.match(imp, /case 'kanri':[\s\S]*?check\(board, Object\);[\s\S]*?importedBoard = EXTERNAL_PARSERS\.kanri\(importedBoard\);[\s\S]*?creator = new KanboardCreator\(data, 'kanri'\);/);
    const creator = read('models/kanboardCreator.js');
    assert.match(creator, /planImportedLabels\(this\._tasks\(data\), LABEL_COLORS\)/, 'tag colors reach the board labels');
    assert.doesNotMatch(creator, /getLabel\(name, 'black'\)/, 'a colored label is found by its name');
    const collector = read('models/lib/externalExporters.js');
    assert.match(collector, /c\.dueAt && c\.dueComplete \? \{ dueComplete: true \}/);
    assert.match(collector, /c\.color \? \{ color: c\.color \}/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'kanri', name: 'Kanri'[,}]/); // the one list of sources
    assert.match(read('client/components/boards/exportScope.js'),
      /\{ key: 'kanri', icon: 'fa-columns', label: 'Kanri', path: 'export\/kanri', ext: 'json', scopes: BOARD_ONLY \}/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-kanri'], /Kanri/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Kanri/Kanri.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Kanri\/Kanri\.md\)/);
  });

  console.log(`\nkanriFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
