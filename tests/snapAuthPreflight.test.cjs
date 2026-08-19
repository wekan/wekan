'use strict';

// SNAP_AUTH is checked against the Snap Store BEFORE any snap is built.
//
// v10.53 built the amd64 snap, the arm64 snap and both variant snaps - forty
// minutes of runner time across four jobs - and then every one of them died at
// the upload with the same red X, because the credential was not usable.
// Nothing before that point had asked the store anything: the per-job check
// only tested that the secret is non-empty and longer than 100 characters,
// which a revoked or long-expired credential also is.
//
// `snapcraft whoami` is the question, asked once, in a job every snap job waits
// for. It also names a cause the upload-time error never mentioned: an exported
// login EXPIRES, one year by default, so a credential that worked for a year
// stops without anything having changed.
//
// Run: node tests/snapAuthPreflight.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');

// The job's body: from its name to the next job at the same indent.
const at = wf.indexOf('\n  snap-auth-check:\n');
const job = at === -1 ? '' : wf.slice(at, wf.indexOf('\n  snap-native:\n', at));

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('snapAuthPreflight:');

test('the check exists, and runs before anything is built', () => {
  assert.ok(job, 'snap-auth-check must be a job');
  // Only `prepare` - NOT `release`, and certainly not a build job, or it would
  // no longer be running first.
  assert.ok(/^    needs: \[prepare\]$/m.test(job), 'it waits only for prepare');
  assert.ok(!/snapcore\/action-build/.test(job), 'and builds nothing itself');
});

test('and every job that publishes a snap waits for it', () => {
  for (const snapJob of ['snap-native', 'snap-launchpad', 'snap-variants']) {
    const start = wf.indexOf(`\n  ${snapJob}:\n`);
    assert.notStrictEqual(start, -1, `${snapJob} must exist`);
    const head = wf.slice(start, start + 1200);
    assert.ok(/needs: \[[^\n\]]*snap-auth-check[^\n\]]*\]/.test(head),
      `${snapJob} must wait for snap-auth-check`);
  }
  // ...and a job that has nothing to do with snaps must NOT wait for it: that
  // would hold a bundle back on a credential it never uses.
  const sandstorm = wf.slice(wf.indexOf('\n  build-sandstorm:\n'));
  assert.ok(/needs: \[prepare, release\]\n/.test(sandstorm.slice(0, 400)),
    'build-sandstorm publishes no snap and must not wait for the check');
});

test('it asks the STORE, not just the shape of the secret', () => {
  assert.ok(/snapcraft whoami/.test(job), 'whoami is the question');
  assert.ok(/SNAPCRAFT_STORE_CREDENTIALS="\$SNAP_AUTH"/.test(job),
    'asked with the credential under test');
  assert.ok(/sudo snap install snapcraft --classic/.test(job),
    'which needs snapcraft on the runner');
});

test('and names each cause, including the one nobody had mentioned', () => {
  // The upload-time message listed two causes. There is a third, and it is the
  // likeliest for a credential that used to work.
  assert.ok(/xpired/.test(job), 'EXPIRY must be named');
  assert.ok(/could not be parsed/.test(job), 'unparseable must be named');
  assert.ok(/401|403/.test(job), 'refused-by-the-store must be named');
  // Every branch ends in a ::error:: line, or the job would fail silently.
  const errors = (job.match(/::error::/g) || []).length;
  assert.ok(errors >= 5, `expected an error message per cause, found ${errors}`);
  // And every one of them says how to fix it.
  assert.ok(/snapcraft export-login --snaps wekan,wekan-ondra,wekan-gantt-gpl/.test(job),
    'the fix is the export-login command');
});

test('it checks the credential covers every snap name this release publishes', () => {
  // A credential exported for `wekan` alone lets snap-native succeed and
  // snap-variants fail, which reads as two unrelated bugs.
  assert.ok(/SNAP_NAMES: wekan wekan-ondra wekan-gantt-gpl/.test(job),
    'all three names are checked');
  // `packages: no restrictions` is a credential scoped to every snap the
  // account owns, which covers all three.
  assert.ok(/no restrictions/.test(job), 'an unrestricted credential passes');

  // The three names must be the ones the workflow really publishes.
  assert.ok(/name: wekan-ondra/.test(wf) && /name: wekan-gantt-gpl/.test(wf),
    'the variants are renamed to those names');
  const snapcraft = fs.readFileSync(path.join(ROOT, 'snapcraft.yaml'), 'utf8');
  assert.ok(/^name: wekan$/m.test(snapcraft), 'and the default snap is wekan');
});

test('the credential itself is never printed', () => {
  // Only what the STORE said about it. `echo "$SNAP_AUTH"` here would put a
  // publishing credential in a public log.
  assert.ok(!/echo "\$SNAP_AUTH"/.test(job), 'the secret must not be echoed');
  assert.ok(/echo "\$out"/.test(job), "only whoami's answer is");
});

test('a shell that keeps going long enough to classify the failure', () => {
  // `set -e` around the whoami call would kill the step at the failure, before
  // the case that says WHICH failure it was.
  assert.ok(/set \+e\n\s*out="\$\(SNAPCRAFT_STORE_CREDENTIALS/.test(job),
    'the whoami call must not abort the step');
  assert.ok(/rc=\$\?/.test(job), 'its exit code is kept');
  assert.ok(/set -e\n/.test(job), 'and the guard restored afterwards');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nsnapAuthPreflight: ${passed} tests passed`);
