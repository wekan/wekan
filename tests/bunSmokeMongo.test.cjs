'use strict';

// v12.56 Bun linux-x64: WeKan stopped with "Topology is closed" - nothing was
// listening on the smoke-test database's 127.0.0.1:27019. The container had
// been started with `docker run -d --rm` and never checked, so it could be
// gone with its log. Now the workflow waits until MongoDB answers (showing the
// container's log if it does not), and build-target.sh checks again right
// before it starts WeKan.
// Run: node tests/bunSmokeMongo.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

(async () => {
  const { hostPortOf, waitForMongo } = await import(path.join(ROOT, 'releases/bun/wait-mongo.mjs'));
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const noSleep = async () => {};

  await test('the host and port come from the URL, 27017 by default', () => {
    assert.deepEqual(hostPortOf('mongodb://127.0.0.1:27019/bun_smoke'), { host: '127.0.0.1', port: 27019 });
    assert.deepEqual(hostPortOf('mongodb://user:pw@db.example/wekan'), { host: 'db.example', port: 27017 });
    assert.deepEqual(hostPortOf('mongodb://[::1]:27019/x'), { host: '::1', port: 27019 });
    assert.equal(hostPortOf('http://127.0.0.1:27019/'), null);
  });

  await test('a database that starts listening is waited for', async () => {
    let tries = 0;
    assert.equal(await waitForMongo('mongodb://127.0.0.1:27019/x', 30, async () => (tries += 1) >= 5, noSleep), true);
    assert.equal(tries, 5);
  });

  await test('negative: a database that never listens fails after the given time', async () => {
    let tries = 0;
    assert.equal(await waitForMongo('mongodb://127.0.0.1:27019/x', 7, async () => { tries += 1; return false; }, noSleep), false);
    assert.equal(tries, 7);
  });

  await test('the workflow waits for MongoDB and keeps the container to show its log', () => {
    const wf = read('.github/workflows/bun.yml');
    const step = wf.slice(wf.indexOf('- name: Start an isolated MongoDB'), wf.indexOf('- name: Native Linux, macOS or Windows build'));
    // 9.0.4: a floating mongo:8 refused to start on the runner's 6.19+ kernel
    // (v12.66); 9.0.4 recognises Ubuntu kernels that have the fix.
    assert.match(step, /docker run -d --name bun-smoke-mongo -p 127\.0\.0\.1:27019:27017 mongo:9\.0\.4$/m);
    const run = step.split('\n').find(l => /docker run /.test(l));
    assert.doesNotMatch(run, /mongo:8\b/, 'negative: not the floating tag that stopped starting');
    assert.doesNotMatch(run, /--rm/, 'negative: a container that dies must leave its log behind');
    assert.match(step, /mongosh --quiet --eval 'db\.runCommand\(\{ ping: 1 \}\)\.ok'/);
    assert.match(step, /docker logs bun-smoke-mongo/);
    assert.match(step, /exit 1/);
  });

  await test('build-target.sh checks the database right before the live smoke', () => {
    const sh = read('releases/bun/build-target.sh');
    const wait = sh.indexOf('node releases/bun/wait-mongo.mjs "$BUN_SMOKE_MONGO_URL"');
    assert(wait > 0, 'the check is there');
    assert(wait < sh.indexOf('node releases/bun/live-smoke.mjs bundle'), 'before WeKan is started');
    assert.match(sh, /docker logs bun-smoke-mongo/);
    // Replaced once, after its log is shown; still unreachable fails the job.
    const recovery = sh.slice(sh.indexOf('docker logs bun-smoke-mongo'));
    assert.match(recovery, /docker rm -f bun-smoke-mongo[\s\S]*docker run -d --name bun-smoke-mongo/);
    assert.match(recovery, /wait-mongo\.mjs "\$BUN_SMOKE_MONGO_URL" 60 \|\| exit 1/, 'negative: a second failure is not hidden');
    assert.doesNotMatch(recovery.split('node releases/bun/live-smoke.mjs')[0], /for |while /, 'negative: no retry loop beyond the one replacement');
  });

  console.log(`bunSmokeMongo: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
