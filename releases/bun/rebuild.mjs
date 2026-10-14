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
// FreeBSD is built the same way, against the system libvips (pkg vips): its
// only prebuilt is @img/sharp-freebsd-wasm32, whose threads are Web Workers,
// and under Bun on FreeBSD the first image operation never returned - the
// native check stopped at `native check: sharp` in both FreeBSD jobs, while
// the same wasm build works under Bun on Linux. A Worker that never finishes
// matches Bun's open FreeBSD thread-suspend deadlock (oven-sh/bun#44595).
export const SHARP_SOURCE_PLATFORMS = ['android', 'freebsd'];

// sharp's source refuses a libvips older than the one it was released with
// (src/common.h, to the patch release). FreeBSD packages libvips a patch
// release behind at times - 8.18.6 against sharp 0.35.5's 8.18.7 stopped both
// FreeBSD Bun builds - and a user's FreeBSD runs that packaged libvips through
// the same libvips-cpp soname whatever was compiled against. So only a
// patch-release gap is accepted, said so in the log; any larger one still
// stops the build.
const VIPS_GUARD = /\(VIPS_MAJOR_VERSION == (\d+) && VIPS_MINOR_VERSION == (\d+) && VIPS_MICRO_VERSION < (\d+)\)/;
export function acceptPackagedLibvips(commonH, installed) {
  const m = VIPS_GUARD.exec(commonH);
  if (!m) throw new Error('sharp src/common.h: the libvips version check is not the one this was written for');
  const [major, minor, micro] = m.slice(1).map(Number);
  const v = /^(\d+)\.(\d+)\.(\d+)/.exec(String(installed || '').trim());
  if (!v) throw new Error(`no libvips version from pkg-config: ${installed}`);
  const [imajor, iminor, imicro] = v.slice(1).map(Number);
  if (imajor !== major || iminor !== minor || imicro >= micro) return { source: commonH, note: '' };
  return {
    source: commonH.replace(m[0], `(VIPS_MAJOR_VERSION == ${major} && VIPS_MINOR_VERSION == ${minor} && VIPS_MICRO_VERSION < ${imicro})`),
    note: `sharp asks for libvips ${major}.${minor}.${micro}; this system packages ${imajor}.${iminor}.${imicro}, which its users run - built against it.`,
  };
}

export function buildSharpFromSource(dir, server, npm) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (process.platform === 'freebsd') {
    const commonH = join(dir, 'src', 'common.h');
    const installed = spawnSync('pkg-config', ['--modversion', 'vips-cpp'], { encoding: 'utf8' }).stdout;
    const { source, note } = acceptPackagedLibvips(readFileSync(commonH, 'utf8'), installed);
    if (note) {
      console.log(`::notice::${note}`);
      makeWritable(commonH);
      writeFileSync(commonH, source);
    }
  }
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
    if (name === 'sharp' && SHARP_SOURCE_PLATFORMS.includes(process.platform)) {
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
