'use strict';

// GHSA-477h-4r7f-fvrx / CVE-2026-102414: pbkdf2 <= 3.1.6 hands an over-long
// password to HMAC on EVERY iteration, so a 1 MiB password is re-hashed
// `iterations` times (denial of service). 3.1.7 hashes it once, as RFC 2104
// allows.
//
// WeKan gets pbkdf2 through meteor-node-stubs -> @meteorjs/crypto-browserify,
// and meteor-node-stubs ships it as a BUNDLED dependency: it is inside the
// meteor-node-stubs tarball, so npm `overrides` cannot reach it and there is no
// meteor-node-stubs release that bundles 3.1.7 (1.2.30 bundles 3.1.3). WeKan
// stopped forking meteor-node-stubs on purpose (tests/dependencySecurityUpdates
// pins that), so instead package.json depends on pbkdf2 ^3.1.7 directly and
// this script, run from "postinstall", removes the bundled copy. Node and
// Rspack then resolve `require('pbkdf2')` from crypto-browserify one level up,
// to the patched top-level package with its own correct dependencies.
//
// The bundled copy's entries are also removed from package-lock.json. npm
// writes the lockfile BEFORE postinstall runs, and it records whatever bundled
// directories it finds on disk, so an install over an older node_modules would
// otherwise put the vulnerable 3.1.3 entry back. Once the directory is gone npm
// keeps the lockfile pruned on later installs, lockfile-only updates and npm ci.
//
// Idempotent. Fails loudly when the patched package is missing, because a
// silent pass would leave the vulnerable copy in place. When a future
// meteor-node-stubs bundles a fixed pbkdf2 this does nothing. Also safe to run
// by hand: `node scripts/patch-meteor-node-stubs-pbkdf2.cjs`.

const fs = require('node:fs');
const path = require('node:path');

const NAME = 'pbkdf2';
const MINIMUM = '3.1.7';
const PARENT = 'meteor-node-stubs';

function compareVersions(a, b) {
  const pa = String(a).split('-')[0].split('.').map(Number);
  const pb = String(b).split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

function isPatched(version) {
  return typeof version === 'string' && compareVersions(version, MINIMUM) >= 0;
}

function readVersion(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  } catch (e) {
    return null;
  }
}

// Lockfile keys of the bundled copy and of everything nested inside it.
function bundledLockKeys(lock) {
  const prefix = `node_modules/${PARENT}/node_modules/${NAME}`;
  return Object.keys((lock && lock.packages) || {}).filter((key) => key === prefix || key.startsWith(`${prefix}/`));
}

function pruneLockfile(lockPath) {
  let text;
  try { text = fs.readFileSync(lockPath, 'utf8'); } catch (e) { return 0; }
  const lock = JSON.parse(text);
  const keys = bundledLockKeys(lock).filter((key) => {
    const main = `node_modules/${PARENT}/node_modules/${NAME}`;
    // Keep a bundled copy that is already patched; remove a vulnerable one and
    // the dependencies nested under it.
    return !isPatched(lock.packages[main] && lock.packages[main].version);
  });
  if (!keys.length) return 0;
  for (const key of keys) delete lock.packages[key];
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return keys.length;
}

function run(root) {
  const modules = path.join(root, 'node_modules');
  const parentDir = path.join(modules, PARENT);
  if (!fs.existsSync(parentDir)) return { removed: false, pruned: 0 };

  const topVersion = readVersion(path.join(modules, NAME));
  if (!isPatched(topVersion)) {
    throw new Error(`${NAME} ${topVersion || '(missing)'} is installed at the top level; ${MINIMUM} or newer is required to replace the copy bundled in ${PARENT} (GHSA-477h-4r7f-fvrx)`);
  }

  const bundledDir = path.join(parentDir, 'node_modules', NAME);
  const bundledVersion = readVersion(bundledDir);
  let removed = false;
  if (bundledVersion && !isPatched(bundledVersion)) {
    fs.rmSync(bundledDir, { recursive: true, force: true });
    removed = true;
  }

  // Every consumer inside meteor-node-stubs must now reach a patched copy.
  const consumers = [
    path.join(parentDir, 'node_modules', '@meteorjs', 'crypto-browserify'),
    path.join(parentDir, 'node_modules', 'parse-asn1'),
  ];
  for (const consumer of consumers) {
    if (!fs.existsSync(consumer)) continue;
    const resolved = require.resolve(`${NAME}/package.json`, { paths: [consumer] });
    const version = readVersion(path.dirname(resolved));
    if (!isPatched(version)) {
      throw new Error(`${path.relative(root, consumer)} still resolves ${NAME} ${version} at ${path.relative(root, resolved)}`);
    }
  }

  const pruned = pruneLockfile(path.join(root, 'package-lock.json'));
  return { removed, pruned, bundledVersion, topVersion };
}

module.exports = { run, compareVersions, isPatched, bundledLockKeys, MINIMUM };

if (require.main === module) {
  const result = run(path.join(__dirname, '..'));
  if (result.removed) {
    console.log(`patch-meteor-node-stubs-pbkdf2: removed bundled ${NAME} ${result.bundledVersion}; ${PARENT} now uses ${NAME} ${result.topVersion}`);
  }
  if (result.pruned) {
    console.log(`patch-meteor-node-stubs-pbkdf2: removed ${result.pruned} bundled ${NAME} entries from package-lock.json`);
  }
}
