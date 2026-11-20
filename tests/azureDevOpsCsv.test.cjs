'use strict';
// Azure DevOps Boards work items as CSV: "Export to CSV" of a query read as
// a board, and a board written as the file "Import from CSV" reads
// (models/lib/azureDevOpsCsvFormat.js). The header and the cells are as
// Azure DevOps writes them: display names, "Name <address>" people, "; "
// tags, regional dates, and "Title 1", "Title 2" columns for a tree query.
// Run: node --test tests/azureDevOpsCsv.test.cjs
const test = require('node:test');
const assert = require('node:assert');

let ado;
test.before(async () => { ado = await import('../models/lib/azureDevOpsCsvFormat.js'); });

const FLAT = [
  'ID,Work Item Type,Title,Assigned To,State,Tags,Board Column,Board Lane,Description,Priority,Story Points,Area Path,Created Date,Target Date,Closed Date,Changed Date,Parent',
  '101,User Story,Sign in with SSO,Jamal Hartnett <fabrikamfiber4@hotmail.com>,Active,auth; web,Doing,Expedite,"<div>Users sign in <b>once</b>.</div><div>Then stay in.</div>",2,5,Fabrikam\\Web,11/3/2026 9:15:00 AM,11/30/2026,,11/5/2026 1:00:00 PM,',
  '102,Task,Write the login page,Raisa Pokrovskaya <raisa@contoso.com>,Closed,web,Done,,,1,,Fabrikam\\Web,11/4/2026 10:00:00 AM,,11/6/2026 4:30:00 PM,11/6/2026 4:30:00 PM,101',
  '103,Bug,"Logout keeps the session, sometimes",,New,,,,,3,,Fabrikam,11/7/2026 8:00:00 AM,,,11/7/2026 8:00:00 AM,',
].join('\r\n');

test('a query\'s CSV becomes a board: lists, lanes, labels, people, dates and fields', () => {
  const board = ado.parseAzureDevOpsCsv(`﻿${FLAT}`);
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Doing', 'Done', 'New']);
  assert.deepStrictEqual(board.swimlanes.map(s => s.name), ['Expedite', 'Default']);
  const [story, task, bug] = board.tasks;
  assert.strictEqual(story.title, 'Sign in with SSO');
  assert.deepStrictEqual(story.tags, ['User Story', 'auth', 'web']);
  assert.strictEqual(story.owner_username, 'Jamal Hartnett');
  assert.strictEqual(story.description, 'Users sign in **once**.\n\nThen stay in.');
  assert.strictEqual(story.date_creation, '2026-11-03T09:15:00.000Z');
  assert.strictEqual(story.date_due, '2026-11-30T00:00:00.000Z');
  assert.deepStrictEqual(story.custom_fields, { Priority: 2, 'Story Points': 5, 'Area Path': 'Fabrikam\\Web' });
  assert.strictEqual(task.parent_ref, '101');
  assert.strictEqual(task.date_end, '2026-11-06T16:30:00.000Z');
  assert.strictEqual(bug.title, 'Logout keeps the session, sometimes');
  assert.strictEqual(bug.column_name, 'New');
  assert.ok(board.unsupported.some(u => /Changed Date/.test(u.reason)));
});

test('a tree query\'s Title 1 / Title 2 / Title 3 columns are the parent and child cards', () => {
  const csv = ['ID,Work Item Type,Title 1,Title 2,Title 3,State',
    '1,Epic,Checkout,,,New', '2,Feature,,Payments,,Active', '3,User Story,,,Card payments,Active', '4,Feature,,Receipts,,New'].join('\n');
  const tasks = ado.parseAzureDevOpsCsv(csv).tasks;
  assert.deepStrictEqual(tasks.map(t => [t.title, t.parent_ref || '']), [['Checkout', ''], ['Payments', '1'], ['Card payments', '2'], ['Receipts', '1']]);
});

test('a day-first export (en-GB, fi-FI) reads its dates day first', () => {
  const gb = ado.parseAzureDevOpsCsv('Title,State,Created Date\nA,New,25/11/2026 14:05\nB,New,03/11/2026');
  assert.deepStrictEqual(gb.tasks.map(t => t.date_creation), ['2026-11-25T14:05:00.000Z', '2026-11-03T00:00:00.000Z']);
  const fi = ado.parseAzureDevOpsCsv('Title,State,Created Date\nA,New,3.11.2026 9.15');
  assert.strictEqual(fi.tasks[0].date_creation, '2026-11-03T09:15:00.000Z');
});

test('round trip: the export imports back with the same lists, types, tags, owner and text', () => {
  const items = [
    { cardId: 'a', title: 'Sign in with SSO', listTitle: 'Active', labels: ['User Story', 'auth'], owner: 'jamal',
      description: 'Users sign in once.\n\nThen stay in.', customFields: { Priority: 2 } },
    { cardId: 'b', title: 'Logout, "sometimes"', listTitle: 'Waiting', labels: ['Bug'], description: '' },
    { cardId: 'c', title: 'Plain card', listTitle: 'Done', labels: [] },
  ];
  const csv = ado.formatAzureDevOpsCsv({ items });
  const header = csv.replace(/^﻿/, '').split('\r\n')[0];
  assert.strictEqual(header, 'ID,Work Item Type,Title,Assigned To,State,Tags,Description,Priority');
  const back = ado.parseAzureDevOpsCsv(csv);
  assert.deepStrictEqual(back.tasks.map(t => [t.title, t.column_name, t.tags]), [
    ['Sign in with SSO', 'Active', ['User Story', 'auth']],
    // "Waiting" is no state of the built-in processes: a tag, and the type's first state.
    ['Logout, "sometimes"', 'New', ['Bug', 'Waiting']],
    ['Plain card', 'Done', ['Task']],
  ]);
  assert.strictEqual(back.tasks[0].owner_username, 'jamal');
  assert.strictEqual(back.tasks[0].description, 'Users sign in once.\n\nThen stay in.');
  assert.deepStrictEqual(back.tasks[0].custom_fields, { Priority: 2 });
  // Every row is a new work item, as "Import from CSV" requires.
  assert.ok(csv.split('\r\n').slice(1).filter(Boolean).every(row => row.startsWith(',')));
});

test('paged export: the header on the first page only, and no Priority column the board never had', () => {
  const all = [{ cardId: 'a', title: 'A', listTitle: 'New', labels: [] }, { cardId: 'b', title: 'B', listTitle: 'New', labels: [] }];
  const first = ado.formatAzureDevOpsCsv({ items: [all[0]], page: { all, offset: 0, first: true, last: false } });
  const second = ado.formatAzureDevOpsCsv({ items: [all[1]], page: { all, offset: 1, first: false, last: true } });
  assert.match(first, /^﻿ID,Work Item Type,Title,Assigned To,State,Tags,Description\r\n/);
  assert.ok(!/Work Item Type/.test(second));
});

test('negative: a file that is not Azure DevOps\'s is refused, and tags never carry separators', () => {
  assert.throws(() => ado.parseAzureDevOpsCsv('Name,Status\nA,Open'), /needs the Title column/);
  assert.throws(() => ado.parseAzureDevOpsCsv(''), /empty/);
  const csv = ado.formatAzureDevOpsCsv({ items: [{ title: 'A', listTitle: 'New', labels: ['one, two; three'] }] });
  assert.ok(csv.includes(',one two three,'));
  assert.strictEqual(ado.azureDevOpsPerson('Jamal Hartnett <j@example.com>'), 'Jamal Hartnett');
  assert.strictEqual(ado.azureDevOpsPerson('<j@example.com>'), 'j@example.com');
});
