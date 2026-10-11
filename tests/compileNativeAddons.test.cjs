'use strict';
(async () => {

// Plain-Node unit test for releases/compile-native-addons.mjs.
// Run: node tests/compileNativeAddons.test.cjs
//
// In v12.33 build-win32 and build-win-arm64 compiled no native addon: npm 12
// ignores npm_config_arch / npm_config_nodedir and blocks install scripts
// outside allowScripts, so the install the jobs relied on built nothing, and
// check-addon-arch.mjs refused both bundles. The script runs node-gyp itself.
// Here node-gyp is replaced by a function that records its arguments and
// writes what node-gyp would.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { plan, hasPrebuild, compileNativeAddons, packageCopies } =
  await import('../releases/compile-native-addons.mjs');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const AP = 'programs/server/npm/node_modules/meteor/accounts-password/node_modules';
const GYP = 'programs/server/node_modules/node-gyp/bin/node-gyp.js';
function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compile-addons-'));
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
  }
  return dir;
}
function withTree(files, fn) {
  const dir = tree(files);
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
// The accounts-password tree as the Windows jobs have it after the install.
const BUNDLE = {
  [GYP]: '// node-gyp',
  [`${AP}/bcrypt/package.json`]: '{"name":"bcrypt"}',
  [`${AP}/bcrypt/binding.gyp`]: '{}',
  [`${AP}/bcrypt/prebuilds/win32-x64/bcrypt.node`]: 'MZ',
  [`${AP}/bcrypt/prebuilds/win32-arm64/bcrypt.node`]: 'MZ',
  [`${AP}/argon2/package.json`]: '{"name":"argon2"}',
  [`${AP}/argon2/binding.gyp`]: '{}',
  [`${AP}/argon2/prebuilds/win32-x64/argon2.glibc.node`]: 'MZ',
  [`${AP}/argon2/prebuilds/linux-arm64/argon2.armv8.glibc.node`]: 'ELF',
};
// A node-gyp that records what it was asked and leaves build/Release behind.
function fakeGyp({ status = 0, writes = true } = {}) {
  const calls = [];
  const run = (exe, args, opts) => {
    calls.push({ exe, args, cwd: opts.cwd });
    const dir = args.find((a) => a.startsWith('--directory=')).slice('--directory='.length);
    if (writes) {
      fs.mkdirSync(path.join(dir, 'build/Release'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'build/Release/addon.node'), 'MZ');
    }
    return { status };
  };
  return { run, calls };
}
const quiet = { log: () => {} };
const rel = (dir, p) => path.relative(dir, p).split(path.sep).join('/');

console.log('compileNativeAddons:');

test('only what has no prebuild for the target CPU is compiled', () => {
  withTree(BUNDLE, (d) => {
    const arm = plan(d, 'arm64', ['bcrypt', 'argon2']);
    assert.deepStrictEqual(arm.compile.map((p) => rel(d, p)), [`${AP}/argon2`],
      'arm64: argon2 0.44 has no win32-arm64 prebuild, bcrypt 6 has one');
    const ia32 = plan(d, 'ia32', ['bcrypt', 'argon2']);
    assert.deepStrictEqual(ia32.compile.map((p) => rel(d, p)).sort(), [`${AP}/argon2`, `${AP}/bcrypt`],
      'ia32: neither publishes a win32-ia32 prebuild');
    assert.deepStrictEqual(plan(d, 'x64', ['bcrypt', 'argon2']).compile, [], 'x64: both prebuilt');
  });
});

test('prebuild directories are read the way node-gyp-build reads them', () => {
  withTree({
    'a/prebuilds/win32-x64+arm64/a.node': 'MZ',
    'b/prebuilds/win32-arm64/README': 'no addon here',
    'c/prebuilds/linux-arm64/c.node': 'ELF',
  }, (d) => {
    assert.strictEqual(hasPrebuild(path.join(d, 'a'), 'arm64'), true, 'multi-arch tuple');
    assert.strictEqual(hasPrebuild(path.join(d, 'b'), 'arm64'), false, 'a directory with no .node');
    assert.strictEqual(hasPrebuild(path.join(d, 'c'), 'arm64'), false, 'another platform');
  });
});

test('node-gyp is asked for the target CPU, in the package, with the nodedir', () => {
  withTree(BUNDLE, (d) => {
    const gyp = fakeGyp();
    const r = compileNativeAddons(d, 'ia32', ['bcrypt', 'argon2'], { nodedir: 'D:\\a\\_temp\\node-ia32', run: gyp.run, ...quiet });
    assert.strictEqual(r.compiled.length, 2);
    for (const call of gyp.calls) {
      assert.strictEqual(call.exe, process.execPath, 'node-gyp.js runs under this node, no shell');
      assert.ok(call.args[0].endsWith(path.join('node-gyp', 'bin', 'node-gyp.js')));
      assert.deepStrictEqual(call.args.slice(1, 3), ['rebuild', '--arch=ia32']);
      assert.ok(call.args.includes(`--directory=${call.cwd}`));
      assert.ok(call.args.includes('--nodedir=D:\\a\\_temp\\node-ia32'));
    }
  });
  withTree(BUNDLE, (d) => {
    const gyp = fakeGyp();
    compileNativeAddons(d, 'arm64', ['bcrypt', 'argon2'], { run: gyp.run, ...quiet });
    assert.strictEqual(gyp.calls.length, 1);
    assert.ok(!gyp.calls[0].args.some((a) => a.startsWith('--nodedir')), 'arm64 uses nodejs.org\'s own arm64 node.lib');
  });
});

// Negative: every way the compile can quietly not happen is an error.
test('a failed compile, no output, no node-gyp or no package is an error', () => {
  withTree(BUNDLE, (d) => {
    assert.throws(() => compileNativeAddons(d, 'arm64', ['argon2'], { run: fakeGyp({ status: 1 }).run, ...quiet }),
      /node-gyp failed for .*argon2 \(exit 1\)/);
  });
  withTree(BUNDLE, (d) => {
    assert.throws(() => compileNativeAddons(d, 'arm64', ['argon2'], { run: fakeGyp({ writes: false }).run, ...quiet }),
      /left no \.node/);
  });
  const noGyp = { ...BUNDLE };
  delete noGyp[GYP];
  withTree(noGyp, (d) => {
    assert.throws(() => compileNativeAddons(d, 'arm64', ['argon2'], { run: fakeGyp().run, ...quiet }),
      /before prune-build-only-modules/);
  });
  withTree(BUNDLE, (d) => {
    assert.throws(() => compileNativeAddons(d, 'arm64', ['argon3'], { run: fakeGyp().run, ...quiet }),
      /not in the bundle: argon3/);
    assert.throws(() => compileNativeAddons(d, 'mips', ['argon2'], quiet), /unknown arch/);
  });
});

test('scoped packages and nested copies are all found', () => {
  withTree({
    'programs/server/npm/node_modules/@scope/pkg/package.json': '{}',
    'programs/server/npm/node_modules/x/node_modules/@scope/pkg/package.json': '{}',
  }, (d) => {
    assert.strictEqual(packageCopies(path.join(d, 'programs/server/npm'), '@scope/pkg').length, 2);
  });
});

console.log(`\ncompileNativeAddons: all ${passed} tests passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
