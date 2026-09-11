'use strict';

// The Windows release legs compile argon2 with the node-gyp that Meteor pins
// in the bundle's programs/server/package.json - 10.2.0 in Meteor 3.5.2. On
// 2026-09-07 GitHub's windows-latest became windows-2025-vs2026 (Visual Studio
// 18, no Visual Studio 17), and node-gyp 10.2.0 knows nothing newer than 17:
//
//   gyp ERR! find VS unknown version "undefined" found at
//     "C:\Program Files\Microsoft Visual Studio\18\Enterprise"
//   gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
//
// That took build-win64 and build-win-arm64 down in the v11.70 run. The fix is
// releases/bump-bundle-node-gyp.mjs, run once on the amd64 bundle before its
// first `npm install`, because every other architecture reinstalls
// programs/server from that same package.json. This suite pins:
//
//   - the script raises an exact pin below the minimum, keeps one at or above
//     it, leaves a bundle with no pin alone, and never rewrites anything else;
//   - the minimum is a node-gyp that detects Visual Studio 2026 (>= 12.1.0,
//     with the 13.0.1+ detection fix);
//   - release-all.yml runs the script in the amd64 "Install server npm modules"
//     step BEFORE `npm install` - after it the pin has already been resolved,
//     and in any other job the bundle has already been derived.
//
// Run: node tests/bumpBundleNodeGyp.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'releases', 'bump-bundle-node-gyp.mjs');
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'release-all.yml');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

function tmpBundle(serverPkg) {
  const base = process.env.TMPDIR || os.tmpdir();
  const dir = fs.mkdtempSync(path.join(base, 'bump-node-gyp-'));
  const server = path.join(dir, 'programs', 'server');
  fs.mkdirSync(server, { recursive: true });
  const file = path.join(server, 'package.json');
  fs.writeFileSync(file, `${JSON.stringify(serverPkg, null, 2)}\n`);
  return { dir, file };
}

// What Meteor 3.5.2's bundler writes, trimmed to what matters here.
const meteorServerPkg = () => ({
  name: 'meteor-dev-bundle',
  private: true,
  dependencies: {
    promise: '8.3.0',
    semver: '7.6.3',
    'node-gyp': '10.2.0',
    '@mapbox/node-pre-gyp': '2.0.3',
  },
  devDependencies: { chalk: '4.1.2' },
  scripts: { install: 'node npm-rebuild.js' },
});

(async () => {
  console.log('bumpBundleNodeGyp:');
  const mod = await import(pathToFileURL(scriptPath).href);
  const { MIN_NODE_GYP, bumpNodeGyp, isBelow } = mod;

  await test('the minimum node-gyp is one that detects Visual Studio 2026', () => {
    assert.match(MIN_NODE_GYP, /^\d+\.\d+\.\d+$/);
    // 12.1.0 added VS 2026; 13.0.1 and 13.0.2 fixed its version detection.
    assert.ok(!isBelow(MIN_NODE_GYP, '13.0.1'),
      `MIN_NODE_GYP ${MIN_NODE_GYP} is older than the VS 2026 detection fix in 13.0.1`);
  });

  await test('isBelow compares versions numerically, not as strings', () => {
    assert.strictEqual(isBelow('10.2.0', '13.0.2'), true);
    assert.strictEqual(isBelow('9.4.1', '10.0.0'), true);
    assert.strictEqual(isBelow('13.0.2', '13.0.2'), false);
    assert.strictEqual(isBelow('13.10.0', '13.9.0'), false);
    assert.strictEqual(isBelow('14.0.0', '13.0.2'), false);
  });

  await test('an exact pin below the minimum is raised and the rest of the file is untouched', () => {
    const { dir, file } = tmpBundle(meteorServerPkg());
    try {
      const before = JSON.parse(fs.readFileSync(file, 'utf8'));
      const result = bumpNodeGyp(file);
      assert.deepStrictEqual(result, { status: 'bumped', have: '10.2.0', now: MIN_NODE_GYP });
      const after = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.strictEqual(after.dependencies['node-gyp'], MIN_NODE_GYP);
      before.dependencies['node-gyp'] = MIN_NODE_GYP;
      assert.deepStrictEqual(after, before, 'only the node-gyp pin changed');
      assert.ok(fs.readFileSync(file, 'utf8').endsWith('}\n'), 'keeps the bundler\'s 2-space, newline-terminated layout');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('--dry-run reports the bump but writes nothing', () => {
    const { dir, file } = tmpBundle(meteorServerPkg());
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const result = bumpNodeGyp(file, { dryRun: true });
      assert.strictEqual(result.status, 'bumped');
      assert.strictEqual(fs.readFileSync(file, 'utf8'), raw);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('a pin at or above the minimum is kept - a newer Meteor keeps its own node-gyp', () => {
    for (const have of [MIN_NODE_GYP, '99.0.0']) {
      const pkg = meteorServerPkg();
      pkg.dependencies['node-gyp'] = have;
      const { dir, file } = tmpBundle(pkg);
      try {
        const raw = fs.readFileSync(file, 'utf8');
        assert.deepStrictEqual(bumpNodeGyp(file), { status: 'kept', have });
        assert.strictEqual(fs.readFileSync(file, 'utf8'), raw);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  await test('a range or tarball pin is somebody else\'s decision and is kept', () => {
    const pkg = meteorServerPkg();
    pkg.dependencies['node-gyp'] = '^10.0.0';
    const { dir, file } = tmpBundle(pkg);
    try {
      assert.deepStrictEqual(bumpNodeGyp(file), { status: 'kept', have: '^10.0.0' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('a bundle with no node-gyp pin is left alone', () => {
    const pkg = meteorServerPkg();
    delete pkg.dependencies['node-gyp'];
    const { dir, file } = tmpBundle(pkg);
    try {
      const raw = fs.readFileSync(file, 'utf8');
      assert.deepStrictEqual(bumpNodeGyp(file), { status: 'no-pin' });
      assert.strictEqual(fs.readFileSync(file, 'utf8'), raw);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('an unreadable package.json is reported, not thrown', () => {
    const result = bumpNodeGyp(path.join(os.tmpdir(), 'does-not-exist', 'package.json'));
    assert.strictEqual(result.status, 'unreadable');
  });

  await test('a read-only package.json that needs the bump is reported as unwritable, not thrown', () => {
    const { dir, file } = tmpBundle(meteorServerPkg());
    try {
      fs.chmodSync(file, 0o444);
      const result = bumpNodeGyp(file);
      // Root ignores file modes; then the write succeeds and that is fine too.
      assert.ok(['unwritable', 'bumped'].includes(result.status), result.status);
      if (result.status === 'unwritable') assert.strictEqual(result.have, '10.2.0');
    } finally {
      fs.chmodSync(file, 0o644);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('release-all.yml runs the script on the amd64 bundle before its first npm install', () => {
    const yml = fs.readFileSync(workflowPath, 'utf8');
    const stepStart = yml.indexOf('- name: Install server npm modules');
    assert.ok(stepStart > 0, 'the amd64 "Install server npm modules" step exists');
    const nextStep = yml.indexOf('\n      - ', stepStart + 1);
    const step = yml.slice(stepStart, nextStep > 0 ? nextStep : undefined);
    const bump = step.indexOf('releases/bump-bundle-node-gyp.mjs');
    const install = step.indexOf('npm install');
    assert.ok(bump > 0, 'the step runs releases/bump-bundle-node-gyp.mjs');
    assert.ok(install > 0, 'the step runs npm install');
    assert.ok(bump < install,
      'the pin must be raised BEFORE npm install resolves it - after is too late');
    // And it is the one place: the Windows legs reinstall from the amd64
    // bundle's package.json and must not need their own copy of this.
    const occurrences = yml.split('bump-bundle-node-gyp.mjs').length - 1;
    assert.strictEqual(occurrences, 1,
      'the script runs once, on the amd64 bundle every other arch derives from');
  });

  await test('negative: no workflow leg still hard-codes node-gyp 10.2.0 or a GYP_MSVS_VERSION workaround', () => {
    const dir = path.join(repoRoot, '.github', 'workflows');
    for (const f of fs.readdirSync(dir)) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      assert.ok(!/node-gyp@10\.2\.0/.test(text), `${f} pins node-gyp 10.2.0`);
      assert.ok(!/GYP_MSVS_VERSION/.test(text),
        `${f} sets GYP_MSVS_VERSION - node-gyp 10 cannot be pointed at Visual Studio 18 that way`);
    }
  });

  console.log(`  ${passed} passed`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
