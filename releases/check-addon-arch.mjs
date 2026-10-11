#!/usr/bin/env node
// Check that a Windows bundle's native addons are built for its own CPU.
//
//     node releases/check-addon-arch.mjs <bundle dir> <ia32|x64|arm64> [package ...]
//
// Why. The win32 bundle is assembled on a 64-bit runner from the amd64 bundle,
// and its addons (bcrypt and argon2, which Meteor's accounts-password imports
// with no fallback) are cross-compiled with npm_config_arch=ia32. If any step
// of that quietly does nothing - a skipped rebuild, a nodedir node-gyp did not
// use - the zip still builds, still passes `7z t`, and ships a 64-bit or Linux
// .node that a 32-bit node.exe cannot load. Nobody would see it until the
// first person tried to sign in. So this reads the binary itself.
//
// What it checks. Every *.node outside a prebuilds/ directory is what Node's
// require() or node-gyp-build's build/Release lookup loads, so each must be a
// PE file for the wanted machine. prebuilds/ holds one directory per platform
// and node-gyp-build opens only the matching one, so other platforms' files
// there are expected and ignored. Each package named on the command line must
// have at least one loadable addon for the wanted CPU, in build output or in
// its own prebuilds/win32-<arch>/.
//
// A package whose package.json `os` or `cpu` excludes this target is skipped
// as well, by the same rule npm itself applies: the amd64 bundle carries
// platform packages such as @img/sharp-linux-x64 (os: linux), which their
// parent package only ever loads on that platform.

import { readdirSync, openSync, readSync, closeSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PE_MACHINE = { ia32: 0x014c, x64: 0x8664, arm64: 0xaa64 };

// The binary format and, for PE, its machine field.
export function readBinaryKind(file) {
  const fd = openSync(file, 'r');
  try {
    const head = Buffer.alloc(64);
    const n = readSync(fd, head, 0, 64, 0);
    if (n >= 4 && head.readUInt32BE(0) === 0x7f454c46) return { format: 'ELF' };
    if (n >= 4 && [0xcffaedfe, 0xcefaedfe, 0xcafebabe].includes(head.readUInt32BE(0))) {
      return { format: 'Mach-O' };
    }
    if (n < 64 || head.toString('latin1', 0, 2) !== 'MZ') return { format: 'unknown' };
    const peOffset = head.readUInt32LE(0x3c);
    const pe = Buffer.alloc(6);
    if (readSync(fd, pe, 0, 6, peOffset) < 6 || pe.toString('latin1', 0, 4) !== 'PE\0\0') {
      return { format: 'unknown' };
    }
    return { format: 'PE', machine: pe.readUInt16LE(4) };
  } finally {
    closeSync(fd);
  }
}

// npm's os/cpu rule: a list excludes a value when it names it with "!", or
// when it names only positive values and this is not one of them.
export function listAllows(list, value) {
  if (!Array.isArray(list) || list.length === 0) return true;
  if (list.includes(`!${value}`)) return false;
  const positive = list.filter((v) => !v.startsWith('!'));
  return positive.length === 0 || positive.includes(value);
}

// The package a file belongs to, if its package.json declares a platform
// this target is not: such a package is never loaded here.
function foreignPlatformPackage(bundle, file, arch) {
  let dir = dirname(file);
  while (dir.length >= bundle.length) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        if (!listAllows(pkg.os, 'win32') || !listAllows(pkg.cpu, arch)) return relative(bundle, dir);
      } catch {
        // An unreadable manifest declares nothing.
      }
      return null;
    }
    if (dirname(dir) === dir) break;
    dir = dirname(dir);
  }
  return null;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.node')) out.push(p);
  }
  return out;
}

const describe = (k) =>
  k.format === 'PE'
    ? `PE machine 0x${k.machine.toString(16).padStart(4, '0')}`
    : k.format;

export function checkAddonArch(bundle, arch, packages = []) {
  const want = PE_MACHINE[arch];
  if (!want) throw new Error(`unknown arch ${arch}; expected one of ${Object.keys(PE_MACHINE).join(', ')}`);
  const errors = [];
  const good = [];
  const skipped = [];
  const files = walk(bundle);
  for (const f of files) {
    const foreign = foreignPlatformPackage(bundle, f, arch);
    if (foreign) {
      skipped.push(relative(bundle, f));
      continue;
    }
    const parts = relative(bundle, f).split(sep);
    const pi = parts.lastIndexOf('prebuilds');
    const kind = readBinaryKind(f);
    const ok = kind.format === 'PE' && kind.machine === want;
    if (pi === -1) {
      if (ok) good.push(f);
      else errors.push(`${relative(bundle, f)} is ${describe(kind)}, not a ${arch} Windows addon`);
    } else if (parts[pi + 1] === `win32-${arch}`) {
      if (ok) good.push(f);
      else errors.push(`${relative(bundle, f)} is ${describe(kind)}, in the ${arch} prebuilds`);
    }
  }
  for (const name of packages) {
    // Every copy of the package in the bundle, by its node_modules/<name> path.
    const dirs = new Set(
      files
        .map((f) => relative(bundle, f).split(sep))
        .map((parts) => {
          // A scoped name (@img/sharp-win32-x64) is two path segments.
          const seg = name.split('/');
          for (let i = parts.length - 1 - seg.length; i >= 1; i--) {
            if (parts[i - 1] === 'node_modules' && seg.every((s, k) => parts[i + k] === s)) {
              return parts.slice(0, i + seg.length).join(sep);
            }
          }
          return null;
        })
        .filter(Boolean),
    );
    if (dirs.size === 0) {
      errors.push(`no native addon of ${name} is in the bundle at all`);
      continue;
    }
    for (const d of dirs) {
      if (!good.some((g) => relative(bundle, g).startsWith(d + sep))) {
        errors.push(`${d} has no ${arch} Windows addon to load`);
      }
    }
  }
  return { errors, good: good.map((g) => relative(bundle, g)), skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [bundle, arch, ...packages] = process.argv.slice(2);
  if (!bundle || !arch || !statSync(bundle, { throwIfNoEntry: false })?.isDirectory()) {
    console.error('usage: check-addon-arch.mjs <bundle dir> <ia32|x64|arm64> [package ...]');
    process.exit(2);
  }
  const { errors, good, skipped } = checkAddonArch(bundle, arch, packages);
  for (const g of good) console.log(`ok  ${g}`);
  for (const s of skipped) console.log(`--  ${s} (its package is for another platform)`);
  for (const e of errors) console.log(`::error::${e}`);
  if (errors.length) process.exit(1);
  console.log(`check-addon-arch: ${good.length} ${arch} addon(s), all loadable by a ${arch} node.exe.`);
}
