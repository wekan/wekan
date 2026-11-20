'use strict';
// Google Takeout .zip: Tasks, Keep, Mail, Calendar and Google Chat into one
// board, a swimlane per product (models/lib/googleTakeoutFormat.js, the zip
// read by server/lib/chatArchives.js readGoogleTakeout).
// Run: node --test tests/googleTakeoutFormat.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { zipSync, strToU8 } = require('fflate');
const { readGoogleTakeout } = require('../server/lib/chatArchives');

const zipOf = files => ({ zipBase64: Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, strToU8(typeof value === 'string' ? value : JSON.stringify(value))])))).toString('base64') });

// The folder names are Finnish on purpose: Takeout writes them in the
// account's language, so products are recognised by content.
const TAKEOUT = {
  'Takeout/Tehtävät/Tasks.json': { kind: 'tasks#taskLists', items: [{ kind: 'tasks#taskList', title: 'Omat tehtävät', items: [
    { kind: 'tasks#task', id: 'a', title: 'Pay rent', notes: 'By transfer', status: 'needsAction', due: '2026-11-30T00:00:00.000Z' },
    { kind: 'tasks#task', id: 'b', parent: 'a', title: 'Find IBAN', status: 'completed', completed: '2026-11-10T10:00:00.000Z' },
  ] }] },
  'Takeout/Keep/Recipe.json': { title: 'Recipe', textContent: 'Pancakes', color: 'YELLOW', isTrashed: false, isArchived: false, isPinned: true,
    labels: [{ name: 'food' }], listContent: [{ text: 'Eggs', isChecked: true }], createdTimestampUsec: 1794823200000000 },
  'Takeout/Keep/Old.json': { title: 'Old', textContent: 'gone', isTrashed: true, isArchived: false },
  'Takeout/Keep/Recipe.html': '<html>the same note as HTML</html>',
  'Takeout/Sähköposti/All mail Including Spam and Trash.mbox': [
    'From 1@xxx Mon Nov 16 10:00:00 +0000 2026', 'X-Gmail-Labels: Inbox,Work', 'From: Anna <anna@example.com>',
    'Subject: Hello', 'Date: Mon, 16 Nov 2026 10:00:00 +0000', 'Message-ID: <m1@example.com>', '', 'Body', ''].join('\n'),
  'Takeout/Kalenteri/anna@example.com.ics': 'BEGIN:VCALENDAR\nX-WR-CALNAME:Anna\nBEGIN:VEVENT\nUID:e\nSUMMARY:Dentist\nDTSTART:20261118T080000Z\nDTEND:20261118T090000Z\nEND:VEVENT\nEND:VCALENDAR\n',
  'Takeout/Google Chat/Groups/Space AAAA/group_info.json': { name: 'Project', members: [{ name: 'Anna', email: 'anna@example.com' }] },
  'Takeout/Google Chat/Groups/Space AAAA/messages.json': { messages: [
    { creator: { name: 'Anna', email: 'anna@example.com' }, created_date: 'Monday, November 16, 2026 at 10:00:00 AM UTC', text: 'Kickoff' }] },
  'Takeout/YouTube/history.json': [{ title: 'video' }],
  'Takeout/archive_browser.html': '<html></html>',
};

let takeout;
test.before(async () => { takeout = await import('../models/lib/googleTakeoutFormat.js'); });

test('one Takeout zip is one board with a swimlane per product', async () => {
  const board = takeout.parseGoogleTakeout(await readGoogleTakeout(zipOf(TAKEOUT)));
  assert.deepStrictEqual(board.swimlanes.map(s => s.name), ['Mail', 'Tasks', 'Keep', 'Calendar', 'Google Chat']);
  assert.strictEqual(board.columns[0].title, 'Inbox', 'the Inbox is the first list, which Board View / Email reads');
  const by = lane => board.tasks.filter(t => t.swimlane_name === lane);
  const [mail] = by('Mail');
  assert.strictEqual(mail.email.from.address, 'anna@example.com');
  assert.deepStrictEqual(mail.tags, ['Work']);
  const [rent, iban] = by('Tasks');
  assert.deepStrictEqual([rent.title, rent.column_name, rent.date_due], ['Pay rent', 'Omat tehtävät', '2026-11-30T00:00:00.000Z']);
  assert.deepStrictEqual([iban.parent_ref, iban.tags, iban.date_end], ['a', ['done'], '2026-11-10T10:00:00.000Z']);
  const keep = by('Keep');
  assert.deepStrictEqual(keep.map(t => t.title), ['Recipe'], 'a trashed note is left out');
  assert.deepStrictEqual([keep[0].color, keep[0].tags, keep[0].checklists[0].items],
    ['yellow', ['food', 'pinned'], [{ title: 'Eggs', done: true }]]);
  assert.strictEqual(keep[0].date_creation, '2026-11-16T10:00:00.000Z');
  assert.deepStrictEqual(by('Calendar').map(t => [t.title, t.column_name]), [['Dentist', 'Events']]);
  const [space] = by('Google Chat');
  assert.deepStrictEqual([space.title, space.comments[0].text], ['Project', 'Kickoff']);
  // What could not be imported is said, product by product.
  assert.ok(board.unsupported.some(u => u.path === '/YouTube'));
  assert.ok(!board.unsupported.some(u => /archive_browser/.test(u.path)), 'a file beside the products is no product');
  assert.ok(board.unsupported.some(u => /Keep trash/.test(u.reason)));
  assert.ok(!board.unsupported.some(u => /Keep$|Tehtävät|Sähköposti/.test(u.path)), 'a product that was read is not reported as skipped');
});

test('negative: a Takeout with nothing for a board, and a file that is not a zip', async () => {
  const empty = await readGoogleTakeout(zipOf({ 'Takeout/YouTube/history.json': [] }));
  assert.throws(() => takeout.parseGoogleTakeout(empty), /no Tasks, Keep, Mail, Calendar or Google Chat/);
  await assert.rejects(readGoogleTakeout({ zipBase64: 'bm90IGEgemlw' }), /not a \.zip/);
  await assert.rejects(readGoogleTakeout({}), /empty/);
});
