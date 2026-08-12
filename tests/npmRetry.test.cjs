'use strict';

// releases/npm-retry.sh, and the rule that every npm install in a release goes
// through it. Run: node tests/npmRetry.test.cjs
//
// The v10.86 release run failed here, in build-amd64:
//
//   npm error code E503
//   npm error 503 Service Unavailable - GET
//   https://github.com/meteor/node-source-map-support/tarball/81bce1f9...
//
// github.com was 503ing for a few minutes. Every architecture is derived from
// the amd64 bundle, so that one minute skipped the entire release - eleven
// bundles, the Docker images, the snap - and it had to be started again by
// hand. Every curl in these workflows already carried `--retry 5`; npm carried
// nothing, and npm's own default is two quick attempts.
//
// Two halves, and the second is the one that keeps it honest: a real npm error
// must NOT be retried. Five attempts at an emulated arm64 install that was
// never going to work is half an hour spent to print the same message.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'releases/npm-retry.sh');
const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('npmRetry:');

// A stand-in for npm: it counts its own runs in a file and fails the first
// `failures` of them with the given output.
function fakeNpm(dir, failures, output) {
  const counter = path.join(dir, 'attempts');
  const fake = path.join(dir, 'fake-npm.sh');
  fs.writeFileSync(fake, [
    '#!/bin/sh',
    `n=$(cat "${counter}" 2>/dev/null || echo 0); n=$((n+1)); echo $n > "${counter}"`,
    `if [ "$n" -le ${failures} ]; then`,
    output.split('\n').map(l => `  echo ${JSON.stringify(l)}`).join('\n'),
    '  exit 1',
    'fi',
    'echo "added 900 packages"',
  ].join('\n') + '\n');
  fs.chmodSync(fake, 0o755);
  return { fake, attempts: () => Number(fs.readFileSync(counter, 'utf8').trim()) };
}

function run(fake, env) {
  return spawnSync('bash', [script, fake], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { NPM_RETRY_SLEEPS: '0' }, env || {}),
  });
}

const E503 = 'npm error code E503\nnpm error 503 Service Unavailable - GET '
  + 'https://github.com/meteor/node-source-map-support/tarball/81bce1f9';

test('a 503 from github.com is retried until it works', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
  const npm = fakeNpm(dir, 2, E503);
  const r = run(npm.fake);
  assert.strictEqual(r.status, 0, 'the command that eventually worked must succeed');
  assert.strictEqual(npm.attempts(), 3, 'it took three attempts');
  assert.ok(/::warning::/.test(r.stdout), 'each retry says so, so the log explains the delay');
});

test('the real npm output is still shown, not swallowed into a file', () => {
  // It is `tee`, not `>log`: an npm install can run for half an hour under
  // emulation and a job that prints nothing for half an hour looks hung.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
  const npm = fakeNpm(dir, 1, E503);
  const r = run(npm.fake);
  assert.ok(r.stdout.includes('npm error code E503'), 'the failed attempt is in the log');
  assert.ok(r.stdout.includes('added 900 packages'), 'and so is the successful one');
});

test('a real npm error is NOT retried (negative)', () => {
  for (const output of [
    'npm error code ERESOLVE\nnpm error ERESOLVE unable to resolve dependency tree',
    'npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/nope',
    'gyp ERR! build error\nmake: *** [bcrypt.target.mk] Error 1',
  ]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
    const npm = fakeNpm(dir, 99, output);
    const r = run(npm.fake);
    assert.strictEqual(r.status, 1, 'it fails');
    assert.strictEqual(npm.attempts(), 1,
      `must not retry: ${output.split('\n')[0]}`);
    assert.ok(/::error::.*not for a network reason/.test(r.stdout),
      'and it says why it is not retrying, so nobody re-runs the job hoping');
  }
});

test('an outage that outlasts the attempts fails the job, with the reason', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
  const npm = fakeNpm(dir, 99, E503);
  const r = run(npm.fake, { NPM_RETRY_ATTEMPTS: '3' });
  assert.strictEqual(r.status, 1);
  assert.strictEqual(npm.attempts(), 3, 'exactly the attempts it was given');
  assert.ok(/::error::.*outage/.test(r.stdout),
    'the error must name the outage, not blame WeKan');
});

test('the socket errors count as transient too', () => {
  for (const output of [
    'npm error network socket hang up',
    'npm error errno ECONNRESET\nnpm error network request to https://registry.npmjs.org failed',
    'npm error code ETIMEDOUT',
    'npm error 429 Too Many Requests - GET https://registry.npmjs.org/tar',
    'fatal: the remote end hung up unexpectedly\nnpm error command git clone',
  ]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
    const npm = fakeNpm(dir, 1, output);
    const r = run(npm.fake);
    assert.strictEqual(r.status, 0, `must retry: ${output.split('\n')[0]}`);
    assert.strictEqual(npm.attempts(), 2);
  }
});

test('every npm install in the release goes through it', () => {
  // The point of failure was ONE unretried npm install. A second one left bare
  // is the same release lost to the same outage.
  const bare = [];
  workflow.split('\n').forEach((line, i) => {
    if (/^\s*#/.test(line)) return;
    if (!/\bnpm (install|pack|ci)\b/.test(line)) return;
    if (line.includes('npm-retry.sh')) return;
    // node-addon-api is installed best-effort with `|| true`; failing it does
    // not fail the build, so a retry has nothing to save.
    if (line.includes('|| true')) return;
    bare.push(`${i + 1}: ${line.trim()}`);
  });
  assert.deepStrictEqual(bare, [],
    'these npm commands can lose a release to a five-minute outage');
});

test('the containers can reach the script that retries for them', () => {
  // Two of these installs run inside `docker run`, where the repository is not
  // present unless it is mounted. A call to /releases/npm-retry.sh in a
  // container without that mount is a "No such file" in the middle of a build.
  const mounts = workflow.split('\n')
    .filter(l => l.includes('/releases:/releases:ro')).length;
  const uses = workflow.split('\n')
    .filter(l => / \/releases\/npm-retry\.sh/.test(l)).length;  // container path, not $GITHUB_WORKSPACE
  assert.ok(mounts >= uses,
    `every in-container use of npm-retry.sh needs the mount: ${uses} uses, ${mounts} mounts`);
  const repack = fs.readFileSync(path.join(repoRoot, 'releases/repack-bundle-for-arch.sh'), 'utf8');
  assert.ok(repack.includes('/releases:/releases:ro'),
    'Release All Missing repacks through the same container, and inherits the retry');
});

test('the Meteor installer is downloaded before it is run, so it can be retried', () => {
  // `curl https://install.meteor.com/ | sh` cannot be retried: by the time the
  // download fails, sh is already running half a script.
  assert.ok(!/curl\s+https:\/\/install\.meteor\.com\/\s*\|\s*sh/.test(workflow),
    'a piped installer is one more unretried download in the same job');
  // It goes through releases/fetch.sh now, like every other download here -
  // see tests/releaseDownloads.test.cjs for what that adds over `curl --retry`.
  assert.ok(/fetch\.sh"? -o \/tmp\/install-meteor\.sh https:\/\/install\.meteor\.com\//.test(workflow),
    'it is fetched by the helper that waits out an outage');
});

console.log(`\nnpmRetry: ${passed} tests passed`);
