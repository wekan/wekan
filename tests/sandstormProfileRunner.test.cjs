'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { manifestEnvironment, bubblewrapArgs } = require('../scripts/profile-sandstorm-startup.cjs');
const source = fs.readFileSync(path.join(__dirname, '../sandstorm-pkgdef.capnp'), 'utf8');
const env = manifestEnvironment(source);
assert.equal(env.SANDSTORM, '1');
assert.equal(env.DDP_TRANSPORT, 'sockjs');
assert.equal(JSON.parse(env.METEOR_SETTINGS).public.sandstorm, true);
assert.equal(env.METEOR_PROFILE, undefined);
assert.equal(env.OAUTH2_SECRET, '');
assert.equal(env.WEKAN_STARTUP_TIMING, '1');
assert.equal(env.METEOR_REIFY_CACHE_DIR, undefined);
assert.throws(() => manifestEnvironment(source.replace('value = "1"', 'value = .someConstant')),
  /Unsupported/);
assert.throws(() => manifestEnvironment(source.replace('value="1"', 'value="0"')), /enable Sandstorm/);
const withHash = source.replace('value = "1"', 'value = "a#b" # comment\n');
assert.equal(manifestEnvironment(withHash).WEKAN_STARTUP_TIMING, 'a#b');
const args = bubblewrapArgs('/test/app', '/test/state', '/test/tmp', env);
assert.deepEqual(args.slice(-3), ['--', '/test/app/bin/node', '/test/app/start-memory.js']);
assert.ok(args.includes('--clearenv'), 'host environment cannot silently change grain settings');
assert.deepEqual(args.slice(args.indexOf('--ro-bind'), args.indexOf('--ro-bind') + 3),
  ['--ro-bind', '/', '/']);
const binds = args.flatMap((arg, i) => arg === '--bind' ? [args.slice(i + 1, i + 3)] : []);
assert.deepEqual(binds, [['/test/state', '/var'], ['/test/tmp', '/tmp']]);
assert.ok(args.includes('--unshare-pid'), 'namespace exit reaps the database child');
assert.ok(!args.includes('/sandstorm-http-bridge'), 'local server startup needs no Sandstorm service');
assert.ok(!args.includes('main.js'), 'the real memory wrapper and launcher must run first');
assert.ok(!args.includes('METEOR_REIFY_CACHE_DIR'));
console.log('ok - manifest parsing, strict environment, private writable paths and real entrypoint');

// Opt in on a Linux host that allows user namespaces. Exercises the real runner,
// memory wrapper, launcher, waiting page and handoff; only DB/application payloads
// are fixtures. It measures correctness, not Wekan startup performance.
if (process.env.WEKAN_TEST_BWRAP === '1') {
  const { spawnSync } = require('node:child_process');
  const root = path.resolve(__dirname, '..');
  const tmpRoot = process.env.TMPDIR || path.join(root, '.tools/tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(tmpRoot, 'profile-runner-'));
  try {
    const bundle = path.join(tmp, 'bundle');
    const deps = path.join(tmp, 'deps');
    const work = path.join(tmp, 'work');
    fs.mkdirSync(path.join(bundle, 'programs/server'), { recursive: true });
    fs.mkdirSync(path.join(deps, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(bundle, 'programs/server/boot.js'), '// fixture\n');
    fs.symlinkSync(process.execPath, path.join(deps, 'bin/node'));
    fs.writeFileSync(path.join(deps, 'ferretdb'),
      `#!${process.execPath}\nsetTimeout(() => require('net').createServer(s => s.end()).listen(4001, '127.0.0.1'), 100);\n`, { mode: 0o755 });
    fs.writeFileSync(path.join(bundle, 'main.js'), `
      const fs = require('fs');
      const assert = require('assert');
      assert.equal(process.env.SANDSTORM, '1');
      assert.equal(JSON.parse(process.env.METEOR_SETTINGS).public.sandstorm, true);
      assert.equal(process.env.METEOR_PROFILE, '10');
      assert.equal(process.env.WRITABLE_PATH, '/var/files');
      assert.equal(process.env.METEOR_REIFY_CACHE_DIR, undefined);
      const count = fs.existsSync('/var/count') ? Number(fs.readFileSync('/var/count', 'utf8')) : 0;
      fs.writeFileSync('/var/count', String(count + 1));
      // Like Meteor: main.js returns before asynchronous startup binds HTTP.
      setTimeout(() => require('http').createServer((q, r) => r.end('ok'))
        .listen(4000, '127.0.0.1', () => setTimeout(() => process.exit(0), 25)), 25);
    `);
    for (const count of [1, 2]) {
      const result = spawnSync(process.execPath,
        [path.join(root, 'scripts/profile-sandstorm-startup.cjs'), bundle, deps, work],
        { encoding: 'utf8', timeout: 15000 });
      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(fs.readFileSync(path.join(work, 'var/count'), 'utf8'), String(count));
      const marks = result.stdout.split('\n').filter(l => l.startsWith('[sandstorm-startup] '))
        .map(l => JSON.parse(l.slice('[sandstorm-startup] '.length)));
      assert.deepEqual(marks.filter(m => m.component === 'launcher').map(m => m.event), [
        'entry', 'directories-ready', 'migration-check-start', 'migration-check-complete',
        'ferretdb-spawn', 'ferretdb-listening', 'meteor-load-start', 'meteor-require-returned',
        'meteor-listen-requested', 'meteor-listening',
      ]);
      const at = event => marks.find(m => m.event === event).elapsedMs;
      assert.ok(at('ferretdb-listening') - at('ferretdb-spawn') >= 100,
        'Meteor waits for the database listener');
      assert.ok(at('meteor-load-start') >= at('ferretdb-listening'));
    }
    console.log('ok - local runner: fresh/resumed state, real launchers and HTTP handoff');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} else {
  console.log('SKIP local namespace integration (set WEKAN_TEST_BWRAP=1 on Linux with bwrap)');
}
