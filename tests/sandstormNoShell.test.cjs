'use strict';

// A Sandstorm grain has no shell and no coreutils: the meteor-spk 0.6.0 base
// ships only mongod, niscud and node in bin/. The pkgdef's command was a
// `#!/bin/sh` start-memory.sh, and every grain crash-looped with
//
//   sandstorm-http-bridge.c++: failed: execvp(argvp[0], argvp):
//   No such file or directory; argvp[0] = ./start-memory.sh
//
// These tests pin that the grain is started BY node, that the node launcher
// does what the shell script meant to do, and that nothing on the grain's
// launch path reaches for /bin/sh, /bin/sleep or another utility it lacks.
// Run: node tests/sandstormNoShell.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pkgdef = read('sandstorm-pkgdef.capnp');
const deps = read('sandstorm-src/build-deps.sh');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sandstormNoShell:');

// Every uncommented argv in the pkgdef.
const argvs = pkgdef.split('\n')
  .filter((l) => /^\s*argv\s*=/.test(l))
  .map((l) => JSON.parse(l.replace(/^\s*argv\s*=\s*/, '').replace(/,\s*$/, '')));

test('the grain command is run by node, through the http bridge', () => {
  assert.strictEqual(argvs.length, 1, 'exactly one active argv');
  assert.deepStrictEqual(argvs[0], ['/sandstorm-http-bridge', '4000', '--', 'node', 'start-memory.js']);
});

test('the launcher it names is copied into the deps by build-deps.sh', () => {
  const file = argvs[0][4];
  assert.ok(fs.existsSync(path.join(ROOT, 'sandstorm-src', file)), `sandstorm-src/${file} missing`);
  assert.ok(deps.includes(`"$REPO/sandstorm-src/${file}"`) && deps.includes(`"$DEPS/${file}"`),
    `build-deps.sh must copy ${file} into the deps root`);
  assert.ok(read('sandstorm-src/start-memory.js').includes("path.join(__dirname, 'start.js')"));
});

test('no shell script is the grain command (negative)', () => {
  for (const argv of argvs) {
    for (const arg of argv.slice(3)) {
      assert.ok(!/\.(sh|bash)$/.test(arg), `${arg}: a grain has no /bin/sh to run it`);
      const src = path.join(ROOT, 'sandstorm-src', path.basename(arg));
      if (fs.existsSync(src)) {
        assert.ok(!fs.readFileSync(src, 'utf8').startsWith('#!'), `${arg} relies on a #! interpreter`);
      }
    }
  }
  assert.ok(!fs.existsSync(path.join(ROOT, 'sandstorm-src/start-memory.sh')));
  assert.ok(!/cp -f "\$REPO\/sandstorm-src\/[^"]*\.sh"/.test(deps), 'no shell script is shipped as a launcher');
});

test('the launchers spawn no system utility a grain lacks (negative)', () => {
  for (const rel of ['sandstorm-src/start.js', 'sandstorm-src/start-memory.js', 'sandstorm-src/migration-bridge.js']) {
    const src = read(rel);
    const hits = src.match(/spawn(?:Sync)?\(\s*'\/(?:usr\/)?s?bin\/[^']+'/g) || [];
    assert.deepStrictEqual(hits, [], `${rel} spawns a host utility`);
    assert.ok(!/\bexecSync\(|\bexec\(|shell:\s*true/.test(src), `${rel} goes through a shell`);
  }
});

test('start.js waits without spawning /bin/sleep', () => {
  const start = read('sandstorm-src/start.js');
  assert.ok(/function sleep\(sec\) \{ Atomics\.wait\(/.test(start));
  // Execute the function as written: it really blocks.
  const fn = start.match(/const SLEEP_CELL[^\n]*\nfunction sleep\(sec\) \{[^\n]*\}/)[0];
  const sleep = new Function(`${fn}; return sleep;`)();
  const t0 = Date.now();
  sleep(0.2);
  assert.ok(Date.now() - t0 >= 190, 'sleep(0.2) returned early');
});

// Run the real launcher beside a stub start.js that reports what it received.
const TMP = path.join(process.env.TMPDIR || path.join(ROOT, '.tools/tmp'), `sandstormNoShell-${process.pid}`);
fs.mkdirSync(TMP, { recursive: true });
try {
  fs.copyFileSync(path.join(ROOT, 'sandstorm-src/start-memory.js'), path.join(TMP, 'start-memory.js'));
  fs.writeFileSync(path.join(TMP, 'start.js'),
    // Touch localStorage the way server code that probes for it does.
    'const ls = typeof globalThis.localStorage;' +
    'console.log(JSON.stringify({o: process.env.NODE_OPTIONS || "", ls, h: require("v8").getHeapStatistics().heap_size_limit}));' +
    // Exit on a timer: Node emits the Web Storage warning on a later tick, and
    // an immediate process.exit() would hide it from the negative check below.
    'setTimeout(() => process.exit(Number(process.env.STUB_EXIT || 0)), 20);');
  const run = (env) => spawnSync(process.execPath, [path.join(TMP, 'start-memory.js')],
    { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });

  test('the launcher gives start.js a bounded, memory-derived heap', () => {
    const r = run({});
    assert.strictEqual(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    const m = out.o.match(/^--max-old-space-size=(\d+) --no-experimental-webstorage$/);
    assert.ok(m, `unexpected NODE_OPTIONS: ${out.o}`);
    const mb = Number(m[1]);
    assert.ok(mb > 0 && mb <= 4096, `heap ${mb} out of range`);
    assert.ok(mb <= Math.floor(require('os').totalmem() / 1048576 * 3 / 5));
  });

  test('an administrator heap size is kept as it is (negative)', () => {
    const r = run({ NODE_OPTIONS: '--max-old-space-size=123' });
    assert.strictEqual(JSON.parse(r.stdout).o, '--max-old-space-size=123 --no-experimental-webstorage');
    const other = run({ NODE_OPTIONS: '--trace-warnings' });
    assert.match(JSON.parse(other.stdout).o, /^--trace-warnings --max-old-space-size=\d+ --no-experimental-webstorage$/,
      'other administrator options still get the computed heap');
  });

  test('the grain log has no Web Storage ExperimentalWarning', () => {
    const r = run({});
    assert.strictEqual(JSON.parse(r.stdout).ls, 'undefined', 'Web Storage is off for the server');
    assert.ok(!/ExperimentalWarning|localstorage-file/.test(r.stderr), r.stderr);
    // Negative: the same stub WITHOUT the launcher prints exactly the warning
    // the grain log showed, so the assertion above is not vacuous - on a Node
    // that has Web Storage at all.
    if (Number(process.versions.node.split('.')[0]) >= 25) {
      const bare = spawnSync(process.execPath, [path.join(TMP, 'start.js')],
        { env: { PATH: process.env.PATH }, encoding: 'utf8' });
      assert.match(bare.stderr, /localStorage is not available because --localstorage-file was not provided/);
    }
  });

  test('an administrator Web Storage choice is kept (negative)', () => {
    const r = run({ NODE_OPTIONS: '--localstorage-file=/var/ls.json' });
    assert.ok(!/--no-experimental-webstorage/.test(JSON.parse(r.stdout).o));
  });

  test('start.js exit status is passed through to the bridge', () => {
    assert.strictEqual(run({ STUB_EXIT: '7' }).status, 7);
  });
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

test('the ROOT_URL email warning is not raised inside a grain', () => {
  // A grain's ROOT_URL is always its loopback address behind the bridge and it
  // has no SMTP, so the #6538 advice ("snap set wekan root-url=...") is a false
  // alarm there. Everywhere else the check still runs.
  const check = read('server/00checkStartup.js');
  const at = check.indexOf("if (process.env.SANDSTORM !== '1') {");
  assert.notStrictEqual(at, -1, 'the ROOT_URL check must be skipped only in Sandstorm');
  assert.ok(at < check.indexOf('ROOT_URL is not set.') && at < check.indexOf('Every link WeKan sends by email'));
  assert.ok(/\(key = "SANDSTORM", value ?= ?"1"\)/.test(pkgdef), 'the grain sets SANDSTORM=1');
  assert.ok(read('sandstorm-src/start.js').includes("process.env.ROOT_URL || `http://127.0.0.1:${APP_PORT}`"));
});

console.log(`\nsandstormNoShell: ${passed} tests passed`);
