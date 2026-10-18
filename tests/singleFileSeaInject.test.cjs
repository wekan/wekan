'use strict';

// A single file is not built from a Node.js that LIEF cannot inject correctly
// (releases/single-file/sea-inject.mjs). v12.51: the i386 one stopped with
// std::bad_alloc, the freebsd-x64 one with "Failed to relocate ELF program
// headers", and both failed the release.
// Run: node tests/singleFileSeaInject.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// A minimal ELF: the header, the program headers, and for i386 a dynamic
// section pointing at a DT_REL table - the parts sea-inject.mjs reads.
function elf32({ type, machine = 3, loads, rels = [] }) {
  const buf = Buffer.alloc(0x2000);
  buf.writeUInt32BE(0x7f454c46, 0);
  buf[4] = 1; buf[5] = 1; buf[6] = 1;
  buf.writeUInt16LE(type, 16);
  buf.writeUInt16LE(machine, 18);
  buf.writeUInt32LE(52, 28); // phoff
  buf.writeUInt16LE(32, 42); // phentsize
  const phdrs = [...loads.map(l => ({ type: 1, ...l })), { type: 2, offset: 0x1000, vaddr: 0x1000, filesz: 32, memsz: 32 }];
  buf.writeUInt16LE(phdrs.length, 44);
  phdrs.forEach((p, i) => {
    const o = 52 + i * 32;
    buf.writeUInt32LE(p.type, o);
    buf.writeUInt32LE(p.offset, o + 4);
    buf.writeUInt32LE(p.vaddr, o + 8);
    buf.writeUInt32LE(p.filesz, o + 16);
    buf.writeUInt32LE(p.memsz, o + 20);
  });
  // .dynamic at 0x1000: DT_REL 0x1100, DT_RELSZ, DT_RELENT 8, DT_NULL.
  [[17, 0x1100], [18, rels.length * 8], [19, 8], [0, 0]].forEach(([tag, val], i) => {
    buf.writeUInt32LE(tag, 0x1000 + i * 8);
    buf.writeUInt32LE(val, 0x1004 + i * 8);
  });
  rels.forEach((t, i) => buf.writeUInt32LE((5 << 8) | t, 0x1100 + i * 8 + 4));
  return buf;
}

function elf64({ type, loads }) {
  const buf = Buffer.alloc(0x400);
  buf.writeUInt32BE(0x7f454c46, 0);
  buf[4] = 2; buf[5] = 1; buf[6] = 1;
  buf.writeUInt16LE(type, 16);
  buf.writeUInt16LE(62, 18);
  buf.writeBigUInt64LE(64n, 32);
  buf.writeUInt16LE(56, 54);
  buf.writeUInt16LE(loads.length, 56);
  loads.forEach((l, i) => {
    const o = 64 + i * 56;
    buf.writeUInt32LE(1, o);
    buf.writeBigUInt64LE(BigInt(l.offset), o + 8);
    buf.writeBigUInt64LE(BigInt(l.vaddr), o + 16);
    buf.writeBigUInt64LE(BigInt(l.filesz), o + 32);
    buf.writeBigUInt64LE(BigInt(l.memsz), o + 40);
  });
  return buf;
}

const WHOLE = { offset: 0, vaddr: 0, filesz: 0x2000, memsz: 0x2000 };
const BSS = { offset: 0x2000, vaddr: 0x4000, filesz: 0x10, memsz: 0x100 };

(async () => {
  const { elfFacts, seaInjectProblem } = await import(path.join(ROOT, 'releases/single-file/sea-inject.mjs'));
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('an i386 PIE with R_386_32 relocations is refused, with the reason', () => {
    const buf = elf32({ type: 3, loads: [WHOLE, BSS], rels: [8, 1, 8, 1, 6, 7] });
    assert.equal(elfFacts(buf).r386abs, 2);
    assert.match(seaInjectProblem(buf), /i386 PIE with 2 R_386_32 relocations[\s\S]*-no-pie/);
  });

  test('a non-PIE with two bss-like segments (lld\'s RELRO) is refused, with the reason', () => {
    const buf = elf64({ type: 2, loads: [WHOLE, { ...BSS }, { offset: 0x3000, vaddr: 0x8000, filesz: 0x10, memsz: 0x200 }] });
    assert.equal(elfFacts(buf).bssLike, 2);
    assert.match(seaInjectProblem(buf), /non-PIE ELF executable with 2 bss-like segments/);
  });

  test('negative: what LIEF does inject is let through', () => {
    // nodejs.org's own Linux build: non-PIE, one bss-like segment.
    assert.equal(seaInjectProblem(elf64({ type: 2, loads: [WHOLE, BSS] })), null);
    // An i386 PIE with only R_386_RELATIVE / GLOB_DAT / JUMP_SLOT.
    assert.equal(seaInjectProblem(elf32({ type: 3, loads: [WHOLE, BSS], rels: [8, 8, 6, 7] })), null);
    // A 32-bit ARM PIE: its R_ARM_ABS32 (also type 2 on ARM) is LIEF's to move.
    assert.equal(seaInjectProblem(elf32({ type: 3, machine: 40, loads: [WHOLE, BSS], rels: [2, 2, 23] })), null);
    // A non-PIE i386 (what node-patches now builds): judged by its bss alone.
    assert.equal(seaInjectProblem(elf32({ type: 2, loads: [WHOLE, BSS], rels: [1, 1] })), null);
    // PE, Mach-O, and the stand-in text a test bundle uses are not judged.
    assert.equal(seaInjectProblem(Buffer.from('MZ\x90\x00 not an ELF')), null);
    assert.equal(seaInjectProblem(Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0, 0, 0, 0])), null);
    assert.equal(seaInjectProblem(Buffer.from('nodejs.org/download/release/v26.12.0/')), null);
  });

  test('the builder refuses BEFORE it writes an archive, and the CLI exits 3 for it', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || require('node:os').tmpdir(), 'sf-inject-'));
    try {
      const bundle = path.join(dir, 'bundle');
      fs.mkdirSync(path.join(bundle, 'programs/server'), { recursive: true });
      for (const f of ['main.js', 'programs/server/boot.js', 'programs/server/program.json']) fs.writeFileSync(path.join(bundle, f), '{}');
      fs.writeFileSync(path.join(bundle, 'node'), elf32({ type: 3, loads: [WHOLE, BSS], rels: [1] }));
      fs.writeFileSync(path.join(bundle, 'ferretdb'), 'x');
      const r = spawnSync(process.execPath, [path.join(ROOT, 'releases/single-file/build.mjs'),
        '--bundle', bundle, '--target', 'i386', '--version', '1.0', '--out', path.join(dir, 'out')], { encoding: 'utf8' });
      assert.equal(r.status, 3, r.stderr);
      assert.match(r.stderr, /^single-file build: i386 is not built: it is an i386 PIE with 1 R_386_32/m);
      assert.ok(!fs.readdirSync(dir).some(n => n.startsWith('.single-file-')), 'no work directory was left');
      // Negative: any other failure still fails the job (exit 1, not 3).
      fs.rmSync(path.join(bundle, 'main.js'));
      assert.equal(spawnSync(process.execPath, [path.join(ROOT, 'releases/single-file/build.mjs'),
        '--bundle', bundle, '--target', 'i386', '--version', '1.0', '--out', path.join(dir, 'out')]).status, 1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    const src = read('releases/single-file/build.mjs');
    const build = src.slice(src.indexOf('export function build('));
    assert(build.indexOf('seaInjectProblemOf(node)') > 0, 'build() checks it');
    assert(build.indexOf('seaInjectProblemOf(node)') < build.indexOf('archiveEntries({'), 'checked before the archive is written');
  });

  test('the workflow reads exit 3 as a skip, says why, and the Start job finds the reason', () => {
    const wf = read('.github/workflows/single-file.yml');
    assert.match(wf, /\$\{HOST_NODE:\+--host-node "\$HOST_NODE"\} 2> build\.err \|\| rc=\$\?/);
    assert.match(wf, /if \[ "\$rc" = 3 \]; then[\s\S]*?echo "::notice::\$reason"[\s\S]*?single-file-skipped-\$TARGET\.txt/);
    assert.match(wf, /\[ "\$rc" = 0 \] \|\| exit "\$rc"/, 'negative: every other failure still fails');
    assert.match(wf, /single-file-skipped-\$\{\{ matrix\.target \}\}\.txt\n\s+if-no-files-found: error/);
    assert.match(wf, /if \[ -f "sf\/single-file-skipped-\$TARGET\.txt" \]; then\n\s+echo "run=false"/);
    assert.match(wf, /\[ -f "\$dir\/single-file-skipped-\$target\.txt" \] && continue/, 'not warned about as unstarted');
  });

  // v12.53 armhf and v12.54 armv7 (on all three attempts of a retry): the
  // 32-bit i386 Node.js ran out of memory injecting with LIEF. A 32-bit ELF
  // target is now split - that Node.js writes only the blob, and
  // sea-inject-elf.py injects it in a 64-bit process.
  const { seaSplit, seaCommands } = await import(path.join(ROOT, 'releases/single-file/build.mjs'));
  const os = require('node:os');
  const work = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'sea-'));
  const elfFile = path.join(work, 'elf');
  const peFile = path.join(work, 'pe');
  fs.writeFileSync(elfFile, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 1, 1, 1, 0]));
  fs.writeFileSync(peFile, Buffer.from('MZ\x90\x00'));

  test('a 32-bit ELF target is split: blob by the 32-bit Node.js, injection by sea-inject-elf.py', () => {
    for (const t of ['armv7', 'armhf', 'armv6', 'i386']) assert.equal(seaSplit(t, elfFile), true, t);
    const cmds = seaCommands({ hostNode: '/h/node', python: '/py', node: '/t/node', config: 'c.json', blob: 'b.blob', out: 'o', split: true });
    assert.deepEqual(cmds[0], ['/h/node', ['--experimental-sea-config', 'c.json']]);
    assert.equal(cmds[1][0], '/py');
    assert.deepEqual(cmds[1][1].slice(-3), ['/t/node', 'b.blob', 'o']);
    assert.match(cmds[1][1][1], /releases[\\/]single-file[\\/]sea-inject-elf\.py$/);
    assert.equal(cmds.length, 2, 'LIEF never runs in the 32-bit Node.js');
  });

  test('negative: 64-bit targets and win32 (PE) keep --build-sea, and nothing else', () => {
    assert.equal(seaSplit('amd64', elfFile), false);
    assert.equal(seaSplit('arm64', elfFile), false);
    assert.equal(seaSplit('win32', peFile), false);
    assert.deepEqual(seaCommands({ hostNode: '/h/node', config: 'c.json', split: false }), [['/h/node', ['--build-sea', 'c.json']]]);
    const build = read('releases/single-file/build.mjs');
    assert.match(build, /output: split \? blob : out,/, 'the blob, not the executable, is what the 32-bit Node.js writes');
    assert.doesNotMatch(build, /buildSea|SEA_ATTEMPTS/, 'no retry of an out-of-memory LIEF');
  });

  test('the workflow gives a 32-bit ELF target LIEF 1.0.0, the version Node.js vendors', () => {
    const wf = read('.github/workflows/single-file.yml');
    assert.match(wf, /if \[ "\$TARGET" != win32 \]; then\n\s+python3 -m venv "\$RUNNER_TEMP\/lief"\n\s+"\$RUNNER_TEMP\/lief\/bin\/python" -m pip install --quiet 'lief==1\.0\.0'/);
    assert.match(wf, /SEA_PYTHON: \$\{\{ steps\.host32\.outputs\.python \}\}/);
    const inj = read('releases/single-file/sea-inject-elf.py');
    assert.match(inj, /lief\.__version__\.split\("-"\)\[0\] != "1\.0\.0"/, 'refuses another LIEF');
    // node's src/node_sea_bin.cc, InjectIntoELF() and MarkSentinel().
    assert.match(inj, /RESOURCE = "NODE_SEA_BLOB"/);
    assert.match(inj, /SECTION = "\.note\.node\.sea"/);
    assert.match(inj, /NOTE_TYPE = 0/);
    assert.match(inj, /FUSE = b"NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"/);
    assert.match(inj, /PHDR_RELOC\.BSS_END/);
    assert.match(inj, /cfg\.notes = True\n\s+cfg\.dynamic_section = True/);
  });

  // The proof that matters: the split writes the same file --build-sea does.
  // Needs a Node.js with --build-sea and a Python with LIEF 1.0.0
  // (SEA_PYTHON, or python3); says so when it has neither.
  const python = process.env.SEA_PYTHON || 'python3';
  const hasLief = spawnSync(python, ['-c', 'import lief; assert lief.__version__.split("-")[0] == "1.0.0"']).status === 0;
  const hasBuildSea = spawnSync(process.execPath, ['--help'], { encoding: 'utf8' }).stdout.includes('--build-sea');
  if (hasLief && hasBuildSea && process.platform === 'linux') {
    test('the split writes the file --build-sea writes, byte for byte, and it runs', () => {
      fs.writeFileSync(path.join(work, 'main.js'), 'console.log("sea:" + require("node:sea").isSea())\n');
      const cfg = output => JSON.stringify({ main: path.join(work, 'main.js'), output, executable: process.execPath, disableExperimentalSEAWarning: true });
      fs.writeFileSync(path.join(work, 'a.json'), cfg(path.join(work, 'a.out')));
      fs.writeFileSync(path.join(work, 'b.json'), cfg(path.join(work, 'b.blob')));
      const run = (cmd, args) => {
        const r = spawnSync(cmd, args, { encoding: 'utf8' });
        assert.equal(r.status, 0, `${cmd} ${args.join(' ')}: ${r.stderr}`);
        return r.stdout;
      };
      run(process.execPath, ['--build-sea', path.join(work, 'a.json')]);
      for (const [cmd, args] of seaCommands({ hostNode: process.execPath, python, node: process.execPath,
        config: path.join(work, 'b.json'), blob: path.join(work, 'b.blob'), out: path.join(work, 'b.out'), split: true })) {
        run(cmd, args);
      }
      assert(fs.readFileSync(path.join(work, 'a.out')).equals(fs.readFileSync(path.join(work, 'b.out'))), 'identical to --build-sea');
      assert.equal(run(path.join(work, 'b.out'), []).trim(), 'sea:true');
    });

    test('negative: an executable that already carries the blob is refused, as --build-sea refuses it', () => {
      const r = spawnSync(python, ['-I', path.join(ROOT, 'releases/single-file/sea-inject-elf.py'),
        path.join(work, 'b.out'), path.join(work, 'b.blob'), path.join(work, 'c.out')], { encoding: 'utf8' });
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, /note section NODE_SEA_BLOB already exists|Sentinel is already marked/);
      assert(!fs.existsSync(path.join(work, 'c.out')));
    });
  } else {
    console.log(`  skip - byte-for-byte comparison with --build-sea (${hasLief ? '' : `no LIEF 1.0.0 in ${python}; `}${hasBuildSea ? '' : 'no --build-sea'})`);
  }
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`singleFileSeaInject: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
