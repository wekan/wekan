'use strict';

// WeKan bundles for the BSDs (docs/Platforms/FOSS/OS/BSD.md,
// .github/workflows/bsd.yml): every target is known to each piece it passes
// through, a target without a Node.js is skipped rather than failed, the
// bundle is built and started inside that BSD, and the inputs are verified.
// Run: node tests/bsdBundles.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const targets = JSON.parse(read('releases/bsd/targets.json'));
const workflow = read('.github/workflows/bsd.yml');

test('the targets: FreeBSD x64/arm64, OpenBSD x64/arm64, NetBSD x64, each with its FerretDB name', () => {
  assert.deepEqual(targets.map(t => t.target), ['freebsd-x64', 'freebsd-arm64', 'openbsd-x64', 'openbsd-arm64', 'netbsd-x64']);
  for (const t of targets) {
    assert.equal(t.target, `${t.os}-${t.arch}`);
    assert.equal(t.ferretdb_arch, `${t.os}-${t.arch === 'x64' ? 'amd64' : t.arch}`, t.target);
    assert.match(t.release, /^\d+\.\d+$/, t.target);
  }
  // node-patches builds OpenBSD's Node.js on 7.8, the first release whose base
  // Clang (19) builds Node 26; the bundle runs where that binary runs.
  for (const t of targets.filter(x => x.os === 'openbsd')) {
    const [major, minor] = t.release.split('.').map(Number);
    assert.ok(major > 7 || (major === 7 && minor >= 8), `${t.target} on OpenBSD ${t.release} (needs 7.8+)`);
  }
});

test('every piece knows every target: the Node.js resolver, the ELF check, the native packages', async () => {
  const resolver = read('releases/resolve-node-source.sh');
  for (const t of targets) {
    assert.match(resolver, new RegExp(`^  ${t.target}\\)\\s+nodename="${t.target}"\\s*; asset="node-${t.target}"`, 'm'), t.target);
  }
  const { TARGETS } = await import(path.join(ROOT, 'releases/platform-native-packages.mjs'));
  for (const t of targets) assert.ok(TARGETS[t.os] && TARGETS[t.os].includes(t.arch), `${t.target} in TARGETS`);
  const addon = read('releases/check-addon-arch.mjs');
  for (const os of ['freebsd', 'openbsd', 'netbsd']) {
    assert.match(addon, new RegExp(`${os}: 'ELF'`), `${os} binaries are ELF`);
    assert.match(addon, new RegExp(`${os}: ELF_MACHINE`), `${os} uses ELF machine numbers`);
  }
});

test('the workflow: skip without a Node.js, verify every download, build and start inside the BSD (negative: no failure for a missing Node.js)', () => {
  assert.match(workflow, /bash releases\/resolve-node-source\.sh "\$TARGET" "\$NODE_VERSION"/);
  assert.match(workflow, /echo "skip=true" >> "\$GITHUB_OUTPUT"\n\s*exit 0/, 'no Node.js yet is a skip, not a red job');
  for (const os of ['freebsd', 'openbsd', 'netbsd']) {
    assert.match(workflow, new RegExp(`matrix\\.os == '${os}'\\n\\s*uses: vmactions/${os}-vm@`), `${os} builds in a ${os} VM`);
    assert.match(workflow, new RegExp(`bash releases/bsd/build-bundle\\.sh ${os} \\$\\{\\{ matrix\\.arch \\}\\}`));
  }
  // OpenBSD: node runs only from a wxallowed filesystem; NetBSD: GCC 14 for Node 26's C++20.
  assert.match(workflow, /mount -u -o wxallowed "\$\(df -P \. \| awk 'NR==2 \{print \$6\}'\)"/);
  assert.match(workflow, /CC=\/usr\/pkg\/gcc14\/bin\/gcc CXX=\/usr\/pkg\/gcc14\/bin\/g\+\+/);
  // The same FreeBSD VM that built the Node.js builds the native modules. A
  // dependabot bump of one (v1.5.9, #6781) has to be made in the other too.
  const pin = workflow.match(/uses: vmactions\/freebsd-vm@([0-9a-f]{40})/);
  assert.ok(pin, 'FreeBSD VM pinned to a commit');
  assert.equal(pin[1], 'c46abacb49f09938ca4e1702d15d836285d694cc', 'FreeBSD VM pinned to the commit node-patches uses');
  const np = path.join(__dirname, '..', '.tools', 'node-patches', '.github', 'workflows', 'release-all.yml');
  if (fs.existsSync(np)) {
    assert.match(fs.readFileSync(np, 'utf8'), new RegExp(`uses: vmactions/freebsd-vm@${pin[1]}`), 'node-patches uses the same commit');
  }
  assert.match(workflow, /sha256sum -c "wekan-\$\{version\}-amd64\.zip\.sha256sum"/, 'the release bundle is verified');
  assert.match(workflow, /echo "\$NODE_SHA256  bsd-tools\/bin\/node" \| sha256sum -c -/, 'Node.js is verified');
  // FerretDB (the SQLite-only ferretdb-sqlite-<bsd>-<arch>, or the full one
  // until a release has it) is downloaded and checksum-verified by the helper.
  assert.match(workflow, /releases\/ferretdb-asset\.sh "\$FERRETDB_ARCH" -o bundle\/ferretdb\)/, 'FerretDB is verified');
  assert.match(workflow, /for want in bundle\/main\.js bundle\/node bundle\/ferretdb bundle\/start-wekan\.sh/);
  // Release All calls it, after the amd64 bundle is attached.
  assert.match(read('.github/workflows/release-all.yml'), /bsd:\n\s+name: BSD bundles\n\s+needs: \[prepare, release, build-amd64\][\s\S]*?uses: \.\/\.github\/workflows\/bsd\.yml/);
});

test('the build: native modules compiled on the BSD, the usual bundle steps, then started as a user starts it', () => {
  const build = read('releases/bsd/build-bundle.sh');
  for (const step of ['releases/npm-retry.sh" npm install', 'prune-build-only-modules.mjs', 'bump-bundle-npm-deps.mjs',
    'bundle-trim.mjs', 'prune-unreachable-npm.mjs', 'platform-native-packages.mjs" "$root/bundle" "$os" "$arch"',
    'releases/bsd/smoke.sh" "$root/bundle"']) {
    assert.ok(build.includes(step), step);
  }
  assert.match(build, /process\.platform !== process\.argv\[1\]/, 'the Node.js must say it is this BSD (negative: a Linux binary is refused)');
  const smoke = read('releases/bsd/smoke.sh');
  assert.match(smoke, /exec \.\/start-wekan\.sh/);
  assert.match(smoke, /\[ "\$code" = 200 \]/);
  for (const file of ['releases/bsd/build-bundle.sh', 'releases/bsd/smoke.sh']) {
    assert.equal(spawnSync('bash', ['-n', path.join(ROOT, file)]).status, 0, `${file} parses`);
  }
});

test('the smoke test fails when WeKan never answers, and passes when it does (runs here, with a stand-in launcher)', () => {
  const tmp = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'bsd-smoke-'));
  try {
    // A launcher that exits at once: smoke.sh must fail, and say so.
    fs.writeFileSync(path.join(tmp, 'start-wekan.sh'), '#!/bin/sh\necho launcher broke\nexit 3\n', { mode: 0o755 });
    const bad = spawnSync('bash', [path.join(ROOT, 'releases/bsd/smoke.sh'), tmp, '3197'], { encoding: 'utf8', env: { ...process.env, TMPDIR: tmp } });
    assert.notEqual(bad.status, 0);
    assert.match(bad.stdout, /exited before WeKan answered/);
    assert.match(bad.stdout, /launcher broke/);
    // A launcher that serves HTTP 200 on PORT: smoke.sh passes.
    fs.writeFileSync(path.join(tmp, 'start-wekan.sh'),
      `#!/bin/sh\nexec "${process.execPath}" -e "require('http').createServer((q,r)=>r.end('ok')).listen(process.env.PORT,'127.0.0.1')"\n`, { mode: 0o755 });
    const good = spawnSync('bash', [path.join(ROOT, 'releases/bsd/smoke.sh'), tmp, '3198'], { encoding: 'utf8', env: { ...process.env, TMPDIR: tmp } });
    assert.equal(good.status, 0, good.stdout + good.stderr);
    assert.match(good.stdout, /WeKan answered HTTP 200/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('the resolver answers "not built" for a BSD nobody publishes yet (negative), without failing', () => {
  const res = spawnSync('bash', [path.join(ROOT, 'releases/resolve-node-source.sh'), 'netbsd-x64', 'v26.11.1'], { encoding: 'utf8', timeout: 120000 });
  if (res.error || /Could not resolve host|curl: \(6\)/.test(res.stderr)) return; // offline: nothing to check
  assert.ok(res.status === 0 || res.status === 3, res.stderr);
  if (res.status === 3) assert.match(res.stdout, /node_found=false/);
});
