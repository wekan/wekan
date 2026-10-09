'use strict';

// #6745: a large board loads only what is visible, and opening or closing a
// card does not re-run the whole board. Run:
// node tests/largeBoardDataLoading.test.cjs
//
// Measured on a 4,000-card board (FerretDB/SQLite, lazy card loading):
//  1. closing a card took ~4 s. Every stopped helper ran DataCache.checkStop()
//     for every key it had read, once PER RE-RUN (an onStop callback was
//     queued on every read), and each call asked Tracker hasDependents() - a
//     walk over every dependent of values like the current board. Now one
//     callback per computation and key, and checkStop() only arms a timer.
//  2. a card open re-ran ~7,700 computations: avatars read the whole user
//     profile (a card open writes profile.cardLastViews), @mentions read whole
//     users, list and swimlane headers read the whole current user, and every
//     minicard's comment/checklist badge depended on ONE index object of the
//     whole board. Each now reads only its own fields / its own group.
//  3. the lazy window shipped every comment's text and the board every comment
//     reaction, to draw minicard badges; the window's observer kept a full
//     copy of all cards of its list; the window's five children ran the same
//     id query five times; legacy attachments were sent for the whole board on
//     every card open.
// tests/playwright/specs/large-board-lazy-loading.e2e.js measures 1-3 in the
// running app.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  windowOrderFields,
  windowCommentFields,
  MINICARD_COMMENT_FIELDS,
} = require('../models/lib/cardWindowFields.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// --- a minimal Tracker, enough to drive DataCache and KeyedGroupIndex -------

function makeTracker() {
  let current = null;
  const pending = new Set();
  const stats = { hasDependents: 0 };

  class Computation {
    constructor(fn) {
      this.fn = fn;
      this.stopped = false;
      this.invalidated = false;
      this.firstRun = true;
      this.onStopCallbacks = [];
      this.onInvalidateCallbacks = [];
      this.runs = 0;
    }
    run() {
      const previous = current;
      current = this;
      this.invalidated = false;
      try { this.runs += 1; this.fn(this); } finally { current = previous; this.firstRun = false; }
    }
    invalidate() {
      if (this.invalidated || this.stopped) return;
      this.invalidated = true;
      const callbacks = this.onInvalidateCallbacks;
      this.onInvalidateCallbacks = [];
      callbacks.forEach(f => f(this));
      pending.add(this);
    }
    stop() {
      if (this.stopped) return;
      this.invalidate();
      this.stopped = true;
      pending.delete(this);
      const callbacks = this.onStopCallbacks;
      this.onStopCallbacks = [];
      callbacks.forEach(f => f(this));
    }
    onStop(f) { if (this.stopped) f(this); else this.onStopCallbacks.push(f); }
    onInvalidate(f) { if (this.invalidated) f(this); else this.onInvalidateCallbacks.push(f); }
  }

  class Dependency {
    constructor() { this.dependents = new Set(); }
    depend() {
      if (!current) return false;
      const computation = current;
      if (this.dependents.has(computation)) return false;
      this.dependents.add(computation);
      computation.onInvalidate(() => this.dependents.delete(computation));
      return true;
    }
    changed() { [...this.dependents].forEach(c => c.invalidate()); }
    hasDependents() { stats.hasDependents += 1; return this.dependents.size > 0; }
  }

  const Tracker = {
    Computation,
    Dependency,
    get active() { return !!current; },
    get currentComputation() { return current; },
    autorun(fn) { const c = new Computation(fn); c.run(); return c; },
    nonreactive(fn) {
      const previous = current;
      current = null;
      try { return fn(); } finally { current = previous; }
    },
    flush() {
      while (pending.size) {
        const [c] = pending;
        pending.delete(c);
        if (!c.stopped) c.run();
      }
    },
  };
  return { Tracker, stats };
}

function makeTimers() {
  let next = 1;
  const timers = new Map();
  return {
    armed: () => timers.size,
    created: 0,
    setTimeout(fn) { this.created += 1; const id = next++; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    runAll() { const all = [...timers.values()]; timers.clear(); all.forEach(f => f()); },
  };
}

// Load an ES module source in plain Node with its imports replaced by `inject`.
function loadModule(rel, exportNames, inject) {
  let src = read(rel).replace(/^import .*$/gm, '');
  src = src.replace(/^export default .*$/gm, '').replace(/^export \{[^}]*\};?$/gm, '');
  src += `\nreturn { ${exportNames.join(', ')} };`;
  const names = Object.keys(inject);
  // eslint-disable-next-line no-new-func
  return new Function(...names, src)(...names.map(n => inject[n]));
}

function loadDataCache() {
  const { Tracker, stats } = makeTracker();
  const timers = makeTimers();
  const require = name => {
    assert.strictEqual(name, './staleWhileRevalidate');
    return { shouldDeferCacheMiss: () => false };
  };
  const { DataCache } = loadModule('imports/lib/dataCache.js', ['DataCache'], {
    Meteor: {},
    Tracker,
    require,
    setTimeout: timers.setTimeout.bind(timers),
    clearTimeout: timers.clearTimeout.bind(timers),
  });
  return { DataCache, Tracker, stats, timers };
}

function loadKeyedGroupIndex() {
  const { Tracker, stats } = makeTracker();
  const EJSON = { equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) };
  const { KeyedGroupIndex, sameGroup } = loadModule(
    'imports/lib/keyedGroupIndex.js', ['KeyedGroupIndex', 'sameGroup'], { Tracker, EJSON },
  );
  return { KeyedGroupIndex, sameGroup, Tracker, stats };
}

console.log('1. closing a card: DataCache bookkeeping is per computation and key');

test('a helper re-run 500 times queues ONE stop callback per key, not 500', () => {
  const { DataCache, Tracker } = loadDataCache();
  const cache = new DataCache(key => `value of ${key}`);
  const source = new Tracker.Dependency();
  const reader = Tracker.autorun(() => { source.depend(); cache.get('board'); });
  for (let i = 0; i < 499; i += 1) { source.changed(); Tracker.flush(); }
  assert.strictEqual(reader.runs, 500);
  // One from DataCache.get, one from the inner value cache - per key, not per run.
  assert.ok(reader.onStopCallbacks.length <= 2, `${reader.onStopCallbacks.length} stop callbacks`);
});

test('stopping many readers asks hasDependents() nothing and arms one timer per key', () => {
  const { DataCache, Tracker, stats, timers } = loadDataCache();
  const cache = new DataCache(key => `value of ${key}`);
  const readers = Array.from({ length: 300 }, () => Tracker.autorun(() => { cache.get('board'); cache.get('user'); }));
  stats.hasDependents = 0;
  const before = timers.created;
  readers.forEach(r => r.stop());
  assert.strictEqual(stats.hasDependents, 0, 'checkStop must not walk the dependents on every call');
  assert.ok(timers.created - before <= 2, `${timers.created - before} timers for 2 keys`);
});

test('the teardown still happens once nothing reads the key', () => {
  const { DataCache, Tracker, timers } = loadDataCache();
  let computed = 0;
  const cache = new DataCache(() => { computed += 1; return 'v'; });
  const reader = Tracker.autorun(() => cache.get('k'));
  reader.stop();
  timers.runAll();
  assert.strictEqual(cache.computations.k, undefined, 'the idle computation is stopped');
  // Read again: computed afresh.
  Tracker.autorun(() => cache.get('k'));
  assert.strictEqual(computed, 2);
});

test('negative: a key read again before the timer fires is kept', () => {
  const { DataCache, Tracker, timers } = loadDataCache();
  const cache = new DataCache(() => 'v');
  Tracker.autorun(() => cache.get('k')).stop();
  const again = Tracker.autorun(() => cache.get('k'));
  timers.runAll();
  assert.ok(cache.computations.k && !cache.computations.k.stopped, 'still live');
  again.stop();
});

test('negative: a key still read by another computation is not torn down', () => {
  const { DataCache, Tracker, timers } = loadDataCache();
  const cache = new DataCache(() => 'v');
  const keep = Tracker.autorun(() => cache.get('k'));
  Tracker.autorun(() => cache.get('k')).stop();
  timers.runAll();
  assert.ok(cache.computations.k && !cache.computations.k.stopped);
  keep.stop();
});

console.log('2. a card open re-runs only what it changed');

test('a reader of one group is not re-run by a change to another group', () => {
  const { KeyedGroupIndex, Tracker } = loadKeyedGroupIndex();
  const source = new Tracker.Dependency();
  let docs = [{ _id: 'c1', cardId: 'A' }, { _id: 'c2', cardId: 'B' }];
  const index = new KeyedGroupIndex(() => {
    source.depend();
    const groups = {};
    for (const d of docs) (groups[d.cardId] = groups[d.cardId] || []).push({ ...d });
    return groups;
  });
  const readerA = Tracker.autorun(() => index.get('A'));
  const readerB = Tracker.autorun(() => index.get('B'));
  docs = [...docs, { _id: 'c3', cardId: 'B' }];
  source.changed();
  Tracker.flush();
  assert.strictEqual(readerA.runs, 1, 'card A did not change');
  assert.strictEqual(readerB.runs, 2, 'card B did');
  assert.strictEqual(index.get('B').length, 2);
});

test('negative: a changed field inside a group re-runs that group\'s reader', () => {
  const { KeyedGroupIndex, Tracker } = loadKeyedGroupIndex();
  const source = new Tracker.Dependency();
  let docs = [{ _id: 'c1', cardId: 'A', text: 'x' }];
  const index = new KeyedGroupIndex(() => {
    source.depend();
    const groups = {};
    for (const d of docs) (groups[d.cardId] = groups[d.cardId] || []).push({ ...d });
    return groups;
  });
  const reader = Tracker.autorun(() => index.get('A'));
  docs = [{ _id: 'c1', cardId: 'A', text: 'y' }];
  source.changed();
  Tracker.flush();
  assert.strictEqual(reader.runs, 2);
  assert.strictEqual(index.get('A')[0].text, 'y');
  // A group that is emptied is a change too.
  docs = [];
  source.changed();
  Tracker.flush();
  assert.strictEqual(reader.runs, 3);
  assert.deepStrictEqual(index.get('A'), []);
});

test('a re-running reader queues one stop callback per key', () => {
  const { KeyedGroupIndex, Tracker } = loadKeyedGroupIndex();
  const index = new KeyedGroupIndex(() => ({ A: [{ _id: 1 }] }));
  const other = new Tracker.Dependency();
  const reader = Tracker.autorun(() => { other.depend(); index.get('A'); });
  for (let i = 0; i < 100; i += 1) { other.changed(); Tracker.flush(); }
  assert.strictEqual(reader.onStopCallbacks.length, 1);
});

test('the client indexes are keyed per group; none is a whole-board DataCache any more', () => {
  const src = read('imports/reactiveCache.js');
  const start = src.indexOf('const ReactiveMiniMongoIndexClient = {');
  const end = src.indexOf('getActivityWithId(', start);
  const client = src.slice(start, end);
  for (const name of ['getSubTasksWithParentId', 'getChecklistsWithCardId',
    'getChecklistItemsWithChecklistId', 'getCardCommentsWithCardId']) {
    assert.ok(client.includes(`${name}(`), name);
  }
  assert.doesNotMatch(client, /new DataCache\(/, 'a grouped index is a KeyedGroupIndex');
  assert.strictEqual((client.match(/keyedIndex\(this, '/g) || []).length, 4);
  assert.match(src, /index = new KeyedGroupIndex\(\(\) => build\(parsed\)\)/);
});

test('avatars read only the user fields they show', () => {
  const src = read('client/components/users/userAvatar.js');
  // Every user read in the avatar helpers is field-limited ...
  const avatar = src.slice(src.indexOf('Template.userAvatar.helpers({'), src.indexOf('Template.boardOrgRow.onCreated'))
    .replace(/\/\*[\s\S]*?\*\//g, ''); // a commented-out helper is not a read
  const reads = avatar.match(/ReactiveCache\.getUser\([^)]*\)/g) || [];
  assert.ok(reads.length >= 6, `${reads.length} reads`);
  for (const r of reads) assert.match(r, /fields/, `unlimited read: ${r}`);
  // ... and none of them is the whole profile.
  assert.doesNotMatch(avatar, /fields: \{\s*profile: 1/);
  assert.match(src, /'profile\.avatarUrl': 1/);
});

test('@mentions read only usernames', () => {
  const src = read('client/components/main/editor.js');
  const mentions = src.slice(src.indexOf("'mentions',"), src.indexOf('copyCodeBlockText'));
  assert.match(mentions, /ReactiveCache\.getUser\(member\.userId, \{ fields: \{ username: 1 \} \}\)/);
  assert.doesNotMatch(mentions, /ReactiveCache\.getUser\(member\.userId\)/);
});

test('list and swimlane headers ask the current user only for its board role', () => {
  const header = read('client/components/lists/listHeader.js');
  assert.match(header, /Template\.listHeader\.helpers\(\{[\s\S]{0,700}currentUser\(\) \{\s*return currentUserWith\(\['username'\]\);/);
  const swimlanes = read('client/components/swimlanes/swimlanes.js');
  assert.match(swimlanes, /Template\.swimlane\.helpers\(\{[\s\S]{0,300}currentUser\(\) \{\s*return currentUserWith\(\['username'\]\);/);
  assert.match(swimlanes, /Template\.listsGroup\.helpers\(\{[\s\S]{0,300}currentUser\(\) \{\s*return currentUserWith\(\['username'\]\);/);
  // The role checks they make need nothing but the user's _id.
  const users = read('models/users.js');
  for (const role of ['isBoardMember', 'isCommentOnly', 'isWorker', 'isReadOnly', 'isReadAssignedOnly']) {
    const at = users.indexOf(`    ${role}() {`);
    assert.ok(at > 0, role);
    const body = users.slice(at, users.indexOf('\n    },', at));
    assert.doesNotMatch(body, /this\.(profile|username|emails)/, `${role} reads more than _id`);
  }
});

console.log('3. the lazy window sends what minicards show');

test('the membership observer projects to _id and the sort keys', () => {
  assert.deepStrictEqual(windowOrderFields({ sort: 1, _id: 1 }), { _id: 1, sort: 1 });
  assert.deepStrictEqual(windowOrderFields([['dueAt', 'asc'], ['_id', 'asc']]), { _id: 1, dueAt: 1 });
  assert.deepStrictEqual(windowOrderFields(['receivedAt']), { _id: 1, receivedAt: 1 });
  assert.deepStrictEqual(windowOrderFields({ 'customFields.value': -1 }), { _id: 1, 'customFields.value': 1 });
});

test('negative: an operator or empty sort key is not a projected field', () => {
  assert.deepStrictEqual(windowOrderFields({ $natural: 1, '': 1 }), { _id: 1 });
  assert.deepStrictEqual(windowOrderFields(null), { _id: 1 });
  assert.deepStrictEqual(windowOrderFields(undefined), { _id: 1 });
});

test('window comments carry no text unless the board shows comments on minicards', () => {
  assert.deepStrictEqual(windowCommentFields({}), { ...MINICARD_COMMENT_FIELDS });
  assert.strictEqual(windowCommentFields({ allowsCommentsOnMinicard: false }).text, undefined);
  assert.strictEqual(windowCommentFields({ allowsCommentsOnMinicard: true }).text, 1);
  assert.strictEqual(windowCommentFields(null).text, undefined);
  // What the minicard badges read is always there.
  for (const field of ['cardId', 'createdAt', 'userId']) assert.strictEqual(windowCommentFields({})[field], 1);
});

test('cardsWindow: projected observer, content observer, one id query, projected comments', () => {
  const src = read('server/publications/cardsWindow.js');
  assert.match(src, /Cards\.find\(windowSel\(board\), \{\s*fields: windowOrderFields\(sortOpt\),/);
  assert.match(src, /Cards\.find\(\{ _id: \{ \$in: ids \} \}\)\.observeChangesAsync/);
  assert.match(src, /const windowIdsByBoard = new WeakMap\(\);/);
  assert.match(src, /\{ fields: windowCommentFields\(board\) \}/);
  assert.match(src, /fields: \{ _id: 1, members: 1, allowsCommentsOnMinicard: 1 \}/);
  // negative: no child of the window reads every field of every list card live.
  assert.doesNotMatch(src, /Cards\.find\(windowSel\(board\)\)\.observeChangesAsync/);
});

test('reactions: not with a lazy board, but with the opened card', () => {
  const boards = read('server/publications/boards.js');
  const at = boards.indexOf('// CardCommentReactions at board level');
  const block = boards.slice(at, boards.indexOf('// CustomFields', at));
  assert.match(block, /if \(await boardIsLazy\(board\)\) return null;/);
  const cards = read('server/publications/cards.js');
  const open = cards.slice(cards.indexOf("publishComposite('openCardData'"), cards.indexOf("publishComposite('popupCardData'"));
  assert.match(open, /getCardCommentReactions\(\{ cardId: c\._id \}/);
});

test('legacy attachments: the open card only, looked up in one query', () => {
  const pub = read('server/publications/legacyAttachments.js');
  assert.match(pub, /Meteor\.publish\('legacyBoardAttachments', async function \(boardId, cardId\)/);
  assert.match(pub, /check\(cardId, Match\.Maybe\(String\)\)/);
  assert.match(pub, /const selector = cardId \? \{ boardId, cardId \} : \{ boardId \};/);
  // negative: no per-record lookup inside the loop.
  assert.doesNotMatch(pub, /await ReactiveCache\.getAttachment\(rec\._id\)/);
  const details = read('client/components/cards/cardDetails.js');
  assert.match(details, /Meteor\.subscribe\('legacyBoardAttachments', boardId, cardId\)/);
  assert.doesNotMatch(details, /Meteor\.subscribe\('legacyBoardAttachments', board\._id\)/);
});

console.log(`largeBoardDataLoading: ${passed} passed`);
