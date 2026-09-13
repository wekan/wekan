'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const source = fs.readFileSync(path.join(__dirname, '../build.sh'), 'utf8');
const helpers = source.slice(source.indexOf('everything_ancestor_pids() {'),
  source.indexOf('\nrelease_everything_lock() {'));
// Exercise the real cleanup function against a synthetic process tree. No
// process is signalled and no database or publishing command is executed.
const result = spawnSync('bash', ['-c', `
${helpers}
ps() { case "$*" in *"-p $$") echo 101;; *"-p 101") echo 1;; *"-p 1") echo 0;; esac; }
pgrep() { printf '%s\\n' 101 1 202; }
everything_expand_descendants() { printf '%s\\n' "$1"; }
everything_pid_running() { [ "$1" = 202 ] && [ "$terminated" != yes ]; }
kill() { printf 'signal:%s\\n' "$*"; terminated=yes; }
sleep() { :; }
kill_meteor_on_port() { return 0; }
docker_available() { return 1; }
cleanup_everything_processes
`], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /signal:-TERM(?: 202)+\n/,
  'an unrelated abandoned test process must still be stopped');
assert.doesNotMatch(result.stdout, /signal:.*\b(?:101|1)\b/,
  'launcher and ancestor PIDs must never be signalled');
console.log('everythingCleanupAncestors: launcher ancestry protected; abandoned tests still cleaned up');
