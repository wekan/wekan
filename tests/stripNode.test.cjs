'use strict';

// Guard: every bundled node is stripped of its symbol table and debug data,
// and keeps the dynamic symbols native addons need.
// Run: node tests/stripNode.test.cjs
//
// nodejs.org's node executables carry their full symbol table and DWARF data:
// linux-x64 and linux-arm64 node 26 are 150 MB, 117 and 115 MB without. Every
// bundle, image, snap, AppImage and Flatpak ships one. releases/strip-node.sh
// removes it after the download is verified, and refuses a result that lost
// .dynsym - the table bcrypt, argon2, sharp and canvas resolve N-API against.
//
// The binaries here are real ELF files: built with gcc -g, so they have a
// .symtab and .debug_* sections to remove. Without gcc the ELF tests are
// skipped and say so; the pipeline checks run regardless.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const script = path.join(ROOT, 'releases/strip-node.sh');
const code = (text) => text.replace(/^\s*#.*$/gm, '');

let passed = 0;
let skipped = 0;
function test(name, fn) {
  const r = fn();
  if (r === 'skip') { skipped += 1; console.log('  skip -', name); return; }
  passed += 1;
  console.log('  ok -', name);
}
const run = (file) => spawnSync('bash', [script, file], { encoding: 'utf8' });
const have = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-node-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

function sections(file) {
  const r = spawnSync('python3', ['-c', `
import struct, sys
b = open(sys.argv[1], 'rb').read()
e = '<' if b[5] == 1 else '>'
shoff, = struct.unpack(e + 'Q', b[0x28:0x30]); se, sn, si = struct.unpack(e + 'HHH', b[0x3A:0x40])
def sh(i):
    o = shoff + i * se
    return struct.unpack(e + 'IIQQQQ', b[o:o + 40])
so = sh(si)[4]
print('\\n'.join(b[so + sh(i)[0]:].split(b'\\0', 1)[0].decode() for i in range(sn)))
`, file], { encoding: 'utf8' });
  return r.stdout.split('\n').filter(Boolean);
}

function elfWithDebug(name) {
  if (!have('gcc')) return null;
  const src = path.join(tmp, `${name}.c`);
  fs.writeFileSync(src, '#include <stdio.h>\nint napi_like(void) { return 42; }\nint main(void) { printf("%d\\n", napi_like()); return 0; }\n');
  const out = path.join(tmp, name);
  // -rdynamic exports napi_like into .dynsym, as node exports its N-API.
  const r = spawnSync('gcc', ['-g', '-rdynamic', '-o', out, src]);
  // On macOS `gcc` is clang and writes a Mach-O, not an ELF: that is the
  // Mach-O test below, not this one.
  return r.status === 0 && magicOf(out) === '7f454c46' ? out : null;
}

const magicOf = (file) => fs.readFileSync(file).subarray(0, 4).toString('hex');

// A Mach-O with local symbols, signed ad hoc as node for macOS is: only where
// the compiler writes Mach-O and codesign exists, i.e. on a Mac.
function machoWithLocals(name) {
  if (!have('cc') || !have('codesign') || !have('nm')) return null;
  const src = path.join(tmp, `${name}.c`);
  fs.writeFileSync(src, '#include <stdio.h>\nstatic int local_helper(int x) { return x * 2; }\nint napi_like(void) { return local_helper(21); }\nint main(void) { printf("%d\\n", napi_like()); return 0; }\n');
  const out = path.join(tmp, name);
  if (spawnSync('cc', ['-O0', '-o', out, src]).status !== 0) return null;
  if (!['cffaedfe', 'cefaedfe'].includes(magicOf(out))) return null;
  spawnSync('codesign', ['--force', '--sign', '-', out]);
  return out;
}

console.log('stripNode:');

test('an ELF loses .symtab and .debug_*, keeps .dynsym, and still runs', () => {
  const bin = elfWithDebug('withdebug');
  if (!bin) return 'skip';
  const before = sections(bin);
  assert.ok(before.includes('.symtab') && before.some((s) => s.startsWith('.debug')), 'the fixture has symbols and debug data');
  const sizeBefore = fs.statSync(bin).size;
  const r = run(bin);
  assert.strictEqual(r.status, 0, r.stderr);
  const after = sections(bin);
  assert.ok(!after.includes('.symtab') && !after.some((s) => s.startsWith('.debug')), `left: ${after.join(' ')}`);
  assert.ok(after.includes('.dynsym'), 'the dynamic symbol table stays');
  assert.ok(fs.statSync(bin).size < sizeBefore, 'it is smaller');
  assert.strictEqual(spawnSync(bin, { encoding: 'utf8' }).stdout.trim(), '42', 'and still runs');
  // A second run is harmless: the release legs may strip an already stripped node.
  assert.strictEqual(run(bin).status, 0);
});

// Negative: what must never ship.
test('an ELF without .dynsym is refused', () => {
  const bin = elfWithDebug('nodynsym');
  if (!bin || !have('objcopy')) return 'skip';
  spawnSync('objcopy', ['-R', '.dynsym', bin]);
  if (sections(bin).includes('.dynsym')) return 'skip';
  const r = run(bin);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /lost its dynamic symbol table/);
});

test('a file that is not a binary is refused, a Windows .exe is left alone', () => {
  const text = path.join(tmp, 'node');
  fs.writeFileSync(text, '#!/bin/sh\necho not a node\n');
  const r = run(text);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /is not an ELF, Mach-O or PE binary/);
  const exe = path.join(tmp, 'node.exe');
  fs.writeFileSync(exe, Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200)]));
  const before = fs.readFileSync(exe);
  assert.strictEqual(run(exe).status, 0);
  assert.ok(fs.readFileSync(exe).equals(before), 'node.exe has no symbols to remove and is not touched');
});

test('a Mach-O is stripped of locals only, and re-signed', () => {
  const s = code(read('releases/strip-node.sh'));
  assert.match(s, /strip -x "\$f"/, 'strip -x keeps the exported symbols addons bind to');
  assert.match(s, /codesign --force --sign - "\$f"/, 'an arm64 Mac runs no unsigned binary');
  assert.match(s, /codesign --verify --strict "\$f"/);
});

test('on a Mac: a real Mach-O loses its local symbols, keeps the exported one, and still runs', () => {
  const bin = machoWithLocals('machobin');
  if (!bin) return 'skip';
  const nm = () => spawnSync('nm', [bin], { encoding: 'utf8' }).stdout;
  assert.match(nm(), /\bt _local_helper\b/, 'the fixture has a local symbol');
  const r = run(bin);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.doesNotMatch(nm(), /_local_helper/, 'local symbols are gone');
  assert.match(nm(), /\bT _napi_like\b/, 'the exported symbol stays');
  assert.strictEqual(spawnSync('codesign', ['--verify', '--strict', bin]).status, 0, 're-signed');
  assert.strictEqual(spawnSync(bin, { encoding: 'utf8' }).stdout.trim(), '42', 'and still runs');
});

test('every place a node enters a bundle strips it, after it is verified', () => {
  const embed = code(read('releases/embed-verified-node.sh'));
  const check = embed.indexOf('"$got" != "$node_sha256"');
  const strip = embed.indexOf('strip-node.sh" "$dest"');
  assert.ok(check > 0 && strip > check, 'embed-verified-node.sh strips after the checksum check');
  const install = code(read('releases/install-node-for-arch.sh'));
  assert.ok(install.indexOf('cp /opt/node/bin/node /bundle/node') < install.indexOf('strip-node.sh" /bundle/node'),
    'install-node-for-arch.sh strips the node it put in the bundle');
  assert.match(install, /apt-install\.sh"[^\n]* elfutils/, 'with elfutils in the container');
  // The Linux hosts that run embed-verified-node.sh for a FOREIGN cpu (arm64 on
  // x64) need eu-strip: GNU strip only reads the host's own architecture.
  const wf = read('.github/workflows/release-all.yml');
  for (const job of ['build-amd64', 'build-arm64']) {
    const body = wf.split(`\n  ${job}:\n`)[1].split(/\n  [a-z0-9-]+:\n/)[0];
    assert.match(body, /apt-install\.sh"[^\n]* elfutils/, `${job} installs elfutils`);
  }
});

console.log(`\nstripNode: ${passed} passed${skipped ? `, ${skipped} skipped (no ELF toolchain or no Mac here)` : ''}`);
