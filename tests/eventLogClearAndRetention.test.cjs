'use strict';
// #6893: Admin Panel -> Problems. A resolved problem lingered forever:
// Acknowledge only reset the "new" count, the rows stayed. Clear removes the
// checked streams' events up to now, and a daily retention sweep ages out
// stale events. Both are run here on an in-memory event log, from the source.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const model = read('models/eventLog.js');
const STREAMS = ['security', 'speed', 'tests', 'cpu', 'ram', 'disk', 'database', 'integrity', 'mail'];
const DAY = 24 * 60 * 60 * 1000;

// A matcher for the two selectors the code uses: { stream, at: { $lte } } and
// { at: { $lt } }.
function matches(doc, sel) {
  return Object.entries(sel).every(([k, v]) => {
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      if ('$lte' in v) return doc[k] <= v.$lte;
      if ('$lt' in v) return doc[k] < v.$lt;
    }
    return doc[k] === v;
  });
}
function memoryLog(rows) {
  const docs = rows.map(r => ({ ...r }));
  const acks = {};
  return {
    docs, acks,
    EventLog: { rawCollection: () => ({ deleteMany: async sel => {
      const before = docs.length;
      for (let i = docs.length - 1; i >= 0; i -= 1) if (matches(docs[i], sel)) docs.splice(i, 1);
      return { deletedCount: before - docs.length };
    } }) },
    EventLogAcks: { upsertAsync: async ({ stream }, { $set }) => { acks[stream] = $set.at; } },
  };
}
const bodyOf = (src, start, end) => {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `${start} is in models/eventLog.js`);
  return src.slice(i, src.indexOf(end, i) + end.length);
};

function loadClear(log, isAdmin = true) {
  const method = bodyOf(model, '    async clearEventLog(streams) {', '\n    },\n').trim().replace(/,$/, '');
  const requireAdmin = async () => { if (!isAdmin) throw Object.assign(new Error('Admin only'), { error: 'not-authorized' }); };
  const Meteor = { Error: class extends Error { constructor(error, reason) { super(reason); this.error = error; } } };
  const check = () => {};
  const Match = { OneOf: () => null };
  // eslint-disable-next-line no-new-func
  const obj = new Function('EventLog', 'EventLogAcks', 'EVENT_STREAMS', 'requireAdmin', 'Meteor', 'check', 'Match',
    `return { ${method} };`)(log.EventLog, log.EventLogAcks, STREAMS, requireAdmin, Meteor, check, Match);
  return streams => obj.clearEventLog.call({ userId: 'u' }, streams);
}

function loadRetention(log, env) {
  const days = bodyOf(model, '  const EVENTLOG_RETENTION_DAYS = (() => {', '})();');
  const run = bodyOf(model, '  async function runEventLogRetention() {', '\n  }\n');
  // eslint-disable-next-line no-new-func
  return new Function('EventLog', 'process', `${days}\n${run}\nreturn { EVENTLOG_RETENTION_DAYS, runEventLogRetention };`)(
    log.EventLog, { env });
}

test('Clear deletes the checked streams\' events up to now and stamps the acknowledgement', async () => {
  const now = Date.now();
  const log = memoryLog([
    { _id: 'a', stream: 'security', at: new Date(now - 30 * DAY) },
    { _id: 'b', stream: 'security', at: new Date(now - 1000) },
    { _id: 'c', stream: 'speed', at: new Date(now - 1000) },
    { _id: 'd', stream: 'database', at: new Date(now - 1000) },
  ]);
  const removed = await loadClear(log)(['security', 'speed']);
  assert.strictEqual(removed, 3);
  assert.deepStrictEqual(log.docs.map(d => d._id), ['d'], 'an unchecked stream keeps its events');
  assert.ok(log.acks.security instanceof Date && log.acks.speed instanceof Date);
  assert.strictEqual(log.acks.database, undefined);
  // A single stream as a string, as acknowledgeEventLog takes it.
  assert.strictEqual(await loadClear(log)('database'), 1);
});

test('negative: an event after the click is kept, and shows as a new problem again', async () => {
  const later = new Date(Date.now() + 60 * 1000);
  const log = memoryLog([{ _id: 'later', stream: 'security', at: later }]);
  assert.strictEqual(await loadClear(log)(['security']), 0);
  assert.deepStrictEqual(log.docs.map(d => d._id), ['later']);
  assert.ok(log.acks.security < later, 'newer than the acknowledgement, so it counts as new');
});

test('negative: a non-admin, or an unknown stream anywhere in the list, clears nothing', async () => {
  const rows = [{ _id: 'a', stream: 'security', at: new Date(Date.now() - 1000) }];
  const denied = memoryLog(rows);
  await assert.rejects(loadClear(denied, false)(['security']), e => e.error === 'not-authorized');
  assert.strictEqual(denied.docs.length, 1);
  const unknown = memoryLog(rows);
  await assert.rejects(loadClear(unknown)(['security', 'users']), e => e.error === 'invalid-stream');
  assert.strictEqual(unknown.docs.length, 1, 'the valid stream before it was not cleared either');
  assert.deepStrictEqual(unknown.acks, {});
});

test('the retention sweep deletes events older than the window, and only those', async () => {
  const now = Date.now();
  const rows = [
    { _id: 'stale', stream: 'security', at: new Date(now - 91 * DAY) },
    // A recurring problem's folded row: its first time is old, its `at` recent.
    { _id: 'recurring', stream: 'security', firstAt: new Date(now - 400 * DAY), at: new Date(now - DAY) },
    { _id: 'recent', stream: 'speed', at: new Date(now - 10 * DAY) },
  ];
  const log = memoryLog(rows);
  const r = loadRetention(log, {});
  assert.strictEqual(r.EVENTLOG_RETENTION_DAYS, 90, 'the default');
  await r.runEventLogRetention();
  assert.deepStrictEqual(log.docs.map(d => d._id), ['recurring', 'recent']);
  const short = memoryLog(rows);
  await loadRetention(short, { EVENTLOG_RETENTION_DAYS: '5' }).runEventLogRetention();
  assert.deepStrictEqual(short.docs.map(d => d._id), ['recurring']);
});

test('negative: EVENTLOG_RETENTION_DAYS=0 keeps events forever, and a bad value is the default', async () => {
  const old = [{ _id: 'ancient', stream: 'security', at: new Date(Date.now() - 3650 * DAY) }];
  const kept = memoryLog(old);
  const zero = loadRetention(kept, { EVENTLOG_RETENTION_DAYS: '0' });
  assert.strictEqual(zero.EVENTLOG_RETENTION_DAYS, 0);
  await zero.runEventLogRetention();
  assert.strictEqual(kept.docs.length, 1);
  for (const bad of ['-3', 'forever', '']) {
    assert.strictEqual(loadRetention(memoryLog([]), { EVENTLOG_RETENTION_DAYS: bad }).EVENTLOG_RETENTION_DAYS, 90, bad);
  }
  assert.match(model, /function startEventLogRetention\(\) \{\n\s*if \(eventLogRetentionTimerId \|\| EVENTLOG_RETENTION_DAYS <= 0\) return;/,
    'with 0 no timer is started at all');
});

test('the sweep is claimed once per installation per day, and started at startup', () => {
  const start = bodyOf(model, '  function startEventLogRetention() {', '\n  }\n');
  assert.match(start, /if \(!\(await claimDailyJob\(EventLog\.rawDatabase\(\), 'eventlog-retention'\)\)\) return;\n\s*await runEventLogRetention\(\);/);
  assert.match(start, /Meteor\.setInterval\(/, 'kept daily without a restart');
  assert.match(start, /\.catch\(error => console\.error\('Event log retention failed:', error\)\)/, 'a failure never crashes the server');
  assert.match(model, /await ensureIndex\(EventLogAcks, \{ stream: 1 \}\);\n\s*startEventLogRetention\(\);/);
  const { claimDailyJob } = require('../models/lib/dailyClaim');
  assert.strictEqual(typeof claimDailyJob, 'function');
});

test('the summary has a Clear button beside Acknowledge, wired to clearEventLog', () => {
  const jade = read('client/components/settings/problemsSummary.jade');
  assert.match(jade, /button\.js-ack-checked\.primary \{\{_ 'acknowledge'\}\}\n\s*button\.js-clear-checked \{\{_ 'clear-problems'\}\}/);
  const js = read('client/components/settings/problemsSummary.js');
  assert.match(js, /'click \.js-clear-checked'\(event, templateInstance\) \{[\s\S]*?Meteor\.call\('clearEventLog', streams, \(\) => templateInstance\.reload\(\)\);/);
});

test('clear-problems is in every language, after acknowledge, and pending for Transifex', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['clear-problems'], 'Clear');
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.i18n.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const keys = Object.keys(d);
    assert.ok(d['clear-problems'], `${f} has it`);
    if ('acknowledge' in d) assert.strictEqual(keys.indexOf('clear-problems'), keys.indexOf('acknowledge') + 1, `${f}: after acknowledge`);
  }
  assert.strictEqual(JSON.parse(read('imports/i18n/data/fi.i18n.json'))['clear-problems'], 'Tyhjennä', 'translated, not English');
  const pending = JSON.parse(read('releases/translations/pending-transifex.json')).keys.map(k => k.key);
  assert.ok(pending.includes('clear-problems'));
});
