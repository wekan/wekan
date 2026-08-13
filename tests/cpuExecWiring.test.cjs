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
  // This lives in releases/install-node-for-arch.sh now, not inline in the
  // workflow. It used to be a `bash -c '...'` argument, and that string
  // contained apostrophes - which a single-quoted shell argument cannot hold:
  // the first one ended it, the rest became separate words, and ${NODE_ARCH}
  // was left to the runner's shell to expand, where it does not exist. Every
  // one of these jobs then asked nodejs.org for "node-<version>-linux-.tar.xz".
  // A file has no quoting layer to get wrong, so the script is the file and
  // this looks there.
  const script = read('releases/install-node-for-arch.sh');
  assert.ok(script.includes('rm -f /bundle/qemu-x86_64'));
  assert.ok(/apt-get install -y -q qemu-user-static[\s\S]*?\/usr\/bin\/qemu-\$\(uname -m\)-static/.test(script));
  assert.ok(script.includes('bundle ships without a bundled qemu-user'),
    'a missing qemu package on an exotic arch must not fail the release');
  assert.ok(/bash \/releases\/install-node-for-arch\.sh/.test(releaseAll),
    'and the workflow runs that file rather than an inline script');
});

test('negative: Windows and macOS bundles strip the Linux-only cpu-exec + qemu', () => {
  // Counted from the jobs that exist rather than from a number written here:
  // the count was 4 and became 5 the day build-win-arm64 was added, and a bare
  // number tells whoever hits that only that it changed, not whether the new
  // job strips its own copy - which is the thing that actually matters.
  const NON_LINUX = ['build-win64', 'build-win-arm64', 'build-win32',
                     'build-mac-arm64', 'build-mac-x64'];
  const missing = NON_LINUX.filter(job => {
    const at = releaseAll.indexOf(`\n  ${job}:`);
    if (at < 0) return false;                 // job removed; covered below
    const rest = releaseAll.slice(at + 1);
    const next = rest.search(/\n  [a-z][a-z0-9-]*:\n/);
    const body = next < 0 ? rest : rest.slice(0, next);
    return !/rm -f bundle\/cpu-exec bundle\/qemu-x86_64/.test(body);
  });
  assert.deepStrictEqual(missing, [],
    'these ship a Linux-only cpu-exec and qemu-x86_64 they cannot run');

  const present = NON_LINUX.filter(job => releaseAll.includes(`\n  ${job}:`));
  assert.deepStrictEqual(present, NON_LINUX,
    'a non-Linux bundle job disappeared; update this list deliberately');

  const strips = releaseAll.match(/rm -f bundle\/cpu-exec bundle\/qemu-x86_64/g) || [];
  assert.strictEqual(strips.length, NON_LINUX.length,
    `one strip per non-Linux bundle, found ${strips.length} for ${NON_LINUX.length} jobs`);
});

test('the qemu-user-static build dependency is installed where bundles are built', () => {
  // amd64 + arm64 bundle jobs, and both sandstorm jobs (release-all + standalone).
  // The package list moved behind releases/apt-install.sh, which retries a
  // mirror that is mid-republish (tests/releaseAptInstall.test.cjs); what this
  // guard is about is that qemu-user-static is still asked for, wherever the
  // asking happens.
  const aptLines = releaseAll.match(/(apt-get install|apt-install\.sh)[^\n]*qemu-user-static/g) || [];
  assert.ok(aptLines.length >= 3, `found ${aptLines.length} apt lines with qemu-user-static in release-all.yml`);
  assert.ok(/(apt-get install|apt-install\.sh)[^\n]*qemu-user-static/.test(sandstormYml));
});

// --- Sandstorm .spk ------------------------------------------------------------

test('sandstorm build-deps ships cpu-exec and (tolerantly) qemu-x86_64', () => {
  assert.ok(buildDeps.includes('cp -f "$REPO/snap-src/bin/cpu-exec" "$DEPS/bin/cpu-exec"'));
  assert.ok(/if \[ -x \/usr\/bin\/qemu-x86_64-static \]; then\s*\n\s*cp -f \/usr\/bin\/qemu-x86_64-static "\$DEPS\/bin\/qemu-x86_64"/.test(buildDeps));
  assert.ok(buildDeps.includes('spk ships cpu-exec without a bundled qemu-user'),
    'missing qemu on the build host must not fail the spk build');
});

// Shipping cpu-exec is not enough - the grain launcher must actually USE it.
// It shipped it and spawned every binary directly, so a grain on a CPU without a
// needed feature died with SIGILL and the bundled qemu-user was never reached.
test('the sandstorm grain launcher routes every bundled binary through cpu-exec', () => {
  const start = read('sandstorm-src/start.js');
  assert.ok(/const CPU_EXEC = path\.join\(APPROOT, 'bin\/cpu-exec'\)/.test(start),
    'the launcher locates cpu-exec in the package');
  assert.ok(/function cpuExec\(bin, args\)/.test(start), 'has the wrap helper');
  // cpu-exec is a bash script: both it and bash must be executable, else run direct.
  assert.ok(/fs\.accessSync\('\/bin\/bash', fs\.constants\.X_OK\)/.test(start),
    'falls back when bash is missing');
  assert.ok(/HAVE_CPU_EXEC \? \[CPU_EXEC, \[bin, \.\.\.args\]\] : \[bin, args\]/.test(start),
    'direct-exec fallback keeps older deps images working');
  // Every bundled binary the launcher starts must go through the helper.
  for (const bin of ['NODE, [BRIDGE]', 'FERRETDB, args', 'MONGO_CLI', 'NISCUD', 'MONGOD3',
                     'NODE, [IMPORTER]']) {
    assert.ok(start.includes(`cpuExec(${bin}`), `not routed through cpu-exec: ${bin}`);
  }
  // ...and nothing bundled is still spawned directly. /bin/sleep is a grain
  // utility, not a bundled binary, so it is exempt.
  const direct = start.match(/spawn(?:Sync)?\((?!\.\.\.cpuExec|'\/bin\/sleep')/g) || [];
  assert.deepStrictEqual(direct, [], 'a bundled binary is still spawned directly');
});

// --- Snap: FerretDB + node, not just mongod --------------------------------------

test('the snap runs FerretDB through cpu-exec', () => {
  const ferretdbControl = read('snap-src/bin/ferretdb-control');
  assert.ok(/CPU_EXEC="\$SNAP\/bin\/cpu-exec"/.test(ferretdbControl));
  assert.ok(/\[ -x "\$CPU_EXEC" \] \|\| CPU_EXEC=""/.test(ferretdbControl),
    'missing cpu-exec must fall back to a direct exec');
  const routed = ferretdbControl.match(/exec \$\{CPU_EXEC:\+bash "\$CPU_EXEC"\} "\$FERRETDB_BIN"/g) || [];
  assert.strictEqual(routed.length, 2, 'both the external-DB and SQLite launches are routed');
});

test('the snap runs node (the app and the maintenance page) through cpu-exec', () => {
  const wekanControl = read('snap-src/bin/wekan-control');
  assert.ok(/CPU_EXEC="\$SNAP\/bin\/cpu-exec"/.test(wekanControl));
  assert.ok(/\[ -x "\$CPU_EXEC" \] \|\| CPU_EXEC=""/.test(wekanControl));
  // The main application start, which keeps its ulimit -s 65500.
  assert.ok(/ulimit -s 65500; exec \$\{CPU_EXEC:\+bash \\"\$CPU_EXEC\\"\} \$NODE_PATH\/node \$APPLICATION_START/
    .test(wekanControl), 'the main app start is routed and keeps its stack ulimit');
  // Every launch of the maintenance page, however many there are - this was a
  // count of two, and #6592 added a third (the "waiting for its database" page
  // served during the endless database wait). A count says nothing about the
  // launch that was added; asking each launch line instead cannot go stale.
  const launches = wekanControl.split('\n')
    .filter(l => /wekan-maintenance-page\.mjs/.test(l) && /\$SNAP\/bin\/node/.test(l) && !/^\s*#/.test(l));
  assert.ok(launches.length >= 3, `expected the maintenance-page launches, found ${launches.length}`);
  for (const line of launches) {
    // `env VAR=value` may sit between the two (the data-too-old page passes its
    // reason that way), so this asks for the order, not for adjacency.
    assert.ok(/\$\{CPU_EXEC:\+bash "\$CPU_EXEC"\}.*"\$SNAP\/bin\/node"/.test(line),
      `a maintenance page started around cpu-exec cannot run on a CPU that needs it: ${line.trim()}`);
  }
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
