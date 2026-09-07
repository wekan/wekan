'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/impersonationReport.js');
const publication = read('server/publications/impersonationReport.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const css = read('public/legacy-html4.css');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL ${name}: ${error.message}\n`); }
}

check('HTML5 publication and HTML4 page share one bounded admin service', () => {
  assert.match(service, /export async function impersonationReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.skip \|\| 0, 0\), 1000000\)/);
  assert.match(publication, /impersonationReportForAdmin\(this\.userId,/);
  assert.match(publication, /impersonationReportCountForAdmin\(this\.userId,/);
  assert.match(pages, /impersonationReportForAdmin\(userId,/);
});

check('HTML4 Impersonation Report preserves modern columns and deleted-user fallback', () => {
  assert.match(pages, /path !== '\/admin\/problems\/impersonation'/);
  for (const key of ['date', 'impersonation-admin', 'impersonation-user', 'board', 'reason']) {
    assert.ok(pages.includes(`'${key}'`), key);
  }
  assert.match(pages, /names\.get\(item\.adminId\) \|\| item\.adminId/);
  assert.match(pages, /names\.get\(item\.userId\) \|\| item\.userId/);
});

check('HTML4 Impersonation Report is admin-only, searchable, paged and wrapping', () => {
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
  assert.match(pages, /uiSearchForm\(\{/);
  assert.match(pages, /page > 1 \? uiAction/);
  assert.match(pages, /page < totalPages \? uiAction/);
  assert.match(css, /table\.legacy-content th,[\s\S]*white-space: normal;[\s\S]*word-wrap: break-word;/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
