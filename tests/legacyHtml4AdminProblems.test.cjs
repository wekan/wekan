'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

let failed = 0;
let run = 0;
function check(name, fn) {
  run += 1;
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stderr.write(`FAIL ${name}: ${error.message}\n`);
  }
}
const read = (file) => fs.readFileSync(file, 'utf8');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const eventLog = read('models/eventLog.js');
const repair = read('server/methods/repairBrokenCards.js');
const restore = read('server/methods/restoreListSwimlanes.js');
const renderer = read('imports/lib/legacyHtml4.js');

check(
  'summary controller is exact-route and admin gated before data reads',
  () => {
    const start = pages.indexOf('async function adminProblemsSummaryPage');
    const end = pages.indexOf('\nexport async function legacyHtml4Page', start);
    const body = pages.slice(start, end);
    assert.match(body, /path !== '\/admin\/problems\/summary'/);
    assert.ok(
      body.indexOf('fields: { isAdmin: 1 }') <
        body.indexOf('getProblemsOverview()'),
    );
    assert.match(body, /if \(!user\?\.isAdmin\)/);
    assert.match(body, /EventLog\.problemAreasForAdmin\(userId\)/);
  },
);

check(
  'DDP and HTML4 share acknowledgement and repair authorization boundaries',
  () => {
    assert.match(
      eventLog,
      /EventLog\.acknowledgeForAdmin = async \(userId, streams\)/,
    );
    assert.match(
      eventLog,
      /return EventLog\.acknowledgeForAdmin\(this\.userId, streams\)/,
    );
    assert.match(
      route,
      /EventLog\.acknowledgeForAdmin\(session\.userId, streams\)/,
    );
    assert.match(
      repair,
      /export async function repairBrokenCardsForAdmin\(userId\)/,
    );
    assert.match(repair, /return repairBrokenCardsForAdmin\(this\.userId\)/);
    assert.match(
      restore,
      /export async function restoreListSwimlanesForAdmin\(userId\)/,
    );
    assert.match(route, /restoreListSwimlanesForAdmin\(session\.userId\)/);
  },
);

check(
  'summary operations are allowlisted and rejected attempts are security reported',
  () => {
    assert.match(
      route,
      /\['acknowledge-problems', 'repair-broken-cards', 'restore-list-swimlanes'\]/,
    );
    assert.match(route, /authz\.legacy-html4-admin-problems/);
    assert.match(eventLog, /EVENT_STREAMS\.includes\(stream\)/);
    assert.match(
      pages,
      /problem\.id === 'broken-cards'[\s\S]*legacyOperation: 'repair-broken-cards'/,
    );
    assert.match(
      pages,
      /problem\.id === 'unbound-lists'[\s\S]*legacyOperation: 'restore-list-swimlanes'/,
    );
  },
);

check('shared HTML4 fieldsets render semantic repeatable checkboxes', () => {
  assert.match(renderer, /input\.type === 'checkbox'/);
  assert.match(renderer, /type="checkbox" value=/);
  assert.match(pages, /name: 'problemStreams'/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
