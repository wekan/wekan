'use strict';
// Microsoft Lists (SharePoint lists) as CSV: a list's "Export to CSV" read as
// a board, and a board written as the CSV "From CSV" makes a list of
// (models/lib/msListsCsvFormat.js).
// Run: node --test tests/msListsCsv.test.cjs
const test = require('node:test');
const assert = require('node:assert');

let lists;
test.before(async () => { lists = await import('../models/lib/msListsCsvFormat.js'); });

// The Issue tracker template's columns, as "Export to CSV" writes them.
const ISSUES = [
  'Title,Description,Priority,Status,Assigned to,Date reported,Issue source,Images,Issue loggedby,Created,Created By,Modified,Modified By',
  'Projector flickers,"Room 4, since Monday",High,In progress,Megan Bowen;Alex Wilber,11/16/2026,https://example.com/4,,Megan Bowen,11/16/2026 9:00 AM,Megan Bowen,11/17/2026 1:00 PM,Alex Wilber',
  'Badge reader,,Medium,New,,11/18/2026,,,,11/18/2026 2:30 PM,Alex Wilber,11/18/2026 2:30 PM,Alex Wilber',
  'Coffee machine,,Low,Completed,Alex Wilber,11/10/2026,,,,11/10/2026 8:00 AM,Megan Bowen,11/12/2026 8:00 AM,Megan Bowen',
].join('\r\n');

test('an Issue tracker list becomes a board: Status the lists, people, dates and the other columns', () => {
  const board = lists.parseMsListsCsv(`﻿${ISSUES}`);
  assert.deepStrictEqual(board.columns.map(c => c.title), ['In progress', 'New', 'Completed']);
  const [projector, badge] = board.tasks;
  assert.strictEqual(projector.title, 'Projector flickers');
  assert.strictEqual(projector.description, 'Room 4, since Monday');
  assert.strictEqual(projector.owner_username, 'Megan Bowen');
  assert.deepStrictEqual(projector.assignees, ['Alex Wilber']);
  assert.strictEqual(projector.requested_by, 'Megan Bowen');
  assert.strictEqual(projector.date_creation, '2026-11-16T09:00:00.000Z');
  assert.strictEqual(projector.custom_fields.Priority, 'High');
  assert.strictEqual(projector.custom_fields['Date reported'], '11/16/2026');
  assert.strictEqual(badge.owner_username, undefined);
  assert.ok(board.unsupported.some(u => /Modified/.test(u.reason)));
});

test('the Work progress tracker\'s Progress column is the list, Yes/No a boolean, ;# people split', () => {
  const csv = 'Work item,Progress,Assigned To,Due date,Done\nPlan,Not started,1;#Megan Bowen;#2;#Alex Wilber,2026-12-01,FALSE\n';
  const task = lists.parseMsListsCsv(`Title,${csv.slice('Work item,'.length)}`).tasks[0];
  assert.strictEqual(task.column_name, 'Not started');
  assert.strictEqual(task.owner_username, 'Megan Bowen');
  assert.deepStrictEqual(task.assignees, ['Alex Wilber']);
  assert.strictEqual(task.date_due, '2026-12-01T00:00:00.000Z');
  assert.strictEqual(task.custom_fields.Done, false);
});

test('round trip: the export makes the same board again', () => {
  const items = [
    { title: 'Projector flickers', listTitle: 'In progress', owner: 'megan', assignees: ['alex'], labels: ['AV', 'Room 4'],
      dueAt: '2026-11-30T00:00:00.000Z', startAt: '2026-11-16T00:00:00.000Z', description: 'Since Monday,\nevery hour.',
      customFields: { Priority: 'High', 'Cost: €': 120, Urgent: true } },
    { title: 'Badge reader', listTitle: 'New', labels: [] },
  ];
  const csv = lists.formatMsListsCsv({ items });
  assert.match(csv, /^﻿Title,Status,Assigned to,Start date,Due date,Tags,Description,Priority,Cost €,Urgent\r\n/);
  const back = lists.parseMsListsCsv(csv);
  const [a, b] = back.tasks;
  assert.deepStrictEqual([a.title, a.column_name, a.owner_username, a.assignees, a.tags], ['Projector flickers', 'In progress', 'megan', ['alex'], ['AV', 'Room 4']]);
  assert.strictEqual(a.date_due, '2026-11-30T00:00:00.000Z');
  assert.strictEqual(a.date_started, '2026-11-16T00:00:00.000Z');
  assert.strictEqual(a.description, 'Since Monday,\nevery hour.');
  assert.deepStrictEqual(a.custom_fields, { Priority: 'High', 'Cost €': '120', Urgent: true });
  assert.strictEqual(b.column_name, 'New');
});

test('negative: no items, or only a header, is refused; a column name never keeps characters Lists refuses', () => {
  assert.throws(() => lists.parseMsListsCsv('Title,Status'), /at least one item/);
  assert.throws(() => lists.parseMsListsCsv('Title,Status\n,New'), /no items with a title/);
  const header = lists.formatMsListsCsv({ items: [{ title: 'A', customFields: { 'a#b%c?d': 1 } }] }).split('\r\n')[0];
  assert.ok(!/[#%?]/.test(header));
});
