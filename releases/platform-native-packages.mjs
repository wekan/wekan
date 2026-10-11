#!/usr/bin/env node
// Give a bundle the platform packages its own platform and CPU load.
//
//     node releases/platform-native-packages.mjs <bundle dir> <win32|linux|darwin> <arch> [--dry-run]
//
// <arch> is Node's name for the CPU (process.arch): x64, arm64, ia32, arm,
// ppc64, s390x, riscv64, loong64. ppc64le is `ppc64` to Node, and armv6,
// armv7 and armhf are all `arm`.
//
// Why. Every bundle except amd64 is made from the amd64 Linux bundle, and npm
// installed that one's optional platform packages for linux-x64 only. sharp,
// which makes the attachment thumbnails (server/lib/imageThumbnail.js), loads
// `@img/sharp-<platform>-<arch>/sharp.node`, so on every other platform it
// found nothing and every thumbnail fell back to the full-size original - in
// v12.32 that was arm64, ppc64le, s390x, riscv64, i386, armhf, armv7, armv6,
// both macOS and all three Windows bundles, and every Docker image and snap
// made from them.
//
// What it does.
//   1. Removes every package under programs/server whose package.json `os`,
//      `cpu` or (on Linux) `libc` excludes this target - the rule npm installs
//      by, so these are exactly the packages an install here would not have
//      (@img/sharp-linux-x64, its libvips, @napi-rs/canvas-linux-x64-gnu...).
//   2. When the bundled sharp lists @img/sharp-<platform>-<arch>, downloads it
//      and its own libvips package at exactly the versions pinned, checks each
//      against the npm registry's sha512, and unpacks them beside sharp.
//      sharp publishes these for linux x64/arm64/arm/ppc64/s390x/riscv64,
//      darwin x64/arm64 and win32 x64/arm64/ia32.
//   3. For a CPU sharp publishes nothing for (Linux i386 and loong64), sharp
//      falls back to @img/sharp-wasm32, which WeKan's package.json installs
//      into every bundle. That is checked to be there and to match sharp.
//   4. Reads every remaining native addon's header (check-addon-arch.mjs), and
//      fails unless the sharp package from step 2 is loadable here.
//
// All in Node, on purpose: no shell `tar`, which in Git Bash reads a Windows
// drive letter as a remote host (see the build-win32 headers step).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { checkAddonArch, packageAllows, ELF_MACHINE, MACHO_CPU, PE_MACHINE } from './check-addon-arch.mjs';

export const TARGETS = { win32: Object.keys(PE_MACHINE), linux: Object.keys(ELF_MACHINE), darwin: Object.keys(MACHO_CPU) };
const REGISTRY = 'https://registry.npmjs.org';
const WASM = '@img/sharp-wasm32';

// The package sharp loads on <platform>-<arch>, at the version sharp pins -
// or null when sharp publishes none and falls back to WebAssembly.
export function sharpPlatformSpec(sharpPackageJson, platform, arch) {
  const name = `@img/sharp-${platform}-${arch}`;
  const version = sharpPackageJson.optionalDependencies?.[name];
  return version ? { name, version } : null;
}

// A minimal ustar reader: npm tarballs are ustar, with long paths in the
// prefix field. Entries are returned with the leading `package/` removed.
// Anything that would land outside the package directory is refused.
export function untar(buffer) {
  const files = [];
  let off = 0;
  let longName = null;
  while (off + 512 <= buffer.length) {
    const header = buffer.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const str = (a, b) => header.toString('utf8', a, b).replace(/\0.*$/s, '');
    const size = parseInt(str(124, 136).trim() || '0', 8);
    const type = str(156, 157) || '0';
    const prefix = str(345, 500);
    const name = longName ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
    longName = null;
    const body = buffer.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') {
      longName = body.toString('utf8').replace(/\0.*$/s, '');
      continue;
    }
    if (type === 'x' || type === 'g') {
      const path = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'));
      if (path) longName = path[1];
      continue;
    }
    if (type !== '0' && type !== '\0' && type !== '5') continue;
    const rel = name.replace(/^[^/]+\//, '');
    const clean = normalize(rel);
    if (!rel || clean.startsWith('..') || clean.startsWith(sep) || clean.startsWith('/') || /^[a-zA-Z]:/.test(clean)) {
      throw new Error(`refusing tar entry outside the package: ${name}`);
    }
    if (type === '5') continue;
    files.push({ path: rel, data: Buffer.from(body) });
  }
  return files;
}

export function verifyIntegrity(buffer, integrity) {
  const m = /^sha512-(.+)$/.exec(integrity || '');
  if (!m) throw new Error(`no sha512 integrity to check against (got ${integrity})`);
  const got = createHash('sha512').update(buffer).digest('base64');
  if (got !== m[1]) throw new Error(`integrity mismatch: registry ${m[1]}, downloaded ${got}`);
}

async function fetchRetry(url, as) {
  let last;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
      last = new Error(`${url}: HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 429) throw last;
    } catch (e) {
      last = e;
      if (/HTTP 4\d\d/.test(e.message) && !/HTTP 429/.test(e.message)) throw e;
    }
    await new Promise((r) => setTimeout(r, attempt * 5000));
  }
  throw last;
}

// Package directories: a node_modules/<name> or node_modules/@scope/<name>.
function packageDirs(root, out = []) {
  if (!existsSync(root)) return out;
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = join(root, e.name);
    if (e.name === 'node_modules') {
      for (const m of readdirSync(p, { withFileTypes: true })) {
        if (!m.isDirectory() || m.name.startsWith('.')) continue;
        const q = join(p, m.name);
        if (m.name.startsWith('@')) {
          for (const s of readdirSync(q, { withFileTypes: true })) {
            if (s.isDirectory()) out.push(join(q, s.name));
          }
        } else {
          out.push(q);
        }
      }
    }
    packageDirs(p, out);
  }
  return out;
}

// Packages npm would not install on <platform>-<arch>.
export function foreignPackages(serverDir, platform, arch) {
  const foreign = [];
  for (const dir of new Set(packageDirs(serverDir))) {
    const manifest = join(dir, 'package.json');
    if (!existsSync(manifest)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    } catch {
      continue;
    }
    if (!packageAllows(pkg, platform, arch)) foreign.push(dir);
  }
  // A removed package takes its own nested node_modules with it.
  return foreign.filter((d) => !foreign.some((o) => o !== d && d.startsWith(o + sep)));
}

async function download(name, version) {
  if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version)) {
    throw new Error(`${name}: expected an exact version, got ${version}`);
  }
  const meta = await fetchRetry(`${REGISTRY}/${name.replace('/', '%2F')}/${version}`, 'json');
  const tarball = await fetchRetry(meta.dist.tarball, 'buffer');
  verifyIntegrity(tarball, meta.dist.integrity);
  return { meta, files: untar(gunzipSync(tarball)) };
}

function writePackage(dest, files) {
  rmSync(dest, { recursive: true, force: true });
  for (const f of files) {
    const out = resolve(dest, f.path);
    if (!out.startsWith(resolve(dest) + sep)) throw new Error(`refusing ${f.path}`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, f.data);
  }
}

export async function addPlatformNativePackages(bundle, platform, arch, { dryRun = false, log = console.log } = {}) {
  if (!TARGETS[platform]?.includes(arch)) {
    throw new Error(`unknown target ${platform}-${arch}; expected one of ${Object.entries(TARGETS).map(([p, a]) => `${p}-{${a.join(',')}}`).join(' ')}`);
  }
  const server = join(bundle, 'programs', 'server');
  const modules = join(server, 'npm', 'node_modules');
  const sharpManifest = join(modules, 'sharp', 'package.json');
  if (!existsSync(sharpManifest)) throw new Error(`no sharp in ${relative(bundle, modules)}`);
  const sharp = JSON.parse(readFileSync(sharpManifest, 'utf8'));

  const removed = foreignPackages(server, platform, arch);
  for (const dir of removed) {
    log(`remove  ${relative(bundle, dir)} (its package.json names another platform)`);
    if (!dryRun) rmSync(dir, { recursive: true, force: true });
  }

  const added = [];
  const spec = sharpPlatformSpec(sharp, platform, arch);
  if (spec) {
    const { meta, files } = await download(spec.name, spec.version);
    const install = [{ ...spec, files }];
    // Its libvips: an optionalDependency of the platform package, pinned exactly.
    for (const [dep, version] of Object.entries(meta.optionalDependencies || {})) {
      install.push({ name: dep, version, files: (await download(dep, version)).files });
    }
    for (const p of install) {
      const dest = join(modules, ...p.name.split('/'));
      if (!dryRun) writePackage(dest, p.files);
      log(`add     ${relative(bundle, dest)} ${p.version} (${p.files.length} files, sha512 verified)`);
      added.push({ name: p.name, version: p.version });
    }
  } else {
    // sharp publishes nothing native for this CPU; it falls back to WebAssembly.
    const wasm = join(modules, ...WASM.split('/'), 'package.json');
    if (!existsSync(wasm)) {
      throw new Error(`sharp ${sharp.version} has no ${platform}-${arch} package, and ${WASM} is not in the bundle to fall back to - is it in package.json's optionalDependencies?`);
    }
    const wasmVersion = JSON.parse(readFileSync(wasm, 'utf8')).version;
    if (wasmVersion !== sharp.version) {
      throw new Error(`${WASM} ${wasmVersion} does not match sharp ${sharp.version}`);
    }
    if (!existsSync(join(modules, '@emnapi', 'runtime', 'package.json'))) {
      throw new Error(`${WASM} needs @emnapi/runtime, and it is not in the bundle`);
    }
    log(`keep    ${WASM} ${wasmVersion}: sharp publishes no ${platform}-${arch} binary, so it runs as WebAssembly`);
  }

  if (dryRun) return { removed: removed.map((d) => relative(bundle, d)), added, errors: [] };
  const { errors, good, skipped } = checkAddonArch(bundle, arch, spec ? [spec.name] : [], { platform });
  for (const g of good) log(`ok      ${g}`);
  for (const s of skipped) log(`--      ${s} (another platform's package)`);
  return { removed: removed.map((d) => relative(bundle, d)), added, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
  const [bundle, platform, arch] = args;
  if (!bundle || !platform || !arch) {
    console.error('usage: platform-native-packages.mjs <bundle dir> <win32|linux|darwin> <arch> [--dry-run]');
    process.exit(2);
  }
  addPlatformNativePackages(bundle, platform, arch, { dryRun: process.argv.includes('--dry-run') })
    .then(({ errors }) => {
      for (const e of errors) console.log(`::error::${e}`);
      if (errors.length) process.exit(1);
      console.log(`platform-native-packages: ${platform}-${arch} bundle has the native packages it loads.`);
    })
    .catch((e) => {
      console.error(`::error::platform-native-packages: ${e.message}`);
      process.exit(1);
    });
}
