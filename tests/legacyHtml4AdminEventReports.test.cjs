'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const eventLog = read('models/eventLog.js');
const pages = read('server/lib/legacyHtml4Pages.js');
let run = 0;
let failed = 0;
function check(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL ${name}: ${error.message}\n`); }
}

check('DDP and HTML4 reports share bounded admin-only EventLog readers', () => {
  assert.match(eventLog, /async function countForAdmin\(userId, stream, search = ''\)/);
  assert.match(eventLog, /async function pageForAdmin\(userId, stream, limit, skip, search = ''\)/);
  assert.match(eventLog, /REPORT_EVENT_STREAMS\.includes\(stream\)/);
  assert.match(eventLog, /slice\(0, 500\)/);
  assert.match(eventLog, /Math\.min\(200,/);
  assert.match(eventLog, /Math\.min\(1000000,/);
  assert.match(eventLog, /return EventLog\.pageForAdmin\(this\.userId/);
  assert.match(pages, /EventLog\.pageForAdmin\(/);
});

check('all shared event report panes use one exact route map', () => {
  for (const pair of [
    ["'security-report'", "'security'"], ['speed', "'speed'"],
    ['tests', "'tests'"], ['cpu', "'cpu'"],
    ['database', "'database'"], ['integrity', "'integrity'"],
    ['api', "'api'"],
  ]) assert.ok(pages.includes(`${pair[0]}: ${pair[1]}`), pair.join(' -> '));
  assert.match(pages, /if \(!user\?\.isAdmin\)/);
});

check('reports expose search, bounded paging and identity/location columns', () => {
  assert.match(pages, /uiSearchForm\(\{/);
  assert.match(pages, /page > 1 \? uiAction/);
  assert.match(pages, /page < totalPages \? uiAction/);
  for (const key of [
    'event-datetime', 'username', 'event-ipv4', 'event-ipv6', 'location',
    'event-attempts', 'event-detail',
  ]) assert.ok(pages.includes(`'${key}'`), key);
  assert.match(pages, /classifyAddress\(event\.ip\)/);
  assert.match(pages, /countryFlag\(event\.location\?\.country\)/);
  assert.match(pages, /locationLabel\(event\.location\)/);
});

check('CPU and API retain their specialized status and columns', () => {
  assert.match(pages, /stream === 'cpu'[\s\S]*getCurrentCpu\(\)/);
  assert.match(pages, /stream === 'api' \? apiColumns : normalColumns/);
  assert.match(eventLog, /selected === 'api' \? \{ count: -1, at: -1 \}/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
