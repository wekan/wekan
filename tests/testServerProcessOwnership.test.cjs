"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const temporary = path.join(root, '.tools/tmp');
fs.mkdirSync(temporary, { recursive: true });
const fixture = fs.mkdtempSync(path.join(temporary, 'server-process-ownership-'));
try {
  const program = "require('node:fs').writeFileSync(process.env.PIDFILE, String(process.pid)); setInterval(() => {}, 1000);\n";
  fs.writeFileSync(path.join(fixture, 'main.js'), program);
  const mockMongo = path.join(fixture, 'mock-mongod');
  fs.writeFileSync(mockMongo, `#!${process.execPath}\n${program}`, { mode: 0o755 });
  const launches = [
    source.match(/\{ echo "===== mongod :\$TEST_DB_PORT[\s\S]*?wekan-test-mongod\.log" 2>&1 &/)[0],
    source.match(/\{ echo "===== WeKan test server \[bundle node[\s\S]*?wekan-test-server\.log" 2>&1 &/)[0],
  ];
  for (const [index, launch] of launches.entries()) {
    const pidFile = path.join(fixture, `pid-${index}`);
    const result = spawnSync('bash', ['-c', `
${launch}
owned=$!
trap 'kill "$owned" 2>/dev/null || true; wait "$owned" 2>/dev/null || true' EXIT
for attempt in {1..100}; do [ -s "$PIDFILE" ] && break; sleep 0.02; done
[ -s "$PIDFILE" ] || exit 1
read -r actual < "$PIDFILE" || true
[ "$owned" = "$actual" ] || { echo "recorded:$owned actual:$actual"; exit 2; }
echo "owned:$owned"
`], { encoding: 'utf8', timeout: 8000, env: {
      ...process.env, TMPDIR: temporary, PIDFILE: pidFile,
      RUN_LOGDIR: fixture, MONGOD_BIN: mockMongo, TEST_DB_PORT: '3001', DBPATH: fixture,
      NODE_BIN: process.execPath, BUNDLE_DIR: fixture, TEST_NODE_OPTIONS: '',
      TEST_MONGO_URL: 'mongodb://127.0.0.1:3001/meteor', WRITABLE_ABS: fixture,
    } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /owned:\d+/, 'record the actual server PID, not a disposable shell');
  }
  // The production harness must continue to leave reused MongoDB unowned.
  assert.match(source, /MONGOD_PID=""/);
  assert.match(source, /Reusing the MongoDB already listening/);
  console.log('test server process ownership: MongoDB and Node PIDs survive shell exec; reused MongoDB remains unowned');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
