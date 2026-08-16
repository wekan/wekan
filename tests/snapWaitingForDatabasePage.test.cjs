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
  // THREE users now, not two. The database comparison at startup
  // (bin/database-autopick) took the site down for as long as it ran - it reads
  // both copies, which means starting each on a temporary port - and it had no
  // page at all, because these helpers used to be defined 200 lines below it.
  // Named rather than counted, so a FOURTH caller that nobody explained still
  // fails here.
  const starts = control.split('\n')
    .filter(l => /start_db_wait_page /.test(l) && !/^\s*#/.test(l))
    .map(l => l.trim().replace(/^start_db_wait_page /, ''));
  assert.deepStrictEqual(starts.sort(), [
    '"the two copies of the database to be compared"',
    'ferretdb',
    'mongodb',
  ], 'these are the waits that can hold up the start, and each must say which it is');
  // Each start must sit behind a "have we waited long enough yet" comparison.
  // The two database waits count seconds in $db_waited; the comparison watches a
  // child process in $_autopick_waited, because it has something to watch rather
  // than a condition to poll. Both are the same grace period.
  const lines = control.split('\n');
  for (const [i, line] of lines.entries()) {
    if (!/start_db_wait_page /.test(line) || /^\s*#/.test(line)) continue;
    const before = lines.slice(Math.max(0, i - 6), i).join('\n');
    assert.ok(/-ge "\$?\{?WEKAN_DB_WAIT_PAGE_SECONDS/.test(before),
      `this start is not guarded by the grace period: ${line.trim()}`);
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

test('it uses the Admin Panel product name', async () => {
  // A rebranded WeKan told its users "WeKan is waiting for its database" - a
  // word they have never seen. The page has no database (that is the point of
  // it), so the name comes from the file WeKan writes whenever the setting is
  // known: $SNAP_COMMON/.productname.txt.
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'wekan-product-'));
  fs.writeFileSync(path.join(dir, '.productname.txt'), 'Acme Boards\n');
  const port = 8794;
  const child = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
    env: { ...process.env, PORT: String(port), WEKAN_MAINTENANCE_REASON: 'waiting-for-database',
      WEKAN_WAITING_DB: 'ferretdb', SNAP_INSTANCE_NAME: 'wekan', SNAP_COMMON: dir, PRODUCT_NAME: '' },
    stdio: 'ignore',
  });
  try {
    let body = '';
    for (let i = 0; i < 40 && !body; i++) {
      await new Promise(r => setTimeout(r, 100));
      try { body = await (await fetch(`http://127.0.0.1:${port}/`)).text(); } catch { /* not up yet */ }
    }
    assert.ok(/<h1>.*Acme Boards is waiting for its database<\/h1>/.test(body),
      'the heading is the product name, not WeKan');
    assert.ok(/<title>Acme Boards — Starting<\/title>/.test(body), 'and so is the tab');
    assert.ok(!/WeKan is waiting/.test(body), 'with no WeKan left in it (negative)');
  } finally {
    child.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('WeKan keeps that file current, so the name is not the last restart\'s', () => {
  // wekan-control caches it once per start, right after the database comes up.
  // That leaves the case this is for: the name is set in the Admin Panel and the
  // snap is not restarted before the next outage. WeKan is the only thing that
  // knows the moment it changes, so WeKan writes it.
  const cache = read('server/productNameCache.js');
  assert.ok(/process\.env\.SNAP_COMMON/.test(cache) && /\.productname\.txt/.test(cache),
    'the same file the page reads');
  assert.ok(/observeChanges\(/.test(cache), 'updated when the setting changes, not only at startup');
  assert.ok(/if \(!name\) return false;/.test(cache),
    'an empty product name is not written - the pages fall back to WeKan themselves');
  assert.ok(/catch \(error\)/.test(cache),
    'and a read-only $SNAP_COMMON must never stop WeKan from starting');
});

test('the pages wear the migration dashboard\'s colours', () => {
  // The schema-upgrade dashboard and these pages are the same thing to a
  // reader - the product saying what it is doing while it cannot show the app.
  const dashboard = read('server/startupSchemaUpgrade.js');
  for (const token of ['#111', '#7bf']) {
    assert.ok(dashboard.includes(token), `the dashboard still uses ${token}`);
    assert.ok(page.includes(token), `the maintenance page must use ${token} too`);
  }
  assert.ok(/monospace/.test(page), 'including the monospace face');
  assert.ok(!/prefers-color-scheme/.test(page),
    'dark only, as the dashboard is - a half-light page beside it looks like a '
    + 'different product (negative)');
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
