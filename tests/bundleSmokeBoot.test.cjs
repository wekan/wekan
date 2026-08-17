'use strict';

// Guard: a bundle that cannot start must not be shippable.
// Run: node tests/bundleSmokeBoot.test.cjs
//
// TWO RELEASES SHIPPED A BUNDLE THAT DID NOT BOOT, and both times the reasoning
// was the same shape - "nothing at runtime needs that, I read the code":
//
//   v10.96  Error: ENOENT ... programs/server/packages/ecmascript.js.map
//           at programs/server/boot.js:101:29
//           boot.js reads every source map NAMED in program.json, at boot. The
//           files were removed and the names were not.
//
//   v10.97  Error: Cannot find module ".../nodemailer-openpgp/lib/nodemailer-openpgp.js"
//           at packages/email.js:347
//           Meteor compiles an ESM import to module.link('nodemailer-openpgp',...).
//           A reachability scan that only understood require() called it dead.
//
// Reading the code is how both mistakes were made, so reading the code is not the
// check. releases/bundle-smoke-boot.sh starts the bundle with a database address
// that cannot answer and requires it to get as far as trying to reach it - which
// proves the whole server image loaded, because the database is the first thing
// WeKan needs that the check does not provide.
//
// These tests are about the script's JUDGEMENT, since that is what makes it worth
// having: it must fail on both shapes above, and it must never call a bundle that
// merely went quiet a pass.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SMOKE = path.join(ROOT, 'releases', 'bundle-smoke-boot.sh');
const script = fs.readFileSync(SMOKE, 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A fake bundle whose main.js prints whatever the case needs and exits, so the
// script's decision can be tested without a real Meteor server.
function fakeBundle(dir, mainJs) {
  const bundle = path.join(dir, 'bundle');
  fs.mkdirSync(bundle, { recursive: true });
  fs.writeFileSync(path.join(bundle, 'main.js'), mainJs);
  return bundle;
}

function runSmoke(bundle, env = {}) {
  // The all-suite runner may itself be invoked with an explicit Node path while
  // PATH contains no `node`. The smoke script accepts the exact binary for this
  // reason; use it so this judgement tests the bundle, not the caller's PATH.
  return spawnSync('bash', [SMOKE, bundle, process.execPath], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { WEKAN_SMOKE_TIMEOUT: '10' }, env),
  });
}

function withDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-smoke-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('reaching the database connection is a PASS', () => withDir(dir => {
  const bundle = fakeBundle(dir, `
    console.error('MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:1');
    process.exit(1);
  `);
  const r = runSmoke(bundle);
  assert.strictEqual(r.status, 0, `expected a pass, got ${r.status}\n${r.stdout}${r.stderr}`);
  assert.ok(/smoke: OK/.test(r.stdout), 'and it says so');
}));

test('v10.97: a module it links at startup is missing -> FAIL', () => withDir(dir => {
  const bundle = fakeBundle(dir, `
    console.error('Error: Cannot find module "/node_modules/meteor/email/node_modules/nodemailer-openpgp/lib/nodemailer-openpgp.js".');
    process.exit(1);
  `);
  const r = runSmoke(bundle);
  assert.notStrictEqual(r.status, 0, 'a bundle missing a linked module must not pass');
  assert.ok(/missing a module it links at startup/.test(r.stdout + r.stderr),
    'and the message must name what kind of fault it is');
  assert.ok(/module\.link\(\)/.test(r.stdout + r.stderr),
    'and point at the cause: a reachability graph that only reads require()');
}));

test('v10.96: a file it opens at startup is missing -> FAIL', () => withDir(dir => {
  const bundle = fakeBundle(dir, `
    console.error("Error: ENOENT: no such file or directory, open '/build/programs/server/packages/ecmascript.js.map'");
    process.exit(1);
  `);
  const r = runSmoke(bundle);
  assert.notStrictEqual(r.status, 0, 'a bundle missing a file boot.js opens must not pass');
  assert.ok(/missing a file it opens at startup/.test(r.stdout + r.stderr));
  assert.ok(/program\.json/.test(r.stdout + r.stderr),
    'and name the manifest that has to lose the name with the file');
}));

test('a bundle that exits quietly is NOT a pass (negative)', () => withDir(dir => {
  // The failure mode of a smoke test is passing when it learned nothing. An exit
  // with no database attempt and no error proves nothing about whether the server
  // loads, so it must be reported rather than waved through.
  const bundle = fakeBundle(dir, 'process.exit(0);');
  const r = runSmoke(bundle);
  assert.notStrictEqual(r.status, 0, 'silence is not success');
  assert.ok(/without reaching its database/.test(r.stdout + r.stderr));
}));

test('a bundle that hangs is NOT a pass either (negative)', () => withDir(dir => {
  const bundle = fakeBundle(dir, 'setInterval(() => {}, 1000);');
  const r = runSmoke(bundle, { WEKAN_SMOKE_TIMEOUT: '3' });
  assert.notStrictEqual(r.status, 0, 'a hang must not pass');
  assert.ok(/neither failed nor reached its database/.test(r.stdout + r.stderr),
    'and must say that the check could not tell, rather than implying a verdict');
}));

test('a directory with no main.js is refused (negative)', () => withDir(dir => {
  const r = runSmoke(dir);
  assert.notStrictEqual(r.status, 0, 'pointing it at the wrong place must not pass');
  assert.ok(/is not a bundle/.test(r.stdout + r.stderr));
}));

test('it gives the database an address that refuses at once', () => {
  // A reachable-but-slow address would make every build wait out the timeout, and
  // an address that ANSWERS would make this a real run with a real database.
  assert.ok(/DEAD_DB="mongodb:\/\/127\.0\.0\.1:1\//.test(script),
    'port 1: nothing listens there and the connection is refused immediately');
});

test('the release build runs it, on the bundle every arch derives from', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');
  assert.ok(/bundle-smoke-boot\.sh/.test(wf), 'the workflow must run the smoke check');
  // After the trim and the prunes: it is those that can break the bundle, so
  // checking before them would prove the wrong thing.
  const smokeAt = wf.indexOf('bundle-smoke-boot.sh');
  for (const before of ['bundle-trim.mjs', 'prune-unreachable-npm.mjs']) {
    assert.ok(wf.indexOf(before) < smokeAt,
      `${before} must run BEFORE the smoke check, or the check proves nothing about it`);
  }
});

console.log(`\nbundleSmokeBoot: ${passed} tests passed`);
