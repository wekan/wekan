'use strict';
// #6552: the WeKan snap's Caddy raises its own open-file limit at every start.
// Run: node tests/snapCaddyNofile6552.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const helper = path.join(ROOT, 'snap-src/bin/raise-nofile-limit');
const run = (soft, env = {}) => {
  const result = spawnSync('bash', ['-c', `ulimit -Sn ${soft} && source "${helper}" && raise_nofile_limit >/dev/null 2>&1; ulimit -Sn; ulimit -Hn`],
    { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const [after, hard] = result.stdout.trim().split('\n');
  return { after, hard };
};

// Positive: the soft limit is raised to the hard one.
const raised = run(64);
assert.equal(raised.after, raised.hard, 'soft limit raised to the hard limit');
// CADDY_NOFILE asks for less, and never for more than the hard limit.
assert.equal(run(64, { CADDY_NOFILE: '128' }).after, '128');
if (raised.hard !== 'unlimited') {
  assert.equal(run(64, { CADDY_NOFILE: String(Number(raised.hard) + 100000) }).after, raised.hard, 'capped at hard');
}
// Negative: a value that is not a number is ignored, and the helper never fails the start.
assert.equal(run(64, { CADDY_NOFILE: '12; rm -rf /' }).after, raised.hard);
// Wiring: the snap's Caddy service sources it before starting Caddy.
const control = fs.readFileSync(path.join(ROOT, 'snap-src/bin/caddy-control'), 'utf8');
assert.ok(control.indexOf('raise_nofile_limit') !== -1 && control.indexOf('raise_nofile_limit') < control.indexOf('caddy run'));
assert.ok(fs.statSync(helper).mode & 0o111, 'executable, like the other snap scripts');
console.log('snapCaddyNofile6552: ok');
