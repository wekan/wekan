'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/recoveryReport.js');
const publication = read('server/publications/recoveryReport.js');
const pages = read('server/lib/legacyHtml4Pages.js');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL ${name}: ${error.message}\n`); }
}

check('HTML5 and HTML4 share one bounded site-admin Recovery service', () => {
  assert.match(service, /export async function recoveryReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.skip \|\| 0, 0\), 1000000\)/);
  assert.match(publication, /recoveryReportForAdmin\(this\.userId,/);
  assert.match(publication, /recoveryReportCountForAdmin\(this\.userId,/);
  assert.match(pages, /recoveryReportForAdmin\(userId,/);
  assert.match(pages, /recoveryReportCountForAdmin\(userId,/);
});

check('HTML4 Recovery retains every modern column and textual outcome', () => {
  assert.match(pages, /path !== '\/admin\/problems\/recovery'/);
  for (const key of [
    'done', 'date', 'recovery-event', 'username', 'event-ipv4',
    'event-ipv6', 'location', 'recovery-detail',
  ]) assert.ok(pages.includes(`'${key}'`), key);
  assert.match(pages, /\[null, 'User ID'\]/);
  assert.match(pages, /item\.done === false/);
  assert.match(pages, /item\.deletedData === true/);
  assert.match(pages, /countryFlag\(item\.location\?\.country\)/);
});

check('HTML4 Recovery filters, searches and pages without exposing non-admin data', () => {
  for (const status of ['all', 'done', 'failed', 'deleted']) {
    assert.ok(pages.includes(`value: '${status}'`), status);
  }
  assert.match(pages, /uiSearchForm\(\{ action: path/);
  assert.match(pages, /uiSelectForm\(\{ action: path/);
  assert.match(pages, /page > 1 \? uiAction/);
  assert.match(pages, /page < totalPages \? uiAction/);
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
