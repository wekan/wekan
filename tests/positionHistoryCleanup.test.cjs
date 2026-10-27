'use strict';

// #6821: the hourly History integrity audit and the daily position-history
// cleanup were Meteor.setInterval jobs, so every WeKan process behind one
// database ran them - on 24 pods the audit read the whole History 24 times an
// hour, and the cleanup asked one query per board membership (148,660) 24
// times a day to trim nothing. Both are SyncedCron jobs now (one pod per
// scheduled time), and the cleanup visits only the user/board pairs over the
// limit.
// Run: node tests/positionHistoryCleanup.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { KEEP_PER_USER_BOARD, overLimitPipeline, trimPositionHistory } = require('../models/lib/positionHistoryCleanup.js');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

// An in-memory position history with the database calls the cleanup makes.
function memoryDb(entries) {
  let rows = entries.map(e => ({ ...e }));
  const pairOf = r => `${r.userId}|${r.boardId}`;
  const calls = { overLimit: 0, oldestKept: 0, remove: 0 };
  return {
    calls,
    rows: () => rows,
    async overLimit(pipeline) {
      calls.overLimit += 1;
      const limit = pipeline[2].$match.n.$gt;
      const counts = new Map();
      for (const r of rows) if (r.isCheckpoint !== true) counts.set(pairOf(r), (counts.get(pairOf(r)) || 0) + 1);
      return [...counts].filter(([, n]) => n > limit)
        .map(([key, n]) => { const [userId, boardId] = key.split('|'); return { _id: { userId, boardId }, n }; });
    },
    async oldestKept({ userId, boardId }, keep) {
      calls.oldestKept += 1;
      const mine = rows.filter(r => r.userId === userId && r.boardId === boardId && r.isCheckpoint !== true)
        .sort((a, b) => b.createdAt - a.createdAt);
      return mine[keep - 1] ? mine[keep - 1].createdAt : null;
    },
    async remove({ userId, boardId, before }) {
      calls.remove += 1;
      const n = rows.length;
      rows = rows.filter(r => !(r.userId === userId && r.boardId === boardId && r.isCheckpoint !== true && r.createdAt < before));
      return n - rows.length;
    },
  };
}

// What the old per-membership loop kept: the newest `keep` non-checkpoint
// entries of every pair, and every checkpoint.
function expectedAfter(entries, keep) {
  const groups = new Map();
  for (const r of entries) {
    if (r.isCheckpoint === true) continue;
    const key = `${r.userId}|${r.boardId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const kept = new Set(entries.filter(r => r.isCheckpoint === true).map(r => r._id));
  for (const list of groups.values()) {
    list.sort((a, b) => b.createdAt - a.createdAt).slice(0, keep).forEach(r => kept.add(r._id));
  }
  return [...kept].sort();
}

function sample() {
  const rows = [];
  let id = 0;
  const add = (userId, boardId, count, extra = {}) => {
    for (let i = 0; i < count; i += 1) {
      rows.push({ _id: `e${id += 1}`, userId, boardId, createdAt: new Date(Date.UTC(2026, 0, 1) + i * 1000), ...extra });
    }
  };
  add('u1', 'b1', 12);              // over the limit
  add('u1', 'b2', 5);               // exactly the limit
  add('u2', 'b1', 3);               // under it
  add('u3', 'b9', 9);               // a board the user has since left: still trimmed
  add('u1', 'b1', 4, { isCheckpoint: true }); // checkpoints are never trimmed
  return rows;
}

(async () => {
  await test('the newest entries per user and board are kept, as before, and checkpoints stay', async () => {
    const rows = sample();
    const db = memoryDb(rows);
    const result = await trimPositionHistory(db, { keep: 5 });
    assert.deepStrictEqual(db.rows().map(r => r._id).sort(), expectedAfter(rows, 5));
    assert.deepStrictEqual(result, { pairs: 2, removed: (12 - 5) + (9 - 5) });
  });

  await test('only the pairs over the limit are visited', async () => {
    const db = memoryDb(sample());
    await trimPositionHistory(db, { keep: 5 });
    assert.deepStrictEqual(db.calls, { overLimit: 1, oldestKept: 2, remove: 2 });
  });

  await test('negative: nothing over the limit means no per-pair query and nothing removed', async () => {
    const rows = sample();
    const db = memoryDb(rows);
    const result = await trimPositionHistory(db, { keep: 100 });
    assert.deepStrictEqual(result, { pairs: 0, removed: 0 });
    assert.deepStrictEqual(db.calls, { overLimit: 1, oldestKept: 0, remove: 0 });
    assert.strictEqual(db.rows().length, rows.length);
  });

  await test('it pauses between pairs, so a busy CPU slows it down', async () => {
    let pauses = 0;
    await trimPositionHistory(memoryDb(sample()), { keep: 5, pause: async () => { pauses += 1; } });
    assert.strictEqual(pauses, 2);
  });

  await test('the pipeline counts non-checkpoint entries per pair, over 1000 by default', () => {
    assert.strictEqual(KEEP_PER_USER_BOARD, 1000);
    assert.deepStrictEqual(overLimitPipeline(), [
      { $match: { isCheckpoint: { $ne: true } } },
      { $group: { _id: { userId: '$userId', boardId: '$boardId' }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1000 } } },
    ]);
  });

  await test('both jobs are SyncedCron jobs that wait for a quiet CPU', () => {
    const scan = read('server/lib/historyIntegrityScan.js');
    assert.match(scan, /SyncedCron\.add\(\{\s+name: 'wekan-history-integrity-scan',/);
    assert.match(scan, /parser\.text\('every 1 hour'\)/);
    assert.match(scan, /runWhenCpuLow\('change history integrity audit', runHistoryIntegrityScan/);
    const uph = read('server/models/userPositionHistory.js');
    assert.match(uph, /SyncedCron\.add\(\{\s+name: 'wekan-position-history-cleanup',/);
    assert.match(uph, /runWhenCpuLow\('position history cleanup',/);
    assert.match(uph, /trimPositionHistory\(\{/);
    assert.doesNotMatch(uph, /Meteor\.users\.find\(\{\}/, 'not every user');
    assert.doesNotMatch(uph, /'members\.userId'/, 'not every board membership');
  });

  await test('negative: nowhere in server/ or models/ are these jobs driven by a per-process timer', () => {
    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(rel); continue; }
        if (!/\.(js|cjs|mjs)$/.test(entry.name)) continue;
        const src = read(rel);
        const re = /(?:Meteor\.)?setInterval\(/g;
        let m;
        while ((m = re.exec(src))) {
          const body = src.slice(m.index, m.index + 600);
          if (/runHistoryIntegrityScan|UserPositionHistory\.cleanup|trimPositionHistory/.test(body)) offenders.push(rel);
        }
      }
    };
    ['server', 'models'].forEach(walk);
    assert.deepStrictEqual(offenders, []);
  });

  console.log(`\n${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
