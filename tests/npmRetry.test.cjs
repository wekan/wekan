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

test('every npm install in a script a workflow runs goes through it too', () => {
  // The test above read only release-all.yml, so a bare install one level down
  // passed it: v13.03's Sandstorm .spk died on a 504 from github.com inside
  // releases/sandstorm-slim-spk.sh, and the Android bundle had the same line.
  // So read every releases/ script any workflow names, and the scripts those
  // name in turn.
  const wfDir = path.join(repoRoot, '.github/workflows');
  const seen = new Set();
  const queue = [];
  // Only command lines name a script that runs: a commented-out `scp` of one
  // does not run it.
  const scan = text => {
    const code = text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
    for (const m of code.matchAll(/releases\/[\w./-]+\.sh\b/g)) {
      const rel = m[0];
      if (!seen.has(rel) && fs.existsSync(path.join(repoRoot, rel))) { seen.add(rel); queue.push(rel); }
    }
  };
  fs.readdirSync(wfDir).filter(f => /\.ya?ml$/.test(f))
    .forEach(f => scan(fs.readFileSync(path.join(wfDir, f), 'utf8')));
  const bare = [];
  while (queue.length) {
    const rel = queue.shift();
    const text = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    scan(text);
    text.split('\n').forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      if (!/\bnpm (install|ci)\b/.test(line)) return;
      if (line.includes('npm-retry.sh')) return;
      if (line.includes('|| true')) return;          // best-effort, as above
      if (/\bgrep\b/.test(line)) return;               // looking for the line, not running it
      if (/^\s*(echo|printf)\b|"[^"]*\bnpm (install|ci)\b[^"]*"\s*(>&2|;|\)|$)/.test(line) && !/\(cd /.test(line)) return; // a message, not a command
      bare.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.ok(seen.has('releases/sandstorm-slim-spk.sh'), 'the Sandstorm pack script is among the scripts read');
  assert.deepStrictEqual(bare, [],
    'these npm commands, run by a workflow, can lose a release to a five-minute outage');
});

test('npm-retry.sh is given a program, never a shell function of the caller', () => {
  // npm-retry.sh is a new bash with set -u. A function of the script that
  // calls it reaches it only through export -f, and the variables that
  // function reads do not: v13.04's Android bundles all died with
  // "environment: node: unbound variable" when build-bundle.sh handed it its
  // npm() { "$node" "$npm_cli" ...; }. So, for every releases/ script, no
  // function it defines is the command it gives npm-retry.sh.
  const dir = path.join(repoRoot, 'releases');
  const scripts = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (/\.sh$/.test(e.name)) scripts.push(p);
  });
  walk(dir);
  const bad = [];
  for (const file of scripts) {
    const text = fs.readFileSync(file, 'utf8');
    const functions = [...text.matchAll(/^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/gm)].map(m => m[1]);
    text.split('\n').forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      const m = /npm-retry\.sh"?\s+"?([^\s"]+)/.exec(line);
      if (m && functions.includes(m[1])) bad.push(`${path.relative(repoRoot, file)}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(bad, [], 'npm-retry.sh runs these as a program in a new bash, where the function has no variables');
  // The Android installs still go through it, as the program they are.
  const android = fs.readFileSync(path.join(dir, 'android/build-bundle.sh'), 'utf8');
  assert.strictEqual((android.match(/npm-retry\.sh" "\$node" "\$npm_cli" install/g) || []).length, 2,
    'both Android npm installs are retried, given Android\'s node and npm-cli.js');
});

test('a caller\'s function in npm-retry.sh fails as it did, and its program works', () => {
  // The failure itself, so the rule above has a reason a test shows: a
  // function exported with export -f reaches npm-retry.sh, its variable does not.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmretry-'));
  const prog = path.join(dir, 'fake-npm');
  fs.writeFileSync(prog, '#!/bin/sh\necho "installed $*"\n', { mode: 0o755 });
  // The paths go in through the environment, never into the script text
  // (CodeQL alert #601, js/shell-command-injection-from-environment): a
  // temporary directory with a quote, `$(` or a backtick would change it.
  // NODE_BIN is not node_bin, so npm-retry.sh's bash still lacks the variable.
  const run = body => spawnSync('bash', ['-c', `set -u; node_bin="$NODE_BIN"; npm() { "$node_bin" "$@"; }; export -f npm; ${body}`],
    { encoding: 'utf8', env: { ...process.env, NPM_RETRY_SLEEPS: '0', NODE_BIN: prog, NPM_RETRY_SCRIPT: script } });
  const viaFunction = run('bash "$NPM_RETRY_SCRIPT" npm install');
  assert.notStrictEqual(viaFunction.status, 0, 'the function, without its variable, fails');
  assert.match(viaFunction.stdout + viaFunction.stderr, /node_bin: unbound variable/);
  const viaProgram = run('bash "$NPM_RETRY_SCRIPT" "$node_bin" install');
  assert.strictEqual(viaProgram.status, 0, viaProgram.stdout + viaProgram.stderr);
  assert.match(viaProgram.stdout, /installed install/);
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
