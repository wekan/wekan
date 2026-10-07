'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const restore = path.join(root, 'snap-src', 'bin', 'mongodb-restore');
const backup = path.join(root, 'snap-src', 'bin', 'mongodb-backup');
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// db: undefined = no db-eval in the snap (older layout); 'up' = answers at
// once; 'after-start' = answers once snapctl started a service; 'never' =
// never answers, failing the way #6746's reporter saw.
function fixture({ db } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-restore-test-'));
  const snap = path.join(dir, 'snap fixture');
  const common = path.join(dir, 'common');
  const fakeBin = path.join(snap, 'migratemongo', 'avx');
  const hostBin = path.join(dir, 'host-bin');
  fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(common, { recursive: true });
  fs.mkdirSync(hostBin, { recursive: true });
  for (const name of ['database-ready', 'database-role']) {
    fs.copyFileSync(path.join(root, 'snap-src', 'bin', name), path.join(snap, 'bin', name));
  }
  fs.writeFileSync(
    path.join(snap, 'bin', 'wekan-read-settings'),
    'MONGODB_BIND_IP=127.0.0.9\nMONGODB_PORT=27099\n',
  );
  const capture = path.join(dir, 'captured.json');
  const snapctlLog = path.join(dir, 'snapctl.log');
  const started = path.join(dir, 'started');
  for (const tool of ['mongorestore', 'mongodump']) {
    fs.writeFileSync(
      path.join(fakeBin, tool),
      `#!/bin/bash\nprintf '%s\\n' ${tool} "$@" > "$RESTORE_CAPTURE"\n`,
      { mode: 0o755 },
    );
  }
  if (db) {
    const answers = { up: 'true', 'after-start': '[ -f "$DB_STARTED" ]', never: 'false' }[db];
    fs.writeFileSync(
      path.join(snap, 'bin', 'db-eval'),
      '#!/bin/bash\n' +
      `if ${answers}; then exit 0; fi\n` +
      'echo "db-eval ping: connection(127.0.0.9:27099[-62]) unable to write wire message to network: write tcp 127.0.0.1:53014->127.0.0.9:27099: write: permission denied" >&2\n' +
      'exit 1\n',
      { mode: 0o755 },
    );
  }
  fs.writeFileSync(
    path.join(hostBin, 'snapctl'),
    '#!/bin/bash\nprintf \'%s\\n\' "$*" >> "$SNAPCTL_LOG"\ntouch "$DB_STARTED"\n',
    { mode: 0o755 },
  );
  return { dir, snap, common, hostBin, capture, snapctlLog, started };
}

function run(f, args, script = restore) {
  return spawnSync('bash', [script, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${f.hostBin}:${process.env.PATH}`,
      SNAP: f.snap,
      SNAP_COMMON: f.common,
      SNAP_INSTANCE_NAME: 'wekan',
      SNAP_NAME: 'wekan',
      RESTORE_CAPTURE: f.capture,
      SNAPCTL_LOG: f.snapctlLog,
      DB_STARTED: f.started,
      WEKAN_DB_READY_TIMEOUT: '0',
    },
  });
}

function captured(f) {
  return fs.readFileSync(f.capture, 'utf8').trim().split('\n');
}

function snapctlCalls(f) {
  return fs.existsSync(f.snapctlLog) ? fs.readFileSync(f.snapctlLog, 'utf8').trim().split('\n') : [];
}

function withFixture(opts, fn) {
  const f = fixture(opts);
  try { fn(f); } finally { fs.rmSync(f.dir, { recursive: true, force: true }); }
}

test('#6547 restores by replacing existing collections with --drop', () => {
  const f = fixture();
  try {
    const archive = path.join(f.dir, 'backup with spaces.archive');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(
      captured(f),
      [
        'mongorestore',
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

test('#6746 restore starts the stopped FerretDB service before mongorestore', () => {
  withFixture({ db: 'after-start' }, (f) => {
    const archive = path.join(f.dir, 'wekan.backup');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 0, result.stderr);
    // A fresh FerretDB snap: no MongoDB files, so the data is FerretDB's.
    assert.deepStrictEqual(snapctlCalls(f), ['start --enable wekan.ferretdb']);
    assert.match(result.stdout, /wekan\.ferretdb answers on 127\.0\.0\.9:27099/);
    assert.strictEqual(captured(f)[0], 'mongorestore');
  });
});

test('#6746 restore starts MongoDB instead while a migration is still owed', () => {
  withFixture({ db: 'after-start' }, (f) => {
    fs.writeFileSync(path.join(f.common, 'WiredTiger'), 'mongo files');
    const archive = path.join(f.dir, 'wekan.backup');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(snapctlCalls(f), ['start --enable wekan.mongodb']);
  });
});

test('#6746 a database that already answers is not restarted', () => {
  withFixture({ db: 'up' }, (f) => {
    const archive = path.join(f.dir, 'wekan.backup');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(snapctlCalls(f), []);
    assert.strictEqual(captured(f)[0], 'mongorestore');
  });
});

test('negative #6746: a database that never answers stops restore with the reason', () => {
  withFixture({ db: 'never' }, (f) => {
    const archive = path.join(f.dir, 'wekan.backup');
    fs.writeFileSync(archive, 'fixture');
    const result = run(f, [archive]);
    assert.strictEqual(result.status, 1);
    assert.strictEqual(fs.existsSync(f.capture), false, 'mongorestore must not run');
    assert.match(result.stderr, /wekan\.ferretdb\) does not answer on 127\.0\.0\.9:27099/);
    assert.match(result.stderr, /write: permission denied/, 'the driver error must be shown');
    assert.match(result.stderr, /security policy/, 'permission denied must be explained');
    assert.match(result.stderr, /sudo snap logs -n 100 wekan\.ferretdb/);
  });
});

test('#6746 backup starts the database and dumps it; negative: not when it never answers', () => {
  withFixture({ db: 'after-start' }, (f) => {
    const archive = path.join(f.dir, 'out with spaces.backup');
    const result = run(f, [archive], backup);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(snapctlCalls(f), ['start --enable wekan.ferretdb']);
    assert.deepStrictEqual(captured(f), [
      'mongodump', '--host', '127.0.0.9', '--port', '27099', '-d', 'wekan', '--gzip',
      `--archive=${archive}`,
    ]);
  });
  withFixture({ db: 'never' }, (f) => {
    const result = run(f, [path.join(f.dir, 'x.backup')], backup);
    assert.strictEqual(result.status, 1);
    assert.strictEqual(fs.existsSync(f.capture), false, 'mongodump must not run');
    assert.match(result.stderr, /sudo snap logs -n 100 wekan\.ferretdb/);
  });
});

test('negative #6746: no snap database tool connects before database_ready', () => {
  for (const [file, tool] of [[restore, 'mongorestore'], [backup, 'mongodump']]) {
    const text = fs.readFileSync(file, 'utf8');
    const ready = text.indexOf('database_ready "$MONGODB_BIND_IP" "$MONGODB_PORT" || exit 1');
    const call = text.search(new RegExp(`^${tool} `, 'm'));
    assert.ok(ready > 0 && call > ready, `${path.basename(file)} must wait for the database before ${tool}`);
  }
});

console.log(`\nsnapDatabaseRestore: all ${passed} tests passed`);
