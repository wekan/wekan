'use strict';
(async () => {

// Guard: the Docker image is built FROM the published .zip, and the work that
// runs as the target CPU is only what has to.
// Run: node tests/dockerImageFromBundle.test.cjs
//
// In v12.32 "Build and push multi-arch image" took 27 of the docker job's 29
// minutes. For each of seven platforms - six of them under QEMU - the
// Dockerfile installed a compiler toolchain, resolved and downloaded Node.js,
// reinstalled programs/server with npm, ran the prune / bump / trim / prune
// passes and purged the toolchain again: all of it work that platform's .zip
// leg in release-all.yml had already done, to the same result.
//
// Now stage 1 runs on the BUILD machine (--platform=$BUILDPLATFORM) for each
// target: download that target's .zip, check it against the release's own
// .sha256sum, re-run the telemetry check, and read bundle/node's ELF header to
// prove it is the target's CPU. Stage 2, the only emulated part, adds the WeKan
// user, an OS update and three runtime packages, and copies stage 1's result.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const dockerfile = read('Dockerfile');
const code = (text) => text.replace(/^\s*#.*$/gm, '');
const { ELF_MACHINE } = await import('../releases/check-addon-arch.mjs');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const froms = [...dockerfile.matchAll(/^FROM .*$/gm)].map((m) => m[0]);
const stage1 = dockerfile.slice(dockerfile.indexOf(froms[0]), dockerfile.indexOf(froms[froms.length - 1]));
const stage2 = dockerfile.slice(dockerfile.indexOf(froms[froms.length - 1]));

console.log('dockerImageFromBundle:');

test('two stages: the bundle on the build machine, the image on the target', () => {
  assert.deepStrictEqual(froms, [
    'FROM --platform=$BUILDPLATFORM debian:trixie AS bundle',
    'FROM debian:trixie',
  ]);
  assert.ok(/^COPY --from=bundle \/out\/ \/$/m.test(stage2), 'the image takes stage 1\'s result');
});

test('stage 1 builds from the published .zip, verified', () => {
  const s = code(stage1);
  assert.ok(/WEKAN_ZIP="wekan-\$\{VERSION\}-\$\{WEKAN_ARCH\}\.zip"/.test(s));
  assert.ok(/releases\/download\/v\$\{VERSION\}\/\$\{WEKAN_ZIP\}/.test(s), 'the release\'s own asset');
  assert.ok(/"\$\{WEKAN_ZIP_URL\}\.sha256sum"/.test(s) && /sha256sum -c "\$\{WEKAN_ZIP\}\.sha256sum"/.test(s),
    'checked against the .sha256sum the release published beside it');
  assert.ok(s.indexOf('sha256sum -c') < s.indexOf('unzip -q'), 'before it is unpacked');
  assert.ok(/python3 \/tmp\/check-telemetry\.py --bundle \.\/bundle/.test(s), 'and the telemetry check still runs');
});

test('the node it ships is checked to be the target CPU\'s', () => {
  // Same numbers as check-addon-arch.mjs, so the two cannot disagree.
  const pairs = { amd64: 'x64', arm64: 'arm64', ppc64le: 'ppc64', s390x: 's390x',
    riscv64: 'riscv64', 386: 'ia32', arm: 'arm' };
  for (const [ta, nodeArch] of Object.entries(pairs)) {
    const m = new RegExp(`"${ta}"\\)[^\\n]*?ELF_MACHINE=(\\d+)|"${ta}"\\)\\s*\\n\\s*ELF_MACHINE=(\\d+)`).exec(stage1);
    assert.ok(m, `no ELF_MACHINE for TARGETARCH ${ta}`);
    assert.strictEqual(Number(m[1] || m[2]), ELF_MACHINE[nodeArch], `ELF machine for ${ta}`);
  }
  assert.ok(/mv bundle\/node \/out\/usr\/local\/bin\/node/.test(stage1), 'the bundle\'s own node');
  assert.ok(stage1.indexOf('the bundle is for another CPU') < stage1.indexOf('mv bundle/node'),
    'checked before it is used');
});

// Negative: nothing that was redundant comes back, in either stage.
test('no reinstall, no second Node.js download, no toolchain', () => {
  const all = code(dockerfile);
  assert.ok(!/npm install|npm-retry|node \/tmp\//.test(all), 'no npm install and no bundle post-processing');
  assert.ok(!/nodejs\.org|unofficial-builds|resolve-node-source/.test(all), 'no Node.js download of its own');
  assert.ok(!/build-essential|\bg\+\+|\bgcc\b|BUILD_DEPS/.test(all), 'no compiler toolchain');
});

test('stage 2, the emulated one, does only what needs the target CPU', () => {
  const s = code(stage2);
  const runs = [...s.matchAll(/^RUN /gm)].length;
  assert.strictEqual(runs, 2, 'one RUN for user + packages, one chmod');
  assert.ok(/apt-get install --assume-yes --no-install-recommends file libatomic1 docker-cli\n/.test(s),
    'exactly the three runtime packages');
  assert.ok(!/wget|curl|unzip|python3/.test(s), 'nothing downloaded or checked here: that is stage 1');
});

test('the docker job reads the base image from the last FROM', () => {
  const wf = read('.github/workflows/release-all.yml');
  assert.ok(/base_image="\$\(awk '\/\^FROM \/\{base=\$2\} END\{print base\}' Dockerfile\)"/.test(wf));
});

console.log(`\ndockerImageFromBundle: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
