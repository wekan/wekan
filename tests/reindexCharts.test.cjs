'use strict';

// Guard for releases/reindex-charts.py - the tool that rebuilds the wekan/charts
// Helm index from the packages that repository actually serves.
// Run: node tests/reindexCharts.test.cjs
//
// The index had drifted from its own packages in four ways at once, and every
// one of them came from the same habit: release-charts.sh writes an entry by
// COPYING the previous entry and substituting a few fields, so the index was
// being treated as the record rather than as a description of the .tgz files
// beside it.
//
//   146 packages had no entry at all - downloadable by URL, invisible to
//       `helm search`, `helm install --version` and Artifact Hub.
//   9.36.0 had four entries and 10.30.0 two, each with a different digest and
//       the same url, so a helm client could pick a digest that matches no file
//       and fail integrity on a good package.
//   appVersion was the CHART version ("10.79.0") on every entry, where the
//       package says the WeKan version ("10.79").
//   Every entry claimed mongodb 0.7.2 because nobody substituted that field,
//       while the packages had moved to 0.7.6.
//
// So the rebuild reads each package's own Chart.yaml out of the archive. The
// rules that matter are checked here by running the tool against a synthesised
// charts directory: it must never invent a `created`, never drop a version, and
// never write an index in which one version means two files.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const zlib = require('zlib');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'releases/reindex-charts.py');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// python3 with PyYAML is what the tool needs; without it the behaviour tests
// cannot run, and saying so is better than reporting a pass that did not happen.
const hasPyYaml = spawnSync('python3', ['-c', 'import yaml'], { stdio: 'ignore' }).status === 0;

test('the tool exists and is executable', () => {
  assert.ok(fs.existsSync(script), 'releases/reindex-charts.py is missing');
  assert.ok(fs.statSync(script).mode & 0o111, 'reindex-charts.py must be executable');
});

test('it writes nothing unless asked', () => {
  const src = fs.readFileSync(script, 'utf8');
  assert.ok(/if not args\.write:/.test(src),
    'the report must return before index.yaml is written');
  const gate = src.indexOf('if not args.write:');
  const write = src.indexOf('yaml.safe_dump(document, fh');
  assert.ok(gate !== -1 && write > gate, 'nothing may be written before the --write gate');
  assert.ok(!/git (push|commit)/.test(src),
    'rebuilding an index is not the same as publishing it - pushing stays a ' +
    'separate, deliberate step');
});

test('it looks for the charts checkout where the repo keeps companion repos', () => {
  const src = fs.readFileSync(script, 'utf8');
  assert.ok(/\.tools", "charts"/.test(src),
    '.tools/charts is where companion repositories are cloned (CLAUDE.md)');
  assert.ok(/"w", "charts"/.test(src), '../w/charts must keep working as the older location');
  const sh = fs.readFileSync(path.join(repoRoot, 'releases/backfill-charts.sh'), 'utf8');
  assert.ok(/\$REPO_DIR\/\.tools\/charts/.test(sh),
    'backfill-charts.sh must look in the same places');
});

// ── the behaviour, run for real against a synthesised charts directory ──────

// A minimal but REAL chart package: a gzipped tar with <name>/Chart.yaml in it,
// which is what the tool reads. Written by hand so the test needs no helm.
function makePackage(dir, filename, chart) {
  const body = Buffer.from(
    `apiVersion: v2\nname: wekan\nversion: ${chart.version}\n` +
    `appVersion: "${chart.appVersion}"\ndescription: Open Source kanban\n` +
    (chart.dependencies
      ? `dependencies:\n- name: mongodb\n  version: ${chart.dependencies}\n` : ''),
    'utf8');

  // One ustar header + the file, padded to 512-byte records.
  const header = Buffer.alloc(512);
  header.write('wekan/Chart.yaml', 0, 'utf8');
  header.write('0000644\0', 100);
  header.write('0000000\0', 108);
  header.write('0000000\0', 116);
  header.write(body.length.toString(8).padStart(11, '0') + '\0', 124);
  header.write('00000000000\0', 136);
  header.write('        ', 148);          // checksum field, spaces while summing
  header.write('0', 156);
  header.write('ustar\0', 257);
  header.write('00', 263);
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);

  const pad = Buffer.alloc((512 - (body.length % 512)) % 512);
  const tar = Buffer.concat([header, body, pad, Buffer.alloc(1024)]);
  fs.writeFileSync(path.join(dir, filename), zlib.gzipSync(tar));
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, filename))).digest('hex');
}

function writeIndex(dir, entries) {
  const body = entries.map(e =>
    `  - apiVersion: v2\n    appVersion: "${e.appVersion}"\n` +
    `    created: "${e.created}"\n    digest: ${e.digest}\n    name: wekan\n` +
    `    urls:\n    - https://wekan.github.io/charts/wekan-${e.version}.tgz\n` +
    `    version: ${e.version}\n`).join('');
  fs.writeFileSync(path.join(dir, 'index.yaml'),
    `apiVersion: v1\nentries:\n  wekan:\n${body}generated: "2026-01-01T00:00:00+00:00"\n`);
}

function run(dir, extra = []) {
  return execFileSync('python3', [script, '--charts-dir', dir, ...extra],
    { encoding: 'utf8' });
}

function readIndex(dir) {
  const text = fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8');
  const out = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (/^ {2}- /.test(line)) { current = {}; out.push(current); }
    if (!current) continue;
    const m = line.match(/^\s+(appVersion|created|digest|version):\s*'?"?([^'"\n]*)'?"?\s*$/);
    if (m) current[m[1]] = m[2];
  }
  return out;
}

function withCharts(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-reindex-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

if (!hasPyYaml) {
  console.log('  -- python3 PyYAML not available; behaviour tests skipped');
} else {
  test('a package with no entry is added, and one already correct keeps its created', () => {
    withCharts(dir => {
      const dA = makePackage(dir, 'wekan-10.79.0.tgz', { version: '10.79.0', appVersion: '10.79' });
      makePackage(dir, 'wekan-9.63.0.tgz', { version: '9.63.0', appVersion: '9.63' });
      writeIndex(dir, [
        { version: '10.79.0', appVersion: '10.79.0', created: '2026-08-10T02:46:52.308983+00:00', digest: dA },
      ]);

      const out = run(dir, ['--write']);
      const entries = readIndex(dir);
      assert.deepStrictEqual(entries.map(e => e.version), ['10.79.0', '9.63.0'],
        'the unindexed package must be added, newest first');
      assert.strictEqual(entries[0].created, '2026-08-10T02:46:52.308983+00:00',
        'an entry whose digest matches its package must keep the created it has - ' +
        'a rebuild must not restamp the whole repository');
      assert.ok(entries[1].created, 'the added entry must still have a created');
      assert.ok(/added\s+:\s*1/.test(out), out);
    });
  });

  test('appVersion is taken from the package, not from the chart version', () => {
    withCharts(dir => {
      const d = makePackage(dir, 'wekan-10.79.0.tgz', { version: '10.79.0', appVersion: '10.79' });
      writeIndex(dir, [
        { version: '10.79.0', appVersion: '10.79.0', created: '2026-08-10T02:46:52+00:00', digest: d },
      ]);
      run(dir, ['--write']);
      assert.strictEqual(readIndex(dir)[0].appVersion, '10.79',
        'appVersion is the WeKan version the package declares; the index had the ' +
        'CHART version there on every entry');
    });
  });

  test('duplicate entries collapse to the one whose digest matches the package', () => {
    withCharts(dir => {
      const real = makePackage(dir, 'wekan-9.36.0.tgz', { version: '9.36.0', appVersion: '9.36' });
      // The matching digest on the OLDEST copy: if "newest wins" were the rule
      // rather than a fallback, this is what would expose it.
      writeIndex(dir, [
        { version: '9.36.0', appVersion: '9.36.0', created: '2026-06-11T03:41:02+00:00', digest: 'b'.repeat(64) },
        { version: '9.36.0', appVersion: '9.36.0', created: '2026-06-11T02:26:50+00:00', digest: 'c'.repeat(64) },
        { version: '9.36.0', appVersion: '9.36.0', created: '2026-06-10T21:20:06+00:00', digest: real },
      ]);
      run(dir, ['--write']);
      const entries = readIndex(dir);
      assert.strictEqual(entries.length, 1, 'one entry per version');
      assert.strictEqual(entries[0].digest, real,
        'the surviving entry must be the one a helm client can verify the file against');
      assert.strictEqual(entries[0].created, '2026-06-10T21:20:06+00:00',
        'and its created comes with it - the digest decides, not the timestamp');
    });
  });

  test('two packages claiming one version: the filename that matches wins, and it is reported', () => {
    withCharts(dir => {
      makePackage(dir, 'wekan-6.9.6.tgz', { version: '6.9.6', appVersion: '6.96' });
      makePackage(dir, 'wekan-6.96.tgz', { version: '6.9.6', appVersion: '6.96' });
      writeIndex(dir, []);
      const out = run(dir, ['--write']);
      const entries = readIndex(dir);
      assert.strictEqual(entries.length, 1,
        'an index where one version means two files cannot say which to install');
      const text = fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8');
      assert.ok(text.includes('wekan-6.9.6.tgz'), 'the file whose name matches its version is kept');
      assert.ok(!text.includes('wekan-6.96.tgz'), 'the mis-named one is not offered as a version');
      assert.ok(/not offered/.test(out) && /wekan-6\.96\.tgz/.test(out),
        `dropping a package must be reported, not silent. Got:\n${out}`);
    });
  });

  test('no version that was listed before is ever dropped', () => {
    withCharts(dir => {
      const d = makePackage(dir, 'wekan-8.00.0.tgz', { version: '8.00.0', appVersion: '8.00' });
      makePackage(dir, 'wekan-7.99.0.tgz', { version: '7.99.0', appVersion: '7.99' });
      writeIndex(dir, [
        { version: '8.00.0', appVersion: '8.00.0', created: '2026-01-02T00:00:00+00:00', digest: d },
      ]);
      run(dir, ['--write']);
      const versions = readIndex(dir).map(e => e.version);
      assert.ok(versions.includes('8.00.0'), 'a version listed before must still be listed');
      assert.ok(versions.includes('7.99.0'), 'and the package that was missing is added');
    });
  });

  test('every entry it writes points at a package that is there, with that package\'s digest', () => {
    withCharts(dir => {
      const digests = {
        '10.79.0': makePackage(dir, 'wekan-10.79.0.tgz', { version: '10.79.0', appVersion: '10.79' }),
        '10.78.0': makePackage(dir, 'wekan-10.78.0.tgz', { version: '10.78.0', appVersion: '10.78' }),
      };
      writeIndex(dir, []);
      run(dir, ['--write']);
      for (const e of readIndex(dir)) {
        assert.strictEqual(e.digest, digests[e.version],
          `${e.version}: the digest must be the sha256 of the file being served`);
        assert.ok(fs.existsSync(path.join(dir, `wekan-${e.version}.tgz`)),
          `${e.version}: an entry must not point at a package that is not there`);
      }
    });
  });

  test('a report run leaves index.yaml exactly as it was', () => {
    withCharts(dir => {
      makePackage(dir, 'wekan-9.63.0.tgz', { version: '9.63.0', appVersion: '9.63' });
      writeIndex(dir, []);
      const before = fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8');
      const out = run(dir);
      assert.strictEqual(fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8'), before,
        'without --write the file must not be touched at all');
      assert.ok(/Report only\. Nothing was written\./.test(out), out);
    });
  });
}


// ── charts that cannot be installed ─────────────────────────────────────────
//
// Backfilling 146 old packages taught this the hard way. Artifact Hub scans
// EVERY entry in the index and mailed a list of errors within the hour:
//
//   error scanning image ghcr.io/wekan/wekan:v9.62: image not found
//   error scanning image docker.io/bitnami/mongodb:7.0.14-debian-12-r3: image not found
//
// A chart is a pointer to container images; one whose images are gone installs
// and then fails at the pull, so listing it tells everyone the repository is
// broken when the repository is fine. 135 of the 360 packages are in that state
// - six WeKan images that were never pushed (the releases whose docker job
// failed) and 129 older charts vendoring the Bitnami mongodb subchart, whose
// pinned tags Bitnami has deleted.

test('the exclusion list is a file in the repository, not a decision made per run', () => {
  const src = fs.readFileSync(script, 'utf8');
  assert.ok(/UNINDEXED_FILE = "unindexed\.txt"/.test(src),
    'which packages are not listed must be RECORDED, so a rebuild during a ' +
    'release does not depend on reaching two registries - a network blip would ' +
    'otherwise drop half the index');
  assert.ok(/def read_unindexed\(/.test(src), 'and read back on every run');
  assert.ok(/--check-images/.test(src),
    'with an explicit flag to regenerate it, rather than doing it implicitly');
});

test('an image that cannot be checked is never treated as missing', () => {
  const src = fs.readFileSync(script, 'utf8');
  assert.ok(/never "missing"/.test(src),
    'image_exists must distinguish "gone" from "could not tell"');
  assert.ok(/if verdicts\.get\(\(h, r, t\)\) is False/.test(src),
    'only a definite False may exclude a chart - None must not, or a registry ' +
    'hiccup silently unpublishes charts');
});

test('the registry handshake is the registry\'s own, not a guess per host', () => {
  const src = fs.readFileSync(script, 'utf8');
  assert.ok(/WWW-Authenticate/.test(src),
    'a hard-coded token URL per registry reported every quay.io image as missing, ' +
    'including quay.io/wekan/wekan:latest - the 401 challenge says which realm ' +
    'and scope to use');
  assert.ok(/localhost/.test(src) && /"\." in head/.test(src),
    'and a repository that already begins with a host must not be read as a ' +
    'docker.io path - that is how ghcr.io/wekan/wekan came back unknown');
});

test('publishing refuses a version with no container image', () => {
  const rel = fs.readFileSync(path.join(repoRoot, 'releases/release-charts.sh'), 'utf8');
  assert.ok(/does not exist/.test(rel) && /image pull/.test(rel),
    'release-charts.sh must not publish a chart pointing at an image that is not ' +
    'there - that is exactly what produced the Artifact Hub scan errors');
  const guard = rel.indexOf('ghcr.io/wekan/wekan');
  const work = rel.indexOf('git checkout main');
  assert.ok(guard !== -1 && guard < work,
    'and it must check BEFORE it starts changing the charts repository');
  assert.ok(/continuing\./.test(rel),
    'a registry it cannot reach must not block a release either');
});

console.log(`\n${passed} passed`);
