'use strict';

// Guard for releases/backfill-charts.sh - the script that answers "which WeKan
// releases should the Helm index list?" and repairs what release-charts.sh left.
// Run: node tests/backfillCharts.test.cjs
//
// Two facts about the live wekan/charts index this is written against:
//
//  * It is INCOMPLETE. An entry is written once, by release-charts.sh, during
//    the release it belongs to - so a release whose charts job did not run
//    leaves a hole nothing ever fills. v10.80 is one of those (its charts job
//    was skipped when a cancelled build-mac-x64 cancelled the run) and it is far
//    from alone: 216 of 690 releases have an entry.
//
//  * It has DUPLICATES, and they are the dangerous kind. 9.36.0 appears four
//    times and 10.30.0 twice, every copy with a DIFFERENT digest and the SAME
//    url - because release-charts.sh PREPENDS an entry each time it runs, so
//    re-running a release duplicated its version instead of replacing it. At
//    most one of those digests can belong to the wekan-9.36.0.tgz that is
//    actually served; a helm client that picks another fails the integrity check
//    on a file that is perfectly good.
//
// The dedup rule is checked here by running the script's own embedded python
// against a synthesised index, because the rule is the part with a decision in
// it: the entry whose digest MATCHES the package on disk wins - not the newest,
// which is only the fallback for when no package is there to compare against.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'releases/backfill-charts.sh');
const script = fs.readFileSync(scriptPath, 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the script exists and is executable', () => {
  assert.ok(fs.existsSync(scriptPath), 'releases/backfill-charts.sh is missing');
  assert.ok(fs.statSync(scriptPath).mode & 0o111, 'backfill-charts.sh must be executable');
});

test('it writes nothing without --apply, and pushes nothing without --push', () => {
  assert.ok(/if \[ "\$APPLY" != true \]; then/.test(script),
    'the plan must return before anything is written');
  assert.ok(/if \[ "\$PUSH" != true \]; then/.test(script),
    'even --apply must not push a rewritten public index without --push');
  const applyGate = script.indexOf('if [ "$APPLY" != true ]; then');
  const helmPackage = script.indexOf('helm package');
  const gitPush = script.indexOf('git push origin gh-pages');
  assert.ok(applyGate !== -1 && helmPackage > applyGate,
    'nothing may be packaged before the --apply gate');
  assert.ok(gitPush > script.indexOf('if [ "$PUSH" != true ]; then'),
    'the push must come after the --push gate');
});

test('a release with no container image is omitted, not listed', () => {
  assert.ok(/omit\s*=\s*\[v for v, ok in zip\(candidates, have_image\) if ok is False\]/.test(script),
    'a release whose image does not exist must land in "omit"');
  assert.ok(/return None/.test(script) && /if ok is None/.test(script),
    'a network failure must be "unknown", not "no image" - otherwise a hiccup ' +
    'omits a release that has one');
});

test('an already-published chart is never repackaged', () => {
  assert.ok(/if f"\{ver\}\.0" in published:\s*\n\s*keep\.append\(ver\)/.test(script),
    'a version already in the index goes to "keep"; repackaging it would change ' +
    'a digest that helm clients have already seen');
});

test('the published-chart scan reads entry versions, not dependency versions', () => {
  assert.ok(/\^ \{4\}version:/.test(script),
    "the index's own entries are at four spaces; the mongodb subchart's " +
    "version: is at six, and a loose \\s* counts 0.7.2 as a published WeKan chart");
});

// The dedup rule, run for real.
function runDedup(dir) {
  const body = script.split("python3 - <<'PYEOF'\nimport hashlib")[1].split('\nPYEOF')[0];
  const py = path.join(dir, 'dedup.py');
  fs.writeFileSync(py, 'import hashlib' + body);
  return execFileSync('python3', [py], { cwd: dir, encoding: 'utf8' });
}

// A minimal index in the real shape: entry keys at four spaces, a dependency
// block at six, and the "  wekan:" header the script looks for.
function makeIndex(entries) {
  const head = 'apiVersion: v1\nentries:\n  wekan:\n';
  const body = entries.map(e =>
    `  - apiVersion: v2\n` +
    `    appVersion: "${e.version}"\n` +
    `    created: "${e.created}"\n` +
    `    dependencies:\n` +
    `    - name: mongodb\n` +
    `      version: 0.7.2\n` +
    `    digest: ${e.digest}\n` +
    `    name: wekan\n` +
    `    urls:\n` +
    `    - https://wekan.github.io/charts/wekan-${e.version}.tgz\n` +
    `    version: ${e.version}\n`).join('');
  return head + body + 'generated: "2026-08-11T00:00:00.000000+00:00"\n';
}

function readVersions(file) {
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(l => /^ {4}version: /.test(l))
    .map(l => l.trim().replace('version: ', ''));
}

test('a duplicated version is reduced to the entry whose digest matches the package', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-charts-'));
  try {
    const pkg = Buffer.from('pretend chart package');
    const realDigest = crypto.createHash('sha256').update(pkg).digest('hex');
    fs.writeFileSync(path.join(dir, 'wekan-9.36.0.tgz'), pkg);

    // The matching digest is on the OLDEST copy on purpose: if "newest wins" were
    // the rule rather than the fallback, this is the case that would expose it.
    fs.writeFileSync(path.join(dir, 'index.yaml'), makeIndex([
      { version: '10.79.0', created: '2026-08-10T02:46:52+00:00', digest: 'a'.repeat(64) },
      { version: '9.36.0',  created: '2026-06-11T03:41:02+00:00', digest: 'b'.repeat(64) },
      { version: '9.36.0',  created: '2026-06-11T02:26:50+00:00', digest: 'c'.repeat(64) },
      { version: '9.36.0',  created: '2026-06-10T21:20:06+00:00', digest: realDigest },
    ]));

    const out = runDedup(dir);
    const versions = readVersions(path.join(dir, 'index.yaml'));
    assert.deepStrictEqual(versions, ['10.79.0', '9.36.0'],
      'one entry per version must remain, and the untouched version must survive');
    const kept = fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8');
    assert.ok(kept.includes(realDigest),
      'the entry kept for 9.36.0 must be the one whose digest is the digest of ' +
      'wekan-9.36.0.tgz - a helm client checks the package against it');
    assert.ok(kept.includes('2026-06-10T21:20:06'),
      'which here is the OLDEST copy: the digest decides, the timestamp does not');
    assert.ok(/2 duplicate\(s\) removed/.test(out), `expected a report of 2 removals, got: ${out}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('with no package to compare against, the newest duplicate is the fallback', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-charts-'));
  try {
    // No wekan-10.30.0.tgz in the directory, so nothing can be verified.
    fs.writeFileSync(path.join(dir, 'index.yaml'), makeIndex([
      { version: '10.30.0', created: '2026-07-23T12:50:37+00:00', digest: 'd'.repeat(64) },
      { version: '10.30.0', created: '2026-07-23T11:58:18+00:00', digest: 'e'.repeat(64) },
    ]));
    runDedup(dir);
    const kept = fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8');
    assert.deepStrictEqual(readVersions(path.join(dir, 'index.yaml')), ['10.30.0']);
    assert.ok(kept.includes('2026-07-23T12:50:37'), 'the newest is the fallback');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an index with no duplicates is left exactly as it was', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-charts-'));
  try {
    const before = makeIndex([
      { version: '10.79.0', created: '2026-08-10T02:46:52+00:00', digest: 'a'.repeat(64) },
      { version: '10.78.0', created: '2026-08-09T02:46:52+00:00', digest: 'b'.repeat(64) },
    ]);
    fs.writeFileSync(path.join(dir, 'index.yaml'), before);
    const out = runDedup(dir);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'index.yaml'), 'utf8'), before,
      'a clean index must not be rewritten at all - no reformatting, no reordering');
    assert.ok(/0 duplicate\(s\) removed/.test(out), out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the charts job reports the gap on every release', () => {
  const workflow = fs.readFileSync(
    path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');
  assert.ok(/backfill-charts\.sh \| tee -a "\$GITHUB_STEP_SUMMARY"/.test(workflow),
    'the charts job should print the plan into the run summary, so a hole in the ' +
    'index is visible the release it appears in');
  // Comments may name `--apply --push` as the command to run by hand; what must
  // not exist is a line that actually RUNS it.
  const invocations = workflow.split('\n')
    .filter(l => l.includes('backfill-charts.sh'))
    .filter(l => !/^\s*#/.test(l.trim()) && !l.trim().startsWith('#'));
  const publishing = invocations.filter(l => /--push|--apply/.test(l));
  assert.deepStrictEqual(publishing, [],
    'the workflow must never package or push a rewritten index by itself:\n  ' +
    publishing.join('\n  '));
});

console.log(`\n${passed} passed`);
