'use strict';

// releases/fetch.sh, and the rule that a release download goes through it.
// Run: node tests/releaseDownloads.test.cjs
//
// github.com spent the afternoon of 2026-08-12 returning 503, and it cost two
// release runs an hour apart. The second one, in build-amd64:
//
//   curl: (22) The requested URL returned error: 503
//   Warning: Problem : HTTP error. Will retry in 10 seconds. 5 retries left.
//   ...
//   curl: (56) Connection died, tried 5 times before giving up
//
// `--retry 5 --retry-delay 10` is fifty seconds of patience. Every Linux bundle
// is repacked from the amd64 one, so those fifty seconds skipped eleven
// architectures, the Docker images and the snap.
//
// The half that is not about patience: 503 is not 404. Several callers here ask
// "is this binary published for this CPU?" and legitimately get "no" - the
// preflight that skips an architecture with no Node.js build yet, the tolerant
// MongoDB-tools loops. Retrying that for a quarter of an hour would be wrong,
// and - worse - reading a 503 AS "no" silently drops an architecture that is
// sitting right there on the release. So an existence check has three answers.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const fetchSh = path.join(repoRoot, 'releases/fetch.sh');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const workflow = read('.github/workflows/release-all.yml');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// One server for the lot: /flaky 503s twice then serves, /missing is a 404,
// /ok always works. It runs in ANOTHER PROCESS on purpose - the tests call
// fetch.sh with spawnSync, which blocks this one's event loop, so an
// in-process server could not answer the request it was spawned to serve.
const serverSrc = `
const http = require('http');
let flakyLeft = 2;
http.createServer((req, res) => {
  if (req.url === '/flaky') {
    if (flakyLeft-- > 0) { res.writeHead(503); return res.end('down'); }
    res.writeHead(200); return res.end('BINARY');
  }
  if (req.url === '/missing') { res.writeHead(404); return res.end('no'); }
  if (req.url === '/rate') { res.writeHead(429); return res.end('slow down'); }
  res.writeHead(200); res.end('ok');
}).listen(process.env.PORT, '127.0.0.1', () => console.log('listening'));
`;

const port = 18000 + (process.pid % 4000);
const base = `http://127.0.0.1:${port}`;
const serverFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fetchsrv-')), 'server.cjs');
fs.writeFileSync(serverFile, serverSrc);
const server = spawn(process.execPath, [serverFile], {
  env: Object.assign({}, process.env, { PORT: String(port) }),
  stdio: ['ignore', 'pipe', 'inherit'],
});
// Wait for it, without sleeping blind: curl until it answers.
let up = false;
for (let i = 0; i < 100 && !up; i++) {
  up = spawnSync('curl', ['-s', '-o', '/dev/null', `${base}/ok`]).status === 0;
  if (!up) spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},100)']);
}
if (!up) { server.kill(); throw new Error('the test server did not come up'); }

function run(args, env) {
  return spawnSync('bash', [fetchSh].concat(args), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { FETCH_SLEEPS: '0' }, env || {}),
  });
}

test('a 503 is waited out, and the file arrives', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-'));
  const out = path.join(dir, 'ferretdb');
  const r = run(['-o', out, `${base}/flaky`]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(out, 'utf8'), 'BINARY');
  assert.ok(/::warning::/.test(r.stderr), 'and the log says why the job paused');
});

test('a 404 fails at once - it is an answer, not an outage (negative)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-'));
  const out = path.join(dir, 'nope');
  const r = run(['-o', out, `${base}/missing`], { FETCH_SLEEPS: '30' });
  assert.strictEqual(r.status, 22);
  assert.ok(!fs.existsSync(out), 'and no half-file is left for tar to choke on');
  assert.ok(/is not published/.test(r.stderr), 'the error says which it is');
  assert.ok(!/::warning::/.test(r.stderr), 'nothing was retried');
});

test('an optional file that is absent is quiet about it (negative)', () => {
  // The .sha256sum a source may or may not publish. `no checksum published` is
  // a row in the CHANGELOG's binaries table, not a failed release.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-'));
  const r = run(['--optional', '-o', path.join(dir, 'sums'), `${base}/missing`]);
  assert.strictEqual(r.status, 1);
  assert.strictEqual(r.stderr.trim(), '', 'no ::error:: for a working release');
});

test('an existence check has THREE answers, not two', () => {
  assert.strictEqual(run(['--check', `${base}/ok`]).status, 0, 'present');
  assert.strictEqual(run(['--check', `${base}/missing`]).status, 1, 'absent');
  const unreachable = run(['--check', 'http://127.0.0.1:1/x'],
    { FETCH_ATTEMPTS: '2', FETCH_CONNECT_TIMEOUT: '1' });
  assert.strictEqual(unreachable.status, 2,
    'and "the server would not say", which is neither of the other two');
});

test('429 counts as the far end asking to wait', () => {
  const r = run(['--check', `${base}/rate`], { FETCH_ATTEMPTS: '2' });
  assert.strictEqual(r.status, 2, 'not treated as absent');
});

test('it can write to stdout, for the lookups that pipe', () => {
  const r = run(['-o', '-', `${base}/ok`]);
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, 'ok');
});

test('every release download goes through it', () => {
  // One unretried download is all it took, twice in one afternoon.
  const bare = [];
  for (const file of ['.github/workflows/release-all.yml',
    '.github/workflows/release-all-missing.yml',
    'releases/embed-verified-node.sh', 'releases/require-binaries.sh',
    'releases/check-arch-binaries.sh', 'releases/install-node-for-arch.sh',
    'releases/resolve-node-source.sh']) {
    read(file).split('\n').forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      if (!/\bcurl\b/.test(line)) return;
      // Not downloads: apt package lists; a POST that publishes something; the
      // registry API calls that read an HTTP code out of `-w '%{http_code}'`
      // and act on it themselves; and prose that happens to name curl.
      if (/apt-get|apt-install\.sh|%\{http_code\}|-X POST|install\.sandstorm|githubcli/.test(line)) return;
      // Registry API calls that ask for a token and read the answer: they are
      // not downloads of a file, and their failure is handled where they are.
      if (/token_url|\/token\?service=|v2\/auth\?service=/.test(line)) return;
      if (/^\s*(#|echo )/.test(line.trim()) || /::(error|warning)::/.test(line)) return;
      bare.push(`${file}:${i + 1}: ${line.trim().slice(0, 70)}`);
    });
  }
  assert.deepStrictEqual(bare, [],
    'these downloads can lose a release to a five-minute outage');
});

test('the tolerant callers ask for --optional, the required ones do not', () => {
  // `if fetch ferretdb.exe; then embed else "no FerretDB for this CPU"` is a
  // legitimate no. Marking it optional is what keeps a real absence from
  // printing ::error:: - and what keeps a required binary from being silently
  // skipped, because those must NOT be optional.
  const lines = workflow.split('\n');
  lines.forEach((line, i) => {
    const handled = /^\s*(\|\| )?if bash .*fetch\.sh/.test(line)
      || /\|\| \{/.test(lines[i + 1] || '');
    if (!/fetch\.sh"? (--optional )?-o/.test(line)) return;
    if (handled) {
      assert.ok(/--optional/.test(line),
        `line ${i + 1} handles its own failure, so a 404 must be quiet: ${line.trim().slice(0, 60)}`);
    }
  });
  // And the two that must never be optional: the bundle's own Node.js and
  // FerretDB on the amd64 base every other Linux bundle is repacked from.
  const required = lines.filter(l => /fetch\.sh" -o \.build\/bundle\//.test(l));
  assert.ok(required.length >= 1, 'the amd64 bundle downloads are required');
  assert.ok(!required.some(l => /--optional/.test(l)),
    'a missing FerretDB in the base bundle must stop the release, not be skipped');
});

test('the preflight no longer reads an outage as a missing binary', () => {
  const preflight = read('releases/check-arch-binaries.sh');
  assert.ok(/--check/.test(preflight), 'it asks fetch.sh');
  assert.ok(/outage, not a missing binary/.test(preflight),
    'and says so when nobody could tell, instead of skipping the architecture');
  const require_ = read('releases/require-binaries.sh');
  assert.ok(/UNKNOWN/.test(require_),
    'require-binaries has the same third answer: not published != not answered');
});

test('the Dockerfile carries fetch.sh next to the script that needs it', () => {
  // resolve-node-source.sh is COPYed into the image on its own; it now calls
  // fetch.sh, and a missing helper there is a build that dies on its first
  // lookup with "No such file or directory".
  const dockerfile = read('Dockerfile');
  if (!/resolve-node-source\.sh/.test(dockerfile)) return;
  assert.ok(/COPY[^\n]*releases\/fetch\.sh/.test(dockerfile),
    'the Dockerfile must copy releases/fetch.sh too');
  assert.ok(!/^wget "https:\/\/nodejs\.org/m.test(dockerfile),
    'and its wgets carry --retry-on-http-error, or a 503 is fatal again');
});

console.log('releaseDownloads:');
try {
  for (const [name, fn] of tests) { fn(); passed += 1; console.log('  ok -', name); }
} finally {
  server.kill();
}
console.log(`\nreleaseDownloads: ${passed} tests passed`);
