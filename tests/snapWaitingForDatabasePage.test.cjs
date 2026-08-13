'use strict';

// #6592: "We upgraded from 10.85 to 10.89 and later to 10.90 - a reload of wekan
// got a timeout (loading forever)."  Run: node tests/snapWaitingForDatabasePage.test.cjs
//
// WeKan does not open its web port until the database answers, and the two waits
// in wekan-control are deliberately endless: a database can take minutes to come
// up after an update, and a snap that gave up would be worse than one that waits.
//
// But NOTHING was listening while it waited. The browser gets a timeout, which is
// what "loading forever" is, and the reason - which the script does print, after
// two minutes - goes to `snap logs`, the last place somebody whose site is down
// looks. It is also indistinguishable from WeKan itself being broken, so the
// report is "WeKan doesn't load" for a fault that may be entirely in FerretDB.
//
// So the wait says so, on the web port. This suite pins the three things that
// make that safe rather than merely nice: the page appears only after a grace
// period (an ordinary restart passes through in seconds), it is stopped before
// anything else binds that port - including across the re-execs in the MongoDB
// loop - and it names the database being waited for.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const control = read('snap-src/bin/wekan-control');
const page = read('snap-src/bin/wekan-maintenance-page.mjs');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('snapWaitingForDatabasePage:');

test('wekan-control still parses', () => {
  execFileSync('bash', ['-n', path.join(repoRoot, 'snap-src/bin/wekan-control')]);
});

test('both endless waits serve the page', () => {
  // The FerretDB wait and the MongoDB wait are separate loops, and the fix is
  // worth nothing in the one it is missing from.
  const ferret = control.slice(control.indexOf('Waiting for FerretDB to accept connections'),
    control.indexOf('echo "FerretDB is ready."'));
  const mongo = control.slice(control.indexOf('Waiting for MongoDB replica set primary'),
    control.indexOf('echo "MongoDB replica set primary is ready."'));
  assert.ok(/start_db_wait_page ferretdb/.test(ferret), 'the FerretDB wait names FerretDB');
  assert.ok(/start_db_wait_page mongodb/.test(mongo), 'the MongoDB wait names MongoDB');
  assert.ok(/stop_db_wait_page/.test(ferret) || /stop_db_wait_page\n\s*echo "FerretDB is ready/.test(control),
    'and each stops it when the database answers');
});

test('the page waits for a grace period first (negative)', () => {
  // Every restart passes through these loops. A page that appeared instantly
  // would flash on each one and teach proxies to cache a 503 for a healthy site.
  assert.ok(/WEKAN_DB_WAIT_PAGE_SECONDS="\$\{WEKAN_DB_WAIT_PAGE_SECONDS:-30\}"/.test(control),
    'there is a grace period, and it is overridable');
  const starts = control.split('\n').filter(l => /start_db_wait_page /.test(l) && !/^\s*#/.test(l));
  assert.strictEqual(starts.length, 2, 'exactly the two waits start it');
  for (const line of starts) {
    const idx = control.indexOf(line);
    const before = control.slice(idx - 200, idx);
    assert.ok(/db_waited" -ge "\$WEKAN_DB_WAIT_PAGE_SECONDS/.test(before),
      'each start is guarded by the grace period');
  }
});

test('the port is freed before anything else binds it', () => {
  // The page is a child process holding $PORT. `exec` keeps children alive, so
  // a re-exec inside the MongoDB loop would leave the port taken and the next
  // start would die on EADDRINUSE - a worse fault than the one being fixed.
  const stop = control.slice(control.indexOf('stop_db_wait_page() {'));
  const body = stop.slice(0, stop.indexOf('\n}'));
  assert.ok(/kill "\$_db_wait_page_pid"/.test(body) && /wait "\$_db_wait_page_pid"/.test(body),
    'killed AND waited for, so the port is really gone');
  const loop = control.slice(control.indexOf('Waiting for MongoDB replica set primary'),
    control.indexOf('echo "MongoDB replica set primary is ready."'));
  for (const line of loop.split('\n')) {
    if (/exec "\$0" "\$@"/.test(line)) {
      const before = loop.slice(Math.max(0, loop.indexOf(line) - 200), loop.indexOf(line));
      assert.ok(/stop_db_wait_page/.test(before), 'every re-exec stops the page first');
    }
  }
  assert.ok(/stop_db_wait_page\nexec|stop_db_wait_page\n\s+exec/.test(loop),
    'and at least one of them is there to be checked');
});

test('the page names the database, and what to run', async () => {
  // Behaviour, not shape: start it and read what a browser would get.
  const port = 8793;
  const child = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
    env: { ...process.env, PORT: String(port), WEKAN_MAINTENANCE_REASON: 'waiting-for-database',
      WEKAN_WAITING_DB: 'ferretdb', SNAP_INSTANCE_NAME: 'wekan', SNAP_COMMON: '/var/snap/wekan/common' },
    stdio: 'ignore',
  });
  try {
    let body = '';
    let status = 0;
    for (let i = 0; i < 40 && !body; i++) {
      await new Promise(r => setTimeout(r, 100));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/b/anyboard/anything`);
        status = res.status;
        body = await res.text();
      } catch { /* not listening yet */ }
    }
    assert.ok(body, 'the page must answer');
    assert.strictEqual(status, 503, 'a wait is a temporary outage, so proxies must not cache it as final');
    assert.ok(/waiting for its database/.test(body), 'it says what is being waited for');
    assert.ok(/FerretDB/.test(body) && !/waiting for MongoDB/.test(body),
      'and WHICH database, because "WeKan is down" and "FerretDB did not start" look identical');
    assert.ok(/snap logs wekan\.ferretdb/.test(body), 'with the command that gives the real reason');
    assert.ok(/snap revert wekan/.test(body), 'and the way back, since this follows an update');
    assert.ok(/http-equiv="refresh"/.test(body),
      'it must refresh itself away: the admin should not have to notice the site came back');
    assert.ok(/nothing has been changed or lost/.test(body),
      'and answer the question actually being asked, which is whether the data is gone');
  } finally {
    child.kill();
  }
});

test('the MongoDB wording is the MongoDB one', () => {
  // One page, two waits: `WEKAN_WAITING_DB=mongodb` has to change every place
  // the database is named, or the page sends the admin to the wrong log.
  assert.ok(/WEKAN_WAITING_DB === 'mongodb' \? 'MongoDB' : 'FerretDB'/.test(page));
  assert.ok(/WEKAN_WAITING_DB === 'mongodb' \? 'mongodb' : 'ferretdb'/.test(page),
    'including the snap service name in the commands');
});

test('the other maintenance pages are unchanged (negative)', () => {
  // This page is shared with maintenance mode, the recovery bridge and the
  // data-too-old stop. A wait must not put its steps on any of those.
  assert.ok(/const WAIT_STEPS = IS_WAITING_DB \?/.test(page),
    'the new text is behind its own reason');
  assert.ok(/: '';/.test(page.slice(page.indexOf('const WAIT_STEPS'))),
    'and is empty for every other reason');
  for (const reason of ['recovery', 'data-too-old']) {
    assert.ok(page.includes(`=== '${reason}'`), `${reason} is still its own reason`);
  }
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nsnapWaitingForDatabasePage: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
