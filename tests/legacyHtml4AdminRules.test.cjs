'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const service = read('server/lib/rulesReport.js');
const publication = read('server/publications/rules.js');
const pages = read('server/lib/legacyHtml4Pages.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('legacyHtml4AdminRules:');

test('Meteor and HTML4 share one bounded Global Admin report service', () => {
  assert.match(service,
    /export async function rulesReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /fields: \{ isAdmin: 1 \}/);
  assert.match(service, /if \(!user\?\.isAdmin\) throw new Meteor\.Error/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(publication, /rulesReportForAdmin\(this\.userId,/);
  assert.match(pages, /rulesReportForAdmin\(userId,/);
});

test('the page projects rule identity and performs three deduplicated context lookups', () => {
  assert.match(service,
    /fields: \{ title: 1, boardId: 1, actionId: 1, triggerId: 1 \}/);
  assert.match(service, /new Set\(rules\.map\(rule => rule\[field\]\)\.filter\(Boolean\)\)/);
  assert.match(service, /Promise\.all\(\[/);
  assert.match(service, /ReactiveCache\.getActions/);
  assert.match(service, /ReactiveCache\.getTriggers/);
  assert.match(service, /ReactiveCache\.getBoards/);
});

test('HTML4 renders the same four report columns with explicit id fallbacks', () => {
  const at = pages.indexOf('async function adminProblemsRulesPage');
  const body = pages.slice(at, at + 5000);
  for (const column of ['Rule Title', 'Board Title', 'actionType', 'activityType']) {
    assert.ok(body.includes(`'${column}'`), `${column} must remain visible`);
  }
  assert.match(body, /boards\.get\(rule\.boardId\) \|\| rule\.boardId \|\| unknown/);
  assert.match(body, /actions\.get\(rule\.actionId\) \|\| rule\.actionId \|\| unknown/);
  assert.match(body, /triggers\.get\(rule\.triggerId\) \|\| rule\.triggerId \|\| unknown/);
});

test('HTML4 search and paging are signed and an anonymous reader gets no data', () => {
  const at = pages.indexOf('async function adminProblemsRulesPage');
  const body = pages.slice(at, at + 5000);
  assert.match(body, /uiSearchForm\(\{/);
  assert.match(body, /fields: \{ q: search, page: page - 1 \}/);
  assert.match(body, /fields: \{ q: search, page: page \+ 1 \}/);
  assert.match(body, /error\?\.error !== 'not-authorized'/);
  assert.match(body, /error-notAuthorized/);
});

console.log(`\n${passed} tests passed`);
