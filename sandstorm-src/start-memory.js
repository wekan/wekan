// WeKan on Sandstorm — memory-aware entry point (meteor-spk.deps/start-memory.js).
//
// Gives WeKan an explicit, bounded V8 heap derived from the grain's memory
// (three fifths of it, at most 4 GiB), the same rule the Docker image, the
// bundle and the snap apply, and then runs start.js with it. An administrator's
// own heap size in NODE_OPTIONS always wins.
//
// It also turns Node's Web Storage off. Since Node 25 a global localStorage
// exists, and the first server-side code that merely checks for it prints
//
//   ExperimentalWarning: localStorage is not available because
//   --localstorage-file was not provided.
//
// into every grain's log. WeKan's server never uses Web Storage - a browser's
// localStorage is the client's - so the global is removed rather than given a
// file in the grain's /var.
//
// This is JavaScript, not a shell script, because a grain HAS NO SHELL: the
// meteor-spk 0.6.0 base puts only mongod, niscud and node in bin/, so there is
// no /bin/sh, awk or cat. A `#!/bin/sh` start-memory.sh made every grain
// crash-loop with
//
//   sandstorm-http-bridge.c++: failed: execvp(argvp[0], argvp):
//   No such file or directory; argvp[0] = ./start-memory.sh
//
// (execvp reports the missing INTERPRETER as ENOENT). node is the one
// interpreter a grain is guaranteed to have.
//
// The heap flag has to be in place before the process that loads main.js
// starts, so start.js runs as a child with NODE_OPTIONS set, which the bridge,
// FerretDB-importer and every other node child of start.js inherit as well.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function memoryMb() {
  let mb = Math.floor(os.totalmem() / 1048576) || 2048;
  for (const f of ['/sys/fs/cgroup/memory.max',
                   '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
    let raw;
    try { raw = fs.readFileSync(f, 'utf8').trim(); } catch (_) { continue; }
    if (!/^[0-9]+$/.test(raw)) continue;                // "max" = no limit
    const limit = Math.floor(Number(raw) / 1048576);
    if (limit > 0 && limit < mb) mb = limit;
    break;
  }
  return mb;
}

const env = { ...process.env };
const options = (env.NODE_OPTIONS || '').split(/\s+/).filter(Boolean);
if (!options.some((o) => /^--max[-_]old[-_]space[-_]size(=|$)/.test(o))) {
  const heapMb = Math.min(Math.floor(memoryMb() * 3 / 5), 4096);
  options.push(`--max-old-space-size=${heapMb}`);
}
if (!options.some((o) => /^--(no-)?(experimental-)?webstorage$|^--localstorage-file(=|$)/.test(o))) {
  options.push('--no-experimental-webstorage');
}
env.NODE_OPTIONS = options.join(' ');

const child = spawn(process.execPath, [path.join(__dirname, 'start.js')],
  { stdio: 'inherit', env });
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => { try { child.kill(sig); } catch (_) {} });
}
child.on('error', (e) => {
  console.error('** WeKan: could not start start.js:', e && e.message || e);
  process.exit(1);
});
child.on('exit', (code, signal) => process.exit(code === null ? 1 : code));
