'use strict';
(async () => {

// Plain-Node unit test for releases/platform-native-packages.mjs.
// Run: node tests/platformNativePackages.test.cjs
//
// Every bundle except amd64 is made from the amd64 Linux bundle, so sharp - the
// attachment thumbnails - had only @img/sharp-linux-x64 in every one of them,
// and could not load on any other platform or CPU (v12.32: arm64, ppc64le,
// s390x, riscv64, i386, armhf, armv7, armv6, both macOS, all three Windows).
// The script puts in @img/sharp-<platform>-<arch> and its libvips at the
// versions pinned, checked against the registry's sha512, keeps the
// WebAssembly fallback where sharp publishes nothing (Linux i386, loong64),
// and removes the packages npm would not install on that platform. The
// network is replaced here by a fetch that serves tarballs built in the test.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const {
  sharpPlatformSpec,
  canvasPlatformSpec,
  registryPackagePath,
  untar,
  verifyIntegrity,
  foreignPackages,
  addPlatformNativePackages,
} = await import('../releases/platform-native-packages.mjs');

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('  ok -', name);
}

// A ustar archive, the way npm packs: every entry under package/.
function tar(entries) {
  const blocks = [];
  for (const [name, content] of entries) {
    const data = Buffer.from(content);
    const h = Buffer.alloc(512);
    h.write(name, 0, 100, 'utf8');
    h.write('0000644\0', 100);
    h.write('0000000\0', 108);
    h.write('0000000\0', 116);
    h.write(data.length.toString(8).padStart(11, '0') + '\0', 124);
    h.write('00000000000\0', 136);
    h.write('        ', 148);
    h.write('0', 156);
    h.write('ustar\0' + '00', 257);
    let sum = 0;
    for (const b of h) sum += b;
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
    blocks.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}
const integrity = (buf) => 'sha512-' + crypto.createHash('sha512').update(buf).digest('base64');

// Real headers, so the addon check at the end of a run reads them.
function pe(machine) {
  const b = Buffer.alloc(0x90);
  b.write('MZ', 0, 'latin1');
  b.writeUInt32LE(0x80, 0x3c);
  b.write('PE\0\0', 0x80, 'latin1');
  b.writeUInt16LE(machine, 0x84);
  return b;
}
function elf(machine, bigEndian = false) {
  const b = Buffer.alloc(64);
  b.write('\x7fELF', 0, 'latin1');
  b[4] = 2;
  b[5] = bigEndian ? 2 : 1;
  if (bigEndian) b.writeUInt16BE(machine, 18); else b.writeUInt16LE(machine, 18);
  return b;
}

function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-native-'));
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
  }
  return dir;
}
const NM = 'programs/server/npm/node_modules';
const pkg = (o) => JSON.stringify(o);
const CANVAS = {
  name: '@napi-rs/canvas', version: '1.0.10',
  optionalDependencies: Object.fromEntries(['android-arm64', 'darwin-arm64', 'darwin-x64', 'linux-arm-gnueabihf',
    'linux-arm64-gnu', 'linux-arm64-musl', 'linux-riscv64-gnu', 'linux-x64-gnu', 'linux-x64-musl', 'win32-arm64-msvc',
    'win32-x64-msvc'].map((s) => [`@napi-rs/canvas-${s}`, '1.0.10'])),
};
const SHARP = {
  name: 'sharp', version: '0.35.5',
  optionalDependencies: {
    '@img/sharp-linux-x64': '0.35.5', '@img/sharp-linux-arm': '0.35.5', '@img/sharp-linux-s390x': '0.35.5',
    '@img/sharp-darwin-arm64': '0.35.5', '@img/sharp-win32-ia32': '0.35.5',
    '@img/sharp-libvips-linux-arm': '1.3.4',
  },
};

// A registry: { 'name@version': { files: [[path, content]], optionalDependencies } }.
function registry(packages) {
  const served = [];
  const tarballs = {};
  for (const [id, p] of Object.entries(packages)) {
    tarballs[id] = zlib.gzipSync(tar(p.files.map(([f, c]) => [`package/${f}`, c])));
  }
  const fetch = async (url) => {
    served.push(url);
    const m = /^https:\/\/registry\.npmjs\.org\/(.+)\/([^/]+)$/.exec(url);
    if (m) {
      const id = `${decodeURIComponent(m[1])}@${m[2]}`;
      if (!packages[id]) return new Response('nope', { status: 404 });
      return new Response(JSON.stringify({
        optionalDependencies: packages[id].optionalDependencies,
        dist: { tarball: `https://tar.example/${encodeURIComponent(id)}.tgz`, integrity: packages[id].integrity || integrity(tarballs[id]) },
      }));
    }
    const t = /^https:\/\/tar\.example\/(.+)\.tgz$/.exec(url);
    if (t) return new Response(tarballs[decodeURIComponent(t[1])]);
    return new Response('nope', { status: 404 });
  };
  return { fetch, served };
}
async function withFetch(fetch, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = fetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = real;
  }
}
const quiet = { log: () => {} };

console.log('platformNativePackages:');

await test('the sharp package is the one sharp itself pins for that platform and CPU', () => {
  assert.deepStrictEqual(sharpPlatformSpec(SHARP, 'linux', 's390x'), { name: '@img/sharp-linux-s390x', version: '0.35.5' });
  assert.deepStrictEqual(sharpPlatformSpec(SHARP, 'darwin', 'arm64'), { name: '@img/sharp-darwin-arm64', version: '0.35.5' });
  assert.deepStrictEqual(sharpPlatformSpec(SHARP, 'win32', 'ia32'), { name: '@img/sharp-win32-ia32', version: '0.35.5' });
  // sharp publishes nothing for Linux i386: no guess, the fallback is used.
  assert.strictEqual(sharpPlatformSpec(SHARP, 'linux', 'ia32'), null);
});

await test('the tarball is unpacked without its package/ prefix', () => {
  const files = untar(tar([['package/package.json', '{"name":"x"}'], ['package/lib/sharp.node', 'MZ']]));
  assert.deepStrictEqual(files.map((f) => f.path), ['package.json', 'lib/sharp.node']);
  assert.strictEqual(files[1].data.toString(), 'MZ');
});

await test('a tar entry outside the package is refused', () => {
  assert.throws(() => untar(tar([['package/../../evil.so', 'x']])), /outside the package/);
  assert.throws(() => untar(tar([['package//etc/passwd', 'x']])), /outside the package/);
});

await test('the download must match the registry sha512', () => {
  const buf = Buffer.from('tarball');
  verifyIntegrity(buf, integrity(buf));
  assert.throws(() => verifyIntegrity(Buffer.from('tampered'), integrity(buf)), /integrity mismatch/);
  assert.throws(() => verifyIntegrity(buf, 'sha1-abc'), /no sha512/);
});

await test('only packages npm would not install on the target are removed', () => {
  const dir = tree({
    [`${NM}/@img/sharp-linux-x64/package.json`]: pkg({ os: ['linux'], cpu: ['x64'], libc: ['glibc'] }),
    [`${NM}/@img/sharp-linuxmusl-arm/package.json`]: pkg({ os: ['linux'], cpu: ['arm'], libc: ['musl'] }),
    [`${NM}/@img/sharp-win32-x64/package.json`]: pkg({ os: ['win32'], cpu: ['x64'] }),
    [`${NM}/@img/sharp-wasm32/package.json`]: pkg({ name: '@img/sharp-wasm32' }),
    [`${NM}/sharp/package.json`]: pkg({ name: 'sharp' }),
    [`${NM}/not-on-aix/package.json`]: pkg({ os: ['!aix'] }),
    [`${NM}/linux-only/package.json`]: pkg({ os: ['linux'] }),
    [`${NM}/linux-only/node_modules/inner/package.json`]: pkg({ os: ['linux'] }),
  });
  try {
    const server = path.join(dir, 'programs/server');
    const rel = (p, a) => foreignPackages(server, p, a)
      .map((d) => path.relative(dir, d).split(path.sep).join('/')).sort();
    assert.deepStrictEqual(rel('linux', 'arm'), [
      `${NM}/@img/sharp-linux-x64`,
      `${NM}/@img/sharp-linuxmusl-arm`,
      `${NM}/@img/sharp-win32-x64`,
    ], 'another CPU, another libc and another OS go; wasm32 and plain packages stay');
    assert.deepStrictEqual(rel('win32', 'x64'), [
      `${NM}/@img/sharp-linux-x64`,
      `${NM}/@img/sharp-linuxmusl-arm`,
      `${NM}/linux-only`,
    ], 'a nested package goes with its parent, and is not listed twice');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('Linux s390x: sharp and its libvips arrive, and the x64 ones go', async () => {
  const dir = tree({
    [`${NM}/sharp/package.json`]: pkg({ ...SHARP, optionalDependencies: { ...SHARP.optionalDependencies } }),
    [`${NM}/@img/sharp-linux-x64/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
    [`${NM}/@img/sharp-linux-x64/lib/sharp-linux-x64.node`]: elf(62),
  });
  const reg = registry({
    '@img/sharp-linux-s390x@0.35.5': {
      optionalDependencies: { '@img/sharp-libvips-linux-s390x': '1.3.4' },
      files: [['package.json', pkg({ os: ['linux'], cpu: ['s390x'] })], ['lib/sharp-linux-s390x-0.35.5.node', elf(22, true)]],
    },
    '@img/sharp-libvips-linux-s390x@1.3.4': {
      files: [['package.json', pkg({ os: ['linux'], cpu: ['s390x'] })], ['lib/libvips-cpp.so.8.18.7', 'so']],
    },
  });
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'linux', 's390x', quiet));
    assert.deepStrictEqual(r.errors, []);
    assert.deepStrictEqual(r.added.map((a) => `${a.name}@${a.version}`),
      ['@img/sharp-linux-s390x@0.35.5', '@img/sharp-libvips-linux-s390x@1.3.4']);
    assert.ok(fs.existsSync(path.join(dir, NM, '@img/sharp-libvips-linux-s390x/lib/libvips-cpp.so.8.18.7')));
    assert.ok(!fs.existsSync(path.join(dir, NM, '@img/sharp-linux-x64')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Negative, and the reason v12.33's 32-bit ARM bundles were dangerous: sharp's
// linux-arm .node is ARMv7 and its libvips ARMv8, canvas's ARMv7. On an ARMv6
// board (Raspberry Pi 1, Zero) that is a SIGILL that kills WeKan. 32-bit ARM
// downloads no native package at all and keeps the WebAssembly sharp.
await test('32-bit ARM gets no native sharp or canvas, only the WebAssembly sharp', async () => {
  assert.strictEqual(sharpPlatformSpec(SHARP, 'linux', 'arm'), null);
  assert.strictEqual(canvasPlatformSpec(CANVAS, 'linux', 'arm'), null);
  const dir = tree({
    [`${NM}/sharp/package.json`]: pkg(SHARP),
    [`${NM}/@img/sharp-wasm32/package.json`]: pkg({ name: '@img/sharp-wasm32', version: '0.35.5' }),
    [`${NM}/@emnapi/runtime/package.json`]: pkg({ name: '@emnapi/runtime', version: '1.11.3' }),
    [`${NM}/@napi-rs/canvas/package.json`]: pkg(CANVAS),
    [`${NM}/@napi-rs/canvas-linux-x64-gnu/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
  });
  const reg = registry({});
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'linux', 'arm', quiet));
    assert.deepStrictEqual(r.errors, []);
    assert.deepStrictEqual(r.added, []);
    assert.deepStrictEqual(reg.served, [], 'nothing is downloaded for 32-bit ARM');
    assert.ok(!fs.existsSync(path.join(dir, NM, '@napi-rs/canvas-linux-x64-gnu')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('canvas: the glibc / MSVC package for the CPU, never musl', async () => {
  assert.deepStrictEqual(canvasPlatformSpec(CANVAS, 'linux', 'arm64'), { name: '@napi-rs/canvas-linux-arm64-gnu', version: '1.0.10' });
  assert.deepStrictEqual(canvasPlatformSpec(CANVAS, 'linux', 'x64'), { name: '@napi-rs/canvas-linux-x64-gnu', version: '1.0.10' });
  assert.deepStrictEqual(canvasPlatformSpec(CANVAS, 'win32', 'x64'), { name: '@napi-rs/canvas-win32-x64-msvc', version: '1.0.10' });
  assert.deepStrictEqual(canvasPlatformSpec(CANVAS, 'darwin', 'arm64'), { name: '@napi-rs/canvas-darwin-arm64', version: '1.0.10' });
  for (const [p, a] of [['linux', 's390x'], ['linux', 'ppc64'], ['linux', 'ia32'], ['win32', 'ia32']]) {
    assert.strictEqual(canvasPlatformSpec(CANVAS, p, a), null, `${p}-${a} has none`);
  }
  // And it is downloaded and checked like sharp.
  const dir = tree({
    [`${NM}/sharp/package.json`]: pkg(SHARP),
    [`${NM}/@napi-rs/canvas/package.json`]: pkg(CANVAS),
  });
  const reg = registry({
    '@img/sharp-darwin-arm64@0.35.5': { files: [['package.json', pkg({ os: ['darwin'], cpu: ['arm64'] })]] },
    '@napi-rs/canvas-darwin-arm64@1.0.10': { files: [['package.json', pkg({ os: ['darwin'], cpu: ['arm64'] })]] },
  });
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'darwin', 'arm64', quiet));
    assert.deepStrictEqual(r.added.map((x) => x.name), ['@img/sharp-darwin-arm64', '@napi-rs/canvas-darwin-arm64']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('Windows 32-bit: the PE package arrives and passes the check', async () => {
  const dir = tree({ [`${NM}/sharp/package.json`]: pkg(SHARP) });
  const reg = registry({
    '@img/sharp-win32-ia32@0.35.5': {
      files: [['package.json', pkg({ os: ['win32'], cpu: ['ia32'] })],
        ['lib/sharp-win32-ia32-0.35.5.node', pe(0x014c)], ['lib/libvips-42.dll', 'MZ']],
    },
  });
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'win32', 'ia32', quiet));
    assert.deepStrictEqual(r.errors, []);
    assert.ok(fs.existsSync(path.join(dir, NM, '@img/sharp-win32-ia32/lib/libvips-42.dll')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Negative: a package that arrives built for the wrong CPU fails the run.
await test('a sharp package for the wrong CPU is reported', async () => {
  const dir = tree({ [`${NM}/sharp/package.json`]: pkg(SHARP) });
  const reg = registry({
    '@img/sharp-linux-s390x@0.35.5': {
      files: [['package.json', pkg({ os: ['linux'], cpu: ['s390x'] })], ['lib/sharp.node', elf(21, true)]],
    },
  });
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'linux', 's390x', quiet));
    assert.ok(r.errors.some((e) => /ELF machine 21, not a s390x Linux addon/.test(e)), r.errors.join('\n'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('a tampered tarball is not unpacked', async () => {
  const dir = tree({ [`${NM}/sharp/package.json`]: pkg(SHARP) });
  const reg = registry({
    '@img/sharp-darwin-arm64@0.35.5': {
      integrity: integrity(Buffer.from('something else')),
      files: [['package.json', pkg({ os: ['darwin'], cpu: ['arm64'] })]],
    },
  });
  try {
    await assert.rejects(withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'darwin', 'arm64', quiet)),
      /integrity mismatch/);
    assert.ok(!fs.existsSync(path.join(dir, NM, '@img/sharp-darwin-arm64')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('Linux i386 keeps the WebAssembly sharp, and downloads nothing', async () => {
  const dir = tree({
    [`${NM}/sharp/package.json`]: pkg(SHARP),
    [`${NM}/@img/sharp-wasm32/package.json`]: pkg({ name: '@img/sharp-wasm32', version: '0.35.5' }),
    [`${NM}/@emnapi/runtime/package.json`]: pkg({ name: '@emnapi/runtime', version: '1.11.3' }),
  });
  const reg = registry({});
  try {
    const r = await withFetch(reg.fetch, () => addPlatformNativePackages(dir, 'linux', 'ia32', quiet));
    assert.deepStrictEqual(r.errors, []);
    assert.deepStrictEqual(r.added, []);
    assert.deepStrictEqual(reg.served, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Negative: no native package and no fallback is an error, not a silent pass.
await test('no native sharp and no usable WebAssembly fallback is an error', async () => {
  const cases = [
    [{}, /is not in the bundle to fall back to/],
    [{ [`${NM}/@img/sharp-wasm32/package.json`]: pkg({ version: '0.34.0' }) }, /does not match sharp 0\.35\.5/],
    [{ [`${NM}/@img/sharp-wasm32/package.json`]: pkg({ version: '0.35.5' }) }, /needs @emnapi\/runtime/],
  ];
  for (const [extra, error] of cases) {
    const dir = tree({ [`${NM}/sharp/package.json`]: pkg(SHARP), ...extra });
    try {
      await assert.rejects(addPlatformNativePackages(dir, 'linux', 'loong64', quiet), error);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

await test('a bundle with no sharp, or an unknown target, is an error', async () => {
  const dir = tree({ [`${NM}/x/package.json`]: pkg({}) });
  try {
    await assert.rejects(addPlatformNativePackages(dir, 'linux', 'arm', quiet), /no sharp/);
    await assert.rejects(addPlatformNativePackages(dir, 'linux', 'mips', quiet), /unknown target/);
    await assert.rejects(addPlatformNativePackages(dir, 'darwin', 'ia32', quiet), /unknown target/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// CodeQL alert #564 (js/regex-injection): platform and arch come from the
// command line and were compiled into a RegExp, so an arch of `.*` matched
// any canvas package and `(a+)+$` was a pattern of the caller's choosing.
// They are compared as strings now.
await test('canvas: platform and arch are literal text, not regex (negative)', async () => {
  for (const arch of ['.*', 'x6.', 'x64|arm64', '(a+)+$', '[a-z0-9]+']) {
    assert.strictEqual(canvasPlatformSpec(CANVAS, 'linux', arch), null, `arch ${arch}`);
  }
  assert.strictEqual(canvasPlatformSpec(CANVAS, '.+', 'x64'), null);
  const evil = { optionalDependencies: { ['@napi-rs/canvas-linux-' + 'a'.repeat(40) + '!']: '1.0.0' } };
  const started = Date.now();
  assert.strictEqual(canvasPlatformSpec(evil, 'linux', '(a+)+$'), null);
  assert.ok(Date.now() - started < 1000, 'no backtracking pattern is ever run');
  assert.ok(!/new RegExp\(/.test(fs.readFileSync(path.join(__dirname, '..', 'releases/platform-native-packages.mjs'), 'utf8')),
    'platform-native-packages.mjs builds no RegExp from its arguments');
});

// CodeQL alert #563 (js/incomplete-sanitization): `name.replace('/', '%2F')`
// replaced only the first `/`. Every one is replaced now, and something that
// is not an npm package name is refused instead of becoming another URL.
await test('the registry path encodes every / and refuses what is not a package name', async () => {
  assert.strictEqual(registryPackagePath('@img/sharp-linux-arm64'), '@img%2Fsharp-linux-arm64');
  assert.strictEqual(registryPackagePath('@napi-rs/canvas-win32-x64-msvc'), '@napi-rs%2Fcanvas-win32-x64-msvc');
  assert.strictEqual(registryPackagePath('sharp'), 'sharp');
  for (const bad of ['@img/sharp/../../x', 'a/b/c', '../sharp', '@img/', '/sharp', 'sharp?x=1', 'sharp#x', '', null]) {
    assert.throws(() => registryPackagePath(bad), /not an npm package name/, String(bad));
  }
});

console.log(`\nplatformNativePackages: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
