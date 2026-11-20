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
function setup(store, { upload = 'Revision 77 created for wekan', uploadRc = 0, appears = 0 } = {}) {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snappush-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(dir, 'store.txt'), store);
  fs.writeFileSync(path.join(bin, 'snapcraft'), `#!/bin/bash
echo "$*" >> "${dir}/calls.txt"
case "$1" in
  list-revisions)
    n=$(cat "${dir}/count" 2>/dev/null || echo 0); n=$((n + 1)); echo $n > "${dir}/count"
    echo "Rev.  Uploaded              Arches   Version  Channels"
    if [ "$n" -gt ${appears} ]; then cat "${dir}/store.txt"; fi ;;
  upload) echo "${upload}"; exit ${uploadRc} ;;
  release) echo "released" ;;
esac
`);
  fs.chmodSync(path.join(bin, 'snapcraft'), 0o755);
  const snap = path.join(dir, 'wekan_13.20_amd64.snap');
  fs.writeFileSync(snap, 'snap bytes');
  return { dir, snap, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SNAP_PUSH_POLL: '1', SNAP_PUSH_WAIT_BUDGET: '3',
    SNAP_PUSH_UPLOAD_BUDGET: '10', GITHUB_STEP_SUMMARY: '' } };
}
const run = (s, channels = 'stable,candidate,beta,edge') => {
  const result = spawnSync('bash', [SCRIPT, s.snap, channels], { env: s.env, encoding: 'utf8' });
  const calls = fs.existsSync(path.join(s.dir, 'calls.txt')) ? fs.readFileSync(path.join(s.dir, 'calls.txt'), 'utf8').trim().split('\n') : [];
  fs.rmSync(s.dir, { recursive: true, force: true });
  return { ...result, calls };
};

test('a version the store already has is released, not uploaded again', () => {
  const r = run(setup('55    2026-11-20T10:00:00Z  amd64    13.20    -\n54    2026-11-19T10:00:00Z  amd64    13.19    latest/stable\n'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.calls.includes('release wekan 55 stable,candidate,beta,edge'), r.calls.join('|'));
  assert.ok(!r.calls.some(call => call.startsWith('upload')), 'nothing is uploaded twice');
});

test('a new version is uploaded without --release, then its revision released by number', () => {
  const r = run(setup('54    2026-11-19T10:00:00Z  amd64    13.19    latest/stable\n'));
  assert.strictEqual(r.status, 0, r.stderr);
  const upload = r.calls.find(call => call.startsWith('upload'));
  assert.ok(upload && !upload.includes('--release'), upload);
  assert.ok(r.calls.includes('release wekan 77 stable,candidate,beta,edge'));
});

test('an upload cut off while processing waits for the revision and releases it', () => {
  const r = run(setup('80    2026-11-20T10:00:00Z  amd64    13.20    -\n', { upload: 'Status: processing', uploadRc: 124, appears: 2 }));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.calls.includes('release wekan 80 stable,candidate,beta,edge'), r.calls.join('|'));
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

test('the workflow pushes all three snaps from a release to every channel, after each release and by hand', () => {
  const wf = read('.github/workflows/snap-store.yml');
  assert.match(wf, /^name: Push Snap to Store$/m);
  assert.match(wf, /workflow_dispatch:/);
  assert.match(wf, /workflows: \['Release All Platforms'\]/);
  assert.match(wf, /default: 'wekan wekan-ondra wekan-gantt-gpl'/);
  assert.match(wf, /default: 'stable,candidate,beta,edge'/);
  assert.match(wf, /gh release download "\$TAG" --repo "\$GITHUB_REPOSITORY" --dir snaps --pattern "\$\{SNAP\}_\*\.snap"/);
  assert.match(wf, /bash releases\/snap-store-push\.sh "\$f" "\$CHANNELS"/);
  assert.match(wf, /SNAPCRAFT_STORE_CREDENTIALS: \$\{\{ secrets\.SNAP_AUTH \}\}/);
  // Negative: an input is checked before it reaches a shell command.
  assert.match(wf, /wekan\|wekan-ondra\|wekan-gantt-gpl\) ;; \*\) echo "::error::/);
  assert.match(wf, /case "\$tag" in v\[0-9\]\*\) ;;/);
  // The release job's processing warning names the workflow that finishes it.
  assert.match(read('releases/snap-upload-retry.sh'), /Push Snap to Store/);
});
