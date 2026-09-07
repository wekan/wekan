'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/methods/loginOffices.js');
const pages = read('server/lib/legacyHtml4Pages.js');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL ${name}: ${error.message}\n`); }
}

check('DDP and HTML4 share one bounded Global Admin Offices service', () => {
  assert.match(service, /export async function loginOfficesForAdmin\(userId, options\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Math\.min\(Math\.max\(opts\.limit \|\| 25, 1\), 200\)/);
  assert.match(service, /Math\.min\(Math\.max\(opts\.skip \|\| 0, 0\), 1000000\)/);
  assert.match(service, /return loginOfficesForAdmin\(this\.userId, options\)/);
  assert.match(pages, /loginOfficesForAdmin\(userId,/);
});

check('HTML4 Offices preserves person grouping and all modern columns', () => {
  assert.match(pages, /path !== '\/admin\/problems\/office'/);
  assert.match(pages, /officeRowsByPerson\(result\.people \|\| \[\]\)/);
  for (const key of [
    'office-people', 'event-ipv4', 'event-ipv6', 'office-location',
    'office-logins', 'office-first-seen', 'office-last-seen',
  ]) assert.ok(pages.includes(`'${key}'`), key);
  assert.match(pages, /officeLabel\(item\.location\)/);
});

check('HTML4 Offices exposes search, bounded paging and no non-admin data', () => {
  assert.match(pages, /if \(!user\?\.isAdmin\)/);
  assert.match(pages, /uiSearchForm\(\{/);
  assert.match(pages, /page > 1 \? uiAction/);
  assert.match(pages, /page < totalPages \? uiAction/);
  assert.match(pages, /office-no-results/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
