'use strict';

// Guard: every WeKan platform runs the PREBUILT SQLite-only FerretDB.
// Run: node tests/ferretdbSqliteAsset.test.cjs
//
// wekan/FerretDB publishes two binaries per platform: ferretdb-sqlite-<arch>
// (the SQLite handler only - what every WeKan bundle, image, snap and .spk runs)
// and ferretdb-<arch> (every handler). releases/ferretdb-asset.sh is the one
// place that chooses between them: the newest release that has
// ferretdb-sqlite-<arch>, and the full ferretdb-<arch> of the newest release
// until one does, saying in the log which it took.
//
// What this pins:
//   * positive: the helper's choice, driven against a fake `curl` that serves
//     a fixture release list - newest release has it, an older one has it, none
//     has it, Windows .exe names, FERRETDB_VARIANT=full, a pinned tag, and a
//     download that is verified against its .sha256sum;
//   * negative: a checksum mismatch and a missing binary fail; no release
//     workflow builds FerretDB from source; no download site outside the helper
//     names a FerretDB release URL of its own;
//   * the guard: every FerretDB download site goes through the helper (or, in
//     the default docker-compose.yml, tries ferretdb-sqlite-<arch> first), and
//     the compose files for the other databases keep the full binary.
//
// Offline: the fake curl answers every request, so no network is used.

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const HELPER = path.join(ROOT, 'releases/ferretdb-asset.sh');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('ferretdbSqliteAsset:');

// ───────────────────────────────────────────── the fake GitHub

const tmpRoot = (() => {
  const base = path.join(ROOT, '.tools', 'tmp');
  try { fs.mkdirSync(base, { recursive: true }); return fs.mkdtempSync(path.join(base, 'ferretdb-asset-')); }
  catch (e) { return fs.mkdtempSync(path.join(os.tmpdir(), 'ferretdb-asset-')); }
})();
process.on('exit', () => { try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) { /* best effort */ } });

const FAKE_CURL = `#!/bin/bash
# Serves $FAKE_GITHUB/<url with every non-alphanumeric as _>; anything else 404s.
url=""; out=""; fmt=""; head=0; fail=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2; continue ;;
    -w) fmt="$2"; shift 2; continue ;;
    -H|--retry|--retry-delay|--connect-timeout|--max-time) shift 2; continue ;;
    -I|--head) head=1 ;;
    -*) case "$1" in -*f*) fail=1 ;; esac; case "$1" in -*I*) head=1 ;; esac ;;
    http*) url="$1" ;;
  esac
  shift
done
echo "$url" >> "$FAKE_GITHUB/requests.log"
file="$FAKE_GITHUB/$(printf '%s' "$url" | sed 's/[^A-Za-z0-9]/_/g')"
if [ -f "$file" ]; then
  if [ "$head" = 0 ]; then
    if [ -n "$out" ] && [ "$out" != /dev/null ]; then cat "$file" > "$out"; elif [ -z "$out" ]; then cat "$file"; fi
  fi
  [ -n "$fmt" ] && printf '200'
  exit 0
fi
[ -n "$fmt" ] && printf '404'
[ "$fail" = 1 ] && exit 22
exit 0
`;

const BASE = 'https://github.com/wekan/FerretDB/releases';
const API = 'https://api.github.com/repos/wekan/FerretDB/releases';
const key = url => url.replace(/[^A-Za-z0-9]/g, '_');
const sha = buf => require('crypto').createHash('sha256').update(buf).digest('hex');

// releases: [{ tag, assets: { name: content } }], newest first.
function github(releases, { checksums = true, badChecksum = false } = {}) {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'gh-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'curl'), FAKE_CURL, { mode: 0o755 });
  const put = (url, body) => fs.writeFileSync(path.join(dir, key(url)), body);
  if (releases.length) {
    put(`${API}/latest`, JSON.stringify({ tag_name: releases[0].tag }, null, 2));
  }
  put(`${API}?per_page=10`, JSON.stringify(releases.map(r => ({ tag_name: r.tag, draft: false })), null, 2));
  releases.forEach((r, i) => {
    for (const [name, body] of Object.entries(r.assets)) {
      put(`${BASE}/download/${r.tag}/${name}`, body);
      if (i === 0) put(`${BASE}/latest/download/${name}`, body);
      if (checksums) {
        const sum = badChecksum ? '0'.repeat(64) : sha(Buffer.from(body));
        put(`${BASE}/download/${r.tag}/${name}.sha256sum`, `${sum}  ${name}\n`);
      }
    }
  });
  return dir;
}

function run(dir, args, env = {}) {
  const res = childProcess.spawnSync('bash', [HELPER, ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${path.join(dir, 'bin')}${path.delimiter}${process.env.PATH}`,
      HOME: dir,
      TMPDIR: dir,
      FAKE_GITHUB: dir,
      FETCH_SLEEPS: '0',
      FETCH_ATTEMPTS: '1',
      FERRETDB_ASSET_CACHE: path.join(dir, 'cache'),
      FERRETDB_TAG_CACHE: path.join(dir, 'cache', 'latest-tag'),
      ...env,
    },
  });
  const meta = {};
  for (const line of res.stdout.split('\n')) {
    const m = /^(FERRET_[A-Z]+)=(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2];
  }
  return { ...res, meta };
}

const rel = (tag, ...names) => ({ tag, assets: Object.fromEntries(names.map(n => [n, `binary ${tag} ${n}`])) });

// ───────────────────────────────────────────── positive: the choice

test('the newest release has ferretdb-sqlite-<arch>: it is taken', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64')]);
  const r = run(gh, ['amd64']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-sqlite-amd64');
  assert.strictEqual(r.meta.FERRET_VARIANT, 'sqlite');
  assert.strictEqual(r.meta.FERRET_TAG, 'v1.99.0');
  assert.strictEqual(r.meta.FERRET_URL, `${BASE}/download/v1.99.0/ferretdb-sqlite-amd64`);
  assert.match(r.stderr, /ferretdb-sqlite-amd64 from wekan\/FerretDB v1\.99\.0 - the SQLite-only build/);
});

test('only an older release has it: the newest one that does is taken', () => {
  const gh = github([
    rel('v1.101.0', 'ferretdb-amd64'),
    rel('v1.100.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64'),
    rel('v1.99.0', 'ferretdb-amd64'),
  ]);
  const r = run(gh, ['amd64']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-sqlite-amd64');
  assert.strictEqual(r.meta.FERRET_TAG, 'v1.100.0');
  assert.match(r.stderr, /the newest release v1\.101\.0 has none for amd64/);
});

test('THE FALLBACK: no release has it yet, so the full binary of the newest release is taken and the log says so', () => {
  const gh = github([rel('v1.98.0', 'ferretdb-amd64'), rel('v1.97.0', 'ferretdb-amd64')]);
  const r = run(gh, ['amd64']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-amd64');
  assert.strictEqual(r.meta.FERRET_VARIANT, 'full');
  assert.strictEqual(r.meta.FERRET_TAG, 'v1.98.0');
  assert.strictEqual(r.meta.FERRET_URL, `${BASE}/download/v1.98.0/ferretdb-amd64`);
  assert.match(r.stderr, /::notice::FerretDB for amd64: no recent wekan\/FerretDB release publishes ferretdb-sqlite-amd64 yet, so this uses the full ferretdb-amd64 from v1\.98\.0/);
});

test('Windows platforms get the .exe names, sqlite and full alike', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-win64.exe', 'ferretdb-win64.exe', 'ferretdb-win32.exe')]);
  assert.strictEqual(run(gh, ['win64']).meta.FERRET_ASSET, 'ferretdb-sqlite-win64.exe');
  const r = run(gh, ['win32']);
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-win32.exe');
  assert.strictEqual(r.meta.FERRET_VARIANT, 'full');
});

test('--url prints only the chosen URL', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-arm64', 'ferretdb-arm64')]);
  const r = run(gh, ['--url', 'arm64']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout.trim(), `${BASE}/download/v1.99.0/ferretdb-sqlite-arm64`);
});

test('FERRETDB_VARIANT=full takes the full binary even when the SQLite-only one exists', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64')]);
  const r = run(gh, ['amd64'], { FERRETDB_VARIANT: 'full' });
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-amd64');
  assert.strictEqual(r.meta.FERRET_VARIANT, 'full');
});

test('a pinned FERRETDB_TAG is that release, without looking at older ones', () => {
  const gh = github([rel('v1.101.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64'), rel('v1.98.0', 'ferretdb-amd64')]);
  const pinned = run(gh, ['amd64'], { FERRETDB_TAG: 'v1.98.0' });
  assert.strictEqual(pinned.meta.FERRET_TAG, 'v1.98.0');
  assert.strictEqual(pinned.meta.FERRET_ASSET, 'ferretdb-amd64');
  const sqlite = run(gh, ['amd64'], { FERRETDB_TAG: 'v1.101.0' });
  assert.strictEqual(sqlite.meta.FERRET_ASSET, 'ferretdb-sqlite-amd64');
});

test('the answer is cached for the job, so the check step and the embed step agree', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64')]);
  run(gh, ['--url', 'amd64']);
  const before = fs.readFileSync(path.join(gh, 'requests.log'), 'utf8').split('\n').length;
  const r = run(gh, ['amd64']);
  const after = fs.readFileSync(path.join(gh, 'requests.log'), 'utf8').split('\n').length;
  assert.strictEqual(after, before, 'the second call must not ask GitHub again');
  assert.strictEqual(r.meta.FERRET_ASSET, 'ferretdb-sqlite-amd64');
  assert.match(r.stderr, /the SQLite-only build, as decided earlier in this job/);
});

test('a download is verified against its .sha256sum and handed to provenance, also through $GITHUB_ENV', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64')]);
  const out = path.join(gh, 'bundle', 'ferretdb');
  const envFile = path.join(gh, 'github-env');
  const r = run(gh, ['amd64', '-o', out], { GITHUB_ENV: envFile });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(out, 'utf8'), 'binary v1.99.0 ferretdb-sqlite-amd64');
  assert.ok(fs.statSync(out).mode & 0o100, 'the binary is executable');
  assert.strictEqual(r.meta.FERRET_SHA, sha(Buffer.from('binary v1.99.0 ferretdb-sqlite-amd64')));
  assert.match(r.stderr, /FerretDB SHA256 verified/);
  const env = fs.readFileSync(envFile, 'utf8');
  for (const k of ['FERRET_ASSET=ferretdb-sqlite-amd64', 'FERRET_TAG=v1.99.0', `FERRET_SHA=${r.meta.FERRET_SHA}`]) {
    assert.ok(env.includes(k), `$GITHUB_ENV must carry ${k}`);
  }
});

test('a release without checksums is downloaded and reported unverified, with an empty FERRET_SHA', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64')], { checksums: false });
  const r = run(gh, ['amd64', '-o', path.join(gh, 'f')]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.meta.FERRET_SHA, '');
  assert.match(r.stderr, /publishes no checksum for ferretdb-sqlite-amd64/);
});

// ───────────────────────────────────────────── negative: what must fail

test('negative: a download that does not match its published SHA256 fails with 2 and leaves no binary', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64')], { badChecksum: true });
  const out = path.join(gh, 'bundle', 'ferretdb');
  const r = run(gh, ['amd64', '-o', out]);
  assert.strictEqual(r.status, 2, r.stderr);
  assert.ok(!fs.existsSync(out), 'a binary that failed its checksum must not be left in the bundle');
  assert.match(r.stderr, /does not match its published SHA256/);
});

test('negative: a platform no release publishes anything for is exit 1, which the tolerant jobs act on', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-sqlite-amd64', 'ferretdb-amd64')]);
  const r = run(gh, ['win-arm64', '-o', path.join(gh, 'f.exe')]);
  assert.strictEqual(r.status, 1, r.stderr);
  assert.ok(!fs.existsSync(path.join(gh, 'f.exe')));
});

test('negative: a platform name that is not one is refused before anything is asked', () => {
  const gh = github([rel('v1.99.0', 'ferretdb-amd64')]);
  for (const bad of ['../amd64', 'amd64;id', 'AMD64', '']) {
    const r = run(gh, bad ? [bad] : []);
    assert.strictEqual(r.status, 64, `'${bad}' must be refused`);
  }
  assert.strictEqual(run(gh, ['amd64'], { FERRETDB_VARIANT: 'mysql' }).status, 64);
});

// ───────────────────────────────────────────── the guard: every download site

const WORKFLOWS = fs.readdirSync(path.join(ROOT, '.github/workflows'))
  .filter(f => /\.ya?ml$/.test(f)).map(f => `.github/workflows/${f}`);
const code = text => text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

test('every bundle job of release-all.yml downloads FerretDB through the helper, for its own platform', () => {
  const wf = read('.github/workflows/release-all.yml');
  const job = name => {
    const start = wf.indexOf(`\n  ${name}:`);
    assert.ok(start > 0, `release-all.yml has a ${name} job`);
    const next = wf.slice(start + 1).search(/\n  [A-Za-z0-9_-]+:\n/);
    return wf.slice(start, next > 0 ? start + 1 + next : undefined);
  };
  const sites = {
    'build-amd64': ['amd64', '.build/bundle/ferretdb'],
    'build-arm64': ['arm64', 'bundle/ferretdb'],
    'build-win64': ['win64', 'bundle/ferretdb.exe'],
    'build-win-arm64': ['win-arm64', 'bundle/ferretdb.exe'],
    'build-win32': ['win32', 'bundle/ferretdb.exe'],
    'build-mac-arm64': ['mac-arm64', 'bundle/ferretdb'],
    'build-mac-x64': ['mac-amd64', 'bundle/ferretdb'],
  };
  for (const [name, [plat, dest]] of Object.entries(sites)) {
    const body = code(job(name));
    assert.ok(body.includes(`ferretdb-asset.sh" ${plat} -o ${dest})`),
      `${name} must download ${plat} through releases/ferretdb-asset.sh into ${dest}`);
    assert.ok(body.includes(`ferretdb-asset.sh --url ${plat})`),
      `${name} must check the binary the helper chose, not a URL of its own`);
    assert.ok(/eval "\$ferret_meta"/.test(body), `${name} must take the helper's tag, URL and checksum`);
    assert.ok(/'FerretDB' 'wekan\/FerretDB' "\$\{FERRET_TAG:-latest\}" \\\n\s+"\$\{FERRET_URL:-\}"/.test(body),
      `${name} must record the release and URL the helper chose in the provenance table`);
  }
  assert.ok(/ferretdb-asset\.sh" "\$\{MATRIX_FERRETDB_ARCH\}" -o bundle\/ferretdb\)/.test(wf),
    'the extra-architecture matrix must download through the helper too');
});

test('no download site names a FerretDB release URL of its own: the helper is the only place that chooses', () => {
  const files = [
    ...WORKFLOWS,
    'releases/build-release-bundle.sh', 'releases/repack-bundle-for-arch.sh',
    'releases/check-arch-binaries.sh', 'releases/test-download-urls.sh',
    'sandstorm-src/build-deps.sh', 'Dockerfile', 'snapcraft.yaml', 'snapcraft-core26.yaml',
  ];
  const offenders = [];
  for (const f of files) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    code(read(f)).split('\n').forEach((l, i) => {
      if (/wekan\/FerretDB\/releases\/(?:latest\/)?download/.test(l)) offenders.push(`${f}: ${l.trim()}`);
    });
  }
  assert.deepStrictEqual(offenders, [], 'a FerretDB URL outside releases/ferretdb-asset.sh skips the SQLite-only choice');
  for (const f of ['releases/build-release-bundle.sh', 'releases/repack-bundle-for-arch.sh',
    'releases/check-arch-binaries.sh', 'releases/test-download-urls.sh', 'sandstorm-src/build-deps.sh',
    '.github/workflows/bsd.yml']) {
    assert.ok(/ferretdb-asset\.sh/.test(code(read(f))), `${f} must go through releases/ferretdb-asset.sh`);
  }
});

test('the helper prefers ferretdb-sqlite-<arch> and falls back to the full ferretdb-<arch>', () => {
  const h = code(read('releases/ferretdb-asset.sh'));
  assert.ok(/variant="\$\{FERRETDB_VARIANT:-sqlite\}"/.test(h), 'sqlite is the default variant');
  assert.ok(/sqlite_asset="ferretdb-sqlite-\$\{platform\}\$\{ext\}"/.test(h));
  assert.ok(/full_asset="ferretdb-\$\{platform\}\$\{ext\}"/.test(h));
  assert.ok(/::notice::FerretDB for \$platform/.test(h), 'the fallback is announced in the log');
});

test('negative: no release workflow builds FerretDB from source', () => {
  for (const f of WORKFLOWS) {
    const body = code(read(f));
    assert.ok(!/FERRETDB_SOURCE:\s*build/.test(body), `${f} must not build FerretDB (FERRETDB_SOURCE: build)`);
    assert.ok(!/go build[^\n]*cmd\/ferretdb/.test(body), `${f} must not go build FerretDB`);
    assert.ok(!/actions\/setup-go/.test(body), `${f} has no reason to install Go`);
    assert.ok(!/git clone[^\n]*FerretDB/.test(body), `${f} must not clone FerretDB to build it`);
  }
  // The Sandstorm deps script defaults to the prebuilt binary; building is an
  // explicit local choice.
  const deps = read('sandstorm-src/build-deps.sh');
  assert.match(deps, /FERRETDB_SOURCE="\$\{FERRETDB_SOURCE:-download\}"/);
  for (const f of ['.github/workflows/sandstorm.yml', '.github/workflows/release-all.yml']) {
    assert.match(read(f), /FERRETDB_SOURCE: download/, `${f} downloads the prebuilt FerretDB for the .spk`);
  }
});

test('the default docker-compose.yml tries ferretdb-sqlite-<arch> first; the other databases keep the full binary', () => {
  const compose = read('docker-compose.yml');
  assert.match(compose, /FERRETDB_BINARY: \$\{FERRETDB_BINARY:-ferretdb-sqlite\}/);
  assert.match(compose, /for name in "\$\$\{FERRETDB_BINARY\}-\$\$\{arch\}" "ferretdb-\$\$\{arch\}"; do/,
    'the SQLite-only binary first, the full one for a release without it');
  assert.match(compose, /\$\$\{ASSET\}\.sha256sum/, 'and the checksum of the one taken');
  for (const f of ['docker-compose-ferretdb-v1-postgresql.yml', 'docker-compose-ferretdb-v1-mysql.yml',
    'docker-compose-ferretdb-v1-mariadb.yml', 'docker-compose-ferretdb-v1-sap-hana.yml']) {
    const body = read(f);
    assert.ok(!/ferretdb-sqlite/.test(code(body)), `${f} needs the full binary, not the SQLite-only one (negative)`);
    assert.match(body, /\/ferretdb-\$\$\{arch\}"/, `${f} still downloads the full ferretdb-<arch>`);
  }
});

test('the resume-login floor is checked against the release the helper chose', () => {
  const rb = read('releases/require-binaries.sh');
  assert.match(rb, /ferretdb_releases="https:\/\/github\.com\/wekan\/FerretDB\/releases"/);
  assert.match(rb, /"\$ferretdb_releases"\/download\/\*\/ferretdb-\*\)/);
  assert.match(rb, /require-ferretdb-resume-login\.sh" "\$tag"/);
});

console.log(`ferretdbSqliteAsset: ${passed} tests passed`);
