'use strict';

// The Sandstorm .spk must carry the same Node.js, npm and FerretDB as every
// other platform - the versions https://wekan.fi/version.txt advertises.
// releases/update-website-version-info.sh writes that file from the
// Dockerfile's NODE_VERSION and NPM_VERSION and from ferretdb-latest-tag.sh, so
// build-deps.sh and the workflows that pack the .spk must use exactly those
// sources. build-deps.sh used to copy Meteor's dev-bundle node instead (which
// follows the Meteor release, not version.txt), defaulted to Node 24 without
// Meteor, and the Sandstorm workflows installed a hard-coded npm 12.0.2 while
// the Dockerfile said 12.2.0.
// Run: node tests/sandstormRuntimeVersions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const deps = read('sandstorm-src/build-deps.sh');
const site = read('releases/update-website-version-info.sh');
const dockerfile = read('Dockerfile');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sandstormRuntimeVersions:');

// Run a sed expression from a script against the real Dockerfile.
function sedOnDockerfile(expr) {
  const r = spawnSync('sed', ['-n', expr, path.join(ROOT, 'Dockerfile')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.split('\n')[0];
}

test('the grain Node is the Dockerfile pin that version.txt advertises', () => {
  const ours = deps.match(/NODE_PIN="\$\{SANDSTORM_NODE_VERSION:-\$\(sed -n '([^']+)' "\$REPO\/Dockerfile"/);
  assert.ok(ours, 'build-deps.sh must read NODE_VERSION from the Dockerfile');
  const theirs = site.match(/NODE_VERSION="\$\(sed -n '([^']+)' "\$WEKANREPODIR\/Dockerfile"/);
  assert.ok(theirs, 'update-website-version-info.sh reads NODE_VERSION from the Dockerfile');
  const pin = sedOnDockerfile(ours[1]);
  assert.match(pin, /^v\d+\.\d+\.\d+$/, 'an exact version, not a major');
  assert.strictEqual(pin, `v${sedOnDockerfile(theirs[1])}`, 'the grain Node differs from version.txt');
});

test('the grain Node is downloaded verified and checked after copying', () => {
  assert.ok(deps.includes('bash "$REPO/releases/embed-verified-node.sh" "$DEPS/bin/node" node-x64 "$NODE_PIN"'));
  assert.ok(/\[ "\$GOT" = "\$NODE_PIN" \]/.test(deps), 'the copied node must report the pinned version');
});

test('no other Node source or old default remains in build-deps.sh (negative)', () => {
  assert.ok(!/meteor node/.test(deps), "Meteor's dev-bundle node follows Meteor, not version.txt");
  assert.ok(!/\$\{NODE_VERSION:-/.test(deps), 'the workflows set NODE_VERSION to a bare major');
  assert.ok(!/nodejs\.org\/dist\/index\.json/.test(deps), 'no "newest of the major" lookup');
  assert.ok(!/\bNode ?24\b|\[24\]/i.test(deps), 'Node 24 left in build-deps.sh');
});

test('the grain FerretDB is the release version.txt names', () => {
  assert.ok(site.includes('releases/ferretdb-latest-tag.sh'));
  assert.ok(deps.includes('FERRETDB_TAG="${FERRETDB_TAG:-$(bash "$REPO/releases/ferretdb-latest-tag.sh")}"'));
  assert.ok(deps.includes('releases/download/$FERRETDB_TAG/ferretdb-amd64'));
});

test('every workflow that packs a .spk installs the Dockerfile npm', () => {
  assert.match(dockerfile, /NPM_VERSION=12\.\d+\.\d+/);
  const dir = path.join(ROOT, '.github/workflows');
  let packers = 0;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
    const yml = fs.readFileSync(path.join(dir, name), 'utf8');
    if (!yml.includes('sandstorm-src/build-deps.sh')) continue;
    packers += 1;
    assert.ok(/run: bash (src\/)?releases\/use-release-npm\.sh/.test(yml), `${name} must use releases/use-release-npm.sh`);
  }
  assert.ok(packers >= 4, `expected the four Sandstorm workflows, found ${packers}`);
});

test('no workflow hard-codes an npm version (negative)', () => {
  const dir = path.join(ROOT, '.github/workflows');
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
    const hits = fs.readFileSync(path.join(dir, name), 'utf8').match(/npm install (--global|-g) npm@\d[^\s]*/g) || [];
    assert.deepStrictEqual(hits, [], `${name} pins npm itself instead of the Dockerfile's NPM_VERSION`);
  }
});

test('the Sandstorm sources describe the Node they ship (negative)', () => {
  for (const rel of ['sandstorm-src/start.js', 'sandstorm-src/build-deps.sh', 'sandstorm-pkgdef.capnp',
                     'sandstorm.js', 'server/sandstorm.js', 'docs/Platforms/FOSS/Container/Sandstorm/Meteor3/Migration.md']) {
    assert.ok(!/\bNode ?24\b|node24/i.test(read(rel)), `${rel} still says Node 24`);
  }
});

console.log(`\nsandstormRuntimeVersions: ${passed} tests passed`);
