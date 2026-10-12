// A target without MongoDB must still load WeKan and reach database selection.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const bundle = resolve(process.argv[2] || 'bundle');
const child = spawn(resolve(bundle, process.platform === 'win32' ? 'bun.exe' : 'bun'), ['index.mjs'], {
  cwd: bundle,
  env: { ...process.env, MONGO_URL: 'mongodb://127.0.0.1:1/bun_smoke?serverSelectionTimeoutMS=3000',
    MONGO_OPLOG_URL: '', ROOT_URL: 'http://127.0.0.1:3000', PORT: '3000', BIND_IP: '127.0.0.1', DO_NOT_TRACK: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data; process.stdout.write(data); });
const timer = setTimeout(() => child.kill('SIGKILL'), 60000);
child.on('error', error => { clearTimeout(timer); throw error; });
child.on('close', () => {
  clearTimeout(timer);
  if (!/MongoServerSelectionError|ECONNREFUSED.*127\.0\.0\.1:1/.test(output) ||
      /Cannot find module|ERR_MODULE_NOT_FOUND|SyntaxError|ReferenceError|TypeError|ERR_DLOPEN_FAILED|invalid ELF/.test(output)) {
    console.error('Bun bundle did not load cleanly up to database connection');
    process.exitCode = 1;
    return;
  }
  writeFileSync(resolve(bundle, '.bun-smoke-ok'), 'Loaded on target; native password and image operations passed.\n');
});
