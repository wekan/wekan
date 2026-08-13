'use strict';

// #6471: a snap upgrade onto a database this snap cannot read must STOP and say so,
// not serve 502 Bad Gateway forever.
//
// WHAT HAPPENED. The snap bundles MongoDB 7 (the server) and the MongoDB 3.2 tools
// (to read a 6.09-era database), and nothing in between. A database left by a
// MongoDB 4.x / 5.x snap opens in neither: mongod 7 exits with
//
//   This version of MongoDB is too recent to start up on the existing data files.
//   Try MongoDB 4.2 or earlier.
//
// and the 3.2 tools cannot open 4.x files either. The code then did the one thing
// that cannot work: migration-control handed back to mongodb-control, mongodb-control
// started mongod, mongod failed the same way, mongodb-control re-ran the migration
// (three times, by its own counter), and after that the service simply exited 1 and
// snapd restarted it. The site served 502 the whole time and the explanation was in
// `snap logs` for whoever thought to look.
//
// WHAT IT DOES NOW. Nothing that is retried can succeed - reading those files needs a
// binary the snap does not carry - so the snap stops, leaves every byte untouched,
// and answers the web port with a page that says what happened and the two ways
// forward. The version mongod itself named as still able to read the data is carried
// through to the page, so it is specific rather than general.
//
// Run: node tests/snapOldMongoData.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const migration = read('snap-src/bin/migration-control');
const mongodb = read('snap-src/bin/mongodb-control');
const wekan = read('snap-src/bin/wekan-control');
const page = read('snap-src/bin/wekan-maintenance-page.mjs');

const MARKER = '.mongodb-data-too-old';
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('#6585: a reader that fails prints its OWN error, not just "could not open"', () => {
  // The report (comment 5276581923) is three lines that say everything except
  // what went wrong:
  //
  //   mongod 7 could not open the data; trying the bundled mongod 5.0 ...
  //   mongod 7 could not open the data; trying the bundled mongod 4.2 ...
  //   The database files were made by an older MongoDB (MongoDB 4.2 or earlier
  //   can still read them).
  //
  // Every reader was tried, each said something, and none of it was shown - so
  // the answer ended up recommending the version that had just failed.
  assert.ok(/^reader_failed\(\)/m.test(migration), 'there is one helper for it');
  const fn = migration.slice(migration.indexOf('reader_failed() {'));
  assert.ok(/tail -n \d+ "\$LOGF"/.test(fn.slice(0, 400)),
    'and it prints the tail of the reader log, which is where the reason is');
  for (const reader of ['mongod 7', 'mongod 5.0', 'mongod 4.2']) {
    assert.ok(migration.includes(`reader_failed "${reader}"`),
      `${reader}'s failure must be shown before the next reader is tried`);
  }
  // The only place that wording survives is the comment quoting the report.
  const code = migration.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert.ok(!/mongod 7 could not open the data; trying the bundled/.test(code),
    'and the copied line that blamed mongod 7 for every reader is gone');
});

test('#6585: it does not send you after a reader it already ran', () => {
  const fn = migration.slice(migration.indexOf('stop_data_too_old() {'),
                             migration.indexOf('# Last resort when the data'));
  assert.ok(/case "\$can" in/.test(fn) && /HAS a reader for MongoDB \$can/.test(fn),
    'when mongod 7 names a version this snap carries, the message says it was tried');
  assert.ok(/--repair/.test(fn), 'and names the usual next step for files that are damaged');
  assert.ok(/mongodb\.com\/try\/download\/community/.test(fn) && /fastdl\.mongodb\.org/.test(fn),
    'with somewhere to GET an old MongoDB - "it would be good to provide a source '
    + 'for them" is the other half of the report');
  assert.ok(/on a COPY of/.test(fn),
    'and the copy-first warning, because --repair on the original is how data is lost');
});

console.log('snapOldMongoData:');

test('migration-control tells "no reader for this vintage" from "unreadable"', () => {
  // Only the first has a definite answer and no useful retry. The second - genuinely
  // corrupt data, say - still goes back to mongodb-control as before.
  assert.ok(/mongod_says_data_too_old\(\)\s*\{/.test(migration),
    'it must detect the case from mongod\'s own words');
  assert.ok(/too recent to start up on the existing data files/.test(migration),
    'by the exact line mongod prints');
  const branch = migration.slice(migration.indexOf('if mongod_says_data_too_old; then'));
  assert.ok(/stop_data_too_old/.test(branch.slice(0, 200)),
    'and stop there instead of handing back a mongod that cannot start');
  assert.ok(/fall_back_to_mongodb "Data is not readable as modern MongoDB or MongoDB 3\.x/.test(migration),
    'while genuinely unreadable data still falls back to MongoDB as before');
});

test('it records WHICH MongoDB can still read the files, from mongod itself', () => {
  assert.ok(migration.includes('Try MongoDB ') && migration.includes('or earlier'),
    "the version is parsed out of mongod's own line, not guessed");
  assert.ok(/data_too_old_can_read\(\)[\s\S]{0,300}sed -n/.test(migration),
    'by reading the probe log rather than assuming a version');
  assert.ok(migration.includes('> "$SNAP_COMMON/' + MARKER + '"'),
    'and written to the marker the other two scripts read');
});

test('it changes nothing and stops cleanly, rather than failing into a restart', () => {
  const fn = migration.slice(migration.indexOf('stop_data_too_old() {'),
                             migration.indexOf('# Last resort when the data'));
  // It used to be `snapctl set migrate=off`, which was permanent: nothing ever
  // turned it back on, so an instance parked here stayed on MongoDB for good.
  // "No retry can change that" is true of THIS snap and false of the next one -
  // the 4.2 reader was added for databases already given up on, and the 5.0
  // reader after it. The retry record makes a NEW REVISION try again by itself.
  assert.ok(/record_retry/.test(fn),
    'the attempt is recorded so a later snap, with a reader this one lacks, retries');
  assert.ok(!/snapctl set migrate=off/.test(fn),
    'and it is not parked for good');
  assert.ok(/exit 0/.test(fn),
    'and it exits 0 - snapd restarts a failing service forever, and no restart can help here');
  assert.ok(!/rm -rf|rm -f "\$DBPATH|discard_partial_ferretdb/.test(fn),
    'nothing is deleted: the source data must be exactly as it was');
});

test('mongodb-control does not start a mongod that is known to fail', () => {
  const at = mongodb.indexOf(MARKER);
  assert.notStrictEqual(at, -1, 'mongodb-control reads the marker');
  // Window widened for #6471: the refusal is now preceded by the staleness check
  // that lets a NEW revision retry, so the block being asserted on starts further
  // up. The behaviour asserted below is unchanged.
  const block = mongodb.slice(at, at + 2600);
  assert.ok(/exit 0/.test(block), 'and exits 0 rather than looping through snapd restarts');
  // The marker check must come BEFORE mongod is started, or the loop is unchanged.
  assert.ok(mongodb.indexOf(MARKER) < mongodb.indexOf('handle_mongod_start_failure'),
    'the check is before the start-failure handling it replaces');
  assert.ok(/snap revert/.test(block) && /mongodump|dump the data/.test(block),
    'and the log says both ways forward');
  // #6471: ...but only when the marker is about THIS revision. A marker written
  // by an older snap, which had fewer readers, must not stop this one trying -
  // that is what made 10.81 behave exactly like 10.79 for the reporter.
  assert.ok(/stale-marker" "\$MONGODB_DATA_TOO_OLD"/.test(block),
    'the refusal must first ask whether the marker is even about this snap');
});

test('wekan-control serves the page instead of waiting for a database that is not coming', () => {
  assert.ok(/WEKAN_MAINTENANCE_REASON=data-too-old/.test(wekan),
    'wekan-control runs the page with the data-too-old reason');
  // Before WeKan is started and before the database wait, so a fresh start goes
  // straight to the page rather than waiting for a database that is not coming.
  // (Compared against the maintenance-mode `if`, not its comment, which is the
  // first mention of that file in the script.)
  assert.ok(wekan.indexOf(`if [ -f "$SNAP_COMMON/${MARKER}" ]`) > -1,
    'wekan-control checks the marker');
  assert.ok(wekan.indexOf(`if [ -f "$SNAP_COMMON/${MARKER}" ]`)
          < wekan.indexOf('if [ -f "$SNAP_COMMON/.wekan-maintenance" ]'),
    'and does so at the top, before anything else can start');
  assert.ok(wekan.indexOf(`if [ -f "$SNAP_COMMON/${MARKER}" ]`)
          < wekan.indexOf('still cannot connect to MongoDB'),
    'well before the database wait it replaces');
  // ...and inside the wait loop, so a WeKan already waiting switches over without a
  // restart, the same way it already notices a finished FerretDB migration.
  const loop = wekan.slice(wekan.indexOf('MongoDB not ready yet') - 2000, wekan.indexOf('MongoDB not ready yet'));
  assert.ok(loop.includes(MARKER), 'and inside the wait loop');
});

// The page module is standalone Node with no dependencies, so it can be RUN here:
// what this checks is the text an admin actually sees, not a copy of it. It is
// async, so it runs after the synchronous checks above and reports at the end.
async function pageSaysIt() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-6471-'));
  fs.writeFileSync(path.join(tmp, MARKER), '4.2\n');
  const port = 18000 + (process.pid % 900);
  const child = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
    env: { ...process.env, SNAP_COMMON: tmp, WEKAN_MAINTENANCE_REASON: 'data-too-old', PORT: String(port) },
    stdio: 'ignore',
  });
  const get = () => new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/b/board' }, res => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
  try {
    let res = null;
    const deadline = Date.now() + 5000;
    while (!res) {
      try { res = await get(); }
      catch (e) { if (Date.now() > deadline) throw e; await new Promise(r => setTimeout(r, 150)); }
    }
    const { status, body } = res;
    assert.strictEqual(status, 503, 'a stopped service answers 503, not 200');
    assert.ok(/cannot open the existing database/.test(body), 'it says what happened');
    assert.ok(/MongoDB 4\.2 or earlier/.test(body),
      'and names the version mongod said can still read the files');
    assert.ok(/untouched/.test(body), 'and that the data was not changed');
    assert.ok(/snap revert/.test(body), 'the first way forward: go back to what worked');
    assert.ok(/mongodump/.test(body), 'the second: move the data across');
    assert.ok(/ttachments and avatars/.test(body), 'and that files on disk are unaffected');
    // A stop, not a wait: no auto-refresh and no spinner, both of which promise that
    // something is happening in the background.
    assert.ok(!/http-equiv="refresh"/.test(body), 'no auto-refresh: nothing is being retried');
    assert.ok(!/class="spin"/.test(body), 'and no spinner for the same reason');
    passed += 1;
    console.log('  ok - the page says what happened, that nothing changed, and both ways forward');
  } finally {
    child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test('mongod 4.2 is bundled for amd64 and arm64, and only used to READ', () => {
  // #6471's actual repair: a third reader. mongod 7 opens FCV 6.0/7.0, the 3.2
  // tools open 3.2, and everything between was unreadable - which is the whole
  // bug. mongod 4.2 opens FCV 4.0 and 4.2, the vintage that was reported.
  const snapcraft = read('snapcraft.yaml');
  const at = snapcraft.indexOf('    mongo42:');
  assert.notStrictEqual(at, -1, 'snapcraft.yaml has a mongo42 part');
  const part = snapcraft.slice(at, snapcraft.indexOf('\n    wekan:', at));

  assert.ok(/mongodb-linux-\$\{MARCH\}-ubuntu1804-\$\{V\}\.tgz/.test(part),
    'it downloads the MongoDB 4.2 server');
  assert.ok(/amd64\) MARCH=x86_64/.test(part) && /arm64\) MARCH=aarch64/.test(part),
    'for amd64 and arm64');
  assert.ok(/\*\)\s*\n\s*echo "mongo42: no MongoDB 4\.2 for/.test(part),
    'and skips every other architecture, which never had a MongoDB to migrate from');

  // The checksum MongoDB publishes is checked, and a mismatch does not ship.
  assert.ok(/sha256sum "\$work\/\$tgz"/.test(part), 'the download is checksummed');
  assert.ok(/checksum mismatch[\s\S]{0,120}exit 0/.test(part),
    'and a mismatch stages nothing');

  // OpenSSL 1.1: core24 has 3, and mongod 4.2 will not even load without it.
  assert.ok(/libssl1\\?\.1_/.test(part), 'it fetches libssl1.1');
  assert.ok(/libssl\.so\.1\.1/.test(part) && /libcrypto\.so\.1\.1/.test(part),
    'and stages both shared objects it needs');
  assert.ok(/sort -V \| tail -1/.test(part),
    'resolving the filename from the pool rather than pinning a version that rots');
  assert.ok((part.match(/pool\/(updates\/)?main\/o\/openssl/g) || []).length >= 3,
    'from more than one archive, so one going away is not the end of it');

  // It must RUN in the build, not merely exist.
  assert.ok(/LD_LIBRARY_PATH="\$dest\/lib" "\$dest\/bin\/mongod" --version/.test(part),
    'the build runs the staged binary once, so a missing library is found here');
  // CHANGED DELIBERATELY: it used to require `rm -rf "$dest"`, and removing the
  // DIRECTORY is what ended the whole snap build - `stage: mongo42` names that
  // path, and snapcraft fails on a filter whose path is missing rather than
  // skipping it. The give-up still unstages the binary; it just leaves the empty
  // directory behind for the filter to copy. migration-control guards every use
  // on `-x "$M42/bin/mongod"`, so an empty one still means "no 4.2 reader".
  assert.ok(/does not run in this environment[\s\S]{0,300}rm -rf "\$\{dest:\?\}"\/\*/.test(part),
    'and unstages it rather than shipping something that cannot start');

  // Optional by design: a failure must not fail the snap.
  assert.ok((part.match(/exit 0/g) || []).length >= 4,
    'every failure path ends the part cleanly, leaving the snap buildable');
});

test('the migration tries the readers newest-first, and 4.2 uses the driver importer', () => {
  const m = read('snap-src/bin/migration-control');
  const seven = m.indexOf('Checking whether mongod 7 can open the existing data');
  // The wording changed when each reader started printing its own error
  // (#6585): the line now names the reader being TRIED, not the one that failed.
  const four = m.indexOf('Trying the bundled mongod 4.2');
  const three = m.indexOf('Checking whether it is MongoDB 3.x');
  const stop = m.indexOf('stop_data_too_old\n');
  assert.ok(seven > -1 && four > -1 && three > -1, 'all three probes are there');
  assert.ok(seven < four && four < three,
    'newest first: mongod 7, then 4.2, then the 3.2 tools');
  // There are two ways the third reader can fail to produce a database, and both
  // stop with the page - so "the first mongod_says_data_too_old comes after the 3.x
  // probe" is no longer the way to check it (comment 5264028470). The reader can be
  // ABSENT, which is decided just before the probe, or it can RUN and refuse, which
  // is decided just after; neither is reachable until mongod 7 and mongod 4.2 have
  // both failed, which is what this is really about.
  const toolsMissing = m.indexOf('if [ ! -x "$MM/bin/mongod" ]');
  assert.ok(four < toolsMissing && toolsMissing < three,
    'the "no 3.x reader on this architecture" stop sits between the 4.2 probe and ' +
    'the 3.x one - after both other readers have failed, before a probe it cannot run');
  assert.ok(m.indexOf('if mongod_says_data_too_old; then', three) > three,
    'and a 3.x reader that runs and refuses stops and explains as well');

  // The 4.2 branch reads with the DRIVER importer: the bundled mongodb driver
  // supports servers from 4.2 up, so the same importer that reads a 6/7 source
  // reads this one - no second copy of that code.
  const branch = m.slice(four, three);
  assert.ok(/"\$NODE" "\$IMPORTER_MODERN"/.test(branch),
    'the 4.x branch uses the modern (driver) importer');
  assert.ok(/M42_LIB/.test(branch),
    'and runs mongod 4.2 with its own OpenSSL 1.1 on LD_LIBRARY_PATH');
  // And it must NOT hand back to a mongod 7 that cannot open this data either.
  assert.ok(/fail_3x_keep_progress "\$rc"/.test(branch),
    'a failed 4.x migration keeps its progress instead of falling back to a mongod that cannot start');
});

test('the other two maintenance pages are unchanged', () => {
  // The generic and the recovery pages are WAITS - something is happening and the
  // page should refresh - so they keep the refresh and the spinner this one drops.
  assert.ok(/IS_RECOVERY \? 'Recovering data'/.test(page), 'recovery wording still there');
  assert.ok(/is under maintenance/.test(page), 'and the generic one');
  assert.ok(/IS_DATA_TOO_OLD \? "" : '<meta http-equiv="refresh"/.test(page),
    'the refresh is dropped only for the data-too-old page');
});

// ── comment 5264028470: a MongoDB 3.x database on an architecture with no 3.x
// reader. "It turns out the mongodb version on my installation was even older. It
// was running on mongodb 3.2, this is why your 4.2 check was not doing anything."
// Their site never showed this page at all - it waited for MongoDB forever.
test('a missing 3.x reader is an answer, not a reason to hand back to mongod', () => {
  // The migratemongo 3.2 tools are staged for amd64 only (MongoDB published no 3.2
  // build for anything else), so on arm64 a MongoDB 3.x database has no reader in
  // this snap at all. That went to fall_back_to_mongodb, which starts the mongod 7
  // that has ALREADY refused these files - the crash loop this issue is about.
  const at = migration.indexOf('if [ ! -x "$MM/bin/mongod" ]');
  assert.notStrictEqual(at, -1, 'the tools check is still there');
  const branch = migration.slice(at, at + 700);
  assert.ok(/if mongod_says_data_too_old; then/.test(branch),
    'a missing reader and an unreadable database are not the same thing, and only ' +
    'the mongod-said-too-old half has a definite answer');
  assert.ok(branch.indexOf('stop_data_too_old') < branch.indexOf('fall_back_to_mongodb'),
    'so that half stops with the page');
  assert.ok(/fall_back_to_mongodb "Migration tools unavailable/.test(branch),
    'while the other half still hands back to MongoDB, which may yet serve');
  assert.ok(/uname -m/.test(branch),
    'and the log says which architecture is missing the reader, since that is the ' +
    'part an admin cannot see');
});

// The steps on the page are the reporter's own successful recipe, in this snap's
// paths - they had to work it out themselves. Step 3 is the one that is expensive to
// get wrong: another admin copied the old database files back into a RUNNING data
// directory and mongod aborted, taking the restored database with it.
async function pageGivesTheRecipe() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-6471-steps-'));
  fs.writeFileSync(path.join(tmp, MARKER), '3.6\n');
  const port = 18500 + (process.pid % 400);
  const child = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
    env: { ...process.env, SNAP_COMMON: tmp, WEKAN_MAINTENANCE_REASON: 'data-too-old', PORT: String(port) },
    stdio: 'ignore',
  });
  try {
    let body = null;
    const deadline = Date.now() + 5000;
    while (body === null) {
      try {
        body = await new Promise((resolve, reject) => {
          http.get({ host: '127.0.0.1', port, path: '/' }, res => {
            let b = ''; res.on('data', c => { b += c; }); res.on('end', () => resolve(b));
          }).on('error', reject);
        });
      } catch (e) { if (Date.now() > deadline) throw e; await new Promise(r => setTimeout(r, 150)); }
    }
    assert.ok(/mongodump --archive=wekan\.archive --gzip/.test(body),
      'the dump command, not a description of one');
    assert.ok(body.includes(tmp),
      'and this snap\'s own data directory, so the paths can be copied as they are');
    assert.ok(/database-restore/.test(body),
      'the snap restores from an archive itself; an admin should not have to find mongorestore');
    assert.ok(/Do NOT copy those database files back/.test(body),
      'the step that cost somebody their restored database has to be spelled out');
    assert.ok(/Leave\s+<code>files\/<\/code>/.test(body),
      'while attachments and avatars DO have to be kept');
    passed += 1;
    console.log('  ok - the page gives the four steps, in this snap\'s paths');
  } finally {
    child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

pageSaysIt().then(pageGivesTheRecipe).then(() => {
  console.log(`\nsnapOldMongoData: ${passed} tests passed`);
}).catch(err => {
  console.error('  FAIL -', err.message);
  process.exitCode = 1;
});
