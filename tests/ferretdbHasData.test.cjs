'use strict';

// Plain-Node BEHAVIORAL test for snap-src/bin/ferretdb-has-data: the guard the
// snap uses to decide whether a FerretDB (SQLite) database ACTUALLY has data.
// Run: node tests/ferretdbHasData.test.cjs   (needs bash — CI runners are Linux)
//
// This check gates two critical switches, so its semantics must never drift:
//  - migration-control's finish_success refuses to switch the snap to an EMPTY
//    FerretDB after a migration that reported success but wrote nothing;
//  - mongodb-control's failure handler (#6458/#6466) only fails over to a
//    COMPLETED migration ("marker present AND has data"), never to a partial
//    or empty one.
// "Has data" = a *.sqlite file BIGGER THAN 0 BYTES in the directory. The -wal
// sidecar is deliberately NOT required (SQLite removes it on clean shutdown).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const SCRIPT = path.join(repoRoot, 'snap-src/bin/ferretdb-has-data');

function run(dir) {
  return spawnSync('bash', [SCRIPT, dir], { encoding: 'utf8' }).status;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ferretdb-has-data-'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('non-empty .sqlite -> has data (exit 0)', () => {
  const dir = path.join(tmp, 'good');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'SQLite format 3\0');
  assert.strictEqual(run(dir), 0);
});

test('no -wal sidecar required (clean shutdown checkpoints it away)', () => {
  const dir = path.join(tmp, 'no-wal');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'wekan.sqlite'), 'data');
  // deliberately no wekan.sqlite-wal / -shm
  assert.strictEqual(run(dir), 0);
});

test('several files where at least one non-empty .sqlite exists -> exit 0', () => {
  const dir = path.join(tmp, 'multi');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'empty.sqlite'), '');
  fs.writeFileSync(path.join(dir, 'real.sqlite'), 'data');
  assert.strictEqual(run(dir), 0);
});

// --- NEGATIVE: everything a failed/empty migration can leave behind ----------

test('negative: 0-byte .sqlite (failed migration) -> NO data (exit 1)', () => {
  const dir = path.join(tmp, 'zero');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'wekan.sqlite'), '');
  assert.strictEqual(run(dir), 1);
});

test('negative: empty directory -> exit 1', () => {
  const dir = path.join(tmp, 'empty-dir');
  fs.mkdirSync(dir);
  assert.strictEqual(run(dir), 1);
});

test('negative: directory does not exist -> exit 1', () => {
  assert.strictEqual(run(path.join(tmp, 'does-not-exist')), 1);
});

test('negative: only non-.sqlite files (-wal/-shm leftovers) -> exit 1', () => {
  const dir = path.join(tmp, 'sidecars-only');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'wekan.sqlite-wal'), 'data');
  fs.writeFileSync(path.join(dir, 'wekan.sqlite-shm'), 'data');
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'data');
  assert.strictEqual(run(dir), 1);
});

test('negative: a DIRECTORY named x.sqlite is not data -> exit 1', () => {
  const dir = path.join(tmp, 'dir-trap');
  fs.mkdirSync(dir);
  fs.mkdirSync(path.join(dir, 'trap.sqlite'));
  assert.strictEqual(run(dir), 1);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} tests passed`);
