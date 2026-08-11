'use strict';

// #6471 — "Snap 10.79 This version of MongoDB is too recent to start up on the
// existing data files. Try MongoDB 4.2 or earlier.", reopened against 10.81:
//
//   "on 10.81 I still have the exact same issue, MongoDB cannot start. The web
//    interface is still unreachable, and I do not see the messages you added in
//    the last commits."
//
// Run: node tests/snapStaleMarker.test.cjs
//
// The 4.2 reader added for this issue was present in their snap and never ran,
// because TWO MARKERS IN $SNAP_COMMON WERE PERMANENT:
//
//   .mongodb-data-too-old    written when no reader in the snap could open the
//                            data. mongodb-control then refuses to start mongod
//                            at all, and wekan-control serves an explanatory page
//                            instead of WeKan.
//   .mongod-start-failures   a counter; past three, mongodb-control stops
//                            re-running the migration so a migration<->mongod
//                            restart loop cannot form.
//
// Both are right and both record a conclusion about what THAT SNAP could do. An
// instance that failed on 10.79 or 10.80 - before the 4.2 reader existed - kept a
// marker saying "no reader can open this" and a counter far past three, so 10.81
// never started mongod, never ran the migration, and printed none of the new
// messages. Upgrading to the version with the fix changed nothing, which is
// exactly what their log shows: the database selection line, then "Waiting for
// MongoDB replica set primary..." forever.
//
// A NEW REVISION IS A NEW CHANCE. Each marker records the revision that wrote it;
// when the running revision differs it is stale and the snap tries again. Within
// one revision nothing changes - the loop protection and the refusal both still
// hold - so this does not reintroduce the loop they exist to prevent.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const helper = path.join(repoRoot, 'snap-src/bin/stale-marker');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const mongodbControl = read('snap-src/bin/mongodb-control');
const wekanControl = read('snap-src/bin/wekan-control');
const migrationControl = read('snap-src/bin/migration-control');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const run = (args, revision) =>
  spawnSync('bash', [helper, ...args], {
    env: { ...process.env, SNAP_REVISION: revision === undefined ? '' : String(revision) },
  }).status;
const isStale = (marker, revision) => run([marker], revision) === 0;
const stamp = (marker, revision) => run(['--stamp', marker], revision);

function withMarker(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-marker-'));
  const marker = path.join(dir, '.mongodb-data-too-old');
  try { return fn(marker, dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('the helper exists, is executable and parses', () => {
  assert.ok(fs.existsSync(helper), 'snap-src/bin/stale-marker is missing');
  assert.ok(fs.statSync(helper).mode & 0o111, 'it must be executable');
  assert.strictEqual(spawnSync('bash', ['-n', helper]).status, 0);
});

test('the reported case: a marker written by an older revision is stale', () => {
  withMarker(marker => {
    fs.writeFileSync(marker, '4.2\n');
    stamp(marker, 3449);                       // the revision that gave up
    assert.strictEqual(isStale(marker, 3500), true,
      'a newer revision may have readers the old one did not - which is the whole ' +
      'of this issue');
  });
});

test('within the SAME revision the marker still holds', () => {
  withMarker(marker => {
    fs.writeFileSync(marker, '4.2\n');
    stamp(marker, 3500);
    assert.strictEqual(isStale(marker, 3500), false,
      'or the loop protection and the "do not start mongod on data it cannot ' +
      'read" refusal would both be gone');
  });
});

test('a marker from before this mechanism is stale by definition', () => {
  withMarker(marker => {
    fs.writeFileSync(marker, '4.2\n');          // no companion revision file
    assert.strictEqual(isStale(marker, 3500), true,
      'that is precisely the marker the affected instances are carrying - written ' +
      'by a snap that did not record revisions');
  });
});

test('not knowing the revision is never treated as evidence it changed', () => {
  withMarker(marker => {
    fs.writeFileSync(marker, '4.2\n');
    stamp(marker, 3449);
    assert.strictEqual(isStale(marker, undefined), false,
      'outside a snap there is no SNAP_REVISION; the marker must be honoured ' +
      'rather than cleared on a guess');
  });
});

test('no marker is not stale, and stamping without a revision does nothing', () => {
  withMarker((marker, dir) => {
    assert.strictEqual(isStale(marker, 3500), false, 'nothing to be stale about');
    stamp(marker, undefined);
    assert.strictEqual(fs.existsSync(`${marker}.revision`), false,
      'a revision file with no revision in it would make every marker look current');
    assert.ok(fs.existsSync(dir));
  });
});

// ── the three places that consult it ────────────────────────────────────────

test('mongodb-control retries when the "too old" marker is from another revision', () => {
  assert.ok(/stale-marker" "\$MONGODB_DATA_TOO_OLD"/.test(mongodbControl),
    'the refusal to start mongod must ask whether the marker is even about this snap');
  const at = mongodbControl.indexOf('stale-marker" "$MONGODB_DATA_TOO_OLD"');
  const after = mongodbControl.slice(at, at + 400);
  assert.ok(/rm -f "\$MONGODB_DATA_TOO_OLD"/.test(after),
    'and clear it, so the run proceeds normally rather than being skipped again');
  assert.ok(/mongod-start-failures/.test(after),
    'and clear the failure counter with it - an instance that gave up on an older ' +
    'revision has both, and leaving one of them latched fixes nothing');
});

test('the failure counter is per revision, not per installation', () => {
  const at = mongodbControl.indexOf('local fails=0');
  const body = mongodbControl.slice(at, at + 700);
  assert.ok(/! bash "\$SNAP\/bin\/stale-marker" "\$MONGOD_FAIL_COUNT_FILE"/.test(body),
    'a count from another revision must not be carried forward');
  assert.ok(/stale-marker" --stamp "\$MONGOD_FAIL_COUNT_FILE"/.test(body),
    'and the count that is written has to record which revision it belongs to');
});

test('a mongod that DOES start still clears the counter completely', () => {
  assert.ok(/rm -f "\$MONGOD_FAIL_COUNT_FILE" "\$\{MONGOD_FAIL_COUNT_FILE\}\.revision"/.test(mongodbControl),
    'success clears both files, or the next failure would inherit a revision stamp ' +
    'with no counter');
});

test('the marker records the revision that wrote it', () => {
  assert.ok(/stale-marker" --stamp "\$SNAP_COMMON\/\.mongodb-data-too-old"/.test(migrationControl),
    'migration-control writes the marker, so it is what must stamp it');
  const write = migrationControl.indexOf("printf '%s\\n' \"$can\" >");
  const stampAt = migrationControl.indexOf('--stamp "$SNAP_COMMON/.mongodb-data-too-old"');
  assert.ok(write !== -1 && stampAt > write, 'stamped after it is written');
});

test('wekan-control does not keep serving the page on a stale marker', () => {
  assert.ok(/stale-marker" "\$SNAP_COMMON\/\.mongodb-data-too-old"/.test(wekanControl),
    'this service can start before mongodb-control, so it has to make the same ' +
    'judgement rather than serving "too old for this snap" on a snap that has ' +
    'not tried yet');
  const at = wekanControl.indexOf('stale-marker" "$SNAP_COMMON/.mongodb-data-too-old"');
  const page = wekanControl.indexOf('DATABASE TOO OLD FOR THIS SNAP');
  assert.ok(at !== -1 && at < page, 'and check before it decides to serve it');
});

test('the helper ships in the snap', () => {
  const snapcraft = read('snapcraft.yaml');
  assert.ok(/helpers:\s*\n\s*source: snap-src\s*\n\s*plugin: dump/.test(snapcraft),
    'snap-src is dumped wholesale, which is what puts bin/stale-marker in $SNAP/bin');
});

console.log(`\n${passed} passed`);
