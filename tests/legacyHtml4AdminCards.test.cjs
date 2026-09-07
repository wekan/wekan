'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/cardsReport.js');
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

check('HTML5 and HTML4 share one bounded instance-wide Cards service', () => {
  assert.match(service,
    /export async function cardsReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service,
    /Math\.min\(Math\.max\(options\.limit \|\| 10, 1\), 200\)/);
  assert.match(publication, /cardsReportForAdmin\(this\.userId,/);
  assert.match(publication, /cardsReportCountForAdmin\(this\.userId,/);
  assert.match(pages, /cardsReportForAdmin\(userId,/);
  assert.match(pages, /cardsReportCountForAdmin\(userId,/);
});

check('Cards page queries only six fields and bounded page relationships', () => {
  for (const field of ['title', 'boardId', 'listId', 'swimlaneId',
    'members', 'assignees']) assert.match(service, new RegExp(`${field}: 1`));
  assert.match(service, /sort: \{ boardId: 1, createdAt: -1 \}/);
  for (const reader of ['getBoards', 'getLists', 'getSwimlanes', 'getUsers']) {
    assert.match(service, new RegExp(`ReactiveCache\\.${reader}\\(`));
  }
  assert.match(service, /Promise\.all\(\[/);
});

check('HTML4 Cards retains all six columns, names and signed paging', () => {
  assert.match(pages, /path !== '\/admin\/problems\/cards'/);
  for (const label of ['Card Title', 'Board', 'Swimlane', 'List', 'Members',
    'Assignees']) assert.ok(pages.includes(`'${label}'`), label);
  assert.match(pages, /boards\.get\(card\.boardId\) \|\| card\.boardId/);
  assert.match(pages, /users\.get\(id\) \|\| id/);
  assert.match(pages, /fields: \{ q: search, page: page [+-] 1 \}/);
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
