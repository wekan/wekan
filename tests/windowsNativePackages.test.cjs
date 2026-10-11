'use strict';
(async () => {

// Plain-Node unit test for releases/windows-native-packages.mjs.
// Run: node tests/windowsNativePackages.test.cjs
//
// Every Windows bundle is made from the amd64 Linux bundle, so sharp - the
// attachment thumbnails - had only @img/sharp-linux-x64 there and could never
// load on Windows. The script puts in @img/sharp-win32-<arch> at the version
// sharp pins, checked against the registry's sha512, and removes the packages
// npm would not install on that platform. The network is replaced here by a
// fetch that serves a tarball built in the test.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const {
  sharpPlatformSpec,
  untar,
  verifyIntegrity,
  foreignPackages,
  addWindowsNativePackages,
} = await import('../releases/windows-native-packages.mjs');

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

function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'win-native-'));
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
  }
  return dir;
}
const NM = 'programs/server/npm/node_modules';
const pkg = (o) => JSON.stringify(o);

console.log('windowsNativePackages:');

await test('the sharp package is the one sharp itself pins for that CPU', () => {
  const sharp = {
    version: '0.35.5',
    optionalDependencies: {
      '@img/sharp-win32-ia32': '0.35.5',
      '@img/sharp-win32-x64': '0.35.5',
      '@img/sharp-linux-x64': '0.35.5',
    },
  };
  assert.deepStrictEqual(sharpPlatformSpec(sharp, 'ia32'), { name: '@img/sharp-win32-ia32', version: '0.35.5' });
  assert.deepStrictEqual(sharpPlatformSpec(sharp, 'x64'), { name: '@img/sharp-win32-x64', version: '0.35.5' });
  // Negative: a sharp that does not support the CPU is an error, not a guess.
  assert.throws(() => sharpPlatformSpec(sharp, 'arm64'), /lists no @img\/sharp-win32-arm64/);
});

await test('the tarball is unpacked without its package/ prefix', () => {
  const files = untar(tar([
    ['package/package.json', '{"name":"x"}'],
    ['package/lib/sharp.node', 'MZ'],
  ]));
  assert.deepStrictEqual(files.map((f) => f.path), ['package.json', 'lib/sharp.node']);
  assert.strictEqual(files[1].data.toString(), 'MZ');
});

await test('a tar entry outside the package is refused', () => {
  assert.throws(() => untar(tar([['package/../../evil.dll', 'x']])), /outside the package/);
  assert.throws(() => untar(tar([['package//etc/passwd', 'x']])), /outside the package/);
});

await test('the download must match the registry sha512', () => {
  const buf = Buffer.from('tarball');
  verifyIntegrity(buf, integrity(buf));
  assert.throws(() => verifyIntegrity(Buffer.from('tampered'), integrity(buf)), /integrity mismatch/);
  assert.throws(() => verifyIntegrity(buf, 'sha1-abc'), /no sha512/);
});

await test('only packages npm would not install on win32/<arch> are removed', () => {
  const dir = tree({
    [`${NM}/@img/sharp-linux-x64/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
    [`${NM}/@img/sharp-libvips-linux-x64/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
    [`${NM}/@img/sharp-win32-x64/package.json`]: pkg({ os: ['win32'], cpu: ['x64'] }),
    [`${NM}/@napi-rs/canvas-linux-x64-gnu/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
    [`${NM}/sharp/package.json`]: pkg({ name: 'sharp' }),
    [`${NM}/not-on-aix/package.json`]: pkg({ os: ['!aix'] }),
    [`${NM}/linux-only/package.json`]: pkg({ os: ['linux'] }),
    [`${NM}/linux-only/node_modules/inner/package.json`]: pkg({ os: ['linux'] }),
  });
  try {
    const server = path.join(dir, 'programs/server');
    const rel = (arch) => foreignPackages(server, arch).map((d) => path.relative(dir, d).split(path.sep).join('/')).sort();
    assert.deepStrictEqual(rel('x64'), [
      `${NM}/@img/sharp-libvips-linux-x64`,
      `${NM}/@img/sharp-linux-x64`,
      `${NM}/@napi-rs/canvas-linux-x64-gnu`,
      `${NM}/linux-only`,
    ], 'a nested package goes with its parent, and is not listed twice');
    // On ia32 the x64 Windows package is foreign as well.
    assert.ok(rel('ia32').includes(`${NM}/@img/sharp-win32-x64`));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('the whole run, against a registry that serves a built tarball', async () => {
  const dir = tree({
    [`${NM}/sharp/package.json`]: pkg({
      name: 'sharp', version: '0.35.5',
      optionalDependencies: { '@img/sharp-win32-ia32': '0.35.5', '@img/sharp-linux-x64': '0.35.5' },
    }),
    [`${NM}/@img/sharp-linux-x64/package.json`]: pkg({ os: ['linux'], cpu: ['x64'] }),
    [`${NM}/@img/sharp-linux-x64/lib/sharp-linux-x64.node`]: 'ELF',
  });
  const tgz = zlib.gzipSync(tar([
    ['package/package.json', pkg({ name: '@img/sharp-win32-ia32', os: ['win32'], cpu: ['ia32'] })],
    ['package/lib/sharp-win32-ia32-0.35.5.node', 'MZ'],
    ['package/lib/libvips-42.dll', 'MZ'],
  ]));
  const realFetch = globalThis.fetch;
  const asked = [];
  globalThis.fetch = async (url) => {
    asked.push(url);
    if (url === 'https://registry.npmjs.org/@img%2Fsharp-win32-ia32/0.35.5') {
      return new Response(JSON.stringify({ dist: { tarball: 'https://tar.example/x.tgz', integrity: integrity(tgz) } }));
    }
    if (url === 'https://tar.example/x.tgz') return new Response(tgz);
    return new Response('nope', { status: 404 });
  };
  try {
    const r = await addWindowsNativePackages(dir, 'ia32', { log: () => {} });
    assert.deepStrictEqual(r.removed.map((d) => d.split(path.sep).join('/')), [`${NM}/@img/sharp-linux-x64`]);
    assert.strictEqual(r.added.version, '0.35.5');
    const added = path.join(dir, NM, '@img/sharp-win32-ia32');
    assert.ok(fs.existsSync(path.join(added, 'lib/sharp-win32-ia32-0.35.5.node')));
    assert.ok(fs.existsSync(path.join(added, 'lib/libvips-42.dll')), 'the libvips DLLs come along');
    assert.ok(!fs.existsSync(path.join(dir, NM, '@img/sharp-linux-x64')));
    assert.strictEqual(asked.length, 2);

    // Negative: a tarball that does not match the registry's sha512 is not
    // unpacked, and the run fails.
    globalThis.fetch = async (url) => url.startsWith('https://registry')
      ? new Response(JSON.stringify({ dist: { tarball: 'https://tar.example/x.tgz', integrity: integrity(Buffer.from('other')) } }))
      : new Response(tgz);
    fs.rmSync(added, { recursive: true, force: true });
    await assert.rejects(addWindowsNativePackages(dir, 'ia32', { log: () => {} }), /integrity mismatch/);
    assert.ok(!fs.existsSync(added), 'nothing is written from a tarball that failed its check');
  } finally {
    globalThis.fetch = realFetch;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

await test('a bundle with no sharp, or an unknown CPU, is an error', async () => {
  const dir = tree({ [`${NM}/x/package.json`]: pkg({}) });
  try {
    await assert.rejects(addWindowsNativePackages(dir, 'ia32', { log: () => {} }), /no sharp/);
    await assert.rejects(addWindowsNativePackages(dir, 'mips', { log: () => {} }), /unknown arch/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\nwindowsNativePackages: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
