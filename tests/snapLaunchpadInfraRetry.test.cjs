'use strict';

// v12.56 ppc64el snap: attempt 1's Launchpad builder lost its TLS connection
// cloning our source, and attempts 2 and 3, a minute apart, both met
// Launchpad's "HTTP Error 503: Service Unavailable" - the job gave up after 20
// minutes of a five-hour budget. An attempt that failed on Launchpad
// infrastructure now earns another (up to max_attempts) after a growing pause.
// This runs the workflow's own infra_failure() against logs shaped like that
// run's, and against the failures that must stay at three attempts.
// Run: node tests/snapLaunchpadInfraRetry.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8');
const step = wf.slice(wf.indexOf('- name: Build the ${{ matrix.arch }} snap on Launchpad'));
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The function exactly as the workflow has it, de-indented from the YAML block.
const fnText = /\n( +)infra_failure\(\) \{[\s\S]*?\n\1\}\n/.exec(step)[0]
  .split('\n').map(l => l.replace(/^ {10}/, '')).join('\n');

function infraFailure({ remoteLog = '', buildLogs = {}, oldBuildLogs = {} }) {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'lp-'));
  try {
    for (const [name, text] of Object.entries(oldBuildLogs)) {
      fs.writeFileSync(path.join(dir, name), text);
      fs.utimesSync(path.join(dir, name), new Date(2000, 0, 1), new Date(2000, 0, 1));
    }
    fs.writeFileSync(path.join(dir, 'marker'), '');
    fs.utimesSync(path.join(dir, 'marker'), new Date(2010, 0, 1), new Date(2010, 0, 1));
    for (const [name, text] of Object.entries(buildLogs)) fs.writeFileSync(path.join(dir, name), text);
    fs.writeFileSync(path.join(dir, 'remote.log'), remoteLog);
    const script = `cd "${dir}"; remote_log=remote.log; attempt_marker=marker\n${fnText}\ninfra_failure`;
    return spawnSync('bash', ['-c', script]).status === 0;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('v12.56 attempt 1: the builder lost TLS cloning our source', () => {
  assert.equal(infraFailure({ buildLogs: { 'snapcraft-wekan-x_ppc64el.txt':
    "Cloning into 'snapcraft-wekan-f66b'...\nerror: RPC failed; curl 56 GnuTLS recv error (-110): The TLS connection was non-properly terminated.\nfatal: early EOF\nBuild failed\n" } }), true);
});

test('v12.56 attempts 2 and 3: Launchpad answered 503 / Timeout', () => {
  assert.equal(infraFailure({ remoteLog: 'lazr.restfulclient.errors.ServerError: HTTP Error 503: Service Unavailable\n<title>Error: Timeout</title>' }), true);
});

test('the build farm\'s package proxy failing is infrastructure too', () => {
  assert.equal(infraFailure({ buildLogs: { 'snapcraft-wekan-x_s390x.txt': 'Failed to fetch package: 501  Gateway error [IP: 10.10.10.1 8222]' } }), true);
});

test('negative: a missing stage-package is WeKan\'s, and keeps three attempts', () => {
  assert.equal(infraFailure({ buildLogs: { 'snapcraft-wekan-x_armhf.txt': "Stage package not found in part 'wekan': libssl3\nBuild failed" } }), false);
});

test('negative: an earlier attempt\'s log does not count for this one', () => {
  assert.equal(infraFailure({ oldBuildLogs: { 'snapcraft-wekan-old_ppc64el.txt': 'error: RPC failed; curl 56' } }), false);
});

test('negative: a 4xx from Launchpad is not taken for an outage', () => {
  assert.equal(infraFailure({ remoteLog: 'HTTP Error 400: Bad Request' }), false);
});

test('the loop grows only on infrastructure failures, within a cap and the deadline', () => {
  assert.match(step, /attempts=3\n/);
  assert.match(step, /max_attempts=6\n/);
  assert.match(step, /i=0\n\s+while \[ "\$i" -lt "\$attempts" \]; do\n\s+i=\$\(\(i \+ 1\)\)/, 'a loop whose bound can grow');
  assert.doesNotMatch(step, /for i in \$\(seq 1 "\$attempts"\)/, 'negative: not a bound fixed at the start');
  const grow = step.slice(step.indexOf('if infra_failure; then'), step.indexOf('if [ "$i" -lt "$attempts" ]; then'));
  assert.match(grow, /\[ "\$attempts" -lt "\$max_attempts" \] && \[ "\$i" -ge "\$attempts" \] && attempts=\$\(\(attempts \+ 1\)\)/);
  assert.match(grow, /pause=\$\(\(300 \* i\)\)/, 'a pause that grows');
  assert.match(grow, /deadline - SECONDS - 600/, 'and never runs past the five-hour budget');
  assert.match(step, /sleep "\$pause"/);
});

console.log(`snapLaunchpadInfraRetry: ${passed} tests passed`);
