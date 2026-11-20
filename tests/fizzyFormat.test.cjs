'use strict';
// Fizzy (https://github.com/basecamp/fizzy): its account export and personal
// data export read as a board, and a board written as the account export
// Fizzy's account import reads (models/lib/fizzyFormat.js,
// server/lib/fizzyArchive.js). The rows are shaped as Fizzy's db/schema.rb and
// app/models/account/data_transfer/* write them.
// Run: node --test tests/fizzyFormat.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const { readFizzyExport } = require('../server/lib/fizzyArchive');

let fizzy;
test.before(async () => { fizzy = await import('../models/lib/fizzyFormat.js'); });

const zipOf = files => ({ zipBase64: Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, strToU8(typeof value === 'string' ? value : JSON.stringify(value))])))).toString('base64') });
const at = '2026-11-16T10:00:00.000Z';
const id = n => String(n).padStart(25, '0');

// Every column Fizzy's import requires of each table it reads back
// (db/schema.rb, and the record sets' own lists for users and rich text).
const REQUIRED = {
  boards: ['id', 'account_id', 'all_access', 'created_at', 'creator_id', 'name', 'updated_at'],
  columns: ['id', 'account_id', 'board_id', 'color', 'created_at', 'name', 'position', 'updated_at'],
  cards: ['id', 'account_id', 'board_id', 'column_id', 'created_at', 'creator_id', 'due_on', 'last_active_at', 'number', 'status', 'title', 'updated_at'],
  comments: ['id', 'account_id', 'card_id', 'created_at', 'creator_id', 'updated_at'],
  steps: ['id', 'account_id', 'card_id', 'completed', 'content', 'created_at', 'updated_at'],
  tags: ['id', 'account_id', 'created_at', 'title', 'updated_at'],
  taggings: ['id', 'account_id', 'card_id', 'created_at', 'tag_id', 'updated_at'],
  assignments: ['id', 'account_id', 'assignee_id', 'assigner_id', 'card_id', 'created_at', 'updated_at'],
  closures: ['id', 'account_id', 'card_id', 'created_at', 'updated_at', 'user_id'],
  card_not_nows: ['id', 'account_id', 'card_id', 'created_at', 'updated_at', 'user_id'],
  card_goldnesses: ['id', 'account_id', 'card_id', 'created_at', 'updated_at'],
  accesses: ['id', 'accessed_at', 'account_id', 'board_id', 'created_at', 'involvement', 'updated_at', 'user_id'],
  users: ['id', 'email_address', 'name', 'role', 'active', 'verified_at', 'created_at', 'updated_at'],
  action_text_rich_texts: ['account_id', 'body', 'created_at', 'id', 'name', 'record_id', 'record_type', 'updated_at'],
};

const accountExport = () => ({
  'fizzy-export/data/account.json': { id: id('a'), name: 'Plant', cards_count: 4, join_code: { code: 'Ab12-Cd34-Ef56', usage_count: 0, usage_limit: 10 } },
  'fizzy-export/data/users/0000000000000000000000ann.json': { id: '0000000000000000000000ann', name: 'Ann', role: 'owner', active: true, email_address: 'ann@example.com' },
  'fizzy-export/data/users/0000000000000000000000bob.json': { id: '0000000000000000000000bob', name: 'Bob', role: 'member', active: true, email_address: null },
  [`fizzy-export/data/boards/${id('b1')}.json`]: { id: id('b1'), name: 'Maintenance', creator_id: '0000000000000000000000ann' },
  [`fizzy-export/data/columns/${id('c2')}.json`]: { id: id('c2'), board_id: id('b1'), name: 'Doing', position: 2 },
  [`fizzy-export/data/columns/${id('c1')}.json`]: { id: id('c1'), board_id: id('b1'), name: 'Next', position: 1 },
  [`fizzy-export/data/cards/${id('k1')}.json`]: { id: id('k1'), board_id: id('b1'), column_id: id('c2'), number: 1, status: 'published',
    title: 'Replace valve', creator_id: '0000000000000000000000ann', created_at: at, due_on: '2026-12-01' },
  [`fizzy-export/data/cards/${id('k2')}.json`]: { id: id('k2'), board_id: id('b1'), column_id: null, number: 2, status: 'published', title: 'Idea', creator_id: '0000000000000000000000bob', created_at: at },
  [`fizzy-export/data/cards/${id('k3')}.json`]: { id: id('k3'), board_id: id('b1'), column_id: id('c1'), number: 3, status: 'published', title: 'Shipped', creator_id: '0000000000000000000000ann', created_at: at },
  [`fizzy-export/data/cards/${id('k4')}.json`]: { id: id('k4'), board_id: id('b1'), number: 4, status: 'drafted', title: 'Draft', creator_id: '0000000000000000000000ann', created_at: at },
  [`fizzy-export/data/cards/${id('k5')}.json`]: { id: id('k5'), board_id: id('b1'), number: 5, status: 'published', title: 'Later', creator_id: '0000000000000000000000ann', created_at: at },
  [`fizzy-export/data/closures/${id('x1')}.json`]: { id: id('x1'), card_id: id('k3') },
  [`fizzy-export/data/card_not_nows/${id('n1')}.json`]: { id: id('n1'), card_id: id('k5') },
  [`fizzy-export/data/card_goldnesses/${id('g1')}.json`]: { id: id('g1'), card_id: id('k1') },
  [`fizzy-export/data/tags/${id('t1')}.json`]: { id: id('t1'), title: 'pump' },
  [`fizzy-export/data/taggings/${id('tg1')}.json`]: { id: id('tg1'), card_id: id('k1'), tag_id: id('t1') },
  [`fizzy-export/data/assignments/${id('as1')}.json`]: { id: id('as1'), card_id: id('k1'), assignee_id: '0000000000000000000000bob', assigner_id: '0000000000000000000000ann' },
  [`fizzy-export/data/steps/${id('s1')}.json`]: { id: id('s1'), card_id: id('k1'), content: 'Order part', completed: true, created_at: at },
  [`fizzy-export/data/steps/${id('s2')}.json`]: { id: id('s2'), card_id: id('k1'), content: 'Fit it', completed: false, created_at: '2026-11-16T10:01:00.000Z' },
  [`fizzy-export/data/comments/${id('m1')}.json`]: { id: id('m1'), card_id: id('k1'), creator_id: '0000000000000000000000bob', created_at: '2026-11-16T11:00:00.000Z' },
  [`fizzy-export/data/action_text_rich_texts/${id('r1')}.json`]: { id: id('r1'), record_type: 'Card', record_id: id('k1'), name: 'description', body: '<p>The <strong>old</strong> one leaks</p>' },
  [`fizzy-export/data/action_text_rich_texts/${id('r2')}.json`]: { id: id('r2'), record_type: 'Comment', record_id: id('m1'), name: 'body', body: '<p>Part ordered</p>' },
  [`fizzy-export/data/active_storage_blobs/${id('bl1')}.json`]: { id: id('bl1'), key: 'keyone', filename: 'photo.jpg' },
  [`fizzy-export/data/active_storage_blobs/${id('bl2')}.json`]: { id: id('bl2'), key: 'keytwo', filename: 'missing.pdf' },
  [`fizzy-export/data/active_storage_attachments/${id('at1')}.json`]: { id: id('at1'), record_type: 'ActionText::RichText', record_id: id('r1'), blob_id: id('bl1'), name: 'embeds' },
  [`fizzy-export/data/active_storage_attachments/${id('at2')}.json`]: { id: id('at2'), record_type: 'ActionText::RichText', record_id: id('r2'), blob_id: id('bl2'), name: 'embeds' },
  [`fizzy-export/data/reactions/${id('re1')}.json`]: { id: id('re1') },
  'fizzy-export/storage/keyone': 'JPEGDATA',
});

test('Fizzy account export: columns in position order between Maybe?, Not now and Done; everything a card carries', async () => {
  const board = fizzy.parseFizzyExport(await readFizzyExport(zipOf(accountExport())));
  assert.strictEqual(board.board.name, 'Plant');
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Maybe?', 'Next', 'Doing', 'Not now', 'Done']);
  assert.deepStrictEqual(board.swimlanes.map(s => s.name), ['Maintenance']);
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.column_name]), [
    ['Replace valve', 'Doing'], ['Idea', 'Maybe?'], ['Shipped', 'Done'], ['Later', 'Not now'],
  ]);
  const [valve] = board.tasks;
  assert.strictEqual(valve.description, 'The **old** one leaks');
  assert.strictEqual(valve.date_due, '2026-12-01');
  assert.strictEqual(valve.color, 'gold');
  assert.deepStrictEqual(valve.tags, ['pump']);
  assert.strictEqual(valve.owner_id, '0000000000000000000000bob');
  assert.strictEqual(valve.requested_by, 'Ann');
  assert.deepStrictEqual(valve.checklists, [{ title: 'Steps', items: [{ title: 'Order part', done: true }, { title: 'Fit it', done: false }] }]);
  assert.deepStrictEqual(valve.comments.map(c => [c.author, c.authorName, c.text]), [['0000000000000000000000bob', 'Bob', 'Part ordered']]);
  assert.deepStrictEqual(valve.attachments.map(a => [a.name, Buffer.from(a.file, 'base64').toString()]), [['photo.jpg', 'JPEGDATA']]);
  const reasons = board.unsupported.map(u => u.reason).join(' | ');
  assert.match(reasons, /1 draft card/);
  assert.match(reasons, /1 file\(s\) the export names are not in it/);
  assert.match(reasons, /1 reaction\(s\) are not imported/);
});

test('Fizzy personal data export: <number>.json cards, their board and status, files under <number>/', async () => {
  const data = await readFizzyExport(zipOf({
    '2.json': { number: 2, title: 'Second', board: 'Ops', status: 'Done', creator: { id: 'u1', name: 'Ann', email: 'ann@example.com' },
      description: '', created_at: at, updated_at: at, comments: [] },
    '1.json': { number: 1, title: 'First', board: 'Ops', status: 'Doing', creator: { id: 'u1', name: 'Ann' },
      description: '<p>See <img src="1/abc_shot.png" alt="shot.png"></p>', created_at: at, updated_at: at,
      comments: [{ id: 'c1', body: '<p>Ok <a href="1/def_notes.txt">notes.txt</a></p>', creator: { id: 'u2', name: 'Bob' }, created_at: at }] },
    '1/abc_shot.png': 'PNG',
  }));
  const board = fizzy.parseFizzyExport(data);
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Doing', 'Done']);
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.column_name, t.swimlane_name]), [['First', 'Doing', 'Ops'], ['Second', 'Done', 'Ops']]);
  assert.deepStrictEqual(board.tasks[0].attachments.map(a => a.name), ['shot.png']);
  assert.deepStrictEqual(board.tasks[0].comments.map(c => [c.author, c.authorName]), [['u2', 'Bob']]);
  assert.match(board.unsupported.map(u => u.reason).join(), /1 file\(s\)/, 'a file it names but does not hold is counted');
  // One card's JSON, pasted.
  assert.strictEqual(fizzy.parseFizzyExport(JSON.stringify({ number: 7, title: 'Alone', status: 'Maybe?' })).tasks[0].column_name, 'Maybe?');
});

test('negative: what is not a Fizzy export is refused', async () => {
  assert.throws(() => fizzy.parseFizzyExport('not json'), /not JSON/);
  assert.throws(() => fizzy.parseFizzyExport({ hello: 1 }), /no data\/ tables and no card files/);
  assert.throws(() => fizzy.parseFizzyExport({ tables: {} }), /no boards and no cards/);
  await assert.rejects(readFizzyExport(zipOf({ 'readme.txt': 'x' })), /no data\/account\.json and no card files/);
  // A file name outside the card's own folder is never read.
  const data = await readFizzyExport(zipOf({ '1.json': { number: 1, title: 'X', description: '<img src="../../etc/passwd">' }, 'etc/passwd': 'root' }));
  assert.deepStrictEqual(data.files, {});
});

test('Fizzy export: the account export its import reads, every required column, and read back the same', async () => {
  const built = fizzy.formatFizzy({
    board: { _id: 'B1', title: 'Plant', createdAt: at },
    lists: [{ title: 'Next' }, { title: 'Doing' }, { title: 'Done' }],
    items: [
      { cardId: 'C1', title: 'Replace valve', description: 'It **leaks**', listTitle: 'Doing', swimlaneTitle: 'Default', creator: 'ann',
        createdAt: at, dueAt: '2026-12-01T00:00:00.000Z', color: 'gold', labels: [{ name: 'pump' }], owner: 'bob',
        checklists: [{ title: 'Steps', items: [{ title: 'Order part', done: true }] }],
        comments: [{ author: 'bob', text: 'Ordered', date: '2026-11-16T11:00:00.000Z' }] },
      { cardId: 'C2', title: 'Shipped', listTitle: 'Done', swimlaneTitle: 'Default', creator: 'ann', createdAt: at },
      { cardId: 'C3', title: 'Old', listTitle: 'Next', swimlaneTitle: 'Default', archived: true, creator: 'ann', createdAt: at },
    ],
  }, { now: Date.parse(at) });
  const files = fizzy.fizzyArchiveFiles(built);
  const rows = Object.entries(files).map(([p, text]) => [p, JSON.parse(text)]);
  const tableOf = p => p.split('/')[1];
  for (const [p, row] of rows) {
    if (p === 'data/account.json') continue;
    const table = tableOf(p);
    assert.ok(REQUIRED[table], `a table Fizzy reads: ${table}`);
    assert.deepStrictEqual(REQUIRED[table].filter(column => !(column in row)), [], `${p} has every column`);
    assert.strictEqual(p, `data/${table}/${row.id}.json`, 'the file is named by its id, as Fizzy checks');
    assert.match(row.id, /^[0-9a-z]{25}$/, 'a Fizzy id: 25 base36 characters');
  }
  const account = JSON.parse(files['data/account.json']);
  assert.strictEqual(account.name, 'Plant');
  assert.match(account.join_code.code, /^[1-9A-HJ-NP-Za-km-z]{4}-[1-9A-HJ-NP-Za-km-z]{4}-[1-9A-HJ-NP-Za-km-z]{4}$/);
  assert.ok(Number.isInteger(account.join_code.usage_count) && Number.isInteger(account.join_code.usage_limit));
  // Every user a row names is a user of the export (Fizzy refuses one that is not).
  const userIds = new Set(rows.filter(([p]) => tableOf(p) === 'users').map(([, r]) => r.id));
  for (const [, row] of rows) for (const key of ['creator_id', 'assignee_id', 'assigner_id', 'user_id']) if (row[key]) assert.ok(userIds.has(row[key]), key);
  const ids = rows.filter(([p]) => p !== 'data/account.json').map(([, r]) => r.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'no two records share an id');
  // The same board writes the same ids.
  assert.deepStrictEqual(Object.keys(fizzy.fizzyArchiveFiles(fizzy.formatFizzy({ board: { _id: 'B1', title: 'Plant' }, items: [{ cardId: 'C1', title: 'x', createdAt: at }] }, { now: 1 }))).filter(p => p.includes('/cards/')),
    Object.keys(fizzy.fizzyArchiveFiles(fizzy.formatFizzy({ board: { _id: 'B1', title: 'Plant' }, items: [{ cardId: 'C1', title: 'x', createdAt: at }] }, { now: 2 }))).filter(p => p.includes('/cards/')));

  const back = fizzy.parseFizzyExport(await readFizzyExport(zipOf(files)));
  assert.deepStrictEqual(back.columns.map(c => c.title), ['Next', 'Doing', 'Done']);
  assert.deepStrictEqual(back.tasks.map(t => [t.title, t.column_name]), [['Replace valve', 'Doing'], ['Shipped', 'Done'], ['Old', 'Done']]);
  const [valve] = back.tasks;
  assert.strictEqual(valve.description, 'It **leaks**');
  assert.strictEqual(valve.date_due, '2026-12-01');
  assert.strictEqual(valve.color, 'gold');
  assert.deepStrictEqual(valve.tags, ['pump']);
  assert.deepStrictEqual(valve.checklists[0].items, [{ title: 'Order part', done: true }]);
  assert.deepStrictEqual(valve.comments.map(c => [c.authorName, c.text, c.date]), [['bob', 'Ordered', '2026-11-16T11:00:00.000Z']]);
  assert.strictEqual(back.board.name, 'Plant');
});

test('negative: an id is a UUIDv7, and only data/ paths are written', () => {
  const v = BigInt([...fizzy.fizzyId('card:x', Date.parse(at))].reduce((n, ch) => n * 36n + BigInt(parseInt(ch, 36)), 0n));
  assert.strictEqual(Number((v >> 76n) & 0xfn), 7, 'version 7');
  assert.strictEqual(Number((v >> 62n) & 0x3n), 2, 'the RFC 4122 variant');
  assert.strictEqual(Number(v >> 80n), Date.parse(at), 'its time is the record\'s');
  assert.deepStrictEqual(Object.keys(fizzy.fizzyArchiveFiles({ files: { '../x.json': {}, 'data/cards/short.json': {}, 'data/account.json': {} } })), ['data/account.json']);
});

test('Fizzy is wired into the import page, the server, the export menu and api.py', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.match(read('models/lib/importSources.js'), /key: 'fizzy', name: 'Fizzy'[^\n]*files: \['\.zip', '\.json'\], zipSend: 'zip'/);
  assert.match(read('models/import.js'), /case 'fizzy':[\s\S]*?readFizzyExport\(importedBoard\);\s*\}\s*importedBoard = EXTERNAL_PARSERS\.fizzy\(importedBoard\)/);
  assert.match(read('models/lib/importSourceShape.js'), /case 'fizzy':/);
  assert.match(read('models/lib/externalParsers.js'), /fizzy: parseFizzyExport/);
  assert.match(read('client/components/boards/exportScope.js'), /key: 'fizzy'[^\n]*path: 'export\/fizzy', ext: 'zip'/);
  assert.match(read('server/lib/renderExternalExport.js'), /format === 'fizzy'[\s\S]*fizzyArchiveFiles\(built\)/);
  assert.match(read('api.py'), /ZIP_IMPORT_SOURCES = \{[^}]*'fizzy'/);
});
