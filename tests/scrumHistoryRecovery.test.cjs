'use strict';
// A Scrum History undo or redo that stopped on a conflict, resolved by a board
// administrator or the offline command (server/lib/scrumHistoryRecovery.js),
// decided here against an in-memory database, and the wiring that reaches it
// pinned in the source. Run: node --test tests/scrumHistoryRecovery.test.cjs
// The same against MongoDB, with two clients and the real command:
// tests/integration/scrumHistoryRecovery.test.cjs. In the browser:
// tests/playwright/specs/scrum-history-checkpoint-recovery.e2e.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonical } = require('../models/lib/changeHistoryIntegrity');
const { inspectScrumHistoryCheckpoint: inspect, resolveScrumHistoryCheckpoint: resolve, describeResolution,
  RETRY_FAILURES } = require('../server/lib/scrumHistoryRecovery');
const { parse } = require('../releases/recover-scrum-history.cjs');
const { scrumHistoryFixture } = require('./scrumHistoryRecoveryFixture.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// The part of the MongoDB driver the recovery uses, over plain arrays.
function memoryDb(collections) {
  const data = Object.fromEntries(Object.entries(collections).map(([name, docs]) => [name, structuredClone(docs)]));
  const matchValue = (value, condition) => {
    if (condition && typeof condition === 'object' && !(condition instanceof Date) && !Array.isArray(condition) &&
        Object.keys(condition).some(key => key.startsWith('$'))) {
      return Object.entries(condition).every(([op, operand]) => {
        if (op === '$eq') return value !== undefined && canonical(value) === canonical(operand);
        if (op === '$exists') return (value !== undefined) === operand;
        if (op === '$in') return operand.some(item => canonical(item) === canonical(value));
        throw new Error(`unsupported ${op}`);
      });
    }
    return value !== undefined && canonical(value) === canonical(condition);
  };
  const matches = (doc, query = {}) => Object.entries(query).every(([key, condition]) => matchValue(doc[key], condition));
  return { data, collection(name) {
    data[name] ||= [];
    const docs = () => data[name];
    return {
      findOne: async query => structuredClone(docs().find(doc => matches(doc, query)) ?? null),
      find: query => ({ toArray: async () => structuredClone(docs().filter(doc => matches(doc, query))) }),
      insertOne: async doc => {
        if (docs().some(existing => existing._id === doc._id)) throw Object.assign(new Error('duplicate key'), { code: 11000 });
        docs().push(structuredClone(doc));
      },
      updateOne: async (query, modifier) => {
        const doc = docs().find(candidate => matches(candidate, query));
        if (!doc) return { matchedCount: 0 };
        for (const [key, value] of Object.entries(modifier.$set || {})) {
          const [head, tail] = key.split('.');
          if (tail) doc[head][tail] = structuredClone(value); else doc[key] = structuredClone(value);
        }
        for (const key of Object.keys(modifier.$unset || {})) delete doc[key];
        return { matchedCount: 1 };
      },
      deleteOne: async query => {
        const index = docs().findIndex(doc => matches(doc, query));
        if (index < 0) return { deletedCount: 0 };
        docs().splice(index, 1);
        return { deletedCount: 1 };
      },
    };
  } };
}
const fixture = setup => memoryDb(scrumHistoryFixture(setup).collections);
const online = { online: true, settleMs: 0 };

test('a stopped undo that wrote half its records rolls back to its "before" values', async () => {
  const db = fixture({ applied: ['card'], lastFailure: 'scrum-conflict' });
  const report = await inspect(db, 'b');
  assert.deepEqual({ stuck: report.stuck, reasons: report.reasons, canRollback: report.canRollback,
    counts: [report.total, report.applied, report.pending, report.conflicted] },
  { stuck: true, reasons: ['retry-failed'], canRollback: true, counts: [2, 1, 1, 0] });
  assert.deepEqual(report.targets, [{ type: 'card', id: 'c1', state: 'applied' }, { type: 'scrum-sprint', id: 's1', state: 'pending' }]);
  const result = await resolve(db, 'b', { action: 'rollback', key: report.key, ...online });
  assert.equal(result.state, 'rolled-back'); assert.equal(result.reverted, 1);
  assert.deepEqual(db.data.cards[0].scrum, { sprintId: 's1' }); assert.equal(db.data.cards[0].scrumRevision, 3);
  assert.equal(db.data.cards[0].title, 'Keep this title');
  assert.equal(db.data.scrumHistoryPending.length, 0);
  assert.match(describeResolution(result, 'Board admin a (admin)'), /rolled back 1 of 2 records.*retry-failed/);
});

test('negative: a checkpoint nobody is stuck on is not resolvable, rolled back or discarded', async () => {
  const db = fixture({ applied: ['card'] });
  for (const action of ['rollback', 'discard']) {
    await assert.rejects(resolve(db, 'b', { action, key: 'op', ...online }), /author can retry/);
  }
  assert.equal(db.data.scrumHistoryPending.length, 1);
  assert.equal(db.data.scrumHistoryPending[0].worker, 'author-worker', 'not even claimed');
  assert.equal(db.data.scrumHistoryPending[0].resolving, undefined);
  assert.deepEqual(db.data.cards[0].scrum, {}, 'nothing written');
  // A transient failure is not a conflict either.
  assert.equal((await inspect(fixture({ lastFailure: 'scrum-history-pending' }), 'b')).stuck, false);
  assert.ok(!RETRY_FAILURES.has('scrum-history-pending') && !RETRY_FAILURES.has('scrum-history-running'));
});

test('negative: records changed by someone else are never overwritten; discard writes nothing, twice', async () => {
  const db = fixture({ applied: ['card'], conflict: 'sprint' });
  await assert.rejects(resolve(db, 'b', { action: 'rollback', key: 'op', ...online }), /overwrite/);
  const sprint = structuredClone(db.data.scrumSprints[0]), card = structuredClone(db.data.cards[0]);
  const first = await resolve(db, 'b', { action: 'discard', key: 'op', ...online });
  assert.deepEqual([first.state, first.applied, first.pending, first.conflicted], ['discarded', 1, 0, 1]);
  assert.deepEqual(db.data.scrumSprints[0], sprint); assert.deepEqual(db.data.cards[0], card);
  assert.deepEqual(await resolve(db, 'b', { action: 'discard', key: 'op', ...online }),
    { changed: false, state: 'absent', action: 'discard', key: 'op' });
});

test('negative: a claim must be online or offline, and names exactly one checkpoint', async () => {
  const db = fixture({ lastFailure: 'scrum-conflict' });
  await assert.rejects(resolve(db, 'b', { action: 'discard', key: 'op' }), /offline recovery/);
  await assert.rejects(resolve(db, 'b', { action: 'discard', key: 'op', online: true, offline: true }), /offline recovery/);
  await assert.rejects(resolve(db, 'b', { action: 'discard', ...online }), /Name the checkpoint/);
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'another-op', ...online })).changed, false);
  assert.equal(db.data.scrumHistoryPending.length, 1);
  // A checkpoint from before operations had IDs is named by its History row.
  const legacy = fixture({ operationId: null, lastFailure: 'scrum-conflict', damagedRow: true });
  const report = await inspect(legacy, 'b');
  assert.equal(report.key, 'row:row');
  assert.equal((await resolve(legacy, 'b', { action: 'discard', key: 'row:row', ...online })).state, 'discarded');
});

test('the offline command parses only complete actions', () => {
  assert.deepEqual(parse(['--board', 'b']), { apply: false, offline: false, action: null, boardId: 'b' });
  assert.deepEqual(parse(['--board', 'b', '--discard', '--checkpoint', 'op', '--apply', '--offline']),
    { apply: true, offline: true, action: 'discard', boardId: 'b', key: 'op' });
  for (const args of [['--board', 'b', '--apply', '--offline', '--rollback'], ['--board', 'b', '--rollback', '--checkpoint', 'op', '--apply'],
    ['--board', 'b', '--offline'], ['--board', 'b', '--board', 'c'], ['--checkpoint', 'op']]) {
    assert.throws(() => parse(args), undefined, args.join(' '));
  }
});

test('wiring: board administrators resolve online, under the board lock, recorded in Problems -> Recovery', () => {
  const scrum = read('server/scrum.js');
  const resolveOnline = scrum.slice(scrum.indexOf('async function resolveScrumHistoryCheckpointOnline'),
    scrum.indexOf('const methods = {'));
  assert.match(resolveOnline, /await boardFor\(userId, boardId, true\);/, 'board administrators only');
  assert.match(resolveOnline, /withScrumBoardLock\(boardId, \(\) => resolveScrumHistoryCheckpoint\(/);
  assert.match(resolveOnline, /online: true/);
  assert.match(resolveOnline, /RecoveryEvents\.types\.SCRUM_HISTORY_CHECKPOINT_RESOLVED/);
  assert.match(resolveOnline, /done: false/, 'a failed resolution is recorded too');
  const inspectOnline = scrum.slice(scrum.indexOf('async function inspectScrumHistoryCheckpointOnline'),
    scrum.indexOf('async function resolveScrumHistoryCheckpointOnline'));
  assert.match(inspectOnline, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(inspectOnline, /board\.hasAdmin\(userId\)\) return \{ \.\.\.report, canResolve: true \}/,
    'only an administrator sees what it holds');
  assert.match(scrum, /'scrum\.inspectHistoryCheckpoint'/); assert.match(scrum, /'scrum\.resolveHistoryCheckpoint'/);
  assert.match(read('models/recoveryEvents.js'), /SCRUM_HISTORY_CHECKPOINT_RESOLVED: 'scrum-history-checkpoint-resolved'/);
  assert.match(read('releases/recover-scrum-history.cjs'), /type: 'scrum-history-checkpoint-resolved'/);
});

test('wiring: the author\'s retry records a lasting failure, and stays out of a resolution', () => {
  const history = read('server/lib/scrumHistory.js');
  assert.match(history, /if \(journal\?\.resolving\) \{\s*throw new Meteor\.Error\('scrum-history-pending'/);
  assert.match(history, /await recordScrumHistoryFailure\(journal, worker, error\);\s*throw error;/);
  const record = history.slice(history.indexOf('async function recordScrumHistoryFailure'));
  assert.match(record, /RETRY_FAILURES\.has\(error\.error\)/);
  assert.match(record, /\.\.\.\(worker \? \{ worker \} : \{\}\)/, 'a displaced worker cannot mark the checkpoint');
  assert.match(record, /catch \(failure\) \{/, 'never in the way of the error');
  const ownership = read('server/lib/scrumHistoryOwnership.js');
  assert.match(ownership, /findOneAsync\(\{ \.\.\.scrumHistorySelector\(journal\), \.\.\.unresolved \}\)/);
  assert.match(ownership, /updateAsync\(\{ \.\.\.selector, \.\.\.unresolved \}, \{ \$set: \{ worker \} \}\)/);
  // The selector the completion's planHash digests is unchanged.
  assert.doesNotMatch(ownership.slice(ownership.indexOf('function scrumHistorySelector'),
    ownership.indexOf('// A checkpoint a board administrator')), /resolving/);
});

test('wiring: the recovery notice shows the stopped checkpoint and its two ways out', () => {
  const jade = read('client/components/main/historyRecoveryNotice.jade');
  const block = jade.slice(jade.indexOf('if checkpoint'));
  assert.match(block, /js-history-checkpoint-notice\(role="status"/);
  assert.match(block, /if checkpoint\.canResolve[\s\S]*if checkpoint\.canRollback\s*\n\s*button\.primary\.js-history-checkpoint-rollback/);
  assert.match(block, /button\.js-history-checkpoint-discard/);
  assert.match(block, /else\s*\n\s*p\.quiet \{\{_ 'scrum-history-checkpoint-ask-admin'\}\}/);
  const recovery = read('client/lib/historyKeyRecovery.js');
  assert.match(recovery, /call\('scrum\.inspectHistoryCheckpoint', boardId\)/);
  assert.match(recovery, /call\('scrum\.resolveHistoryCheckpoint', checkpoint\.boardId, checkpoint\.key, action\)/);
  const notice = read('client/components/main/historyRecoveryNotice.js');
  assert.match(notice, /window\.confirm\(TAPi18n\.__\('scrum-history-checkpoint-discard-confirm'\)\)/);
  // Every interface string it uses is an English source string.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const used = new Set([...`${jade}\n${notice}`.matchAll(/'(scrum-history-checkpoint-[a-z-]+)'/g)].map(m => m[1]));
  assert.ok(used.size >= 7);
  assert.deepEqual([...used].filter(key => !en[key]), [], 'add the keys to en.i18n.json');
});

test('docs name both ways to resolve it', () => {
  const doc = read('docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-History-Recovery.md');
  for (const text of ['releases/recover-scrum-history.cjs', '--apply --offline', 'Problems', 'Roll back', 'Keep the board as it is']) {
    assert.ok(doc.includes(text), text);
  }
  assert.match(read('tests/buildScriptParity.test.cjs'), /'recover-scrum-history\.cjs':/);
});
