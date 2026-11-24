'use strict';

// WP-7 (docs/Compliance/README.md): the retention settings that had no limit an
// operator could set - the administrators' audit log, board activity rows,
// workload absences - and the switch that records no sick leave at all.
// Run: node --test tests/retentionSettings.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const R = require('../models/lib/retentionSettings');

const NOW = Date.UTC(2026, 10, 24);

test('each setting: its default, a whole number of days, and nonsense keeps the default', () => {
  assert.equal(R.retentionDays('ADMIN_AUDIT_RETENTION_DAYS', {}), 365, 'a year, as before');
  assert.equal(R.retentionDays('ADMIN_AUDIT_RETENTION_DAYS', { ADMIN_AUDIT_RETENTION_DAYS: '2190' }), 2190, 'HIPAA: six years');
  assert.equal(R.retentionDays('ACTIVITIES_RETENTION_DAYS', {}), 0, 'off unless set');
  assert.equal(R.retentionDays('WORKLOAD_ABSENCE_RETENTION_DAYS', {}), 0, 'off unless set');
  for (const bad of ['-1', '1.5', 'abc', '36501']) {
    assert.equal(R.retentionDays('ADMIN_AUDIT_RETENTION_DAYS', { ADMIN_AUDIT_RETENTION_DAYS: bad }), 365, bad);
  }
  assert.throws(() => R.retentionDays('NOT_A_SETTING', {}), /unknown retention setting/);
});

test('the cutoff: that many days before now, and none at all for 0', () => {
  assert.deepEqual(R.cutoffDate(30, NOW), new Date(Date.UTC(2026, 9, 25)));
  assert.equal(R.cutoffDate(0, NOW), null, '0 keeps everything');
  assert.equal(R.cutoffDay(30, NOW), '2026-10-25');
  assert.equal(R.cutoffDay(0, NOW), null);
});

test('no sick leave is recorded when WORKLOAD_ABSENCE_TYPE_RECORDED is false; recorded otherwise', () => {
  assert.equal(R.storedAbsenceType('sick', {}), 'sick');
  assert.equal(R.storedAbsenceType('sick', { WORKLOAD_ABSENCE_TYPE_RECORDED: 'false' }), 'other');
  assert.equal(R.storedAbsenceType('vacation', { WORKLOAD_ABSENCE_TYPE_RECORDED: 'FALSE' }), 'other');
  assert.equal(R.storedAbsenceType('sick', { WORKLOAD_ABSENCE_TYPE_RECORDED: 'true' }), 'sick');
});

test('the sweeps and the absence write use the settings', () => {
  assert.match(read('server/adminAudit.js'), /const cutoff = cutoffDate\(retentionDays\('ADMIN_AUDIT_RETENTION_DAYS'/);
  assert.match(read('server/adminAudit.js'), /if \(!cutoff\) return;/, '0 keeps the log');
  const activities = read('server/lib/activitiesRetention.js');
  assert.match(activities, /raw\.find\(\{ createdAt: \{ \$lt: cutoff \} \}/);
  assert.match(activities, /if \(retentionDays\('ACTIVITIES_RETENTION_DAYS'[^)]*\) <= 0\) return;/, 'nothing runs while it is off');
  const absences = read('server/lib/workloadAbsenceRetention.js');
  assert.match(absences, /deleteMany\(\{ end: \{ \$lt: day \} \}\)/, 'only absences that ended before the cutoff');
  assert.match(read('server/workload.js'), /type: storedAbsenceType\(value\.type, \{ WORKLOAD_ABSENCE_TYPE_RECORDED: process\.env\.WORKLOAD_ABSENCE_TYPE_RECORDED \}\)/);
  const imports = read('server/imports.js');
  assert.match(imports, /import '\/server\/lib\/activitiesRetention';/);
  assert.match(imports, /import '\/server\/lib\/workloadAbsenceRetention';/);
});

test('negative: the activities retention never touches the change history', () => {
  const src = read('server/lib/activitiesRetention.js').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(src, /changeHistory|ChangeHistory/);
});

// Every retention setting the personal-data inventory names is really read by
// WeKan - an inventory that promises a limit nobody enforces is the gap this
// closes.
test('every retention setting named in the inventory is read somewhere', () => {
  const { INVENTORY } = require('../models/lib/personalDataInventory');
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.meteor', 'tests'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel); else if (rel.endsWith('.js')) files.push(read(rel));
    }
  };
  for (const dir of ['server', 'models']) walk(dir);
  const source = files.join('\n');
  const unread = INVENTORY.map(e => e.retention && e.retention.env).filter(Boolean)
    .flatMap(text => text.match(/\b[A-Z][A-Z0-9_]{3,}\b/g) || [])
    .filter(name => !new RegExp(`process\\.env\\.${name}\\b|['"]${name}['"]`).test(source));
  assert.deepEqual([...new Set(unread)], []);
  for (const name of Object.keys(R.KNOBS)) {
    assert.ok(INVENTORY.some(e => e.retention && e.retention.env === name), `${name} is in the inventory`);
  }
});
