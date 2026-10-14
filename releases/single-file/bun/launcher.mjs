// The Bun single-file WeKan (docs/Platforms/Single-File.md, "Bun single
// files"). releases/single-file/bun/build.mjs compiles this with that
// platform's own Bun as the executable and the platform's published Bun bundle
// ZIP embedded in it, unchanged.
//
// On start it extracts the bundle once, into a cache directory named after the
// version, the target and the archive's hash, and then runs the bundle's
// index.mjs with ITSELF as Bun (BUN_BE_BUN=1) - the bundle's own bun binary is
// not extracted, because this executable is that binary. Everything after the
// first start is as fast as the unpacked bundle.
//
// Like bundle/start-wekan.sh: MONGO_URL and ROOT_URL are required (a Bun
// bundle brings no database), PORT defaults to 3000.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import payload from './payload/bundle.zip' with { type: 'file' };
import meta from './payload/meta.json' with { type: 'json' };
import { extractZip } from './unzip.mjs';

export function cacheRoot(env = process.env, platform = process.platform, home = os.homedir()) {
  if (env.WEKAN_SINGLE_FILE_CACHE) return env.WEKAN_SINGLE_FILE_CACHE;
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'wekan', 'single-file');
  if (platform === 'darwin') return path.join(home, 'Library', 'Caches', 'wekan', 'single-file');
  return path.join(env.XDG_CACHE_HOME || path.join(home, '.cache'), 'wekan', 'single-file');
}

export function bundleDirName(info) {
  return `${info.version}-bun-${info.target}-${String(info.sha256).slice(0, 12)}`;
}

async function ensureExtracted(dir) {
  const done = path.join(dir, '.extracted');
  if (fs.existsSync(done)) return;
  const tmp = `${dir}.tmp-${process.pid}`;
  fs.rmSync(tmp, { recursive: true, force: true });
  const zip = Buffer.from(await Bun.file(payload).arrayBuffer());
  // The bundle's own Bun is this executable.
  const files = extractZip(zip, tmp, { strip: meta.strip, skip: rel => rel === 'bun' || rel === 'bun.exe' });
  fs.writeFileSync(path.join(tmp, '.extracted'), JSON.stringify({ ...meta, files }));
  try {
    fs.renameSync(tmp, dir);
  } catch (error) {
    // Another start extracted it first: use that one.
    fs.rmSync(tmp, { recursive: true, force: true });
    if (!fs.existsSync(done)) throw error;
  }
}

async function main(argv) {
  if (argv[0] === '--version') {
    console.log(`WeKan ${meta.version} (Bun single file, ${meta.target})`);
    return 0;
  }
  const dir = path.join(cacheRoot(), bundleDirName(meta));
  await ensureExtracted(dir);
  if (argv[0] === '--extract-only') {
    console.log(dir);
    return 0;
  }
  for (const name of ['MONGO_URL', 'ROOT_URL']) {
    if (!process.env[name]) {
      console.error(`Set ${name}: ${name === 'MONGO_URL' ? 'your MongoDB-compatible database' : 'the public URL of WeKan'}`);
      return 1;
    }
  }
  const child = spawn(process.execPath, [path.join(dir, 'index.mjs'), ...argv], {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, BUN_BE_BUN: '1', PORT: process.env.PORT || '3000' },
  });
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => child.kill(signal));
  }
  return await new Promise(resolve => child.on('exit', (code, signal) => resolve(signal ? 1 : code ?? 1)));
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2));
}
