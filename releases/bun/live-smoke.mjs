// Full HTTP and DDP startup against an isolated, empty Mongo-compatible database.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const bundle = resolve(process.argv[2] || 'bundle');
const mongo = process.env.BUN_SMOKE_MONGO_URL;
if (!mongo) throw new Error('BUN_SMOKE_MONGO_URL must point at an isolated test database');
const port = process.env.BUN_SMOKE_PORT || '3199';
const url = `http://127.0.0.1:${port}`;
const child = spawn(resolve(bundle, process.platform === 'win32' ? 'bun.exe' : 'bun'), ['index.mjs'], {
  cwd: bundle,
  env: { ...process.env, MONGO_URL: mongo, MONGO_OPLOG_URL: '', ROOT_URL: url,
    PORT: port, BIND_IP: '127.0.0.1', WRITABLE_PATH: resolve(bundle, '../smoke-data'), DO_NOT_TRACK: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let exited = false;
let output = '';
child.on('error', error => { output += error.message; exited = true; });
child.on('exit', () => { exited = true; });
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data; process.stdout.write(data); });
try {
  let html;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (exited) throw new Error('Bun exited before HTTP readiness');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { html = await response.text(); break; }
    } catch { /* server is starting */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!html?.includes('__meteor_runtime_config__')) throw new Error('No Meteor HTML response');
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(url.replace('http:', 'ws:') + '/websocket');
    const timer = setTimeout(() => { socket.close(); reject(new Error('DDP connect timed out')); }, 15000);
    socket.onopen = () => socket.send(JSON.stringify({ msg: 'connect', version: '1', support: ['1'] }));
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.msg === 'connected' && message.session) { clearTimeout(timer); socket.close(); resolve(); }
      else if (message.msg === 'failed') { clearTimeout(timer); socket.close(); reject(new Error('DDP negotiation failed')); }
    };
    socket.onerror = () => { clearTimeout(timer); socket.close(); reject(new Error('DDP WebSocket failed')); };
  });
  if (/ERR_MODULE_NOT_FOUND|Cannot find module|SyntaxError|ReferenceError|ERR_DLOPEN_FAILED/.test(output)) {
    throw new Error('Runtime error during startup');
  }
  if (process.env.BUN_SMOKE_BROWSER === '1') {
    const browserSmoke = createRequire(import.meta.url)('../../tests/bun-browser-smoke.cjs');
    await browserSmoke(url);
  }
  writeFileSync(resolve(bundle, '.bun-smoke-ok'), 'Native checks, HTTP and DDP passed on target.\n');
  console.log('Bun WeKan HTTP and DDP smoke passed');
} finally {
  child.kill();
  const stop = setTimeout(() => child.kill('SIGKILL'), 5000);
  stop.unref();
}
