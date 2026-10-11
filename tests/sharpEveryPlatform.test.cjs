'use strict';

// Guard: every WeKan bundle carries a sharp it can load.
// Run: node tests/sharpEveryPlatform.test.cjs
//
// sharp makes the attachment thumbnails (server/lib/imageThumbnail.js). Every
// bundle except amd64 is made from the amd64 Linux bundle, so in v12.32 every
// one of them - arm64, ppc64le, s390x, riscv64, i386, armhf, armv7, armv6,
// mac-arm64, mac-x64, win64, win-arm64, and the Docker images and snaps built
// from them - had only @img/sharp-linux-x64 and showed full-size images in
// place of thumbnails. Nothing failed; it was found by reading the zips.
//
// So the guard is about the PIPELINE, not one job: every job that makes a
// bundle zip must run releases/platform-native-packages.mjs for its own
// platform and CPU, after the last step that deletes files and before the zip,
// and the WebAssembly fallback (for Linux i386 and loong64, where sharp
// publishes no binary) must be in package.json at sharp's own version.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = (text) => text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const workflow = read('.github/workflows/release-all.yml');
function jobs(text) {
  const out = {};
  const starts = [...text.matchAll(/\n  ([a-z0-9-]+):\n/g)].map((m) => ({ name: m[1], at: m.index }));
  starts.forEach((s, i) => {
    out[s.name] = code(text.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : undefined));
  });
  return out;
}
const all = jobs(workflow);
const SCRIPT = 'platform-native-packages.mjs';

console.log('sharpEveryPlatform:');

// The jobs that make a bundle zip, and what each must name. build-extra-arches
// runs it inside the target container (install-node-for-arch.sh), where the
// target node's own process.arch is the name sharp looks up.
const EXPECTED = {
  'build-amd64': /platform-native-packages\.mjs" \\\n\s*"\$GITHUB_WORKSPACE\/\.build\/bundle" linux x64/,
  'build-arm64': /platform-native-packages\.mjs \/bundle linux arm64/,
  'build-mac-arm64': /platform-native-packages\.mjs" \.\.\/\.\. darwin arm64/,
  'build-mac-x64': /platform-native-packages\.mjs" \.\.\/\.\. darwin x64/,
  'build-win64': /platform-native-packages\.mjs" bundle win32 x64/,
  'build-win-arm64': /platform-native-packages\.mjs" bundle win32 arm64/,
  'build-win32': /platform-native-packages\.mjs" bundle win32 ia32/,
  'build-extra-arches': /install-node-for-arch\.sh/,
};

test('every job that makes a bundle zip is one of the expected ones', () => {
  const zipping = Object.entries(all)
    .filter(([, body]) => /- name: Create .* zip\b/.test(body))
    .map(([name]) => name)
    .sort();
  assert.deepStrictEqual(zipping, Object.keys(EXPECTED).sort(),
    'a new bundle job must be added here, with the platform/arch it gives platform-native-packages.mjs');
});

test('each bundle job runs platform-native-packages.mjs for its own target', () => {
  for (const [name, re] of Object.entries(EXPECTED)) {
    assert.ok(re.test(all[name]), `${name} must run ${SCRIPT} for its own platform and CPU`);
  }
});

test('it runs after everything that deletes files, and before the zip', () => {
  for (const name of Object.keys(EXPECTED)) {
    if (name === 'build-extra-arches') continue;
    const body = all[name];
    const at = body.indexOf(SCRIPT);
    const prune = body.lastIndexOf('prune-unreachable-npm.mjs', at);
    assert.ok(prune !== -1 && prune < at, `${name}: after prune-unreachable-npm`);
    assert.ok(body.lastIndexOf('bundle-trim.mjs', at) !== -1, `${name}: after bundle-trim`);
    const zip = body.search(/- name: Create .* zip\b/);
    assert.ok(at < zip, `${name}: before the zip is made`);
  }
  const install = code(read('releases/install-node-for-arch.sh'));
  const at = install.indexOf(`${SCRIPT}" /bundle linux "$(node -p process.arch)"`);
  assert.ok(at !== -1, 'install-node-for-arch.sh names the target node\'s own process.arch');
  assert.ok(install.indexOf('prune-unreachable-npm.mjs') < at, 'install-node-for-arch.sh: after the prune');
  assert.ok(/install-node-for-arch\.sh/.test(all['build-extra-arches']), 'build-extra-arches runs it');
});

test('the local release build runs the same step for its own machine', () => {
  const local = code(read('releases/build-release-bundle.sh'));
  assert.ok(/platform-native-packages\.mjs" "\$BUNDLE" \\\n\s*"\$\(node -p process\.platform\)" "\$\(node -p process\.arch\)"/.test(local));
});

test('the WebAssembly fallback is a dependency, at sharp\'s own version', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies.sharp, 'sharp is a dependency');
  assert.strictEqual(pkg.optionalDependencies?.['@img/sharp-wasm32'], pkg.dependencies.sharp,
    '@img/sharp-wasm32 uses the same range as sharp, so they move together');
  const lock = JSON.parse(read('package-lock.json'));
  assert.strictEqual(lock.packages['']?.optionalDependencies?.['@img/sharp-wasm32'], pkg.dependencies.sharp,
    'package-lock.json records it as a root optional dependency');
  const sharp = lock.packages['node_modules/sharp'];
  const wasm = lock.packages['node_modules/@img/sharp-wasm32'];
  assert.ok(sharp && wasm, 'both are locked');
  assert.strictEqual(wasm.version, sharp.version, 'and locked to the same version');
  assert.ok(lock.packages['node_modules/@emnapi/runtime'], 'with its @emnapi/runtime');
});

// Negative: nothing else may install a sharp platform package by hand, or the
// version could drift from the one sharp pins.
test('no other release script or job installs a sharp platform package itself', () => {
  const files = ['.github/workflows/release-all.yml', 'Dockerfile',
    ...fs.readdirSync(path.join(ROOT, 'releases')).filter((f) => /\.(sh|mjs|py)$/.test(f)).map((f) => `releases/${f}`)];
  for (const f of files) {
    if (f === `releases/${SCRIPT}`) continue;
    const body = code(read(f));
    assert.ok(!/npm (?:i|install|pack)\b[^\n]*@img\/sharp-/.test(body), `${f} installs an @img/sharp- package itself`);
  }
});

console.log(`\nsharpEveryPlatform: all ${passed} tests passed`);
