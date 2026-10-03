'use strict';
// A continuous-backup SQLite restore applied on the next restart (maintainer
// decision of 2026-10-03): server/lib/continuousBackup/restore.js stages a
// checked wekan.sqlite in <db>/continuous-restore and writes RESTORE_REQUESTED
// "continuous"; each startup script, before FerretDB opens its files, keeps
// the live database in continuous-restore/replaced and copies the staged one
// in. This runs each script's REAL restore block in a sandbox directory.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { stageSqliteRestore } = require('../server/lib/continuousBackup/restore');

const root = path.join(__dirname, '..');
const SCRIPTS = [
  ['releases/ferretdb/wekan-entrypoint.sh', 'FERRETDB_SQLITE_DIR'],
  ['releases/ferretdb/start-wekan.sh', 'FERRETDB_SQLITE_DIR'],
  ['snap-src/bin/ferretdb-control', 'SQLITE_DIR'],
];
const sandbox = () => fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools', 'tmp'), 'restart-restore-'));

// The script's own lines, from reading the request to the end of the restore.
function restoreBlock(rel) {
  const lines = fs.readFileSync(path.join(root, rel), 'utf8').split('\n');
  const start = lines.findIndex(line => /_restore_mode="\$\{WEKAN_FORCE_RESTORE:-\}"/.test(line));
  const end = lines.findIndex((line, i) => i > start && /#6492 safety/.test(line));
  assert.ok(start > 0 && end > start, `${rel}: restore block not found`);
  return lines.slice(start, end).join('\n');
}
function run(rel, variable, dir, env = {}) {
  return execFileSync('sh', ['-c', `${restoreBlock(rel)}\n`], { env: { PATH: process.env.PATH, [variable]: dir, ...env },
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
const events = dir => fs.readFileSync(path.join(dir, 'recovery-events.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));

for (const [rel, variable] of SCRIPTS) {
  test(`${rel}: a staged continuous restore replaces the live database, keeping it first`, async t => {
    const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'live database');
    fs.writeFileSync(path.join(dir, 'wekan.sqlite-wal'), 'live wal');
    const built = path.join(dir, 'built.sqlite'); fs.writeFileSync(built, 'restored database');
    await stageSqliteRestore({ file: built, database: 'wekan', sqliteDir: dir });
    assert.equal(fs.readFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'utf8'), 'continuous\n');
    run(rel, variable, dir);
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'restored database');
    assert.equal(fs.existsSync(path.join(dir, 'wekan.sqlite-wal')), false, 'a stale WAL never meets the restored file');
    assert.equal(fs.readFileSync(path.join(dir, 'continuous-restore', 'replaced', 'wekan.sqlite'), 'utf8'), 'live database');
    assert.equal(fs.readFileSync(path.join(dir, 'continuous-restore', 'replaced', 'wekan.sqlite-wal'), 'utf8'), 'live wal');
    assert.equal(fs.existsSync(path.join(dir, 'RESTORE_REQUESTED')), false);
    assert.equal(events(dir).at(-1).type, 'restore-continuous');
  });

  test(`${rel}: NEGATIVE - a continuous request with nothing staged changes nothing and stays`, async t => {
    const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'live database');
    fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'continuous\n');
    try { run(rel, variable, dir); } catch (error) { /* the scripts may report on stderr */ }
    assert.equal(fs.readFileSync(path.join(dir, 'wekan.sqlite'), 'utf8'), 'live database');
    assert.equal(fs.existsSync(path.join(dir, 'RESTORE_REQUESTED')), true, 'the request is kept for a retry');
    assert.equal(events(dir).at(-1).type, 'manual-required');
  });
}

test('NEGATIVE staging: only wekan, an unknown directory, or a pending request are refused', async t => {
  const dir = sandbox(); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const built = path.join(dir, 'built.sqlite'); fs.writeFileSync(built, 'x');
  await assert.rejects(stageSqliteRestore({ file: built, database: 'local', sqliteDir: dir }), /Only the wekan database/);
  await assert.rejects(stageSqliteRestore({ file: built, database: 'wekan', sqliteDir: null }), /unknown/);
  await assert.rejects(stageSqliteRestore({ file: built, database: 'wekan', sqliteDir: 'relative' }), /unknown/);
  fs.writeFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'backup\n');
  await assert.rejects(stageSqliteRestore({ file: built, database: 'wekan', sqliteDir: dir }), /already requested/);
  assert.equal(fs.readFileSync(path.join(dir, 'RESTORE_REQUESTED'), 'utf8'), 'backup\n', 'another request is never overwritten');
  assert.equal(fs.existsSync(path.join(dir, 'continuous-restore')), false);
});
