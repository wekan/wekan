'use strict';

// Guard: comparing the two copies of the database cannot take the site down.
// Run: node tests/autopickDoesNotBlockStartup.test.cjs
//
// THE OUTAGE. An instance on 10.96 went offline at every restart. bin/wekan-control
// ran bin/database-autopick synchronously, unbounded, before anything opened the
// web port - and the comparison starts each database on a temporary port, which on
// a real instance is minutes. Until it returned, a browser got a connection
// timeout and the reason was in `snap logs`, the last place somebody whose site is
// down thinks to look.
//
// That is #6592 exactly, one step earlier than where #6592 was fixed: the database
// WAIT already serves a "waiting for its database" page, but its machinery was
// defined 200 lines BELOW the comparison that needed it.
//
// It was also not a rare event. bin/database-autopick starts mongod to read
// MongoDB, and starting mongod stamps the files bin/ferretdb-migration-stale reads
// as evidence that MongoDB was written to - so the comparison ran at EVERY start
// and could never conclude (tests/autopickReadLeavesNoTrace.test.cjs is that half).
// Every restart took the site down for a comparison that had already been made.
//
// Three things have to hold, and this suite is about them:
//   1. the page functions are defined BEFORE the comparison uses them;
//   2. the comparison is BOUNDED, and a bound that runs out still starts WeKan;
//   3. the page is stopped before anything else binds the port.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const control = read('snap-src/bin/wekan-control');
const config = read('snap-src/bin/config');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The block that runs the comparison, from the autopick_rc that guards it to the
// end of that if.
const block = (() => {
  const start = control.indexOf('autopick_rc=1');
  assert.notStrictEqual(start, -1, 'wekan-control no longer runs database-autopick');
  return control.slice(start, control.indexOf('if [ "$autopick_rc" -eq 0 ]', start));
})();

test('the waiting page is defined before the comparison that uses it', () => {
  const defined = control.indexOf('start_db_wait_page() {');
  const used = control.indexOf('bin/database-autopick');
  assert.notStrictEqual(defined, -1, 'the page helper must exist');
  assert.ok(defined < used,
    'start_db_wait_page is defined after the comparison runs, so the comparison cannot '
    + 'serve a page and the site is simply down while it works');
});

test('the comparison serves that page rather than nothing', () => {
  assert.ok(/start_db_wait_page /.test(block),
    'nothing on the web port during a minutes-long comparison is the outage itself');
  assert.ok(/stop_db_wait_page/.test(block),
    'and it must be stopped, or it holds $PORT against WeKan');
  assert.ok(block.indexOf('start_db_wait_page') < block.indexOf('stop_db_wait_page'),
    'started before stopped');
});

test('the page waits out a grace period first (negative)', () => {
  // A comparison that finishes in seconds should not flash a page up: that is
  // noise on every restart, and it makes proxies cache a 503 for a healthy site.
  assert.ok(/WEKAN_DB_WAIT_PAGE_SECONDS/.test(block),
    'the comparison must use the same grace period as the database wait');
  assert.ok(/kill -0 "\$_autopick_pid"/.test(block),
    'which means watching the comparison rather than blocking on it');
});

test('the comparison is BOUNDED, and the bound is configurable', () => {
  assert.ok(/WEKAN_AUTOPICK_TIMEOUT/.test(block), 'there must be a timeout');
  assert.ok(/_autopick_waited" -ge "\$_autopick_timeout"/.test(block),
    'and the process monitor must actually apply it to the command');
  assert.ok(/kill -TERM "\$_autopick_pid"/.test(block),
    'a comparison over the bound must be stopped');
  assert.ok(/kill -KILL "\$_autopick_pid"/.test(block),
    'a child which ignores TERM must not hold startup indefinitely');
  assert.ok(!/command -v timeout/.test(block) && !/^\s*timeout\s/m.test(block),
    'strictly confined snaps must not try to execute the host /usr/bin/timeout');
});

test('an invalid timeout cannot break the numeric process monitor (negative)', () => {
  assert.ok(/''\|\*\[!0-9\]\*\|0\) _autopick_timeout=900/.test(block),
    'empty, non-numeric and zero timeout settings need a safe bounded default');
});

test('a bound that runs out still starts WeKan, and says what to do', () => {
  assert.ok(/_autopick_rc" -eq 124/.test(block),
    "124 is timeout(1)'s exit code and has to be told apart from a real failure");
  assert.ok(/NOTHING was changed or switched/.test(block),
    'a stopped comparison must not leave the impression that it decided something');
  for (const advice of ['database-compare', 'autopick-timeout=', 'autopick=false']) {
    assert.ok(block.includes(advice),
      `the message must name what to do next: ${advice}`);
  }
});

test('the comparison can be switched off from snap config, not only the env', () => {
  // WEKAN_AUTOPICK was an env var and nothing else, so an admin whose site was
  // down had no supported way to skip the comparison.
  assert.ok(/^keys="[^"]*\bWEKAN_AUTOPICK\b/m.test(config),
    'WEKAN_AUTOPICK must be a registered snap config key');
  assert.ok(/^KEY_WEKAN_AUTOPICK='autopick'$/m.test(config),
    "and reachable as `snap set wekan autopick=false`");
  assert.ok(/^DEFAULT_WEKAN_AUTOPICK="true"$/m.test(config),
    'defaulting to on - it is worth doing, it just must not be able to hold the site down');
  assert.ok(/if \[ "\$\{WEKAN_AUTOPICK:-true\}" = true \]/.test(block),
    'false must skip the launcher itself, so its dependencies cannot stop startup');
  assert.ok(/^KEY_WEKAN_AUTOPICK_TIMEOUT='autopick-timeout'$/m.test(config),
    'and the bound must be settable the same way');
  const timeout = /^DEFAULT_WEKAN_AUTOPICK_TIMEOUT="(\d+)"$/m.exec(config);
  assert.ok(timeout, 'the bound needs a default');
  assert.ok(Number(timeout[1]) > 0 && Number(timeout[1]) <= 3600,
    `a default bound of ${timeout[1]}s is not a bound worth having`);
});

test('every registered key has a description and a default (negative)', () => {
  // wekan-read-settings exports ${DEFAULT_$key} for every name in `keys`, so a
  // key registered without one silently exports the empty string.
  const keys = /^keys="([^"]+)"/m.exec(config);
  assert.ok(keys, 'config must declare keys');
  for (const key of ['WEKAN_AUTOPICK', 'WEKAN_AUTOPICK_TIMEOUT']) {
    assert.ok(keys[1].split(/\s+/).includes(key), `${key} must be in keys`);
    for (const prefix of ['DESCRIPTION_', 'DEFAULT_', 'KEY_']) {
      assert.ok(new RegExp(`^${prefix}${key}=`, 'm').test(config),
        `${key} has no ${prefix}${key}`);
    }
  }
});

console.log(`\nautopickDoesNotBlockStartup: ${passed} tests passed`);
