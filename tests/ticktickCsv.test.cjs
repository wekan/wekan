'use strict';

// TickTick backup CSV import/export (models/lib/ticktickCsvFormat.js), in the
// layout of real TickTick backups (versions 7.1 and 7.2).
// Run: node tests/ticktickCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const HEADER_71 = ['Folder Name', 'List Name', 'Title', 'Kind', 'Tags', 'Content', 'Is Check list', 'Start Date', 'Due Date', 'Reminder',
  'Repeat', 'Priority', 'Status', 'Created Time', 'Completed Time', 'Order', 'Timezone', 'Is All Day', 'Is Floating', 'Column Name',
  'Column Order', 'View Mode', 'taskId', 'parentId'];
const q = value => `"${String(value).replace(/"/g, '""')}"`;
const backup = (version, header, rows) => [
  q('Date: 2026-06-29+0000'), q(`Version: ${version}`), q('Status: \n0 Normal\n1 Completed\n2 Archived'),
  header.map(q).join(','),
  ...rows.map(values => header.map(name => q(values[name] === undefined ? '' : values[name])).join(',')),
].join('\n');

async function main() {
  const { parseTickTickCsv, formatTickTickCsv, ticktickDate, TICKTICK_COLUMNS } = await import('../models/lib/ticktickCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a 7.2 backup maps lists, columns, tasks, tags, dates, checklist, priority, folder and subtasks', () => {
    const board = parseTickTickCsv(backup('7.2', [...HEADER_71, 'projectKind'], [
      { 'Folder Name': 'Work', 'List Name': 'Sprint', Title: 'Write importer', Kind: 'TEXT', Tags: 'wekan, dev', Content: 'Parse the CSV',
        'Is Check list': 'N', 'Start Date': '2026-10-07T21:00:00+0000', 'Due Date': '2026-10-09T21:00:00+0000', Reminder: 'PT0S',
        Priority: '5', Status: '0', 'Created Time': '2026-10-01T08:00:00+0000', Timezone: 'Europe/Helsinki', 'Is All Day': 'true',
        'Is Floating': 'false', 'Column Name': 'Doing', 'View Mode': 'kanban', taskId: '1', projectKind: 'TASK' },
      { 'Folder Name': 'Work', 'List Name': 'Sprint', Title: 'Sub step', Kind: 'CHECKLIST', Content: 'Remember this\n▫open item\n▪done item',
        'Is Check list': 'Y', Priority: '0', Status: '1', 'Completed Time': '2026-10-05T12:30:00+0000', 'Is All Day': 'false',
        'Column Name': 'Doing', taskId: '2', parentId: '1' },
      { 'List Name': 'Inbox', Title: 'Read later', Status: '2', 'Completed Time': '2026-09-01T10:00:00+0000', Repeat: 'FREQ=WEEKLY;INTERVAL=1', taskId: '3' },
      { 'List Name': 'Inbox', Title: 'Dropped', Status: '-1', taskId: '4' },
    ]));
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Sprint', 'Inbox'], 'each TickTick list is a swimlane');
    assert.deepEqual(board.columns.map(c => c.title), ['Doing', 'Tasks'], 'its kanban columns are lists');
    const [write, sub, later, dropped] = board.tasks;
    assert.deepEqual(write.tags, ['wekan', 'dev']);
    assert.equal(write.description, 'Parse the CSV');
    assert.equal(write.date_started, '2026-10-08T00:00:00.000Z', 'an all-day date is the day in its time zone');
    assert.equal(write.date_due, '2026-10-10T00:00:00.000Z');
    assert.equal(write.date_creation, '2026-10-01T08:00:00.000Z');
    assert.deepEqual(write.custom_fields, { Priority: 'High', Folder: 'Work' });
    assert.equal(sub.description, 'Remember this');
    assert.deepEqual(sub.checklists, [{ title: 'Checklist', items: [{ title: 'open item', done: false }, { title: 'done item', done: true }] }]);
    assert.equal(sub.date_end, '2026-10-05T12:30:00.000Z');
    assert.equal(sub.parent_ref, '1');
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
    assert.equal(later.archived, true);
    assert.equal(later.column_name, 'Tasks');
    assert.deepEqual(dropped.tags, ["won't do"]);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /Reminder TickTick reminders/);
    assert.match(reasons, /Repeat repeating task "FREQ=WEEKLY;INTERVAL=1" is imported once/);
  });

  test('a 7.1 backup without projectKind reads the same, by header name', () => {
    const board = parseTickTickCsv(backup('7.1', HEADER_71, [{ 'List Name': 'L', Title: 'T', 'Column Name': 'C', Priority: '3' }]));
    assert.deepEqual(board.tasks[0].custom_fields, { Priority: 'Medium' });
  });

  test('negative: unknown codes and dates are reported, and a non-backup is refused', () => {
    const board = parseTickTickCsv(backup('7.2', HEADER_71, [
      { 'List Name': 'L', Title: 'T', Priority: '4', Status: '7', 'Due Date': '10/10/2026' },
      { 'List Name': 'L', Title: '' },
    ]));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /Priority TickTick priority "4"/);
    assert.match(reasons, /Status TickTick status "7"/);
    assert.match(reasons, /Due Date TickTick date "10\/10\/2026"/);
    assert.match(reasons, /a TickTick row without a title/);
    assert.equal(ticktickDate('2026-10-10T00:00:00+0000', { allDay: true, timezone: 'Not/AZone' }), '2026-10-10T00:00:00.000Z', 'an unknown zone keeps the UTC day');
    assert.throws(() => parseTickTickCsv('"Title","List"\n"a","b"'), /Folder Name/);
    assert.throws(() => parseTickTickCsv('"Folder Name","Kind"\n"a","b"'), /List Name and Title/);
  });

  test('export writes a backup TickTick reads, and it imports back', () => {
    const csv = formatters.ticktick({
      board: { title: 'Launch' },
      lists: [{ title: 'To do' }, { title: 'Done' }],
      items: [
        { cardId: 'c1', title: 'Order "valves"', listTitle: 'To do', description: 'Two, DN50', labels: ['urgent', 'a,b'],
          dueAt: '2026-10-20T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', customFields: { Priority: 'Medium', Folder: 'Work' },
          checklists: [{ title: 'C', items: [{ title: 'Quote', done: true }, { title: 'Order', done: false }] }] },
        { cardId: 'c2', title: 'Ship it', listTitle: 'Done', endAt: '2026-10-07T10:00:00.000Z', dueAt: '2026-10-07T09:30:00.000Z', parentCardId: 'c1' },
      ],
    }, new Date(Date.UTC(2026, 9, 8)));
    const lines = csv.split('\n');
    assert.equal(lines[0], '"Date: 2026-10-08+0000"');
    assert.equal(lines[1], '"Version: 7.2"');
    assert.ok(csv.includes(TICKTICK_COLUMNS.map(name => `"${name}"`).join(',')));
    const back = parseTickTickCsv(csv);
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Launch']);
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    const [order, ship] = back.tasks;
    assert.equal(order.title, 'Order "valves"');
    assert.equal(order.description, 'Two, DN50');
    assert.deepEqual(order.tags, ['urgent', 'a b']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(order.custom_fields, { Priority: 'Medium', Folder: 'Work' });
    assert.deepEqual(order.checklists[0].items, [{ title: 'Quote', done: true }, { title: 'Order', done: false }]);
    assert.equal(ship.date_end, '2026-10-07T10:00:00.000Z');
    assert.equal(ship.date_due, '2026-10-07T09:30:00.000Z', 'a timed date is not all-day');
    assert.equal(ship.parent_ref, order.ref);
  });

  test('wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.ticktick, parseTickTickCsv);
    assert.equal(formatters.ticktick, formatTickTickCsv);
    assert.match(read('models/import.js'), /case 'ticktick':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.ticktick\(importedBoard\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /ticktick: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'ticktick', name: 'TickTick'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'ticktick', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'ticktick'[^}]*path: 'export\/ticktick', ext: 'csv'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-ticktick'], /Backup & Import/);
  });

  console.log(`\nticktickCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
