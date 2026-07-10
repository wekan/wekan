'use strict';

// Plain-Node unit test (no Meteor) for the Admin Panel / Attachments / Backup
// scheduled-cron registration. Run: node tests/backupCron.test.cjs
//
// Regression: in Meteor 3 the synchronous `findOne`/`upsert` collection methods
// are NOT available on the server ("findOne is not available on the server.
// Please use findOneAsync() instead."). registerCron() and the schedule methods
// in server/methods/backup.js must use the *Async variants and be awaited, or
// the scheduled-backup cron silently never registers (it threw at startup).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { scheduleText } = require('../models/lib/backupPaths');

let passed = 0;
// Every test (sync or async) is registered and then awaited in order by main(),
// so the summary count is accurate and async tests finish before it prints.
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
const atest = test;

// A fake collection that behaves like a Meteor 3 SERVER collection: the
// synchronous methods throw, only the *Async variants work.
function makeServerCollection(doc) {
  return {
    findOne() {
      throw new Error('findOne is not available on the server. Please use findOneAsync() instead.');
    },
    upsert() {
      throw new Error('upsert is not available on the server. Please use upsertAsync() instead.');
    },
    async findOneAsync() {
      // resolve on a later tick to prove the caller actually awaits
      return await Promise.resolve(doc);
    },
    async upsertAsync(selector, d) {
      this._upserted = d;
      return await Promise.resolve({ numberAffected: 1 });
    },
  };
}

function makeCron() {
  return {
    added: null,
    removed: false,
    remove() { this.removed = true; },
    add(spec) { this.added = spec; },
  };
}

// Faithful async re-implementation of registerCron()'s gating logic (mirrors
// server/methods/backup.js). The source-level guard below pins the real file to
// this same shape.
async function registerCron(BackupSettings, SyncedCron) {
  const CRON_NAME = 'WeKan Scheduled Backup';
  try { SyncedCron.remove(CRON_NAME); } catch (_) {}
  const s = await BackupSettings.findOneAsync({ _id: 'schedule' });
  if (!s || !s.enabled || !s.frequency || s.frequency === 'off') return;
  SyncedCron.add({
    name: CRON_NAME,
    schedule(parser) { return parser.text(scheduleText(s)); },
    async job() {},
  });
}

// --- POSITIVE: an enabled schedule registers the cron -----------------------
atest('enabled daily schedule registers a cron via the async API', async () => {
  const BackupSettings = makeServerCollection({
    _id: 'schedule', enabled: true, frequency: 'daily', time: '04:00',
  });
  const cron = makeCron();
  await registerCron(BackupSettings, cron);
  assert.ok(cron.removed, 'existing cron should be removed first');
  assert.ok(cron.added, 'cron should be registered');
  assert.strictEqual(cron.added.name, 'WeKan Scheduled Backup');
  // schedule() must resolve through scheduleText for the stored doc
  const seen = [];
  cron.added.schedule({ text: (t) => { seen.push(t); return t; } });
  assert.strictEqual(seen[0], 'every day at 04:00');
});

atest('enabled weekly schedule uses the chosen day', async () => {
  const BackupSettings = makeServerCollection({
    _id: 'schedule', enabled: true, frequency: 'weekly', dayOfWeek: 'Monday', time: '01:00',
  });
  const cron = makeCron();
  await registerCron(BackupSettings, cron);
  assert.ok(cron.added);
  const seen = [];
  cron.added.schedule({ text: (t) => { seen.push(t); return t; } });
  assert.strictEqual(seen[0], 'on Monday at 01:00');
});

// --- NEGATIVE: no cron when disabled / off / missing ------------------------
atest('disabled schedule registers no cron', async () => {
  const cron = makeCron();
  await registerCron(makeServerCollection({ _id: 'schedule', enabled: false, frequency: 'daily' }), cron);
  assert.strictEqual(cron.added, null);
});
atest("frequency 'off' registers no cron", async () => {
  const cron = makeCron();
  await registerCron(makeServerCollection({ _id: 'schedule', enabled: true, frequency: 'off' }), cron);
  assert.strictEqual(cron.added, null);
});
atest('missing schedule doc registers no cron and does not throw', async () => {
  const cron = makeCron();
  await registerCron(makeServerCollection(null), cron);
  assert.strictEqual(cron.added, null);
});

// --- NEGATIVE: the sync API is the trap — using it must blow up --------------
atest('using synchronous findOne throws the Meteor-3 server error', async () => {
  const BackupSettings = makeServerCollection({ _id: 'schedule', enabled: true, frequency: 'daily' });
  assert.throws(() => BackupSettings.findOne({ _id: 'schedule' }), /not available on the server/);
  // and the async path, by contrast, works and registers the cron
  const cron = makeCron();
  await registerCron(BackupSettings, cron);
  assert.ok(cron.added, 'async path must succeed where sync path fails');
});

// --- REGRESSION GUARD: pin the real source to the async API -----------------
// Guards against anyone reintroducing the synchronous server-forbidden calls.
const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'methods', 'backup.js'), 'utf8');

test('backup.js never calls synchronous BackupSettings.findOne/upsert', () => {
  assert.ok(!/BackupSettings\.findOne\(/.test(src), 'BackupSettings.findOne( must not be used on the server');
  assert.ok(!/BackupSettings\.upsert\(/.test(src), 'BackupSettings.upsert( must not be used on the server');
});
test('backup.js uses the async BackupSettings API', () => {
  assert.ok(/BackupSettings\.findOneAsync\(/.test(src), 'expected BackupSettings.findOneAsync(');
  assert.ok(/BackupSettings\.upsertAsync\(/.test(src), 'expected BackupSettings.upsertAsync(');
});
test('registerCron is async and every caller awaits it', () => {
  assert.ok(/async function registerCron\(/.test(src), 'registerCron must be async');
  // startup + saveBackupSchedule must await it
  const awaited = src.match(/await registerCron\(\)/g) || [];
  assert.ok(awaited.length >= 2, `expected registerCron() to be awaited by both callers, saw ${awaited.length}`);
  assert.ok(!/[^.\w]registerCron\(\);/.test(src.replace(/await registerCron\(\)/g, '')),
    'no caller may invoke registerCron() without awaiting it');
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nbackupCron: ${passed} tests passed`);
})().catch((e) => { console.error(e); process.exit(1); });
