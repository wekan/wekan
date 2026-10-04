'use strict';

// Guard: every release file is attached to the GitHub Release by the job that
// BUILT it, as that job's last step - and a cancelled run still attaches every
// file that had finished building.
// Run: node tests/releaseAttachOwnFiles.test.cjs
//
// WHY. release-all.yml used to hold files back: the `release` job waited for
// BOTH base builds and then uploaded amd64 and arm64 together, and AppImage.yml,
// mac.yml, Flatpak.yml and windows.yml each had a final `publish` job that
// downloaded every architecture's artifact and uploaded them all at the end.
// A file that was finished an hour earlier was not downloadable until the
// slowest sibling was done - and when the maintainer cancelled a run, NOTHING
// was attached at all, because the collecting jobs never started.
//
// The rule now, for release-all.yml, release-all-missing.yml and the reusable
// workflows they call:
//   * a step that attaches release files sits in the job that built them, and
//     only reporting steps ("Job result", "Say ...") come after it;
//   * it runs on `always()` plus "the build/check step succeeded", so a cancel
//     that arrives after the build still attaches the file;
//   * no job collects other jobs' release artifacts (download-artifact with a
//     `pattern:` or into assets/) and uploads them;
//   * the final jobs (what is missing, release notes, checks) run on always()
//     too - not !cancelled() - and upload nothing.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const WORKFLOWS = [
  '.github/workflows/release-all.yml',
  '.github/workflows/release-all-missing.yml',
  '.github/workflows/AppImage.yml',
  '.github/workflows/mac.yml',
  '.github/workflows/Flatpak.yml',
  '.github/workflows/windows.yml',
];

// The one upload exempt from the always() rule, and why: the Nextcloud app
// tarball is packaged, attached and registered with the App Store in ONE step,
// because the store downloads it from that release URL straight away. It is
// still attached by the job that made it, immediately - only not on Cancel,
// since registering an app with a store is exactly what Cancel must stop.
const NOT_ON_CANCEL = { nextcloud: 'packaged, attached and registered with the Nextcloud App Store in one step' };

function jobs(text) {
  const start = text.indexOf('\njobs:\n');
  assert.notStrictEqual(start, -1, 'workflow has a jobs: section');
  const body = text.slice(start);
  const heads = [...body.matchAll(/\n {2}([a-z0-9-]+):\n/g)];
  return heads.map((m, i) => ({
    name: m[1],
    body: body.slice(m.index + 1, i + 1 < heads.length ? heads[i + 1].index + 1 : undefined),
  }));
}

function steps(jobBody) {
  const at = jobBody.indexOf('\n    steps:\n');
  if (at === -1) return [];
  const parts = jobBody.slice(at + 11).split(/\n(?= {6}- )/);
  return parts.filter(p => /^ {6}- /.test(p)).map(text => {
    const name = (text.match(/^ {6}- name:\s*(.+)$/m) || text.match(/^ {8}name:\s*(.+)$/m) || [])[1] || '';
    const id = (text.match(/^ {8}id:\s*(\S+)/m) || text.match(/^ {6}- id:\s*(\S+)/m) || [])[1] || '';
    const cond = (text.match(/^ {8}if:\s*(.+)$/m) || [])[1] || '';
    // Only the commands, not the comments, decide what a step does.
    const code = text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
    return { name, id, cond, code, text };
  });
}

const uploads = code => /gh release upload|github-release-upload\.sh/.test(code);
const REPORTING = /^(Job result|Say )/;

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseAttachOwnFiles:');

const attachJobs = [];
for (const file of WORKFLOWS) {
  for (const job of jobs(read(file))) {
    const list = steps(job.body);
    const idx = list.findIndex(s => uploads(s.code));
    if (idx !== -1) attachJobs.push({ file, job, list, idx });
  }
}

test('the jobs that build release files are the ones that attach them', () => {
  const names = attachJobs.map(a => `${path.basename(a.file)}:${a.job.name}`);
  for (const want of [
    'release-all.yml:build-amd64', 'release-all.yml:build-arm64',
    'release-all.yml:build-win64', 'release-all.yml:build-win-arm64', 'release-all.yml:build-win32',
    'release-all.yml:build-mac-arm64', 'release-all.yml:build-mac-x64',
    'release-all.yml:build-extra-arches', 'release-all.yml:build-sandstorm',
    'release-all.yml:snap-native', 'release-all.yml:snap-launchpad',
    'release-all-missing.yml:extra-arches',
    'AppImage.yml:build', 'mac.yml:build', 'Flatpak.yml:build', 'windows.yml:build',
  ]) {
    assert.ok(names.includes(want), `${want} must attach its own files; attaching jobs: ${names.join(', ')}`);
  }
});

test('the attach step is the LAST real step of the job that built the file', () => {
  for (const { file, job, list, idx } of attachJobs) {
    const later = list.slice(idx + 1).filter(s => !REPORTING.test(s.name));
    assert.deepStrictEqual(later.map(s => s.name || s.text.split('\n')[0].trim()), [],
      `${path.basename(file)}:${job.name} does work after attaching its files; the attach must come `
      + 'right after the build and its checks, with only reporting steps after it');
  }
});

test('an attach step runs on always() + its build step succeeded, so Cancel still attaches finished files', () => {
  for (const { file, job, list, idx } of attachJobs) {
    if (job.name in NOT_ON_CANCEL) continue;
    // Every upload step in the job (snap-launchpad has one, amd64 has one; none has more).
    for (const step of list.filter(s => uploads(s.code))) {
      const where = `${path.basename(file)}:${job.name} "${step.name}"`;
      assert.ok(/^\$\{\{ always\(\) && /.test(step.cond),
        `${where} must run on always() - a step without it is skipped by Cancel even after the file was built. Got: ${step.cond || '(no if:)'}`);
      // ...and still only when the file was really built: always() alone would
      // try to upload after a failed build.
      const ref = step.cond.match(/steps\.([\w-]+)\.(?:outcome == 'success'|outputs\.built == 'true')/);
      assert.ok(ref, `${where} must also require its build/check step to have succeeded. Got: ${step.cond}`);
      assert.ok(list.slice(0, idx + 1).some(s => s.id === ref[1]) || list.some(s => s.id === ref[1]),
        `${where} refers to steps.${ref[1]}, which is not a step of this job`);
    }
  }
});

test('negative: no job collects other jobs\' release artifacts and uploads them at the end', () => {
  for (const { file, job } of attachJobs) {
    const where = `${path.basename(file)}:${job.name}`;
    // A bundle-amd64 download is the INPUT a repack job builds its own file
    // from (arm64, win, mac, extra arches) - one named artifact. What the old
    // aggregate jobs did was collect MANY with a pattern, into assets/.
    assert.ok(!/download-artifact@[\s\S]{0,200}?\n\s*pattern:/.test(job.body),
      `${where} downloads artifacts by pattern and uploads: that is an aggregate upload at the end`);
    assert.ok(!/path:\s*assets\b/.test(job.body) && !/\bassets\/\*/.test(job.body),
      `${where} collects files into assets/ and uploads them: each build job must attach its own`);
  }
});

test('negative: the final jobs upload nothing and are not skipped by Cancel', () => {
  const finals = [
    ['.github/workflows/release-all.yml', 'release-notes', "needs.build-amd64.result == 'success'"],
    ['.github/workflows/release-all-missing.yml', 'done', "needs.plan.result == 'success'"],
    ['.github/workflows/AppImage.yml', 'publish', "needs.release.result == 'success'"],
    ['.github/workflows/mac.yml', 'publish', "needs.release.result == 'success'"],
    ['.github/workflows/Flatpak.yml', 'publish', "needs.release.result == 'success'"],
  ];
  for (const [file, name, requires] of finals) {
    const job = jobs(read(file)).find(j => j.name === name);
    assert.ok(job, `${file} has a ${name} job`);
    const cond = (job.body.match(/^ {4}if:\s*(.+)$/m) || [])[1] || '';
    assert.ok(/\balways\(\)/.test(cond) && !/!cancelled\(\)/.test(cond),
      `${path.basename(file)}:${name} must run on always(), not !cancelled(), so a cancelled run still reports what was attached. Got: ${cond}`);
    assert.ok(cond.includes(requires),
      `${path.basename(file)}:${name} must still require the job that made or found the release (${requires}). Got: ${cond}`);
    const code = job.body.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
    assert.ok(!uploads(code), `${path.basename(file)}:${name} must not upload release files - the build jobs attach their own`);
  }
  // windows.yml has one build and no aggregate job at all any more.
  assert.ok(!jobs(read('.github/workflows/windows.yml')).some(j => j.name === 'publish'),
    'windows.yml must not bring back a separate publish job that uploads the EXE later');
  // release-all.yml's `release` job only checks; see releaseArchSkipAndBaseAttach.
  const rel = jobs(read('.github/workflows/release-all.yml')).find(j => j.name === 'release');
  assert.ok(!uploads(rel.body.split('\n').filter(l => !/^\s*#/.test(l)).join('\n')),
    'the release job must not upload the base bundles; build-amd64/arm64 attach their own');
});

test('build-amd64 creates the release right before attaching the first file', () => {
  const amd = jobs(read('.github/workflows/release-all.yml')).find(j => j.name === 'build-amd64');
  const list = steps(amd.body);
  const ensure = list.findIndex(s => /ensure-github-release\.sh/.test(s.code));
  const attach = list.findIndex(s => uploads(s.code));
  assert.ok(ensure !== -1 && attach !== -1 && ensure < attach,
    'build-amd64 must make sure the release exists, then attach');
  assert.strictEqual(list[ensure].cond, list[attach].cond,
    'both run under the same always() condition, so a cancelled run creates the release it attaches to');
});

// ── The two helpers, run with a fake gh ────────────────────────────────────────

function withFixture(fn) {
  const tmpRoot = path.join(root, '.tools', 'tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'attach-own-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// A version CHANGELOG.md really has a section for, read rather than hard-coded:
// the file keeps only the current month, so any fixed number moves out.
const NEWEST = (read('CHANGELOG.md').match(/^# v(\d+\.\d+) /m) || [])[1];

function runEnsure(scenario) {
  return withFixture(dir => {
    const script = `
gh() { printf '%s\\n' "$*" >> "$FIXTURE/calls"
  case "$1 $2" in
    "release view") [ "$SCENARIO" = exists ] ;;
    "release create") return 0 ;;
  esac
}
sleep() { :; }
export -f gh sleep
bash "$ENSURE" test/repo "$NEWEST"
`;
    const r = spawnSync('bash', ['-c', script], {
      cwd: dir, encoding: 'utf8', timeout: 20000,
      env: { ...process.env, SCENARIO: scenario, FIXTURE: dir, TMPDIR: dir, NEWEST,
        ENSURE: path.join(root, 'releases/ensure-github-release.sh') },
    });
    const calls = fs.existsSync(path.join(dir, 'calls')) ? fs.readFileSync(path.join(dir, 'calls'), 'utf8') : '';
    return { status: r.status, out: r.stdout + r.stderr, calls };
  });
}

test('ensure-github-release.sh creates a missing release from the CHANGELOG notes', () => {
  const r = runEnsure('missing');
  assert.strictEqual(r.status, 0, r.out);
  assert.ok(r.calls.includes(`release create --repo test/repo v${NEWEST} --verify-tag --title v${NEWEST} --notes-file `), r.calls);
});

test('negative: ensure-github-release.sh never re-creates a release that exists', () => {
  const r = runEnsure('exists');
  assert.strictEqual(r.status, 0, r.out);
  assert.doesNotMatch(r.calls, /release create/);
});

test('the uploader runs where there is no GNU timeout (macOS runners, Windows Git Bash)', () => {
  withFixture(dir => {
    fs.writeFileSync(path.join(dir, 'a.zip'), 'zip!');
    const script = `
# A timeout that is NOT GNU's, like Windows' System32 one: it must be skipped.
timeout() { echo "ERROR: Invalid syntax." >&2; return 1; }
gtimeout() { return 127; }
gh() { if [ "$2" = upload ]; then echo up >> "$FIXTURE/calls"; else printf 'a.zip\\t4\\n'; fi; }
sleep() { :; }
export -f timeout gtimeout gh sleep
bash "$UPLOAD" test/repo v12.19 a.zip
`;
    const r = spawnSync('bash', ['-c', script], {
      cwd: dir, encoding: 'utf8', timeout: 20000,
      env: { ...process.env, FIXTURE: dir, TMPDIR: dir, UPLOAD: path.join(root, 'releases/github-release-upload.sh') },
    });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /all artifacts attached/);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'calls'), 'utf8').trim(), 'up');
  });
});

console.log(`\nreleaseAttachOwnFiles: all ${passed} tests passed (${os.platform()})`);
