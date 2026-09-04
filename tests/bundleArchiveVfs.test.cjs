'use strict';

// Guard: releases/single-exe/wekan-vfs.cjs runs the server out of the bundle
// ZIP instead of unpacking it.
// Run: node tests/bundleArchiveVfs.test.cjs
//
// The single Windows EXE keeps the whole bundle inside itself and mounts it in
// the server process, so only about thirty files - the executables, the native
// addons and a few loader files - ever reach the disk. The other ~39,000 are
// read from the EXE. That means WeKan now depends on this file getting three
// separate things right, and each of them has already been wrong once:
//
//   * the ZIP reader, because a wrong offset serves one file's bytes under
//     another file's name - which is exactly how Enigma Virtual Box broke
//     11.48, and the reason that packer is gone;
//   * CommonJS resolution, because Node's own resolver runs on internal C++
//     bindings that cannot be redirected, so it is reimplemented here and has
//     to agree with the answer Node would have given;
//   * the format declared for a resolved file, because declaring "commonjs"
//     for a .node addon makes Node compile the binary as JavaScript and die
//     with "SyntaxError: Invalid or unexpected token" on its own header - the
//     11.48 crash reproduced from the other side, which is what happened on
//     the first attempt at this.
//
// These tests build a small ZIP, mount it, and pin all three.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const ROOT_REPO = path.join(__dirname, '..');
const VFS = path.join(ROOT_REPO, 'releases', 'single-exe', 'wekan-vfs.cjs');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// ---- a minimal ZIP writer, so the fixture needs no external tool ------------

const crc32 = zlib.crc32 || (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return buffer => {
    let c = -1;
    for (const byte of buffer) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

/* entries: [name, Buffer|string, 'store'|'deflate'] */
function makeZip(entries) {
  const locals = [];
  const central = [];
  let at = 0;
  for (const [name, body, how] of entries) {
    const data = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const method = how === 'store' ? 0 : 8;
    const stored = method === 0 ? data : zlib.deflateRawSync(data);
    const nameBuf = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, stored);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(crc32(data), 16);
    entry.writeUInt32LE(stored.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(at, 42);
    central.push(entry, nameBuf);
    at += local.length + nameBuf.length + stored.length;
  }
  const body = Buffer.concat(locals);
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(body.length, 16);
  return Buffer.concat([body, directory, end]);
}

// ---- the fixture bundle ----------------------------------------------------

const BIG = crypto.randomBytes(300000);
const BOOT = '// boot\n'.repeat(4000) + "module.exports = 'boot';\n";
const DUAL_PACKAGE = {
  name: 'dual',
  main: './legacy.js',
  // The shape that got resolution wrong first: conditions inside an array of
  // alternatives, where the answer depends on the object's own key order.
  exports: {
    '.': [
      { 'module-sync': './sync.js', import: './esm.mjs', default: './default.js' },
      './fallback.js',
    ],
  },
};
const FILES = [
  ['bundle/main.js', "module.exports = 'main';", 'deflate'],
  ['bundle/programs/server/boot.js', BOOT, 'deflate'],
  ['bundle/stored.bin', BIG, 'store'],
  ['bundle/shadowed.js', "module.exports = 'from the archive';", 'deflate'],
  ['bundle/lib/greet.js', "module.exports = require('./inner/deep.js') + '!';", 'deflate'],
  ['bundle/lib/inner/deep.js', "module.exports = 'deep';", 'deflate'],
  ['bundle/data/config.json', '{"answer":42}', 'deflate'],
  ['bundle/node_modules/plain/package.json', '{"name":"plain","main":"./lib/entry.js"}', 'deflate'],
  ['bundle/node_modules/plain/lib/entry.js', "module.exports = 'plain-entry';", 'deflate'],
  ['bundle/node_modules/dual/package.json', JSON.stringify(DUAL_PACKAGE), 'deflate'],
  ['bundle/node_modules/dual/sync.js', "module.exports = 'dual-sync';", 'deflate'],
  ['bundle/node_modules/dual/default.js', "module.exports = 'dual-default';", 'deflate'],
  ['bundle/node_modules/dual/legacy.js', "module.exports = 'dual-legacy';", 'deflate'],
  ['bundle/node_modules/consumer/index.js',
    "module.exports = require('plain') + '/' + require('dual');", 'deflate'],
  ['bundle/native/fake.node', Buffer.from('MZ  not really an addon'), 'store'],
];

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-vfs-'));
process.on('exit', () => fs.rmSync(work, { recursive: true, force: true }));
const archive = path.join(work, 'bundle.zip');
const mount = path.join(work, 'wekan-app');
/* A leading pad, so the archive does not start at offset 0 - as in the EXE. */
const PAD = Buffer.alloc(4096, 0x5a);
fs.writeFileSync(archive, Buffer.concat([PAD, makeZip(FILES)]));
fs.mkdirSync(mount, { recursive: true });
fs.writeFileSync(path.join(mount, 'shadowed.js'), "module.exports = 'the real file';");
fs.mkdirSync(path.join(mount, 'programs', 'server'), { recursive: true });
fs.writeFileSync(path.join(mount, 'programs', 'server', 'only-real.txt'), 'hello');

process.env.WEKAN_VFS_ARCHIVE = archive;
process.env.WEKAN_VFS_OFFSET = String(PAD.length);
process.env.WEKAN_VFS_ROOT = mount;
const vfs = require(VFS);
const at = (...parts) => path.join(mount, ...parts);

// ---- the archive reader ----------------------------------------------------

test('the archive is indexed from an offset inside a bigger file', () => {
  assert.equal(vfs.installed, true);
  assert.equal(vfs.files, FILES.length);
  assert.ok(vfs.entryNames().includes('programs/server/boot.js'));
});

test('deflated and stored entries both come back byte for byte', () => {
  assert.equal(fs.readFileSync(at('programs', 'server', 'boot.js'), 'utf8'), BOOT);
  assert.ok(fs.readFileSync(at('stored.bin')).equals(BIG),
    'a stored (uncompressed) entry must read back unchanged');
});

test('stat, readdir and exists answer for archived paths', () => {
  assert.equal(fs.statSync(at('stored.bin')).size, BIG.length);
  assert.equal(fs.statSync(at('lib')).isDirectory(), true);
  assert.equal(fs.statSync(at('lib', 'greet.js')).isFile(), true);
  assert.equal(fs.existsSync(at('lib', 'inner', 'deep.js')), true);
  assert.equal(fs.existsSync(at('nothing-here.js')), false);
  assert.throws(() => fs.statSync(at('nothing-here.js')), { code: 'ENOENT' });
  assert.equal(fs.statSync(at('nothing-here.js'), { throwIfNoEntry: false }), undefined);
});

test('readdir merges what is in the archive with what is on disk', () => {
  const names = fs.readdirSync(at('programs', 'server'));
  assert.ok(names.includes('boot.js'), 'the archived file must be listed');
  assert.ok(names.includes('only-real.txt'), 'the unpacked file must be listed too');
});

// Negative: unpacking a file beside the EXE must win, which is what lets the
// launcher put the executables and the native addons on disk at their real
// paths and have the server use those rather than the copies in the archive.
test('a real file shadows the archived one', () => {
  assert.equal(fs.readFileSync(at('shadowed.js'), 'utf8'),
    "module.exports = 'the real file';");
  assert.equal(require(at('shadowed.js')), 'the real file');
});

/* Collected below, after the synchronous tests, since streams need a turn. */
const asyncTests = [];
asyncTests.push(['createReadStream serves archived files, including ranges', async () => {
  const chunks = await new Promise((resolve, reject) => {
    const parts = [];
    fs.createReadStream(at('stored.bin'), { start: 10, end: 19 })
      .on('data', c => parts.push(c))
      .on('end', () => resolve(parts))
      .on('error', reject);
  });
  assert.ok(Buffer.concat(chunks).equals(BIG.subarray(10, 20)),
    'webapp serves the client files with ranged read streams');
}]);
asyncTests.push(['the promise and callback forms read the archive too', async () => {
  assert.equal(await fs.promises.readFile(at('lib', 'inner', 'deep.js'), 'utf8'),
    "module.exports = 'deep';");
  assert.equal((await fs.promises.stat(at('stored.bin'))).size, BIG.length);
  const names = await new Promise((resolve, reject) =>
    fs.readdir(at('lib'), (error, value) => (error ? reject(error) : resolve(value))));
  assert.deepEqual(names.sort(), ['greet.js', 'inner']);
}]);

test('fs.realpath keeps its .native, which fs-extra checks for', () => {
  assert.equal(typeof fs.realpath.native, 'function');
  assert.equal(typeof fs.realpathSync.native, 'function');
});

// ---- CommonJS resolution ---------------------------------------------------

test('require loads archived modules, relatively and by package', () => {
  assert.equal(require(at('main.js')), 'main');
  assert.equal(require(at('lib', 'greet.js')), 'deep!',
    'a relative require from inside the archive must resolve inside it');
  assert.deepEqual(require(at('data', 'config.json')), { answer: 42 });
  assert.equal(require(at('node_modules', 'plain')), 'plain-entry',
    'package.json "main" must be honoured');
  assert.equal(require(at('node_modules', 'consumer')), 'plain-entry/dual-sync',
    'a bare specifier must resolve through node_modules inside the archive');
});

// Regression: conditions are taken in the exports object's own key order, the
// way Node does it. A fixed priority list here picked ./default.js, which is a
// different module than the one the real loader would have used.
test('exports conditions follow the object key order, not a fixed list', () => {
  assert.equal(vfs.resolve('dual', at('node_modules', 'consumer', 'index.js')),
    'node_modules/dual/sync.js',
    '"module-sync" comes first in the exports object, so require() takes it');
  /*
   * And only for a bare specifier: Node applies "exports" when it resolves
   * through node_modules, never to a direct absolute-path require, which falls
   * back to "main". Getting this backwards would load a different module than
   * the real loader does.
   */
  assert.equal(require(at('node_modules', 'dual')), 'dual-legacy');
  assert.equal(vfs.resolve(at('node_modules', 'dual'), null),
    'node_modules/dual/legacy.js');
});

// Regression: Meteor's runtime.js hands reify a resolver that calls
// Module._resolveFilename directly. module.registerHooks sits above that call
// and never sees it, so without the lower patch the server died on the first
// module reify asked for.
test('Module._resolveFilename resolves archived modules too', () => {
  const Module = require('node:module');
  const parent = { filename: at('lib', 'greet.js'), paths: [] };
  assert.equal(Module._resolveFilename('./inner/deep.js', parent, false),
    at('lib', 'inner', 'deep.js'));
  assert.equal(Module._resolveFilename('plain', parent, false),
    at('node_modules', 'plain', 'lib', 'entry.js'));
  assert.equal(Module._resolveFilename('path', parent, false), 'path',
    'a builtin must still win over anything in the archive');
});

// Negative, and the sharpest one here. Declaring a format for a .node addon
// makes Node compile the binary as JavaScript: "SyntaxError: Invalid or
// unexpected token" on its MZ header - the same crash the single EXE exists to
// fix. The resolve hook must declare no format for these.
test('a .node addon is never given a module format', () => {
  assert.equal(vfs.format('native/fake.node'), null,
    'declaring a format for an addon makes Node compile the binary as JavaScript');
  assert.equal(vfs.format('lib/greet.js'), 'commonjs');
  assert.equal(vfs.format('data/config.json'), 'json');
  const source = fs.readFileSync(VFS, 'utf8');
  assert.match(source, /if \(format !== null\) resolved\.format = format;/,
    'the resolve hook must omit the format rather than send a null one');
});

// ---- inert without an archive ----------------------------------------------

// The same file ships inside the ordinary ZIP, the snap and Docker, where
// nothing sets these variables. It must load and do nothing at all there.
test('without WEKAN_VFS_ARCHIVE it installs nothing', () => {
  const probe = path.join(work, 'probe.cjs');
  fs.writeFileSync(probe, [
    "const fs = require('node:fs');",
    'const before = fs.readFileSync;',
    `const vfs = require(${JSON.stringify(VFS)});`,
    'console.log(JSON.stringify({',
    '  installed: vfs.installed,',
    '  untouched: fs.readFileSync === before,',
    '}));',
  ].join('\n'));
  const out = execFileSync(process.execPath, [probe], {
    encoding: 'utf8',
    env: { ...process.env, WEKAN_VFS_ARCHIVE: '', WEKAN_VFS_ROOT: '' },
  });
  assert.deepEqual(JSON.parse(out), { installed: false, untouched: true });
});

// Negative: a damaged entry must be reported, not handed to Node as source.
// Serving one file's bytes under another file's name is precisely what the
// replaced packer did, and it reached the user as a SyntaxError.
test('an entry whose length disagrees with the directory is refused', () => {
  const damaged = path.join(work, 'damaged.zip');
  const copy = Buffer.from(makeZip([['bundle/x.js', 'module.exports = 1;', 'store']]));
  const eocd = copy.length - 22;
  const cd = copy.readUInt32LE(eocd + 16);
  copy.writeUInt32LE(999999, cd + 24);
  fs.writeFileSync(damaged, copy);
  const probe = path.join(work, 'damaged.cjs');
  fs.writeFileSync(probe, [
    `const vfs = require(${JSON.stringify(VFS)});`,
    "try { vfs.readEntry('x.js'); console.log('NO ERROR'); }",
    'catch (e) { console.log(e.message); }',
  ].join('\n'));
  const out = execFileSync(process.execPath, [probe], {
    encoding: 'utf8',
    env: {
      ...process.env,
      WEKAN_VFS_ARCHIVE: damaged,
      WEKAN_VFS_OFFSET: '0',
      WEKAN_VFS_LENGTH: '',
      WEKAN_VFS_ROOT: path.join(work, 'damaged-root'),
    },
  });
  assert.match(out, /unpacked to \d+ bytes, expected 999999/,
    'a size that does not match the directory must be an error, not silent bytes');
});

(async () => {
  for (const [name, run] of asyncTests) {
    await run();
    passed++;
    if (process.env.VERBOSE) console.log(`  ok - ${name}`);
  }
  console.log(`bundleArchiveVfs: ${passed} tests passed`);
})().catch(error => { console.error(error); process.exit(1); });
