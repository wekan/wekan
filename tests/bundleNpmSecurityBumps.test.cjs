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
    'nodemailer': '8.0', 'openpgp': '5.11', 'svgo': '2.8', 'postcss': '8.5',
    'nanoid': '3.3', 'lodash': '4.18', 'qs': '6.15', 'body-parser': '1.20',
    'cookie': '0.7', 'on-headers': '1.1', 'tmp': '0.2', 'diff': '3.5',
    '@babel/runtime': '7.', 'underscore': '1.13.8',
  };
  for (const [name, prefix] of Object.entries(expected)) {
    const got = manifest.minimums[name];
    assert.ok(got, `${name} is missing from the manifest`);
    assert.ok(got.startsWith(prefix),
      `${name} is pinned at ${got}, which does not fix what was reported`);
  }
});

test('uuid is NOT bumped, and says why (negative)', () => {
  // The one that was tried and reverted. If somebody adds it back, the bundle
  // stops booting - so the reason lives where they would look.
  assert.ok(!('uuid' in manifest.minimums), 'uuid must not be in minimums');
  const reason = (manifest.notFixable.uuid || []).join(' ');
  assert.ok(/Cannot find module/.test(reason) && /dist\/cjs\/index\.js/.test(reason),
    'and notFixable carries the boot error it caused');
});

test('lodash.template is recorded as unfixable, not silently skipped', () => {
  const reason = (manifest.notFixable['lodash.template'] || []).join(' ');
  assert.ok(/no fixed release/.test(reason) && /aldeed/.test(reason),
    'a package with no fix says so, and says whose change it is');
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
  assert.ok(/if \(fs\.existsSync\(dest\)\) continue;/.test(bumper),
    'and an existing sibling dependency is never overwritten');
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
  assert.ok(/node \/tmp\/bump-bundle-npm-deps\.mjs \.\/bundle/.test(dockerfile),
    'and the Docker image, which reinstalls programs/server from the .zip');
});

test('the Dockerfile copies the manifest beside the script', () => {
  // The script reads the manifest from its own directory; without this line the
  // image build dies on a missing file instead of shipping an unbumped bundle.
  assert.ok(/COPY --chmod=644 releases\/bundle-npm-security-bumps\.json/.test(dockerfile),
    'the manifest is copied in too');
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
