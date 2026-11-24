'use strict';

// WP-10 (docs/Compliance/README.md): CSV exports for access reviews and
// incidents - People, Boards, Boards and roles, Security, Audit log - for a
// site administrator only, and one's own login history in Member Settings /
// Privacy and my data.
// Run: node --test tests/adminCsvExport.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const C = require('../models/lib/adminCsvExport');

test('RFC 4180: commas, quotes and line breaks are quoted; a date is ISO', () => {
  assert.equal(C.csvCell('plain'), 'plain');
  assert.equal(C.csvCell('a,b'), '"a,b"');
  assert.equal(C.csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(C.csvCell('two\nlines'), '"two\nlines"');
  assert.equal(C.csvCell(null), '');
  assert.equal(C.csvCell(new Date(Date.UTC(2026, 10, 24))), '2026-11-24T00:00:00.000Z');
  assert.equal(C.csvLine(['a', 1, 'b,c']), 'a,1,"b,c"\r\n');
});

test('negative: a cell a spreadsheet would run as a formula is shown as text', () => {
  for (const bad of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tx', '\rx']) {
    assert.ok(C.csvCell(bad).replace(/^"/, '').startsWith("'"), JSON.stringify(bad));
  }
  assert.equal(C.csvCell('=a,b'), `"'=a,b"`);
});

test('the columns of each dataset, in order', () => {
  const header = name => C.headerLine(C.dataset(name)).trim().split(',');
  assert.deepEqual(header('people'), ['id', 'username', 'full name', 'email', 'site admin', 'login disabled', 'authentication', 'created', 'last connection']);
  assert.deepEqual(header('board-roles'), ['board id', 'board', 'board archived', 'user id', 'username', 'role']);
  assert.deepEqual(header('audit'), ['when', 'administrator id', 'administrator', 'action', 'details', 'succeeded', 'error', 'IP']);
  assert.ok(header('security').includes('vulnerability') && header('security').includes('count'));
  assert.equal(C.rowLine(C.dataset('people'), {
    _id: 'u1', username: 'ann', profile: { fullname: 'Ann A' }, emails: [{ address: 'ann@example.com' }], isAdmin: true,
  }), 'u1,ann,Ann A,ann@example.com,yes,no,password,,\r\n');
  assert.equal(C.dataset('nope'), null);
  assert.equal(C.dataset('__proto__'), null, 'no dataset from the prototype');
});

test('board-roles: one row per ACTIVE member, with the role and the username', () => {
  const board = { _id: 'b1', title: 'Plan', members: [
    { userId: 'u1', isActive: true, isAdmin: true }, { userId: 'u2', isActive: true, isCommentOnly: true },
    { userId: 'u3', isActive: false, isAdmin: true },
  ] };
  const roleOf = m => (m.isAdmin ? 'board-admin' : m.isCommentOnly ? 'comment-only' : 'normal');
  const rows = C.memberRows(board, new Map([['u1', 'ann'], ['u2', 'bob']]), roleOf);
  assert.deepEqual(rows.map(r => [r.username, r.role]), [['ann', 'board-admin'], ['bob', 'comment-only']]);
});

// No secret can reach a file: each dataset reads only the fields it names, and
// none of them is a secret.
test('negative: no dataset reads or writes a password, token, two-factor secret or key', () => {
  for (const [name, spec] of Object.entries(C.DATASETS)) {
    for (const field of Object.keys(spec.fields)) {
      assert.doesNotMatch(field, /services|password|token|secret|hash|key|passkey|sqrl|2fa|twoFactor/i, `${name}: ${field}`);
    }
    for (const [header] of spec.columns) {
      assert.doesNotMatch(header, /password|token|secret|hash|api key/i, `${name}: ${header}`);
    }
  }
});

test('the route: a site administrator only, every download audited, the rows streamed', () => {
  const route = read('server/routes/adminCsvExport.js');
  assert.match(route, /WebApp\.handlers\.get\('\/api\/admin\/export\/:file'/);
  assert.match(route, /if \(!user \|\| !isSiteAdmin\(user\)\) \{/);
  assert.match(route, /recordAdminRouteAction\(user, 'exportAdminCsv', \[match\[1\]\], ip, new Error\('not-authorized'\)\)/, 'a refused one too');
  assert.match(route, /await recordAdminRouteAction\(user, 'exportAdminCsv', \[match\[1\]\], ip\);/);
  assert.match(route, /\{ projection: spec\.fields, sort: spec\.sort \}/, 'only the named fields leave the database');
  assert.match(route, /\.limit\(MAX_ROWS\)/);
  assert.match(route, /for await \(const doc of cursor\)/);
  assert.ok(route.indexOf('isSiteAdmin(user)') < route.indexOf("res.setHeader('Content-Type', 'text/csv"), 'checked before anything is sent');
  assert.match(read('server/imports.js'), /import '\/server\/routes\/adminCsvExport';/);
});

test('the pages offer the downloads, and the person sees their own login history', () => {
  assert.match(read('client/components/settings/tablePage.jade'), /each csvLinks\s+a\.js-table-page-csv/);
  assert.match(read('client/components/settings/peopleBody.js'), /name: 'people', labelKey: 'export-csv'/);
  const problems = read('client/components/settings/adminProblems.js');
  assert.match(problems, /name: 'boards', labelKey: 'export-csv'/);
  assert.match(problems, /t\.stream === 'security' \? adminCsvLinks\(\[\{ name: 'security'/);
  assert.match(read('client/components/settings/adminAuditLog.js'), /const name = Template\.instance\(\)\.tab\.get\(\) === 'access' \? 'data-access' : 'audit';/);
  const offices = read('server/methods/loginOffices.js');
  const mine = offices.slice(offices.indexOf('async getMyLoginHistory()'));
  assert.match(mine, /Meteor\.users\.findOneAsync\(this\.userId,/, 'only one\'s own account');
  assert.match(offices, /async getMyLoginHistory\(\) \{/, 'it takes no user id: nobody asks for somebody else\'s');
  assert.match(read('client/components/users/userHeader.jade'), /each myLoginHistory/);
});
