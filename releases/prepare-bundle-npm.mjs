#!/usr/bin/env node
// npm 12 rejects URL dependencies by default. Meteor's server bundle declares
// its commit-pinned source-map-support tarball directly; allow only root URLs.
import { readFileSync, writeFileSync, existsSync, chmodSync, statSync } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
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
  // Meteor passes a node-pre-gyp option to npm itself. npm 12 rejects that
  // unknown CLI option before rebuilding anything. Keep npm rebuild and its
  // lifecycle scripts; remove only Meteor's obsolete default argument.
  let changed = false;
  const rebuildFile = join(server, 'npm-rebuild-args.js');
  if (existsSync(rebuildFile)) {
    const before = readFileSync(rebuildFile, 'utf8');
    const after = before.replace(
      /var args = \["rebuild",\s*(?:\/\/[^\n]*\n\s*)*"--update-binary"\];/,
      '// npm 12 accepts npm options only; native install scripts still run.\nvar args = ["rebuild"];',
    );
    if (after.includes('"--update-binary"') || after.includes("'--update-binary'")) {
      throw new Error('Review unexpected Meteor npm rebuild arguments');
    }
    if (after !== before) {
      chmodSync(rebuildFile, statSync(rebuildFile).mode | 0o200);
      writeFileSync(rebuildFile, after);
      changed = true;
    }
  }
  const rebuildsFile = join(server, 'npm-rebuilds.json');
  const directories = existsSync(rebuildsFile)
    ? JSON.parse(readFileSync(rebuildsFile, 'utf8')) : [];
  if (!Array.isArray(directories)) throw new Error('Invalid Meteor rebuild directories');
  for (const directory of directories) {
    if (typeof directory !== 'string' || isAbsolute(directory) ||
        relative(server, resolve(server, directory)).split(/[\\/]/).includes('..')) {
      throw new Error('Invalid Meteor rebuild directory');
    }
  }
  // npm 12 requires project policies in package.json. Using allow-scripts in
  // .npmrc leaks into the nested rebuild as a forbidden npm_config environment
  // override. Only these reviewed runtime installers need lifecycle execution.
  if (existsSync(rebuildsFile)) {
    for (const directory of new Set([server, ...directories.map(dir => resolve(server, dir))])) {
      const manifest = join(directory, 'package.json');
      const data = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : { private: true };
      const policy = { argon2: true, bcrypt: true, 'useragent-ng': true };
      if (JSON.stringify(data.allowScripts) !== JSON.stringify(policy)) {
        data.allowScripts = policy;
        if (existsSync(manifest)) chmodSync(manifest, statSync(manifest).mode | 0o200);
        writeFileSync(manifest, JSON.stringify(data, null, 2) + '\n');
        changed = true;
      }
    }
  }
  if (!remote.length) return changed;
  const file = join(server, '.npmrc');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const lines = before.split(/\r?\n/).filter(line => !/^\s*allow-remote\s*=/.test(line));
  while (lines.at(-1) === '') lines.pop();
  const after = lines.concat('allow-remote=root', '').join('\n');
  if (before !== after) {
    writeFileSync(file, after);
    changed = true;
  }
  return changed;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const changed = prepareBundleNpm(resolve(process.argv[2] || '.build/bundle'));
    console.log('prepare-bundle-npm: ' + (changed ? 'updated bundle npm compatibility' : 'configuration ready'));
  } catch (error) {
    console.error('::error::' + error.message);
    process.exitCode = 1;
  }
}
