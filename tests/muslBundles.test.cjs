'use strict';

// WeKan for Alpine and the other musl systems (the Planned musl item): the
// Linux bundles rebuilt inside Alpine with the musl Node.js of the same
// version (.github/workflows/musl.yml, releases/musl/build-bundle.sh), and
// AppImages around them (.github/workflows/AppImage.yml, -musl).
// Run: node tests/muslBundles.test.cjs

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

test('one musl bundle per CPU with a musl Node.js, built on that CPU', () => {
  const targets = JSON.parse(read('releases/musl/targets.json'));
  assert.deepEqual(targets.map(t => t.target), ['linux-x64-musl', 'linux-arm64-musl']);
  for (const t of targets) assert.match(t.runner, t.arch === 'arm64' ? /-arm$/ : /^ubuntu-24\.04$/, t.target);
  const resolver = read('releases/resolve-node-source.sh');
  assert.match(resolver, /x64-musl\)\s+nodename="linux-x64-musl"/);
  assert.match(resolver, /arm64-musl\)\s+nodename="linux-arm64-musl"/);
});

test('the bundle is rebuilt for musl, checked, and started before it ships', () => {
  const build = read('releases/musl/build-bundle.sh');
  assert.match(build, /glibcVersionRuntime/, 'refuses a glibc Node.js');
  assert.match(build, /rm -rf "\$root\/bundle\/node-runtime"/, 'no glibc libraries left');
  assert.match(build, /npm-retry\.sh" npm install/, 'native addons compiled against musl');
  // The application's packages (programs/server/npm/node_modules) get their
  // musl platform packages here; npm install above does not touch them.
  // v12.41-v12.44 removed the glibc ones from programs/server/node_modules,
  // where they are not, and sharp failed to load.
  assert.match(build, /platform-native-packages\.mjs" "\$root\/bundle" linux "\$arch" --libc musl/);
  assert.doesNotMatch(build, /rm -rf "\$server\/node_modules\/@img/, 'no removal from the wrong directory');
  assert.match(build, /check-addon-arch\.mjs" "\$root\/bundle" "\$arch" --platform linux --libc musl/);
  assert.match(build, /\(cd "\$server\/npm" && "\$root\/bundle\/node" -e 'require\("sharp"\)/, 'sharp loads from where the application resolves it');
  assert.match(build, /releases\/bsd\/smoke\.sh" "\$root\/bundle"/, 'started as a user starts it');
});

test('negative: nothing is rebuilt from an unverified download', () => {
  const wf = read('.github/workflows/musl.yml');
  assert.match(wf, /sha256sum -c "\$zip\.sha256sum"/);
  assert.match(wf, /\$node_sha256  node-musl\.tar\.xz" \| sha256sum -c -/);
  assert.match(wf, /has no published SHA256/);
  assert.match(wf, /alpine:3\.23/);
  const all = read('.github/workflows/release-all.yml');
  assert.match(all, /uses: \.\/\.github\/workflows\/musl\.yml/);
  assert.match(all, /needs: \[prepare, release, musl\][\s\S]*?only: '\["x86_64-musl","aarch64-musl"\]'/);
});

test('the musl AppImages are named apart and started inside Alpine', () => {
  const wf = read('.github/workflows/AppImage.yml');
  assert.match(wf, /name_arch: x86_64-musl\n\s+bundle_arch: linux-x64-musl/);
  assert.match(wf, /name_arch: aarch64-musl\n\s+bundle_arch: linux-arm64-musl/);
  assert.match(wf, /name="WeKan-\$\{version\}-\$\{NAME_ARCH\}"/);
  // The matrix value reaches the script through env (template-injection
  // hardening, tests/workflowHardening.test.cjs).
  assert.match(wf, /MATRIX_MUSL: \$\{\{ matrix\.musl \}\}/);
  assert.match(wf, /if \[ "\$\{MATRIX_MUSL\}" = true \]; then\n\s+docker run --rm --network host[^\n]*alpine:3\.23/);
  assert.match(wf, /if \[ "\$\{MATRIX_MUSL\}" = true \]; then\n\s+required="\$required bundle\/node-runtime\/libstdc\+\+\.so\.6 bundle\/node-runtime\/libgcc_s\.so\.1"\n\s+else\n\s+required="\$required bundle\/node-runtime\/libatomic\.so\.1"/);
});

test('the musl bundle carries the C++ runtime its Node.js is linked against', () => {
  // A bare Alpine has no libstdc++: every musl AppImage of v12.51 died with
  // "Error relocating ... node: _ZTVN10__cxxabiv117__class_type_infoE".
  const build = read('releases/musl/build-bundle.sh');
  const at = build.indexOf('rm -rf "$root/bundle/node-runtime"');
  const after = build.slice(at);
  assert.match(after, /for lib in libstdc\+\+\.so\.6 libgcc_s\.so\.1; do/);
  assert.match(after, /cp "\$src" "\$runtime\/\$lib"/);
  assert.match(after, /NOTICE-libstdc\+\+-libgcc\.txt/, 'the libraries go with their license');
  assert.match(after, /GPL-3\.0-or-later WITH GCC-exception-3\.1/);
  assert(after.indexOf('for lib in') < after.indexOf('releases/bsd/smoke.sh'), 'in place before the bundle is started');
  // start-wekan.sh is what puts node-runtime on the library path.
  assert.match(read('releases/ferretdb/start-wekan.sh'), /if \[ -d "\$DIR\/node-runtime" \]; then\n\s+export LD_LIBRARY_PATH="\$DIR\/node-runtime/);
});

test('negative: a missing C++ runtime stops the build, and the AppImage smoke adds none', () => {
  const build = read('releases/musl/build-bundle.sh');
  assert.match(build, /\[ -f "\$src" \] \|\| \{ echo "::error::this Alpine has no \/usr\/lib\/\$lib/);
  // The AppImage is started in an Alpine with only curl added, as a user's
  // would be: installing libstdc++ there would hide this fault again.
  const wf = read('.github/workflows/AppImage.yml');
  const smoke = wf.slice(wf.indexOf('alpine:3.23 sh -ec'), wf.indexOf('alpine:3.23 sh -ec') + 400);
  assert.match(smoke, /apk add --no-cache curl >\/dev\/null/);
  assert.doesNotMatch(smoke, /libstdc\+\+|libgcc/);
});

console.log(`muslBundles: ${passed} tests passed`);
