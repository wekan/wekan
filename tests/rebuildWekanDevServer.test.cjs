'use strict';

// Source guards for the two rebuild-wekan.sh helpers that have no other coverage:
// the dev-server URL prompt (custom port + ROOT_URL host) and the inotify watch
// limit check. Both are plain shell, so these assert the wiring; the behaviour of
// each was exercised by sourcing the function against fake input.
//
// Run: node tests/rebuildWekanDevServer.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sh = fs.readFileSync(path.join(__dirname, '..', 'rebuild-wekan.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('rebuildWekanDevServer:');

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

test('a bare host answer becomes a subdomain of localhost, a dotted one is used as-is', () => {
  assert.ok(/case "\$host" in\s*\n\s*localhost\|\*\.\*\) : ;;/.test(sh),
    'a host containing a dot (or plain localhost) is left alone');
  assert.ok(/\*\) host="\$host\.localhost" ;;/.test(sh),
    'a bare label becomes <label>.localhost');
});

test('a pasted URL is reduced to a host (negative)', () => {
  // http://board.localhost:9999/ must not end up inside ROOT_URL verbatim.
  assert.ok(/host="\$\{host#http:\/\/\}"/.test(sh), 'strips http://');
  assert.ok(/host="\$\{host#https:\/\/\}"/.test(sh), 'strips https://');
  assert.ok(/host="\$\{host%%\/\*\}"/.test(sh), 'strips a path');
  assert.ok(/host="\$\{host%%:\*\}"/.test(sh), 'strips a port');
});

test('a non-numeric or out-of-range port falls back to 3000 (negative)', () => {
  assert.ok(/''\|\*\[!0-9\]\*\) echo "Not a number/.test(sh), 'rejects non-numeric input');
  assert.ok(/-lt 1 \] \|\| \[ "\$port" -gt 65535 \]/.test(sh), 'rejects out-of-range ports');
});

test('it can be driven non-interactively', () => {
  assert.ok(/port="\$\{WEKAN_DEV_PORT:-\}"/.test(sh), 'WEKAN_DEV_PORT skips the port prompt');
  assert.ok(/host="\$\{WEKAN_DEV_HOST:-\}"/.test(sh), 'WEKAN_DEV_HOST skips the host prompt');
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

console.log(`\n${passed} tests passed`);
