#!/usr/bin/env node
// Raise the npm packages a built bundle carries inside Meteor's own packages.
//
//     node releases/bump-bundle-npm-deps.mjs [bundle dir] [--dry-run]
//
// Run it ONCE, on the amd64 bundle, right after `meteor build`: every other
// architecture's bundle is that bundle with `programs/server` reinstalled, and
// the Docker image starts from an architecture's .zip, so one pass here travels
// to all of them.
//
// Why it cannot be done in package.json. `programs/server/npm/node_modules/
// meteor/<package>/node_modules` is where a Meteor package's `Npm.depends` lands,
// at the EXACT version that package names. Nothing in this repository's
// package.json, and no `overrides` entry, is consulted for it - `meteor build`
// copies what the package pinned. So the bundle shipped `nodemailer` 8.0.3 and
// `openpgp` 5.11.1 (meteor/email), `svgo` 2.8.2 + `postcss` 8.5.1 + `nanoid`
// 3.3.15 (meteor/minifier-css), `qs` 6.13.0 + `cookie` 0.4.1 + `on-headers`
// 1.0.2 + `tmp` 0.2.3 (meteor/webapp), `lodash` 4.17.21 + `diff` 3.5.0
// (ostrio:files), `uuid` 8.3.2 and `@babel/runtime` 7.20.7 - each of them with a
// published advisory and a fix released inside the same major.
//
// What it does. For every package named in releases/bundle-npm-security-bumps.json
// it finds EVERY copy in the bundle below the minimum, downloads the pinned
// version once into a temporary prefix (with --ignore-scripts, so no prebuilt
// native module in the bundle is rebuilt by it), and replaces those copies. A
// dependency the new version needs and the place it lands does not have is
// copied in beside it; one that is already there is LEFT ALONE, because a
// sibling at a different major is a sibling some other package chose.
//
// It never adds a package that was not already there: a copy below the minimum
// is replaced, everything else is untouched.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  fs.readFileSync(path.join(here, 'bundle-npm-security-bumps.json'), 'utf8'));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bundle = args.find(a => !a.startsWith('--')) || 'bundle';

// HOW TO RUN npm FROM NODE, ON WINDOWS TOO.
//
// `execFileSync('npm', …)` is fine on Linux and macOS, where npm is a real
// executable on PATH. On Windows npm is `npm.cmd`, a batch script - and Node
// does not apply PATHEXT when it spawns, so the bare name resolves to nothing:
//
//   Error: spawnSync npm ENOENT
//
// which is what failed build-win64 and build-win-arm64 in v10.93, AFTER the
// bundle had been built and its native modules compiled. (win32 was skipped
// that run for want of a Node.js build, so it never reached this and looked
// fine - the fault is not architecture-specific.)
//
// `shell: true` would find the .cmd, and is the wrong fix: with a shell, Node
// joins the arguments with spaces and quotes NOTHING, so the first Windows temp
// path containing a space would break the install in a new way.
//
// Run npm's own CLI with the Node already running instead. That needs no shell,
// no PATH lookup and no quoting, and it is the same npm either way.
const npmCli = (() => {
  const dir = path.dirname(process.execPath);
  const candidates = [
    process.env.npm_execpath,                                            // run under npm
    path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),          // Windows layout
    path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // POSIX layout
  ];
  for (const c of candidates) {
    if (c && c.endsWith('.js') && fs.existsSync(c)) return c;
  }
  return null;
})();

function npm(argv) {
  if (npmCli) return execFileSync(process.execPath, [npmCli, ...argv], { stdio: 'inherit' });
  // No npm-cli.js beside this Node: fall back to the PATH lookup, which works
  // everywhere except the case above. On Windows, say which one this is rather
  // than letting ENOENT speak for itself.
  try {
    return execFileSync('npm', argv, { stdio: 'inherit' });
  } catch (err) {
    if (err.code === 'ENOENT' && process.platform === 'win32') {
      throw new Error('npm could not be run: no npm-cli.js beside this Node, and Windows '
        + 'does not resolve `npm` (npm.cmd) from a bare spawn. Run this with a Node whose '
        + 'npm is installed alongside it.');
    }
    throw err;
  }
}
const serverDir = path.join(bundle, 'programs', 'server');

if (!fs.existsSync(serverDir)) {
  console.error(`bump-bundle-npm-deps: ${serverDir} is not a built bundle`);
  process.exit(1);
}

// "1.20.3" < "1.20.6" as numbers, not as strings, and a prerelease tail
// ("8.0.0-alpha.17") compares lower than the release it leads to.
const compare = (a, b) => {
  const split = v => {
    const [core, pre] = String(v).split('-');
    return [core.split('.').map(n => parseInt(n, 10) || 0), pre];
  };
  const [an, apre] = split(a);
  const [bn, bpre] = split(b);
  for (let i = 0; i < Math.max(an.length, bn.length); i += 1) {
    if ((an[i] || 0) !== (bn[i] || 0)) return (an[i] || 0) < (bn[i] || 0) ? -1 : 1;
  }
  if (apre && !bpre) return -1;
  if (!apre && bpre) return 1;
  if (apre && bpre && apre !== bpre) return apre < bpre ? -1 : 1;
  return 0;
};

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

// Every `node_modules/<name>` in the bundle, at any depth, with its version.
const copiesOf = name => {
  const found = [];
  const walk = dir => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === 'node_modules') {
        const target = path.join(full, name);
        const pkg = readJson(path.join(target, 'package.json'));
        if (pkg && pkg.version) found.push({ dir: target, version: pkg.version });
      }
      walk(full);
    }
  };
  walk(serverDir);
  return found;
};

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-bundle-bump-'));
const bumped = [];
const skipped = [];

for (const [name, minimum] of Object.entries(manifest.minimums)) {
  const outdated = copiesOf(name).filter(c => compare(c.version, minimum) < 0);
  if (!outdated.length) {
    skipped.push(name);
    continue;
  }

  const prefix = path.join(tmpRoot, name.replace('/', '+'));
  if (!dryRun) {
    fs.mkdirSync(prefix, { recursive: true });
    // A prefix with no package.json is what we want: npm installs the one
    // package and its dependencies, and nothing of the bundle's is consulted.
    npm([
      'install', `${name}@${minimum}`,
      '--prefix', prefix,
      '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel', 'error',
    ]);
  }

  for (const copy of outdated) {
    console.log(`  ${name} ${copy.version} -> ${minimum}  ${copy.dir}`);
    if (dryRun) continue;

    fs.rmSync(copy.dir, { recursive: true, force: true });
    fs.cpSync(path.join(prefix, 'node_modules', name), copy.dir, { recursive: true });

    // Whatever the new version needs that this node_modules does not have. An
    // existing sibling is left as it is - it is some other package's choice.
    const siblings = path.dirname(copy.dir);
    for (const entry of fs.readdirSync(path.join(prefix, 'node_modules'))) {
      if (entry === name || entry === '.package-lock.json') continue;
      const names = entry.startsWith('@')
        ? fs.readdirSync(path.join(prefix, 'node_modules', entry)).map(s => `${entry}/${s}`)
        : [entry];
      for (const dep of names) {
        if (dep === name) continue;
        const dest = path.join(siblings, dep);
        if (fs.existsSync(dest)) continue;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.cpSync(path.join(prefix, 'node_modules', dep), dest, { recursive: true });
        console.log(`    + ${dep} (needed by ${name} ${minimum})`);
      }
    }
  }
  bumped.push(`${name}@${minimum} x${outdated.length}`);
}

if (!dryRun) fs.rmSync(tmpRoot, { recursive: true, force: true });

console.log(`bump-bundle-npm-deps: ${dryRun ? 'would bump' : 'bumped'} `
  + `${bumped.length} package(s) in ${serverDir}`);
if (bumped.length) console.log(`  ${bumped.join(', ')}`);
if (skipped.length) console.log(`  already at or above the minimum: ${skipped.join(' ')}`);
