'use strict';

// Org mode outline import/export (models/lib/orgModeFormat.js), following
// https://orgmode.org/manual/ (headlines, TODO keywords, priorities, tags,
// planning lines, property drawers, checkboxes). Run: node tests/orgMode.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { parseOrgMode, formatOrgMode, orgTimestamp, MAX_ORG_HEADINGS } = await import('../models/lib/orgModeFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('an Org file maps to lists, cards, keywords, priorities, tags, dates, body, checkboxes and sub-headings', () => {
    const { board, columns, tasks, unsupported } = parseOrgMode([
      '#+TITLE: Plant',
      '#+TODO: TODO(t) NEXT(n) | DONE(d) CANCELLED(c)',
      'Loose preamble text.',
      '* To Do',
      '** NEXT [#A] Order valves                                   :shop:urgent:',
      '   SCHEDULED: <2026-10-01 Thu> DEADLINE: <2026-10-10 Sat 14:30>',
      '   :PROPERTIES:',
      '   :CREATED:  [2026-09-01 Tue 12:00]',
      '   :END:',
      '   Two of them.',
      '   Not a *heading*.',
      '   - [X] Measure',
      '   - [ ] Call the vendor',
      '*** Fitting',
      '**** DONE Seal',
      '**** Bolts',
      '*** TODO Paint',
      '** CANCELLED Old idea',
      '* Done',
      '** DONE Replace pump',
      '   CLOSED: [2026-10-09 Fri 12:00]',
      '** TODO Weekly check',
      '   SCHEDULED: <2026-10-05 Mon +1w>',
    ].join('\n'));
    assert.equal(board.name, 'Plant');
    assert.deepEqual(columns.map(column => column.title), ['To Do', 'Done']);
    const [valves, idea, pump, weekly] = tasks;
    assert.equal(valves.title, 'Order valves', 'keyword, priority and tags leave the title');
    assert.deepEqual(valves.tags, ['priority:A', 'shop', 'urgent'], 'NEXT is a to-do keyword from #+TODO');
    assert.deepEqual([valves.date_started, valves.date_due, valves.date_creation],
      ['2026-10-01T00:00:00.000Z', '2026-10-10T14:30:00.000Z', '2026-09-01T12:00:00.000Z']);
    assert.equal(valves.description, 'Two of them.\nNot a *heading*.');
    assert.deepEqual(valves.checklists, [
      { title: 'Order valves', items: [{ title: 'Measure', done: true }, { title: 'Call the vendor', done: false }, { title: 'Paint', done: false }] },
      { title: 'Fitting', items: [{ title: 'Seal', done: true }, { title: 'Bolts', done: false }] },
    ]);
    assert.deepEqual(idea.tags, ['done'], 'CANCELLED is a done keyword from #+TODO');
    assert.deepEqual([pump.tags, pump.date_end], [['done'], '2026-10-09T12:00:00.000Z']);
    assert.equal(weekly.date_started, '2026-10-05T00:00:00.000Z');
    assert.deepEqual(unsupported.map(u => u.reason), [
      'text before the first heading has no WeKan field',
      'Org repeater or delay +1w is not kept',
    ]);
    const plan = planImportedTask(valves);
    assert.equal(plan.card.dueAt.toISOString(), '2026-10-10T14:30:00.000Z');
    assert.equal(plan.checklists.length, 2);
  });

  test('timestamps: active and inactive, with and without a time, and invalid ones', () => {
    assert.deepEqual(orgTimestamp('<2026-10-10 Sat>'), { iso: '2026-10-10T00:00:00.000Z', extra: '' });
    assert.deepEqual(orgTimestamp('[2026-10-10 la 9:05]'), { iso: '2026-10-10T09:05:00.000Z', extra: '' }, 'a localized day name');
    assert.equal(orgTimestamp('<2026-02-30 Mon>'), null);
    assert.equal(orgTimestamp('tomorrow'), null);
  });

  test('a board exported to Org imports back with lists, keywords, priority, tags, dates, body and checklists', () => {
    const collected = { board: { title: 'Plant' }, lists: [{ title: 'Doing' }, { title: 'Done' }], items: [
      { cardId: 'a', listTitle: 'Doing', title: 'Order\nvalves', description: 'Two of them\n* not a heading', labels: ['priority:B', 'shop floor'],
        startAt: '2026-10-01T00:00:00.000Z', dueAt: '2026-10-10T14:30:00.000Z', createdAt: '2026-09-01T12:00:00.000Z',
        checklists: [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }] },
      { cardId: 'b', listTitle: 'Done', title: 'Ship it', labels: [], endAt: '2026-10-09T12:00:00.000Z' },
    ] };
    const org = formatters.orgmode(collected);
    assert.match(org, /^#\+TITLE: Plant\n#\+TODO: TODO \| DONE\n/);
    assert.match(org, /^\*\* TODO \[#B\] Order valves :shop_floor:$/m);
    assert.match(org, /^ {3}SCHEDULED: <2026-10-01 Thu> DEADLINE: <2026-10-10 Sat 14:30>$/m);
    const back = EXTERNAL_PARSERS.orgmode(org);
    assert.deepEqual(back.columns.map(c => c.title), ['Doing', 'Done']);
    const [valves, ship] = back.tasks;
    assert.equal(valves.title, 'Order valves');
    assert.deepEqual(valves.tags, ['priority:B', 'shop_floor']);
    assert.equal(valves.description, 'Two of them\n* not a heading', 'an indented star line stays body text');
    assert.deepEqual([valves.date_started, valves.date_due, valves.date_creation],
      ['2026-10-01T00:00:00.000Z', '2026-10-10T14:30:00.000Z', '2026-09-01T12:00:00.000Z']);
    assert.deepEqual(valves.checklists, [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }]);
    assert.deepEqual([ship.tags, ship.date_end], [['done'], '2026-10-09T12:00:00.000Z']);
    assert.deepEqual(back.unsupported, []);
    assert.equal(formatOrgMode(collected), org);
  });

  test('negative: not Org, oversized or too many headings is refused; list text is reported', () => {
    assert.throws(() => parseOrgMode('just some notes\nwithout headings'), /no headings/);
    assert.throws(() => parseOrgMode('x'.repeat(16 * 1024 * 1024 + 1)), /too large/);
    assert.throws(() => parseOrgMode('* x\n'.repeat(MAX_ORG_HEADINGS + 1)), /too many headings/);
    assert.deepEqual(parseOrgMode('* List\nSome list text\n** Card\n').unsupported.map(u => u.reason),
      ['text under a list heading has no WeKan field']);
    assert.throws(() => validateImportSourceShape('orgmode', '  '), /Invalid orgmode/);
  });

  test('wired in: import page, server import, export menu and route', () => {
    assert.match(read('client/components/import/import.js'), /\{ key: 'orgmode', name: 'Org mode' \}/);
    assert.match(read('client/components/import/import.js'), /\|\| dataSource === 'orgmode'\)/);
    assert.match(read('models/import.js'), /case 'orgmode':\s*\/\/[^\n]*\n\s*check\(board, String\);/);
    assert.match(read('models/import.js'), /new KanboardCreator\(data, 'orgmode'\)/);
    assert.match(read('client/components/boards/exportScope.js'), /key: 'orgmode'[^\n]*path: 'export\/orgmode', ext: 'org'/);
    assert.match(read('models/export.js'), /orgmode: 'text\/x-org'/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-orgmode'], /Org mode/);
  });

  console.log(`\norgMode: ${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
