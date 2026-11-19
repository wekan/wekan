'use strict';
// v13.18: the Snap Store kept every wekan and wekan-gantt-gpl revision in
// "Status: processing" for hours. `snapcraft upload` polls that with no limit,
// so the jobs ran into timeout-minutes and GitHub cancelled them, reporting a
// failed release for snaps that had uploaded fine. releases/snap-upload-retry.sh
// now bounds one upload: a revision the store accepted is left for the store to
// release (uploading again would queue a duplicate), and an upload cut off
// before the store accepted it is retried like any other failed upload.
// Run: node --test tests/snapUploadProcessingBudget.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const SCRIPT = path.join(root, 'releases/snap-upload-retry.sh');
const tmpBase = path.join(root, '.tools/tmp');

// Run the script with a fake `snapcraft` whose body is `fake` (bash).
function run(fake, env = {}) {
  fs.mkdirSync(tmpBase, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpBase, 'snap-upload-'));
  try {
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'snapcraft'),
      `#!/usr/bin/env bash\necho x >> "${dir}/calls"\n${fake}\n`, { mode: 0o755 });
    const snap = path.join(dir, 'wekan_1.0_amd64.snap');
    fs.writeFileSync(snap, 'snap');
    const summary = path.join(dir, 'summary');
    const r = spawnSync('bash', [SCRIPT, snap, 'stable,edge'], {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_STEP_SUMMARY: summary,
        SNAP_UPLOAD_RETRY_DELAY: '0', SNAP_UPLOAD_PROCESSING_BUDGET: '2', ...env },
    });
    const calls = fs.existsSync(path.join(dir, 'calls'))
      ? fs.readFileSync(path.join(dir, 'calls'), 'utf8').trim().split('\n').length : 0;
    const summaryText = fs.existsSync(summary) ? fs.readFileSync(summary, 'utf8') : '';
    return { status: r.status, out: `${r.stdout}${r.stderr}`, calls, summary: summaryText };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Short sleeps, so the fake ends promptly once timeout signals it.
const forever = line => `${line}\nwhile :; do echo "Status: processing"; sleep 0.2; done`;

test('a revision still processing after the budget is left to the store, not uploaded again', () => {
  const r = run(forever('echo "Uploading... (--->)"'));
  assert.strictEqual(r.status, 0, r.out);
  assert.strictEqual(r.calls, 1, 'uploaded once');
  assert.match(r.out, /::warning::The Snap Store accepted .* was still processing it after 2s/);
  assert.match(r.summary, /^PROCESSING .*still processing/m);
});

test('negative: an upload cut off before the store accepted it is retried, then fails', () => {
  const r = run('echo "Uploading... (--->)"; while :; do sleep 0.2; done', { SNAP_UPLOAD_ATTEMPTS: '2' });
  assert.strictEqual(r.status, 10, r.out);
  assert.strictEqual(r.calls, 2, 'retried');
  assert.doesNotMatch(r.out, /still processing/);
});

test('negative: a normal upload and a refused upload behave as before', () => {
  const ok = run('echo "Status: ready to release!"; echo "Revision 1 created"');
  assert.strictEqual(ok.status, 0, ok.out);
  assert.strictEqual(ok.calls, 1);
  assert.strictEqual(ok.summary, '');
  const refused = run('echo "is not a valid file"; exit 64');
  assert.strictEqual(refused.status, 11, refused.out);
  assert.strictEqual(refused.calls, 1);
  const badBudget = run('exit 0', { SNAP_UPLOAD_PROCESSING_BUDGET: 'soon' });
  assert.strictEqual(badBudget.status, 2);
  assert.strictEqual(badBudget.calls, 0);
});

test('every Snap Store upload in the release workflows goes through the bounded script, within the job limit', () => {
  const wfDir = path.join(root, '.github/workflows');
  const script = fs.readFileSync(SCRIPT, 'utf8');
  const budget = Number(script.match(/SNAP_UPLOAD_PROCESSING_BUDGET:-(\d+)/)[1]);
  assert.match(script, /timeout -k \d+ "\$budget" snapcraft upload/);
  let jobs = 0;
  for (const name of fs.readdirSync(wfDir).filter(f => /\.ya?ml$/.test(f))) {
    const text = fs.readFileSync(path.join(wfDir, name), 'utf8');
    const lines = text.split('\n').filter(l => !/^\s*#/.test(l));
    assert.deepStrictEqual(lines.filter(l => /snapcraft (upload|push)\b/.test(l)), [], `${name} uploads without the budget`);
    // Each job that uploads has room for the budget after its build.
    for (const job of text.split(/\n  (?=[a-z][\w-]*:\n)/)) {
      if (!job.includes('snap-upload-retry.sh')) continue;
      jobs += 1;
      const limit = Number((job.match(/timeout-minutes: (\d+)/) || [])[1]);
      assert.ok(limit * 60 > budget * 2, `${name}: ${job.slice(0, 30)} timeout ${limit} min`);
    }
  }
  // snap-native, snap-launchpad and snap-variants.
  assert.ok(jobs >= 3, `found ${jobs} uploading jobs`);
});
