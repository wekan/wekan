'use strict';

// The release notes must say what actually went into each bundle - once, for
// every platform, with a version rather than the word "latest".
//
// The v10.77 notes got all three wrong at the same time, and each failure was
// silent: nothing errored, the table was simply not what it claimed to be.
//
//   Every row appeared TWICE. provenance-table.sh globbed
//   `provenance/**/*.tsv provenance/*.tsv`, and with globstar `**/` matches ZERO
//   or more directories - so the first pattern already covered the second and
//   every file was read twice.
//
//   amd64 was MISSING, the platform most people download. Its step runs
//   `cd .build` before `mkdir -p provenance`, so the rows went to
//   .build/provenance while upload-artifact looked at provenance/ - "No files
//   were found with the provided path: provenance/". Every other build job
//   records from the workspace root, which is why only amd64 was affected.
//
//   Six platforms said Version "latest". amd64, arm64, win64, win32, mac-arm64
//   and mac-x64 passed the literal string; only the extra-architecture job asked
//   which version latest actually was. "Which FerretDB did v10.77 ship" is the
//   one question that column exists to answer.
//
// Run: node tests/provenanceTable.test.cjs

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const TABLE = 'releases/provenance-table.sh';
const RECORD = 'releases/record-provenance.sh';
const RESOLVER = 'releases/ferretdb-latest-tag.sh';
const WORKFLOW = '.github/workflows/release-all.yml';

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const TAB = '\t';
const row = (bundle, what, src, version, checked, sha, url) =>
  [bundle, what, src, version, checked, sha, url].join(TAB);

// Run provenance-table.sh over a directory of .tsv files and return its output.
function tableFor(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-prov-'));
  try {
    fs.mkdirSync(path.join(dir, 'provenance'), { recursive: true });
    Object.entries(files).forEach(([name, lines]) => {
      const p = path.join(dir, 'provenance', name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, lines.join('\n') + '\n');
    });
    return execFileSync('bash', [path.join(repoRoot, TABLE)], {
      cwd: dir, encoding: 'utf8',
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const bodyRows = out => out.split('\n')
  .filter(l => l.startsWith('| ') && !/^\| (Bundle|-)/.test(l));

// ───────────────────────────────────────────── every row appears exactly once

test('THE BUG: each recorded row is printed once, not twice', () => {
  const out = tableFor({
    'amd64.tsv': [
      row('amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'aa11', 'https://nodejs.org/x'),
      row('amd64', 'FerretDB', 'wekan/FerretDB', 'v1.48.0', 'verified', 'bb22', 'https://gh/f'),
    ],
    's390x.tsv': [
      row('s390x', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'cc33', 'https://nodejs.org/s'),
    ],
  });
  assert.strictEqual(bodyRows(out).length, 3,
    'three rows recorded, so three rows printed');
});

test('...and one portable discovery command reads top-level and nested files', () => {
  // The row-counting test above passes either way now, because the dedup added
  // with this fix would swallow a doubled glob - which is what defence in depth
  // is for, and also why the cause needs its own guard or it can come back
  // invisibly. macOS Bash 3 has no globstar, so use one `find` command rather
  // than overlapping top-level and recursive glob patterns.
  const src = read(TABLE);
  assert.ok(/find provenance -type f -name '\*\.tsv'/.test(src),
    'one find command covers both directory depths');
  assert.ok(!/shopt[^\n]*globstar|provenance\/\*\*\/\*\.tsv/.test(src),
    'the Bash-version-dependent recursive glob does not return');
});

test('a file in a SUBDIRECTORY is still found - the glob covers both', () => {
  // download-artifact can land each artifact in its own directory. Collapsing to
  // one glob must not lose those.
  const out = tableFor({
    'amd64.tsv': [row('amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'aa11', 'u')],
    'provenance-arm64/arm64.tsv': [
      row('arm64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'bb22', 'u'),
    ],
  });
  const rows = bodyRows(out);
  assert.strictEqual(rows.length, 2);
  assert.ok(rows.some(r => r.startsWith('| amd64 ')), 'the top-level file');
  assert.ok(rows.some(r => r.startsWith('| arm64 ')), 'and the nested one');
});

test('the same fact recorded twice collapses to one row', () => {
  // A retried step, or a job that ran again, records an identical line. It is
  // one fact and nothing tells the copies apart.
  const same = row('amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'aa11', 'u');
  const out = tableFor({ 'a.tsv': [same], 'b.tsv': [same] });
  assert.strictEqual(bodyRows(out).length, 1);
});

test('NEGATIVE: a real disagreement is NOT collapsed', () => {
  // Two rows sharing bundle and binary but differing elsewhere are not a
  // duplicate - they are two answers to "which Node.js went into amd64", and
  // hiding one at random is worse than showing both. This is why the dedup is
  // on the whole line and not on the sort key.
  const out = tableFor({
    'a.tsv': [
      row('amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'aa11', 'u1'),
      row('amd64', 'Node.js', 'wekan/node-patches', 'v24.19.1', 'verified', 'bb22', 'u2'),
    ],
  });
  assert.strictEqual(bodyRows(out).length, 2,
    'both must survive, so the disagreement is visible');
});

test('rows are grouped by bundle, then by binary', () => {
  const out = tableFor({
    'x.tsv': [
      row('s390x', 'Node.js', 'nodejs.org', 'v1', 'verified', 'a', 'u'),
      row('amd64', 'Node.js', 'nodejs.org', 'v1', 'verified', 'b', 'u'),
      row('amd64', 'FerretDB', 'wekan/FerretDB', 'v1', 'verified', 'c', 'u'),
    ],
  });
  const bundles = bodyRows(out).map(r => r.split('|')[1].trim());
  assert.deepStrictEqual(bundles, ['amd64', 'amd64', 's390x']);
  const binaries = bodyRows(out).slice(0, 2).map(r => r.split('|')[2].trim());
  assert.deepStrictEqual(binaries, ['FerretDB', 'Node.js']);
});

test('a source with no checksum says so instead of showing a blank', () => {
  const out = tableFor({
    'x.tsv': [row('s390x', 'Node.js', 'nodejs.org', 'v1', 'no checksum published', '-', 'u')],
  });
  const r = bodyRows(out)[0];
  assert.ok(/no checksum published/.test(r));
  assert.ok(/\| — \|/.test(r), 'and an em dash, not an empty cell');
  assert.ok(!/`-`/.test(r), 'not a literal dash in backticks');
});

test('no rows at all is a note, not a failed release', () => {
  const out = tableFor({});
  assert.ok(/no build job recorded/.test(out));
  assert.ok(!/\| Bundle \|/.test(out), 'and no empty table');
});

test('the table names the right fork', () => {
  // It said [wekan/node](https://github.com/wekan/node); the binaries come from
  // wekan/node-patches, which is also what the rows themselves link to.
  const src = read(TABLE);
  assert.ok(/wekan\/node-patches/.test(src));
  assert.ok(!/github\.com\/wekan\/node\)/.test(src),
    'the old wrong link is gone');
});

// ─────────────────────────────────────── amd64 records where the upload looks

test('THE BUG: amd64 records into the workspace, not into .build', () => {
  const src = read(WORKFLOW);
  // The amd64 zip step, from its `cd .build` to the end of the run block.
  const step = src.slice(src.indexOf('- name: Create amd64 zip'));
  const upTo = step.slice(0, step.indexOf('- uses: actions/upload-artifact'));
  assert.ok(/cd \.build/.test(upTo), 'the step still cds, which is what made this bite');

  const calls = upTo.split('\n').filter(l => /PROVENANCE_FILE=/.test(l));
  assert.strictEqual(calls.length, 2, 'Node.js and FerretDB are both recorded');
  calls.forEach(l => assert.ok(/GITHUB_WORKSPACE/.test(l),
    `a relative provenance path inside "cd .build" writes where nothing reads:\n    ${l.trim()}`));
  assert.ok(/mkdir -p "\$GITHUB_WORKSPACE\/provenance"/.test(upTo),
    'and the directory is made there too');
});

test('every build job that records also uploads what it recorded', () => {
  const src = read(WORKFLOW);
  const recorded = [...src.matchAll(/PROVENANCE_FILE=\S*?provenance\/([a-z0-9-]+)\.tsv/g)]
    .map(m => m[1]);
  assert.ok(recorded.length >= 6, `expected several recording sites, found ${recorded.length}`);
  new Set(recorded).forEach(arch => {
    assert.ok(src.includes(`name: provenance-${arch}`),
      `${arch} records provenance but no job uploads it`);
  });
});

// ──────────────────────────────────────────── the version is a version

test('THE BUG: no site records the literal string "latest" as the version', () => {
  const src = read(WORKFLOW);
  assert.ok(!/'wekan\/FerretDB' 'latest'/.test(src),
    'a Version column reading "latest" answers nothing a year later');
});

test('every FerretDB provenance call resolves the tag first', () => {
  const src = read(WORKFLOW);
  const lines = src.split('\n');
  const calls = lines
    .map((l, i) => ({ l, i }))
    .filter(x => /'FerretDB'/.test(x.l) && /wekan\/FerretDB/.test(x.l));
  assert.ok(calls.length >= 6, `expected the FerretDB rows, found ${calls.length}`);
  calls.forEach(c => {
    assert.ok(/\$\{FERRET_TAG:-latest\}/.test(c.l),
      `${WORKFLOW}:${c.i + 1} does not use the resolved tag:\n    ${c.l.trim()}`);
    // ...and FERRET_TAG has to have been set just above it.
    const above = lines.slice(Math.max(0, c.i - 4), c.i).join('\n');
    assert.ok(/FERRET_TAG="\$\(bash [^\n]*ferretdb-latest-tag\.sh/.test(above),
      `${WORKFLOW}:${c.i + 1} uses FERRET_TAG without resolving it above`);
  });
});

test('there is ONE implementation of "which version is latest"', () => {
  const src = read(WORKFLOW);
  assert.ok(!/api\.github\.com\/repos\/wekan\/FerretDB/.test(src),
    'the API call is inlined again; it belongs in the resolver only');
  assert.ok(fs.existsSync(path.join(repoRoot, RESOLVER)), `${RESOLVER} exists`);
});

test('the resolver never fails its caller', () => {
  // It feeds a release note. A rate-limited or offline runner must degrade to
  // the old behaviour, not fail a build that produced a perfectly good bundle.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-ftag-'));
  try {
    const out = execFileSync('bash', [path.join(repoRoot, RESOLVER)], {
      encoding: 'utf8',
      env: {
        ...process.env,
        FERRETDB_TAG_CACHE: path.join(dir, 'cache'),
        http_proxy: 'http://127.0.0.1:9',
        https_proxy: 'http://127.0.0.1:9',
        HTTPS_PROXY: 'http://127.0.0.1:9',
      },
    });
    assert.strictEqual(out.trim(), '', 'it prints nothing when it cannot find out');
  } catch (e) {
    assert.fail(`the resolver exited non-zero with no network: ${e.status}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the resolver refuses to print anything that is not a tag', () => {
  // Whatever it prints goes into a markdown cell. An error page, an HTML body
  // or a rate-limit message must fall through to the caller's :-latest.
  const src = read(RESOLVER);
  assert.ok(/v\[0-9\]\*\)/.test(src), 'the shape of the answer is checked');
  assert.ok(/GITHUB_TOKEN|GH_TOKEN/.test(src),
    'and it authenticates, so a shared 60/hour limit is not what makes it fail');
});

// ─────────────────────────────────── the record script itself

test('a recorded row has the seven fields the table reads', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-rec-'));
  try {
    const file = path.join(dir, 'p.tsv');
    execFileSync('bash', [path.join(repoRoot, RECORD),
      'amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'https://x', 'abc123'],
      { env: { ...process.env, PROVENANCE_FILE: file }, encoding: 'utf8' });
    const fields = fs.readFileSync(file, 'utf8').trim().split(TAB);
    assert.strictEqual(fields.length, 7);
    assert.deepStrictEqual(fields.slice(0, 6),
      ['amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'verified', 'abc123']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an omitted checksum is recorded as unpublished, not as verified', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-rec-'));
  try {
    const file = path.join(dir, 'p.tsv');
    execFileSync('bash', [path.join(repoRoot, RECORD),
      'amd64', 'Node.js', 'nodejs.org', 'v24.19.0', 'https://x'],
      { env: { ...process.env, PROVENANCE_FILE: file }, encoding: 'utf8' });
    const fields = fs.readFileSync(file, 'utf8').trim().split(TAB);
    assert.strictEqual(fields[4], 'no checksum published');
    assert.strictEqual(fields[5], '-');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ────────────────────────── a diagnostic upload cannot fail a good build

test('THE BUG: snapcraft build logs are renamed before they are uploaded', () => {
  // snapcraft names a remote-build log after the recipe and an ISO timestamp:
  //     snapcraft-wekan-f82a93c2…_s390x_2026-08-09T11:39:05.txt
  // and upload-artifact REFUSES a colon, because NTFS cannot hold one. That
  // failed the whole job for s390x, ppc64el and riscv64 in v10.77 AFTER all
  // three snaps had built and downloaded on attempt 1 - "Remote build s390x
  // succeeded on attempt 1" is in the same log as "FAILED snap-launchpad
  // s390x".
  const src = read(WORKFLOW);
  const step = src.slice(src.indexOf('mkdir -p snap-logs'));
  const upTo = step.slice(0, step.indexOf('- name: Push'));
  assert.ok(/\$\{base\/\/:\/-\}/.test(upTo),
    'the colons in the log name must be replaced, or the upload refuses the file');
  assert.ok(!/cp -f snapcraft-wekan-\*\.txt snap-logs\/\s/.test(upTo),
    'the plain copy that kept the colons is gone');
});

test('and that upload can never fail the job it is diagnosing', () => {
  const src = read(WORKFLOW);
  const i = src.indexOf('name: snap-launchpad-logs-');
  assert.ok(i > 0, 'the log upload step is still there');
  // Look back at the step this `with:` belongs to.
  const step = src.slice(src.lastIndexOf('- uses: actions/upload-artifact', i), i);
  assert.ok(/continue-on-error:\s*true/.test(step),
    'the snap is the deliverable; saving its log must not be able to fail it');
});

test('THE BUG: a call inside a step that cds uses an ABSOLUTE script path', () => {
  // `cd .build` makes `bash releases/record-provenance.sh` resolve against
  // .build/, which has no releases/ - so every run printed
  //     bash: releases/record-provenance.sh: No such file or directory
  // and the `|| true` on the end swallowed it. amd64 had never recorded
  // anything; the only visible symptom was its absence from the table, which
  // is why the missing directory looked like the whole story.
  //
  // It only became loud when the FerretDB tag lookup was added: that is an
  // ASSIGNMENT, so under `set -e` a missing script ends the step, and v10.78's
  // amd64 build failed with exit 127 after the zip was built and checksummed.
  const lines = read(WORKFLOW).split('\n');
  const offenders = [];
  lines.forEach((ln, i) => {
    if (!/record-provenance\.sh|ferretdb-latest-tag\.sh/.test(ln)) return;
    if (/^\s*#/.test(ln)) return;
    // Walk back to this step's header, then look for a cd inside it.
    let s = i;
    while (s > 0 && !/^      - (name|uses):/.test(lines[s])) s -= 1;
    const step = lines.slice(s, i);
    const cds = step.filter(l => /^\s*cd\s+\S/.test(l) && !/^\s*#/.test(l));
    if (!cds.length) return;                       // runs from the workspace root
    if (/\$\{?GITHUB_WORKSPACE\}?/.test(ln)) return;  // already absolute
    offenders.push(`${WORKFLOW}:${i + 1} after \`${cds[cds.length - 1].trim()}\`:\n    ${ln.trim()}`);
  });
  assert.deepStrictEqual(offenders, [],
    'a relative path after a cd resolves somewhere else entirely');
});

test('a release-note lookup can never fail the build it annotates', () => {
  // `VAR="$(cmd)"` under `set -e` exits the step when cmd fails, and every
  // GitHub `run:` is `bash -e`. The bundle is the deliverable; which version
  // string ends up in a markdown cell is not worth failing it for.
  const lines = read(WORKFLOW).split('\n');
  lines.forEach((ln, i) => {
    if (!/FERRET_TAG="\$\(/.test(ln)) return;
    assert.ok(/\|\| true\)"/.test(ln),
      `${WORKFLOW}:${i + 1} lets a lookup end the step:\n    ${ln.trim()}`);
  });
});

// ───────────────────── the Snap Store can fail for reasons that are not ours

test('a store PROCESSING failure is retried; a rejected snap is not', () => {
  // The store accepts the file, scans it, and can then answer:
  //     Status: error while processing
  //     Issues while processing snap:
  //     - binary_sha3_384: Error checking upload uniqueness.
  // which is the store failing its OWN duplicate check on a digest it just
  // computed. It hit riscv64, ppc64el and s390x in one v10.78 run, each after a
  // Launchpad build that had SUCCEEDED, so three good snaps were lost at once
  // and the printed advice was about credentials and ACLs - none of which
  // applied.
  //
  // Retrying must stay narrow. A rejected file, bad credentials or a missing
  // ACL will be rejected identically three times, and retrying those only
  // buries the one message that says what to fix.
  const src = read(WORKFLOW);
  const step = src.slice(src.indexOf('Uploading $f to the Snap Store'));
  const upTo = step.slice(0, step.indexOf('- name:'));

  assert.ok(/Error checking upload uniqueness/.test(upTo),
    'the store-side processing failure is not recognised');
  assert.ok(/up_attempts/.test(upTo) && /sleep/.test(upTo),
    'there is no retry with a backoff');

  // The classifier itself, applied to the messages that must NOT be retried.
  const m = upTo.match(/grep -qiE '([^']+)'/);
  assert.ok(m, 'the retryable-error pattern is gone');
  const re = new RegExp(m[1], 'i');
  assert.ok(re.test('- binary_sha3_384: Error checking upload uniqueness.'),
    'the real v10.78 failure must be retried');
  assert.ok(re.test('Status: error while processing'));
  [
    'wekan_10.78_s390x.snap is not a valid file',
    'Credentials could not be parsed',
    'Error 403: forbidden - no permission for snap name',
    'Error 401: unauthorized',
  ].forEach(line => assert.ok(!re.test(line),
    `"${line}" must NOT be retried - three identical rejections hide the fix`));
});

test('and it says the snap is fine when the store is not', () => {
  // The failure that remains after three attempts is still not a problem with
  // the snap, and the message has to say so - otherwise the next person goes
  // looking through a build that succeeded.
  const src = read(WORKFLOW);
  const step = src.slice(src.indexOf('Uploading $f to the Snap Store'));
  const upTo = step.slice(0, step.indexOf('- name:'));
  assert.ok(/Nothing in this repository needs to change/.test(upTo),
    'the give-up message must not send somebody debugging a good build');
});

console.log(`\n${passed} tests passed`);
