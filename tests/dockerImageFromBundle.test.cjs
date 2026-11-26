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
// prove it is the target's CPU - and it writes the wekan user (999:999), since
// the image has no useradd. The image is distroless: runtime-root, the only
// emulated part, unpacks the C++ runtime (and, for 386, which distroless does not
// publish, the whole cc root) from Debian 13; the image itself is only COPY.
//
// amd64 and arm64 changed on 2026-11-26 from distroless glibc to musl: every
// one of Artifact Hub's 42 findings in v13.33 was in glibc and the GCC runtime
// the glibc node needs, none with a Debian fix. Their image is the release's
// musl bundle (musl.yml) on a scratch root of Alpine's packages only.

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
const stage1 = dockerfile.slice(dockerfile.indexOf(froms[0]), dockerfile.indexOf(froms[1]));
const emulated = dockerfile.slice(dockerfile.indexOf('FROM debian:trixie AS runtime-root'), dockerfile.indexOf('FROM alpine:'));
const musl = dockerfile.slice(dockerfile.indexOf('FROM alpine:'), dockerfile.indexOf('FROM gcr.io/distroless'));
const stage2 = dockerfile.slice(dockerfile.lastIndexOf(`\n${froms[froms.length - 1]}`));

console.log('dockerImageFromBundle:');

test('the bundle on the build machine, the runtime root per platform, the image on top', () => {
  assert.deepStrictEqual(froms, [
    'FROM --platform=$BUILDPLATFORM debian:trixie AS bundle',
    'FROM debian:trixie AS runtime-root',
    'FROM alpine:3.22 AS runtime-root-musl',
    'FROM gcr.io/distroless/base-nossl-debian13:nonroot AS distroless',
    'FROM scratch AS runtime-amd64',
    'FROM scratch AS runtime-arm64',
    'FROM distroless AS runtime-arm',
    'FROM distroless AS runtime-ppc64le',
    'FROM distroless AS runtime-s390x',
    'FROM distroless AS runtime-riscv64',
    'FROM scratch AS runtime-386',
    'FROM runtime-${TARGETARCH}',
  ]);
  assert.ok(/^ARG TARGETARCH$/m.test(dockerfile.slice(0, dockerfile.indexOf(froms[0]))), 'the platform in the global scope, for the last FROM');
  assert.ok(/^COPY --from=bundle \/out\/ \/$/m.test(stage2), 'the image takes stage 1\'s result');
  assert.ok(/^COPY --from=runtime-root \/extra\/ \/$/m.test(stage2), 'and what the distroless root lacks');
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
  assert.ok(!/build-essential|\bg\+\+|\bgcc\b(?!-14-base)|BUILD_DEPS/.test(all), 'no compiler toolchain (gcc-14-base is libgcc\'s data package)');
});

test('runtime-root, the emulated stage, only unpacks Debian packages for the target CPU', () => {
  const s = code(emulated);
  assert.strictEqual([...s.matchAll(/^RUN /gm)].length, 1);
  assert.ok(/^\s*\*\) unpack \/extra gcc-14-base libgcc-s1 libstdc\+\+6 libatomic1 ;;$/m.test(s), 'every glibc platform: the C++ runtime');
  assert.ok(/^\s*amd64\|arm64\) ;;$/m.test(s), 'negative: none of it for the musl platforms');
  assert.ok(/unpack \/rootfs base-files netbase tzdata ca-certificates libc6$/m.test(s),
    '386: distroless base-nossl-debian13\'s packages');
  assert.ok(!/docker|golang|\bfile\b/.test(s), 'no docker-cli, whose Go stdlib filled the image scan, and no file');
  assert.ok(!/wget|curl|unzip|python3/.test(s), 'nothing downloaded or checked here: that is stage 1');
});

test('amd64 and arm64: the musl bundle on a root of Alpine packages only', () => {
  const s1 = code(stage1);
  assert.ok(/"amd64"\)\s+WEKAN_ARCH="linux-x64-musl"/.test(s1) && /"arm64"\)\s+WEKAN_ARCH="linux-arm64-musl"/.test(s1),
    'the musl bundles, verified like every other');
  assert.ok(/\*-musl\) rm -rf bundle\/node-runtime ;;/.test(s1), 'its copied GCC libraries go: the root has them as packages');
  const m = code(musl);
  assert.ok(/apk add --no-cache --root \/rootfs --initdb/.test(m), 'installed into an empty root, with apk records');
  // The packages, as the words of the apk add command after its options.
  const add = m.slice(m.indexOf('apk add --no-cache --root'));
  const words = add.slice(0, add.indexOf('\nmkdir')).replace(/\\\n/g, ' ').split(/\s+/).filter((w) => w && !w.startsWith('-'));
  for (const pkg of ['alpine-release', 'musl', 'libstdc++', 'libgcc', 'libatomic', 'ca-certificates-bundle', 'tzdata']) {
    assert.ok(words.includes(pkg), `the root has ${pkg}`);
  }
  // Negative: no shell, no package manager, no glibc in the musl root.
  for (const pkg of ['busybox', 'apk-tools', 'alpine-baselayout', 'libc6', 'gcompat', 'bash']) {
    assert.ok(!words.includes(pkg), `negative: no ${pkg}`);
  }
  assert.ok(/^COPY --from=runtime-root-musl \/rootfs\/ \/$/m.test(dockerfile.slice(dockerfile.indexOf('FROM scratch AS runtime-amd64'))));
  const wf = read('.github/workflows/release-all.yml');
  assert.ok(wf.includes('req="linux/amd64:linux-x64-musl linux/arm64:linux-arm64-musl"'), 'the docker job waits for the musl bundles');
  assert.ok(/  docker:\n(?:.*\n){0,4}    needs: \[prepare, release, build-extra-arches, musl\]/.test(wf), 'after the musl job');
});

test('the image itself runs nothing: distroless has no shell', () => {
  const s = code(stage2);
  assert.strictEqual([...s.matchAll(/^RUN /gm)].length, 0);
  assert.ok(/^USER wekan$/m.test(s));
});

test('the docker job reads both bases from the Dockerfile', () => {
  const wf = read('.github/workflows/release-all.yml');
  assert.ok(wf.includes(`root_image="$(awk '$1 == "FROM" && $NF == "runtime-root" {print $2}' Dockerfile)"`));
  assert.ok(wf.includes(`distroless_image="$(awk '$1 == "FROM" && $NF == "distroless" {print $2}' Dockerfile)"`));
});

console.log(`\ndockerImageFromBundle: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
