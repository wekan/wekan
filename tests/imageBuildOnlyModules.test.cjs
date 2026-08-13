'use strict';

// What is BUILT WITH does not have to be SHIPPED.
// Run: node tests/imageBuildOnlyModules.test.cjs
//
// A container scan of ghcr.io/wekan/wekan:v10.91 reported 80 findings against
// "Node.js", three of them CRITICAL, and not one of them was in code WeKan runs:
//
//   tar 6.2.1   x2  node-gyp's and cacache's own copies, in the bundle
//   tar 7.5.11      npm's own copy, in /usr/local/lib/node_modules/npm
//   sigstore, @sigstore/*, ip-address, brace-expansion   npm's, same place
//
// Two build tools, shipped by accident. `npm` runs exactly once in the image -
// the `npm install` that populates programs/server - and the container starts
// bash + wekan-entrypoint.sh, which never calls it. node-gyp and
// @mapbox/node-pre-gyp are there to COMPILE native modules during that install,
// and the bundle compiles none: uWebSockets.js, bcrypt and argon2 all ship
// prebuilt .node files that node-gyp-build picks at require time.
//
// So both go, after the install that needs them:
//   - releases/prune-build-only-modules.mjs walks what is reachable from
//     programs/server/package.json without those two, and removes the rest - 83
//     of 120 packages, verified by booting the pruned bundle.
//   - the Dockerfile deletes npm and npx in its cleanup step.
//
// This suite pins that both still happen, in the image AND in every .zip.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const dockerfile = read('Dockerfile');
const workflow = read('.github/workflows/release-all.yml');
const installNode = read('releases/install-node-for-arch.sh');
const pruner = read('releases/prune-build-only-modules.mjs');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('imageBuildOnlyModules:');

test('the pruner exists and is driven by reachability, not by a list', () => {
  // A hardcoded list of 83 package names would be wrong the first time Meteor
  // changed a dev-bundle dependency, and wrong silently.
  assert.ok(/BUILD_ONLY = \['node-gyp', '@mapbox\/node-pre-gyp'\]/.test(pruner),
    'the two build-only roots are named');
  assert.ok(/keep\.add\(name\)/.test(pruner) && /depsOf\(name\)/.test(pruner),
    'and everything else is kept or dropped by walking dependencies from them');
});

test('it never touches the Meteor packages\' own npm dependencies', () => {
  // programs/server/npm/node_modules/meteor/<package>/node_modules is loaded at
  // run time. Only the top level of programs/server/node_modules is pruned.
  assert.ok(/does NOT touch/.test(pruner) && /npm\/node_modules/.test(pruner),
    'the script says so');
  assert.ok(!/rmSync\([^)]*npm[/\\]node_modules/.test(pruner),
    'and removes nothing under npm/node_modules');
});

test('the image prunes after its install, and before the bundle is moved', () => {
  const install = dockerfile.indexOf('npm install --prefix ./bundle/programs/server');
  const prune = dockerfile.indexOf('node /tmp/prune-build-only-modules.mjs');
  const move = dockerfile.indexOf('mv /home/wekan/app/bundle /build');
  assert.ok(install > 0 && prune > install && move > prune,
    'install, then prune, then move');
  assert.ok(/COPY --chmod=755 releases\/prune-build-only-modules\.mjs/.test(dockerfile),
    'and the script is copied in, or the RUN dies on a missing file');
});

test('the image ships no npm and no npx', () => {
  assert.ok(/rm -rf \/usr\/local\/lib\/node_modules\/npm \/usr\/local\/bin\/npm \/usr\/local\/bin\/npx/
    .test(dockerfile), 'npm, npx and npm\'s own node_modules are removed');
  const remove = dockerfile.indexOf('rm -rf /usr/local/lib/node_modules/npm');
  const install = dockerfile.indexOf('npm install --prefix ./bundle/programs/server');
  assert.ok(remove > install,
    'and removed AFTER the install that needs it, not before');
});

test('node itself stays - that is what runs WeKan (negative)', () => {
  // The guard against over-correcting: this is about npm, not about node.
  assert.ok(!/rm -rf [^\n]*\/usr\/local\/bin\/node\b/.test(dockerfile),
    'the node binary is never removed');
  assert.ok(/ln -s "\/usr\/local\/bin\/node" "\/usr\/local\/bin\/nodejs"/.test(dockerfile),
    'and is still linked as nodejs');
});

test('every leg that installs programs/server prunes afterwards', () => {
  // A leg that installs and does not prune ships the tree again in its .zip.
  // `bash "$SRC/releases/npm-retry.sh" npm install` and the unquoted container
  // form; the bcrypt replacements use --ignore-scripts and are not these.
  const installs = workflow.split('\n')
    .filter(l => /npm-retry\.sh"? npm install/.test(l) && !/--ignore-scripts/.test(l));
  assert.ok(installs.length >= 6, `expected the per-arch installs, found ${installs.length}`);
  const prunes = (workflow.match(/prune-build-only-modules\.mjs/g) || []).length;
  assert.ok(prunes >= installs.length - 1,
    `${installs.length} bundle installs but only ${prunes} prunes`);
  assert.ok(/prune-build-only-modules\.mjs/.test(installNode),
    'and the extra-arch containers prune in install-node-for-arch.sh');
});

test('the container legs prune INSIDE the container, where node is', () => {
  // /releases is mounted read-only and /bundle read-write; the runner's own node
  // is not what those legs run.
  assert.ok(/node \/releases\/prune-build-only-modules\.mjs \/bundle/.test(workflow),
    'the arm64 leg prunes through the mounted path');
});

console.log(`\nimageBuildOnlyModules: ${passed} tests passed`);
