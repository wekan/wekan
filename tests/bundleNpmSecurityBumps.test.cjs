'use strict';

// The npm packages Meteor's packages bundle, and why they are bumped in the
// BUNDLE rather than in package.json.
// Run: node tests/bundleNpmSecurityBumps.test.cjs
//
// `Npm.depends` in a Meteor package names an EXACT version, and `meteor build`
// copies that version into programs/server/npm/node_modules/meteor/<package>/
// node_modules. Nothing in this repository's package.json reaches it - not a
// dependency, not an `overrides` entry - so the published image carried
// nodemailer 8.0.3 and openpgp 5.11.1 (meteor/email), svgo 2.8.2 + postcss 8.5.1
// + nanoid 3.3.15 (meteor/minifier-css), qs 6.13.0 + cookie 0.4.1 + on-headers
// 1.0.2 + tmp 0.2.3 (meteor/webapp), lodash 4.17.21 + diff 3.5.0 (ostrio:files),
// and @babel/runtime 7.20.7, every one of them with an advisory and a fix
// released inside the same major.
//
// releases/bump-bundle-npm-deps.mjs raises them in the built bundle, from the
// minimums in releases/bundle-npm-security-bumps.json. The rule that keeps it
// safe is that a minimum stays inside the major the Meteor package was built
// against, and uuid is the counter-example that proves the rule: 11.1.1 is the
// lowest fixed release, it moved its entry point to dist/cjs/index.js, and the
// bundle - which recorded dist/index.js at build time - died on boot with
// "Cannot find module .../uuid/dist/index.js". It is in notFixable with that
// message, not in minimums.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const manifest = JSON.parse(read('releases/bundle-npm-security-bumps.json'));
const bumper = read('releases/bump-bundle-npm-deps.mjs');
const workflow = read('.github/workflows/release-all.yml');
const dockerfile = read('Dockerfile');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('bundleNpmSecurityBumps:');

test('the manifest lists the packages the scan found, at fixed versions', () => {
  const expected = {
    'nodemailer': '10.3', 'openpgp': '5.11', 'svgo': '2.8.4', 'postcss': '8.5',
    'nanoid': '3.3', 'lodash': '4.18', 'qs': '6.16.1', 'body-parser': '1.20.9', 'body-parser@2': '2.4',
    'uuid': '11.1.1', 'postcss-selector-parser': '6.1.5',
    'cookie': '0.7', 'on-headers': '1.1', 'tmp': '0.2', 'diff': '3.5',
    '@babel/runtime': '7.', 'underscore': '1.13.8',
    // Artifact Hub's Trivy report of the v12.38 image: same-major fixes.
    'browserslist': '4.28.7', 'baseline-browser-mapping': '2.11', 'colord': '2.9.4',
    'compression': '1.8', 'source-map-js': '1.2.2', 'lodash.template': '4.18',
  };
  for (const [name, prefix] of Object.entries(expected)) {
    const got = manifest.minimums[name];
    assert.ok(got, `${name} is missing from the manifest`);
    assert.ok(got.startsWith(prefix),
      `${name} is pinned at ${got}, which does not fix what was reported`);
  }
});

test('uuid is bumped to 11.1.1 and the entry point the bundle recorded is written back', () => {
  // uuid 11 moved its entry from dist/index.js to dist/cjs/index.js, and a bundle
  // that recorded dist/index.js died on boot ("Cannot find module
  // .../uuid/dist/index.js"). The fix is a shim at the old path, not a refusal.
  assert.strictEqual(manifest.minimums.uuid, '11.1.1');
  const shim = (manifest.shims || {}).uuid || {};
  assert.strictEqual(shim['dist/index.js'], "export * from './esm/index.js';\n",
    'dist/index.js re-exports the ESM build (uuid is "type": "module"; a CJS shim would be parsed as ESM)');
  assert.ok(/manifest\.shims/.test(bumper) && /writeFileSync\(file, body\)/.test(bumper),
    'and the bumper writes it after every replacement');
  // negative: nothing is described as unfixable that was fixed
  for (const name of ['uuid', 'nodemailer']) {
    assert.ok(!(name in manifest.notFixable), `${name} must not stay in notFixable`);
  }
});

test('nodemailer 10 gets back the lib/ files meteor/email was built against', () => {
  // v12.95's bundle failed its smoke boot: nodemailer 10 moved lib/ to dist/cjs/,
  // and packages/email.js links the paths it recorded for 8.0.3 - "Cannot find
  // module .../meteor/email/node_modules/nodemailer/lib/nodemailer.js" - and
  // Npm.requires nodemailer/lib/mail-composer, which Meteor resolves by path.
  const shim = (manifest.shims || {}).nodemailer || {};
  const os = require('os');
  const src = path.join(repoRoot, 'node_modules/nodemailer');
  const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
  assert.ok(Number(pkg.version.split('.')[0]) >= 10, `node_modules/nodemailer ${pkg.version} has the 10 layout`);
  // every lib/<name> directory nodemailer 10 still exports has its old file back,
  // so no path a nodemailer 8 caller could have recorded is left unresolvable
  const dirs = Object.entries(pkg.exports)
    .filter(([key, target]) => /^\.\/lib\/[a-z0-9-]+$/.test(key)
      && target && target.require === `./dist/cjs/${key.slice(6)}/index.js`)
    .map(([key]) => `lib/${key.slice(6)}/index.js`);
  assert.ok(dirs.includes('lib/mail-composer/index.js') && dirs.includes('lib/well-known/index.js'));
  for (const rel of ['lib/package.json', 'lib/nodemailer.js', ...dirs]) {
    assert.ok(rel in shim, `nodemailer shim for ${rel}`);
  }
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'nodemailer-shim-'));
  try {
    const shimmed = path.join(tmp, 'with', 'nodemailer');
    const bare = path.join(tmp, 'without', 'nodemailer');
    for (const [dir, files] of [[shimmed, Object.keys(shim)], [bare, ['lib/nodemailer.js']]]) {
      fs.cpSync(src, dir, { recursive: true });
      for (const rel of files) {
        fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
        fs.writeFileSync(path.join(dir, rel), shim[rel]);
      }
    }
    // the two paths the bundle recorded, required by file as Meteor's runtime does
    assert.strictEqual(typeof require(path.join(shimmed, 'lib/nodemailer.js')).createTransport, 'function');
    assert.strictEqual(typeof require(path.join(shimmed, 'lib/well-known/index.js')), 'function');
    assert.strictEqual(typeof require(path.join(shimmed, 'lib/mail-composer')), 'function');
    // and each forward is the module the exports map gives a require() caller
    for (const rel of dirs) {
      assert.strictEqual(require(path.join(shimmed, rel)),
        require(path.join(shimmed, 'dist/cjs', rel.slice(4))), rel);
    }
    // negative: without lib/package.json the CommonJS shim is parsed as ESM
    // (nodemailer is "type": "module") and does not load
    assert.throws(() => require(path.join(bare, 'lib/nodemailer.js')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('body-parser 1.x and 2.x are each raised inside their own major', () => {
  assert.strictEqual(manifest.minimums['body-parser'], '1.20.9');
  assert.strictEqual(manifest.minimums['body-parser@2'], '2.4.0');
  const fs2 = require('fs'), os = require('os'), cp = require('child_process');
  const bundle = fs2.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'bump-test-'));
  const put = (dir, version) => {
    const d = path.join(bundle, 'programs/server/npm/node_modules', dir);
    fs2.mkdirSync(d, { recursive: true });
    fs2.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ name: 'x', version }));
  };
  put('meteor/a/node_modules/body-parser', '1.20.6');
  put('meteor/b/node_modules/body-parser', '2.3.0');
  put('meteor/c/node_modules/body-parser', '2.4.0');
  put('meteor/d/node_modules/body-parser', '1.20.9');
  put('meteor/e/node_modules/uuid', '8.3.2');
  put('meteor/f/node_modules/uuid', '14.0.2');
  put('meteor/g/node_modules/nodemailer', '8.0.11');
  const out = cp.execFileSync(process.execPath,
    [path.join(repoRoot, 'releases/bump-bundle-npm-deps.mjs'), bundle, '--dry-run'], { encoding: 'utf8' });
  fs2.rmSync(bundle, { recursive: true, force: true });
  const lines = out.split('\n').filter(l => /->/.test(l));
  const has = re => lines.some(l => re.test(l));
  assert.ok(has(/body-parser 1\.20\.6 -> 1\.20\.9/), '1.x below 1.20.9 is raised to 1.20.9');
  assert.ok(has(/body-parser 2\.3\.0 -> 2\.4\.0/), '2.3.0 is raised to 2.4.0');
  // negative: neither crosses into the other major, and fixed copies are left alone
  assert.ok(!has(/body-parser 1\.\d+\.\d+ -> 2\./) && !has(/body-parser 2\.\d+\.\d+ -> 1\./));
  assert.ok(!has(/body-parser 2\.4\.0 ->/) && !has(/body-parser 1\.20\.9 ->/));
  assert.ok(has(/uuid 8\.3\.2 -> 11\.1\.1/) && !has(/uuid 14\./), 'uuid 14 is above the minimum');
  assert.ok(has(/nodemailer 8\.0\.11 -> 10\.3\.1/));
});

test('a fix that needs a new major its dependents cannot take is recorded in notFixable (negative)', () => {
  const reason = (manifest.notFixable['postcss-selector-parser'] || []).join(' ');
  assert.ok(/major/.test(reason) && /CVE-2026-104844/.test(reason));
  assert.ok(manifest.minimums['postcss-selector-parser'] === '6.1.5',
    'but the same-major fix that exists is taken');
  assert.ok(!('lodash.template' in manifest.notFixable));
  for (const [name, version] of Object.entries(manifest.minimums)) {
    assert.ok(/^\d+\.\d+\.\d+$/.test(version), `${name} is pinned to an exact version`);
  }
});

test('the bumper installs without scripts, so no prebuilt native is rebuilt', () => {
  assert.ok(/'--ignore-scripts'/.test(bumper),
    'uWebSockets.js, bcrypt and argon2 must not be rebuilt by a version bump');
  assert.ok(/--no-save/.test(bumper) || !/package\.json/.test(bumper)
    || /no package\.json is what we want/.test(bumper),
    'and nothing of the bundle\'s own manifests is rewritten');
});

test('it only replaces copies that are BELOW the minimum', () => {
  assert.ok(/compare\(c\.version, minimum\) < 0/.test(bumper),
    'a copy already at or above the minimum is left alone');
  // An existing sibling dependency is never overwritten: a different version
  // goes into the bumped package's own node_modules instead.
  assert.ok(/if \(have === want\) continue;/.test(bumper), 'a matching sibling is reused');
  assert.ok(/have === undefined \? dest : path\.join\(copy\.dir, 'node_modules', dep\)/.test(bumper),
    'a different sibling is left alone and the dependency is nested');
  assert.ok(/if \(fs\.existsSync\(target\)\) continue;/.test(bumper), 'and nothing is overwritten');
});

test('the version compare is numeric, not lexical', () => {
  // "1.20.3" vs "1.20.6" is fine either way; "4.17.21" vs "4.9.0" is not.
  assert.ok(/parseInt\(n, 10\)/.test(bumper), 'versions are compared as numbers');
});

test('the amd64 build bumps, and that pass reaches every other arch', () => {
  const amd64 = workflow.indexOf('cd .build/bundle/programs/server');
  const bump = workflow.indexOf('bump-bundle-npm-deps.mjs', amd64);
  assert.ok(amd64 > 0 && bump > amd64, 'the amd64 leg bumps after its install');
  assert.ok(/meteor\/ tree travels to every other arch/.test(workflow),
    'and says why one pass is enough for the meteor/ tree');
});

test('every leg bumps again, because npm install puts underscore back', () => {
  // meteor-dev-bundle pins underscore 1.13.7 (CVE-2026-27601). Any leg that
  // reinstalls programs/server reinstalls that pin over the bumped copy.
  const legs = (workflow.match(/bump-bundle-npm-deps\.mjs/g) || []).length;
  assert.ok(legs >= 7, `expected a bump in each bundle leg, found ${legs}`);
  assert.ok(/bump-bundle-npm-deps\.mjs/.test(read('releases/install-node-for-arch.sh')),
    'the extra-arch containers too');
  // The Docker image used to reinstall programs/server from the .zip and redo
  // its post-processing, under QEMU for six of seven platforms. Since the image
  // is built from the .zip as it was published (Dockerfile stage 1, checked
  // against its .sha256sum), it has nothing to redo: the .zip's own leg in
  // release-all.yml already ran these steps. See tests/dockerImageFromBundle.test.cjs.
  assert.ok(!/npm install/.test(dockerfile.replace(/^\s*#.*$/gm, '')),
    'the Docker image reinstalls nothing, so it has no underscore pin to undo');
});

test('the Dockerfile copies the manifest beside the script, when it runs it', () => {
  // The script reads the manifest from its own directory; without this line the
  // image build dies on a missing file instead of shipping an unbumped bundle.
  // The image no longer runs it (see above) - so both must be absent together.
  const runs = /node \/tmp\/bump-bundle-npm-deps\.mjs/.test(dockerfile);
  const copies = /COPY --chmod=644 releases\/bundle-npm-security-bumps\.json/.test(dockerfile);
  assert.strictEqual(copies, runs, 'the manifest is copied exactly when the script runs');
});

test('npm is run in a way that works on Windows too', () => {
  // v10.93: build-win64 and build-win-arm64 died AFTER building the bundle and
  // compiling its native modules, with
  //
  //   Error: spawnSync npm ENOENT
  //
  // because npm on Windows is npm.cmd, a batch script, and Node applies no
  // PATHEXT when it spawns - so `execFileSync('npm', …)` resolves to nothing.
  // (build-win32 was skipped that run for want of a Node.js build, so it never
  // reached this and looked fine; the fault is not architecture-specific.)
  const script = read('releases/bump-bundle-npm-deps.mjs');
  const code = script.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  // The INSTALL goes through the helper, not straight at the PATH.
  assert.ok(/^\s*npm\(\[\s*$/m.test(code) && /'install', `\$\{name\}@\$\{minimum\}`/.test(code),
    'the install call goes through the npm() helper');
  assert.ok(/npm-cli\.js/.test(code) && /execFileSync\(process\.execPath/.test(code),
    "whose first route runs npm's own CLI with this Node - no PATH lookup, no PATHEXT");
  // A bare execFileSync('npm', …) may remain only as the LAST resort inside that
  // helper, where npm really is an executable on PATH.
  assert.ok((code.match(/execFileSync\(\s*'npm'/g) || []).length <= 1,
    "execFileSync('npm', …) is ENOENT on Windows; it may only be the helper's fallback");
  // shell: true would find the .cmd and break differently: with a shell Node
  // joins the arguments and quotes nothing, so a Windows temp path with a space
  // would corrupt the install.
  assert.ok(!/shell:\s*true/.test(code),
    'and not through a shell, which would not quote the arguments');
});

console.log(`\nbundleNpmSecurityBumps: ${passed} tests passed`);
