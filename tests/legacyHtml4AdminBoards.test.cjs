'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/boardsReport.js');
const publication = read('server/publications/boards.js');
const pages = read('server/lib/legacyHtml4Pages.js');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL ${name}: ${error.message}\n`); }
}

check('HTML5 and HTML4 share one bounded instance-wide Boards service', () => {
  assert.match(service, /export async function boardsReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.skip \|\| 0, 0\), 1000000\)/);
  assert.match(publication, /boardsReportForAdmin\(this\.userId,/);
  assert.match(publication, /boardsReportCountForAdmin\(this\.userId,/);
  assert.match(pages, /boardsReportForAdmin\(userId,/);
  assert.match(pages, /boardsReportCountForAdmin\(userId,/);
});

check('HTML4 Boards retains all seven columns and resolves active relationships', () => {
  assert.match(pages, /path !== '\/admin\/problems\/boards'/);
  for (const label of ['Title', 'Id', 'Permission', 'Archived?', 'Members', 'Organizations', 'Teams']) {
    assert.ok(pages.includes(`'${label}'`), label);
  }
  assert.match(pages, /member\.isActive !== false/);
  assert.match(pages, /names\.get\(member\.userId\) \|\| member\.userId/);
  assert.match(pages, /orgNames\.get\(org\.orgId\) \|\| org\.orgId/);
  assert.match(pages, /teamNames\.get\(team\.teamId\) \|\| team\.teamId/);
});

check('HTML4 Boards has state-preserving All/Public/Private filter and admin isolation', () => {
  for (const value of ['all', 'public', 'private']) {
    assert.ok(pages.includes(`value: '${value}'`), value);
  }
  assert.match(pages, /uiSearchForm\(\{ action: path/);
  assert.match(pages, /name: 'permission'/);
  assert.match(pages, /fields: \{ q: search, permission, page:/);
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
