'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'snap-src', 'bin', 'config'), 'utf8');
const reader = fs.readFileSync(
  path.join(root, 'snap-src', 'bin', 'wekan-read-settings'),
  'utf8',
);
const control = fs.readFileSync(
  path.join(root, 'snap-src', 'bin', 'wekan-control'),
  'utf8',
);

const start = control.indexOf('# Use user-provided MONGO_URL');
const end = control.indexOf('# #6503/#6480/#6481', start);
assert.ok(start >= 0 && end > start, 'MONGO_URL selection block must exist');
const selection = control.slice(start, end);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function evaluateSelection(env) {
  const result = spawnSync(
    'bash',
    ['-c', `${selection}\nprintf '%s\\n%s\\n' "$MONGO_URL" "$MONGO_OPLOG_URL"`],
    { encoding: 'utf8', env: { ...process.env, ...env } },
  );
  assert.strictEqual(result.status, 0, result.stderr);
  return result.stdout.trim().split('\n').slice(-2);
}

test('#6543 Snap exposes mongo-url as MONGO_URL', () => {
  assert.match(config, /KEY_MONGO_URL='mongo-url'/);
  assert.match(config, /\bMONGO_URL\b/);
  assert.match(reader, /export \$key="\$\{!default_value\}"/);
  assert.match(reader, /export \$key="\$value"/);
});

test('#6543 a configured external database URL survives startup unchanged', () => {
  const external = 'mongodb://127.0.0.1/wekan2';
  const [url, oplog] = evaluateSelection({
    MONGO_URL: external,
    MONGO_OPLOG_URL: 'mongodb://127.0.0.1/local',
    MONGODB_BIND_IP: '127.0.0.1',
    MONGODB_PORT: '27019',
    MONGODB_BIND_UNIX_SOCKET: '',
    DATABASE: 'mongodb',
  });
  assert.strictEqual(url, external);
  assert.strictEqual(oplog, 'mongodb://127.0.0.1/local');
});

test('negative: only an empty setting receives the local default', () => {
  const [url, oplog] = evaluateSelection({
    MONGO_URL: '',
    MONGO_OPLOG_URL: '',
    MONGODB_BIND_IP: '127.0.0.1',
    MONGODB_PORT: '27019',
    MONGODB_BIND_UNIX_SOCKET: '',
    DATABASE: 'mongodb',
  });
  assert.strictEqual(url, 'mongodb://127.0.0.1:27019/wekan');
  assert.strictEqual(
    oplog,
    'mongodb://127.0.0.1:27019/local?replicaSet=rs0',
  );
});

test('the setting reader imports an exact mongo-url value from snapctl', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-mongo-url-test-'));
  try {
    const snap = path.join(dir, 'snap');
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
    fs.mkdirSync(bin);
    fs.copyFileSync(path.join(root, 'snap-src', 'bin', 'config'), path.join(snap, 'bin', 'config'));
    fs.copyFileSync(
      path.join(root, 'snap-src', 'bin', 'wekan-read-settings'),
      path.join(snap, 'bin', 'wekan-read-settings'),
    );
    fs.writeFileSync(
      path.join(bin, 'snapctl'),
      '#!/bin/sh\n[ "$2" = mongo-url ] && printf %s "mongodb://db.example/wekan2"\n',
      { mode: 0o755 },
    );
    const result = spawnSync(
      'bash',
      ['-c', 'source "$SNAP/bin/wekan-read-settings" >/dev/null; printf %s "$MONGO_URL"'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          SNAP: snap,
          SNAP_INSTANCE_NAME: 'wekan',
          PATH: `${bin}:${process.env.PATH}`,
        },
      },
    );
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout, 'mongodb://db.example/wekan2');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\nsnapExternalMongoUrl: all ${passed} tests passed`);
