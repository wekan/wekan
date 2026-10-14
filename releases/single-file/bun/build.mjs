// Builds a Bun single-file WeKan from one platform's published Bun bundle ZIP
// (docs/Platforms/Single-File.md, "Bun single files").
//
//   <bundle's own bun> releases/single-file/bun/build.mjs \
//       --zip wekan-<version>-bun-<target>.zip --target <target> \
//       --version <version> --out <file>
//
// Run it WITH the bundle's own Bun, on that platform: the executable it makes
// is that Bun with the launcher and the unchanged bundle ZIP inside, so the
// runtime is exactly the one the bundle was built and tested with, and nothing
// is cross-compiled. The ZIP is embedded as it was published; its SHA-256 is
// recorded in the executable and names the cache directory it extracts to.

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listEntries } from './unzip.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!/^--(zip|target|version|out)$/.test(key) || argv[i + 1] === undefined) {
      throw new Error(`usage: build.mjs --zip <bundle.zip> --target <target> --version <version> --out <file> (got ${key})`);
    }
    out[key.slice(2)] = argv[i + 1];
  }
  for (const key of ['zip', 'target', 'version', 'out']) if (!out[key]) throw new Error(`--${key} is required`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(out.target)) throw new Error(`bad target: ${out.target}`);
  if (!/^v?\d+\.\d+(\.\d+)?$/.test(out.version)) throw new Error(`bad version: ${out.version}`);
  return out;
}

/** The directory every entry of the bundle ZIP is under ("bundle"). */
export function bundlePrefix(entries) {
  const tops = new Set(entries.map(e => e.name.replace(/\\/g, '/').split('/')[0]));
  if (tops.size !== 1) throw new Error(`the bundle ZIP must hold one directory, found: ${[...tops].slice(0, 5).join(', ')}`);
  const [top] = tops;
  const names = new Set(entries.map(e => e.name));
  if (!names.has(`${top}/index.mjs`)) throw new Error(`${top}/index.mjs is missing: not a WeKan Bun bundle`);
  return top;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (typeof Bun === 'undefined') throw new Error('run this with the bundle\'s own bun, not node');
  const zip = fs.readFileSync(args.zip);
  const prefix = bundlePrefix(listEntries(zip));
  const sha256 = crypto.createHash('sha256').update(zip).digest('hex');
  const stage = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-bun-single-'));
  try {
    fs.mkdirSync(path.join(stage, 'payload'));
    fs.copyFileSync(path.join(here, 'launcher.mjs'), path.join(stage, 'launcher.mjs'));
    fs.copyFileSync(path.join(here, 'unzip.mjs'), path.join(stage, 'unzip.mjs'));
    fs.copyFileSync(args.zip, path.join(stage, 'payload', 'bundle.zip'));
    const meta = { version: args.version.replace(/^v/, ''), target: args.target, sha256, strip: prefix };
    fs.writeFileSync(path.join(stage, 'payload', 'meta.json'), JSON.stringify(meta));
    const result = spawnSync(process.execPath, [
      'build', '--compile', path.join(stage, 'launcher.mjs'), '--outfile', path.resolve(args.out),
      // A .env or bunfig.toml where somebody starts WeKan is theirs, not WeKan's.
      '--no-compile-autoload-dotenv', '--no-compile-autoload-bunfig',
    ], { stdio: 'inherit', cwd: stage });
    if (result.status !== 0) throw new Error(`bun build --compile failed (${result.status})`);
    console.log(`${args.out}: WeKan ${meta.version} for ${meta.target}, bundle sha256 ${sha256}`);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (import.meta.main) main();
