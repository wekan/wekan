'use strict';

// Guard: releases/bundle-trim.mjs removes only what the target cannot run.
// Run: node tests/bundleTrim.test.cjs
//
// v10.93, v10.94 and v10.95 all failed to pack the Sandstorm .spk with
// "App exceeds uncompressed size limit of 1 GiB" - the bundle was 852M and the
// deps tree 336M, so 1188M against a 1024M ceiling. Two passengers account for
// most of the overrun and neither is reachable at runtime:
//
//   * uWebSockets.js ships 20 prebuilt binaries, every OS x CPU x Node ABI, and
//     loads exactly one: `uws_${process.platform}_${process.arch}_${process.versions.modules}.node`;
//   * 4766 source maps, 188 MiB, read only by an attached debugger.
//
// These tests build small synthetic bundles rather than a real one, so they run
// in milliseconds and pin the behaviour that matters: the RIGHT prebuild
// survives, an architecture with NO prebuild is left completely alone (deleting
// the others there would help nothing and could only break the fallback), and
// nothing outside those two categories is ever touched.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TRIM = path.join(ROOT, 'releases', 'bundle-trim.mjs');

let passed = 0;
function test(name, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-bundle-trim-'));
  try {
    fn(dir);
    passed += 1;
    console.log('  ok -', name);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// A minimal bundle: programs/server plus whatever files the caller names.
// `files` maps a bundle-relative path to its contents.
function makeBundle(dir, files) {
  const bundle = path.join(dir, 'bundle');
  fs.mkdirSync(path.join(bundle, 'programs', 'server'), { recursive: true });
  for (const [rel, body] of Object.entries(files || {})) {
    const p = path.join(bundle, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  return bundle;
}

function trim(bundle, args = []) {
  return execFileSync(process.execPath, [TRIM, bundle, ...args], { encoding: 'utf8' });
}

const exists = (bundle, rel) => fs.existsSync(path.join(bundle, rel));

// The uWebSockets.js directory as it really ships, cut down to three platforms.
const UWS = 'programs/server/npm/node_modules/meteor/ddp-server/node_modules/uWebSockets.js';
const PREBUILDS = [
  'uws_linux_x64_115.node', 'uws_linux_x64_127.node',
  'uws_linux_x64_137.node', 'uws_linux_x64_141.node',
  'uws_linux_arm64_137.node', 'uws_darwin_arm64_137.node',
  'uws_win32_x64_137.node',
];

function uwsBundle(dir, extra = {}) {
  const files = { [`${UWS}/uws.js`]: 'module.exports = require("./uws_" + 1 + ".node");' };
  for (const f of PREBUILDS) files[`${UWS}/${f}`] = 'x'.repeat(1024);
  return makeBundle(dir, Object.assign(files, extra));
}

test('it keeps every ABI of the target platform+arch and drops the rest', dir => {
  const bundle = uwsBundle(dir);
  trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  for (const f of PREBUILDS.filter(f => f.startsWith('uws_linux_x64_'))) {
    assert.ok(exists(bundle, `${UWS}/${f}`),
      `${f} must survive - a Node major bump has to still find its binary`);
  }
  for (const f of ['uws_linux_arm64_137.node', 'uws_darwin_arm64_137.node', 'uws_win32_x64_137.node']) {
    assert.ok(!exists(bundle, `${UWS}/${f}`),
      `${f} can never be opened on linux/x64 and must go`);
  }
});

test('uws.js itself is never removed (negative)', dir => {
  const bundle = uwsBundle(dir);
  trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  assert.ok(exists(bundle, `${UWS}/uws.js`), 'the loader is the module; only prebuilds are dropped');
});

test('an arch with NO prebuild is left completely alone (negative)', dir => {
  // ppc64le, s390x and riscv64 have no uWebSockets.js prebuild at all, and
  // ddp-server falls back to sockjs there. Removing the other platforms' files
  // would free nothing that matters and could only break the fallback.
  const bundle = uwsBundle(dir);
  const out = trim(bundle, ['--platform', 'linux', '--arch', 'ppc64']);
  for (const f of PREBUILDS) {
    assert.ok(exists(bundle, `${UWS}/${f}`), `${f} must survive when the target has no prebuild`);
  }
  assert.ok(/no uws_linux_ppc64_\* prebuild; left untouched/.test(out),
    'and it says so, rather than silently doing nothing');
});

test('source maps go, and only source maps', dir => {
  const bundle = makeBundle(dir, {
    'programs/server/app/app.js': 'code',
    'programs/server/app/app.js.map': 'x'.repeat(4096),
    'programs/web.browser/head.html': '<head>',
    'programs/web.browser/app.js.map': 'x'.repeat(4096),
    'programs/server/config.json': '{}',
    'programs/server/boot.js': 'boot',
    // A directory that merely ENDS in .map is not a source map.
    'programs/server/assets/road.map/tile.png': 'png',
  });
  trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  assert.ok(!exists(bundle, 'programs/server/app/app.js.map'), 'server map dropped');
  assert.ok(!exists(bundle, 'programs/web.browser/app.js.map'), 'client map dropped');
  for (const keep of ['programs/server/app/app.js', 'programs/web.browser/head.html',
    'programs/server/config.json', 'programs/server/boot.js',
    'programs/server/assets/road.map/tile.png']) {
    assert.ok(exists(bundle, keep), `${keep} must survive - it is not a source map`);
  }
});

test('--keep-maps keeps them, for a build that wants a debuggable bundle', dir => {
  const bundle = makeBundle(dir, { 'programs/server/app/app.js.map': 'x'.repeat(4096) });
  const out = trim(bundle, ['--platform', 'linux', '--arch', 'x64', '--keep-maps']);
  assert.ok(exists(bundle, 'programs/server/app/app.js.map'), 'the map is still there');
  assert.ok(/kept source maps/.test(out), 'and the summary says so');
});

test('it refuses a directory that is not a Meteor bundle (negative)', dir => {
  const notABundle = path.join(dir, 'nope');
  fs.mkdirSync(notABundle);
  assert.throws(() => trim(notABundle), /Command failed/,
    'a wrong path must fail loudly, not delete files somewhere unexpected');
});

test('it reports how much it freed, so a build log answers "did it help"', dir => {
  const bundle = uwsBundle(dir, { 'programs/server/app/app.js.map': 'x'.repeat(2048) });
  const out = trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  assert.ok(/removed \d+ files, \d+ MiB/.test(out), `expected a size line, got: ${out}`);
  assert.ok(/dropped 1 source maps/.test(out), 'and the map count');
});

test('the Sandstorm leg runs it before its retry pack, for linux/x64', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');
  const start = wf.indexOf('\n  build-sandstorm:\n');
  assert.notStrictEqual(start, -1, 'release-all.yml has no build-sandstorm job');
  const rest = wf.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  const job = next === -1 ? rest : rest.slice(0, next);
  assert.ok(/node releases\/bundle-trim\.mjs .meteor-spk\/bundle --platform linux --arch x64/.test(job),
    'build-sandstorm must trim the bundle for linux/x64 - a grain is never anything else');
  assert.ok(job.indexOf('bundle-trim.mjs') < job.lastIndexOf('meteor-spk pack'),
    'and it must run BEFORE the retry pack, or it trims nothing that gets packed');
});

console.log(`\nbundleTrim: ${passed} tests passed`);
