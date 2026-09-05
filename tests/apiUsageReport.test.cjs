'use strict';

// Admin Panel → Problems → API: who called which endpoint, how often.
// Run: node tests/apiUsageReport.test.cjs
//
// The naming and the accumulator are a pure module, so the two things that could
// make this report worthless are testable as arithmetic, with no server and no
// database:
//
//   1. NAMING BY PATH instead of by route pattern. `/api/boards/abc123` and ten
//      thousand of its siblings are one endpoint being used, not ten thousand
//      endpoints - and a row per board id is exactly the one-row-per-event cost
//      the whole Problems design exists to remove. Worse, an unauthenticated
//      404 sweep would let an attacker choose the names and fill the collection.
//
//   2. A WRITE PER REQUEST. Every other stream here records something rare; API
//      traffic is the traffic. Counting in memory and folding on a timer is what
//      makes this affordable, so the accumulator has to actually accumulate.
//
// The rest is wiring, checked by reading: the middleware counts on `finish` (so
// the route pattern and the account both exist by then), the identity carries
// the endpoint and the account id, and nothing about the API stream leaks into
// the "new problems" badge - it is usage, not a problem.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const {
  apiName, isApiRequest, UsageAccumulator, MAX_TRACKED, UNMATCHED,
} = require('../models/lib/apiUsage');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('apiUsageReport:');

// ── naming ─────────────────────────────────────────────────────────────────

test('an endpoint is named by its route PATTERN', () => {
  assert.strictEqual(apiName('get', '/api/boards/:boardId'), 'GET /api/boards/:boardId');
  assert.strictEqual(apiName('POST', '/api/boards'), 'POST /api/boards');
  // The method is part of the name: POST /api/boards creates a board and GET
  // /api/boards lists them, and an admin reading "42 calls to /api/boards"
  // cannot tell which happened.
  assert.notStrictEqual(apiName('GET', '/api/boards'), apiName('POST', '/api/boards'));
});

test('a request that matched no route gets ONE name, not its path (negative)', () => {
  // This is the difference between a bounded report and a collection an
  // attacker can fill: a wordlist sweep is thousands of distinct paths, and
  // naming rows after them would write a row per guess.
  const sweep = ['/api/admin', '/api/../etc/passwd', '/api/v2/secret', '/api/wp-login.php']
    .map(() => apiName('GET', null));
  assert.strictEqual(new Set(sweep).size, 1, 'every unmatched request shares one name');
  assert.ok(sweep[0].includes(UNMATCHED), 'and that name says it matched nothing');
  for (const guessed of ['wp-login', 'passwd', 'secret']) {
    assert.ok(!sweep.join(' ').includes(guessed),
      `the name must not carry the attacker's path (${guessed})`);
  }
});

test('only /api requests are counted', () => {
  for (const url of ['/api', '/api/boards', '/api/boards?x=1']) {
    assert.ok(isApiRequest(url), `${url} is API use`);
  }
  // The client's own traffic, the assets and the health check are not API use,
  // and counting them would bury what this report is for.
  for (const url of ['/', '/sockjs/info', '/apidocs', '/api-docs', '/healthz', '']) {
    assert.ok(!isApiRequest(url), `${url} is not API use`);
  }
});

// ── the accumulator ────────────────────────────────────────────────────────

test('a thousand calls are one row, with the window they fall in', () => {
  const acc = new UsageAccumulator();
  const first = new Date('2026-02-02T09:14:03Z');
  for (let i = 0; i < 1000; i += 1) {
    acc.add({
      name: 'POST /api/boards', userId: 'alice', ip: '100.100.100.100',
      at: new Date(first.getTime() + i * 1000),
    });
  }
  assert.strictEqual(acc.size, 1, 'one endpoint, one account, one row');
  const [row] = acc.drain();
  assert.strictEqual(row.count, 1000);
  assert.strictEqual(row.firstAt.toISOString(), first.toISOString());
  assert.strictEqual(row.at.toISOString(), new Date(first.getTime() + 999000).toISOString(),
    'the window ends at the LAST call, not the first');
});

test('and two accounts on one endpoint are two rows', () => {
  // The account is part of the identity here - the deliberate exception - so
  // "who called what" is answerable. Two endpoints for one account likewise.
  const acc = new UsageAccumulator();
  const at = new Date('2026-05-05T00:00:00Z');
  acc.add({ name: 'POST /api/boards', userId: 'alice', at });
  acc.add({ name: 'POST /api/boards', userId: 'bob', at });
  acc.add({ name: 'GET /api/boards', userId: 'alice', at });
  assert.strictEqual(acc.size, 3);
});

test('an unauthenticated caller is a row, not a mistake', () => {
  const acc = new UsageAccumulator();
  const at = new Date('2026-05-05T00:00:00Z');
  for (let i = 0; i < 812; i += 1) acc.add({ name: 'POST /api/users', userId: '', ip: '2001:db8::1', at });
  const [row] = acc.drain();
  assert.strictEqual(row.count, 812);
  assert.strictEqual(row.userId, '');
  assert.strictEqual(row.ip, '2001:db8::1',
    'with no account, the address is what identifies the caller');
});

test('the tracked pairs are CAPPED, and the rest are counted (negative)', () => {
  // Without this an attacker who can vary the account or the endpoint grows the
  // map with the attack - the same bug one level down that MAX_ACTORS closes in
  // the summaries.
  const acc = new UsageAccumulator({ maxTracked: 3 });
  const at = new Date('2026-05-05T00:00:00Z');
  for (let i = 0; i < 50; i += 1) acc.add({ name: `GET /api/x${i}`, userId: 'a', at });
  assert.strictEqual(acc.size, 3, 'the map stops growing at the cap');
  const rows = acc.drain();
  const overflow = rows.find(r => r.name.includes('over 3 tracked'));
  assert.ok(overflow, 'the ones past the cap are counted in an overflow row');
  assert.strictEqual(overflow.count, 47, 'and nothing is silently dropped');
  assert.ok(MAX_TRACKED >= 100, 'the real cap is far above ordinary use');
});

test('drain empties it, so a flush never writes the same calls twice', () => {
  const acc = new UsageAccumulator();
  acc.add({ name: 'GET /api/boards', userId: 'a', at: new Date() });
  assert.strictEqual(acc.drain().length, 1);
  assert.strictEqual(acc.drain().length, 0);
  assert.strictEqual(acc.size, 0);
});

// ── the wiring ─────────────────────────────────────────────────────────────

test('it counts on `finish`, which is where the route pattern exists', () => {
  const log = read('server/lib/apiUsageLog.js');
  assert.ok(/res\.on\('finish'/.test(log),
    'counting on the way IN would have no req.route and no authenticated user');
  assert.ok(/req\.route && req\.route\.path/.test(log),
    'the name comes from the matched route');
  assert.ok(/HTTP_FORWARDED_COUNT/.test(log),
    'and the address is resolved the same spoofing-safe way as the login throttle');
});

test('and it is installed in front of the routes, not per route', () => {
  // A route added tomorrow has to be counted without anybody remembering to
  // count it - that is the whole reason this is middleware.
  const mw = read('server/apiMiddleware.js');
  assert.ok(/apiUsageMiddleware/.test(mw), 'apiMiddleware.js must install it');
  const routeFiles = ['server/models/boards.js', 'models/export.js'];
  for (const file of routeFiles) {
    assert.ok(!/apiUsage/.test(read(file)),
      `${file} must not have to count its own routes`);
  }
});

test('the summary identity carries the endpoint and the ACCOUNT ID', () => {
  const summary = read('models/lib/eventLogSummary.js');
  const identity = /const IDENTITY_FIELDS = \[([\s\S]*?)\];/.exec(summary);
  assert.ok(identity, 'IDENTITY_FIELDS must exist');
  assert.ok(/'api'/.test(identity[1]), 'the endpoint is part of the identity');
  assert.ok(/'apiUserId'/.test(identity[1]),
    'and the account, by ID - a rename must not split one account into two rows');
  assert.ok(!/'apiUsername'/.test(identity[1]),
    'the NAME must not be the identity, or a rename splits the history');
});

test('every API fold field is accepted by the EventLog schema', () => {
  // Collection2 validates both the upsert selector and update. Missing `api`
  // caused every timed flush to fail before one usage row could be recorded;
  // the shared fold also adds the address-family fields to the update.
  const eventLog = read('models/eventLog.js');
  const schema = eventLog.slice(eventLog.indexOf('new SimpleSchema({'),
    eventLog.indexOf('}),\n);'));
  for (const field of ['api', 'apiUserId', 'ipv4', 'ipv6']) {
    assert.ok(new RegExp(`\\n\\s*${field}:\\s*\\{ type: String`).test(schema),
      `EventLog schema must accept ${field}`);
  }
});

test('API use is not a "problem", so it stays out of the badge (negative)', () => {
  // EVENT_STREAMS drives the red Problems button and the Summary counts. An
  // instance serving its API would otherwise report thousands of new problems.
  const eventLog = read('models/eventLog.js');
  const streams = /export const EVENT_STREAMS = \[([^\]]*)\]/.exec(eventLog);
  assert.ok(streams, 'EVENT_STREAMS must exist');
  assert.ok(!/'api'/.test(streams[1]),
    'the api stream must NOT be in EVENT_STREAMS - it is usage, not a problem');
});

test('the pane reuses the shared report, with its own columns only', () => {
  // "Combine templates where possible": the API pane is the event-stream report
  // with a different column list, not a second table page.
  const jade = read('client/components/settings/adminProblems.jade');
  assert.ok(/isPane 'report-api'\s*\n\s*\+eventStreamReport\(stream="api"\)/.test(jade),
    'the API pane must render the shared event-stream report');
  const js = read('client/components/settings/adminProblems.js');
  assert.ok(/const API_COLUMNS = \[/.test(js), 'with its own columns');
  assert.ok(/stream === 'api' \? API_COLUMNS : EVENT_STREAM_COLUMNS/.test(js),
    'chosen by stream, in one place');
  // The columns the request asked for: username, API name, count, the window,
  // and the two address families in their own columns.
  const cols = /const API_COLUMNS = \[([\s\S]*?)\n\];/.exec(js)[1];
  for (const key of ['username', 'api-endpoint', 'api-calls',
    'api-first-called', 'api-last-called']) {
    assert.ok(cols.includes(`'${key}'`), `the table must have a ${key} column`);
  }
  // The two address columns are the pair every report uses, not a third copy of
  // them - that is what makes "IPv4 and IPv6 wherever the address is known"
  // true of the whole page rather than of whichever report was edited last.
  assert.ok(/\.\.\.addressColumns\(\)/.test(cols), 'the shared address pair');
  const shared = /const addressColumns = \(\) => \[([\s\S]*?)\n\];/.exec(js);
  assert.ok(shared, 'addressColumns must exist');
  for (const key of ['event-ipv4', 'event-ipv6']) {
    assert.ok(shared[1].includes(`'${key}'`), `it must have a ${key} column`);
  }
  assert.ok(/classifyAddress\(r\.ip\)/.test(shared[1]),
    'and fall back to classifying `ip`, so rows written before the split still display');
});

test('and it sorts by how much, not by how recently', () => {
  const eventLog = read('models/eventLog.js');
  assert.ok(/stream === 'api' \? \{ count: -1, at: -1 \}/.test(eventLog),
    'a usage report answers "what is used most"; a problem report answers "what happened last"');
});

test('every language has the keys, in en.i18n.json\'s order', () => {
  // A key added to en and nowhere else shows the raw key name to everybody who
  // does not read English.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = ['apiReportTitle', 'api-endpoint', 'api-calls',
    'api-first-called', 'api-last-called', 'api-no-calls', 'api-report-desc'];
  for (const key of keys) assert.ok(en[key], `en.i18n.json needs ${key}`);
  const dir = path.join(ROOT, 'imports/i18n/data');
  const missing = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.i18n.json')) continue;
    if (fs.lstatSync(path.join(dir, file)).isSymbolicLink()) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const key of keys) if (!(key in data)) missing.push(`${file}:${key}`);
  }
  assert.deepStrictEqual(missing.slice(0, 5), [], `these languages lack the keys: ${missing.length}`);
});

console.log(`\napiUsageReport: ${passed} tests passed`);
