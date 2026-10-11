'use strict';
(async () => {

// Plain-Node guard for the win32 bundle job.
// Run: node tests/win32BundleBuild.test.cjs
//
// build-win32 was skipped every release until the Node.js resolver learned
// node-patches' Windows checksum name, so the first release to run it, v12.32,
// was the first to reach its later steps - and it died on the first new one:
//
//   tar: D\:\a\\_temp/node-ia32: Cannot open: No such file or directory
//
// RUNNER_TEMP is a Windows path, and GNU tar reads `D:` as a REMOTE HOST. The
// job now hands tar only relative names on the POSIX form of the path.
//
// The next step it had never reached was just as untested: bcrypt and argon2
// publish no win32-ia32 prebuild, so they must be compiled, and
// accounts-password imports both with no fallback. releases/check-addon-arch.mjs
// reads each shipped addon's PE header so that a cross-build that silently did
// nothing fails the job instead of the first sign-in.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { checkAddonArch, readBinaryKind, listAllows, PE_MACHINE } = await import(
  '../releases/check-addon-arch.mjs'
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ── workflow helpers ───────────────────────────────────────────────────────
const code = (text) => text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
function jobs(workflow) {
  const out = {};
  const re = /\n  ([a-z0-9-]+):\n/g;
  const starts = [];
  let m;
  while ((m = re.exec(workflow))) starts.push({ name: m[1], at: m.index });
  starts.forEach((s, i) => {
    out[s.name] = workflow.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : undefined);
  });
  return out;
}
const workflows = fs
  .readdirSync(path.join(ROOT, '.github/workflows'))
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ f, text: read(`.github/workflows/${f}`) }));
const windowsJobs = workflows.flatMap(({ f, text }) =>
  Object.entries(jobs(text))
    .filter(([, body]) => /runs-on:\s*windows/.test(body))
    .map(([name, body]) => ({ f, name, body: code(body) })),
);
const win32 = windowsJobs.find((j) => j.name === 'build-win32');

console.log('win32BundleBuild:');

test('there are Windows jobs to check, build-win32 among them', () => {
  assert.ok(windowsJobs.length >= 3, `found ${windowsJobs.length} Windows jobs`);
  assert.ok(win32, 'release-all.yml has a build-win32 job on a Windows runner');
});

test('build-win32 gives tar no drive-letter path', () => {
  assert.ok(/ND="\$\(cygpath -u "\$RUNNER_TEMP"\)\/node-ia32"/.test(win32.body),
    'the nodedir is built on the POSIX form of RUNNER_TEMP');
  assert.ok(/\(cd "\$ND" && tar -xzf node-headers\.tar\.gz --strip-components=1/.test(win32.body),
    'tar extracts by relative name inside the nodedir');
  assert.ok(/test -f "\$ND\/include\/node\/node\.h"/.test(win32.body),
    'and the headers are checked to have arrived');
  assert.ok(/NODEDIR="\$\(cygpath -w "\$ND"\)"/.test(win32.body),
    'node-gyp gets the Windows form of the nodedir');
});

// Negative, and for every Windows job: no tar line may name RUNNER_TEMP or
// GITHUB_WORKSPACE, or a variable assigned from them without cygpath -u.
test('no Windows job hands tar a Windows path', () => {
  for (const job of windowsJobs) {
    const windowsVars = [...job.body.matchAll(/\b([A-Z_][A-Z0-9_]*)="?\$\{?(?:RUNNER_TEMP|GITHUB_WORKSPACE)\b/g)]
      .map((m) => m[1]);
    for (const line of job.body.split('\n').filter((l) => /\btar\s+-?[a-zA-Z]*[xc]/.test(l))) {
      assert.ok(!/RUNNER_TEMP|GITHUB_WORKSPACE/.test(line),
        `${job.f} ${job.name}: tar is given a Windows path: ${line.trim()}`);
      for (const v of windowsVars) {
        assert.ok(!new RegExp(`\\$\\{?${v}\\b`).test(line),
          `${job.f} ${job.name}: tar is given $${v}, a Windows path: ${line.trim()}`);
      }
    }
  }
});

// Every Windows bundle job: the right sharp goes in, and every addon it ships
// is read before the zip is made - after the rebuild and everything that
// deletes files, so what is checked is what is zipped.
const BUNDLE_JOBS = { 'build-win64': 'x64', 'build-win-arm64': 'arm64', 'build-win32': 'ia32' };
test('each Windows bundle job adds its own sharp and checks its addons', () => {
  for (const [name, arch] of Object.entries(BUNDLE_JOBS)) {
    const job = windowsJobs.find((j) => j.name === name);
    assert.ok(job, `${name} exists and runs on Windows`);
    const at = (s) => job.body.indexOf(s);
    const add = at(`releases/platform-native-packages.mjs" bundle win32 ${arch}`);
    const check = at(`releases/check-addon-arch.mjs" bundle ${arch} bcrypt argon2 @img/sharp-win32-${arch}`);
    assert.ok(add !== -1, `${name} adds @img/sharp-win32-${arch}`);
    assert.ok(check > add, `${name} checks bcrypt, argon2 and sharp for ${arch}, after adding sharp`);
    assert.ok(at('npm-retry.sh" npm install') < add, `${name}: after the rebuild`);
    assert.ok(at('bundle-trim.mjs') < add && at('prune-unreachable-npm.mjs') < add,
      `${name}: after everything that deletes files`);
    assert.ok(check < at('7z a wekan-'), `${name}: before the zip is made`);
  }
});

// v12.32's win-arm64 zip had no arm64 argon2, and in v12.33 both cross-built
// jobs compiled nothing: npm 12 ignores npm_config_arch / npm_config_nodedir
// ("Unknown env config") and blocks install scripts outside allowScripts. A job
// whose CPU is not the runner's compiles with node-gyp directly, after the
// programs/server install brought node-gyp in and before it is pruned.
const CROSS = { 'build-win-arm64': 'arm64', 'build-win32': 'ia32' };
test('each cross-built Windows job compiles its addons with node-gyp itself', () => {
  for (const [name, arch] of Object.entries(CROSS)) {
    const job = windowsJobs.find((j) => j.name === name);
    const at = (s) => job.body.indexOf(s);
    const compile = at(`releases/compile-native-addons.mjs" ../.. ${arch}`);
    assert.ok(compile !== -1, `${name} runs compile-native-addons.mjs for ${arch}`);
    assert.ok(/compile-native-addons\.mjs"[^\n]* bcrypt argon2/.test(job.body), `${name}: for bcrypt and argon2`);
    assert.ok(at('npm-retry.sh" npm install') < compile, `${name}: after the install that brings node-gyp`);
    assert.ok(compile < at('prune-build-only-modules.mjs'), `${name}: before node-gyp is pruned`);
  }
  assert.ok(/compile-native-addons\.mjs" \.\.\/\.\. ia32 --nodedir "\$NODEDIR"/.test(
    windowsJobs.find((j) => j.name === 'build-win32').body),
  'win32 links against the fork\'s ia32 node.lib through --nodedir');
});

// Negative, everywhere: no workflow hands npm a config npm 12 does not know.
// It ignores them today, says it will refuse them in its next major version,
// and relying on them is what compiled nothing in v12.33.
test('no workflow relies on npm_config_arch, _target_arch or _nodedir', () => {
  for (const { f, text } of workflows) {
    const body = code(text);
    assert.ok(!/^\s*npm_config_(?:arch|target_arch|nodedir)\s*:/m.test(body), `${f} sets an npm_config_ arch/nodedir env`);
    assert.ok(!/export\s+npm_config_(?:arch|target_arch|nodedir)=/.test(body), `${f} exports an npm_config_ arch/nodedir`);
  }
});

// ── check-addon-arch.mjs itself, on real PE/ELF headers ─────────────────────
function pe(machine) {
  const b = Buffer.alloc(0x90);
  b.write('MZ', 0, 'latin1');
  b.writeUInt32LE(0x80, 0x3c);
  b.write('PE\0\0', 0x80, 'latin1');
  b.writeUInt16LE(machine, 0x84);
  return b;
}
// A little-endian x86-64 ELF header: e_machine 62 at offset 18.
const ELF = (() => {
  const b = Buffer.alloc(64);
  b.write('\x7fELF', 0, 'latin1');
  b[4] = 2; b[5] = 1;
  b.writeUInt16LE(62, 18);
  return b;
})();

function bundle(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'addon-arch-'));
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, typeof content === 'string' ? content : content);
  }
  return dir;
}
const AP = 'programs/server/npm/node_modules/meteor/accounts-password/node_modules';
function withBundle(files, fn) {
  const dir = bundle(files);
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the PE machine field is read, and ELF is told apart', () => {
  withBundle({ 'a.node': pe(PE_MACHINE.ia32), 'b.node': pe(PE_MACHINE.x64), 'c.node': ELF }, (d) => {
    assert.deepStrictEqual(readBinaryKind(path.join(d, 'a.node')), { format: 'PE', machine: 0x014c });
    assert.deepStrictEqual(readBinaryKind(path.join(d, 'b.node')), { format: 'PE', machine: 0x8664 });
    assert.deepStrictEqual(readBinaryKind(path.join(d, 'c.node')), { format: 'ELF', machine: 62 });
  });
});

test('compiled ia32 bcrypt and argon2 pass', () => {
  withBundle({
    [`${AP}/bcrypt/build/Release/bcrypt_lib.node`]: pe(PE_MACHINE.ia32),
    [`${AP}/bcrypt/prebuilds/win32-x64/bcrypt.node`]: pe(PE_MACHINE.x64),
    [`${AP}/argon2/build/Release/argon2.node`]: pe(PE_MACHINE.ia32),
    [`${AP}/argon2/prebuilds/linux-x64/argon2.glibc.node`]: ELF,
  }, (d) => {
    const r = checkAddonArch(d, 'ia32', ['bcrypt', 'argon2']);
    assert.deepStrictEqual(r.errors, []);
    assert.strictEqual(r.good.length, 2);
  });
});

test('a matching prebuild counts, as node-gyp-build would load it', () => {
  withBundle({
    [`${AP}/bcrypt/prebuilds/win32-ia32/bcrypt.node`]: pe(PE_MACHINE.ia32),
  }, (d) => assert.deepStrictEqual(checkAddonArch(d, 'ia32', ['bcrypt']).errors, []));
});

// Negative: what the job shipped if the cross-build quietly did nothing.
test('only the x64 prebuilds - no ia32 build - fails for each package', () => {
  withBundle({
    [`${AP}/bcrypt/prebuilds/win32-x64/bcrypt.node`]: pe(PE_MACHINE.x64),
    [`${AP}/argon2/prebuilds/win32-x64/argon2.glibc.node`]: pe(PE_MACHINE.x64),
  }, (d) => {
    const { errors } = checkAddonArch(d, 'ia32', ['bcrypt', 'argon2']);
    assert.strictEqual(errors.length, 2);
    assert.ok(errors.every((e) => /has no ia32 Windows addon to load/.test(e)));
  });
});

test('a build for the wrong CPU, or a Linux one, is refused', () => {
  withBundle({ [`${AP}/bcrypt/build/Release/bcrypt_lib.node`]: pe(PE_MACHINE.x64) }, (d) => {
    assert.ok(checkAddonArch(d, 'ia32', ['bcrypt']).errors.some((e) => /PE machine 0x8664/.test(e)));
  });
  withBundle({ [`${AP}/argon2/build/Release/argon2.node`]: ELF }, (d) => {
    assert.ok(checkAddonArch(d, 'ia32', ['argon2']).errors.some((e) => /is ELF/.test(e)));
  });
  withBundle({ [`${AP}/bcrypt/prebuilds/win32-ia32/bcrypt.node`]: pe(PE_MACHINE.x64) }, (d) => {
    assert.ok(checkAddonArch(d, 'ia32', []).errors.some((e) => /in the ia32 Windows prebuilds/.test(e)));
  });
});

test('a package missing from the bundle is reported, not passed', () => {
  withBundle({ 'programs/server/x.txt': 'x' }, (d) => {
    assert.deepStrictEqual(checkAddonArch(d, 'ia32', ['argon2']).errors,
      ['no native addon of argon2 is in the bundle at all']);
  });
});

test("another platform's package is skipped, by npm's os/cpu rule", () => {
  withBundle({
    'programs/server/npm/node_modules/@img/sharp-linux-x64/package.json':
      JSON.stringify({ name: '@img/sharp-linux-x64', os: ['linux'], cpu: ['x64'] }),
    'programs/server/npm/node_modules/@img/sharp-linux-x64/lib/sharp.node': ELF,
    'programs/server/npm/node_modules/@img/sharp-win32-x64/package.json':
      JSON.stringify({ name: '@img/sharp-win32-x64', os: ['win32'], cpu: ['x64'] }),
    'programs/server/npm/node_modules/@img/sharp-win32-x64/lib/sharp.node': pe(PE_MACHINE.x64),
  }, (d) => {
    const r = checkAddonArch(d, 'ia32', []);
    assert.deepStrictEqual(r.errors, []);
    assert.strictEqual(r.skipped.length, 2);
  });
  // ...but a package that claims this platform is checked like any other.
  withBundle({
    'programs/server/npm/node_modules/fake/package.json': JSON.stringify({ os: ['win32'], cpu: ['ia32'] }),
    'programs/server/npm/node_modules/fake/fake.node': pe(PE_MACHINE.x64),
  }, (d) => assert.strictEqual(checkAddonArch(d, 'ia32', []).errors.length, 1));
  assert.strictEqual(listAllows(undefined, 'win32'), true);
  assert.strictEqual(listAllows(['linux'], 'win32'), false);
  assert.strictEqual(listAllows(['!linux'], 'win32'), true);
  assert.strictEqual(listAllows(['!win32'], 'win32'), false);
});

console.log(`\nwin32BundleBuild: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
