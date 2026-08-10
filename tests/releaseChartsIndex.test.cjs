'use strict';

// Guard: publishing a chart derives the index from the packages, and refuses a
// package whose filename and contents disagree.
// Run: node tests/releaseChartsIndex.test.cjs
//
// The charts repository keeps the chart SOURCE on `main` and the published
// packages plus index.yaml on `gh-pages`, and its own two scripts move between
// them: main's release.sh commits the source, tars `wekan/` into
// wekan-<version>.0.tgz, checks out gh-pages and drops the package there;
// gh-pages' release2.sh commits and pushes. releases/release-charts.sh drives
// both and owns the index in between - and that middle part is what this pins.
//
// TWO THINGS GO WRONG THERE, and both have already happened.
//
// The index used to be EDITED: the newest entry was copied, a few fields
// substituted, and the result prepended. All four of the index's defects came
// from that - a re-run prepended a second entry for a version instead of
// replacing it (9.36.0 ended with four, each a different digest, so a client
// could pick one matching no file); appVersion was set to the CHART version on
// every entry; fields nobody substituted never changed, so every entry claimed
// mongodb 0.7.2 while the packages were 0.7.6; and a release whose charts job
// did not run left a hole nothing went back for. Deriving the index from the
// packages makes all four impossible instead of fixed.
//
// And release.sh names the package from its ARGUMENT (`tar -cvzf
// wekan-$1.0.tgz wekan`) while the version INSIDE comes from the Chart.yaml that
// release-charts.sh sed-ed a moment earlier. When those drift the repository
// gains a file called one version that declares another: wekan-1.2.7.tgz
// (containing 1.2.6) and wekan-6.96.tgz (containing 6.9.6) were both in the
// repository until they were removed. A Helm index keys on the version INSIDE,
// so neither could ever be installed under the name it was given.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const zlib = require('zlib');

const repoRoot = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(repoRoot, 'releases/release-charts.sh'), 'utf8');
const missing = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all-missing.yml'), 'utf8');
const releaseAll = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the index is rebuilt from the packages, not edited in place', () => {
  assert.ok(/reindex-charts\.py" --write --charts-dir/.test(script),
    'release-charts.sh must rebuild index.yaml from the packages on gh-pages');
  assert.ok(!/Prepended chart/.test(script),
    'the hand-rolled "prepend a copy of the previous entry" step must be gone - ' +
    'it is where the duplicate entries, the wrong appVersion and the frozen ' +
    'dependency versions all came from');
  assert.ok(!/set_field\(block/.test(script),
    'and so must the field substitution it did');
});

test('the packaged chart is checked against its own filename before it is indexed', () => {
  assert.ok(/declares chart version/.test(script),
    'release-charts.sh must refuse a package whose Chart.yaml version is not the ' +
    'version its filename claims - that is how wekan-1.2.7.tgz and wekan-6.96.tgz ' +
    'came to exist');
  const check = script.indexOf('declares chart version');
  const index = script.indexOf('reindex-charts.py" --write');
  assert.ok(check !== -1 && check < index,
    'the check has to come BEFORE the index is rebuilt, or the bad package is ' +
    'indexed and then reported');
});

test('both release workflows publish the chart', () => {
  // release-all.yml has always had a charts job; it is release-all-missing.yml
  // that could not finish a release's chart, which is how a release that missed
  // its chart stayed missing it forever.
  assert.ok(/\n  charts:\n/.test(releaseAll), 'release-all.yml must have a charts job');
  assert.ok(/\n  charts:\n/.test(missing),
    'release-all-missing.yml must be able to publish a chart a release never got');
  for (const [name, text] of [['release-all', releaseAll], ['release-all-missing', missing]]) {
    assert.ok(/release-charts\.sh/.test(text),
      `${name}.yml's charts job must publish through releases/release-charts.sh, ` +
      'so both take the same path');
  }
});

test('release-all-missing no longer claims it never touches the charts', () => {
  assert.ok(!/never touches Docker, snap, the website or the charts/.test(missing),
    'the header said the charts were out of scope; they are not any more, and a ' +
    'comment that contradicts the workflow is worse than none');
  assert.ok(/It DOES publish the Helm chart/.test(missing),
    'and it should say so, with why');
});

test('a chart that is already published is not republished', () => {
  assert.ok(/grep -qxF "    version: \$\{V\}\.0"/.test(missing),
    'the guard must match the published index exactly: -F because the dots in a ' +
    'version are regex wildcards otherwise, -x because a four-space-indented ' +
    'version line is an entry\'s own and a deeper one is the mongodb subchart\'s');
  assert.ok(/Re-publishing an existing version would re-tar the package/.test(missing),
    'and say why it matters - a re-tar changes the digest of a chart people have ' +
    'already pulled');
});

test('the missing-release charts job cannot run without a token that can push', () => {
  const at = missing.indexOf('\n  charts:\n');
  const body = missing.slice(at, missing.indexOf('\n  done:\n'));
  assert.ok(/No WEKAN_REPO_TOKEN/.test(body),
    'it pushes to another repository, so a missing token must stop it with a ' +
    'named warning rather than failing somewhere inside git');
  assert.ok(/skip=true/.test(body), 'and skip, not fail');
});

// ── the filename/contents check, run for real ───────────────────────────────

const hasPyYaml = spawnSync('python3', ['-c', 'import yaml'], { stdio: 'ignore' }).status === 0;

// The same shape release.sh produces: `tar -cvzf wekan-<v>.tgz wekan`, so the
// archive holds wekan/Chart.yaml.
function makePackage(file, declaredVersion) {
  const body = Buffer.from(
    `apiVersion: v2\nname: wekan\nversion: ${declaredVersion}\nappVersion: "x"\n`, 'utf8');
  const header = Buffer.alloc(512);
  header.write('wekan/Chart.yaml', 0, 'utf8');
  header.write('0000644\0', 100);
  header.write('0000000\0', 108);
  header.write('0000000\0', 116);
  header.write(body.length.toString(8).padStart(11, '0') + '\0', 124);
  header.write('00000000000\0', 136);
  header.write('        ', 148);
  header.write('0', 156);
  header.write('ustar\0', 257);
  header.write('00', 263);
  let sum = 0;
  for (const b of header) sum += b;
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  const pad = Buffer.alloc((512 - (body.length % 512)) % 512);
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([header, body, pad, Buffer.alloc(1024)])));
}

// The check as release-charts.sh runs it, lifted out of the script so the test
// exercises the real code rather than a copy of it.
function readDeclaredVersion(file) {
  const py = script.split("inside=\"$(TGZ=\"$TGZ\" python3 - <<'PYEOF'\n")[1].split("\nPYEOF")[0];
  return execFileSync('python3', ['-c', py], {
    env: { ...process.env, TGZ: file }, encoding: 'utf8',
  }).trim();
}

if (!hasPyYaml) {
  console.log('  -- python3 PyYAML not available; the package check is not exercised');
} else {
  test('the check reads the version out of the package, and it is the one that counts', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-relcharts-'));
    try {
      const good = path.join(dir, 'wekan-10.81.0.tgz');
      makePackage(good, '10.81.0');
      assert.strictEqual(readDeclaredVersion(good), '10.81.0',
        'a package whose name and contents agree reports that version');

      // The real 2023 slip: named 1.2.7, declaring 1.2.6.
      const bad = path.join(dir, 'wekan-1.2.7.tgz');
      makePackage(bad, '1.2.6');
      assert.strictEqual(readDeclaredVersion(bad), '1.2.6',
        'and a mis-named one reports what it really is, so the caller can refuse it');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

console.log(`\n${passed} passed`);
