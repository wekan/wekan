'use strict';

// HistoryIntegrity "history-fork" (Admin Panel -> Problems, 2026-10-14): two
// changes saved at the same moment on one board both named the same previous
// row, because the legacy append read the newest row and inserted after it in
// two steps. models/lib/historyLegacyAppend.js makes a board's appends take
// turns and links each after the chain's tip; the audit reports each finding
// once and tells a same-moment fork from tampering.
// Run: node tests/historyLegacyAppend.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { appendLegacyHistoryRow, serializeHistoryAppend, historyChainTip } = require('../models/lib/historyLegacyAppend.js');
const { hashHistoryRow, verifyHistoryRows, isConcurrentFork, CONCURRENT_FORK_MS } = require('../models/lib/changeHistoryIntegrity.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

// A History collection whose reads and writes each take a turn of the event
// loop, as a database round trip does - which is what lets two appends interleave.
function memoryHistory() {
  const rows = [];
  let clock = Date.parse('2026-10-14T18:00:00Z');
  const matches = (row, selector) => Object.entries(selector).every(([key, want]) => {
    if (want && typeof want === 'object' && Array.isArray(want.$nin)) return !want.$nin.includes(row[key] ?? null);
    return (row[key] ?? null) === want;
  });
  return {
    rows,
    now: () => new Date(clock++),
    async findOneAsync(selector, options = {}) {
      await tick();
      let found = rows.filter(row => matches(row, selector));
      if (options.sort && options.sort.createdAt === -1) found = found.sort((a, b) => b.createdAt - a.createdAt);
      return found[0] ? { ...found[0] } : undefined;
    },
    async insertAsync(document) {
      await tick();
      rows.push({ ...document });
      return document._id;
    },
  };
}
const change = n => ({ _id: `r${n}`, boardId: 'b1', entityType: 'card', entityId: `c${n}`, changeType: 'edited',
  userId: 'u1', group: 'card', previousContent: { title: `${n}` }, newContent: { title: `${n + 1}` } });

(async () => {
  // Negative control: the old append (read the newest row, then insert) forks
  // when two run at once - the fault the audit reported.
  const old = memoryHistory();
  const oldAppend = async document => {
    const previous = await old.findOneAsync({ boardId: 'b1', integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: -1 } });
    const saved = { ...document, createdAt: old.now(), previousHash: previous ? previous.integrityHash : null };
    saved.integrityHash = hashHistoryRow(saved);
    return old.insertAsync(saved);
  };
  await oldAppend(change(0));
  await Promise.all([1, 2, 3, 4, 5].map(n => oldAppend(change(n))));
  const oldFailures = verifyHistoryRows(old.rows);
  assert.ok(oldFailures.some(f => f.reason === 'history-fork'), 'the old append forks under concurrency');
  assert.ok(oldFailures.filter(f => f.reason === 'history-fork').every(f => isConcurrentFork(f)), 'and the audit sees it as a race');
  console.log('  ok - the old append forks when two changes are saved at once (negative control)');

  // The fix: twenty at once, on two boards, make two straight chains.
  const history = memoryHistory();
  const append = (boardId, n) => appendLegacyHistoryRow({ history, boardId, document: { ...change(n), boardId, _id: `${boardId}-${n}` },
    hash: hashHistoryRow, prepare: doc => ({ ...doc, createdAt: history.now() }) });
  await Promise.all(Array.from({ length: 20 }, (_, n) => append(n % 2 ? 'b1' : 'b2', n)));
  assert.equal(history.rows.length, 20);
  assert.deepEqual(verifyHistoryRows(history.rows), [], 'no fork, no second root, every predecessor present');
  for (const boardId of ['b1', 'b2']) {
    const chain = history.rows.filter(row => row.boardId === boardId);
    assert.equal(chain.filter(row => row.previousHash === null).length, 1, `${boardId}: one root`);
    assert.equal((await historyChainTip(history, boardId)).integrityHash,
      chain.find(row => !chain.some(other => other.previousHash === row.integrityHash)).integrityHash, `${boardId}: the tip is the last row`);
  }
  console.log('  ok - twenty appends at once on two boards make two straight chains');

  // The tip, not merely the newest: a row with an older createdAt that already
  // has a successor is followed to its end (Sync batches share one createdAt).
  const tied = memoryHistory();
  const at = new Date('2026-10-14T18:00:00Z');
  await appendLegacyHistoryRow({ history: tied, boardId: 'b1', document: change(1), hash: hashHistoryRow, prepare: doc => ({ ...doc, createdAt: at }) });
  await appendLegacyHistoryRow({ history: tied, boardId: 'b1', document: change(2), hash: hashHistoryRow, prepare: doc => ({ ...doc, createdAt: at }) });
  await appendLegacyHistoryRow({ history: tied, boardId: 'b1', document: change(3), hash: hashHistoryRow, prepare: doc => ({ ...doc, createdAt: at }) });
  assert.deepEqual(verifyHistoryRows(tied.rows), [], 'a createdAt tie does not fork');
  console.log('  ok - a createdAt tie follows the chain to its tip');

  // A failed append does not stop the next one on that board.
  const order = [];
  const failing = serializeHistoryAppend('b9', async () => { order.push('a'); throw new Error('insert failed'); });
  const next = serializeHistoryAppend('b9', async () => { order.push('b'); return 'ok'; });
  await assert.rejects(failing, /insert failed/);
  assert.equal(await next, 'ok');
  assert.deepEqual(order, ['a', 'b']);
  console.log('  ok - a failed append is reported to its caller and the next one runs');

  // The audit: a same-moment fork of two intact rows is a race; anything else is not.
  const [fork] = oldFailures.filter(f => f.reason === 'history-fork');
  assert.ok(fork.sibling, 'a fork names the row it forked with');
  assert.equal(isConcurrentFork({ ...fork, row: { ...fork.row, createdAt: new Date(new Date(fork.sibling.createdAt).getTime() + CONCURRENT_FORK_MS + 1) } }), false,
    'a fork written long after its sibling is not a race (the row changed, so its hash fails too)');
  assert.equal(isConcurrentFork({ ...fork, row: { ...fork.row, newContent: { title: 'tampered' } } }), false, 'a changed row is not a race');
  assert.equal(isConcurrentFork({ reason: 'predecessor-missing', row: fork.row, sibling: fork.sibling }), false);
  assert.equal(isConcurrentFork({ reason: 'history-fork', row: fork.row }), false, 'no sibling, no verdict');
  console.log('  ok - the audit tells a same-moment fork from a changed or late row');

  // Every legacy append goes through it; nothing else links a row by "newest".
  assert.match(read('models/changeHistory.js'), /appendLegacyHistoryRow\(\{ history: ChangeHistory, boardId, document, hash: hashHistoryRow,/);
  assert.match(read('server/lib/scrumHistoryRestoreWriter.js'), /const legacy = document => appendLegacyHistoryRow\(\{ history, boardId, document, hash: hashHistoryRow \}\);/);
  assert.match(read('server/lib/storedHistoryChain.js'), /return serializeHistoryAppend\(prepared\.boardId, async \(\) => \{\s*const previous = await historyChainTip\(ChangeHistory, prepared\.boardId\);/);
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (!['node_modules', '_build', 'tests'].includes(entry.name)) walk(rel); continue; }
      if (!/\.(c|m)?js$/.test(entry.name)) continue;
      const src = read(rel);
      if (/previousHash:\s*previous/.test(src) && !/historyChainTip\(|appendLegacyHistoryRow|appendHistoryChain/.test(src)) offenders.push(rel);
    }
  };
  ['models', 'server'].forEach(walk);
  assert.deepEqual(offenders, [], 'a History append that links by "newest" without taking turns forks');
  const scan = read('server/lib/historyIntegrityScan.js');
  assert.match(scan, /if \(await firstReport\(failure\)\) \{ reported \+= 1; report\(failure\); \}/, 'each finding reported once');
  assert.match(scan, /distinct\('boardId'/, 'board by board, never the whole History in memory');
  assert.match(scan, /key: 'integrity\.historyConcurrentFork'/);
  assert.match(read('models/lib/securityCategories.js'), /'integrity\.historyConcurrentFork': \{ category: 'integrity', bleed: 'HistoryIntegrity', severity: 'medium'/);
  console.log('  ok - every legacy append takes turns; the audit reports once, board by board');

  console.log('\nhistoryLegacyAppend: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
