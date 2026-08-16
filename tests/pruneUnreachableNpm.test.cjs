'use strict';

// Guard: releases/prune-unreachable-npm.mjs removes only what it can prove is
// unreachable, and the proof is re-run every time.
// Run: node tests/pruneUnreachableNpm.test.cjs
//
// programs/server/npm/node_modules is 347 MB of an ~850 MB bundle and 206 MB of
// it is not reachable from any server entry point - it is a full `npm install`,
// devDependencies included, sitting outside the bundler's graph because
// Atmosphere packages load it through Npm.require(), which rspack cannot follow.
//
// Deleting from it is riskier than the uWebSockets.js removal was, so the tool
// has two independent safeties and these tests are mostly about THEM:
//
//   1. the POLICY names what may go, and the reachability graph has a VETO - a
//      policy entry whose package is actually required is refused, so the list
//      cannot outlive its own justification;
//   2. after deleting, every path in the reachable set must still exist.
//
// The tests below therefore care much less about "does it delete typescript"
// than about "does it refuse when the graph disagrees" and "does it leave alone
// everything the policy does not name". A bundle that boots is worth more than
// the megabytes.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PRUNE = path.join(ROOT, 'releases', 'prune-unreachable-npm.mjs');

let passed = 0;
function test(name, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-prune-npm-'));
  try {
    fn(dir);
    passed += 1;
    console.log('  ok -', name);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// A bundle shaped like Meteor's: programs/server with app/app.js, packages/*.js
// and the npm/node_modules tree those load from.
function makeBundle(dir, files) {
  const bundle = path.join(dir, 'bundle');
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(bundle, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  fs.mkdirSync(path.join(bundle, 'programs', 'server', 'npm', 'node_modules', 'meteor'), { recursive: true });
  return bundle;
}

function prune(bundle, args = []) {
  return execFileSync(process.execPath, [PRUNE, bundle, ...args], { encoding: 'utf8' });
}

const NM = 'programs/server/npm/node_modules';
const has = (b, rel) => fs.existsSync(path.join(b, rel));

// A package: its package.json plus one file of code.
function pkg(name, code = '') {
  return {
    [`${NM}/${name}/package.json`]: JSON.stringify({ name: name.split('/').pop(), version: '1.0.0' }),
    [`${NM}/${name}/index.js`]: code,
  };
}

test('it removes a policy-named package that nothing requires', dir => {
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': 'require("left-pad");' },
    pkg('typescript', '// a compiler'),
    pkg('left-pad', 'module.exports = 1;'),
  ));
  const out = prune(bundle);
  assert.ok(!has(bundle, `${NM}/typescript`), 'typescript goes');
  assert.ok(has(bundle, `${NM}/left-pad`), 'and the required package stays');
  assert.ok(/removed 1 package/.test(out), `expected a count, got: ${out}`);
});

test('THE VETO: a policy-named package that IS required is refused', dir => {
  // The safety that matters. If a future WeKan really does require typescript,
  // the policy must not win - the graph must.
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': 'const ts = require("typescript");' },
    pkg('typescript', '// a compiler'),
  ));
  const out = prune(bundle);
  assert.ok(has(bundle, `${NM}/typescript`), 'it must still be there');
  assert.ok(/KEEPING typescript/.test(out),
    `and it must SAY it kept it, so the stale policy entry gets noticed. Got: ${out}`);
  assert.ok(/removed 0 package/.test(out), 'and nothing was removed');
});

test('it never touches a package the policy does not name (negative)', dir => {
  // 590 packages are unreachable; only the provable ones are in the policy. An
  // unreachable package the policy is silent about must survive untouched.
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': '// requires nothing' },
    pkg('jquery'), pkg('hotkeys-js'), pkg('@azure/storage-blob'),
  ));
  prune(bundle);
  for (const p of ['jquery', 'hotkeys-js', '@azure/storage-blob']) {
    assert.ok(has(bundle, `${NM}/${p}`),
      `${p} is unreachable but unproven, so it stays until someone can say why it may go`);
  }
});

test('an @types package containing real .js is NOT removed (negative)', dir => {
  // The @types entry rests on "declaration files only, so no require() can
  // resolve into one". If that stops being true for a package, the reason is
  // gone and so is the permission.
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': '// nothing' },
    { [`${NM}/@types/node/index.d.ts`]: 'declare module "x";' },
    { [`${NM}/@types/sneaky/index.d.ts`]: 'declare module "y";',
      [`${NM}/@types/sneaky/runtime.js`]: 'module.exports = 1;' },
  ));
  prune(bundle);
  assert.ok(!has(bundle, `${NM}/@types/node`), 'declaration-only goes');
  assert.ok(has(bundle, `${NM}/@types/sneaky`), 'one carrying runtime code stays');
});

test('Npm.require from a Meteor package resolves into that package\'s own tree', dir => {
  // packages/<name>.js is a Meteor package, and its Npm.require() looks first in
  // npm/node_modules/meteor/<name>/node_modules. Getting this wrong is how
  // uWebSockets.js would look unreachable while ddp-server requires it.
  //
  // Uses sinon, which the policy DOES name, so the veto is exercised at the same
  // time: found by the graph, proposed by the policy, refused.
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': '// nothing',
      'programs/server/packages/ostrio_files.js': "Npm.require('sinon');" },
    { [`${NM}/meteor/ostrio_files/node_modules/sinon/package.json`]: '{"name":"sinon"}',
      [`${NM}/meteor/ostrio_files/node_modules/sinon/index.js`]: '// test lib' },
  ));
  const out = prune(bundle);
  assert.ok(has(bundle, `${NM}/meteor/ostrio_files/node_modules/sinon`),
    'a package a Meteor package Npm.requires must be seen as reachable');
  assert.ok(/KEEPING meteor\/ostrio_files\/node_modules\/sinon/.test(out), `got: ${out}`);
});

test('a package linked the METEOR way counts as reached', dir => {
  // v10.97 shipped without nodemailer-openpgp and crash-looped on
  // `Cannot find module ".../nodemailer-openpgp/lib/nodemailer-openpgp.js"`,
  // because packages/email.js does not require() it - Meteor compiles an ESM
  // import to its own linker call:
  //
  //   module.link('nodemailer-openpgp',{openpgpEncrypt(v){openpgpEncrypt=v}},6);
  //
  // A scan for require() alone missed every ESM import in every Meteor package,
  // which is most of them: the reachable count went from 211 to 450 when this
  // was fixed. Each form below has to count, or the graph declares live code dead.
  for (const [label, source] of [
    ['module.link', "module.link('left-pad',{default(v){lp=v}},0);"],
    ['module.watch(require(...))', "module.watch(require('left-pad'));"],
    ['module.dynamicImport', "module.dynamicImport('left-pad').then(m => m);"],
    ['plain require', "require('left-pad');"],
  ]) {
    const sub = fs.mkdtempSync(path.join(dir, 'link-'));
    const bundle = makeBundle(sub, Object.assign(
      { 'programs/server/app/app.js': source },
      pkg('left-pad', 'module.exports = 1;'),
      pkg('typescript', '// removable, so the run does something'),
    ));
    prune(bundle);
    assert.ok(has(bundle, `${NM}/left-pad`),
      `a package referenced with ${label} must be seen as reachable`);
  }
});

test('the scanner reads all four forms, and says so where it is written', () => {
  // The regex is the whole safety of this tool: whatever it cannot see, it calls
  // dead. Pinned by name so a future edit that drops one is a failing test rather
  // than a crash-looping release.
  // Matched as literal text, not as a pattern: what is in the file IS a regex,
  // so `module\\.link` there carries a backslash, and testing it as a pattern
  // asks the wrong question and passes for the wrong reason.
  const src = fs.readFileSync(PRUNE, 'utf8');
  const req = src.slice(src.indexOf('const REQ = new RegExp('),
    src.indexOf('].map(r => r.source)'));
  assert.ok(req.length > 100, 'could not find the scanner regex to check');
  for (const form of ['require', 'module\\.link', 'module\\.watch', 'module\\.dynamicImport']) {
    assert.ok(req.includes(form), `the scanner no longer looks for ${form}`);
  }
});

test('--dry-run removes nothing but reports what it would', dir => {
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': '// nothing' },
    pkg('typescript'),
  ));
  const out = prune(bundle, ['--dry-run']);
  assert.ok(has(bundle, `${NM}/typescript`), 'nothing is deleted');
  assert.ok(/would remove 1 package/.test(out), `and it says what it would do. Got: ${out}`);
});

test('it clears .bin symlinks left dangling by a removal', dir => {
  const bundle = makeBundle(dir, Object.assign(
    { 'programs/server/app/app.js': '// nothing' },
    pkg('typescript'),
  ));
  const bin = path.join(bundle, NM, '.bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.symlinkSync('../typescript/bin/tsc', path.join(bin, 'tsc'));
  fs.writeFileSync(path.join(bin, 'keep'), '#!/bin/sh\n');
  prune(bundle);
  assert.ok(!fs.existsSync(path.join(bin, 'tsc')) && !fs.lstatSync(path.join(bin, 'tsc'), { throwIfNoEntry: false }),
    'a symlink into a removed package must go with it');
  assert.ok(fs.existsSync(path.join(bin, 'keep')), 'and a real file beside it must stay');
});

test('it refuses a directory that is not a Meteor bundle (negative)', dir => {
  const notABundle = path.join(dir, 'nope');
  fs.mkdirSync(notABundle);
  assert.throws(() => prune(notABundle), /Command failed/,
    'a wrong path must fail loudly, not delete something unexpected');
});

test('every policy entry states WHY, because the why is what gets re-checked', () => {
  const src = fs.readFileSync(PRUNE, 'utf8');
  const policy = src.slice(src.indexOf('const POLICY = ['), src.indexOf('function hasJs'));
  const whys = policy.match(/why:/g) || [];
  const tests = policy.match(/test:/g) || [];
  assert.strictEqual(whys.length, tests.length,
    'each policy entry needs a why beside its test - an entry nobody can re-check is one '
    + 'nobody can safely extend');
  // Three, not four: openpgp + nodemailer-openpgp was removed when v10.97 proved
  // its reason false. An entry is only as good as the sentence beside it, and
  // that sentence said "nothing requires it" about something packages/email.js
  // links on its first tick.
  assert.ok(whys.length >= 3, `expected the proven categories, found ${whys.length}`);
  assert.ok(!/openpgp/.test(policy.replace(/^\s*\/\/.*$/gm, '')),
    'openpgp must not come back into the policy without a reason that survives a boot');
});

console.log(`\npruneUnreachableNpm: ${passed} tests passed`);
