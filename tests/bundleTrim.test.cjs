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
const { execFileSync, spawnSync } = require('child_process');

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

test('dropping maps also un-names them in programs/server/program.json', dir => {
  // THE BUG THIS EXISTS FOR. boot.js reads every map named in program.json at
  // boot, unconditionally:
  //
  //   serverJson.load.forEach(function (fileInfo) {
  //     if (fileInfo.sourceMap) {
  //       var rawSourceMap = fs.readFileSync(path.resolve(serverDir, fileInfo.sourceMap), ...)
  //
  // so deleting the files without deleting the names is ENOENT before the server
  // opens its port - a crash-loop, which is what a released image did:
  //
  //   Error: ENOENT: no such file or directory,
  //     open '/build/programs/server/packages/ecmascript.js.map'
  //     at /build/programs/server/boot.js:101:29
  //
  // 63 of the 102 load entries name a map. "Nothing reads a .map at runtime" was
  // true of the client and false of the server, and this list is the difference.
  const bundle = makeBundle(dir, {
    'programs/server/app/app.js': 'code',
    'programs/server/app/app.js.map': 'x'.repeat(2048),
    'programs/server/packages/ecmascript.js': 'code',
    'programs/server/packages/ecmascript.js.map': 'x'.repeat(2048),
    'programs/server/program.json': JSON.stringify({
      format: 'javascript-image-pre1',
      load: [
        { path: 'app/app.js', sourceMap: 'app/app.js.map', sourceMapRoot: '.' },
        { path: 'packages/ecmascript.js', sourceMap: 'packages/ecmascript.js.map' },
        { path: 'packages/global-imports.js' },
      ],
    }, null, 2),
  });
  trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  const program = JSON.parse(fs.readFileSync(path.join(bundle, 'programs/server/program.json'), 'utf8'));
  for (const entry of program.load) {
    assert.ok(!('sourceMap' in entry),
      `${entry.path} still names a sourceMap whose file was deleted - boot.js ENOENTs on it`);
    assert.ok(!('sourceMapRoot' in entry), `${entry.path} still has a sourceMapRoot`);
  }
  assert.strictEqual(program.load.length, 3, 'and the load list itself is untouched');
  assert.strictEqual(program.load[0].path, 'app/app.js', 'including the order and the paths');
});

test('THE INVARIANT: every map the manifest names exists on disk', dir => {
  // Whatever the trim does, this must hold afterwards, because it is exactly what
  // boot.js requires. Checked for both settings of --keep-maps, so neither branch
  // can drift into the crash.
  for (const args of [['--platform', 'linux', '--arch', 'x64'], ['--keep-maps']]) {
    const sub = fs.mkdtempSync(path.join(dir, 'inv-'));
    const bundle = makeBundle(sub, {
      'programs/server/app/app.js': 'code',
      'programs/server/app/app.js.map': 'x'.repeat(1024),
      'programs/server/program.json': JSON.stringify({
        load: [{ path: 'app/app.js', sourceMap: 'app/app.js.map' }],
      }, null, 2),
    });
    trim(bundle, args);
    const program = JSON.parse(fs.readFileSync(path.join(bundle, 'programs/server/program.json'), 'utf8'));
    for (const entry of program.load) {
      if (!entry.sourceMap) continue;
      assert.ok(fs.existsSync(path.join(bundle, 'programs/server', entry.sourceMap)),
        `with ${args.join(' ')}: program.json names ${entry.sourceMap} and it is not there`);
    }
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

test('--transport sockjs removes uWebSockets.js entirely', dir => {
  // The uws transport is OPTIONAL. ddp-server resolves its transport from
  // Meteor.settings, then DDP_TRANSPORT, then DISABLE_SOCKJS, and defaults to
  // sockjs; `Npm.require('uWebSockets.js')` sits INSIDE the uws transport's
  // setup(), which runs only for the transport that was chosen. A sockjs server
  // never loads the module, so a sockjs bundle need not carry any of its 121 MB.
  const bundle = uwsBundle(dir);
  const out = trim(bundle, ['--transport', 'sockjs']);
  assert.ok(!fs.existsSync(path.join(bundle, UWS)),
    'the whole uWebSockets.js directory goes, loader included');
  assert.ok(/removed uWebSockets\.js entirely \(transport is sockjs\)/.test(out),
    `the summary must say what it did, got: ${out}`);
});

test('a bad --transport is refused rather than guessed at (negative)', dir => {
  const bundle = uwsBundle(dir);
  assert.throws(() => trim(bundle, ['--transport', 'websocket']),
    /Command failed/, 'an unknown transport must not silently fall through');
  assert.ok(fs.existsSync(path.join(bundle, UWS)), 'and must delete nothing');
});

test('without --transport the module stays (negative)', dir => {
  // The flag is what removes it. A caller that does not ask keeps the module,
  // trimmed to the prebuilds its own platform can open.
  const bundle = uwsBundle(dir);
  trim(bundle, ['--platform', 'linux', '--arch', 'x64']);
  assert.ok(fs.existsSync(path.join(bundle, `${UWS}/uws.js`)),
    'the module survives a platform-only trim');
  assert.ok(exists(bundle, `${UWS}/uws_linux_x64_137.node`),
    'and so does the prebuild this platform would load');
});

test('the grain PINS the transport the .spk was trimmed for', () => {
  // These two must agree or the grain fails to boot: the .spk is packed without
  // uWebSockets.js, so if the grain asked for uws it would require a module that
  // is not there. The pkgdef environ is the app's ENTIRE environment, so this is
  // the only place the value can come from.
  const pkgdef = fs.readFileSync(path.join(ROOT, 'sandstorm-pkgdef.capnp'), 'utf8');
  const m = /\(key\s*=\s*"DDP_TRANSPORT",\s*value\s*=\s*"([a-z]+)"\)/.exec(pkgdef);
  assert.ok(m, 'sandstorm-pkgdef.capnp must set DDP_TRANSPORT explicitly, not rely on a default');
  assert.strictEqual(m[1], 'sockjs',
    'the grain must ask for sockjs - the .spk ships no uWebSockets.js to serve uws with');

  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');
  const trimArgs = /bundle-trim\.mjs [^\n]*--transport (\w+)/.exec(wf);
  assert.ok(trimArgs, 'the Sandstorm leg must pass --transport to bundle-trim.mjs');
  assert.strictEqual(trimArgs[1], m[1],
    `the transport the bundle is trimmed for (${trimArgs[1]}) must be the one the grain ` +
    `asks for (${m[1]})`);
});

// ── The legacy client ───────────────────────────────────────────────────────
// Meteor builds a SECOND copy of the client for browsers without modern JS.
// 83 MiB, and Meteor supports running with architectures excluded: webapp's
// categorizeRequest() walks a preferred order and comments "If our preferred
// arch is not available, it's better to use another client arch that is
// available than to guarantee the site won't work". Removing the files is only
// half of it - the arch is NAMED in two manifests, and boot.js builds a
// dynamic-import root for every name it finds in config.json.

function legacyBundle(dir) {
  return makeBundle(dir, {
    'programs/web.browser.legacy/program.json': '{"format":"web-program-pre1"}',
    'programs/web.browser.legacy/app/app.js': 'x'.repeat(4096),
    'programs/web.browser.legacy/dynamic/meteor/x.js': 'x'.repeat(1024),
    'programs/web.browser/program.json': '{"format":"web-program-pre1"}',
    'programs/web.browser/app/app.js': 'modern',
    'programs/server/config.json': JSON.stringify(
      { meteorRelease: 'METEOR@3.5.1', clientArchs: ['web.browser', 'web.browser.legacy'] }, null, 2),
    'star.json': JSON.stringify(
      { programs: [{ arch: 'web.browser' }, { arch: 'web.browser.legacy' }, { arch: 'os' }] }, null, 2),
  });
}

test('--drop-legacy-client removes the directory AND deregisters the arch', dir => {
  const bundle = legacyBundle(dir);
  trim(bundle, ['--drop-legacy-client', '--keep-maps']);
  assert.ok(!fs.existsSync(path.join(bundle, 'programs/web.browser.legacy')),
    'the whole legacy client tree goes, dynamic/ included');
  const config = JSON.parse(fs.readFileSync(path.join(bundle, 'programs/server/config.json'), 'utf8'));
  assert.deepStrictEqual(config.clientArchs, ['web.browser'],
    'config.json must not name an arch whose directory is gone - boot.js builds a '
    + 'dynamicRoot for every name in this list');
  const star = JSON.parse(fs.readFileSync(path.join(bundle, 'star.json'), 'utf8'));
  assert.deepStrictEqual(star.programs.map(p => p.arch), ['web.browser', 'os'],
    'and neither must star.json');
});

test('the modern client is never touched (negative)', dir => {
  const bundle = legacyBundle(dir);
  trim(bundle, ['--drop-legacy-client', '--keep-maps']);
  assert.ok(exists(bundle, 'programs/web.browser/app/app.js'),
    'web.browser is what every browser is served now; removing it would end the app');
  assert.ok(exists(bundle, 'programs/web.browser/program.json'), 'and its manifest');
});

test('it rewrites read-only manifests instead of dying on them', dir => {
  // Meteor writes a bundle's files mode 444. A plain writeFileSync on one fails
  // with EACCES - and it would fail AFTER the deletions, leaving a bundle whose
  // files are gone but whose manifests still name the arch: the one state that
  // actually breaks a server. The mode is restored, so the bundle stays as
  // Meteor made it.
  const bundle = legacyBundle(dir);
  for (const f of ['programs/server/config.json', 'star.json']) {
    fs.chmodSync(path.join(bundle, f), 0o444);
  }
  trim(bundle, ['--drop-legacy-client', '--keep-maps']);
  for (const f of ['programs/server/config.json', 'star.json']) {
    const mode = fs.statSync(path.join(bundle, f)).mode & 0o777;
    assert.strictEqual(mode, 0o444, `${f} must be left read-only, as Meteor wrote it`);
  }
  const config = JSON.parse(fs.readFileSync(path.join(bundle, 'programs/server/config.json'), 'utf8'));
  assert.deepStrictEqual(config.clientArchs, ['web.browser'], 'and still rewritten');
});

test('without the flag the legacy client stays (negative)', dir => {
  const bundle = legacyBundle(dir);
  trim(bundle, ['--keep-maps']);
  assert.ok(exists(bundle, 'programs/web.browser.legacy/app/app.js'),
    'nothing is removed unless it was asked for');
  const config = JSON.parse(fs.readFileSync(path.join(bundle, 'programs/server/config.json'), 'utf8'));
  assert.deepStrictEqual(config.clientArchs, ['web.browser', 'web.browser.legacy'],
    'and the manifests are left exactly as they were');
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

// ---- prebuildify prebuilds (--trim-prebuilds) -------------------------------
//
// bcrypt and argon2 ship 21 native binaries between them and one is ever
// opened. node-gyp-build reads exactly one prebuilds/<platform>-<arch>
// directory, chosen with parseTuple/matchTuple, so what survives here has to be
// what that loader would have picked - including a multi-arch tuple name like
// "darwin-x64+arm64", which a naive equality check would delete.

const BCRYPT = 'programs/server/npm/node_modules/meteor/accounts-password/node_modules/bcrypt';
const TUPLES = {
  'win32-x64': ['bcrypt.node'],
  'win32-arm64': ['bcrypt.node'],
  'linux-x64': ['bcrypt.glibc.node', 'bcrypt.musl.node'],
  'linux-arm64': ['bcrypt.glibc.node', 'bcrypt.musl.node'],
  'darwin-x64+arm64': ['bcrypt.node'],
};

function prebuildBundle(dir, tuples = TUPLES) {
  const files = { [`${BCRYPT}/bcrypt.js`]: "require('node-gyp-build')(__dirname);" };
  for (const [tuple, names] of Object.entries(tuples)) {
    for (const name of names) files[`${BCRYPT}/prebuilds/${tuple}/${name}`] = 'x'.repeat(4096);
  }
  return makeBundle(dir, files);
}

test('it keeps the target tuple and drops the platforms that cannot open it', dir => {
  const bundle = prebuildBundle(dir);
  trim(bundle, ['--trim-prebuilds', '--platform', 'win32', '--arch', 'x64']);
  assert.ok(exists(bundle, `${BCRYPT}/prebuilds/win32-x64/bcrypt.node`),
    'the addon this bundle actually loads must survive');
  for (const gone of ['win32-arm64', 'linux-x64', 'linux-arm64', 'darwin-x64+arm64']) {
    assert.ok(!exists(bundle, `${BCRYPT}/prebuilds/${gone}`),
      `${gone} can never be opened on win32/x64 and must go`);
  }
  assert.ok(exists(bundle, `${BCRYPT}/bcrypt.js`), 'the package itself stays');
});

test('a multi-arch tuple name matches the way node-gyp-build matches it', dir => {
  const bundle = prebuildBundle(dir);
  trim(bundle, ['--trim-prebuilds', '--platform', 'darwin', '--arch', 'arm64']);
  assert.ok(exists(bundle, `${BCRYPT}/prebuilds/darwin-x64+arm64/bcrypt.node`),
    'matchTuple() splits the arch on "+", so darwin-x64+arm64 serves darwin/arm64');
  assert.ok(!exists(bundle, `${BCRYPT}/prebuilds/win32-x64`));
});

test('both libc flavours of the target survive', dir => {
  const bundle = prebuildBundle(dir);
  trim(bundle, ['--trim-prebuilds', '--platform', 'linux', '--arch', 'x64']);
  for (const name of ['bcrypt.glibc.node', 'bcrypt.musl.node']) {
    assert.ok(exists(bundle, `${BCRYPT}/prebuilds/linux-x64/${name}`),
      `${name} - glibc or musl is decided at runtime, not here`);
  }
  assert.ok(!exists(bundle, `${BCRYPT}/prebuilds/linux-arm64`));
});

// Negative: the same rule uWebSockets.js gets. No prebuild for this target
// means the package loads its addon another way (a build/Release from `npm
// rebuild`), and removing the rest could only be wrong.
test('a package with no prebuild for this target is left untouched (negative)', dir => {
  const bundle = prebuildBundle(dir);
  const out = trim(bundle, ['--trim-prebuilds', '--platform', 'sunos', '--arch', 'sparc']);
  for (const tuple of Object.keys(TUPLES)) {
    assert.ok(exists(bundle, `${BCRYPT}/prebuilds/${tuple}`),
      `${tuple} must survive when nothing matches the target`);
  }
  assert.match(out, /left untouched/, 'and it must say so rather than trimming silently');
});

// Negative: this is the guard that makes the whole option safe. The defaults
// are linux/x64, and a Windows or macOS bundle trimmed with those would lose
// the only addon it can load - the exact fault the single EXE was just fixed
// for. Forgetting the target must be an error, never a silent wrong answer.
test('it refuses to guess the target (negative)', dir => {
  const bundle = prebuildBundle(dir);
  const result = spawnSync(process.execPath, [TRIM, bundle, '--trim-prebuilds'],
    { encoding: 'utf8' });
  assert.strictEqual(result.status, 2, 'no --platform/--arch must be a refusal');
  assert.match(result.stderr, /needs an explicit --platform and --arch/);
  for (const tuple of Object.keys(TUPLES)) {
    assert.ok(exists(bundle, `${BCRYPT}/prebuilds/${tuple}`),
      'and nothing may be deleted before it refuses');
  }
  const half = spawnSync(process.execPath,
    [TRIM, bundle, '--trim-prebuilds', '--platform', 'win32'], { encoding: 'utf8' });
  assert.strictEqual(half.status, 2, '--platform alone is still a guess about --arch');
});

// Negative: off by default, so every existing caller keeps its behaviour.
test('without the flag no prebuild is touched (negative)', dir => {
  const bundle = prebuildBundle(dir);
  trim(bundle, ['--platform', 'win32', '--arch', 'x64']);
  for (const tuple of Object.keys(TUPLES)) {
    assert.ok(exists(bundle, `${BCRYPT}/prebuilds/${tuple}`),
      `${tuple} must survive without --trim-prebuilds`);
  }
});

// The base bundle is repacked into every other architecture, so trimming there
// would take the prebuilds away from targets that have not been built yet.
test('build-amd64 does not trim prebuilds, the per-platform jobs do', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');
  // Comment lines are dropped: build-amd64 explains at length why it does NOT
  // pass this flag, and a prose mention is not an invocation.
  const jobOf = name => {
    const start = wf.indexOf(`\n  ${name}:\n`);
    assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
    const rest = wf.slice(start + 1);
    const next = rest.search(/\n  [a-z0-9-]+:\n/);
    const body = next === -1 ? rest : rest.slice(0, next);
    return body.split('\n').filter(line => !/^\s*#/.test(line)).join('\n');
  };
  assert.ok(!/--trim-prebuilds/.test(jobOf('build-amd64')),
    'build-amd64 is repacked into every other bundle; trimming there breaks them');
  for (const [job, target] of [
    ['build-win64', '--platform win32 --arch x64'],
    ['build-win-arm64', '--platform win32 --arch arm64'],
    ['build-win32', '--platform win32 --arch ia32'],
    ['build-mac-arm64', '--platform darwin --arch arm64'],
    ['build-mac-x64', '--platform darwin --arch x64'],
    ['build-arm64', '--platform linux --arch arm64'],
  ]) {
    const body = jobOf(job);
    assert.ok(/--trim-prebuilds/.test(body), `${job} must trim its prebuilds`);
    assert.ok(body.includes(target), `${job} must trim for ${target}`);
  }
});

console.log(`\nbundleTrim: ${passed} tests passed`);
