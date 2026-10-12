// Rebuild only native npm packages; keep Meteor's compiled JS identical everywhere.
import { chmodSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { prepareBundleNpm } from '../prepare-bundle-npm.mjs';
import { bumpNodeGyp } from '../bump-bundle-node-gyp.mjs';

export function packageCopies(root, names) {
  const found = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = join(dir, entry.name);
      const manifest = join(child, 'package.json');
      if (existsSync(manifest)) {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        if (names.includes(pkg.name)) found.push({ dir: child, name: pkg.name });
      }
      walk(child);
    }
  }
  walk(root);
  return found;
}

export function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd'),
    env: { ...process.env, ...extraEnv },
  });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error || result.status}`);
}

export function rebuild(bundle) {
  const server = join(bundle, 'programs/server');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const bun = join(bundle, process.platform === 'win32' ? 'bun.exe' : 'bun');
  if (!existsSync(join(bundle, 'index.mjs'))) throw new Error('Expected an ESM Meteor bundle');
  prepareBundleNpm(bundle);
  chmodSync(join(server, 'package.json'), 0o644);
  const bumped = bumpNodeGyp(join(server, 'package.json'));
  if (bumped.error) throw new Error(bumped.error);
  // Root install obtains node-gyp. Native lifecycle scripts are invoked below,
  // after removing build/ outputs from the Linux source bundle.
  run(npm, ['install', '--omit=dev', '--ignore-scripts'], server);
  const copies = packageCopies(server, ['bcrypt', 'argon2', 'sharp', '@napi-rs/canvas']);
  for (const required of ['bcrypt', 'argon2', 'sharp']) {
    if (!copies.some(pkg => pkg.name === required)) throw new Error(`Bundle lacks ${required}`);
  }
  for (const { dir, name } of copies) {
    rmSync(join(dir, 'build'), { recursive: true, force: true });
    // Install optional packages on the TARGET, including musl/Bionic distinctions.
    // This is deliberately not a cross-platform npm_config_arch override.
    run(npm, ['install', '--omit=dev', '--include=optional', '--ignore-scripts', '--package-lock=false'], dir);
    if (name === 'bcrypt' || name === 'argon2') {
      const probe = spawnSync(bun, ['-e', 'require(process.argv[1])', dir], { cwd: server, encoding: 'utf8' });
      if (probe.status !== 0) {
        run(process.execPath, [join(server, 'node_modules/node-gyp/bin/node-gyp.js'),
          'rebuild', `--directory=${dir}`, `--arch=${process.arch}`], server);
      }
    }
  }
  // Require and exercise addons with Bun, not just Node or a binary-header check.
  const checks = copies.filter(pkg => ['bcrypt', 'argon2', 'sharp'].includes(pkg.name));
  writeFileSync(join(bundle, 'bun-native-packages.json'), JSON.stringify(checks.map(pkg => ({
    name: pkg.name, dir: relative(bundle, pkg.dir),
  })), null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  rebuild(resolve(process.argv[2] || 'bundle'));
}
