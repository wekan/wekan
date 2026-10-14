#!/usr/bin/env node
// Builds a single-file WeKan from one platform's release bundle
// (docs/Platforms/Single-File.md).
//
//   node releases/single-file/build.mjs --bundle <dir> --target <t> \
//        --version <v> --out <file> [--node <binary>] [--ferretdb <binary>]
//
// <dir> is the unpacked `bundle` directory of that platform's published ZIP:
// it already holds that platform's Node.js, its FerretDB and its native
// addons, compiled where they run. This script adds nothing platform-specific
// of its own. It only:
//
//   1. writes one ZIP: the bundle (minus Node.js, FerretDB and the shell
//      launchers, which a single file does not use), the launcher scripts,
//      FerretDB under bin/, and single-file.json saying what is inside;
//   2. asks THIS Node.js to build a single executable application from the
//      bundle's own Node.js with that ZIP as its virtual file system
//      ("useVfs" + "vfsArchive"), which Node 26.11+ mounts without unpacking.
//
// The SEA blob format belongs to one Node.js version, so the Node.js running
// this script must be the same version as the bundle's. That is checked from
// the release URL compiled into the target binary, which can be read without
// running it (a Windows or macOS binary cannot run on the Linux builder).

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFiles, writeZip } from './zip.mjs';
import { MINI_FILES, patchMiniFiles } from './meteor-device-paths.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');

// Bundle files a single file does not carry: its own Node.js is the
// executable, FerretDB goes to bin/, and the shell launchers are replaced by
// launcher.cjs. node-runtime holds Linux libraries Node.js needs BEFORE any
// JavaScript runs, which therefore cannot come from inside the executable.
// The MongoDB Database Tools and qemu are programs of their own, which a
// virtual file system cannot start; the single file backs up by copying
// wekan-files instead.
export const BUNDLE_EXCLUDE = new Set([
  'node', 'node.exe', 'ferretdb', 'ferretdb.exe', 'cpu-exec',
  'start-wekan.sh', 'start-wekan.bat', 'node-runtime', 'mongo-tools', 'mongo-tools.exe',
]);

export function excludedFromBundle(rel) {
  if (rel.includes('/')) return false;
  return BUNDLE_EXCLUDE.has(rel) || /^(mongo[a-z]*|bsondump|qemu-[a-z0-9_]+)(\.exe)?$/.test(rel);
}

// The launcher's own files, kept at their repository paths inside the ZIP.
export const LAUNCHER_FILES = [
  'releases/single-file/launcher.cjs',
  'models/lib/filesRoot.js',
  'releases/ferretdb/sqlite-recovery.mjs',
  'releases/ferretdb/recovery-bridge.mjs',
];

export const MAIN_STUB = "'use strict';\nrequire('./releases/single-file/launcher.cjs');\n";

export function nodeVersionOf(binary) {
  const bytes = fs.readFileSync(binary);
  const match = /nodejs\.org\/download\/release\/(v\d+\.\d+\.\d+)\//.exec(bytes.toString('latin1'));
  return match ? match[1] : null;
}

export function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function isWindowsTarget(target) {
  return /^win/.test(target);
}

export function outputName(version, target) {
  return `wekan-${version}-${target}-single-file${isWindowsTarget(target) ? '.exe' : ''}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument ${key}`);
    out[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  for (const need of ['bundle', 'target', 'version', 'out']) {
    if (!out[need]) throw new Error(`--${need} is required`);
  }
  return out;
}

export function archiveEntries({ bundle, target, version, ferretdb, nodeVersion, built }) {
  const exe = isWindowsTarget(target) ? '.exe' : '';
  const entries = listFiles(bundle, 'bundle/', {
    exclude: rel => excludedFromBundle(rel),
  });
  // Meteor's path conversion, taught the device path the archive is mounted at
  // on Windows (meteor-device-paths.mjs). Harmless elsewhere: it is used only
  // when process.platform is win32.
  const miniFiles = entries.find(e => e.name === MINI_FILES);
  if (!miniFiles) throw new Error(`${bundle} has no ${MINI_FILES.slice('bundle/'.length)}: not a WeKan bundle.`);
  miniFiles.data = patchMiniFiles(fs.readFileSync(miniFiles.file, 'utf8'));
  delete miniFiles.file;
  for (const rel of LAUNCHER_FILES) entries.push({ name: rel, file: path.join(repo, rel) });
  for (const rel of fs.readdirSync(path.join(here, 'lib')).filter(f => f.endsWith('.cjs')).sort()) {
    entries.push({ name: `releases/single-file/lib/${rel}`, file: path.join(here, 'lib', rel) });
  }
  const ferretName = `bin/ferretdb${exe}`;
  entries.push({ name: ferretName, file: ferretdb, mode: 0o100755 });
  let meteor = '';
  try {
    meteor = JSON.parse(fs.readFileSync(path.join(bundle, 'star.json'), 'utf8')).meteorRelease || '';
  } catch (e) {
    meteor = '';
  }
  const manifest = {
    format: 1,
    version,
    target,
    node: nodeVersion || '',
    meteor: meteor.replace(/^METEOR@/, ''),
    ferretdb: { path: ferretName, sha256: sha256(ferretdb), bytes: fs.statSync(ferretdb).size },
    built,
  };
  entries.push({ name: 'single-file.json', data: `${JSON.stringify(manifest, null, 2)}\n` });
  return { entries, manifest };
}

const TARGETS_32_BIT = new Set(['win32', 'i386', 'armv7', 'armhf', 'armv6']);
export function targetBits(target) {
  return TARGETS_32_BIT.has(target) ? 32 : 64;
}
export function archBits(arch) {
  return ['ia32', 'arm', 'mipsel', 'ppc'].includes(arch) ? 32 : 64;
}

export function build(opts) {
  const bundle = path.resolve(opts.bundle);
  const exe = isWindowsTarget(opts.target) ? '.exe' : '';
  for (const need of ['main.js', 'programs/server/boot.js', 'programs/server/program.json']) {
    if (!fs.existsSync(path.join(bundle, need))) {
      throw new Error(`${bundle} has no ${need}: not a WeKan bundle.`);
    }
  }
  const node = path.resolve(opts.node || path.join(bundle, `node${exe}`));
  const ferretdb = path.resolve(opts.ferretdb || path.join(bundle, `ferretdb${exe}`));
  for (const [what, file] of [['Node.js', node], ['FerretDB', ferretdb]]) {
    if (!fs.existsSync(file)) throw new Error(`No ${what} at ${file}.`);
  }
  const nodeVersion = nodeVersionOf(node);
  const explicitHost = opts.hostNode || opts['host-node'];
  const hostNode = explicitHost || process.execPath;
  // The SEA blob writes its lengths as size_t, so it is read only by a Node.js
  // of the builder's pointer width: a 32-bit target built by a 64-bit Node.js
  // found no archive and stopped at once (win32, v12.41-v12.44 - and i386 and
  // 32-bit ARM, which no runner starts). Any 32-bit little-endian Node.js of
  // the same version writes it for every 32-bit target (single-file.yml uses
  // the i386 bundle's).
  const hostArch = explicitHost
    ? execFileSync(hostNode, ['-p', 'process.arch'], { encoding: 'utf8' }).trim()
    : process.arch;
  if (targetBits(opts.target) !== archBits(hostArch)) {
    throw new Error(`${opts.target} is a ${targetBits(opts.target)}-bit target, but the Node.js building it is ${hostArch}: `
      + 'build it with a Node.js of the same pointer width (--host-node).');
  }
  const hostVersion = explicitHost
    ? execFileSync(hostNode, ['-p', 'process.version'], { encoding: 'utf8' }).trim()
    : process.version;
  if (nodeVersion && nodeVersion !== hostVersion) {
    throw new Error(`The bundle's Node.js is ${nodeVersion} but this is ${hostVersion}: `
      + 'a single executable must be built by the same Node.js version it embeds.');
  }
  if (!nodeVersion) {
    console.warn(`warning: could not read the Node.js version of ${node}; building with ${hostVersion}.`);
  }
  const out = path.resolve(opts.out);
  const work = fs.mkdtempSync(path.join(path.dirname(out), '.single-file-'));
  try {
    const built = opts.built || new Date().toISOString();
    const { entries, manifest } = archiveEntries({
      bundle, target: opts.target, version: opts.version, ferretdb, nodeVersion: nodeVersion || hostVersion, built,
    });
    const zip = path.join(work, 'wekan.zip');
    const written = writeZip(zip, entries);
    console.log(`Archive: ${written.entries} files, ${(written.bytes / 1048576).toFixed(1)} MiB.`);
    const main = path.join(work, 'wekan-single-file.cjs');
    fs.writeFileSync(main, MAIN_STUB);
    const config = path.join(work, 'sea-config.json');
    fs.writeFileSync(config, JSON.stringify({
      main,
      output: out,
      executable: node,
      useVfs: true,
      vfsArchive: zip,
      disableExperimentalSEAWarning: true,
    }, null, 2));
    execFileSync(hostNode, ['--build-sea', config], { stdio: 'inherit' });
    fs.chmodSync(out, 0o755);
    // macOS will not run an arm64 binary whose signature no longer matches,
    // and injecting the archive invalidated it. Ad-hoc signing needs a Mac.
    if (/^mac|^darwin/.test(opts.target)) {
      if (process.platform === 'darwin') {
        execFileSync('codesign', ['--sign', '-', '--force', out], { stdio: 'inherit' });
      } else {
        console.warn('warning: a macOS single file must be signed on macOS (codesign --sign -).');
      }
    }
    const digest = sha256(out);
    fs.writeFileSync(`${out}.sha256sum`, `${digest}  ${path.basename(out)}\n`);
    console.log(`${path.basename(out)}: ${(fs.statSync(out).size / 1048576).toFixed(1)} MiB, sha256 ${digest}`);
    return { out, manifest, digest };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    build(parseArgs(process.argv.slice(2)));
  } catch (err) {
    console.error(`single-file build: ${err.message}`);
    process.exit(1);
  }
}
