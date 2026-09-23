#!/usr/bin/env node
// npm 12 rejects URL dependencies by default. Meteor's server bundle declares
// its commit-pinned source-map-support tarball directly; allow only root URLs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function prepareBundleNpm(bundle) {
  const server = join(bundle, 'programs/server');
  const pkg = JSON.parse(readFileSync(join(server, 'package.json'), 'utf8'));
  if (pkg.name !== 'meteor-dev-bundle') throw new Error('Expected a Meteor server bundle');
  const remote = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter(([, value]) => /^https?:/.test(value));
  for (const [name, value] of remote) {
    if (name !== 'source-map-support' ||
        !/^https:\/\/github\.com\/meteor\/node-source-map-support\/tarball\/[a-f0-9]{40}$/.test(value)) {
      throw new Error(`Review unexpected bundle URL dependency: ${name}`);
    }
  }
  if (!remote.length) return false;
  const file = join(server, '.npmrc');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const lines = before.split(/\r?\n/).filter(line => !/^\s*allow-remote\s*=/.test(line));
  while (lines.at(-1) === '') lines.pop();
  const after = lines.concat('allow-remote=root', '').join('\n');
  if (before === after) return false;
  writeFileSync(file, after);
  return true;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const changed = prepareBundleNpm(resolve(process.argv[2] || '.build/bundle'));
    console.log('prepare-bundle-npm: ' + (changed ? 'allowed pinned Meteor root tarball' : 'configuration ready'));
  } catch (error) {
    console.error('::error::' + error.message);
    process.exitCode = 1;
  }
}
