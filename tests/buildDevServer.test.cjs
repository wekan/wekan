'use strict';

// Source guards for the two build.sh helpers that have no other coverage:
// the dev-server URL prompt (custom port + ROOT_URL host) and the inotify watch
// limit check. Both are plain shell, so these assert the wiring; the behaviour of
// each was exercised by sourcing the function against fake input.
//
// Run: node tests/buildDevServer.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sh = fs.readFileSync(path.join(__dirname, '..', 'build.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('buildDevServer:');

test('the Dev server menu offers a custom port + ROOT_URL host', () => {
  assert.ok(sh.includes('CUSTOM PORT + SUBDOMAIN|Run Meteor for dev on a custom port and ROOT_URL host (asks)'),
    'menu entry is missing');
  assert.ok(sh.includes('"Run Meteor for dev on a custom port and ROOT_URL host (asks)")'),
    'no case handler matches the menu entry');
});

test('the handler runs Meteor with the answers, not with hard-coded 3000', () => {
  const start = sh.indexOf('"Run Meteor for dev on a custom port and ROOT_URL host (asks)")');
  const body = sh.slice(start, sh.indexOf('\n\t\t;;', start));
  assert.ok(/ask_dev_url/.test(body), 'the handler asks for the port/host');
  assert.ok(/ROOT_URL="\$DEV_ROOT_URL"/.test(body), 'ROOT_URL comes from the answer');
  assert.ok(/meteor run --port "\$DEV_PORT"/.test(body), 'the port comes from the answer');
  assert.ok(/kill_meteor_on_port "\$DEV_PORT"/.test(body),
    'the chosen port is freed first, like the other dev options');
  // Comments may mention it; no COMMAND in the handler may pin it.
  const commands = body.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert.ok(!/localhost:3000/.test(commands), 'the handler must not pin localhost:3000');
});

// The port Meteor LISTENS on and the URL a BROWSER uses are different things
// behind a reverse proxy: Caddy serves https://wekan.example.com on 443 and
// forwards to localhost:PORT, so appending the local port to that ROOT_URL would
// produce https://wekan.example.com:4000, which nothing serves.
test('a full URL answer is used verbatim - no port appended (the reported bug)', () => {
  assert.ok(/\*:\/\/\*\)\s*\n(?:\s*#[^\n]*\n)*\s*url="\$answer" ;;/.test(sh),
    'an answer containing a scheme must be used exactly as given');
});

test('a dotted host with no scheme is treated as public, not local', () => {
  assert.ok(/\*\.\*\)\s*\n(?:\s*#[^\n]*\n)*\s*url="https:\/\/\$answer" ;;/.test(sh),
    'a public name gets https:// and NO local port');
});

test('only a local answer gets the port appended', () => {
  assert.ok(/url="http:\/\/localhost:\$port" ;;/.test(sh), 'empty answer -> localhost:PORT');
  assert.ok(/url="http:\/\/\$answer\.localhost:\$port" ;;/.test(sh),
    'a bare label -> <label>.localhost:PORT');
});

test('a trailing slash is removed so built URLs do not double up (negative)', () => {
  assert.ok(/answer="\$\{answer%\/\}"/.test(sh), 'strips one trailing slash');
});

test('a non-numeric or out-of-range port falls back to 3000 (negative)', () => {
  assert.ok(/''\|\*\[!0-9\]\*\) echo "Not a number/.test(sh), 'rejects non-numeric input');
  assert.ok(/-lt 1 \] \|\| \[ "\$port" -gt 65535 \]/.test(sh), 'rejects out-of-range ports');
});

test('it can be driven non-interactively', () => {
  assert.ok(/port="\$\{WEKAN_DEV_PORT:-\}"/.test(sh), 'WEKAN_DEV_PORT skips the port prompt');
  assert.ok(/answer="\$\{WEKAN_DEV_ROOT_URL:-\$\{WEKAN_DEV_HOST:-\}\}"/.test(sh),
    'WEKAN_DEV_ROOT_URL (or WEKAN_DEV_HOST) skips the ROOT_URL prompt');
});

// --- the inotify limit check (added alongside; same file, no other coverage) ---

test('the inotify watch limit is checked on every run, before the menu', () => {
  const call = sh.indexOf('\nensure_inotify_watches\n');
  const menu = sh.indexOf('select cat in "Setup"');
  assert.ok(call > -1, 'ensure_inotify_watches is never called');
  assert.ok(menu > -1 && call < menu, 'it must run before the menu is shown');
});

test('raising the limit never aborts the script (negative)', () => {
  const start = sh.indexOf('function ensure_inotify_watches(){');
  const body = sh.slice(start, sh.indexOf('\n}\n', sh.indexOf('inotify watch limit is now', start)));
  assert.ok(!/\bexit \d/.test(body), 'it must not exit');
  assert.ok(/WEKAN_INOTIFY_WATCHES/.test(body), 'the target is overridable (0 disables it)');
  assert.ok(/\[ "\$\(uname -s\)" = "Linux" \] \|\| return 0/.test(body),
    'no-op on macOS/BSD, which have no inotify');
  assert.ok(/Cannot raise it automatically/.test(body),
    'prints manual instructions when it cannot use sudo');
});

test('the test server reuses a database only when it ANSWERS', () => {
  // 2026-08-14: a run took the "reuse" branch, started no mongod of its own, and
  // the test server died on its first query with "Topology is closed" - there
  // was no wekan-test-mongod.log, because none was started. A TCP connect proves
  // only that something accepted the socket. Here it was an "Omi Server"
  // answering HTTP on 3001; a mongod that is shutting down would do the same.
  assert.ok(/&& mongo_answers "\$TEST_DB_PORT"; then/.test(sh),
    'the reuse branch asks the database, not just the port');
  assert.ok(/mongo_answers\(\) \{/.test(sh), 'and the probe exists');
  const probe = sh.slice(sh.indexOf('mongo_answers() {'), sh.indexOf('function run_all_tests('));
  assert.ok(/command\(\{ ping: 1 \}\)/.test(probe), 'it pings');
  assert.ok(/serverSelectionTimeoutMS: 3000/.test(probe), 'and gives up in seconds, not minutes');
  assert.ok(/BUNDLE_DIR\/programs\/server\/node_modules/.test(probe),
    'with the driver already in the built bundle, so nothing is installed for it');
  // The readiness wait asks the same question: a port that opens is not a
  // database that answers, and waiting for the first is how the run got here.
  assert.ok(/db_ready=1; break; fi/.test(sh) && /mongo_answers "\$TEST_DB_PORT"\) 2>\/dev\/null;? ?then db_ready=1|&& mongo_answers "\$TEST_DB_PORT"; then db_ready=1/.test(sh),
    'and so does the wait for the mongod it started');
});

test('a default port owned by another program moves the database (negative)', () => {
  // 3001 is Meteor's convention, not ours to insist on: on this machine it
  // belongs to something else entirely. The run moves to a free port and TELLS
  // the tests, which already read WEKAN_MONGO_URL.
  assert.ok(/local TEST_DB_PORT="\$\{WEKAN_TEST_DB_PORT:-3001\}"/.test(sh),
    'the port is a variable with the old default');
  assert.ok(/for candidate in 3011 3021 3031 3041 3051/.test(sh), 'with fallbacks');
  assert.ok(/export WEKAN_MONGO_URL="\$TEST_MONGO_URL"/.test(sh),
    'and the tests are told where the database went');
  const helper = fs.readFileSync(
    path.join(__dirname, 'playwright', 'helpers', 'db.js'), 'utf8');
  assert.ok(/process\.env\.WEKAN_MONGO_URL/.test(helper), 'which is what they read');
  // And the server is started against the same URL, not a hard-coded one.
  assert.ok(/MONGO_URL="\$TEST_MONGO_URL"/.test(sh), 'the server uses it too');
  assert.ok(!/MONGO_URL="mongodb:\/\/127\.0\.0\.1:3001\/meteor" ROOT_URL/.test(sh),
    'and nothing hard-codes 3001 for it any more');
});

test('every port is exhausted before the run gives up (negative)', () => {
  const branch = sh.slice(sh.indexOf('if [ "$TEST_DB_PORT" = "$taken" ]; then'));
  const body = branch.slice(0, branch.indexOf('\tfi'));
  assert.ok(/none of the/.test(body) && /fallback ports/.test(body), 'it says what it tried');
  assert.ok(/WEKAN_TEST_DB_PORT/.test(body), 'and how to choose one by hand');
  assert.ok(/return 1/.test(body), 'and stops rather than starting the server against nothing');
});

console.log(`\n${passed} tests passed`);
