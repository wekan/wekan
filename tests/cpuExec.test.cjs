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
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const CPU_EXEC = path.join(repoRoot, 'snap-src/bin/cpu-exec');
// cpu-exec checks `uname -m`, so the test must use the same architecture token.
// On Linux arm64 that is usually `aarch64`; on macOS it is `arm64`.
const ARCH = execFileSync('uname', ['-m'], { encoding: 'utf8' }).trim();

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cpu-exec-test-'));
const binDir = path.join(tmp, 'bin');
fs.mkdirSync(binDir);
// A PATH with exactly the tools cpu-exec and these tests use - and no qemu.
// `/usr/bin:/bin` is not that: a machine with qemu-user installed (any host that
// runs foreign-arch containers) has /usr/bin/qemu-<arch>, so the "no qemu" case
// silently became the "qemu found" case and the suite failed there.
const cleanBin = path.join(tmp, 'clean-bin');
fs.mkdirSync(cleanBin);
for (const tool of ['echo', 'true', 'grep', 'uname', 'dirname', 'cat', 'bash']) {
  for (const dir of ['/usr/bin', '/bin']) {
    const real = path.join(dir, tool);
    if (fs.existsSync(real)) {
      try { fs.symlinkSync(real, path.join(cleanBin, tool)); } catch (_) { /* first wins */ }
      break;
    }
  }
}
const NO_QEMU_PATH = cleanBin;
const cpuinfoWith = path.join(tmp, 'cpuinfo-with');
const cpuinfoWithout = path.join(tmp, 'cpuinfo-without');
fs.writeFileSync(cpuinfoWith, 'flags\t\t: fpu vme avx sse2\nFeatures\t: fp asimd atomics\n');
fs.writeFileSync(cpuinfoWithout, 'flags\t\t: fpu vme sse2\nFeatures\t: fp asimd\n');
// Fake same-arch qemu-user that marks its involvement.
const fakeQemu = path.join(binDir, `qemu-${ARCH}`);
fs.writeFileSync(fakeQemu, '#!/bin/bash\necho "QEMU-WRAPPED: $@"\n');
fs.chmodSync(fakeQemu, 0o755);

function run(args, env = {}, withQemuOnPath = false) {
  const PATH = withQemuOnPath ? `${binDir}:${NO_QEMU_PATH}` : NO_QEMU_PATH;
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
  // qemu-user opens the file it is given and does NOT search PATH, so cpu-exec
  // resolves the command first: a bare name would reach qemu as a relative path
  // that does not exist, and qemu would exit 1 without running anything.
  assert.match(out.trim(), /^QEMU-WRAPPED: \S*\/echo hello$/,
    `qemu must be handed an absolute path, got: ${out.trim()}`);
});

test('an absolute path is handed to qemu-user unchanged', () => {
  const echoPath = ['/usr/bin/echo', '/bin/echo'].find(p => fs.existsSync(p));
  const out = run(['--features', `${ARCH}=avx`, echoPath, 'hi'], { WEKAN_CPUINFO: cpuinfoWithout }, true);
  assert.strictEqual(out.trim(), `QEMU-WRAPPED: ${echoPath} hi`);
});

test('no declared features: plain exec (safe for every binary)', () => {
  const out = run(['echo', 'plain'], { WEKAN_CPUINFO: cpuinfoWithout });
  assert.strictEqual(out.trim(), 'plain');
});

test('negative: feature missing AND no qemu — still runs, with a clear error', () => {
  // Running directly (probably to a SIGILL) beats silently doing nothing:
  // the real failure must surface in the logs.
  const result = spawnSync('bash', [CPU_EXEC, '--features', `${ARCH}=avx`, 'echo', 'ran-anyway'], {
    env: { PATH: NO_QEMU_PATH, WEKAN_CPUINFO: cpuinfoWithout },
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(result.stdout.trim(), 'ran-anyway');
  assert.ok(/cpu-exec: ERROR: .*lacks avx.*no qemu-user/.test(result.stderr),
    `stderr explains: ${result.stderr}`);
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
  // The resolved path, for the same reason as above: qemu-user cannot open a
  // bare command name.
  assert.match(out.trim(), /^QEMU-WRAPPED: \S*\/echo multi$/, `got: ${out.trim()}`);
});

test('WEKAN_QEMU_USER explicit override wins', () => {
  const out = run(['--features', `${ARCH}=avx`, 'echo', 'via-override'], {
    WEKAN_CPUINFO: cpuinfoWithout,
    WEKAN_QEMU_USER: fakeQemu,
  });
  assert.match(out.trim(), /^QEMU-WRAPPED: \S*\/echo via-override$/, `got: ${out.trim()}`);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} tests passed`);
