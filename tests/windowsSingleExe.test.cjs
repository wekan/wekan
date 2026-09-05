'use strict';

// Guard: WeKan's single Windows EXE carries the bundle instead of unpacking it,
// and checks it before it uses it.
// Run: node tests/windowsSingleExe.test.cjs
//
// WeKan-11.48-win64.exe started and immediately died, over and over:
//
//   ...\accounts-password\node_modules\bcrypt\promises.js:1
//   MZ......  !.L.!This program cannot be run in DOS mode.
//   SyntaxError: Invalid or unexpected token
//       at Object.<anonymous> (...\bcrypt\bcrypt.js:6:18)
//
// Both published files were correct. The win64 ZIP holds the real 1123-byte
// promises.js, and so did the EXE: in its packed image bcrypt.node (195584
// bytes) is entry 0x5c9c and promises.js is 0x5c9d, stored back to back, each
// with the right bytes at the offset its own record gives. What was wrong was
// the READ. Enigma Virtual Box served all 44,401 bundle files from a virtual
// filesystem inside the EXE, and once Node.js had loaded the native addon out
// of it (bcrypt.js line 2), the next read - require('./promises') on line 6,
// the blob immediately after that addon - came back as the addon's own PE
// bytes.
//
// The idea was right and the closed-source implementation was wrong, so the
// mounting is ours now. The EXE is the compiled launcher with the published ZIP
// appended and an 80-byte trailer describing it. On first run it verifies the
// payload's SHA-256 and unpacks ONLY what cannot be virtual - the executables,
// the native addons, main.js, start-wekan.bat and wekan-vfs.cjs - and the other
// ~39,000 files are read from inside the EXE by releases/single-exe/wekan-vfs.cjs
// (tests/bundleArchiveVfs.test.cjs covers that half).
//
// These tests pin the trailer format from both ends, the checks that catch a
// damaged payload, the rule for which members must be real, and that the
// virtual filesystem cannot come back by accident.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const workflow = read('.github/workflows/windows.yml');
const release = read('.github/workflows/release-all.yml');
const missing = read('.github/workflows/release-all-missing.yml');
const expected = read('releases/expected-assets.sh');
const launcher = read('releases/windows-single-exe-launcher.c');
const packer = read('releases/append-windows-payload.mjs');
const batch = read('releases/ferretdb/start-wekan.bat');

let passed = 0;
const check = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

async function main() {
  const payload = await import(
    'file://' + path.join(ROOT, 'releases', 'append-windows-payload.mjs'));

  // ---- the trailer format, described in C and in JavaScript ----------------
  //
  // The launcher parses what the packer writes. Nothing at build time compares
  // the two, so this does: every TRAILER_* the .c file defines must equal the
  // constant the .mjs exports under the same name.
  check('the C launcher and the packer agree on the trailer layout', () => {
    const defines = new Map();
    for (const line of launcher.split('\n')) {
      const match = /^#define\s+(TRAILER_[A-Z0-9_]+)\s+(.+?)\s*$/.exec(line);
      if (match) defines.set(match[1], match[2]);
    }
    const numeric = ['TRAILER_SIZE', 'TRAILER_FORMAT', 'TRAILER_OFFSET_POS',
      'TRAILER_SIZE_POS', 'TRAILER_SHA256_POS', 'TRAILER_VERSION_POS',
      'TRAILER_VERSION_SIZE'];
    for (const name of numeric) {
      assert.ok(defines.has(name), `${name} must be defined in the launcher`);
      assert.equal(Number(defines.get(name)), payload[name],
        `${name} differs between the launcher and append-windows-payload.mjs`);
    }
    assert.equal(defines.get('TRAILER_MAGIC'), `"${payload.TRAILER_MAGIC}"`,
      'the magic differs between the launcher and append-windows-payload.mjs');
    assert.equal(Number(defines.get('TRAILER_MAGIC_SIZE')),
      payload.TRAILER_MAGIC.length, 'TRAILER_MAGIC_SIZE must be the magic length');
  });

  check('a packed EXE round-trips through pack and verify', () => {
    const stub = Buffer.from('MZ this stands in for the compiled launcher');
    const bundle = crypto.randomBytes(200000);
    const exe = payload.pack({ launcher: stub, payload: bundle, version: '11.49' });

    assert.equal(exe.length, stub.length + bundle.length + payload.TRAILER_SIZE);
    assert.ok(exe.subarray(0, stub.length).equals(stub),
      'the launcher must still be the start of the file, so Windows can run it');

    const trailer = payload.verifyBuffer(exe);
    assert.equal(trailer.version, '11.49');
    assert.equal(trailer.payloadOffset, stub.length);
    assert.equal(trailer.payloadSize, bundle.length);
    assert.ok(exe.subarray(trailer.payloadOffset,
      trailer.payloadOffset + trailer.payloadSize).equals(bundle),
    'the payload must come back byte for byte');
    assert.equal(trailer.sha256.toString('hex'),
      crypto.createHash('sha256').update(bundle).digest('hex'));
  });

  // ---- negative: a damaged payload must be refused, not run ----------------
  //
  // This is the check the 11.48 EXE did not have. Whatever damages the bundle
  // - a truncated download, a half-written file - must stop at the SHA-256
  // with a message, not reach Node.js as a crash loop.
  check('one flipped payload byte fails verification', () => {
    const exe = payload.pack({
      launcher: Buffer.from('MZ launcher'),
      payload: crypto.randomBytes(4096),
      version: '11.49',
    });
    const damaged = Buffer.from(exe);
    damaged[payload.readTrailer(damaged).payloadOffset + 1234] ^= 0xff;
    assert.throws(() => payload.verifyBuffer(damaged), /SHA-256/,
      'a single changed byte in the bundle must be caught');
  });

  check('a truncated payload fails verification', () => {
    const exe = payload.pack({
      launcher: Buffer.from('MZ launcher'),
      payload: crypto.randomBytes(4096),
      version: '11.49',
    });
    const trailer = exe.subarray(exe.length - payload.TRAILER_SIZE);
    const short = Buffer.concat(
      [exe.subarray(0, exe.length - payload.TRAILER_SIZE - 512), trailer]);
    assert.throws(() => payload.verifyBuffer(short), /payload ends at/,
      'a payload that no longer reaches the trailer must be caught');
  });

  check('a file with no trailer is refused', () => {
    assert.throws(() => payload.verifyBuffer(Buffer.alloc(4096)),
      /no WEKANSFX trailer/,
      'a plain file must not be mistaken for a packed WeKan EXE');
    assert.throws(() => payload.verifyBuffer(Buffer.alloc(8)),
      /smaller than the trailer/);
  });

  check('a version that does not fit the trailer is refused', () => {
    assert.throws(() => payload.buildTrailer({
      payloadOffset: 0,
      payloadSize: 0,
      sha256: Buffer.alloc(32),
      version: '11.49-with-a-very-long-suffix',
    }), /does not fit/, 'a silently truncated version would mis-stamp wekan-app');
    assert.throws(() => payload.buildTrailer({
      payloadOffset: 0, payloadSize: 0, sha256: Buffer.alloc(31), version: '1',
    }), /32-byte/);
  });

  // ---- which members cannot be virtual -------------------------------------
  //
  // Getting this list wrong is not a build failure, it is a runtime one: a
  // missing addon or tool would only show up when a user needed it. So the
  // rule is pinned in both directions.
  const SAMPLE = [
    'bundle/main.js',
    'bundle/start-wekan.bat',
    'bundle/wekan-vfs.cjs',
    'bundle/node.exe',
    'bundle/ferretdb.exe',
    'bundle/mongodump.exe',
    'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt/prebuilds/win32-x64/bcrypt.node',
    'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/argon2/prebuilds/win32-x64/argon2.glibc.node',
    'bundle/programs/server/boot.js',
    'bundle/programs/server/packages/webapp.js',
    'bundle/programs/web.browser/app/app.js',
    'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt/promises.js',
    'bundle/programs/server/npm/node_modules/lodash/package.json',
    'bundle/README',
    'bundle/programs/server/deep/nested/main.js',
    'bundle/programs/server/tool.exe',
  ];

  check('everything a process or the OS has to open is unpacked', () => {
    const members = payload.realFileMembers(SAMPLE);
    for (const must of [
      'bundle/main.js', 'bundle/start-wekan.bat', 'bundle/wekan-vfs.cjs',
      'bundle/node.exe', 'bundle/ferretdb.exe', 'bundle/mongodump.exe',
      'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt/prebuilds/win32-x64/bcrypt.node',
      'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/argon2/prebuilds/win32-x64/argon2.glibc.node',
    ]) {
      assert.ok(members.includes(must), `${must} must be unpacked as a real file`);
    }
  });

  // Negative: the server's own files must NOT be unpacked. If they were, the
  // EXE would be back to writing 39,000 files and this whole change would be
  // pointless - and the check would still pass every start-up test.
  check('the server files are left in the archive', () => {
    const members = payload.realFileMembers(SAMPLE);
    for (const never of [
      'bundle/programs/server/boot.js',
      'bundle/programs/server/packages/webapp.js',
      'bundle/programs/web.browser/app/app.js',
      'bundle/programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt/promises.js',
      'bundle/programs/server/npm/node_modules/lodash/package.json',
      'bundle/README',
      // main.js and .exe count only at the top level: a nested one is an
      // ordinary file of some package, not the entry Node resolves first.
      'bundle/programs/server/deep/nested/main.js',
      'bundle/programs/server/tool.exe',
    ]) {
      assert.ok(!members.includes(never), `${never} must stay inside the EXE`);
    }
    /* On a bundle-shaped listing the unpacked set stays a rounding error. */
    const bundleShaped = SAMPLE.concat(
      Array.from({ length: 2000 },
        (unused, i) => `bundle/programs/server/npm/node_modules/pkg${i}/index.js`));
    const realOfMany = payload.realFileMembers(bundleShaped);
    assert.ok(realOfMany.length < bundleShaped.length / 100,
      `only ${realOfMany.length} of ${bundleShaped.length} may be unpacked`);
  });

  check('the generated header is valid C the launcher can include', () => {
    const header = payload.manifestHeader(['bundle/node.exe', 'bundle/a b/c.node']);
    assert.match(header, /static const wchar_t \*const WEKAN_REAL_FILES\[\] = \{/);
    assert.match(header, /L"bundle\/node\.exe",/);
    assert.match(header, /L"bundle\/a b\/c\.node",/);
    assert.match(header, /#define WEKAN_REAL_FILE_COUNT 2/);
    assert.match(launcher, /#include "wekan-real-files\.h"/,
      'the launcher must include the generated list');
    assert.match(launcher, /WEKAN_REAL_FILE_COUNT/,
      'and iterate it rather than guessing at a pattern');
  });

  // ---- the launcher --------------------------------------------------------
  check('the launcher verifies, unpacks only those members, and mounts the rest', () => {
    assert.match(launcher, /BCRYPT_SHA256_ALGORITHM/,
      'the launcher must hash the payload with SHA-256 before using it');
    assert.match(launcher, /memcmp\(digest, trailer \+ TRAILER_SHA256_POS, SHA256_SIZE\)/,
      'the computed digest must be compared with the one in the trailer');
    assert.match(launcher, /tar\.exe/,
      "the members must be unpacked with Windows' own tar.exe");
    assert.match(launcher, /--strip-components=1/,
      "dropping the archive's leading bundle/ keeps paths as short as the ZIP's");
    assert.match(launcher, /SetEnvironmentVariableW\(L"WEKAN_VFS_ARCHIVE", exe_path\)/,
      'the server must be told the archive is this EXE');
    assert.match(launcher, /SetEnvironmentVariableW\(L"WEKAN_VFS_ROOT", app_dir\)/,
      'and where it is mounted');
    assert.match(launcher, /WEKAN_VFS_OFFSET/,
      'and where the payload starts inside the EXE');
    assert.match(launcher, /WEKAN_VFS_LENGTH/,
      'and how long it is, so the trailer is not read as archive');
    assert.match(launcher, /programs\\\\server/,
      'the directory main.js chdir()s into must be created for real');
    assert.match(launcher, /L"%ls\\\\wekan-files", dir/,
      'the portable data directory must be named wekan-files, beside the EXE');
    assert.match(launcher, /GetEnvironmentVariableW\(L"WRITABLE_PATH", data, PATHBUF\)/,
      "an administrator's explicit WRITABLE_PATH must remain authoritative");
  });

  // Negative: wekan-app is replaced on an upgrade, wekan-files never is. A
  // launcher that removed the data directory would lose every board.
  check('unpacking never touches the data directory', () => {
    const removals = launcher.match(/rd \/s \/q [^\n]*/g) || [];
    assert.equal(removals.length, 1, 'the launcher should remove exactly one directory');
    assert.match(removals[0], /app_dir/, 'and it must be wekan-app');
    assert.doesNotMatch(launcher, /rd \/s \/q[^\n]*wekan-files/);
  });

  check('the launcher no longer works around Enigma', () => {
    assert.doesNotMatch(launcher, /NODE_SKIP_PLATFORM_CHECK/,
      "that variable only existed to undo Enigma's false Windows-version result");
  });

  // The launcher cannot be compiled here, so at least type-check it against
  // the stub Windows headers. This is what catches a typo, a wrong argument
  // count or a misspelled API before a release build on a GitHub runner does.
  check('the launcher type-checks against the stub Windows headers', () => {
    const compiler = ['clang', 'gcc', 'cc'].find(name =>
      spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0);
    if (!compiler) {
      console.log('  (skipped: no C compiler on this machine)');
      return;
    }
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-launcher-'));
    try {
      fs.writeFileSync(path.join(temporary, 'wekan-real-files.h'),
        payload.manifestHeader(['bundle/node.exe', 'bundle/x/y.node']));
      const result = spawnSync(compiler, [
        '-fsyntax-only', '-Wall', '-Wextra', '-std=c99',
        '-Wno-unknown-pragmas', '-Wno-ignored-pragmas',
        '-I', path.join(ROOT, 'tests', 'fixtures', 'winstub'),
        '-I', temporary,
        path.join(ROOT, 'releases', 'windows-single-exe-launcher.c'),
      ], { encoding: 'utf8' });
      assert.equal(result.status, 0,
        `the launcher must type-check cleanly:\n${result.stderr}`);
      assert.equal(result.stderr.trim(), '',
        `the launcher must compile without warnings:\n${result.stderr}`);
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  });

  // ---- negative: the virtual filesystem must not come back -----------------
  //
  // Pinned across the whole release and workflow tree, not just this workflow,
  // so a second packing path cannot reintroduce it somewhere else.
  check('nothing packs WeKan into a closed-source virtual filesystem any more', () => {
    const files = [];
    for (const dir of ['.github/workflows', 'releases']) {
      for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        if (entry.isFile()) files.push(path.join(dir, entry.name));
      }
    }
    const forbidden = [
      /enigmavb/i, /enigmaprotector\.com/i, /enigma-virtualbox/i,
      /enigmavbconsole/i, /evbOptions/, /\.evb\b/,
    ];
    for (const file of files) {
      let text;
      try { text = read(file); } catch { continue; }
      for (const pattern of forbidden) {
        assert.doesNotMatch(text, pattern,
          `${file} must not bring back the Enigma Virtual Box packer`);
      }
    }
  });

  // ---- the workflows -------------------------------------------------------
  check('the workflow builds the EXE from the published ZIP', () => {
    assert.match(workflow, /wekan-launcher\.exe/,
      'the launcher must be compiled on the runner');
    assert.match(workflow, /append-windows-payload\.mjs `\n\s*--manifest/,
      'the unpack list must be computed from the archive before compiling');
    assert.match(workflow, /--header wekan-real-files\.h/,
      'and written where the launcher includes it');
    assert.match(workflow, /releases\/append-windows-payload\.mjs/,
      'the ZIP must be appended by the shared packer, not by an inline copy');
    assert.match(workflow, /append-windows-payload\.mjs --verify/,
      'the built EXE must be verified before it is published');
    assert.match(workflow, /does not match its published SHA256/,
      'the payload ZIP must match the checksum published beside it');
    assert.match(workflow, /'wekan-vfs\.cjs'\)\) \{|'wekan-vfs\.cjs'/,
      'the payload must contain the in-process mount the EXE preloads');
  });

  check('the packer CLI starts on Windows paths as well as POSIX paths', () => {
    assert.match(packer, /pathToFileURL\(process\.argv\[1\]\)\.href/,
      'Node must convert the entry path to a platform-correct file URL');
    assert.doesNotMatch(packer, /`file:\/\/\$\{path\.resolve\(process\.argv\[1\]\)\}`/,
      'a hand-built file URL prevents the CLI body from running on Windows');
  });

  // Negative: 11.48 shipped because start-wekan.bat restarts WeKan every three
  // seconds, so a crash-looping EXE still answered on port 8080 inside the poll
  // window and the job went green.
  check('the smoke test fails on a crash loop instead of waiting it out', () => {
    assert.match(workflow, /localhost:8080\/sign-in/,
      'the final single EXE must pass an HTTP startup smoke test');
    assert.match(workflow, /'WeKan exited; restarting', 'SyntaxError'/,
      'a restart or a SyntaxError in the log must fail the job');
    assert.match(batch, /WeKan exited; restarting in 3 seconds/,
      'the string the smoke test watches for must be the one the bundle prints');
    assert.match(workflow, /Start-Once 'first'/,
      'the first run must be checked, which is the run that unpacks');
    assert.match(workflow, /Start-Once 'second'/,
      'and the second, which must find wekan-app already unpacked');
  });

  // Negative, and the point of the whole design: a change that quietly went
  // back to unpacking the bundle would pass both start checks above.
  check('the smoke test counts what actually reached the disk', () => {
    assert.match(workflow, /if \(\$unpacked -gt 200\)/,
      'the job must fail if the EXE unpacks the whole bundle');
    assert.match(workflow, /programs\/server\/boot\.js'/,
      'and must name files that have to be served from inside the EXE');
  });

  check('the bundle carries the mount, and start-wekan.bat preloads it', () => {
    assert.match(release, /cp \$SRC\/releases\/single-exe\/wekan-vfs\.cjs bundle\//,
      'the win64 bundle must ship the in-process archive mount');
    assert.match(release, /for want in main\.js node\.exe start-wekan\.bat wekan-vfs\.cjs; do/,
      'and the build must refuse a bundle that lost it');
    assert.match(batch, /if defined WEKAN_VFS_ARCHIVE/,
      'the launcher script must preload the mount only when there is an archive');
    assert.match(batch, /--require "%DIR%wekan-vfs\.cjs"/,
      'and it must be preloaded before main.js, not required from it');
    assert.match(batch, /\) else \(\s*\n\s*"%DIR%node\.exe" "%DIR%main\.js"/,
      'the ordinary ZIP must still start with the plain command');
  });

  check('the packer is wired into the release workflows', () => {
    assert.match(batch, /"%%~nxI"=="wekan-files" set "FILES=%WRITABLE_PATH%"/,
      'start-wekan.bat must not turn wekan-files into wekan-files\\files');
    assert.match(release, /uses: \.\/\.github\/workflows\/windows\.yml/,
      'a full release must invoke the reusable Windows workflow');
    assert.match(release, /needs: \[prepare, release, build-win64\]/,
      'packing must wait until the win64 ZIP is published');
    assert.match(missing, /uses: \.\/\.github\/workflows\/windows\.yml/,
      'the missing-assets workflow must be able to rebuild the EXE');
    assert.match(expected, /windows win64 WeKan-\$\{v\}-win64\.exe sums/,
      'release completeness must include the EXE and its checksum');
  });

  check('the packer documents every mode the workflow uses', () => {
    assert.match(packer, /--manifest <zip> --header <file\.h>/);
    assert.match(packer, /--launcher <exe> --payload <zip> --output <exe> --version <v>/);
  });

  console.log(`windowsSingleExe: ${passed} checks passed`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
