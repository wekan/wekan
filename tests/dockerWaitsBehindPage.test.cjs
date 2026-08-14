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
  assert.ok(/WEKAN_BRIDGE_REASON=database PORT="\$\{PORT:-8080\}"/.test(entrypoint),
    'the bridge serves the database reason on the web port');
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
  const tail = entrypoint.slice(entrypoint.indexOf('#6595: WAIT FOR THE DATABASE'));
  assert.ok(/if ! NODE_PATH="\$_db_node_path" node \/build\/db-ready\.mjs/.test(tail),
    'the page is only for the case where it does not answer');
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

console.log(`\ndockerWaitsBehindPage: ${passed} tests passed`);
