'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/brokenCardsReport.js');
const publication = read('server/publications/cards.js');
const pages = read('server/lib/legacyHtml4Pages.js');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) {
    failed += 1;
    process.stderr.write(`FAIL ${name}: ${error.message}\n`);
  }
}

check('both reports share one bounded admin-only broken-card service', () => {
  assert.match(service, /export const BROKEN_CARDS_SELECTOR/);
  for (const field of ['boardId', 'swimlaneId', 'listId', 'type']) {
    assert.ok(service.includes(field), field);
  }
  assert.match(service,
    /export async function brokenCardsReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service,
    /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(publication, /brokenCardsReportForAdmin\(this\.userId,/);
  assert.match(pages, /brokenCardsReportForAdmin\(userId,/);
});

check('page projection and three context lookups stay bounded', () => {
  for (const field of ['title', 'type', 'boardId', 'listId', 'swimlaneId',
    'createdAt']) assert.match(service, new RegExp(`${field}: 1`));
  assert.match(service, /sort: \{ boardId: 1, createdAt: -1 \}/);
  for (const reader of ['getBoards', 'getLists', 'getSwimlanes']) {
    assert.match(service, new RegExp(`ReactiveCache\\.${reader}\\(`));
  }
  assert.match(service, /Promise\.all\(\[/);
});

check('HTML4 keeps all seven columns and explicitly names missing context', () => {
  assert.match(pages, /path !== '\/admin\/problems\/broken-cards'/);
  for (const label of ['Card Title', 'Id', 'Board', 'Swimlane', 'List', 'Type']) {
    assert.ok(pages.includes(`'${label}'`), label);
  }
  assert.match(pages, /tr\(translate, 'createdAt', 'Created at'\)/);
  assert.match(pages, /tr\(translate, 'no-name', '\(Unknown\)'\)/);
  assert.match(pages, /fields: \{ q: search, page: page [+-] 1 \}/);
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
