'use strict';

// wekan/wekan#6585, comment 5263643937: "It somehow tries to access Mongodb again
// instead of Ferretdb. I don't even have an old version, but just this" - and the
// screenshot is the #6471 page, "Wekan cannot open the existing database".
// Run: node tests/snapFerretdbNotBlockedByOldMongo.test.cjs
//
// The snap was running on FerretDB with the data in it. The MongoDB files it had
// been migrated FROM were still in $SNAP_COMMON, because the migration never
// deletes them - and two places treated their mere presence as WeKan's problem:
//
//   migration-pending said "a migration is pending" for any $SNAP_COMMON holding
//   WiredTiger files without the .migration-to-ferretdb-done marker, whatever
//   database the snap was actually set to. mongodb-control then handed off to
//   migration-control, which probed those files with every reader the snap has and,
//   when none could open them, wrote .mongodb-data-too-old.
//
//   wekan-control then served the explanatory page for that marker unconditionally -
//   so a site whose database was up and readable was replaced by a page about a
//   database it does not use.
//
// Both now ask what the snap is actually running. "Already on FerretDB" means the
// database SETTING and real data in files/db, not the setting alone: database=
// ferretdb with an empty files/db is exactly the case the migration exists for.
//
// The marker is not deleted - those files really are unreadable by this snap, and if
// the admin switches back to MongoDB the page is right to return - and nothing is
// switched automatically, which is the lesson of #6583. What the page does now is
// SAY that a FerretDB copy is there and give the one command that serves it.

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const wekanControl = read('snap-src/bin/wekan-control');
const mongodbControl = read('snap-src/bin/mongodb-control');

let passed = 0;
const queued = [];
function test(name, fn) { queued.push([name, fn]); }

console.log('snapFerretdbNotBlockedByOldMongo:');

// A $SNAP and a $SNAP_COMMON complete enough to RUN migration-pending: it wants the
// ferretdb binary, node, the importer and ferretdb-has-data present, and it asks
// snapctl for the database setting, so a stub snapctl goes on PATH.
function makeSnap({ database, ferretdbData, mongoData = true, marker = false, migrate = 'on' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-6585-'));
  const snap = path.join(dir, 'snap');
  const common = path.join(dir, 'common');
  fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(common, 'files/db'), { recursive: true });
  fs.writeFileSync(path.join(snap, 'ferretdb'), '#!/bin/sh\n', { mode: 0o755 });
  fs.writeFileSync(path.join(snap, 'bin/node'), '#!/bin/sh\n', { mode: 0o755 });
  fs.writeFileSync(path.join(snap, 'bin/migrate-mongodb-to-ferretdb.mjs'), '');
  fs.copyFileSync(path.join(repoRoot, 'snap-src/bin/ferretdb-has-data'),
                  path.join(snap, 'bin/ferretdb-has-data'));
  // migration-pending asks bin/database-role now (there is no `database`
  // setting), so the real helper goes in beside it and the fixture's files are
  // what it reads.
  fs.copyFileSync(path.join(repoRoot, 'snap-src/bin/database-role'),
                  path.join(snap, 'bin/database-role'));
  if (mongoData) fs.writeFileSync(path.join(common, 'WiredTiger'), 'x');
  if (marker) fs.writeFileSync(path.join(common, '.migration-to-ferretdb-done'), '');
  if (ferretdbData) fs.writeFileSync(path.join(common, 'files/db/wekan.sqlite'), 'x');
  // snapctl, as far as this script is concerned: `snapctl get <key>`.
  const stub = path.join(dir, 'bin');
  fs.mkdirSync(stub);
  fs.writeFileSync(path.join(stub, 'snapctl'),
    `#!/bin/sh\ncase "$2" in\n  database) echo '${database}' ;;\n  migrate) echo '${migrate}' ;;\nesac\n`,
    { mode: 0o755 });
  return { dir, snap, common, stub };
}
function migrationPending(env) {
  const r = spawnSync('bash', [path.join(repoRoot, 'snap-src/bin/migration-pending')], {
    env: { ...process.env, PATH: `${env.stub}:${process.env.PATH}`, SNAP: env.snap, SNAP_COMMON: env.common },
    encoding: 'utf8',
  });
  return r.status;
}

test('migration-pending: a snap already on FerretDB, with data, has nothing pending', () => {
  // The reported state: migrated long ago, marker gone (a forced re-migration, or a
  // snap old enough never to have written one), the old MongoDB files still on disk.
  const env = makeSnap({ database: 'ferretdb', ferretdbData: true, marker: false });
  assert.strictEqual(migrationPending(env), 1,
    'without this the snap probes the old MongoDB files on every start, and when no ' +
    'reader can open them the site is replaced by "cannot open the existing database"');
  fs.rmSync(env.dir, { recursive: true, force: true });
});

test('migration-pending: database=ferretdb with an EMPTY files/db still migrates', () => {
  // This is the case the migration exists for: the setting says FerretDB, the data is
  // still only in MongoDB. Answering "nothing pending" here would strand it.
  const env = makeSnap({ database: 'ferretdb', ferretdbData: false, marker: false });
  assert.strictEqual(migrationPending(env), 0,
    'the setting alone must not be enough to call a migration done');
  fs.rmSync(env.dir, { recursive: true, force: true });
});

test('migration-pending: a FerretDB copy with no migration in progress is migrated', () => {
  // This assertion was the other way around while there was a `database`
  // setting: database=mongodb meant somebody had chosen MongoDB, so a FerretDB
  // copy beside it did not count. There is no setting to choose with any more,
  // and what is left is the data - a FerretDB with content and no checkpoint is
  // a migration that finished. Bringing MongoDB's newer writes across is the
  // MERGE's job (database-autopick --to-ferretdb), not a second migration on
  // top of a database that has been serving.
  const env = makeSnap({ database: 'mongodb', ferretdbData: true, marker: false });
  assert.strictEqual(migrationPending(env), 1,
    'nothing is owed: this is a migrated snap whose marker went missing');
  fs.rmSync(env.dir, { recursive: true, force: true });
});

test('migration-pending: an INTERRUPTED migration is owed, and resumes', () => {
  // The one case a non-empty FerretDB does not mean "done": the importer writes
  // migration-progress.json as it goes and resumes from it, so a checkpoint
  // beside a partial FerretDB is a migration in progress.
  const env = makeSnap({ database: 'mongodb', ferretdbData: true, marker: false });
  fs.writeFileSync(path.join(env.common, 'migration-progress.json'), '{"collections":[]}');
  assert.strictEqual(migrationPending(env), 0,
    'a partial FerretDB must not be mistaken for a finished migration');
  fs.rmSync(env.dir, { recursive: true, force: true });
});

test('migration-pending: the completed marker still ends it, as before', () => {
  const env = makeSnap({ database: 'mongodb', ferretdbData: true, marker: true });
  assert.strictEqual(migrationPending(env), 1);
  fs.rmSync(env.dir, { recursive: true, force: true });
});

test('wekan-control starts WeKan when the marker is about a database it does not use', () => {
  const at = wekanControl.indexOf('SERVING_FERRETDB=false');
  assert.notStrictEqual(at, -1, 'wekan-control has to know which database it is serving');
  const block = wekanControl.slice(at, at + 1200);
  assert.ok(/ferretdb" = "\$DATABASE"/.test(block) && /ferretdb-has-data/.test(block),
    'and that is the SETTING plus real data, not either one alone');
  assert.ok(/elif \[ -f "\$SNAP_COMMON\/\.mongodb-data-too-old" \]; then/.test(block),
    'the page is now the OTHER branch: it is served only when MongoDB is what WeKan needs');
  const pageBranch = block.slice(block.indexOf('elif [ -f'));
  assert.ok(/WEKAN_MAINTENANCE_REASON=data-too-old/.test(pageBranch),
    'and that branch is unchanged for the case it was written for (#6471)');
  assert.ok(!/rm -f "\$SNAP_COMMON\/\.mongodb-data-too-old"/.test(pageBranch),
    'the marker is not deleted on the way past: it is true, and it belongs to MongoDB');
});

test('the marker re-exec in the wait loop cannot spin', () => {
  // The loop re-execs wekan-control when the marker appears mid-wait (#6471). If that
  // loop could run while serving FerretDB, the new "start WeKan normally" branch would
  // send it straight back into the loop, exec after exec, with no sleep between.
  const loopStart = wekanControl.indexOf('elif [ "true" != "${DISABLE_MONGODB}" ]; then');
  const markerReexec = wekanControl.indexOf('the database files are from a MongoDB this snap cannot read');
  assert.ok(loopStart !== -1 && markerReexec > loopStart,
    'the re-exec lives in the MongoDB branch, which is not entered when the snap ' +
    'serves FerretDB - that is what stops it looping');
});

test('mongodb-control still asks migration-pending, and stops for ferretdb right after', () => {
  const pending = mongodbControl.indexOf('bin/migration-pending');
  const stop = mongodbControl.indexOf('bin/database-role")" ]; then');
  assert.ok(pending !== -1 && stop > pending,
    'the order is fine now that migration-pending itself knows about FerretDB: ' +
    'nothing pending, so this falls through to stopping the MongoDB service');
});

// The page module is standalone Node, so what it says can be READ rather than
// asserted about a copy of it.
async function pageOffersFerretdb() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-6585-page-'));
  fs.mkdirSync(path.join(tmp, 'files/db'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.mongodb-data-too-old'), '4.2\n');
  fs.writeFileSync(path.join(tmp, 'files/db/wekan.sqlite'), 'x');
  const port = 18900 + (process.pid % 90);
  const child = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
    env: { ...process.env, SNAP_COMMON: tmp, WEKAN_MAINTENANCE_REASON: 'data-too-old', PORT: String(port) },
    stdio: 'ignore',
  });
  const get = () => new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/' }, res => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
  try {
    let body = null;
    const deadline = Date.now() + 5000;
    while (body === null) {
      try { body = await get(); }
      catch (e) { if (Date.now() > deadline) throw e; await new Promise(r => setTimeout(r, 150)); }
    }
    // The page used to tell the reader to run `snap set wekan database=ferretdb`.
    // There is no such command, and there is nothing to type: with a readable
    // FerretDB copy present the snap SERVES it (bin/database-role), so the page
    // says that rather than asking for a decision.
    assert.ok(/is being served/.test(body),
      'the FerretDB copy that exists is used, not offered');
    assert.ok(!/snap set wekan database=/.test(body),
      'and the removed setting is not printed as advice');
    assert.ok(/keeps trying by itself/.test(body),
      'and the page says the migration retries on its own, since it does');
    assert.ok(/older than the MongoDB\s+data beside it/.test(body),
      'and warn that a migrated copy is only as new as the migration - the #6583 trap');
    assert.ok(/snap revert/.test(body) && /mongodump/.test(body),
      'the two original ways forward stay');
    passed += 1;
    console.log('  ok - the page offers the FerretDB copy that is already there');

    // And without one, the page is exactly what #6471 wrote.
    fs.rmSync(path.join(tmp, 'files/db/wekan.sqlite'));
    const port2 = port + 1;
    const child2 = spawn(process.execPath, [path.join(repoRoot, 'snap-src/bin/wekan-maintenance-page.mjs')], {
      env: { ...process.env, SNAP_COMMON: tmp, WEKAN_MAINTENANCE_REASON: 'data-too-old', PORT: String(port2) },
      stdio: 'ignore',
    });
    try {
      let plain = null;
      const dl2 = Date.now() + 5000;
      while (plain === null) {
        try {
          plain = await new Promise((resolve, reject) => {
            http.get({ host: '127.0.0.1', port: port2, path: '/' }, res => {
              let b = ''; res.on('data', c => { b += c; }); res.on('end', () => resolve(b));
            }).on('error', reject);
          });
        } catch (e) { if (Date.now() > dl2) throw e; await new Promise(r => setTimeout(r, 150)); }
      }
      assert.ok(/two ways forward/i.test(plain) && !/is being served/.test(plain),
        'no FerretDB copy, so the page must not say one is being served - and it ' +
        'must not name a database that is not there');
      passed += 1;
      console.log('  ok - and says nothing about FerretDB when there is no copy to serve');
    } finally { child2.kill(); }
  } finally {
    child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

(async () => {
  for (const [name, fn] of queued) { await fn(); passed += 1; console.log('  ok -', name); }
  await pageOffersFerretdb();
  console.log(`\nsnapFerretdbNotBlockedByOldMongo: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
