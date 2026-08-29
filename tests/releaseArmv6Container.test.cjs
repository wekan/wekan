'use strict';

// Guard: the armv6 bundle is assembled in a userland its own Node.js can run in,
// and the base-image preflight compares the ARM VARIANT rather than just "arm".
// Run: node tests/releaseArmv6Container.test.cjs
//
// What this pins, from the v10.80 release run:
//
//   qemu-arm: Could not open '/lib/ld-linux-armhf.so.3': No such file or directory
//   install-node-for-arch.sh: the Node.js binary for armv6 does not run in a
//   armv6 container.
//
// The matrix asked for `platform: linux/arm/v6` against `debian:trixie`. DEBIAN
// HAS NO ARMv6 PORT - that image publishes arm/v5 and arm/v7 only - and
// containerd treats a LOWER ARM variant as compatible, so the request quietly
// resolved to arm/v5: Debian armel, ARMv5 SOFT-float, which has no hard-float
// loader in it at all. node-armv6 is hard-float, so it could not start, and the
// job found out 400 lines in, after the whole apt install.
//
// Two things went wrong and both are checked here:
//   1. The preflight (check-arch-binaries.sh) matched on `"architecture": "arm"`
//      and ignored the variant, so "debian:trixie has no linux/arm/v6" was never
//      the answer it gave.
//   2. armv6 was pointed at a platform that does not exist. It is built in
//      Debian's arm/v7 (armhf) container instead: same hard-float ABI, same
//      loader, so node-armv6 runs. Nothing ARMv7 reaches the bundle - the
//      container's npm install compiles nothing, and node/ferretdb/the MongoDB
//      tools are all downloaded already built for ARMv6 - EXCEPT the bundled
//      qemu-user, which is copied out of the container, and is therefore gated.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');
const preflight = fs.readFileSync(
  path.join(repoRoot, 'releases/check-arch-binaries.sh'), 'utf8');
const installNode = fs.readFileSync(
  path.join(repoRoot, 'releases/install-node-for-arch.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The platforms debian:trixie actually publishes, as `docker manifest inspect`
// reports them. arm/v6 is deliberately absent: that is the fact this is about.
const DEBIAN_TRIXIE = new Set([
  'linux/386', 'linux/amd64', 'linux/arm/v5', 'linux/arm/v7', 'linux/arm64',
  'linux/ppc64le', 'linux/riscv64', 'linux/s390x',
]);

// The build-extra-arches matrix entries, read out of the workflow text.
function matrixEntries() {
  const start = workflow.indexOf('\n  build-extra-arches:\n');
  assert.notStrictEqual(start, -1, 'release-all.yml has no build-extra-arches job');
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  const body = next === -1 ? rest : rest.slice(0, next);

  const entries = [];
  let current = null;
  for (const line of body.split('\n')) {
    const first = line.match(/^\s*- (arch):\s*(\S+)\s*$/);
    if (first) {
      current = { arch: first[2] };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^\s{12}([a-z_]+):\s*(\S+)\s*$/);
    if (kv) current[kv[1]] = kv[2];
    else if (/^\s{8,10}[a-z_-]+:/.test(line) && !/^\s{12}/.test(line)) current = null;
  }
  return entries;
}

const entries = matrixEntries();

test('the build-extra-arches matrix was parsed', () => {
  assert.ok(entries.length >= 8, `expected the exotic-arch matrix, got ${entries.length} entries`);
  for (const arch of ['armv6', 'armhf', 'armv7', 'i386', 's390x']) {
    assert.ok(entries.some(e => e.arch === arch), `matrix has no ${arch} entry`);
  }
});

// A platform the base image simply does not have (loong64: no debian, no ubuntu,
// at any tag) is NOT this failure. Docker says "no matching manifest", the
// preflight turns that into a warning, and a best-effort arch skips - which is
// exactly what loong64 does every release, on purpose. 32-bit ARM is the case
// that does not fail cleanly: containerd accepts a LOWER variant as compatible,
// so the request succeeds against the wrong userland and nothing says so.
test('no 32-bit ARM entry names an arm variant its base image does not publish', () => {
  const bad = entries
    .filter(e => e.image === 'debian:trixie' && e.platform.startsWith('linux/arm/'))
    .filter(e => !DEBIAN_TRIXIE.has(e.platform))
    .map(e => `${e.arch}: ${e.image} publishes no ${e.platform}, so the request ` +
              `resolves DOWNWARDS to a lower ARM variant and the bundle is built ` +
              `in the wrong userland`);
  assert.deepStrictEqual(bad, [], 'silent ARM variant downgrade:\n  ' + bad.join('\n  '));
});

test('loong64 is still the knowingly-absent, cleanly-skipped platform (not ARM-style silent)', () => {
  const loong = entries.find(e => e.arch === 'loong64');
  assert.ok(loong, 'matrix has no loong64 entry');
  assert.strictEqual(DEBIAN_TRIXIE.has(loong.platform), false,
    'debian:trixie publishes no linux/loong64 - if that changes, this test is the note ' +
    'to stop treating loong64 as unbuildable');
  assert.strictEqual(loong.optional, 'true',
    'loong64 must stay best-effort: the preflight warns and skips it, and a hard ' +
    'failure there fails the whole matrix job and takes docker down with it');
});

test('armv6 builds in the armhf (arm/v7) container, which has the hard-float loader', () => {
  const armv6 = entries.find(e => e.arch === 'armv6');
  assert.strictEqual(armv6.platform, 'linux/arm/v7',
    'armv6 must build in Debian\'s arm/v7 (armhf) container: it is the hard-float ' +
    'userland node-armv6 needs. linux/arm/v6 does not exist for debian and silently ' +
    'resolves to arm/v5 (armel, soft-float), where node-armv6 cannot start.');
  assert.strictEqual(armv6.node_arch, 'armv6',
    'the Node.js SHIPPED is still ARMv6 - only the container it runs in is armhf');
  assert.strictEqual(armv6.ferretdb_arch, 'armv6',
    'the FerretDB shipped is still the GOARM=6 build');
});

test('armv6 is marked as a container that is not its own CPU, so no qemu-user is copied out', () => {
  const armv6 = entries.find(e => e.arch === 'armv6');
  assert.strictEqual(armv6.same_arch_container, 'false',
    'armv6 builds in an armv7l container, so same_arch_container must be false: the ' +
    'bundled qemu-user is the one artifact copied FROM the container, and an ARMv7 ' +
    'qemu-armv7l in an ARMv6 bundle is a binary a Raspberry Pi 1 cannot execute');
  const sameArch = entries.filter(e => e.same_arch_container === 'false').map(e => e.arch);
  assert.deepStrictEqual(sameArch, ['armv6'],
    'only armv6 is built in a foreign-CPU container; every other arch has one of its own');
});

test('the docker run passes SAME_ARCH_CONTAINER into the container', () => {
  assert.ok(/-e SAME_ARCH_CONTAINER='\$\{\{ matrix\.same_arch_container \}\}'/.test(workflow),
    'the matrix flag has to reach install-node-for-arch.sh to have any effect');
});

test('install-node-for-arch.sh skips bundling qemu-user when the container is not the target CPU', () => {
  assert.ok(/SAME_ARCH_CONTAINER:-true/.test(installNode),
    'install-node-for-arch.sh must read SAME_ARCH_CONTAINER, defaulting to true so ' +
    'every same-arch build keeps bundling its qemu-user (#6458)');
  const gate = installNode.indexOf('SAME_ARCH_CONTAINER:-true');
  const qemuCopy = installNode.indexOf('qemu-user-static');
  assert.ok(gate !== -1 && qemuCopy > gate,
    'the gate must come BEFORE the qemu-user install/copy, or it copies it anyway');
});

test('the base-image preflight compares the ARM variant, not just the architecture', () => {
  assert.ok(/want_variant=/.test(preflight),
    'check-arch-binaries.sh must extract the variant from the platform string');
  assert.ok(!/grep -q .*"architecture": \*"\$\{want_arch\}"/.test(preflight),
    'the architecture-only grep is what let linux/arm/v6 through against an image ' +
    'that publishes only arm/v5 and arm/v7');
  assert.ok(/p\.get\("variant", ""\) == want_variant/.test(preflight),
    'a REQUESTED variant must be compared exactly - arm/v6 and arm/v5 are different ' +
    'userlands, not near neighbours');
});

test('the base-image manifest probe retries transient registry failures safely', () => {
  assert.ok(/for attempt in 1 2 3 4 5/.test(preflight),
    'one transient Docker Hub response must not fail an otherwise complete build');
  assert.ok(/>"\$manifest_tmp"[\s\S]*?mv "\$manifest_tmp" \/tmp\/manifest\.json/.test(preflight),
    'only a complete successful response may replace the manifest being parsed');
  assert.ok(/\[ "\$manifest_ok" = true \]/.test(preflight),
    'five failed attempts must still fail closed');
});

// The preflight's platform match is small enough to run here directly, against
// the manifest shapes it really sees: debian:trixie's index, an arm64 index
// (published as arm64/v8 but always written linux/arm64), and a single-platform
// image with no manifest list at all.
test('the preflight platform match answers correctly for the manifests it meets', () => {
  const { execFileSync } = require('child_process');
  const os = require('os');

  const script = preflight
    .split("if ! WANT_ARCH=\"$want_arch\" WANT_VARIANT=\"$want_variant\" python3 - <<'PYEOF'\n")[1]
    .split('\nPYEOF\n')[0];
  assert.ok(script.includes('want_variant'), 'could not extract the preflight python block');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-preflight-'));
  const scriptPath = path.join(tmp, 'match.py');
  fs.writeFileSync(scriptPath, script);

  const manifestPath = '/tmp/manifest.json';
  const saved = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath) : null;

  function matches(manifest, platform) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const [, arch, variant = ''] = platform.split('/');
    try {
      execFileSync('python3', [scriptPath], {
        env: { ...process.env, WANT_ARCH: arch, WANT_VARIANT: variant },
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  const debian = {
    manifests: [...DEBIAN_TRIXIE].map(p => {
      const [, architecture, variant] = p.split('/');
      return { platform: { os: 'linux', architecture, ...(variant ? { variant } : {}) } };
    }),
  };
  const arm64Only = {
    manifests: [{ platform: { os: 'linux', architecture: 'arm64', variant: 'v8' } }],
  };
  const singlePlatform = { architecture: 'arm', variant: 'v6', os: 'linux' };

  try {
    // The bug: debian:trixie has arm/v5 and arm/v7, and MUST NOT answer yes to arm/v6.
    assert.strictEqual(matches(debian, 'linux/arm/v6'), false,
      'debian:trixie publishes no linux/arm/v6 - saying it does is the whole failure');
    assert.strictEqual(matches(debian, 'linux/arm/v7'), true, 'debian:trixie has arm/v7');
    assert.strictEqual(matches(debian, 'linux/arm/v5'), true, 'debian:trixie has arm/v5');
    assert.strictEqual(matches(debian, 'linux/386'), true, 'debian:trixie has 386');
    assert.strictEqual(matches(debian, 'linux/loong64'), false, 'debian:trixie has no loong64');
    // linux/arm64 is written without the /v8 everyone's registry records.
    assert.strictEqual(matches(arm64Only, 'linux/arm64'), true,
      'an unrequested variant matches anything, or every linux/arm64 build breaks');
    // An image with no manifest list still answers for its own platform.
    assert.strictEqual(matches(singlePlatform, 'linux/arm/v6'), true,
      'a single-platform image names its architecture in its own config');
    assert.strictEqual(matches(singlePlatform, 'linux/arm/v7'), false,
      'and it must not answer for a variant it is not');
  } finally {
    if (saved !== null) fs.writeFileSync(manifestPath, saved);
    else fs.rmSync(manifestPath, { force: true });
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log(`\n${passed} passed`);
