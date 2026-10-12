'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('sandstorm-src/startup-timing.js');

function fixture(env = {}) {
  let ns = 1000000000n;
  let cpu = { user: 1000, system: 500 };
  const rows = [];
  const context = {
    module: { exports: {} },
    process: { env, pid: 123, hrtime: { bigint: () => ns }, cpuUsage: () => cpu },
    console: { log: line => rows.push(JSON.parse(line.slice('[sandstorm-startup] '.length))) },
  };
  vm.runInNewContext(source, context);
  return { create: context.module.exports, rows, env, context,
    advance() { ns += 250000000n; cpu = { user: cpu.user + 12000, system: cpu.system + 3000 }; } };
}

const enabled = fixture({ WEKAN_STARTUP_TIMING: '1' });
const mark = enabled.create('launcher');
mark('entry');
enabled.advance();
mark('loaded');
assert.deepEqual(enabled.rows[1], { component: 'launcher', event: 'loaded', pid: 123,
  elapsedMs: 250, deltaMs: 250, cpuUserMs: 12, cpuSystemMs: 3 });
enabled.advance();
const child = enabled.create('child');
child('entry');
assert.equal(enabled.rows[2].elapsedMs, 500, 'children share the launch origin');
assert.equal(enabled.rows[2].deltaMs, 0, 'CPU/delta intervals are process-local');
enabled.create('new-grain', true)('entry');
assert.equal(enabled.rows[3].elapsedMs, 0, 'wrapper resets stale inherited origins');
for (const origin of ['bad', '999999999999999999999']) {
  const f = fixture({ WEKAN_STARTUP_TIMING: '1', WEKAN_STARTUP_ORIGIN_NS: origin });
  f.create('launcher')('entry');
  assert.equal(f.rows[0].elapsedMs, 0);
}
for (const value of [undefined, '0', 'false']) {
  const f = fixture({ WEKAN_STARTUP_TIMING: value });
  f.context.process.cpuUsage = () => { throw new Error('disabled diagnostics sampled CPU'); };
  f.create('launcher')('entry');
  assert.equal(f.rows.length, 0);
  assert.equal(f.env.WEKAN_STARTUP_ORIGIN_NS, undefined);
}
enabled.context.console.log = () => { throw new Error('log failure'); };
assert.doesNotThrow(() => mark('entry'));
console.log('ok - monotonic timing, CPU deltas, shared origin, disabled and failed logging');

// Execute the real memory wrapper and helper in child processes, with only the
// application replaced. This checks environment inheritance and exit propagation.
const tmpRoot = process.env.TMPDIR || path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmp = fs.mkdtempSync(path.join(tmpRoot, 'startup-timing-'));
try {
  for (const file of ['start-memory.js', 'startup-timing.js']) {
    fs.copyFileSync(path.join(root, 'sandstorm-src', file), path.join(tmp, file));
  }
  fs.writeFileSync(path.join(tmp, 'start.js'), `
    require('./startup-timing')('launcher')('entry');
    console.log(JSON.stringify({ profile: process.env.METEOR_PROFILE }));
    process.exit(7);
  `);
  const result = spawnSync(process.execPath, [path.join(tmp, 'start-memory.js')], {
    encoding: 'utf8', env: { PATH: process.env.PATH, WEKAN_STARTUP_TIMING: '1', METEOR_PROFILE: '10' },
  });
  assert.equal(result.status, 7, result.stderr);
  const lines = result.stdout.trim().split('\n');
  const rows = lines.filter(l => l.startsWith('[sandstorm-startup] '))
    .map(l => JSON.parse(l.slice('[sandstorm-startup] '.length)));
  assert.deepEqual(rows.map(r => r.event), ['entry', 'launcher-spawn', 'entry']);
  assert.notEqual(rows[0].pid, rows[2].pid);
  assert.ok(rows[2].elapsedMs >= rows[1].elapsedMs);
  assert.equal(JSON.parse(lines.at(-1)).profile, '10');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('ok - real wrapper preserves profiler environment, time origin and exit status');

const pkgdef = read('sandstorm-pkgdef.capnp');
assert.match(pkgdef, /\(key = "WEKAN_STARTUP_TIMING", value = "1"\)/);
assert.doesNotMatch(pkgdef, /key\s*=\s*"METEOR_PROFILE"/);
assert.match(read('sandstorm-src/build-deps.sh'), /cp -f "\$REPO\/sandstorm-src\/startup-timing.js"\s+"\$DEPS\/startup-timing.js"/);
console.log('ok - diagnostics enabled in grain environment and helper included in payload');
