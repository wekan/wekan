'use strict';

// Plain-Node guard for release-all.yml: every platform the wekan/node fork builds
// a Node.js for gets a WeKan .zip bundle. Run: node tests/releaseBundleCoverage.test.cjs
//
// WeKan takes its Node.js only from the wekan/node fork, for every platform. The
// fork builds 13 platforms; each one must have a bundle here, or a CPU the fork
// went to the trouble of building Node for ships no WeKan. This pins the mapping
// fork-asset -> bundle so a platform cannot silently fall out:
//
//   native jobs (own runner):   amd64  arm64  win64  win32  mac-arm64  mac-x64
//   emulated extra-arch matrix:  s390x ppc64le riscv64 i386 armhf armv7 loong64
//
// The bundle a fork asset feeds:
//   node-x64->amd64  node-arm64->arm64  node-win64.exe->win64
//   node-win32.exe->win32  node-mac-arm64->mac-arm64  node-mac-x64->mac-x64
//   node-<arch>->the extra-arch leg of the same name (node-i386->i386, ...)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── Native bundles: one job each, embedding its own fork asset ───────────────
const NATIVE = [
  { job: 'build-amd64',     fork_asset: 'node-x64'       },
  { job: 'build-arm64',     fork_asset: 'node-arm64'     },
  { job: 'build-win64',     fork_asset: 'node-win64.exe' },
  { job: 'build-win32',     fork_asset: 'node-win32.exe' },
  { job: 'build-mac-arm64', fork_asset: 'node-mac-arm64' },
  { job: 'build-mac-x64',   fork_asset: 'node-mac-x64'   },
];

for (const b of NATIVE) {
  test(`${b.job} exists and embeds the fork's ${b.fork_asset}`, () => {
    const body = job(b.job);
    const re = new RegExp(
      `embed-verified-node\\.sh\\s+\\S*node\\S*\\s+${b.fork_asset.replace('.', '\\.')}\\s`);
    assert.ok(re.test(body),
      `${b.job} must embed the fork's ${b.fork_asset} via embed-verified-node.sh`);
  });
}

// ── Extra-arch bundles: one matrix leg each, node-<arch> from the fork ───────
const EXTRA = ['s390x', 'ppc64le', 'riscv64', 'i386', 'armhf', 'armv7', 'loong64'];

test('the extra-arch matrix has a leg for every fork Linux arch', () => {
  const body = job('build-extra-arches');
  for (const arch of EXTRA) {
    assert.ok(new RegExp(`- arch: ${arch}\\b`).test(body),
      `build-extra-arches must have a "- arch: ${arch}" matrix leg (node-${arch} from the fork)`);
  }
});

// ── The new best-effort natives skip cleanly until the fork publishes them ───
test('win32 and mac-x64 are best-effort: they skip when their fork node is absent', () => {
  for (const [name, asset] of [['build-win32', 'node-win32.exe'], ['build-mac-x64', 'node-mac-x64']]) {
    const body = job(name);
    // A preflight that HEAD-checks the fork asset and sets skip.
    const preflightAt = body.indexOf('Preflight');
    assert.ok(preflightAt !== -1 && body.indexOf(asset, preflightAt) !== -1,
      `${name} must have a preflight that checks the fork's ${asset}`);
    assert.ok(/echo "skip=true" >> "\$GITHUB_OUTPUT"/.test(body),
      `${name} preflight must set skip=true when the fork asset is missing`);
    // Its build steps are gated on the skip, so a skipped run is green, not red.
    const gates = (body.match(/if: steps\.preflight\.outputs\.skip != 'true'/g) || []).length;
    assert.ok(gates >= 6, `${name} must gate its build steps on the preflight skip (found ${gates})`);
  }
});

test('win32 cross-builds ia32 native modules (no 32-bit Windows Node exists to install)', () => {
  const body = job('build-win32');
  // There is NO 32-bit Windows Node 24 to install - setup-node architecture: x86
  // fails with "Unable to find Node version '24' for platform win32 and
  // architecture x86". So the x64 runner Node drives node-gyp, and the modules
  // (bcrypt) are cross-compiled to ia32 via npm_config_arch=ia32, matching the
  // fork's 32-bit node.exe the bundle ships.
  assert.ok(!/architecture:\s*x86/.test(body),
    'build-win32 must NOT ask setup-node for architecture: x86 - no 32-bit Windows Node 24 exists');
  assert.ok(/npm_config_arch:\s*ia32/.test(body),
    'build-win32 must set npm_config_arch: ia32 so node-gyp cross-builds 32-bit native modules');
});

// ── release-notes waits for every bundle so the provenance table is complete ─
test('release-notes needs all six native bundle jobs', () => {
  const body = job('release-notes');
  for (const need of ['build-amd64', 'build-arm64', 'build-win64', 'build-win32',
    'build-mac-arm64', 'build-mac-x64', 'build-extra-arches']) {
    assert.ok(new RegExp(`- ${need}\\b`).test(body),
      `release-notes must list ${need} in needs, or that bundle's provenance row is missing from the table`);
  }
});

console.log(`\nreleaseBundleCoverage: all ${passed} tests passed`);
