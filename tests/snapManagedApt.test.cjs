const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');

test('managed APT recovery handles package 404s and rejects unrelated failures', () => {
  const result = spawnSync('python3', ['-B', 'tests/snap-managed-apt.py'], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('native and variant Snap jobs allow exactly one guarded recovery', () => {
  const workflow = readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
  for (const name of ['snap-native', 'snap-variants']) {
    const job = workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0];
    assert.ok(job, name);
    assert.equal((job.match(/uses: snapcore\/action-build@v1/g) || []).length, 2);
    assert.match(job, /id: build-first\s+continue-on-error: true/);
    assert.match(job, /Refresh stale managed APT indexes after a package 404\s+if: steps.build-first.outcome == 'failure'\s+run: sudo .*snap-refresh-managed-apt.py/);
    assert.match(job, /id: build-retry\s+if: steps.build-first.outcome == 'failure'\s+uses:/);
    assert.match(job, /BUILT_SNAP: \$\{\{ steps.build-first.outputs.snap \|\| steps.build-retry.outputs.snap \}\}/);
    assert.match(job, /test -n "\$BUILT_SNAP"\s+test -f "\$BUILT_SNAP"/);
    assert.match(job, /steps.build.outputs.snap/);
  }
});
