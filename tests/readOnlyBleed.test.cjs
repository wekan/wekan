'use strict';

// Guard: ReadOnlyBleed (CVE-2026-52892, GHSA-6733-4wgq-8xvr). The six
// mutating Custom Field REST handlers called the read-level
// Authentication.checkBoardAccess instead of checkBoardWriteAccess, so a
// read-only board member could create, change and delete Custom Fields and
// their dropdown items over the REST API.
// Run: node tests/readOnlyBleed.test.cjs
//
// The test pins the six handlers, and the negative test requires every
// mutating REST route in the server to make a write-level decision - so the
// same mistake cannot sit in another file. A read-only member who still tries
// is recorded under ReadOnlyBleed in Admin Panel -> Problems.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function mutatingRoutes(file) {
  const src = read(file);
  const starts = [...src.matchAll(/(?:JsonRoutes\.add\(\s*'(POST|PUT|DELETE|PATCH)'|WebApp\.handlers\.(post|put|delete|patch)\()\s*,?\s*'([^']+)'/g)];
  return starts.map((m, k) => ({
    file, method: (m[1] || m[2]).toUpperCase(), route: m[3],
    body: src.slice(m.index, k + 1 < starts.length ? starts[k + 1].index : src.length),
  }));
}
// Board-admin routes and the comment routes' object-level rule are write-level too.
const WRITE_LEVEL = /checkBoardWriteAccess\(|checkBoardAdmin\(|checkUserId\(|checkAdminOrCondition\(|memberCan\(|allowIsBoardMember\w*\(|allowIsBoardAdmin\w*\(|assertCanMutateComment\(/;

test('the six Custom Field handlers check write access', () => {
  const routes = mutatingRoutes('server/models/customFields.js');
  assert.ok(routes.length >= 6, `found ${routes.length}`);
  for (const r of routes) assert.match(r.body, /Authentication\.checkBoardWriteAccess\(req\.userId, paramBoardId\)/, `${r.method} ${r.route}`);
});

test('a read-only member\'s refused write is recorded as ReadOnlyBleed', () => {
  assert.match(read('server/authentication.js'), /member && member\.isReadOnly \? 'board\.readonly-write'/);
  assert.match(read('models/lib/securityCategories.js'), /'authz\.readonly':\s*\{[^}]*bleed: 'ReadOnlyBleed'/);
});

test('negative: no mutating REST route anywhere decides with the read-level check alone', () => {
  const dirs = ['server/models', 'server/routes'];
  const files = dirs.flatMap(dir => fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`));
  const routes = files.flatMap(mutatingRoutes);
  assert.ok(routes.length > 50, `found ${routes.length} mutating routes`);
  const offenders = routes.filter(r => /checkBoardAccess\(/.test(r.body) && !WRITE_LEVEL.test(r.body))
    .map(r => `${r.file} ${r.method} ${r.route}`);
  assert.deepEqual(offenders, []);
});
