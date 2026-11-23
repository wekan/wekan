// #6941: Admin Panel's activity-notification recovery list grew without bound
// with old cancelled receipts. A pending intent is always listed; a cancelled
// receipt only while its activity is newer than
// ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS (14). Read-side only: the
// tombstone that stops a delayed writer is never removed. Pure, no database -
// tests/integration/activityNotificationCancellationRetention.test.cjs runs
// the same against MongoDB.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  recoveryReportSelector, recoveryCancelledDays, DEFAULT_CANCELLED_DAYS, activityNotificationReport,
} = require('../server/lib/activityNotificationReport');

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

// The selector shapes the report uses, evaluated the way MongoDB does.
function matches(doc, sel) {
  return Object.entries(sel).every(([key, cond]) => {
    if (key === '$and') return cond.every(s => matches(doc, s));
    if (key === '$or') return cond.some(s => matches(doc, s));
    const value = key.split('.').reduce((v, p) => (v == null ? v : v[p]), doc);
    if (cond instanceof RegExp) return typeof value === 'string' && cond.test(value);
    if (cond && typeof cond === 'object' && '$gte' in cond) return value instanceof Date && value >= cond.$gte;
    return value === cond;
  });
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2026, 10, 23));
const ago = days => new Date(NOW.getTime() - days * DAY);
const cutoff = days => ago(days);
const rows = {
  pendingNew: { _id: 'p1', state: 'pending', activity: { _id: 'a1', boardId: 'board', createdAt: ago(1) } },
  pendingOld: { _id: 'p2', state: 'pending', activity: { _id: 'a2', boardId: 'board', createdAt: ago(400) } },
  cancelledNew: { _id: 'c1', state: 'cancelled', activityId: 'a3', boardId: 'board', createdAt: ago(3) },
  cancelledOld: { _id: 'c2', state: 'cancelled', activityId: 'a4', boardId: 'board', createdAt: ago(40) },
  completed: { _id: 'd1', state: 'completed', activity: { _id: 'a5', boardId: 'board', createdAt: ago(1) } },
};
const listed = sel => Object.entries(rows).filter(([, r]) => matches(r, sel)).map(([k]) => k);

(async () => {
  await test('recoveryCancelledDays: 14 by default, a valid number of days, 0, and nonsense falls back', () => {
    assert.strictEqual(DEFAULT_CANCELLED_DAYS, 14);
    assert.strictEqual(recoveryCancelledDays({}), 14);
    assert.strictEqual(recoveryCancelledDays({ ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: '' }), 14);
    assert.strictEqual(recoveryCancelledDays({ ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: '30' }), 30);
    assert.strictEqual(recoveryCancelledDays({ ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: '0' }), 0);
    assert.strictEqual(recoveryCancelledDays({ ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: '36500' }), 36500);
    for (const bad of ['-1', '36501', 'abc', '1.5', 'Infinity']) {
      assert.strictEqual(recoveryCancelledDays({ ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: bad }), 14, `negative: ${bad}`);
    }
  });

  await test('pending intents are always listed, old and new; recent cancelled receipts are listed', () => {
    assert.deepStrictEqual(listed(recoveryReportSelector(null, cutoff(14))), ['pendingNew', 'pendingOld', 'cancelledNew']);
  });

  await test('negative: a cancelled receipt older than the window and completed work are not listed', () => {
    const got = listed(recoveryReportSelector(null, cutoff(14)));
    assert.ok(!got.includes('cancelledOld'));
    assert.ok(!got.includes('completed'));
  });

  await test('the window edges: exactly at the cutoff is listed, a millisecond older is not', () => {
    const edge = cutoff(14);
    assert.ok(matches({ state: 'cancelled', createdAt: edge }, recoveryReportSelector(null, edge)));
    assert.ok(!matches({ state: 'cancelled', createdAt: new Date(edge.getTime() - 1) }, recoveryReportSelector(null, edge)));
    assert.deepStrictEqual(listed(recoveryReportSelector(null, cutoff(60))), ['pendingNew', 'pendingOld', 'cancelledNew', 'cancelledOld']);
  });

  await test('0 days lists no cancelled receipt at all, and still every pending one', () => {
    assert.deepStrictEqual(listed(recoveryReportSelector(null, null)), ['pendingNew', 'pendingOld']);
  });

  await test('a search stays an $and of the time bound and the search, so an old matching receipt stays out', () => {
    const sel = recoveryReportSelector(/board/i, cutoff(14));
    assert.ok(Array.isArray(sel.$and) && sel.$and.length === 2);
    assert.ok(Array.isArray(sel.$and[1].$or));
    assert.deepStrictEqual(listed(sel), ['pendingNew', 'pendingOld', 'cancelledNew']);
    assert.deepStrictEqual(listed(recoveryReportSelector(/^a4$/, cutoff(14))), [], 'negative: the old receipt is not found by its id');
    assert.deepStrictEqual(listed(recoveryReportSelector(/^a4$/, cutoff(60))), ['cancelledOld']);
  });

  await test('the report counts and pages with the bounded selector, from now() and the env it is given', async () => {
    const seen = [];
    const intents = {
      countDocuments: async q => { seen.push(q); return 0; },
      find: q => { seen.push(q); return { sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => [] }) }) }) }; },
    };
    const result = await activityNotificationReport({ intents, now: () => NOW, env: {} });
    assert.deepStrictEqual(result, { total: 0, page: 1, rows: [] });
    assert.strictEqual(seen.length, 2);
    for (const q of seen) assert.deepStrictEqual(q, recoveryReportSelector(null, cutoff(14)));
    seen.length = 0;
    await activityNotificationReport({ intents, now: () => NOW, env: { ACTIVITY_NOTIFICATION_RECOVERY_CANCELLED_DAYS: '0' } });
    for (const q of seen) assert.deepStrictEqual(q, { state: 'pending' });
  });

  // The receipt is the tombstone that stops a delayed first writer from
  // recreating a cancelled payload: the fix must stay read-only.
  await test('negative: the report module removes or rewrites nothing, and says why', () => {
    const src = read('server/lib/activityNotificationReport.js');
    assert.doesNotMatch(src, /\.(deleteOne|deleteMany|remove|removeAsync|updateOne|updateMany|replaceOne|findOneAndUpdate|findOneAndDelete|insertOne)\(/);
    assert.match(src, /tombstone/);
    assert.match(src, /no receipt is removed/);
  });

  await test('negative: no other code lists pending and cancelled intents without the time bound', () => {
    const offenders = [];
    const walk = dir => {
      for (const e of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
        if (['node_modules', '.meteor', 'packages'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) walk(rel);
        else if (rel.endsWith('.js') && /state:\s*\{\s*\$in:\s*\[\s*'pending',\s*'cancelled'\s*\]/.test(read(rel))) offenders.push(rel);
      }
    };
    for (const dir of ['server', 'models', 'client', 'imports']) walk(dir);
    assert.deepStrictEqual(offenders, []);
  });

  console.log(`activityNotificationRecoveryRetention: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
