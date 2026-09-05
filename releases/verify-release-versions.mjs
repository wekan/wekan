#!/usr/bin/env node

// Fail a release before it commits or publishes when version.sh left one of the
// release-critical consumers stale. This is intentionally read-only.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const expected = (process.argv[2] || '').replace(/^v/, '');
const root = process.env.WEKAN_VERSION_ROOT
  ? path.resolve(process.env.WEKAN_VERSION_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const semver = /^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[-+][0-9A-Za-z.-]+)?$/;
if (!semver.test(expected)) {
  console.error(`verify-release-versions: invalid expected WeKan version: ${expected}`);
  process.exit(2);
}

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const requireMatch = (file, pattern, wanted, label) => {
  const match = read(file).match(pattern);
  const actual = match?.[1];
  if (actual !== wanted) errors.push(`${file}: ${label} is ${actual || 'missing'}, expected ${wanted}`);
};

const packageVersion = expected.split('.').length === 2 ? `v${expected}.0` : `v${expected}`;
requireMatch('package.json', /^\s*"version":\s*"([^"]+)"/m,
  packageVersion, 'root version');
const lock = JSON.parse(read('package-lock.json'));
if (lock.version !== packageVersion)
  errors.push(`package-lock.json: root version is ${lock.version}, expected ${packageVersion}`);
if (lock.packages?.['']?.version !== packageVersion)
  errors.push(`package-lock.json: packages[""].version is ${lock.packages?.['']?.version || 'missing'}, expected ${packageVersion}`);
requireMatch('Dockerfile', /^ARG VERSION=([^\s]+)$/m, expected, 'image version');
requireMatch('Stackerfile.yml', /^appVersion:\s*"([^"]+)"/m,
  packageVersion, 'application version');
requireMatch('snapcraft.yaml', /^version:\s*['"]?([^'"\s]+)['"]?$/m,
  expected, 'snap version');
requireMatch('sandstorm-pkgdef.capnp', /appVersion\s*=\s*([0-9]+),/,
  expected.replaceAll('.', ''), 'Sandstorm numeric version');
requireMatch('sandstorm-pkgdef.capnp', /appMarketingVersion\s*=\s*\(defaultText\s*=\s*"([^"~]+)~/,
  expected, 'Sandstorm marketing version');

const snap = read('snapcraft.yaml');
for (const match of snap.matchAll(/(?:wekan-|releases\/download\/v)([0-9]+\.[0-9]+(?:\.[0-9]+)?)(?:-|\/)/g)) {
  if (match[1] !== expected)
    errors.push(`snapcraft.yaml: bundle reference is ${match[1]}, expected ${expected}`);
}

const meteorRelease = read('.meteor/release').trim().replace(/^METEOR@/, '');
if (!semver.test(meteorRelease)) errors.push(`.meteor/release: invalid Meteor version ${meteorRelease}`);
requireMatch('Dockerfile', /METEOR_RELEASE=METEOR@([^\s\\]+)/,
  meteorRelease, 'Meteor metadata');

if (errors.length) {
  for (const error of errors) console.error(`::error::release version mismatch: ${error}`);
  process.exit(1);
}
console.log(`OK: all release-critical version references agree on WeKan ${expected}; Meteor is ${meteorRelease}.`);
