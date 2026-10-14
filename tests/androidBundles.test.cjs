'use strict';

// WeKan on Android, for Termux (the Planned Android item): the Linux bundles
// rebuilt inside Termux's own image with wekan/node-patches' node-android-<cpu>
// (.github/workflows/android.yml, releases/android/build-bundle.sh).
// Run: node tests/androidBundles.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('all four Android CPUs, each from the Linux bundle of its CPU, in Termux of that CPU', () => {
  const targets = JSON.parse(read('releases/android/targets.json'));
  assert.deepEqual(targets.map(t => t.target).sort(), ['android-arm64', 'android-armv7', 'android-x64', 'android-x86']);
  const base = Object.fromEntries(targets.map(t => [t.target, [t.base, t.termux_arch]]));
  assert.deepEqual(base['android-arm64'], ['arm64', 'aarch64']);
  assert.deepEqual(base['android-x64'], ['amd64', 'x86_64']);
  const resolver = read('releases/resolve-node-source.sh');
  for (const t of targets) assert.match(resolver, new RegExp(`${t.target}\\)\\s+nodename="${t.target}"\\s*;\\s*asset="node-${t.target}"`), t.target);
});

test('the bundle is rebuilt by the Android Node.js itself, checked and started', () => {
  const build = read('releases/android/build-bundle.sh');
  assert.match(build, /process\.platform !== "android"/, 'an Android Node.js, not Termux\'s or the host\'s');
  assert.match(build, /npm\(\) \{ "\$node" "\$npm_cli" "\$@"; \}/, 'npm run by that Node.js, so addons build for it');
  assert.match(build, /npm_config_build_from_source=sharp npm install/);
  assert.match(build, /rm -rf "\$root\/bundle\/node-runtime"/);
  assert.match(build, /check-addon-arch\.mjs" "\$root\/bundle" "\$arch" --platform linux/);
  assert.match(build, /require\("sharp"\)/);
  assert.match(build, /releases\/bsd\/smoke\.sh" "\$root\/bundle"/);
});

test('negative: nothing is built from an unverified download, and a missing Node.js skips', () => {
  const wf = read('.github/workflows/android.yml');
  assert.match(wf, /sha256sum -c "\$zip\.sha256sum"/);
  assert.match(wf, /echo "\$node_sha256  android-node\.download" \| sha256sum -c -/);
  assert.match(wf, /has no published SHA256/);
  assert.match(wf, /has no node-\$TARGET for \$node_version yet; skipped/);
  assert.match(wf, /termux\/termux-docker:\$TERMUX_ARCH" env "ARCH=\$ARCH"/, 'values passed after Termux clears the env');
  const all = read('.github/workflows/release-all.yml');
  assert.match(all, /uses: \.\/\.github\/workflows\/android\.yml/);
  assert.match(all, /build-extra-arches, bsd, android\]/, 'single files wait for the Android bundles');
});

console.log(`androidBundles: ${passed} tests passed`);
