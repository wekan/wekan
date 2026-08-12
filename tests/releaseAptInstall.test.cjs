'use strict';

// releases/apt-install.sh, and the rule that a release job installs packages
// through it. Run: node tests/releaseAptInstall.test.cjs
//
// The v10.87 `bump` job died on a repository the release does not use:
//
//   E: Failed to fetch https://dl.google.com/linux/chrome-stable/deb/dists/stable/main/binary-amd64/Packages.gz
//      Hash Sum mismatch
//   E: Some index files failed to download.
//   Error: Process completed with exit code 100.
//
// It was installing python3 and curl. A GitHub runner ships with google-chrome,
// microsoft-prod, azure-cli and docker repositories configured, and `apt-get
// update` fails as a WHOLE when any one of them serves an index that does not
// match its own hashes - which is what a mirror looks like mid-republish.
//
// Two ways out, in order: wait (it passes a minute later), then drop the
// third-party lists, because everything a release job installs comes from the
// distribution archive. Both are in the script; this pins them.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'releases/apt-install.sh');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseAptInstall:');

// A fake apt-get that fails `update` the first `failures` times, and a fake
// sudo that RECORDS what it was asked to do rather than doing it - these tests
// must not touch this machine's apt state.
function fakeApt(dir, failures) {
  const counter = path.join(dir, 'updates');
  const log = path.join(dir, 'sudo.log');
  fs.writeFileSync(path.join(dir, 'apt-get'), [
    '#!/bin/sh',
    'if [ "$1" = update ]; then',
    `  n=$(cat "${counter}" 2>/dev/null || echo 0); n=$((n+1)); echo $n > "${counter}"`,
    `  if [ "$n" -le ${failures} ]; then`,
    '    echo "E: Failed to fetch https://dl.google.com/linux/chrome-stable/... Hash Sum mismatch" >&2',
    '    exit 100',
    '  fi',
    '  echo "Reading package lists... Done"; exit 0',
    'fi',
    'if [ "$1" = install ]; then echo "INSTALLED $*"; exit 0; fi',
  ].join('\n') + '\n', { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'sudo'), [
    '#!/bin/sh',
    `echo "$@" >> "${log}"`,
    'case "$1" in',
    // Anything that would change this machine is recorded and not run; the
    // apt-get calls go to the fake above.
    '  rm|mv|mkdir|sh) exit 0 ;;',
    'esac',
    'exec "$@"',
  ].join('\n') + '\n', { mode: 0o755 });
  return {
    updates: () => Number(fs.readFileSync(counter, 'utf8').trim()),
    sudo: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : ''),
  };
}

function run(dir, packages, env) {
  return spawnSync('bash', [script].concat(packages), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, {
      PATH: `${dir}:${process.env.PATH}`,
      APT_SLEEPS: '0',
    }, env || {}),
  });
}

test('a Hash Sum mismatch is waited out, and the packages install', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apt-'));
  const apt = fakeApt(dir, 2);
  const r = run(dir, ['python3', 'curl']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(apt.updates(), 3, 'it retried twice and then succeeded');
  assert.ok(/INSTALLED install -y python3 curl/.test(r.stdout),
    'and installed exactly what it was asked for');
  assert.ok(/::warning::/.test(r.stdout), 'the log says why the job paused');
});

test('the index is cleared between attempts, not just re-read', () => {
  // A Hash Sum mismatch is a CACHED index that disagrees with the server; apt
  // will keep reporting it until the stale lists are gone.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apt-'));
  const apt = fakeApt(dir, 1);
  run(dir, ['curl']);
  assert.ok(/rm -rf \/var\/lib\/apt\/lists/.test(apt.sudo()),
    'the stale lists are removed before retrying');
});

test('a repository the release does not use is dropped, not fatal', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apt-'));
  const apt = fakeApt(dir, 3);       // fails every attempt, succeeds after the drop
  // Pointed at a temp directory: the real one belongs to whatever machine this
  // suite runs on, and a test must not move its package sources.
  const sources = path.join(dir, 'sources.list.d');
  fs.mkdirSync(sources);
  fs.writeFileSync(path.join(sources, 'google-chrome.list'), 'deb https://dl.google.com/... stable main\n');
  const r = run(dir, ['python3'], { APT_ATTEMPTS: '3', APT_SOURCES_DIR: sources });
  assert.strictEqual(r.status, 0, 'the packages still install');
  assert.ok(/sources\.list\.d/.test(apt.sudo()),
    'the third-party lists are moved aside');
  assert.ok(/::warning::.*third-party/.test(r.stdout),
    'and the log says so - a silent change of package sources would be worse');
});

test('a mirror that never comes back fails the job, saying so (negative)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apt-'));
  fakeApt(dir, 99);
  const r = run(dir, ['python3'], { APT_ATTEMPTS: '2' });
  assert.strictEqual(r.status, 100);
  assert.ok(/::error::.*outage at the mirror, not WeKan/.test(r.stdout),
    'the error must not read as a WeKan failure');
});

test('every release job installs packages through it', () => {
  const bare = [];
  for (const file of ['.github/workflows/release-all.yml',
    '.github/workflows/release-all-missing.yml',
    '.github/workflows/sandstorm.yml', '.github/workflows/sandstorm-store.yml',
    '.github/workflows/meteor-spk.yml', '.github/workflows/Flatpak.yml',
    'releases/install-node-for-arch.sh']) {
    read(file).split('\n').forEach((line, i) => {
      if (/^\s*#/.test(line.trim())) return;
      if (!/apt-get (update|install)/.test(line)) return;
      if (line.includes('apt-install.sh')) return;
      // install-node-for-arch.sh probes for an optional qemu package and
      // carries on without it; that one is allowed to fail.
      if (/\|\| /.test(line) || /\/dev\/null/.test(line)) return;
      bare.push(`${file}:${i + 1}: ${line.trim().slice(0, 70)}`);
    });
  }
  assert.deepStrictEqual(bare, [],
    'a bare apt-get update fails the job when any configured repository is mid-update');
});

console.log(`\nreleaseAptInstall: ${passed} tests passed`);
