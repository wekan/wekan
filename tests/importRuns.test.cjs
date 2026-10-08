'use strict';
// Board import runs (server/lib/importRuns.js): a run is written before the
// import's first write and names the board it will create; a run that stops
// is flagged once for Admin Panel -> Problems -> Recovery, where an
// administrator keeps its partial board or discards exactly what it created.
//
// Run: node --test tests/importRuns.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../server/lib/importRuns');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => (value == null ? value : structuredClone(value));
const get = (row, key) => key.split('.').reduce((value, part) => value?.[part], row);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Just enough of MongoDB's query language for this module.
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(part => matches(row, part));
    const actual = get(row, key);
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      return Object.entries(value).every(([op, operand]) => {
        if (op === '$exists') return (actual !== undefined) === operand;
        if (op === '$in') return operand.some(item => same(item, actual));
        if (op === '$ne') return !same(actual, operand);
        if (op === '$lt') return actual instanceof Date && actual < operand;
        throw new Error(`unsupported operator ${op}`);
      });
    }
    if (Array.isArray(actual) && !Array.isArray(value)) return actual.some(item => same(item, value));
    return same(actual, value);
  });
}
function collection() {
  const rows = new Map();
  const find = query => [...rows.values()].filter(row => matches(row, query));
  return { rows,
    async findOne(query) { return clone(find(query)[0] || null); },
    find(query) {
      let list = find(query);
      const cursor = { sort: () => cursor, limit: n => { list = list.slice(0, n); return cursor; },
        toArray: async () => list.map(clone) };
      return cursor;
    },
    async countDocuments(query) { return find(query).length; },
    async insertOne(row) {
      if (rows.has(row._id)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      rows.set(row._id, clone(row));
    },
    async updateOne(query, change) {
      const row = find(query)[0];
      if (!row) return { matchedCount: 0, modifiedCount: 0 };
      for (const [key, value] of Object.entries(change.$set || {})) row[key] = clone(value);
      for (const key of Object.keys(change.$unset || {})) delete row[key];
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(query) {
      const row = find(query)[0];
      if (row) rows.delete(row._id);
      return { deletedCount: row ? 1 : 0 };
    },
    async deleteMany(query) {
      const list = find(query);
      for (const row of list) rows.delete(row._id);
      return { deletedCount: list.length };
    },
  };
}
function database() {
  const collections = new Map();
  return { collections, collection(name) {
    if (!collections.has(name)) collections.set(name, collection());
    return collections.get(name);
  } };
}
let clock = new Date('2026-10-08T10:00:00Z').getTime();
const now = () => new Date(clock);
const advance = ms => { clock += ms; };

// One board's worth of documents, everything the importers write.
function seedBoard(db, boardId, { runId, title = boardId } = {}) {
  db.collection('boards').rows.set(boardId, { _id: boardId, title, ...(runId ? { importRunId: runId } : {}) });
  const add = (name, row) => db.collection(name).rows.set(row._id, row);
  add('swimlanes', { _id: `${boardId}-s`, boardId });
  add('lists', { _id: `${boardId}-l`, boardId });
  add('cards', { _id: `${boardId}-c1`, boardId });
  add('cards', { _id: `${boardId}-c2`, boardId });
  add('checklists', { _id: `${boardId}-k`, boardId });
  add('checklistItems', { _id: `${boardId}-ki`, boardId });
  add('card_comments', { _id: `${boardId}-m`, boardId });
  add('activities', { _id: `${boardId}-a`, boardId });
  add('rules', { _id: `${boardId}-r`, boardId });
  add('scrumSprints', { _id: `${boardId}-sp`, boardId });
  add('attachments', { _id: `${boardId}-f`, meta: { boardId } });
  add('customFields', { _id: `${boardId}-cf`, boardIds: [boardId] });
}
const total = db => [...db.collections.entries()].filter(([name]) => name !== 'importRuns')
  .reduce((sum, [, c]) => sum + c.rows.size, 0);

async function interruptedRun(db, { seed = true } = {}) {
  const runs = db.collection('importRuns');
  const run = await R.startRun({ runs, userId: 'u1', source: 'wekan', now });
  if (seed) seedBoard(db, run.boardId, { runId: run._id, title: 'Partial' });
  advance(R.DEFAULT_STALE_MS + 1000);
  const flagged = await R.scanRuns({ runs, now });
  assert.equal(flagged.filter(row => row._id === run._id).length, 1);
  return run;
}
function discard(db, runId, extra = {}) {
  const removedBoards = [];
  const promise = R.discardRun({ db, runId, operator: 'admin', now,
    // The application's board removal, whose hook takes the attachments and
    // their files with the board.
    removeBoard: async id => {
      removedBoards.push(id);
      db.collection('boards').rows.delete(id);
      await db.collection('attachments').deleteMany({ 'meta.boardId': id });
    },
    ...extra });
  return promise.then(result => ({ ...result, removedBoards }));
}
const refusal = reason => error => error.reason === reason && error.message === `import-run-${reason}`;

function fakeTimers() {
  const timers = { fns: [], setInterval(fn) { timers.fns.push(fn); return { unref() {} }; }, clearInterval() { timers.fns = []; },
    async tick() { for (const fn of timers.fns) await fn(); } };
  return timers;
}
class FakeCreator {
  constructor(db, { failAfterBoard = false, failBeforeBoard = false } = {}) { Object.assign(this, { db, failAfterBoard, failBeforeBoard }); }
  async createBoard() {
    if (this.failBeforeBoard) throw Object.assign(new Error('secret card title in message'), { error: 'invalid-import' });
    const { boardId, runId } = this.importRun;
    seedBoard(this.db, boardId, { runId });
    return boardId;
  }
  async createCards() { if (this.failAfterBoard) throw new Error('database went away'); }
  parseSomething() { return 'sync result'; }
  async create() { const boardId = await this.createBoard(); await this.createCards(); return boardId; }
}

test('a run is written before the first write and names the board it will create', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const timers = fakeTimers();
  const creator = new FakeCreator(db);
  let seenAtFirstWrite;
  const original = creator.createBoard;
  creator.createBoard = undefined;
  FakeCreator.prototype.createBoard = async function () { seenAtFirstWrite = await runs.findOne({}); return original.call(this); };
  try {
    const tracked = R.trackImport({ runs, boards: db.collection('boards'), userId: 'u1', source: 'wekan', creator,
      execute: () => creator.create(), now, timers });
    const boardId = await tracked.promise;
    assert.ok(seenAtFirstWrite, 'the run exists before the board is written');
    assert.equal(seenAtFirstWrite.state, 'running');
    assert.equal(seenAtFirstWrite.boardId, boardId);
    assert.match(boardId, /^[23456789A-HJ-NP-Za-km-z]{17}$/);
    assert.equal(db.collection('boards').rows.get(boardId).importRunId, seenAtFirstWrite._id);
    const run = await runs.findOne({ _id: seenAtFirstWrite._id });
    assert.equal(run.state, 'finished');
    assert.ok(run.finishedAt instanceof Date);
    // A synchronous method keeps its contract: it is not turned into a promise.
    assert.equal(creator.parseSomething(), 'sync result');
  } finally { FakeCreator.prototype.createBoard = original; }
});

test('a finished run is never flagged, however old', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const creator = new FakeCreator(db);
  await R.trackImport({ runs, boards: db.collection('boards'), source: 'csv', creator, execute: () => creator.create(),
    now, timers: fakeTimers() }).promise;
  advance(R.DEFAULT_STALE_MS * 10);
  assert.deepEqual(await R.scanRuns({ runs, now }), []);
  assert.deepEqual((await R.listInterruptedRuns({ db })).rows, []);
});

test('a run whose heartbeat stopped is flagged once, by one of two concurrent scans', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const run = await R.startRun({ runs, userId: 'u1', source: 'trello', now });
  const fresh = await R.startRun({ runs, userId: 'u2', source: 'trello', now: () => new Date(clock + R.DEFAULT_STALE_MS) });
  advance(R.DEFAULT_STALE_MS + 1);
  const [a, b] = await Promise.all([R.scanRuns({ runs, now }), R.scanRuns({ runs, now })]);
  assert.deepEqual([...a, ...b].map(row => row._id), [run._id]);
  assert.deepEqual(await R.scanRuns({ runs, now }), [], 'never again');
  assert.equal((await runs.findOne({ _id: fresh._id })).state, 'running', 'a live heartbeat is not flagged');
  assert.equal((await runs.findOne({ _id: run._id })).interruptedFrom, 'running');
});

test('a run that failed after creating its board is flagged at once; one that failed before is closed empty', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const after = new FakeCreator(db, { failAfterBoard: true });
  await assert.rejects(R.trackImport({ runs, boards: db.collection('boards'), source: 'jira', creator: after,
    execute: () => after.create(), now, timers: fakeTimers() }).promise, /database went away/);
  const before = new FakeCreator(db, { failBeforeBoard: true });
  await assert.rejects(R.trackImport({ runs, boards: db.collection('boards'), source: 'jira', creator: before,
    execute: () => before.create(), now, timers: fakeTimers() }).promise, /secret/);
  const flagged = await R.scanRuns({ runs, now });
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].boardId, after.importRun.boardId);
  assert.equal(flagged[0].errorCode, 'Error');
  const empty = await runs.findOne({ _id: before.importRun.runId });
  assert.equal(empty.state, 'failed-empty');
  // Only the error's code is kept, never its message.
  assert.equal(empty.errorCode, 'invalid-import');
  assert.doesNotMatch(JSON.stringify([...runs.rows.values()]), /secret|went away/);
});

test('a fenced or aborted writer stops at its next stage', async () => {
  for (const how of ['fenced', 'aborted']) {
    const db = database();
    const runs = db.collection('importRuns');
    const timers = fakeTimers();
    let release;
    const creator = new FakeCreator(db);
    const gate = new Promise(resolve => { release = resolve; });
    const tracked = R.trackImport({ runs, boards: db.collection('boards'), source: 'wekan', creator, now, timers,
      execute: async () => { const id = await creator.createBoard(); await gate; await creator.createCards(); return id; } });
    while (!creator.importRun) await new Promise(setImmediate);
    await new Promise(setImmediate);
    if (how === 'fenced') {
      // The scan took the run over while this writer was paused.
      advance(R.DEFAULT_STALE_MS + 1);
      assert.equal((await R.scanRuns({ runs, now })).length, 1);
      await timers.tick();
    } else tracked.abort();
    release();
    await assert.rejects(tracked.promise, error => error.error === 'import-aborted', how);
    const run = await runs.findOne({});
    assert.equal(run.state, how === 'fenced' ? 'interrupted' : 'failed', how);
  }
});

test('the heartbeat names the stage the import is in', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const timers = fakeTimers();
  let release;
  const creator = new FakeCreator(db);
  const gate = new Promise(resolve => { release = resolve; });
  const tracked = R.trackImport({ runs, boards: db.collection('boards'), source: 'wekan', creator, now, timers,
    execute: async () => { const id = await creator.createBoard(); await creator.createCards(); await gate; return id; } });
  while (!creator.importRun) await new Promise(setImmediate);
  for (let i = 0; i < 5; i++) await new Promise(setImmediate);
  advance(30000);
  await timers.tick();
  const run = await runs.findOne({});
  assert.equal(run.stage, 'createCards');
  assert.equal(run.touchedAt.getTime(), clock);
  release();
  await tracked.promise;
});

test('Recovery lists an interrupted run with what its board holds now', async () => {
  const db = database();
  const run = await interruptedRun(db);
  db.collection('scrumImportPending').rows.set(run.boardId, { _id: run.boardId, state: 'applying', next: 2, total: 5 });
  const { rows, truncated } = await R.listInterruptedRuns({ db });
  assert.equal(truncated, false);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].counts, { swimlanes: 1, lists: 1, cards: 2, checklists: 1, comments: 1, attachments: 1 });
  assert.deepEqual(rows[0].scrum, { state: 'applying', next: 2, total: 5 });
  assert.equal(rows[0].boardTitle, 'Partial');
  assert.equal(rows[0].foreignBoard, false);
  const line = R.describeInterruption({ ...run, interruptedFrom: 'running' }, await R.describeBoard({ db, boardId: run.boardId }));
  assert.match(line, /2 cards/);
  assert.match(line, /Scrum stage has its own checkpoint \(applying, 2 of 5 steps\)/);
});

test('discard removes exactly the documents of the board the run created', async () => {
  const db = database();
  seedBoard(db, 'otherBoard', { runId: 'not-this-run' });
  db.collection('customFields').rows.set('shared', { _id: 'shared', boardIds: ['otherBoard', 'PLACEHOLDER'] });
  const run = await interruptedRun(db);
  db.collection('customFields').rows.get('shared').boardIds[1] = run.boardId;
  const other = await interruptedRun(db);
  db.collection('scrumImportPending').rows.set(run.boardId, { _id: run.boardId, state: 'applying' });
  db.collection('scrumImportSteps').rows.set('step', { _id: 'step', boardId: run.boardId });
  const before = total(db);
  const result = await discard(db, run._id);
  assert.equal(result.status, 'discarded');
  assert.equal(result.decidedNow, true);
  assert.deepEqual(result.removedBoards, [run.boardId]);
  assert.equal(result.removed.boards, 1);
  assert.equal(result.removed.cards, 2);
  for (const [name, c] of db.collections) {
    for (const row of c.rows.values()) {
      if (name === 'importRuns') continue;
      assert.notEqual(row.boardId, run.boardId, `${name} ${row._id} left behind`);
      assert.notEqual(row.meta?.boardId, run.boardId, `${name} ${row._id} left behind`);
      assert.notEqual(row._id, run.boardId, `${name} ${row._id} left behind`);
    }
  }
  // Everything of the other boards is still there, including the custom field
  // the discarded board shared with one of them.
  assert.ok(db.collection('customFields').rows.has('shared'));
  assert.ok(db.collection('boards').rows.has('otherBoard'));
  assert.ok(db.collection('boards').rows.has(other.boardId));
  assert.equal(total(db), before - 15);
  const stored = await db.collection('importRuns').findOne({ _id: run._id });
  assert.equal(stored.state, 'discarded');
  assert.equal(stored.decidedBy, 'admin');
  assert.equal((await db.collection('importRuns').findOne({ _id: other._id })).state, 'interrupted');
});

test('discarding twice changes nothing more', async () => {
  const db = database();
  const run = await interruptedRun(db);
  seedBoard(db, 'otherBoard');
  await discard(db, run._id);
  const before = total(db);
  const again = await discard(db, run._id);
  assert.equal(again.status, 'already-discarded');
  assert.equal(again.decidedNow, false);
  assert.deepEqual(again.removed, {});
  assert.deepEqual(again.removedBoards, []);
  assert.equal(total(db), before);
});

test('a discard that stopped halfway is finished by the next one, without a second decision', async () => {
  const db = database();
  const run = await interruptedRun(db);
  await assert.rejects(R.discardRun({ db, runId: run._id, operator: 'admin', now,
    removeBoard: async () => { throw new Error('server stopped'); } }), /server stopped/);
  assert.equal((await db.collection('importRuns').findOne({ _id: run._id })).state, 'discarding');
  assert.equal((await R.listInterruptedRuns({ db })).rows[0].state, 'discarding');
  const result = await discard(db, run._id, { operator: 'second-admin' });
  assert.equal(result.status, 'discarded');
  assert.equal(result.decidedNow, false);
  assert.equal((await db.collection('importRuns').findOne({ _id: run._id })).decidedBy, 'admin');
  assert.equal(db.collection('cards').rows.size, 0);
});

test('keep resolves the run and changes nothing on the board; keeping twice is a no-op', async () => {
  const db = database();
  const run = await interruptedRun(db);
  const before = total(db);
  const kept = await R.keepRun({ db, runId: run._id, operator: 'admin', now });
  assert.deepEqual([kept.status, kept.decidedNow], ['kept', true]);
  const again = await R.keepRun({ db, runId: run._id, operator: 'admin', now });
  assert.deepEqual([again.status, again.decidedNow], ['already-kept', false]);
  assert.equal(total(db), before);
  assert.deepEqual((await R.listInterruptedRuns({ db })).rows, []);
  // A kept board is not discarded later.
  await assert.rejects(discard(db, run._id), refusal('not-interrupted'));
  assert.equal(total(db), before);
});

test('keep reports a Scrum checkpoint that its own recovery still resolves', async () => {
  const db = database();
  const run = await interruptedRun(db);
  db.collection('scrumImportPending').rows.set(run.boardId, { _id: run.boardId, state: 'preparing' });
  const kept = await R.keepRun({ db, runId: run._id, operator: 'admin', now });
  assert.equal(kept.scrumPending, 'preparing');
  assert.ok(db.collection('scrumImportPending').rows.has(run.boardId), 'keep leaves the Scrum checkpoint alone');
});

test('discard is refused for runs that are running, finished, kept, unknown or malformed', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const running = await R.startRun({ runs, source: 'wekan', now });
  seedBoard(db, running.boardId, { runId: running._id });
  const creator = new FakeCreator(db);
  await R.trackImport({ runs, boards: db.collection('boards'), source: 'csv', creator, execute: () => creator.create(),
    now, timers: fakeTimers() }).promise;
  const before = total(db);
  await assert.rejects(discard(db, running._id), refusal('not-interrupted'));
  await assert.rejects(discard(db, creator.importRun.runId), refusal('not-interrupted'));
  await assert.rejects(discard(db, '00000000-0000-4000-8000-000000000000'), refusal('missing'));
  for (const bad of ['', 'x', { $ne: null }, null, '../boards']) await assert.rejects(discard(db, bad), refusal('invalid'));
  await assert.rejects(R.discardRun({ db, runId: running._id, operator: '', now }), refusal('invalid'));
  await assert.rejects(R.keepRun({ db, runId: running._id, operator: 'admin', now }), refusal('not-interrupted'));
  assert.equal(total(db), before);
});

test('a board with the run\'s id that the run did not create is never touched', async () => {
  const db = database();
  const run = await interruptedRun(db, { seed: false });
  seedBoard(db, run.boardId, { runId: 'some-other-run' });
  const before = total(db);
  await assert.rejects(discard(db, run._id), refusal('foreign-board'));
  assert.equal(total(db), before);
  assert.equal((await db.collection('importRuns').findOne({ _id: run._id })).state, 'interrupted');
  assert.equal((await R.listInterruptedRuns({ db })).rows[0].foreignBoard, true);
});

test('a board whose Scrum stage is being written or recovered offline is not discarded', async () => {
  for (const scrum of ['lease', 'claim']) {
    const db = database();
    const run = await interruptedRun(db);
    if (scrum === 'lease') {
      db.collection('scrumImportPending').rows.set(run.boardId, { _id: run.boardId, state: 'applying',
        leaseUntil: new Date(clock + 60000) });
    } else db.collection('scrumImportRecoveryLocks').rows.set(run.boardId, { _id: run.boardId, token: 't' });
    const before = total(db);
    await assert.rejects(discard(db, run._id), refusal('scrum-busy'), scrum);
    assert.equal(total(db), before, scrum);
    assert.equal((await db.collection('importRuns').findOne({ _id: run._id })).state, 'interrupted', scrum);
  }
  // An expired Scrum lease belongs to a writer that stopped with the import.
  const db = database();
  const run = await interruptedRun(db);
  db.collection('scrumImportPending').rows.set(run.boardId, { _id: run.boardId, state: 'applying',
    leaseUntil: new Date(clock - 1) });
  assert.equal((await discard(db, run._id)).status, 'discarded');
  assert.equal(db.collection('scrumImportPending').rows.size, 0);
});

test('a run that never created its board is discarded without removing anything', async () => {
  const db = database();
  seedBoard(db, 'otherBoard');
  const run = await interruptedRun(db, { seed: false });
  // An attachment record that outlived its board is counted, never deleted
  // here: attachments and their files go only with their board.
  db.collection('attachments').rows.set('orphan', { _id: 'orphan', meta: { boardId: run.boardId } });
  const before = total(db);
  const result = await discard(db, run._id);
  assert.deepEqual([result.status, result.removedBoards, result.removed, result.attachmentsLeft],
    ['discarded', [], {}, 1]);
  assert.equal(total(db), before);
});

test('old closed runs are removed; open ones are kept', async () => {
  const db = database();
  const runs = db.collection('importRuns');
  const run = await interruptedRun(db);
  const creator = new FakeCreator(db);
  await R.trackImport({ runs, boards: db.collection('boards'), source: 'csv', creator, execute: () => creator.create(),
    now, timers: fakeTimers() }).promise;
  advance(R.RETENTION_MS + 1);
  await R.scanRuns({ runs, now });
  assert.equal(await runs.findOne({ _id: creator.importRun.runId }), null);
  assert.ok(await runs.findOne({ _id: run._id }), 'an undecided run stays until an administrator decides');
});

// --- wiring, read from the source ---

test('every board import and copy runs under a run record, and the deadline stops its writer', () => {
  const imp = read('models/import.js');
  const importBoard = imp.slice(imp.indexOf('async importBoard('), imp.indexOf('async importScoped('));
  assert.match(importBoard, /trackImport\(\{ userId: this\.userId, source: importSource, creator,\s+execute: \(\) => creator\.create\(importedBoard, replaceId\) \}\)/);
  assert.match(importBoard, /withDeadline\(\s+tracked\.promise,/);
  assert.match(importBoard, /\(\) => \{ tracked\.abort\(\); return new Meteor\.Error\('import-timeout'/);
  const clone = imp.slice(imp.indexOf('async cloneBoard('));
  assert.match(clone, /trackImport\(\{ userId: this\.userId, source: 'clone', creator,/);
  // The shape of the fault: a creator whose create() is called on the server
  // without a run, which leaves no record if it stops halfway.
  const files = require('node:child_process').execFileSync('git', ['grep', '-l', '-E', 'new [A-Za-z]+Creator\\(',
    '--', 'server', 'models'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const offenders = [];
  let tracked = 0;
  for (const file of files) {
    if (file.includes('/tests/') || /Creator\.js$/.test(file)) continue;
    const lines = read(file).split('\n');
    lines.forEach((line, index) => {
      if (!/\bcreator\.create\(/.test(line)) return;
      if (/execute: \(\) => creator\.create\(/.test(line)) { tracked++; return; }
      // The client simulation in models/import.js: the line right after the
      // server branch, which has returned already.
      if (file === 'models/import.js' && /^\s+\}$/.test(lines[index - 1]) &&
          /^\s+return await creator\.create\(/.test(line)) return;
      offenders.push(`${file}:${index + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
  assert.ok(tracked >= 5, `${tracked} tracked imports`);
});

test('every creator inserts its board with the planned id and the run stamp', () => {
  const creators = fs.readdirSync(path.join(root, 'models')).filter(name => /Creator\.js$/.test(name));
  assert.ok(creators.length >= 5, creators.join());
  for (const file of creators) {
    const source = read(`models/${file}`);
    assert.match(source, /const boardToCreate = \{\n\s+\.\.\.plannedBoardFields\(this\),/, file);
    assert.match(source, /import \{[^}]*plannedBoardFields[^}]*\} from '[^']*importPipeline'/, file);
  }
  const pipeline = read('models/lib/importPipeline.js');
  const lib = {};
  new Function('exports', pipeline.replace(/export (async )?function (\w+)/g, '$1function $2') +
    '\nexports.plannedBoardFields = plannedBoardFields;')(lib);
  assert.deepEqual(lib.plannedBoardFields({ importRun: { runId: 'r', boardId: 'b' } }), { _id: 'b', importRunId: 'r' });
  for (const creator of [null, {}, { importRun: { runId: 'r' } }, { importRun: { boardId: 1, runId: 'r' } }]) {
    assert.deepEqual(lib.plannedBoardFields(creator), {});
  }
  // collection2 would strip a field the schema does not name.
  assert.match(read('models/boards.js'), /importRunId: \{[\s\S]{0,300}type: String,\s+optional: true,/);
});

test('only instance administrators list, keep or discard, and every decision is audited', () => {
  const glue = read('server/importRuns.js');
  for (const method of ['importRunsInterrupted', 'importRunDiscard', 'importRunKeep']) {
    const body = glue.slice(glue.indexOf(`async ${method}(`));
    const head = body.slice(0, body.indexOf('\n  },'));
    assert.match(head, /await assertAdmin\(this\.userId\)/, method);
    assert.ok(head.indexOf('assertAdmin') < head.indexOf('runsLib.'), `${method} checks before acting`);
    assert.ok(glue.includes(`'${method}'`), `${method} is rate limited`);
  }
  assert.match(glue, /for \(const name of \['importRunsInterrupted', 'importRunDiscard', 'importRunKeep'\]\) \{\n\s+DDPRateLimiter\.addRule/);
  assert.match(glue, /if \(!user\?\.isAdmin \|\| user\.loginDisabled\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(glue, /check\(runId, RunId\)/);
  assert.match(glue, /type: RecoveryEvents\.types\.IMPORT_DISCARDED[\s\S]*done: true, deletedData: true/);
  assert.match(glue, /type: RecoveryEvents\.types\.IMPORT_KEPT/);
  assert.match(glue, /RecoveryEvents\.record\(RecoveryEvents\.types\.IMPORT_INTERRUPTED/);
  assert.match(glue, /ImportRuns\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\)/);
  const types = read('models/recoveryEvents.js');
  for (const type of ['import-interrupted', 'import-discarded', 'import-kept']) assert.ok(types.includes(`'${type}'`), type);
  assert.match(read('server/imports.js'), /import '\/server\/importRuns';/);
  // Nothing publishes the runs.
  let published = '';
  try {
    published = require('node:child_process').execFileSync('git', ['grep', '-l', '-E', 'importRuns|ImportRuns',
      '--', 'server/publications'], { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) { if (error.status !== 1) throw error; }
  assert.equal(published, '');
});

test('the discard selects only by the board id allocated for the run', () => {
  const source = read('server/lib/importRuns.js');
  const sweep = source.slice(source.indexOf('async function sweepBoard('), source.indexOf('function checkArgs('));
  const deletes = [...sweep.matchAll(/delete(One|Many)\(([^)]*)\)/g)].map(match => match[2]);
  assert.deepEqual(deletes, ['{ boardId }', '{ boardIds: [boardId] }', '{ _id: boardId }']);
  const discardBody = source.slice(source.indexOf('async function discardRun('), source.indexOf('async function keepRun('));
  assert.match(discardBody, /if \(board && board\.importRunId !== run\._id\) fail\('foreign-board'\)/);
  assert.ok(discardBody.indexOf("fail('foreign-board')") < discardBody.indexOf('removeBoard(run.boardId)'));
  assert.ok(discardBody.indexOf("fail('scrum-busy')") < discardBody.indexOf("state: 'discarding'"));
});

test('the Scrum stage is not finished onto a board whose import is being discarded', () => {
  const scrum = read('server/scrum.js');
  const body = scrum.slice(scrum.indexOf('async function recoverScrumImportOnline('));
  assert.match(body.slice(0, 800), /collection\('importRuns'\)\.findOne\(\{ boardId, state: 'discarding' \}/);
});

test('the Recovery page lists interrupted imports with keep and discard', () => {
  const jade = read('client/components/settings/adminProblems.jade');
  assert.match(jade, /\+listSyncStuckOperations\n\s+\+interruptedImports/);
  assert.match(jade, /template\(name="interruptedImports"\)/);
  assert.match(jade, /button\.js-interrupted-import-discard\(type="button" disabled=discardDisabled\)/);
  assert.match(jade, /button\.js-interrupted-import-keep\(type="button" disabled=keepDisabled\)/);
  const js = read('client/components/settings/adminProblems.js');
  assert.match(js, /discardDisabled: t\.busy\.get\(\) \|\| row\.foreignBoard/);
  assert.match(js, /t\.act\('importRunDiscard', [^,]+, 'interrupted-import-discard-confirm'\)/);
  assert.match(js, /t\.act\('importRunKeep', [^,]+, 'interrupted-import-keep-confirm'\)/);
});

test('every interface key the section uses exists in English', () => {
  const jade = read('client/components/settings/adminProblems.jade');
  const js = read('client/components/settings/adminProblems.js');
  const section = jade.slice(jade.indexOf('template(name="interruptedImports")')) +
    js.slice(js.indexOf('const IMPORT_RUN_REFUSALS'));
  const used = new Set([...section.matchAll(/'(interrupted-import-[a-z-]+)'/g)].map(match => match[1]));
  for (const reason of ['missing', 'not-interrupted', 'foreign-board', 'scrum-busy', 'failed']) used.add(`interrupted-import-${reason}`);
  used.delete('interrupted-import-');
  assert.ok(used.size >= 20, [...used].join());
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.deepEqual([...used].filter(key => !Object.hasOwn(en, key)), []);
});
