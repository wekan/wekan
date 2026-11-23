'use strict';
// "Push Snap to Store" (.github/workflows/snap-store.yml) and the script it
// runs for each snap (releases/snap-store-push.sh). On v13.20 every build was
// green, the snaps were on the GitHub release and the Snap Store kept the old
// version: the upload left the release to the store, which was still
// processing when the job stopped waiting. The script is run here against a
// fake `snapcraft`, through every way a push goes: a revision the store
// already has, a fresh upload, an upload cut off while processing, and a
// revision that never appears - which must FAIL.
// Run: node --test tests/snapStorePush.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const SCRIPT = path.join(ROOT, 'releases/snap-store-push.sh');

// A fake snapcraft: list-revisions prints what $FAKE_STORE holds (after
// $FAKE_APPEARS calls to it, for "still processing"), upload prints
// $FAKE_UPLOAD and exits $FAKE_UPLOAD_RC, every call is logged.
function setup(store, { upload = 'Revision 77 created for wekan', uploadRc = 0, appears = 0, uploads = null } = {}) {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snappush-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(dir, 'store.txt'), store);
  // One answer per upload, in order: the retry path of a store-side failure.
  (uploads || [{ out: upload, rc: uploadRc }]).forEach((answer, i) => {
    fs.writeFileSync(path.join(dir, `upload${i + 1}.txt`), answer.out);
    fs.writeFileSync(path.join(dir, `upload${i + 1}.rc`), String(answer.rc));
  });
  fs.writeFileSync(path.join(bin, 'snapcraft'), `#!/bin/bash
echo "$*" >> "${dir}/calls.txt"
case "$1" in
  # snapcraft 9: the old name only says it was renamed, and fails.
  list-revisions) echo "The 'list-revisions' command was renamed to 'revisions'." >&2; exit 1 ;;
  revisions)
    n=$(cat "${dir}/count" 2>/dev/null || echo 0); n=$((n + 1)); echo $n > "${dir}/count"
    echo "Rev.  Uploaded              Arches   Version  Channels"
    if [ "$n" -gt ${appears} ]; then cat "${dir}/store.txt"; fi ;;
  upload)
    u=$(cat "${dir}/ucount" 2>/dev/null || echo 0); u=$((u + 1)); echo $u > "${dir}/ucount"
    [ -f "${dir}/upload$u.txt" ] || u=$(ls "${dir}"/upload*.rc | wc -l)
    cat "${dir}/upload$u.txt"; echo; exit $(cat "${dir}/upload$u.rc") ;;
  release) echo "released" ;;
esac
`);
  fs.chmodSync(path.join(bin, 'snapcraft'), 0o755);
  const snap = path.join(dir, 'wekan_13.20_amd64.snap');
  fs.writeFileSync(snap, 'snap bytes');
  return { dir, snap, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SNAP_PUSH_POLL: '1', SNAP_PUSH_WAIT_BUDGET: '3',
    SNAP_PUSH_UPLOAD_BUDGET: '10', SNAP_PUSH_RETRY_DELAY: '0', GITHUB_STEP_SUMMARY: '' } };
}
// Released to every channel, each on its own.
const releasedAll = (calls, rev, name = 'wekan') => ['stable', 'candidate', 'beta', 'edge'].every(c => calls.includes(`release ${name} ${rev} ${c}`));
const run = (s, channels = 'stable,candidate,beta,edge') => {
  const result = spawnSync('bash', [SCRIPT, s.snap, channels], { env: s.env, encoding: 'utf8' });
  const calls = fs.existsSync(path.join(s.dir, 'calls.txt')) ? fs.readFileSync(path.join(s.dir, 'calls.txt'), 'utf8').trim().split('\n') : [];
  fs.rmSync(s.dir, { recursive: true, force: true });
  return { ...result, calls };
};

test('a version the store already has is released, not uploaded again', () => {
  const r = run(setup('55    2026-11-20T10:00:00Z  amd64    13.20    -\n54    2026-11-19T10:00:00Z  amd64    13.19    latest/stable\n'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(releasedAll(r.calls, 55, 'wekan'), r.calls.join('|'));
  assert.ok(!r.calls.some(call => call.startsWith('upload')), 'nothing is uploaded twice');
});

test('a new version is uploaded without --release, then its revision released by number', () => {
  const r = run(setup('54    2026-11-19T10:00:00Z  amd64    13.19    latest/stable\n'));
  assert.strictEqual(r.status, 0, r.stderr);
  const upload = r.calls.find(call => call.startsWith('upload'));
  assert.ok(upload && !upload.includes('--release'), upload);
  assert.ok(releasedAll(r.calls, 77, 'wekan'));
});

test('an upload cut off while processing waits for the revision and releases it', () => {
  const r = run(setup('80    2026-11-20T10:00:00Z  amd64    13.20    -\n', { upload: 'Status: processing', uploadRc: 124, appears: 2 }));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(releasedAll(r.calls, 80, 'wekan'), r.calls.join('|'));
});

test('negative: a revision that never appears fails the push, and another arch or version is not released', () => {
  const r = run(setup('90    2026-11-20T10:00:00Z  arm64    13.20    -\n91    2026-11-20T10:00:00Z  amd64    13.19    -\n',
    { upload: 'Status: processing', uploadRc: 124, appears: 0 }));
  assert.notStrictEqual(r.status, 0, 'red, not green with an old snap');
  assert.match(r.stderr, /did not appear on the Snap Store/);
  assert.ok(!r.calls.some(call => call.startsWith('release')), r.calls.join('|'));
  const badName = spawnSync('bash', [SCRIPT, '/nonexistent.snap'], { encoding: 'utf8' });
  assert.notStrictEqual(badName.status, 0);
});

test('a store-side 503 is uploaded again, then released', () => {
  const s503 = setup('', { uploads: [
    { out: 'Error: 503 Service Unavailable', rc: 1 },
    { out: 'Revision 81 created for wekan', rc: 0 }] });
  s503.env.SNAP_PUSH_UPLOAD_ATTEMPTS = '4';
  const r = run(s503);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.calls.filter(call => call.startsWith('upload')).length, 2, r.calls.join('|'));
  assert.ok(releasedAll(r.calls, 81, 'wekan'), r.calls.join('|'));
  assert.match(r.stdout, /uploading it again/);
});

test('"Error checking upload uniqueness" is a file the store holds: its listed revision is released, once', () => {
  // On v13.21 the store already had the file; uploading it again failed the same way every time.
  const listed = run(setup('82    2026-11-20T10:00:00Z  amd64    13.20    -\n', { appears: 1, uploads: [
    { out: 'Status: error while processing\n- binary_sha3_384: Error checking upload uniqueness.', rc: 1 }] }));
  assert.strictEqual(listed.status, 0, listed.stderr);
  assert.strictEqual(listed.calls.filter(call => call.startsWith('upload')).length, 1, 'not uploaded again');
  assert.ok(releasedAll(listed.calls, 82, 'wekan'), listed.calls.join('|'));
});

test('negative: a file the store holds and does not list (manual review) fails at once, saying so', () => {
  const held = run(setup('', { uploads: [{ out: '- binary_sha3_384: Error checking upload uniqueness.', rc: 1 }] }));
  assert.notStrictEqual(held.status, 0);
  assert.match(held.stderr, /already holds .* has not released it/);
  assert.match(held.stderr, /ReviewQueued/);
  assert.match(held.stderr, /forum\.snapcraft\.io\/c\/store-requests/);
  // Never uploaded again: the store takes a file once.
  assert.strictEqual(held.calls.filter(call => call.startsWith('upload')).length, 1);
  assert.ok(held.calls.filter(call => call.startsWith('list-revisions')).length <= 5, 'no hours of waiting');
  // A refusal that is not the store's fault fails at once too, without waiting or uploading again.
  const r = run(setup('', { uploads: [{ out: 'Error: you do not have permission to push to wekan', rc: 1 }] }));
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /did not take .* NOT released/);
  assert.strictEqual(r.calls.filter(call => call.startsWith('upload')).length, 1);
  // A 503 that keeps coming fails after the attempts, red.
  const s503 = setup('', { uploads: [{ out: 'Error: 503 Service Unavailable', rc: 1 }] });
  s503.env.SNAP_PUSH_UPLOAD_ATTEMPTS = '4';
  const again = run(s503);
  assert.notStrictEqual(again.status, 0);
  assert.strictEqual(again.calls.filter(call => call.startsWith('upload')).length, 4);
  // By default a file is uploaded once.
  const once = run(setup('', { uploads: [{ out: 'Error: 503 Service Unavailable', rc: 1 }] }));
  assert.strictEqual(once.calls.filter(call => call.startsWith('upload')).length, 1);
});

test('negative: a revision the store will not release yet (review) is reported as held', () => {
  const dir = setup('55    2026-11-20T10:00:00Z  amd64    13.20    -\n');
  // The fake's release says no, as the store does for a ReviewQueued revision.
  const fake = path.join(dir.dir, 'bin', 'snapcraft');
  fs.writeFileSync(fake, fs.readFileSync(fake, 'utf8').replace('release) echo "released" ;;', 'release) echo "Can\'t be released: ReviewQueued" >&2; exit 1 ;;'));
  const r = run(dir);
  assert.notStrictEqual(r.status, 0);
  // Each channel is asked on its own, and each refusal is in the log.
  assert.match(r.stderr, /did not release wekan 13\.20 \(amd64\), revision 55, to stable/);
  assert.match(r.stderr, /r55 not released to: stable candidate beta edge/);
});

test('negative: the renamed list-revisions is not used alone - the store\'s revision is found, nothing uploaded', () => {
  // v13.20 and v13.21: list-revisions failed, nothing was found, and the file was uploaded again.
  const r = run(setup('55    2026-11-20T10:00:00Z  amd64    13.20    -\n'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.calls.some(call => call.startsWith('revisions wekan')), r.calls.join('|'));
  assert.ok(!r.calls.some(call => call.startsWith('upload')));
  assert.ok(releasedAll(r.calls, 55, 'wekan'));
});

test('the newest store revision of every architecture is released; a held one is reported and the rest go on', () => {
  const NEWEST = path.join(ROOT, 'releases/snap-store-release-newest.sh');
  const go = (store, releaseScript) => {
    const s = setup(store);
    const fake = path.join(s.dir, 'bin', 'snapcraft');
    if (releaseScript) fs.writeFileSync(fake, fs.readFileSync(fake, 'utf8').replace('release) echo "released" ;;', releaseScript));
    const result = spawnSync('bash', [NEWEST, 'wekan', 'stable,candidate,beta,edge'], { env: s.env, encoding: 'utf8' });
    const calls = fs.readFileSync(path.join(s.dir, 'calls.txt'), 'utf8').trim().split('\n');
    fs.rmSync(s.dir, { recursive: true, force: true });
    return { ...result, calls };
  };
  const store = ['4793  2026-11-20T10:00:00Z  amd64    13.21    -', '4790  2026-11-19T10:00:00Z  amd64    13.20    -',
    '4794  2026-11-20T10:00:00Z  arm64    13.21    -', '4765  2026-10-01T10:00:00Z  s390x    13.16    latest/stable*', ''].join('\n');
  const ok = go(store);
  assert.strictEqual(ok.status, 0, ok.stderr);
  for (const rev of [4765, 4793, 4794]) assert.ok(releasedAll(ok.calls, rev), `${rev} to every channel`);
  assert.strictEqual(ok.calls.filter(call => call.startsWith('release')).length, 12, 'three revisions, four channels each');
  // Negative: the store refusing amd64 (review) is red, and arm64 is still released.
  // The store refuses amd64 on stable only: the other channels still get it.
  const held = go(store, 'release) if [ "$3" = 4793 ] && [ "$4" = stable ]; then echo "Can\'t be released: ReviewQueued" >&2; exit 1; fi; echo released ;;');
  assert.notStrictEqual(held.status, 0);
  assert.match(held.stderr, /did not release wekan 13\.21 \(amd64\), revision 4793, to stable/);
  assert.match(held.stderr, /not released: amd64:r4793:stable/);
  for (const c of ['candidate', 'beta', 'edge']) assert.ok(held.calls.includes(`release wekan 4793 ${c}`), c);
  assert.ok(releasedAll(held.calls, 4794, 'wekan'));
  // Negative: names and channels are checked before they reach snapcraft.
  assert.notStrictEqual(spawnSync('bash', [NEWEST, 'other'], { encoding: 'utf8' }).status, 0);
  assert.notStrictEqual(spawnSync('bash', [NEWEST, 'wekan', 'stable;rm'], { encoding: 'utf8' }).status, 0);
  // The workflow runs it for each snap, also when the push of a file failed.
  const wf = read('.github/workflows/snap-store.yml');
  assert.match(wf, /if: \$\{\{ always\(\) && steps\.snapcraft\.outcome == 'success' \}\}[\s\S]*?run: bash releases\/snap-store-release-newest\.sh "\$SNAP" "\$CHANNELS"/);
});

test('the workflow pushes all three snaps of the release it is given, called by Release All and by hand', () => {
  const wf = read('.github/workflows/snap-store.yml');
  assert.match(wf, /^name: Push Snap to Store$/m);
  assert.match(wf, /workflow_dispatch:/);
  assert.match(wf, /workflow_call:/);
  // Negative: no "after every Release All run, take the latest release" -
  // the v13.20 run of it took the previous release.
  assert.doesNotMatch(wf, /workflow_run:/);
  assert.doesNotMatch(wf, /github\.event\.inputs/);
  assert.match(wf, /INPUT_TAG: \$\{\{ inputs\.tag \}\}/);
  assert.match(wf, /default: 'wekan wekan-ondra wekan-gantt-gpl'/);
  assert.match(wf, /default: 'stable,candidate,beta,edge'/);
  assert.match(wf, /gh release download "\$TAG" --repo "\$GITHUB_REPOSITORY" --dir snaps --pattern "\$\{SNAP\}_\*\.snap"/);
  assert.match(wf, /has no \$\{SNAP\}_\*\.snap to push: its snap job did not attach one/);
  // A release without its variant snaps gets them made from its wekan snaps.
  assert.match(wf, /gh release download "\$TAG" --repo "\$GITHUB_REPOSITORY" --dir wekan-snaps --pattern "wekan_\*\.snap"/);
  assert.match(wf, /bash releases\/snap-rename\.sh "\$f" "\$SNAP" "\$title" snaps/);
  assert.match(wf, /wekan-ondra\) title='Wekan Ondra' ;;/);
  assert.match(wf, /bash releases\/snap-store-push\.sh "\$f" "\$CHANNELS"/);
  assert.match(wf, /SNAPCRAFT_STORE_CREDENTIALS: \$\{\{ secrets\.SNAP_AUTH \}\}/);
  // Negative: an input is checked before it reaches a shell command.
  assert.match(wf, /wekan\|wekan-ondra\|wekan-gantt-gpl\) ;; \*\) echo "::error::/);
  assert.match(wf, /case "\$tag" in v\[0-9\]\*\) ;;/);
  // The release job's processing warning names the workflow that finishes it.
  assert.match(read('releases/snap-upload-retry.sh'), /Push Snap to Store/);
});

test('Release All builds all three snaps, attaches them to the release and finishes their store release', () => {
  const all = read('.github/workflows/release-all.yml');
  const job = name => { const i = all.indexOf(`\n  ${name}:\n`); assert.ok(i > 0, name); const rest = all.slice(i + 1); const end = rest.search(/\n  [a-z0-9-]+:\n/); return rest.slice(0, end); };
  const store = job('snap-store');
  assert.match(store, /needs: \[prepare, snap-native, snap-launchpad, snap-variants\]/);
  assert.match(store, /uses: \.\/\.github\/workflows\/snap-store\.yml/);
  assert.match(store, /tag: v\$\{\{ needs\.prepare\.outputs\.version \}\}/);
  assert.match(store, /snaps: wekan wekan-ondra wekan-gantt-gpl/);
  assert.match(store, /channels: stable,candidate,beta,edge/);
  const variants = job('snap-variants');
  assert.match(variants, /permissions:\n\s+contents: write/);
  assert.match(variants, /github-release-upload\.sh" "\$\{GITHUB_REPOSITORY:-wekan\/wekan\}" "v\$\{VERSION\}" "\$\{STEP_BUILD_SNAP\}"/);
  for (const name of ['wekan-ondra', 'wekan-gantt-gpl']) {
    for (const arch of ['amd64', 'arm64']) assert.match(variants, new RegExp(`snapname: ${name}[\\s\\S]*?arch: ${arch}`));
  }
});

test('a complete release lists every snap, and Release All Missing makes the missing variants and pushes them', () => {
  const { spawnSync: sh } = require('node:child_process');
  const expected = sh('bash', [path.join(ROOT, 'releases/expected-assets.sh'), '13.21'], { encoding: 'utf8' }).stdout;
  for (const arch of ['amd64', 'arm64', 'armhf', 'ppc64el', 's390x', 'riscv64']) {
    assert.match(expected, new RegExp(`^snap wekan:${arch} wekan_13\\.21_${arch}\\.snap nosums$`, 'm'));
  }
  // 13.21 is before v13.30, when snap-launchpad started making the other
  // architectures' variants: tests/snapVariantsAllArches.test.cjs pins both.
  for (const name of ['wekan-ondra', 'wekan-gantt-gpl']) for (const arch of ['amd64', 'arm64']) {
    assert.match(expected, new RegExp(`^variant ${name}:${arch} ${name}_13\\.21_${arch}\\.snap nosums$`, 'm'));
  }
  const missing = read('.github/workflows/release-all-missing.yml');
  assert.match(missing, /for kind in extra appimage mac flatpak windows bun variant snap; do/);
  assert.match(missing, /bash releases\/snap-rename\.sh "source\/wekan_\$\{VERSION\}_\$\{arch\}\.snap" "\$name" "\$title" out/);
  assert.match(missing, /needs: \[plan, variants\]\n\s+if: \$\{\{ !cancelled\(\) && needs\.plan\.result == 'success' \}\}\n[\s\S]*?uses: \.\/\.github\/workflows\/snap-store\.yml/);
  // With no version: every incomplete release gets a run of its own.
  assert.match(missing, /bash releases\/release-missing-scan\.sh/);
  assert.match(missing, /gh workflow run release-all-missing\.yml .* -f version="\$version"/);
  // Negative: what this workflow cannot build no longer fails the plan, which
  // skipped every build that COULD have been made.
  const plan = missing.slice(missing.indexOf('\n  plan:\n'), missing.indexOf('\n  extra-arches:\n'));
  assert.match(plan, /still lacks \$\{STEP_PLAN_MANUAL\}/);
  assert.doesNotMatch(plan, /still lacks \$\{STEP_PLAN_MANUAL\}[^\n]*\n\s+exit 1/);
  assert.match(missing, /still lacks what only release-all\.yml builds/);
});

test('snap-rename.sh turns a wekan snap into a variant, name and title only; negative: anything else is refused', () => {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snaprename-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  // Fake squashfs tools: a "snap" is a directory tree written as a tar.
  fs.writeFileSync(path.join(bin, 'unsquashfs'), '#!/bin/bash\nwhile [ "$1" != "-d" ]; do shift; done; d=$2; src=${@: -1}; mkdir -p "$d"; tar -xf "$src" -C "$d"\n');
  fs.writeFileSync(path.join(bin, 'mksquashfs'), '#!/bin/bash\ntar -cf "$2" -C "$1" .\n');
  fs.writeFileSync(path.join(bin, 'snap'), '#!/bin/bash\nexit 1\n');
  for (const tool of ['unsquashfs', 'mksquashfs', 'snap']) fs.chmodSync(path.join(bin, tool), 0o755);
  const root = path.join(dir, 'root');
  fs.mkdirSync(path.join(root, 'meta'), { recursive: true });
  fs.writeFileSync(path.join(root, 'meta/snap.yaml'), "name: wekan\ntitle: WeKan\nversion: '13.21'\narchitectures:\n- amd64\n");
  fs.writeFileSync(path.join(root, 'program'), 'the same bytes');
  const snap = path.join(dir, 'wekan_13.21_amd64.snap');
  spawnSync('tar', ['-cf', snap, '-C', root, '.']);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  const out = path.join(dir, 'out');
  const r = spawnSync('bash', [path.join(ROOT, 'releases/snap-rename.sh'), snap, 'wekan-ondra', 'Wekan Ondra', out], { env, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const made = path.join(out, 'wekan-ondra_13.21_amd64.snap');
  assert.ok(fs.existsSync(made));
  const back = path.join(dir, 'back');
  fs.mkdirSync(back);
  spawnSync('tar', ['-xf', made, '-C', back]);
  assert.strictEqual(fs.readFileSync(path.join(back, 'meta/snap.yaml'), 'utf8'), "name: wekan-ondra\ntitle: Wekan Ondra\nversion: '13.21'\narchitectures:\n- amd64\n");
  assert.strictEqual(fs.readFileSync(path.join(back, 'program'), 'utf8'), 'the same bytes');
  const refused = (args, why) => {
    const x = spawnSync('bash', [path.join(ROOT, 'releases/snap-rename.sh'), ...args], { env, encoding: 'utf8' });
    assert.notStrictEqual(x.status, 0, why);
  };
  refused([snap, 'wekan', 'WeKan', out], 'not a variant name');
  refused([snap, 'other', 'X', out], 'not a variant name');
  refused([snap, 'wekan-ondra', 'a;rm -rf /', out], 'not a plain title');
  refused([made, 'wekan-gantt-gpl', 'Wekan Gantt GPL', out], 'not a wekan_ snap');
  fs.writeFileSync(path.join(root, 'meta/snap.yaml'), 'name: wekan-ondra\n');
  const notWekan = path.join(dir, 'wekan_13.21_arm64.snap');
  spawnSync('tar', ['-cf', notWekan, '-C', root, '.']);
  refused([notWekan, 'wekan-gantt-gpl', 'Wekan Gantt GPL', out], 'meta/snap.yaml is not wekan');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the scan lists the releases missing something, with a fake gh; negative: a complete one is not listed', () => {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snapscan-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  const complete = spawnSync('bash', [path.join(ROOT, 'releases/expected-assets.sh'), '13.21'], { encoding: 'utf8' }).stdout
    .trim().split('\n').flatMap(line => { const [, , asset, sums] = line.split(' '); return sums === 'sums' ? [asset, `${asset}.sha256sum`] : [asset]; });
  fs.writeFileSync(path.join(dir, 'v13.21'), complete.join('\n'));
  fs.writeFileSync(path.join(dir, 'v13.20'), complete.map(name => name.replace(/13\.21/g, '13.20')).filter(name => !/wekan-ondra/.test(name)).join('\n'));
  fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/bash
if [ "$2" = list ]; then printf 'v13.21\\nv13.20\\n'; else cat "${dir}/$3"; fi
`);
  fs.chmodSync(path.join(bin, 'gh'), 0o755);
  const r = spawnSync('bash', [path.join(ROOT, 'releases/release-missing-scan.sh'), 'wekan/wekan', '2'],
    { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout, '13.20 2\n', 'v13.20 lacks its two wekan-ondra snaps; v13.21 is complete');
  const bad = spawnSync('bash', [path.join(ROOT, 'releases/release-missing-scan.sh'), 'wekan/wekan', '2;x'], { encoding: 'utf8' });
  assert.notStrictEqual(bad.status, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});
