'use strict';

// Guard: build.sh raises the open-file limit before it runs anything long.
// Run: node tests/buildScriptOpenFiles.test.cjs
//
// A full Playwright run died thirteen minutes in. macOS starts a shell with a
// soft limit of 256 open files; Meteor's bundled mongod says so at startup and
// is ignored -
//
//   "Soft rlimits for open file descriptors too low"
//   currentValue: 256, recommendedMinimum: 64000
//
// - and then hits it:
//
//   Error accepting new connection ... "Too many open files"
//   __directory_list_worker ... journal: directory-list: opendir
//   WT_PANIC: WiredTiger library panic ... the process must exit and restart
//   build.sh: line 1148: 22176 Abort trap: 6   mongod --port 3001 ...
//
// Every spec after that reported `connect ECONNREFUSED 127.0.0.1:3001`, which
// reads like the database never started rather than like it died - the real
// cause sitting 10,000 lines earlier in a different log file. Raising the limit
// costs nothing and needs no root: the hard limit is normally unlimited, so the
// process may raise its own soft limit and its children inherit it.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const build = fs.readFileSync(path.join(ROOT, 'build.sh'), 'utf8');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

/* Run the function out of build.sh in a shell with a given soft/hard limit. */
function runWith({ soft, hard, env = '' }) {
  const script = `
    ${hard ? `ulimit -n ${hard};` : ''}
    ulimit -S -n ${soft} 2>/dev/null
    eval "$(awk '/^function ensure_open_files\\(\\)\\{/,/^\\}/' build.sh)"
    ${env} ensure_open_files >/dev/null 2>&1
    ulimit -Sn
  `;
  return execFileSync('bash', ['-c', script], { cwd: ROOT, encoding: 'utf8' }).trim();
}

// ---- it exists, and it runs on every invocation -------------------------------

test('build.sh defines the check and calls it on every run', () => {
  assert.match(build, /function ensure_open_files\(\)\{/);
  const call = build.slice(build.indexOf('ensure_inotify_watches\n'));
  assert.match(call.slice(0, 400), /^ensure_open_files$/m,
    'it must run beside the inotify check, before any menu action');
});

test('build.sh is still valid shell', () => {
  execFileSync('bash', ['-n', 'build.sh'], { cwd: ROOT });
});

// ---- what it actually does ----------------------------------------------------

test('a 256-file shell is raised to what mongod asks for', () => {
  assert.equal(runWith({ soft: 256 }), '64000',
    'mongod\'s own recommendedMinimum; below it a long run aborts');
});

test('a limit that is already high enough is left alone', () => {
  assert.equal(runWith({ soft: 70000 }), '70000');
});

// Asking for more than the hard limit fails outright rather than clamping, so
// the function has to clamp for itself.
test('it clamps to the hard limit instead of failing', () => {
  assert.equal(runWith({ soft: 256, hard: 5000 }), '5000');
});

test('and it can be turned off', () => {
  assert.equal(runWith({ soft: 256, env: 'WEKAN_OPEN_FILES=0' }), '256');
});

// ---- the two details that cost a debugging round ------------------------------

// Plain `ulimit -n` sets soft AND hard. Lowering a hard limit is irreversible
// for that process, so a script using the plain form could not raise it again.
test('it sets the soft limit only (negative)', () => {
  const fn = build.slice(build.indexOf('function ensure_open_files'),
    build.indexOf('function ensure_inotify_watches'));
  assert.match(fn, /ulimit -S -n "\$try"/);
  assert.doesNotMatch(fn, /\n\s*if ulimit -n "\$try"/,
    'the plain form would lower the hard limit too');
});

test('it needs no sudo, unlike the inotify check beside it', () => {
  const fn = build.slice(build.indexOf('function ensure_open_files'),
    build.indexOf('function ensure_inotify_watches'));
  assert.doesNotMatch(fn, /sudo/,
    'a process may raise its own soft limit; that is the whole point');
});

console.log(`buildScriptOpenFiles: ${passed} tests passed`);
