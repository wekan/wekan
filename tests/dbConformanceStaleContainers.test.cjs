'use strict';

// releases/db-conformance.sh removes the containers an interrupted run left
// behind - and removed the database of a run that was still GOING: a speed
// test beside a conformance run lost its MySQL in the middle of its queries
// ("connection refused") and its MariaDB while loading. A container and a
// network now carry the process id of their run, and one whose run is alive is
// kept. This runs the script's own functions against a fake docker.
// Run: node tests/dbConformanceStaleContainers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'releases/db-conformance.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dbConformanceStaleContainers:');

test('every container and network the script makes is labelled with its run', () => {
  const runs = script.match(/docker_exec run -d [^\n]*/g) || [];
  assert.ok(runs.length >= 2, 'the database and FerretDB 2 containers');
  for (const r of runs) assert.match(r, /--label "\$OWNER_LABEL"/, r);
  const nets = script.match(/docker_exec network create [^\n]*/g) || [];
  assert.ok(nets.length >= 1);
  for (const n of nets) assert.match(n, /--label "\$OWNER_LABEL"/, n);
  assert.match(script, /OWNER_LABEL="\$OWNER_LABEL_KEY=\$\$"/);
});

test('negative: nothing is removed without asking whether its run has ended', () => {
  assert.match(script, /stale="\$\(left_behind container /);
  assert.match(script, /stale_nets="\$\(left_behind network /);
  assert.doesNotMatch(script, /stale="\$\(docker_exec ps/, 'the old unconditional removal');
  // Where ps is refused (a sandboxed macOS app), every live run looked dead.
  assert.match(script, /ps -o command= -p "\$1" 2>\/dev\/null \|\|\s*\n\s*pgrep -lf/);
});

// The functions themselves, from the script, against a fake docker_exec.
const start = script.indexOf('OWNER_LABEL_KEY=');
const end = script.indexOf('# shellcheck disable=SC2046', start);
const functions = script.slice(start, end);

function leftBehind(labels, kind = 'container') {
  const fake = `docker_exec() {
    case "$*" in
${Object.entries(labels).map(([id, pid]) => `      *" ${id}") echo "${pid}" ;;`).join('\n')}
    esac
  }`;
  const bash = `${fake}\n${functions}\nleft_behind ${kind} ${Object.keys(labels).join(' ')}`;
  return execFileSync('bash', ['-c', bash], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n').filter(Boolean);
}

// A live "run": a bash whose command line names db-conformance.sh.
const tmp = path.join(root, '.tools', 'tmp');
fs.mkdirSync(tmp, { recursive: true });
const fakeRun = path.join(tmp, `db-conformance.sh-test-${process.pid}`);
fs.writeFileSync(fakeRun, 'sleep 30\n');
const live = spawn('bash', [fakeRun], { stdio: 'ignore' });
try {
  // An unrelated live process: alive, but not a conformance run.
  const other = spawn('sleep', ['30'], { stdio: 'ignore' });
  try {
    test('the run\'s own containers are kept while it runs, in both kinds', () => {
      for (const kind of ['container', 'network']) {
        const out = leftBehind({ aaa: String(live.pid), bbb: '', ccc: '999999', ddd: String(other.pid) }, kind);
        assert.deepStrictEqual(out, ['bbb', 'ccc', 'ddd'], kind);
      }
    });
    test('negative: an unlabelled, dead-run or reused-pid container is still removed', () => {
      assert.deepStrictEqual(leftBehind({ old: '' }), ['old'], 'made before the label');
      assert.deepStrictEqual(leftBehind({ gone: '999999' }), ['gone'], 'its run ended');
      assert.deepStrictEqual(leftBehind({ reused: String(other.pid) }), ['reused'],
        'its pid now belongs to something that is not a conformance run');
    });
  } finally {
    other.kill();
  }
} finally {
  live.kill();
  fs.rmSync(fakeRun, { force: true });
}

console.log(`dbConformanceStaleContainers: ${passed} passed`);
