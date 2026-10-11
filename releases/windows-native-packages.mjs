#!/usr/bin/env node
// Give a Windows bundle the platform packages its own CPU loads.
//
//     node releases/windows-native-packages.mjs <bundle dir> <ia32|x64|arm64> [--dry-run]
//
// Why. Every Windows bundle is made from the amd64 Linux bundle, and npm
// installed that one's optional platform packages for linux-x64 only. sharp,
// which makes the attachment thumbnails (server/lib/imageThumbnail.js), loads
// `@img/sharp-<platform>-<arch>/sharp.node` - so on Windows it found nothing,
// and every thumbnail fell back to the full-size original. sharp publishes
// @img/sharp-win32-ia32, -x64 and -arm64, libvips DLLs included, so nothing
// has to be compiled: the bundle only needs the right package.
//
// What it does.
//   1. Reads the bundled sharp's version and optionalDependencies, and takes
//      @img/sharp-win32-<arch> at exactly the version sharp lists. Downloads its
//      tarball from the npm registry, checks it against the registry's sha512
//      integrity, and unpacks it beside sharp in node_modules/@img/.
//   2. Removes every package under programs/server whose package.json `os` or
//      `cpu` excludes win32/<arch> - the rule npm itself installs by, so these
//      are exactly the packages an install on this platform would not have.
//      @img/sharp-linux-x64, its libvips and @napi-rs/canvas-linux-x64-gnu are
//      what this removes today.
//
// All in Node, on purpose: no shell `tar`, which in Git Bash reads a Windows
// drive letter as a remote host (see the build-win32 headers step).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { listAllows } from './check-addon-arch.mjs';

export const ARCHES = ['ia32', 'x64', 'arm64'];
const REGISTRY = 'https://registry.npmjs.org';

// The package sharp loads on win32/<arch>, at the version sharp itself pins.
export function sharpPlatformSpec(sharpPackageJson, arch) {
  const name = `@img/sharp-win32-${arch}`;
  const version = sharpPackageJson.optionalDependencies?.[name];
  if (!version) {
    throw new Error(`sharp ${sharpPackageJson.version} lists no ${name}: it does not support win32-${arch}`);
  }
  return { name, version };
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
    let name = longName ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
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
    if (!rel || clean.startsWith('..') || clean.startsWith(sep) || /^[a-zA-Z]:/.test(clean)) {
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

// Packages npm would not install on win32/<arch>.
export function foreignPackages(serverDir, arch) {
  const seen = new Set();
  const foreign = [];
  for (const dir of packageDirs(serverDir)) {
    if (seen.has(dir)) continue;
    seen.add(dir);
    const manifest = join(dir, 'package.json');
    if (!existsSync(manifest)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    } catch {
      continue;
    }
    if (!listAllows(pkg.os, 'win32') || !listAllows(pkg.cpu, arch)) foreign.push(dir);
  }
  // A removed package takes its own nested node_modules with it.
  return foreign.filter((d) => !foreign.some((o) => o !== d && d.startsWith(o + sep)));
}

export async function addWindowsNativePackages(bundle, arch, { dryRun = false, log = console.log } = {}) {
  if (!ARCHES.includes(arch)) throw new Error(`unknown arch ${arch}; expected one of ${ARCHES.join(', ')}`);
  const server = join(bundle, 'programs', 'server');
  const modules = join(server, 'npm', 'node_modules');
  const sharpManifest = join(modules, 'sharp', 'package.json');
  if (!existsSync(sharpManifest)) throw new Error(`no sharp in ${relative(bundle, modules)}`);

  const removed = foreignPackages(server, arch);
  for (const dir of removed) {
    log(`remove  ${relative(bundle, dir)} (its package.json names another platform)`);
    if (!dryRun) rmSync(dir, { recursive: true, force: true });
  }

  const { name, version } = sharpPlatformSpec(JSON.parse(readFileSync(sharpManifest, 'utf8')), arch);
  const meta = await fetchRetry(`${REGISTRY}/${name.replace('/', '%2F')}/${version}`, 'json');
  const tarball = await fetchRetry(meta.dist.tarball, 'buffer');
  verifyIntegrity(tarball, meta.dist.integrity);
  const files = untar(gunzipSync(tarball));
  const dest = join(modules, ...name.split('/'));
  if (!dryRun) {
    rmSync(dest, { recursive: true, force: true });
    for (const f of files) {
      const out = resolve(dest, f.path);
      if (!out.startsWith(resolve(dest) + sep)) throw new Error(`refusing ${f.path}`);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, f.data);
    }
  }
  log(`add     ${relative(bundle, dest)} ${version} (${files.length} files, sha512 verified)`);
  return { removed: removed.map((d) => relative(bundle, d)), added: { name, version, dest } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
  const [bundle, arch] = args;
  if (!bundle || !arch) {
    console.error('usage: windows-native-packages.mjs <bundle dir> <ia32|x64|arm64> [--dry-run]');
    process.exit(2);
  }
  addWindowsNativePackages(bundle, arch, { dryRun: process.argv.includes('--dry-run') }).catch((e) => {
    console.error(`::error::windows-native-packages: ${e.message}`);
    process.exit(1);
  });
}
