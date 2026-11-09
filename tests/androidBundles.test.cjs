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
  // sharp is an application package (programs/server/npm/node_modules): its
  // glibc packages go from there, and it is built from source in its own
  // directory, falling back to WebAssembly with a warning. Until v12.44 both
  // happened in programs/server/node_modules, where sharp is not.
  assert.match(build, /appmods="\$server\/npm\/node_modules"\nrm -rf "\$appmods\/@img\/sharp-linux-"\*/);
  assert.doesNotMatch(build, /rm -rf "\$server\/node_modules\/@img/, 'not the wrong directory');
  assert.match(build, /cd "\$appmods\/sharp" && bash "\$root\/releases\/npm-retry\.sh" npm install --no-save --omit=dev node-addon-api node-gyp && "\$node" install\/build\.js/);
  assert.match(build, /::warning::sharp could not be built[^\n]*WebAssembly/);
  // Termux's user does not own the bind mount: chmod only what is not
  // already executable (v12.43-v12.44 stopped at "Operation not permitted").
  assert.match(build, /\[ -x "\$node" \] \|\| chmod \+x "\$node"/);
  assert.doesNotMatch(build, /^chmod \+x/m, 'no unconditional chmod');
  assert.match(build, /\(cd "\$server\/npm" && "\$root\/bundle\/node" -e 'const s = require\("sharp"\)/, 'sharp resolves where the application resolves it');
  assert.match(build, /rm -rf "\$root\/bundle\/node-runtime"/);
  assert.match(build, /check-addon-arch\.mjs" "\$root\/bundle" "\$arch" --platform linux/);
  assert.match(build, /require\("sharp"\)/);
  assert.match(build, /releases\/bsd\/smoke\.sh" "\$root\/bundle"/);
});

test('argon2 and bcrypt are compiled for Android and must load before the bundle starts', () => {
  // v12.78: npm 12 blocked their install scripts - allowScripts covers declared
  // dependencies only - so nothing was compiled, check-addon-arch passed the
  // Linux prebuilds, and every Android bundle crash-looped on "No native build
  // was found for platform=android" until the 240 s smoke test gave up.
  const build = read('releases/android/build-bundle.sh');
  const prepare = build.indexOf('"$node" "$root/releases/prepare-bundle-npm.mjs" "$root/bundle"');
  // Through npm-retry.sh since v13.03's Sandstorm .spk was lost to a 504 from
  // github.com (tests/npmRetry.test.cjs): the same install, retried on outage.
  const install = build.indexOf('(cd "$server" && bash "$root/releases/npm-retry.sh" npm install)');
  const loads = build.indexOf('for (const name of ["argon2", "bcrypt"])');
  assert.ok(prepare > 0 && prepare < install, 'the bundle declares its installers before npm installs');
  assert.ok(loads > install && loads < build.indexOf('check-addon-arch.mjs'), 'loaded with Android Node.js right after the install');
  assert.match(build, /cd "\$server\/npm\/node_modules\/meteor\/accounts-password" && "\$node" -e/);
  assert.match(build, /::error::\$\{name\} has no Android addon/);
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

test('the checkout is OWNED by Termux\'s user, not only writable, and handed back', () => {
  // npm chmods each package's bin on install, and only a file's owner may chmod
  // it: a+rwX alone ended every Android build of v12.51 with EPERM.
  const wf = read('.github/workflows/android.yml');
  const run = wf.slice(wf.indexOf('- name: Rebuild and start it in Termux'), wf.indexOf('- name: Package'));
  assert.match(run, /owner="\$\(docker run --rm "termux\/termux-docker:\$TERMUX_ARCH" sh -c 'echo "\$\(id -u\):\$\(id -g\)"'/);
  assert.match(run, /sudo chown -R "\$owner" \./);
  assert(run.indexOf('sudo chown -R "$owner"') < run.indexOf('bash releases/android/build-bundle.sh'), 'owned before npm runs');
  const pkg = wf.slice(wf.indexOf('- name: Package'));
  assert.match(pkg, /sudo chown -R "\$\(id -u\):\$\(id -g\)" \./, 'the runner takes the checkout back');
});

test('negative: an unreadable uid stops the job instead of chowning to nothing', () => {
  const wf = read('.github/workflows/android.yml');
  assert.match(wf, /\*\) echo "::error::Could not read the uid of Termux's user/);
});

test('termux-exec is preloaded before npm, so #!/usr/bin/env scripts run', () => {
  // The workflow starts bash without Termux's login, which is what exports
  // termux-exec; without it bcrypt's install script ended every Android build
  // of v12.53: "sh: 1: node-gyp-build: not found".
  const build = read('releases/android/build-bundle.sh');
  const preload = build.indexOf('export LD_PRELOAD="$lib"');
  assert(preload > 0, 'LD_PRELOAD is exported');
  assert.match(build, /"\$PREFIX\/lib\/libtermux-exec-ld-preload\.so" "\$PREFIX\/lib\/libtermux-exec\.so"/, 'both termux-exec generations, newest first, as login does');
  assert.match(build, /LD_PRELOAD="\$lib" sh -c true/, 'kept only if a program still starts with it');
  assert(preload < build.indexOf('(cd "$server" && bash "$root/releases/npm-retry.sh" npm install)'), 'before npm runs any install script');
});

test('negative: an LD_PRELOAD already set is not replaced', () => {
  const build = read('releases/android/build-bundle.sh');
  assert.match(build, /if \[ -z "\$\{LD_PRELOAD:-\}" \]/);
});

console.log(`androidBundles: ${passed} tests passed`);
