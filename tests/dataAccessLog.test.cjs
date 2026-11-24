'use strict';

// WP-11 (docs/Compliance/README.md): the data-access log - who downloaded
// what, one row per person, day, kind and target - and AUDIT_LOG_STDOUT=json,
// the audit trail, the security problems and the data access as JSON lines on
// stdout for a SIEM.
// Run: node --test tests/dataAccessLog.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const D = require('../models/lib/dataAccessLog');
const S = require('../models/lib/auditStdout');

test('every export route is recognised, with its target', () => {
  const c = (p, q) => D.classifyExport(p, q);
  assert.deepEqual(c('/api/boards/B1/export'), { kind: 'board-json', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/export/csv'), { kind: 'board-csv', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/exportExcel'), { kind: 'board-excel', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/exportPDF'), { kind: 'board-pdf', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/exportZip'), { kind: 'board-zip', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/charts/burndown/exportPDF'), { kind: 'chart-pdf', target: 'B1' });
  assert.deepEqual(c('/api/boards/B1/lists/L1/cards/C1/exportPDF'), { kind: 'card-pdf', target: 'C1' });
  assert.deepEqual(c('/api/export-all-boards/json'), { kind: 'all-boards', target: 'json' });
  assert.deepEqual(c('/api/admin/export/people.csv'), { kind: 'admin-csv', target: 'people.csv' });
  assert.deepEqual(c('/api/user/export', {}), { kind: 'personal-data', target: 'self' });
  assert.deepEqual(c('/api/user/export', { userId: 'U2' }), { kind: 'personal-data', target: 'U2' });
  assert.equal(c('/api/boards/B1'), null);
  assert.equal(c('/b/B1/title'), null);
});

// Every export route that exists is in ROUTES: a new one cannot go uncounted.
test('negative: no export route of the code is missing from the data-access log', () => {
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', 'tests'].includes(e.name) || e.name.startsWith('.') || e.name.startsWith('_build')) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel); else if (rel.endsWith('.js')) files.push(read(rel));
    }
  };
  for (const dir of ['server', 'models']) walk(dir);
  const routes = [...new Set(files.join('\n').match(/WebApp\.handlers\.(?:get|use)\('([^']*export[^']*)'/g) || [])]
    .map(m => m.match(/'([^']*)'/)[1]);
  assert.ok(routes.length >= 10, `found ${routes.length}`);
  for (const route of routes) {
    const sample = route.replace(/:file/, 'people.csv').replace(/:[A-Za-z]+/g, 'X');
    assert.ok(D.classifyExport(sample, {}), `${route} is not counted`);
  }
});

test('the fold: one row per person, day, kind and target; the same download adds to it', () => {
  const at = new Date(Date.UTC(2026, 10, 24, 9));
  const one = D.foldUpdate({ userId: 'U1', username: 'ann', ip: '10.0.0.1', kind: 'board-json', target: 'B1', at });
  const two = D.foldUpdate({ userId: 'U1', username: 'ann', ip: '10.0.0.2', kind: 'board-json', target: 'B1', at: new Date(at.getTime() + 3600e3) });
  assert.equal(one.selector._id, '2026-11-24:U1:board-json:B1');
  assert.equal(one.selector._id, two.selector._id, 'the same row');
  assert.deepEqual(one.modifier.$inc, { count: 1 });
  assert.equal(one.modifier.$setOnInsert.firstAt, at, 'the first time stays the first');
  assert.equal(two.modifier.$set.ip, '10.0.0.2', 'the last address is the latest');
  const nextDay = D.foldUpdate({ userId: 'U1', kind: 'board-json', target: 'B1', at: new Date(at.getTime() + 86400e3) });
  assert.notEqual(nextDay.selector._id, one.selector._id, 'a new day, a new row');
  assert.match(D.foldUpdate({ kind: 'board-json', target: 'B1', at }).selector._id, /:-:board-json:/, 'a public board, nobody signed in');
  const keys = [...Object.keys(one.modifier.$set), ...Object.keys(one.modifier.$setOnInsert)];
  assert.equal(new Set(keys).size, keys.length, 'no field in both $set and $setOnInsert');
});

test('the log: counted in front of every route, after a 200 only; admins read it; kept as the audit log', () => {
  const lib = read('server/lib/dataAccessLog.js');
  assert.match(lib, /WebApp\.rawHandlers\.use\(/);
  assert.match(lib, /if \(res\.statusCode === 200\) void recordDataAccess\(req, hit\.kind, hit\.target\);/);
  assert.match(lib, /updateOne\(selector, modifier, \{ upsert: true \}\)/);
  const page = lib.slice(lib.indexOf('async adminDataAccessPage('));
  assert.match(page, /user\.isAdmin !== true \|\| user\.loginDisabled === true\) throw new Meteor\.Error\('error-notAuthorized'\)/);
  assert.match(lib, /retentionDays\('ADMIN_AUDIT_RETENTION_DAYS'/);
  assert.match(read('server/imports.js'), /import '\/server\/lib\/dataAccessLog';/);
  const { buildUserErasure } = require('../models/lib/userErasure');
  const rule = buildUserErasure({ _id: 'u', username: 'n' }).find(r => r.collection === 'dataAccessLog');
  assert.deepEqual(rule && rule.fields, ['username', 'ip'], 'erasure takes the name and address');
  assert.match(read('client/components/settings/adminAuditLog.js'), /'adminDataAccessPage'/);
  assert.ok(require('../models/lib/adminCsvExport').dataset('data-access'));
});

test('AUDIT_LOG_STDOUT=json: one JSON line per record, only the listed fields', () => {
  assert.equal(S.stdoutEnabled({}), false);
  assert.equal(S.stdoutEnabled({ AUDIT_LOG_STDOUT: 'JSON' }), true);
  assert.equal(S.stdoutEnabled({ AUDIT_LOG_STDOUT: 'true' }), false);
  const lines = [];
  const at = new Date(Date.UTC(2026, 10, 24));
  assert.equal(S.writeStdout('audit', { at, actorUsername: 'root', method: 'setPassword', args: '["[redacted]","u1"]', ok: true, ip: '::1',
    services: { password: 'x' }, rawArgs: ['hunter2'] }, { AUDIT_LOG_STDOUT: 'json' }, l => lines.push(l)), true);
  const parsed = JSON.parse(lines[0]);
  assert.deepEqual(parsed, { wekan: 'audit', at: '2026-11-24T00:00:00.000Z', actorUsername: 'root', method: 'setPassword', args: '["[redacted]","u1"]', ok: true, ip: '::1' });
  // Negative: nothing of the document but the listed fields - no secret,
  // however it got onto the document.
  assert.doesNotMatch(lines[0], /hunter2|services|password"/);
  assert.equal(S.writeStdout('audit', { at }, {}, l => lines.push(l)), false, 'off unless asked');
  assert.equal(S.stdoutLine('unknown', { at }), null);
  assert.equal(S.writeStdout('audit', { at }, { AUDIT_LOG_STDOUT: 'json' }, () => { throw new Error('closed'); }), false, 'never throws');
});

test('every audit row, security problem and data access goes to stdout too', () => {
  // Written through the hash chain since P3 (models/lib/auditChain.js); the
  // stdout line carries the row's place and hash too.
  assert.match(read('server/adminAudit.js'), /appendAuditRow\(doc\);\s*\/\/[^\n]*\n\s*writeStdout\('audit', row && row\.hash \? \{ \.\.\.doc, seq: row\.seq, hash: row\.hash \} : doc\);/);
  assert.match(read('server/lib/adminRouteAudit.js'), /writeStdout\('audit', doc\)/);
  assert.match(read('server/lib/eventLogFold.js'), /if \(evt\.stream === 'security'\) require\('\/models\/lib\/auditStdout'\)\.writeStdout\('security'/);
  assert.match(read('server/lib/dataAccessLog.js'), /writeStdout\('data-access',/);
});
