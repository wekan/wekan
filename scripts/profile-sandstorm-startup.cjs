'use strict';

// Local Linux reproduction of the grain's server launch path. Bubblewrap only
// supplies a private /var and /tmp; no Sandstorm install or HTTP bridge needed.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');

function manifestEnvironment(source) {
  // This manifest uses literal string entries. Reject unsupported syntax rather
  // than silently running with a partial or stale copy of the grain environment.
  const command = source.slice(source.indexOf('const myCommand :'));
  const block = command.match(/environ\s*=\s*\[([\s\S]*?)\n\s*\]/);
  if (!block) throw new Error('Cannot find myCommand.environ in sandstorm-pkgdef.capnp');
  const clean = block[1].replace(/"(?:\\.|[^"\\])*"|#[^\n]*/g,
    token => token.startsWith('#') ? '' : token);
  const entry = /\(\s*key\s*=\s*("(?:\\.|[^"\\])*")\s*,\s*value\s*=\s*("(?:\\.|[^"\\])*")\s*\)/g;
  const env = Object.create(null);
  for (const match of clean.matchAll(entry)) {
    const key = JSON.parse(match[1]);
    if (Object.hasOwn(env, key)) throw new Error(`Duplicate environment key: ${key}`);
    env[key] = JSON.parse(match[2]);
  }
  if (clean.replace(entry, '').replace(/[\s,]/g, '')) {
    throw new Error('Unsupported manifest environment syntax; update the local runner');
  }
  if (env.SANDSTORM !== '1' || !JSON.parse(env.METEOR_SETTINGS).public.sandstorm) {
    throw new Error('Manifest does not enable Sandstorm');
  }
  return env;
}

function bubblewrapArgs(app, state, tmp, env) {
  return ['--die-with-parent', '--unshare-pid', '--ro-bind', '/', '/',
    '--proc', '/proc', '--dev', '/dev', '--bind', state, '/var',
    '--bind', tmp, '/tmp', '--chdir', app, '--clearenv',
    ...Object.entries({ ...env, BIND_IP: '127.0.0.1', TMPDIR: '/tmp', HOME: '/var' })
      .flatMap(([key, value]) => ['--setenv', key, value]),
    '--', path.join(app, 'bin/node'), path.join(app, 'start-memory.js')];
}

async function checkPorts() {
  // Refuse to let Meteor accidentally connect to an unrelated DB on port 4001.
  const sockets = [];
  try {
    for (const port of [4000, 4001, 4003, 4004]) {
      const socket = net.createServer();
      sockets.push(socket);
      await new Promise((resolve, reject) => {
        socket.once('error', reject);
        socket.listen(port, '127.0.0.1', resolve);
      });
    }
  } finally {
    await Promise.all(sockets.filter(s => s.listening)
      .map(s => new Promise(resolve => s.close(resolve))));
  }
}

async function main(args) {
  if (args.length !== 3 || args.includes('--help')) {
    console.log('Usage: node scripts/profile-sandstorm-startup.cjs BUNDLE DEPS WORKDIR');
    console.log('BUNDLE: built Meteor bundle; DEPS: meteor-spk.deps (bin/node, ferretdb).');
    console.log('WORKDIR: new or previously created profiling directory; var/ persists between runs.');
    if (!args.includes('--help')) process.exitCode = 1;
    return;
  }
  const [bundle, deps, work] = args.map(p => path.resolve(p));
  for (const file of [path.join(bundle, 'main.js'), path.join(bundle, 'programs/server/boot.js'),
    path.join(deps, 'bin/node'), path.join(deps, 'ferretdb')]) fs.accessSync(file);
  const env = manifestEnvironment(fs.readFileSync(path.join(ROOT, 'sandstorm-pkgdef.capnp'), 'utf8'));
  env.WEKAN_STARTUP_TIMING = '1';
  env.METEOR_PROFILE = '10';
  const marker = path.join(work, '.wekan-startup-profile');
  if (fs.existsSync(work) && !fs.existsSync(marker)) {
    throw new Error('WORKDIR already exists and is not a profiling directory; choose a new directory');
  }
  await checkPorts();
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(marker, 'WeKan local startup profiling\n');
  const app = path.join(work, 'app');
  const state = path.join(work, 'var');
  const tmp = path.join(work, 'tmp');
  for (const dir of [app, state, tmp]) fs.mkdirSync(dir, { recursive: true });
  // Large bundle/dependency trees stay on their original filesystem; no copy
  // warms their contents. Refresh only links owned by this profiling directory.
  const launchers = ['start-memory.js', 'start.js', 'startup-timing.js', 'wait-for-port.js', 'migration-bridge.js'];
  for (const directory of [deps, bundle]) {
    for (const name of fs.readdirSync(directory)) {
      if (launchers.includes(name)) continue;
      const target = path.join(app, name);
      if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false })) {
        if (!fs.lstatSync(target).isSymbolicLink()) throw new Error(`Not a staging link: ${target}`);
        fs.unlinkSync(target);
      }
      fs.symlinkSync(path.join(directory, name), target);
    }
  }
  for (const name of launchers) fs.copyFileSync(path.join(ROOT, 'sandstorm-src', name), path.join(app, name));
  console.log(`Profiling real Sandstorm launchers; persistent test data: ${state}`);
  console.log('HTTP: http://127.0.0.1:4000 (no Sandstorm identity/API bridge). Ctrl-C stops the run.');
  const child = spawn('bwrap', bubblewrapArgs(app, state, tmp, env), { stdio: 'inherit' });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
}

module.exports = { manifestEnvironment, bubblewrapArgs };
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
