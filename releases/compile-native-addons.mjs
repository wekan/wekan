#!/usr/bin/env node
// Compile a bundle's native addons for a Windows CPU that has no prebuild.
//
//     node releases/compile-native-addons.mjs <bundle dir> <ia32|arm64|x64> [--nodedir DIR] <package ...>
//
// Why. accounts-password imports bcrypt and argon2 with no fallback, and they
// publish no win32-ia32 prebuild, and argon2 0.44 none for win32-arm64. The
// Windows jobs relied on npm's lifecycle to compile them during the
// programs/server install (Meteor's npm-rebuild.js runs `npm rebuild` in each
// rebuild directory). That stopped working with npm 12, which the release jobs
// use: it ignores npm_config_arch / npm_config_target_arch / npm_config_nodedir
// ("Unknown env config") and blocks install scripts outside allowScripts
// ("install scripts blocked"). In v12.33 both build-win32 and build-win-arm64
// compiled nothing, and check-addon-arch.mjs refused the bundle:
//
//   ...accounts-password/node_modules/argon2 has no arm64 Windows addon to load
//
// So the compile no longer depends on npm. This runs node-gyp itself - the one
// programs/server's install brought, pinned by bump-bundle-node-gyp.mjs to a
// version that finds Visual Studio 2026 - with the target CPU on the command
// line, for every copy of each named package that has a binding.gyp and no
// prebuild for win32-<arch>. node-gyp-build loads build/Release before
// prebuilds/, so the result is what Node opens. Run it after the programs/server
// install and BEFORE prune-build-only-modules.mjs, which removes node-gyp.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const ARCHES = ['ia32', 'x64', 'arm64'];

// Every node_modules/<name> under root, for a plain or scoped package name.
export function packageCopies(root, name) {
  const seg = name.split('/');
  const out = [];
  (function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const p = join(dir, e.name);
      if (e.name === 'node_modules') {
        const candidate = join(p, ...seg);
        if (existsSync(join(candidate, 'package.json'))) out.push(candidate);
      }
      walk(p);
    }
  })(root);
  return [...new Set(out)];
}

// node-gyp-build's rule: a prebuilds/<platform>-<arch>[+arch] directory with a
// .node in it is what it loads instead of compiling.
export function hasPrebuild(dir, arch) {
  const base = join(dir, 'prebuilds');
  if (!existsSync(base)) return false;
  return readdirSync(base).some((d) => {
    const [platform, archs = ''] = d.split('-');
    if (platform !== 'win32' || !archs.split('+').includes(arch)) return false;
    try {
      return readdirSync(join(base, d)).some((f) => f.endsWith('.node'));
    } catch {
      return false;
    }
  });
}

export function plan(bundle, arch, packages) {
  const server = join(bundle, 'programs', 'server');
  const compile = [];
  const skip = [];
  const missing = [];
  for (const name of packages) {
    const copies = packageCopies(join(server, 'npm'), name);
    if (copies.length === 0) missing.push(name);
    for (const dir of copies) {
      if (!existsSync(join(dir, 'binding.gyp'))) skip.push({ dir, why: 'no binding.gyp' });
      else if (hasPrebuild(dir, arch)) skip.push({ dir, why: `prebuild for win32-${arch}` });
      else compile.push(dir);
    }
  }
  return { compile, skip, missing };
}

export function nodeGypPath(bundle) {
  return join(bundle, 'programs', 'server', 'node_modules', 'node-gyp', 'bin', 'node-gyp.js');
}

export function compileNativeAddons(bundle, arch, packages, { nodedir = '', run = spawnSync, log = console.log } = {}) {
  if (!ARCHES.includes(arch)) throw new Error(`unknown arch ${arch}; expected one of ${ARCHES.join(', ')}`);
  const gyp = nodeGypPath(bundle);
  const { compile, skip, missing } = plan(bundle, arch, packages);
  if (missing.length) throw new Error(`not in the bundle: ${missing.join(', ')}`);
  for (const s of skip) log(`skip    ${relative(bundle, s.dir)} (${s.why})`);
  if (compile.length && !existsSync(gyp)) {
    throw new Error(`${relative(bundle, gyp)} is missing; run this before prune-build-only-modules.mjs`);
  }
  for (const dir of compile) {
    const args = [gyp, 'rebuild', `--arch=${arch}`, `--directory=${dir}`];
    if (nodedir) args.push(`--nodedir=${nodedir}`);
    log(`compile ${relative(bundle, dir)} for win32-${arch}`);
    const r = run(process.execPath, args, { stdio: 'inherit', cwd: dir, env: { ...process.env } });
    if (r.error || r.status !== 0) {
      throw new Error(`node-gyp failed for ${relative(bundle, dir)} (${r.error ? r.error.message : `exit ${r.status}`})`);
    }
    const out = join(dir, 'build', 'Release');
    if (!existsSync(out) || !readdirSync(out).some((f) => f.endsWith('.node'))) {
      throw new Error(`node-gyp left no .node in ${relative(bundle, out)}`);
    }
  }
  return { compiled: compile.map((d) => relative(bundle, d)), skipped: skip.map((s) => relative(bundle, s.dir)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const ni = args.indexOf('--nodedir');
  const nodedir = ni === -1 ? '' : args.splice(ni, 2)[1];
  const [bundle, arch, ...packages] = args;
  if (!bundle || !arch || packages.length === 0) {
    console.error('usage: compile-native-addons.mjs <bundle dir> <ia32|arm64|x64> [--nodedir DIR] <package ...>');
    process.exit(2);
  }
  try {
    const { compiled } = compileNativeAddons(bundle, arch, packages, { nodedir });
    console.log(`compile-native-addons: compiled ${compiled.length} addon(s) for win32-${arch}.`);
  } catch (e) {
    console.log(`::error::compile-native-addons: ${e.message}`);
    process.exit(1);
  }
}
