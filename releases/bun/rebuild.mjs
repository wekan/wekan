// Rebuild only native npm packages; keep Meteor's compiled JS identical everywhere.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { makeWritable, prepareBundleNpm } from '../prepare-bundle-npm.mjs';
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

export function run(command, args, cwd, extraEnv = {}, timeout = 0) {
  const result = spawnSync(command, args, {
    cwd, timeout, killSignal: 'SIGKILL', stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd'),
    env: { ...process.env, ...extraEnv },
  });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error || result.status}`);
}

// A load probe is only a prebuilt-addon shortcut, not the final native test.
// FreeBSD logs stopped here for three hours; terminate hung probes so the
// source rebuild can run. SIGKILL also bounds runtimes that ignore SIGTERM.
// The expected "no prebuilt addon" answer, as ONE plain line. Bun's raw stderr
// is a source excerpt plus a line starting `error:`, which GitHub turned into an
// error annotation, so a windows-arm64 job that built, passed and attached its
// bundle was listed with an error, as were both FreeBSD jobs before their real
// failure.
export function probeFailureReason(result) {
  if (result.error) return result.error.message;
  const line = String(result.stderr || '').split(/\r?\n/)
    .map(text => text.trim()).find(text => /^error:/i.test(text));
  if (line) return `no usable prebuilt addon (${line.replace(/^error:\s*/i, '')})`;
  return result.signal ? `probe ended by ${result.signal}` : `probe exited ${result.status}`;
}

export function probeAddon(bun, dir, cwd, timeout = 30000) {
  console.log(`Checking prebuilt addon: ${dir}`);
  const result = spawnSync(bun, ['-e', 'require(process.argv[1]); process.exit(0)', dir], {
    cwd, encoding: 'utf8', timeout, killSignal: 'SIGKILL',
  });
  if (result.error || result.status !== 0) {
    console.log(`Rebuilding ${dir}: ${probeFailureReason(result)}`);
    return false;
  }
  return true;
}

// Sharp has no Android prebuilt addon. Build against Termux's libvips and
// install only its declared addon headers, not its development/test toolchain.
export function buildSharpFromSource(dir, server, npm) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const addonApi = pkg.devDependencies?.['node-addon-api'];
  if (!addonApi) throw new Error('Sharp does not declare node-addon-api build headers');
  run(npm, ['install', '--no-save', '--omit=dev', '--ignore-scripts', '--package-lock=false',
    `node-addon-api@${addonApi}`], server);
  rmSync(join(dir, 'src/build'), { recursive: true, force: true });
  run(process.execPath, [join(server, 'node_modules/node-gyp/bin/node-gyp.js'),
    'rebuild', `--directory=${join(dir, 'src')}`, `--arch=${process.arch}`], server,
    { SHARP_FORCE_GLOBAL_LIBVIPS: '1' });
}

export function rebuild(bundle) {
  const server = join(bundle, 'programs/server');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const bun = join(bundle, process.platform === 'win32' ? 'bun.exe' : 'bun');
  if (!existsSync(join(bundle, 'index.mjs'))) throw new Error('Expected an ESM Meteor bundle');
  prepareBundleNpm(bundle);
  makeWritable(join(server, 'package.json'));
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
    if (name === 'sharp' && process.platform === 'android') {
      buildSharpFromSource(dir, server, npm);
    }
    if (name === 'bcrypt' || name === 'argon2') {
      if (!probeAddon(bun, dir, server)) {
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
