'use strict';
// Sandstorm grain backups (.zip): the metadata (GrainInfo, Cap'n Proto), and
// each app's grain read as a board and - for the apps WeKan writes - a board
// written as a grain Sandstorm restores, read back
// (models/lib/sandstorm/grainInfo.js, grainApps.js, server/lib/sandstormGrain.js).
// The grains here are made by the test: SQLite databases with node:sqlite,
// files with fflate, in the layouts of grains Sandstorm wrote of each app.
// Run: node --test tests/sandstormGrain.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
const { readSandstormGrain, writeSandstormGrain } = require('../server/lib/sandstormGrain');

let gi;
let apps;
test.before(async () => {
  gi = await import('../models/lib/sandstorm/grainInfo.js');
  apps = await import('../models/lib/sandstorm/grainApps.js');
});

// A SandChat grain's metadata, every name and id replaced by a made-up one.
const METADATA_WITH_USER = 'AAAAADsAAAAAAAAAAQAFAAMAAAAAAAAAEQAAAKoBAAApAAAAugAAADEAAAAKAgAAUQAAAB8AAAAAAAAAAAAAAHE5NXNlejBhY2p3cTdjMWVteHl4ejM4OTQ3c3I3c2djMWduOXlqdTkzbnFjY3o4M2Z6eWgAAAAAQSBtYWRlLXVwIFNhbmRDaGF0IHJvbwAAMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZgAAAAAAAAAABAAAAAAAAwAJAAAACgIAACkAAAAOAAAATAAAAAEAAwAwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmAAAAAAAAAAABAAAACgIAADAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYAAAAAAAAAAAAAAAAAAAAACAAAAAAAAgAVAAAAegAAAAAAAAAAAAAABQAAAHoAAAAAAAAAAAAAAHRlc3Rlcl9oYW5kbGUxAAB0ZXN0ZXJfaGFuZGxlMQAA';
const appOf = key => apps.SANDSTORM_APPS.find(a => a.key === key);
const sqliteFile = (ddl, rows) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grain-test-'));
  const file = path.join(dir, 'db.sqlite');
  const db = new DatabaseSync(file);
  for (const statement of ddl) db.exec(statement);
  for (const [sql, args] of rows) db.prepare(sql).run(...args);
  db.close();
  const bytes = new Uint8Array(fs.readFileSync(file));
  fs.rmSync(dir, { recursive: true, force: true });
  return bytes;
};
const grain = (key, files, title = 'Made-up grain') => ({ zipBase64: Buffer.from(zipSync({
  metadata: gi.writeGrainInfo({ appId: appOf(key).appId, appVersion: 1, title }),
  log: strToU8('console'),
  ...Object.fromEntries(Object.entries(files).map(([p, v]) => [p, typeof v === 'string' ? strToU8(v) : v])),
})).toString('base64') });
const ITEMS = [
  { cardId: 'c1', title: 'Plan: the move', listTitle: 'To do', swimlaneTitle: 'Default', labels: ['Work', 'Big'],
    description: 'Line one\nLine: two, and a \\ backslash', dueAt: '2026-12-24T12:00:00.000Z', startAt: '2026-12-20T09:00:00.000Z',
    createdAt: '2026-11-01T08:00:00.000Z', owner: 'megan',
    comments: [{ text: 'First', author: 'megan', date: '2026-11-02T10:00:00.000Z' }, { text: 'Reply', author: 'alex', date: '2026-11-02T11:00:00.000Z' }],
    customFields: { 'Repeat every (days)': 3, 'Urgency growth': 'log', Email: 'megan@example.com', Phone: '123' },
    attachments: [{ id: 'att1', name: 'photo.png' }] },
  { cardId: 'c2', title: 'Done thing', listTitle: 'Done', swimlaneTitle: 'Default', labels: [], description: '', comments: [] },
];
const roundTrip = async key => {
  const built = apps.formatSandstormGrain(key, { board: { title: 'Office move' }, lists: [{ title: 'To do' }, { title: 'Done' }], items: ITEMS });
  const spec = apps.sandstormGrainFiles(JSON.parse(JSON.stringify(built)));
  const zip = await writeSandstormGrain(spec, { readAttachment: async id => Buffer.from(`bytes of ${id}`) });
  return { zip, entries: unzipSync(new Uint8Array(zip)), board: await readSandstormGrain({ zipBase64: zip.toString('base64') }, key) };
};

test('GrainInfo: written and read back, and a grain\'s users with their names and handles', () => {
  const info = gi.readGrainInfo(gi.writeGrainInfo({ appId: appOf('sandstormyatl').appId, appVersion: 8, title: 'Työt – åäö' }));
  assert.deepStrictEqual([info.appId, info.appVersion, info.title, info.users], [appOf('sandstormyatl').appId, 8, 'Työt – åäö', []]);
  const withUser = gi.readGrainInfo(new Uint8Array(Buffer.from(METADATA_WITH_USER, 'base64')));
  assert.strictEqual(withUser.appId, appOf('sandstormsandchat').appId);
  assert.strictEqual(withUser.appVersion, 3);
  assert.strictEqual(withUser.title, 'A made-up SandChat roo');
  assert.deepStrictEqual(withUser.users.map(u => [u.handle, u.name, u.credentialIds.length]), [['tester_handle1', 'tester_handle1', 1]]);
});

test('every app WeKan writes: the grain reads back as the board it was written from', async () => {
  const yatl = await roundTrip('sandstormyatl');
  assert.deepStrictEqual(yatl.board.tasks.map(t => [t.title, t.column_name]), [['Plan: the move', 'To do'], ['Done thing', 'Done']]);
  // The same table Yet Another TODO list creates.
  const mutodo = await roundTrip('sandstormmutodo');
  assert.deepStrictEqual(mutodo.board.tasks.map(t => [t.title, t.column_name]), [['Plan: the move', 'To do'], ['Done thing', 'Done']]);
  const prio = await roundTrip('sandstormprioritize');
  assert.deepStrictEqual(prio.board.tasks[0].custom_fields, { 'Repeat every (days)': 3, 'Urgency growth': 'log' });
  assert.strictEqual(prio.entries['data/csrfkey'].length, 32);
  assert.strictEqual(strFromU8(prio.entries['data/data-version']), '3');
  const chat = await roundTrip('sandstormsandchat');
  assert.deepStrictEqual(chat.board.tasks[0].comments.map(c => [c.text, c.author]), [['First', 'megan'], ['Reply', 'alex']]);
  const calc = await roundTrip('sandstormethercalc');
  assert.deepStrictEqual(calc.board.tasks.map(t => [t.title, t.column_name, t.description, t.tags, t.date_due || '']), [
    ['Plan: the move', 'To do', 'Line one\nLine: two, and a \\ backslash', ['Work', 'Big'], '2026-12-24T00:00:00.000Z'], ['Done thing', 'Done', '', [], '']]);
  const cal = await roundTrip('sandstormradicalecalendar');
  assert.deepStrictEqual(cal.board.tasks.map(t => [t.title, t.description, t.date_due || '']), [
    ['Plan: the move', 'Line one\nLine: two, and a \\ backslash', '2026-12-24T12:00:00.000Z'], ['Done thing', '', '']]);
  const contacts = await roundTrip('sandstormradicalecontacts');
  assert.deepStrictEqual(contacts.board.tasks[0].custom_fields, { Email: 'megan@example.com', Phone: '123' });
  assert.deepStrictEqual(contacts.board.tasks[0].tags, ['Work', 'Big']);
  const davros = await roundTrip('sandstormdavros');
  const plan = davros.board.tasks.find(t => t.title === 'Plan: the move');
  assert.deepStrictEqual([plan.column_name, plan.attachments.map(a => [a.name, Buffer.from(a.file, 'base64').toString()])],
    ['To do', [['photo.png', 'bytes of att1']]]);
  assert.ok(davros.entries['data/davros/data/To do/Plan the move.md'], 'a card is <list>/<title>.md, spaces kept');
  const cms = await roundTrip('sandstormhackercms');
  assert.deepStrictEqual(cms.board.tasks.map(t => t.title).sort(), ['Done thing', 'Plan: the move'], 'the generated index is not a page');
});

test('the written grains have the layout the apps\' own grains have', async () => {
  const { entries } = await roundTrip('sandstormyatl');
  assert.strictEqual(gi.readGrainInfo(entries.metadata).appId, appOf('sandstormyatl').appId);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grain-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'db'), entries['data/db.sqlite3']);
    const db = new DatabaseSync(path.join(dir, 'db'), { readOnly: true });
    assert.match(db.prepare("select sql from sqlite_master where name = 'todos'").get().sql, /id INTEGER PRIMARY KEY,\s+done BOOL NOT NULL,\s+descr VARCHAR NOT NULL/);
    db.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  // μTodo: bitcask entries, each value's CRC-32 after it.
  const mutodo = (await roundTrip('sandstormmutodo')).entries['data/todo.db/000000000.data'];
  assert.strictEqual(apps.readBitcask(mutodo).get('todo_1') !== undefined, true);
  // SandChat's marker of its newest migration, μTodo's lock file: empty, as in
  // the apps' own grains (without the marker SandChat would migrate again).
  assert.strictEqual((await roundTrip('sandstormsandchat')).entries['data/migrations/20161031003402'].length, 0);
  assert.strictEqual((await roundTrip('sandstormmutodo')).entries['data/todo.db/lock'].length, 0);
  // EtherCalc: SocialCalc's save format, the index sheet naming sheet1.
  const calc = (await roundTrip('sandstormethercalc')).entries;
  assert.match(strFromU8(calc['data/dump/snapshot-sheet1.txt']), /^socialcalc:version:1\.0\nMIME-Version: 1\.0\n[\s\S]*cell:A2:t:Plan\\c the move\n/);
  assert.match(strFromU8(calc['data/dump/snapshot-sheet.txt']), /cell:A2:t:\/sheet1\n/);
  // CodeQL #608: the header ends with exactly one newline before the first
  // part (it was followed by a replace of that newline with itself).
  assert.match(strFromU8(calc['data/dump/snapshot-sheet1.txt']),
    /^socialcalc:version:1\.0\nMIME-Version: 1\.0\nContent-Type: multipart\/mixed; boundary=SocialCalcSpreadsheetControlSave\n--SocialCalcSpreadsheetControlSave\n/);
  // Hacker CMS: www is a symbolic link to published, as zip -y stores it.
  const cmsZip = (await roundTrip('sandstormhackercms')).zip;
  // Its central directory entry: the name at +46, the external attributes at +38.
  const central = cmsZip.lastIndexOf(Buffer.from('data/www'));
  assert.strictEqual(cmsZip.readUInt32LE(central - 46), 0x02014b50);
  assert.strictEqual((cmsZip.readUInt32LE(central - 46 + 38) >>> 16).toString(8), '120777');
});

test('import only: a WeKan grain (FerretDB SQLite), a Gogs grain and a WordPress grain', async () => {
  // WeKan: FerretDB's tables of JSONB documents carrying their own schema.
  const doc = (fields, values) => JSON.stringify({ $s: { p: fields, $k: Object.keys(fields) }, ...values });
  const s = { t: 'string' };
  const db = sqliteFile([
    'CREATE TABLE "_ferretdb_collections" (name TEXT NOT NULL UNIQUE, table_name TEXT NOT NULL UNIQUE, settings TEXT NOT NULL) STRICT',
    ...['boards', 'lists', 'cards', 'card_comments', 'users', 'swimlanes', 'checklists', 'checklistItems', 'attachments']
      .map(n => `CREATE TABLE "${n}_x" (_ferretdb_sjson BLOB NOT NULL) STRICT`),
  ], [
    ...['boards', 'lists', 'cards', 'card_comments', 'users', 'swimlanes', 'checklists', 'checklistItems', 'attachments']
      .map(n => ['insert into _ferretdb_collections values (?, ?, ?)', [n, `${n}_x`, '{}']]),
    ['insert into "boards_x" values (jsonb(?))', [doc({ _id: s, title: s, labels: { t: 'array', i: [{ t: 'object', $s: { p: { _id: s, name: s }, $k: ['_id', 'name'] } }] } },
      { _id: 'b1', title: 'Grain board', labels: [{ _id: 'l1', name: 'Urgent' }] })]],
    ['insert into "lists_x" values (jsonb(?))', [doc({ _id: s, boardId: s, title: s }, { _id: 'L1', boardId: 'b1', title: 'Doing' })]],
    ['insert into "users_x" values (jsonb(?))', [doc({ _id: s, username: s }, { _id: 'u1', username: 'megan' })]],
    ['insert into "cards_x" values (jsonb(?))', [doc({ _id: s, boardId: s, listId: s, title: s, labelIds: { t: 'array', i: [s] }, members: { t: 'array', i: [s] }, dueAt: { t: 'date' } },
      { _id: 'c1', boardId: 'b1', listId: 'L1', title: 'Grain card', labelIds: ['l1'], members: ['u1'], dueAt: Date.parse('2026-12-24T12:00:00Z') })]],
    ['insert into "card_comments_x" values (jsonb(?))', [doc({ _id: s, cardId: s, userId: s, text: s }, { _id: 'm1', cardId: 'c1', userId: 'u1', text: 'Hello' })]],
    ['insert into "attachments_x" values (jsonb(?))', [doc({ _id: s, name: s, meta: { t: 'object', $s: { p: { cardId: s }, $k: ['cardId'] } },
      versions: { t: 'object', $s: { p: { original: { t: 'object', $s: { p: { path: s }, $k: ['path'] } } }, $k: ['original'] } } },
      { _id: 'a1', name: 'x.png', meta: { cardId: 'c1' }, versions: { original: { path: '/var/files/attachments/a1-original-x.png' } } })]],
  ]);
  const wekan = await readSandstormGrain(grain('sandstormwekan', { 'data/files/db/wekan.sqlite': db, 'data/files/attachments/a1-original-x.png': 'PNG' }), 'sandstormwekan');
  const card = wekan.tasks[0];
  assert.deepStrictEqual([wekan.board.name, card.title, card.column_name, card.tags, card.owner_username, card.date_due, card.comments[0].text, card.comments[0].author],
    ['Grain board', 'Grain card', 'Doing', ['Urgent'], 'megan', '2026-12-24T12:00:00.000Z', 'Hello', 'megan']);
  assert.deepStrictEqual(card.attachments.map(a => [a.name, Buffer.from(a.file, 'base64').toString()]), [['x.png', 'PNG']]);

  const gogs = sqliteFile([
    'CREATE TABLE issue (id INTEGER, repo_id INTEGER, "index" INTEGER, poster_id INTEGER, name TEXT, content TEXT, milestone_id INTEGER, assignee_id INTEGER, is_closed INTEGER, is_pull INTEGER, deadline_unix INTEGER, created_unix INTEGER)',
    'CREATE TABLE comment (id INTEGER, type INTEGER, poster_id INTEGER, issue_id INTEGER, content TEXT, created_unix INTEGER)',
    'CREATE TABLE label (id INTEGER, name TEXT)', 'CREATE TABLE issue_label (issue_id INTEGER, label_id INTEGER)',
    'CREATE TABLE milestone (id INTEGER, name TEXT)', 'CREATE TABLE user (id INTEGER, name TEXT, full_name TEXT)', 'CREATE TABLE repository (id INTEGER, name TEXT)',
  ], [
    ['insert into issue values (1, 1, 1, 1, ?, ?, 1, 1, 1, 0, 0, 1795000000)', ['Broken link', 'It 404s']],
    ['insert into issue values (2, 1, 2, 1, ?, ?, 0, 0, 0, 1, 0, 1795000000)', ['A pull request', '']],
    ['insert into comment values (1, 0, 1, 1, ?, 1795000100)', ['Fixed']], ['insert into label values (1, ?)', ['bug']],
    ['insert into issue_label values (1, 1)', []], ['insert into milestone values (1, ?)', ['v1']],
    ['insert into user values (1, ?, ?)', ['megan', 'Megan']], ['insert into repository values (1, ?)', ['site']],
  ]);
  const g = await readSandstormGrain(grain('sandstormgogs', { 'data/gogs/data/gogs.db': gogs }), 'sandstormgogs');
  assert.deepStrictEqual(g.tasks.map(t => [t.title, t.column_name, t.swimlane_name, t.tags, t.custom_fields, t.comments.length]),
    [['Broken link', 'Closed', 'site', ['bug'], { Milestone: 'v1' }, 1]]);
  assert.ok(g.unsupported.some(u => /1 pull request/.test(u.reason)));

  const wp = sqliteFile([
    'CREATE TABLE wp_posts (ID INTEGER, post_author INTEGER, post_date_gmt TEXT, post_content TEXT, post_title TEXT, post_status TEXT, post_parent INTEGER, post_type TEXT)',
    'CREATE TABLE wp_comments (comment_post_ID INTEGER, comment_author TEXT, comment_date_gmt TEXT, comment_content TEXT, comment_approved TEXT)',
    'CREATE TABLE wp_users (ID INTEGER, user_login TEXT, display_name TEXT)', 'CREATE TABLE wp_terms (term_id INTEGER, name TEXT)',
    'CREATE TABLE wp_term_taxonomy (term_taxonomy_id INTEGER, term_id INTEGER, taxonomy TEXT)', 'CREATE TABLE wp_term_relationships (object_id INTEGER, term_taxonomy_id INTEGER)',
  ], [
    ['insert into wp_posts values (1, 1, ?, ?, ?, ?, 0, ?)', ['2026-11-01 10:00:00', '<!-- wp:paragraph --><p>Hello <b>world</b></p>', 'First post', 'publish', 'post']],
    // CodeQL #607: a comment spliced from two halves is removed too.
    ['insert into wp_posts values (2, 1, ?, ?, ?, ?, 0, ?)', ['2026-11-02 10:00:00', '<!-<!-- x -->- hidden --><p>About</p>', 'About', 'draft', 'page']],
    ['insert into wp_posts values (3, 1, ?, ?, ?, ?, 1, ?)', ['2026-11-02 10:00:00', '', 'photo', 'inherit', 'attachment']],
    ['insert into wp_comments values (1, ?, ?, ?, ?)', ['Reader', '2026-11-03 10:00:00', 'Nice', '1']],
    ['insert into wp_users values (1, ?, ?)', ['admin', 'Megan']], ['insert into wp_terms values (5, ?)', ['News']],
    ['insert into wp_term_taxonomy values (7, 5, ?)', ['category']], ['insert into wp_term_relationships values (1, 7)', []],
  ]);
  const w = await readSandstormGrain(grain('sandstormwordpress', { 'data/wordpress/wp-content/database/.ht.sqlite': wp }), 'sandstormwordpress');
  assert.deepStrictEqual(w.tasks.map(t => [t.title, t.column_name, t.swimlane_name, t.description, t.tags, t.comments.length]),
    [['First post', 'Published', 'Posts', 'Hello **world**', ['News'], 1], ['About', 'Draft', 'Pages', 'About', [], 0]]);
});

test('negative: another app\'s grain, an unreadable app\'s, no metadata, a broken μTodo file, a path out of data/', async () => {
  const other = grain('sandstormdavros', { 'data/davros/data/a.md': '# a' });
  await assert.rejects(readSandstormGrain(other, 'sandstormyatl'), /This is a Davros grain: choose Sandstorm → Davros/);
  const rocket = { zipBase64: Buffer.from(zipSync({ metadata: gi.writeGrainInfo({ appId: 'vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0', title: 'r' }) })).toString('base64') };
  await assert.rejects(readSandstormGrain(rocket, 'sandstormwekan'), /cannot be imported: Rocket\.Chat keeps its messages in MongoDB/);
  await assert.rejects(readSandstormGrain({ zipBase64: Buffer.from(zipSync({ 'data/x': strToU8('x') })).toString('base64') }, 'sandstormyatl'), /no metadata file/);
  // A Radicale address book chosen as the calendar says which it is.
  const book = grain('sandstormradicalecontacts', { 'data/lib/radicale/owner/addressbook.vcf': 'BEGIN:VCARD\nFN:A\nEND:VCARD' });
  await assert.rejects(readSandstormGrain(book, 'sandstormradicalecalendar'), /an address book: choose Sandstorm → Radicale address book/);
  const broken = apps.writeBitcask([['todo_0', '{"ID":0,"Title":"x"}']]);
  broken[20] ^= 0xff;
  assert.throws(() => apps.readBitcask(broken), /damaged/);
  assert.throws(() => gi.writeGrainInfo({ appId: 'not-an-app' }), /app id/);
  assert.throws(() => gi.readGrainInfo(new Uint8Array(8)), /not a GrainInfo/);
  // No title becomes a path outside data/ or a dot-dot folder.
  const evil = apps.sandstormGrainFiles(apps.formatSandstormGrain('sandstormdavros', { board: { title: 'x' },
    items: [{ cardId: 'e', title: '../../etc/passwd', listTitle: '../..', attachments: [{ id: 'a', name: '../x' }] }] }));
  for (const p of [...Object.keys(evil.files), ...Object.keys(evil.attachments)]) assert.ok(p.startsWith('data/') && !p.split('/').includes('..'), p);
  assert.throws(() => apps.formatSandstormGrain('sandstormwekan', {}), /does not write grains/);
});

test('the Sandstorm apps are one group, sources and exports wired', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const sources = read('models/lib/importSources.js');
  for (const app of apps.SANDSTORM_APPS) {
    assert.match(sources, new RegExp(`\\{ key: '${app.key}', name: 'Sandstorm [^']+', \\.\\.\\.GRAIN \\}`), app.key);
    assert.strictEqual(read('client/components/boards/exportScope.js').includes(`key: '${app.key}'`), app.export, `${app.key} export`);
  }
  assert.match(read('models/lib/toolGroups.js'), /\{ group: 'sandstorm', label: 'Sandstorm' \}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.match(en['import-board-instruction-sandstorm'], /__app__/);
});

// CodeQL #605 (js/insecure-randomness): SandChat's users.uid names a user, so
// it comes from Web Crypto, never Math.random - and no grain writer uses
// Math.random for anything, so the shape cannot come back in another app.
test('SandChat user ids are 32 hex digits from a cryptographic generator', async () => {
  const uids = async () => {
    const { entries } = await roundTrip('sandstormsandchat');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grain-test-'));
    try {
      fs.writeFileSync(path.join(dir, 'db'), entries['data/db.sqlite3']);
      const db = new DatabaseSync(path.join(dir, 'db'), { readOnly: true });
      const rows = db.prepare('select uid from users order by id').all().map(r => r.uid);
      db.close();
      return rows;
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  };
  const first = await uids();
  const second = await uids();
  assert.strictEqual(first.length, 2);
  for (const uid of [...first, ...second]) assert.match(uid, /^[0-9a-f]{32}$/);
  assert.strictEqual(new Set([...first, ...second]).size, 4, 'every export makes new ids');
  // negative: no Math.random call anywhere in the Sandstorm grain code.
  const dir = path.join(__dirname, '..', 'models', 'lib', 'sandstorm');
  const files = [...fs.readdirSync(dir).map(f => path.join(dir, f)), path.join(__dirname, '..', 'server', 'lib', 'sandstormGrain.js')]
    .filter(f => f.endsWith('.js'));
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\bMath\.random\s*\(/, path.relative(path.join(__dirname, '..'), file));
  }
});
