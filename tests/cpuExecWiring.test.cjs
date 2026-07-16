'use strict';

// Plain-Node regression guard (no Meteor) for the #6458 cpu-exec WIRING: the
// general qemu-user fallback is only useful if every platform actually ships
// it and every launcher actually routes binaries through it. The cpu-exec
// script's own BEHAVIOR is tested in tests/cpuExec.test.cjs; this test pins
// the delivery pipeline.
// Run: node tests/cpuExecWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const releaseAll = read('.github/workflows/release-all.yml');
const sandstormYml = read('.github/workflows/sandstorm.yml');
const buildDeps = read('sandstorm-src/build-deps.sh');
const entrypoint = read('releases/ferretdb/wekan-entrypoint.sh');
const startWekan = read('releases/ferretdb/start-wekan.sh');
const snapcraft = read('snapcraft.yaml');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- release-all.yml: every Linux bundle ships cpu-exec + its own qemu -------

test('amd64 bundle embeds cpu-exec and qemu-x86_64', () => {
  assert.ok(releaseAll.includes('cp snap-src/bin/cpu-exec .build/bundle/cpu-exec'));
  assert.ok(releaseAll.includes('cp /usr/bin/qemu-x86_64-static .build/bundle/qemu-x86_64'));
});

test('arm64 bundle replaces the inherited amd64 qemu with qemu-aarch64', () => {
  assert.ok(/rm -f bundle\/qemu-x86_64\s*\n\s*cp \/usr\/bin\/qemu-aarch64-static bundle\/qemu-aarch64/.test(releaseAll));
});

test('extra arches (ppc64le/s390x/riscv64) bundle their own-arch qemu, tolerantly', () => {
  assert.ok(releaseAll.includes('rm -f /bundle/qemu-x86_64'));
  assert.ok(/apt-get install -y -q qemu-user-static[\s\S]*?\/usr\/bin\/qemu-\$\(uname -m\)-static/.test(releaseAll));
  assert.ok(releaseAll.includes('bundle ships without a bundled qemu-user'),
    'a missing qemu package on an exotic arch must not fail the release');
});

test('negative: Windows and macOS bundles strip the Linux-only cpu-exec + qemu', () => {
  const strips = releaseAll.match(/rm -f bundle\/cpu-exec bundle\/qemu-x86_64/g) || [];
  assert.strictEqual(strips.length, 2, 'one strip in build-win64, one in build-mac-arm64');
});

test('the qemu-user-static build dependency is installed where bundles are built', () => {
  // amd64 + arm64 bundle jobs, and both sandstorm jobs (release-all + standalone)
  const aptLines = releaseAll.match(/apt-get install[^\n]*qemu-user-static/g) || [];
  assert.ok(aptLines.length >= 3, `found ${aptLines.length} apt lines with qemu-user-static in release-all.yml`);
  assert.ok(/apt-get install[^\n]*qemu-user-static/.test(sandstormYml));
});

// --- Sandstorm .spk ------------------------------------------------------------

test('sandstorm build-deps ships cpu-exec and (tolerantly) qemu-x86_64', () => {
  assert.ok(buildDeps.includes('cp -f "$REPO/snap-src/bin/cpu-exec" "$DEPS/bin/cpu-exec"'));
  assert.ok(/if \[ -x \/usr\/bin\/qemu-x86_64-static \]; then\s*\n\s*cp -f \/usr\/bin\/qemu-x86_64-static "\$DEPS\/bin\/qemu-x86_64"/.test(buildDeps));
  assert.ok(buildDeps.includes('spk ships cpu-exec without a bundled qemu-user'),
    'missing qemu on the build host must not fail the spk build');
});

// --- Docker entrypoint ----------------------------------------------------------

test('Docker entrypoint routes ferretdb and node through cpu-exec when present', () => {
  assert.ok(/if \[ -x \/build\/cpu-exec \]; then\s*\n\s*\/build\/cpu-exec "\$FERRETDB_BIN"/.test(entrypoint));
  assert.ok(/if \[ -x \/build\/cpu-exec \]; then\s*\n\s*exec \/build\/cpu-exec node \/build\/main\.js/.test(entrypoint));
});

test('negative: Docker entrypoint still works without cpu-exec (older bundles)', () => {
  // the guarded blocks must keep direct-exec fallbacks
  assert.ok(/\nexec node \/build\/main\.js/.test(entrypoint), 'plain node fallback kept');
  const direct = entrypoint.match(/"\$FERRETDB_BIN" \\\n/g) || [];
  assert.ok(direct.length >= 1, 'plain ferretdb fallback kept');
});

// --- Bundle launcher -------------------------------------------------------------

test('bundle launcher routes ferretdb and node through cpu-exec when present', () => {
  assert.ok(startWekan.includes('CPU_EXEC="$DIR/cpu-exec"'));
  assert.ok(startWekan.includes('[ -x "$CPU_EXEC" ] || CPU_EXEC=""'),
    'missing cpu-exec (e.g. macOS bundle) must fall back to direct execution');
  assert.ok(/\$\{CPU_EXEC:\+"\$CPU_EXEC"\} "\$FERRETDB_BIN"/.test(startWekan));
  assert.ok(/\$\{CPU_EXEC:\+"\$CPU_EXEC"\} "\$NODE" "\$DIR\/main\.js"/.test(startWekan));
});

// --- Snap -----------------------------------------------------------------------

test('the snap ships cpu-exec via the snap-src helpers part', () => {
  // helpers part dumps snap-src -> $SNAP, so snap-src/bin/cpu-exec becomes
  // $SNAP/bin/cpu-exec (which mongodb-control and migration-control invoke —
  // pinned in tests/snapMigrationRecovery.test.cjs).
  assert.ok(/helpers:\s*\n\s*source: snap-src\s*\n\s*plugin: dump/.test(snapcraft));
  assert.ok(fs.existsSync(path.join(repoRoot, 'snap-src/bin/cpu-exec')));
});

console.log(`\n${passed} tests passed`);
