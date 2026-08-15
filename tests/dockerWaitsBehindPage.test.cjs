'use strict';

// A container waiting for its database says so, instead of timing out.
// Run: node tests/dockerWaitsBehindPage.test.cjs
//
// #6595: "We upgraded to 10.91 ... Gateway timeout appears". WeKan does not open
// its web port until the database answers, and in a container nothing else was
// listening while it waited - so a reverse proxy in front returned a gateway
// timeout, and that is the same symptom for two completely different faults:
// WeKan is broken, or the database has simply not come up yet.
//
// The snap has served a page for exactly this since 10.91
// (snap-src/bin/wekan-control, #6592). The container had no such thing, so the
// fix that release shipped could not reach anyone running Docker - which is why
// the same reporter saw no change.
//
// What is bounded here is the PAGE, not the wait: a database can take minutes to
// come up after an update, and giving up on it would be worse than waiting. When
// the page's window ends, WeKan starts and keeps waiting itself, exactly as it
// did before.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const entrypoint = read('releases/ferretdb/wekan-entrypoint.sh');
const bridge = read('releases/ferretdb/recovery-bridge.mjs');
const ready = read('releases/ferretdb/db-ready.mjs');
const dockerfile = read('Dockerfile');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dockerWaitsBehindPage:');

test('the entrypoint asks whether the database answers', () => {
  assert.ok(/node \/build\/db-ready\.mjs "\$MONGO_URL"/.test(entrypoint), 'it asks');
  assert.ok(/NODE_PATH="\$_db_node_path"/.test(entrypoint),
    'with the driver from the bundle, so nothing extra is installed');
  assert.ok(/_db_node_path="\/build\/programs\/server\/node_modules"/.test(entrypoint),
    'which is where the bundle keeps it');
});

test('while it does not, the page holds the web port', () => {
  // Both facts, not one literal line: the bridge is told this is the database
  // reason, and it is given the web port. They were on one line until the
  // failure detail was added beside them.
  assert.ok(/WEKAN_BRIDGE_REASON=database/.test(entrypoint),
    'the bridge serves the database reason');
  assert.ok(/PORT="\$\{PORT:-8080\}" PRODUCT_NAME=/.test(entrypoint),
    'on the web port');
  assert.ok(/WEKAN_BRIDGE_REASON === 'database'/.test(bridge), 'which the bridge knows');
  assert.ok(/is waiting for its database/.test(bridge), 'and says so');
  assert.ok(/503/.test(bridge), 'as a 503, so a proxy and a crawler read it right');
  assert.ok(/http-equiv="refresh"/.test(bridge), 'and it comes back by itself');
});

test('the page stops before WeKan binds the port (negative)', () => {
  // Two servers cannot hold one port. The page has to be gone first, and gone
  // whichever way the loop ended.
  const tail = entrypoint.slice(entrypoint.indexOf('#6595: WAIT FOR THE DATABASE'));
  assert.ok(/kill "\$_dbpid"/.test(tail) && /wait "\$_dbpid"/.test(tail),
    'it is killed and reaped');
  assert.ok(tail.indexOf('kill "$_dbpid"') < tail.indexOf('exec node /build/main.js'),
    'before WeKan starts');
});

test('the wait is not a timeout on the database (negative)', () => {
  // Giving up on a database that is merely slow would be worse than waiting: the
  // page's window ends, WeKan starts, and WeKan keeps waiting as it always did.
  const tail = entrypoint.slice(entrypoint.indexOf('#6595: WAIT FOR THE DATABASE'));
  assert.ok(/starting WeKan anyway, which will keep waiting for it/.test(tail),
    'that is what the end of the window means');
  assert.ok(/WEKAN_DB_WAIT_MAX_SECONDS:-600/.test(tail), 'and it is a page window, in seconds');
  assert.ok(/WEKAN_DB_WAIT_PAGE:-true/.test(tail), 'with a way to turn it off');
});

test('a database that is already up is not waited for at all (negative)', () => {
  // The common case: the probe answers on the first ask and nothing is started.
  // The test used to pin `if ! …`, which could not tell the three answers apart
  // once "I could not ask" became one of them; it pins the exit code instead.
  const tail = entrypoint.slice(entrypoint.indexOf('#6595: WAIT FOR THE DATABASE'));
  assert.ok(/_db_rc=\$\?/.test(tail), 'the probe\'s answer is kept');
  assert.ok(/elif \[ "\$_db_rc" != "0" \]/.test(tail),
    'and the page is only for the case where it does not answer');
});

test('the probe only asks, and is shipped', () => {
  assert.ok(/command\(\{ ping: 1 \}\)/.test(ready), 'one ping');
  assert.ok(!/insert|update|createIndex|drop/i.test(ready), 'nothing is written');
  assert.ok(/serverSelectionTimeoutMS: 3000/.test(ready), 'and it gives up quickly');
  assert.ok(/COPY --chmod=644 releases\/ferretdb\/db-ready\.mjs \/build\/db-ready\.mjs/.test(dockerfile),
    'the image carries it');
});

test('the recovery page it shares still says recovery (negative)', () => {
  // One bridge, two reasons; the older one must not have changed.
  assert.ok(/is recovering your data/.test(bridge), 'the recovery wording is intact');
  assert.ok(/RECOVERY_IN_PROGRESS/.test(entrypoint), 'and its own trigger still stands');
  assert.ok(/REASON = process\.env\.WEKAN_BRIDGE_REASON === 'database' \? 'database' : 'recovery'/
    .test(bridge), 'recovery is what an unset reason means');
});

test('the probe takes its connection options from the URL, not from itself', () => {
  // #6599. The probe forced `directConnection: true`. For one host that is
  // harmless; for a replica set - which is a SEED LIST - the driver refuses:
  // "MongoParseError: directConnection option requires exactly one host". The
  // throw happened while the client was being CONSTRUCTED, outside the try, so
  // the probe died with an unhandled error on every ask, its exit code said
  // "not ready", and the container served "waiting for database" forever at a
  // database that was answering everyone else.
  //
  // It must also ask the question WeKan will ask: WeKan connects with the URL
  // as written, so a probe that quietly connects differently can report ready
  // for a database WeKan cannot reach - dropping the page and leaving the port
  // closed, which is the fault this whole feature exists to prevent.
  // The CODE, not the comment above it that explains why this is here.
  const code = ready.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/directConnection:\s*true/.test(code),
    'the probe must not force directConnection - a replica-set URL is a seed list and the driver refuses');
});

test('a URL the driver refuses is reported, not thrown (negative)', () => {
  // The construction is inside a try, so a bad URL is "not ready with a reason"
  // rather than a stack trace nobody sees.
  const ctor = ready.indexOf('new MongoClient(');
  const tryBefore = ready.lastIndexOf('try {', ctor);
  const catchAfter = ready.indexOf('} catch', ctor);
  assert.ok(tryBefore !== -1 && catchAfter !== -1 && tryBefore < ctor && ctor < catchAfter,
    'new MongoClient() is inside a try');
  assert.ok(/rejected by the driver/.test(ready),
    'and says so, in the driver\'s own words');
});

test('the probe looks for the driver where a bundle actually keeps it', () => {
  // THE fault behind "Docker WeKan did not load the login page". `mongodb` is a
  // devDependency, so a production bundle has NOTHING at
  // programs/server/node_modules/mongodb - Meteor's driver lives under
  // npm-mongo. Asking at the top level only, require threw MODULE_NOT_FOUND on
  // every ask, in every container, whatever the database was doing: the probe
  // could never say "ready" and the waiting page stood in front of a healthy
  // WeKan for the whole ten-minute window. The snap's db-eval.mjs carries the
  // same scar; this is the same candidate list.
  assert.ok(/npm\/node_modules\/meteor\/npm-mongo\/node_modules/.test(ready),
    'npm-mongo first - that is where the bundle keeps the driver');
  assert.ok(/programs\/server\/node_modules\/_\.cjs/.test(ready),
    'the top level too, for a bundle that does have it');
  assert.ok(/createRequire\(import\.meta\.url\)/.test(ready),
    'and CommonJS resolution from this file as the fallback');
});

test('"I could not ask" never puts a page in front of the database (negative)', () => {
  // Not finding a driver is not evidence that anything is wrong, and a page
  // shown on that basis hides a healthy WeKan. Exit 2 is distinct from 1 so the
  // caller can tell the two apart.
  assert.ok(/process\.exit\(2\)/.test(ready), 'no driver exits 2, not 1');
  assert.ok(/_db_rc" = "2"/.test(entrypoint), 'and the entrypoint checks for it');
  assert.ok(/starting WeKan without the waiting page/.test(entrypoint),
    'and starts WeKan instead of serving the page');
});

test('the reason reaches the log and the page', () => {
  // A probe that fails silently is why this took a bug report to find.
  assert.ok(/console\.error\(`db-ready: \$\{err\.name\}/.test(ready),
    'the probe prints why it failed');
  assert.ok(!/node \/build\/db-ready\.mjs "\$MONGO_URL" 2>\/dev\/null$/m.test(entrypoint),
    'and the entrypoint no longer throws that reason away');
  assert.ok(/WEKAN_BRIDGE_DETAIL="\$_db_why"/.test(entrypoint),
    'the page is given it too - whoever waits is looking at a browser, not at docker logs');
  assert.ok(/WEKAN_BRIDGE_DETAIL/.test(bridge) && /class="detail"/.test(bridge),
    'and the page renders it');
  assert.ok(/replace\(\/\[&<>"\]\/g/.test(bridge),
    'escaped: it is a driver message, not markup');
});

console.log(`\ndockerWaitsBehindPage: ${passed} tests passed`);
