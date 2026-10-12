'use strict';

// Guard: every bundle gets the MongoDB Database Tools as ONE program,
// mongo-tools, with a launcher per tool - and never another CPU's tools.
// Run: node tests/fetchMongoTools.test.cjs
//
// wekan/mongo-tools-patches publishes mongo-tools-<platform>: all eight tools
// in one Go program of about 15 MB, instead of eight programs of about 105 MB
// that each carried their own Go runtime and MongoDB driver.
// releases/fetch-mongo-tools.sh puts it in a bundle with eight small
// launchers, so `mongodump` keeps working wherever it did. It is the ONLY
// shape: the eight separate <tool>-<platform> binaries are never fetched, even
// from a release that still has them, and nothing else in the tree builds one
// of their download addresses.
//
// The downloads here are served by a local HTTP server standing in for the
// GitHub release (MONGO_TOOLS_BASE), so 404s and checksums are exercised for
// real, through releases/fetch.sh.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'releases/fetch-mongo-tools.sh');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = (text) => text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const TOOLS = ['bsondump', 'mongodump', 'mongoexport', 'mongofiles', 'mongoimport',
  'mongorestore', 'mongostat', 'mongotop'];
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'fetch-mongo-tools-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

// The fake mongo-tools prints the arguments it was given, the way the real one
// dispatches on its first argument.
const FAKE = '#!/bin/sh\necho "mongo-tools $*"\n';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let assets = {};
let requested = [];
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.slice(1));
  requested.push(name);
  if (Object.prototype.hasOwnProperty.call(assets, name)) {
    res.writeHead(200); res.end(assets[name]);
  } else {
    res.writeHead(404); res.end();
  }
});

function run(args) {
  return new Promise((resolve) => {
    const child = spawn('bash', [SCRIPT, ...args], {
      env: { ...process.env, MONGO_TOOLS_BASE: `http://127.0.0.1:${server.address().port}`,
        FETCH_SLEEPS: '0', FETCH_ATTEMPTS: '1' },
    });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (status) => resolve({ status, out }));
  });
}

function bundle(name) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir);
  return dir;
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('the one program is installed with a working launcher per tool', async () => {
  assets = { 'mongo-tools-amd64': FAKE, 'mongo-tools-amd64.sha256sum': `${sha(FAKE)}  mongo-tools-amd64\n` };
  const dir = bundle('one');
  const r = await run([dir, 'amd64']);
  assert.strictEqual(r.status, 0, r.out);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'mongo-tools'), 'utf8'), FAKE);
  for (const t of TOOLS) {
    const launcher = path.join(dir, t);
    assert.ok(fs.statSync(launcher).mode & 0o111, `${t} is executable`);
    assert.ok(!fs.lstatSync(launcher).isSymbolicLink(), `${t} is a file, not a symlink zip would copy`);
    assert.ok(fs.statSync(launcher).size < 1000, `${t} is a launcher, not another copy of the program`);
    const out = spawnSync(launcher, ['--archive=x', 'a b'], { encoding: 'utf8' }).stdout.trim();
    assert.strictEqual(out, `mongo-tools ${t} --archive=x a b`, `${t} runs mongo-tools ${t} with its arguments`);
  }
});

test('a launcher reached through a symlink elsewhere still finds mongo-tools', async () => {
  const dir = path.join(tmp, 'one');
  const elsewhere = bundle('bin-elsewhere');
  fs.symlinkSync(path.join(dir, 'mongodump'), path.join(elsewhere, 'mongodump'));
  const out = spawnSync(path.join(elsewhere, 'mongodump'), ['--help'], { encoding: 'utf8' });
  assert.strictEqual(out.stdout.trim(), 'mongo-tools mongodump --help', out.stderr);
});

test('Windows gets mongo-tools.exe and a .cmd per tool', async () => {
  assets = { 'mongo-tools-win64.exe': 'MZ fake' };
  const dir = bundle('win');
  const r = await run([dir, 'win64']);
  assert.strictEqual(r.status, 0, r.out);
  assert.ok(fs.existsSync(path.join(dir, 'mongo-tools.exe')));
  for (const t of TOOLS) {
    assert.strictEqual(fs.readFileSync(path.join(dir, `${t}.cmd`), 'utf8'),
      `@"%~dp0mongo-tools.exe" ${t} %*\r\n`, `${t}.cmd runs mongo-tools.exe ${t} from its own folder`);
    assert.ok(!fs.existsSync(path.join(dir, `${t}.exe`)), `no separate ${t}.exe`);
  }
  assert.match(r.out, /no checksum for mongo-tools-win64\.exe/, 'an unverified download is said so');
});

test('a release with only the per-tool binaries gives no tools, and none is even requested (negative)', async () => {
  assets = {};
  for (const t of TOOLS) assets[`${t}-s390x`] = `#!/bin/sh\necho ${t}\n`;
  requested = [];
  const dir = bundle('no-fallback');
  const r = await run([dir, 's390x']);
  assert.strictEqual(r.status, 1, r.out);
  assert.match(r.out, /publishes no mongo-tools-s390x/);
  assert.deepStrictEqual(fs.readdirSync(dir), [], 'no per-tool binary is installed');
  assert.deepStrictEqual(requested.filter((n) => !n.startsWith('mongo-tools-')), [],
    'only mongo-tools-<platform> is ever downloaded');
});

test('no script or workflow builds a per-tool mongo-tools-patches download (negative)', () => {
  // A per-tool asset address is a tool name, or a loop variable over the tool
  // names, followed by -<platform variable>.
  const perTool = new RegExp('(?:' + TOOLS.join('|') + '|\\$\\{?t\\}?)-\\$\\{?(?:platform|PLATFORM|ferretdb_arch|FERRETDB_ARCH|arch|ARCH|a)\\b');
  const files = spawnSync('git', ['ls-files', 'releases', '.github', 'snap-src', 'sandstorm-src', 'tools',
    'Dockerfile', 'snapcraft.yaml', 'snapcraft-core26.yaml', 'build.sh', 'build.bat'], { cwd: ROOT, encoding: 'utf8' })
    .stdout.split('\n').filter(Boolean);
  assert.ok(files.length > 50, `only ${files.length} files listed`);
  const offenders = files.filter((rel) => fs.existsSync(path.join(ROOT, rel)) && perTool.test(code(read(rel))));
  assert.deepStrictEqual(offenders, [], 'these still fetch a per-tool binary instead of mongo-tools-<platform>');
  assert.ok(perTool.test('fetch_cached "$MT/$t-${PLATFORM}${EXE}"') && perTool.test('have "${mt}/${t}-${ferretdb_arch}"')
    && perTool.test('$BASE/mongodump-$platform'), 'the pattern catches the shapes that were removed');
  assert.ok(!perTool.test('"$BASE/mongo-tools-$platform$exe"'), 'and not the one program');
});

// Negative: what must never ship.
test('an inherited amd64 tool set is removed when the platform has none', async () => {
  assets = {};
  const dir = bundle('inherited');
  fs.writeFileSync(path.join(dir, 'mongo-tools'), 'amd64');
  for (const t of TOOLS) fs.writeFileSync(path.join(dir, t), 'amd64');
  fs.writeFileSync(path.join(dir, 'main.js'), 'kept');
  const r = await run([dir, 'riscv64']);
  assert.strictEqual(r.status, 1, r.out);
  assert.deepStrictEqual(fs.readdirSync(dir), ['main.js'], 'nothing of another CPU is left behind');
});

test('a download that does not match its published SHA256 is refused and removed', async () => {
  assets = { 'mongo-tools-arm64': FAKE, 'mongo-tools-arm64.sha256sum': `${sha('other')}  mongo-tools-arm64\n` };
  const dir = bundle('badsum');
  const r = await run([dir, 'arm64']);
  assert.strictEqual(r.status, 2, r.out);
  assert.match(r.out, /does not match its published SHA256/);
  assert.deepStrictEqual(fs.readdirSync(dir), []);
});

test('every release path uses it, and no per-tool download loop is left anywhere', async () => {
  const wf = code(read('.github/workflows/release-all.yml'));
  const calls = wf.match(/fetch-mongo-tools\.sh" [^\n]+/g) || [];
  // amd64, arm64, win64, win-arm64, win32, mac-arm64, mac-x64, the extra arches.
  assert.strictEqual(calls.length, 8, calls.join('\n'));
  assert.match(code(read('releases/repack-bundle-for-arch.sh')), /fetch-mongo-tools\.sh" bundle "\$\{FERRETDB_ARCH\}"/);
  const re = /mongo-tools-patches\/releases\/latest\/download/;
  for (const rel of ['.github/workflows/release-all.yml', '.github/workflows/release-all-missing.yml',
    'releases/repack-bundle-for-arch.sh', 'snapcraft.yaml', 'snapcraft-core26.yaml', 'Dockerfile']) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    assert.ok(!re.test(code(read(rel))), `${rel} downloads the tools itself instead of through fetch-mongo-tools.sh`);
  }
  for (const yaml of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    assert.match(read(yaml), /for t in mongo-tools bsondump mongodump/, `${yaml} moves mongo-tools into bin/ with its launchers`);
  }
  assert.match(read('releases/check-telemetry.py'), /'mongo-tools'\}/, 'the telemetry audit scans mongo-tools as a tool');
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  console.log('fetchMongoTools:');
  let passed = 0;
  try {
    for (const [name, fn] of tests) {
      await fn();
      passed += 1;
      console.log('  ok -', name);
    }
  } finally {
    server.close();
  }
  console.log(`\nfetchMongoTools: ${passed} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
