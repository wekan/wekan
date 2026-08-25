'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const restore = path.join(root, 'snap-src', 'bin', 'mongodb-restore');
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-restore-test-'));
  const snap = path.join(dir, 'snap fixture');
  const fakeBin = path.join(snap, 'migratemongo', 'avx');
  fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.writeFileSync(
    path.join(snap, 'bin', 'wekan-read-settings'),
    'MONGODB_BIND_IP=127.0.0.9\nMONGODB_PORT=27099\n',
  );
  const capture = path.join(dir, 'captured.json');
  fs.writeFileSync(
    path.join(fakeBin, 'mongorestore'),
    '#!/bin/bash\nprintf \'%s\\n\' "$@" > "$RESTORE_CAPTURE"\n',
    { mode: 0o755 },
  );
  return { dir, snap, capture };
}

function run(f, args) {
  return spawnSync('bash', [restore, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      SNAP: f.snap,
      SNAP_INSTANCE_NAME: 'wekan',
      RESTORE_CAPTURE: f.capture,
    },
  });
}

test('#6547 restores by replacing existing collections with --drop', () => {
  const f = fixture();
  try {
    const archive = path.join(f.dir, 'backup with spaces.archive');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(
      fs.readFileSync(f.capture, 'utf8').trim().split('\n'),
      [
        '--host',
        '127.0.0.9',
        '--port',
        '27099',
        '-d',
        'wekan',
        '--drop',
        '--gzip',
        `--archive=${archive}`,
      ],
    );
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('negative: a missing argument fails before mongorestore', () => {
  const f = fixture();
  try {
    const result = run(f, []);
    assert.strictEqual(result.status, 2);
    assert.match(result.stderr, /Usage:/);
    assert.strictEqual(fs.existsSync(f.capture), false);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('negative: a nonexistent archive fails before mongorestore', () => {
  const f = fixture();
  try {
    const missing = path.join(f.dir, 'missing.archive');
    const result = run(f, [missing]);
    assert.strictEqual(result.status, 2);
    assert.match(result.stderr, /does not exist or is not a file/);
    assert.strictEqual(fs.existsSync(f.capture), false);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

console.log(`\nsnapDatabaseRestore: all ${passed} tests passed`);
