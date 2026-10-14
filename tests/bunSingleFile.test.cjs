'use strict';
(async () => {

// Bun single files (docs/Platforms/Single-File.md, "Bun single files"): one
// executable per Bun platform, holding that platform's published Bun bundle
// ZIP unchanged, which the launcher extracts once and runs with itself as Bun.
// This covers the ZIP reader the launcher uses (stored, deflated, ZIP64, Unix
// modes, symbolic links) and its refusals (Zip Slip), the builder's argument
// and bundle checks, and that the workflow builds on each platform with the
// bundle's own Bun. Run: node tests/bunSingleFile.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const { listEntries, extractZip, safeTarget } = await import('../releases/single-file/bun/unzip.mjs');
const { parseArgs, bundlePrefix } = await import('../releases/single-file/bun/build.mjs');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A minimal ZIP writer: entries {name, data, mode, deflate}, optionally ZIP64.
function makeZip(entries, { zip64 = false } = {}) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const raw = Buffer.from(e.data || '');
    const body = e.deflate ? zlib.deflateRawSync(raw) : raw;
    const method = e.deflate ? 8 : 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(zip64 ? 45 : 20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(zip64 ? 0xffffffff : body.length, 18);
    local.writeUInt32LE(zip64 ? 0xffffffff : raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    const extra = zip64 ? Buffer.alloc(4 + 24) : Buffer.alloc(0);
    if (zip64) {
      extra.writeUInt16LE(0x0001, 0);
      extra.writeUInt16LE(24, 2);
      extra.writeBigUInt64LE(BigInt(raw.length), 4);
      extra.writeBigUInt64LE(BigInt(body.length), 12);
      extra.writeBigUInt64LE(BigInt(offset), 20);
    }
    local.writeUInt16LE(zip64 ? 4 + 16 : 0, 28);
    const localExtra = zip64 ? extra.subarray(0, 20) : Buffer.alloc(0);
    if (zip64) localExtra.writeUInt16LE(16, 2);
    const localBuf = Buffer.concat([local, name, Buffer.from(localExtra), body]);
    if (zip64) { // restore the full central extra after borrowing its head
      extra.writeUInt16LE(24, 2);
    }
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 45, 4);
    central.writeUInt16LE(45, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(zip64 ? 0xffffffff : body.length, 20);
    central.writeUInt32LE(zip64 ? 0xffffffff : raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(extra.length, 30);
    central.writeUInt32LE(((e.mode || 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(zip64 ? 0xffffffff : offset, 42);
    centrals.push(Buffer.concat([central, name, extra]));
    locals.push(localBuf);
    offset += localBuf.length;
  }
  const cd = Buffer.concat(centrals);
  const tail = [];
  if (zip64) {
    const eocd64 = Buffer.alloc(56);
    eocd64.writeUInt32LE(0x06064b50, 0);
    eocd64.writeBigUInt64LE(44n, 4);
    eocd64.writeBigUInt64LE(BigInt(entries.length), 24);
    eocd64.writeBigUInt64LE(BigInt(entries.length), 32);
    eocd64.writeBigUInt64LE(BigInt(cd.length), 40);
    eocd64.writeBigUInt64LE(BigInt(offset), 48);
    const locator = Buffer.alloc(20);
    locator.writeUInt32LE(0x07064b50, 0);
    locator.writeBigUInt64LE(BigInt(offset + cd.length), 8);
    locator.writeUInt32LE(1, 16);
    tail.push(eocd64, locator);
  }
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(zip64 ? 0xffff : entries.length, 8);
  eocd.writeUInt16LE(zip64 ? 0xffff : entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(zip64 ? 0xffffffff : offset, 16);
  return Buffer.concat([...locals, cd, ...tail, eocd]);
}

const tmpRoot = path.join(ROOT, '.tools', 'tmp', `bun-single-${process.pid}`);
fs.mkdirSync(tmpRoot, { recursive: true });
const fresh = name => { const d = path.join(tmpRoot, name); fs.rmSync(d, { recursive: true, force: true }); return d; };

try {
  const bundle = [
    { name: 'bundle/', mode: 0o040755 },
    { name: 'bundle/index.mjs', data: 'console.log(1)', deflate: true },
    { name: 'bundle/bun', data: 'BUN', mode: 0o100755 },
    { name: 'bundle/node_modules/a/b.js', data: 'x'.repeat(5000), deflate: true },
    { name: 'bundle/bin/tool.sh', data: '#!/bin/sh\n', mode: 0o100755 },
    { name: 'bundle/node_modules/.bin/b', data: '../a/b.js', mode: 0o120777 },
  ];

  test('a bundle ZIP is extracted under its directory, with modes, without the bundle\'s bun', () => {
    for (const zip64 of [false, true]) {
      const dir = fresh(zip64 ? 'z64' : 'z32');
      const zip = makeZip(bundle, { zip64 });
      assert.strictEqual(listEntries(zip).length, bundle.length);
      const files = extractZip(zip, dir, { strip: 'bundle', skip: rel => rel === 'bun' || rel === 'bun.exe' });
      assert.strictEqual(files, 3, zip64 ? 'zip64' : 'zip');
      assert.strictEqual(fs.readFileSync(path.join(dir, 'index.mjs'), 'utf8'), 'console.log(1)');
      assert.strictEqual(fs.readFileSync(path.join(dir, 'node_modules/a/b.js'), 'utf8').length, 5000);
      assert.ok(!fs.existsSync(path.join(dir, 'bun')), 'the single file is that Bun');
      if (process.platform !== 'win32') {
        assert.strictEqual(fs.statSync(path.join(dir, 'bin/tool.sh')).mode & 0o111, 0o111);
        assert.strictEqual(fs.readlinkSync(path.join(dir, 'node_modules/.bin/b')), '../a/b.js');
      }
    }
  });

  test('negative: no entry or link may leave the extraction directory (Zip Slip)', () => {
    for (const name of ['bundle/../evil.js', 'bundle/a/../../evil.js', '/etc/passwd', 'C:/x.js', 'other/x.js']) {
      const zip = makeZip([{ name, data: 'evil' }]);
      assert.throws(() => extractZip(zip, fresh('slip'), { strip: 'bundle' }), /unsafe path|outside bundle/, name);
    }
    assert.throws(() => extractZip(makeZip([{ name: 'bundle/x', data: '../../../etc', mode: 0o120777 }]), fresh('slip2'), { strip: 'bundle' }),
      /symbolic link leaves the bundle/);
    assert.throws(() => extractZip(makeZip([{ name: 'bundle/x', data: '/etc/passwd', mode: 0o120777 }]), fresh('slip3'), { strip: 'bundle' }),
      /symbolic link leaves the bundle/);
    assert.ok(!fs.existsSync(path.join(tmpRoot, 'evil.js')));
    assert.strictEqual(safeTarget('/r', 'bundle', 'bundle'), null);
  });

  test('negative: what is not a ZIP, or not a whole one, is refused', () => {
    assert.throws(() => listEntries(Buffer.from('not a zip at all, just text, long enough')), /not a ZIP/);
    const zip = makeZip([{ name: 'bundle/index.mjs', data: 'x' }]);
    assert.throws(() => listEntries(zip.subarray(0, zip.length - 30)), /not a ZIP|bad/);
  });

  test('the builder takes exactly its arguments, and only a WeKan Bun bundle', () => {
    assert.deepStrictEqual(parseArgs(['--zip', 'a.zip', '--target', 'linux-x64-musl', '--version', 'v12.41', '--out', 'o']),
      { zip: 'a.zip', target: 'linux-x64-musl', version: 'v12.41', out: 'o' });
    assert.throws(() => parseArgs(['--zip', 'a.zip']), /required/);
    assert.throws(() => parseArgs(['--zip', 'a', '--target', '../x', '--version', '1.0', '--out', 'o']), /bad target/);
    assert.throws(() => parseArgs(['--zip', 'a', '--target', 'x', '--version', '1;rm', '--out', 'o']), /bad version/);
    assert.throws(() => parseArgs(['--evil', 'x']), /usage/);
    assert.strictEqual(bundlePrefix(listEntries(makeZip(bundle))), 'bundle');
    assert.throws(() => bundlePrefix(listEntries(makeZip([{ name: 'bundle/main.js', data: '' }]))), /not a WeKan Bun bundle/);
    assert.throws(() => bundlePrefix(listEntries(makeZip([{ name: 'a/index.mjs', data: '' }, { name: 'b/x', data: '' }]))), /one directory/);
  });
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

test('the launcher runs the bundle with itself as Bun, and needs a database', () => {
  const src = read('releases/single-file/bun/launcher.mjs');
  assert.match(src, /import payload from '\.\/payload\/bundle\.zip' with \{ type: 'file' \}/);
  assert.match(src, /skip: rel => rel === 'bun' \|\| rel === 'bun\.exe'/);
  assert.match(src, /spawn\(process\.execPath, \[path\.join\(dir, 'index\.mjs'\), \.\.\.argv\]/);
  assert.match(src, /BUN_BE_BUN: '1'/);
  assert.match(src, /for \(const name of \['MONGO_URL', 'ROOT_URL'\]\)/);
  // Extracted beside, then renamed into place: a half extraction is never used.
  assert.match(src, /renameSync\(tmp, dir\)/);
  assert.match(src, /\.extracted/);
});

test('the workflow builds each target on its own platform, with the bundle\'s own Bun', () => {
  const wf = read('.github/workflows/bun-single-file.yml');
  assert.match(wf, /runs-on: \$\{\{ matrix\.runner \}\}/);
  assert.match(wf, /t\["kind"\] in \("native", "musl"\)/);
  assert.match(wf, /alpine:3\.23/, 'musl in Alpine, as bun.yml builds it');
  assert.match(wf, /sha256sum -c "\$zip\.sha256sum"/, 'never from an unverified bundle');
  assert.match(wf, /unzip -q -j "\$zip" "bundle\/\$bun" -d builder/);
  assert.match(read('releases/single-file/bun/build-and-check.sh'), /env -u MONGO_URL -u ROOT_URL "\$exe"/);
  assert.match(read('.github/workflows/release-all.yml'), /uses: \.\/\.github\/workflows\/bun-single-file\.yml/);
});

console.log(`bunSingleFile: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
