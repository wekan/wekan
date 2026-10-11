#!/usr/bin/env node
// Check that a bundle's native addons are built for its own platform and CPU.
//
//     node releases/check-addon-arch.mjs <bundle dir> <arch> [package ...] [--platform win32|linux|darwin]
//
// <arch> is Node's name for the CPU (process.arch): x64, arm64, ia32, arm,
// ppc64, s390x, riscv64, loong64. --platform defaults to win32.
//
// Why. Every bundle except amd64 is assembled from the amd64 Linux bundle and
// then has its native modules replaced for its own platform. If any step of
// that quietly does nothing - a skipped rebuild, a platform package that never
// arrived - the zip still builds and still passes `7z t`, and ships a .node
// its node cannot load. bcrypt and argon2 (accounts-password imports both with
// no fallback) would fail the first sign-in; sharp would silently turn every
// thumbnail into the full-size image. So this reads each binary's header.
//
// What it checks. Every *.node outside a prebuilds/ directory is what Node's
// require() or node-gyp-build's build/Release lookup loads, so each must be a
// binary for this platform's format (PE, ELF, Mach-O) and CPU. prebuilds/
// holds one directory per platform and node-gyp-build opens only the matching
// one, so other platforms' files there are ignored. Each package named on the
// command line must have at least one loadable addon for this platform/CPU.
//
// A package whose package.json `os`, `cpu` or (on Linux) `libc` excludes this
// target is skipped, by the same rule npm itself installs by: the amd64 bundle
// carries platform packages such as @img/sharp-linux-x64, which their parent
// only ever loads on that platform.

import { readdirSync, openSync, readSync, closeSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PE_MACHINE = { ia32: 0x014c, x64: 0x8664, arm64: 0xaa64 };
export const ELF_MACHINE = {
  ia32: 3, x64: 62, arm: 40, arm64: 183, ppc64: 21, s390x: 22, riscv64: 243, loong64: 258,
};
export const MACHO_CPU = { x64: 0x01000007, arm64: 0x0100000c };
const FORMAT = { win32: 'PE', linux: 'ELF', darwin: 'Mach-O' };
const MACHINES = { win32: PE_MACHINE, linux: ELF_MACHINE, darwin: MACHO_CPU };

// The binary format, and the CPU(s) it is for.
export function readBinaryKind(file) {
  const fd = openSync(file, 'r');
  try {
    const head = Buffer.alloc(64);
    const n = readSync(fd, head, 0, 64, 0);
    if (n >= 20 && head.readUInt32BE(0) === 0x7f454c46) {
      // e_machine is in the file's own byte order (EI_DATA: 1 little, 2 big).
      const machine = head[5] === 2 ? head.readUInt16BE(18) : head.readUInt16LE(18);
      return { format: 'ELF', machine };
    }
    if (n >= 8 && [0xcffaedfe, 0xcefaedfe].includes(head.readUInt32BE(0))) {
      return { format: 'Mach-O', cpus: [head.readUInt32LE(4)] };
    }
    if (n >= 8 && head.readUInt32BE(0) === 0xcafebabe) {
      // A universal binary: a count, then 20-byte entries starting with cputype.
      const count = head.readUInt32BE(4);
      const table = Buffer.alloc(count * 20);
      readSync(fd, table, 0, table.length, 8);
      const cpus = [];
      for (let i = 0; i < count; i++) cpus.push(table.readUInt32BE(i * 20));
      return { format: 'Mach-O', cpus };
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

export function isFor(kind, platform, arch) {
  const want = MACHINES[platform]?.[arch];
  if (want === undefined || kind.format !== FORMAT[platform]) return false;
  return kind.format === 'Mach-O' ? kind.cpus.includes(want) : kind.machine === want;
}

// npm's os/cpu/libc rule: a list excludes a value when it names it with "!",
// or when it names only positive values and this is not one of them.
export function listAllows(list, value) {
  if (!Array.isArray(list) || list.length === 0) return true;
  if (list.includes(`!${value}`)) return false;
  const positive = list.filter((v) => !v.startsWith('!'));
  return positive.length === 0 || positive.includes(value);
}

export function packageAllows(pkg, platform, arch) {
  return listAllows(pkg.os, platform) && listAllows(pkg.cpu, arch) &&
    (platform !== 'linux' || listAllows(pkg.libc, 'glibc'));
}

// The package a file belongs to, if its package.json declares a platform
// this target is not: such a package is never loaded here.
function foreignPlatformPackage(bundle, file, platform, arch) {
  let dir = dirname(file);
  while (dir.length >= bundle.length) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        if (!packageAllows(pkg, platform, arch)) return relative(bundle, dir);
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

// node-gyp-build's prebuilds/<platform>-<arch>[+<arch>...] directory names.
function prebuildMatches(dirName, platform, arch) {
  const [p, archs = ''] = dirName.split('-');
  return p === platform && archs.split('+').includes(arch);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.node')) out.push(p);
  }
  return out;
}

const describe = (k) => {
  if (k.format === 'PE') return `PE machine 0x${k.machine.toString(16).padStart(4, '0')}`;
  if (k.format === 'ELF') return `ELF machine ${k.machine}`;
  if (k.format === 'Mach-O') return `Mach-O cpu ${k.cpus.map((c) => `0x${c.toString(16)}`).join('+')}`;
  return k.format;
};
const PLATFORM_NAME = { win32: 'Windows', linux: 'Linux', darwin: 'macOS' };

export function checkAddonArch(bundle, arch, packages = [], { platform = 'win32' } = {}) {
  if (MACHINES[platform]?.[arch] === undefined) {
    throw new Error(`unknown target ${platform}-${arch}; ${platform} CPUs: ${Object.keys(MACHINES[platform] || {}).join(', ')}`);
  }
  const target = `${arch} ${PLATFORM_NAME[platform]}`;
  const errors = [];
  const good = [];
  const skipped = [];
  const files = walk(bundle);
  for (const f of files) {
    if (foreignPlatformPackage(bundle, f, platform, arch)) {
      skipped.push(relative(bundle, f));
      continue;
    }
    const parts = relative(bundle, f).split(sep);
    const pi = parts.lastIndexOf('prebuilds');
    const kind = readBinaryKind(f);
    const ok = isFor(kind, platform, arch);
    if (pi === -1) {
      if (ok) good.push(f);
      else errors.push(`${relative(bundle, f)} is ${describe(kind)}, not a ${target} addon`);
    } else if (prebuildMatches(parts[pi + 1] || '', platform, arch)) {
      if (ok) good.push(f);
      else errors.push(`${relative(bundle, f)} is ${describe(kind)}, in the ${target} prebuilds`);
    }
  }
  for (const name of packages) {
    // Every copy of the package in the bundle, by its node_modules/<name> path.
    const seg = name.split('/');
    const dirs = new Set(
      files
        .map((f) => relative(bundle, f).split(sep))
        .map((parts) => {
          // A scoped name (@img/sharp-win32-x64) is two path segments.
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
        errors.push(`${d} has no ${target} addon to load`);
      }
    }
  }
  return { errors, good: good.map((g) => relative(bundle, g)), skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--platform');
  const platform = pi === -1 ? 'win32' : args.splice(pi, 2)[1];
  const [bundle, arch, ...packages] = args;
  if (!bundle || !arch || !statSync(bundle, { throwIfNoEntry: false })?.isDirectory()) {
    console.error('usage: check-addon-arch.mjs <bundle dir> <arch> [package ...] [--platform win32|linux|darwin]');
    process.exit(2);
  }
  const { errors, good, skipped } = checkAddonArch(bundle, arch, packages, { platform });
  for (const g of good) console.log(`ok  ${g}`);
  for (const s of skipped) console.log(`--  ${s} (its package is for another platform)`);
  for (const e of errors) console.log(`::error::${e}`);
  if (errors.length) process.exit(1);
  console.log(`check-addon-arch: ${good.length} ${platform}-${arch} addon(s), all loadable there.`);
}
