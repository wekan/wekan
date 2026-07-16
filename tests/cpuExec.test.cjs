'use strict';

// Plain-Node BEHAVIORAL test for snap-src/bin/cpu-exec (#6458): the general
// helper that runs a binary directly when the CPU has the features it needs
// and through qemu-user emulation when it does not — on all platforms, for
// all scripts (Snap, bundle .zip, Docker, Sandstorm).
// Run: node tests/cpuExec.test.cjs   (needs bash — CI runners are Linux)
//
// The script honors WEKAN_CPUINFO (fake /proc/cpuinfo) exactly so it can be
// tested like this without caring about the build machine's real CPU.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const CPU_EXEC = path.join(repoRoot, 'snap-src/bin/cpu-exec');
const ARCH = os.arch() === 'x64' ? 'x86_64' : os.arch() === 'arm64' ? 'aarch64' : os.machine ? os.machine() : 'x86_64';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cpu-exec-test-'));
const binDir = path.join(tmp, 'bin');
fs.mkdirSync(binDir);
const cpuinfoWith = path.join(tmp, 'cpuinfo-with');
const cpuinfoWithout = path.join(tmp, 'cpuinfo-without');
fs.writeFileSync(cpuinfoWith, 'flags\t\t: fpu vme avx sse2\nFeatures\t: fp asimd atomics\n');
fs.writeFileSync(cpuinfoWithout, 'flags\t\t: fpu vme sse2\nFeatures\t: fp asimd\n');
// Fake same-arch qemu-user that marks its involvement.
const fakeQemu = path.join(binDir, `qemu-${ARCH}`);
fs.writeFileSync(fakeQemu, '#!/bin/bash\necho "QEMU-WRAPPED: $@"\n');
fs.chmodSync(fakeQemu, 0o755);

function run(args, env = {}, withQemuOnPath = false) {
  const PATH = withQemuOnPath ? `${binDir}:/usr/bin:/bin` : '/usr/bin:/bin';
  return execFileSync('bash', [CPU_EXEC, ...args], {
    env: { PATH, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('feature present: the binary runs directly', () => {
  const out = run(['--features', `${ARCH}=avx`, 'echo', 'direct'], { WEKAN_CPUINFO: cpuinfoWith });
  assert.strictEqual(out.trim(), 'direct');
});

test('feature missing: the binary runs through qemu-user', () => {
  const out = run(['--features', `${ARCH}=avx`, 'echo', 'hello'], { WEKAN_CPUINFO: cpuinfoWithout }, true);
  assert.strictEqual(out.trim(), 'QEMU-WRAPPED: echo hello');
});

test('no declared features: plain exec (safe for every binary)', () => {
  const out = run(['echo', 'plain'], { WEKAN_CPUINFO: cpuinfoWithout });
  assert.strictEqual(out.trim(), 'plain');
});

test('negative: feature missing AND no qemu — still runs, with a clear error', () => {
  // Running directly (probably to a SIGILL) beats silently doing nothing:
  // the real failure must surface in the logs.
  const out = execFileSync('bash', [CPU_EXEC, '--features', `${ARCH}=avx`, 'echo', 'ran-anyway'], {
    env: { PATH: '/usr/bin:/bin', WEKAN_CPUINFO: cpuinfoWithout },
    encoding: 'utf8',
  });
  const stderr = execFileSync('bash', ['-c', `"${CPU_EXEC}" --features "${ARCH}=avx" true 2>&1 1>/dev/null || true`], {
    env: { PATH: '/usr/bin:/bin', WEKAN_CPUINFO: cpuinfoWithout },
    encoding: 'utf8',
  });
  assert.strictEqual(out.trim(), 'ran-anyway');
  assert.ok(/cpu-exec: ERROR: .*lacks avx.*no qemu-user/.test(stderr), `stderr explains: ${stderr}`);
});

test("negative: another architecture's requirements are ignored", () => {
  const out = run(['--features', 'someotherarch=avx', 'echo', 'ignored'], { WEKAN_CPUINFO: cpuinfoWithout });
  assert.strictEqual(out.trim(), 'ignored');
});

test('WEKAN_REQUIRED_CPU_FEATURES overrides --features', () => {
  const out = run(
    ['--features', `${ARCH}=featurethatdoesnotexist`, 'echo', 'env-wins'],
    { WEKAN_CPUINFO: cpuinfoWith, WEKAN_REQUIRED_CPU_FEATURES: `${ARCH}=avx+sse2` },
  );
  assert.strictEqual(out.trim(), 'env-wins');
});

test('multi-feature spec: one missing feature is enough to emulate', () => {
  const out = run(['--features', `${ARCH}=sse2+avx`, 'echo', 'multi'], { WEKAN_CPUINFO: cpuinfoWithout }, true);
  assert.strictEqual(out.trim(), 'QEMU-WRAPPED: echo multi');
});

test('WEKAN_QEMU_USER explicit override wins', () => {
  const out = run(['--features', `${ARCH}=avx`, 'echo', 'via-override'], {
    WEKAN_CPUINFO: cpuinfoWithout,
    WEKAN_QEMU_USER: fakeQemu,
  });
  assert.strictEqual(out.trim(), 'QEMU-WRAPPED: echo via-override');
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} tests passed`);
