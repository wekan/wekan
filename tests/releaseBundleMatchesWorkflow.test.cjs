'use strict';

// Guard: "Build WeKan release bundle" builds what the Release All workflow does.
// Run: node tests/releaseBundleMatchesWorkflow.test.cjs
//
// WHY THIS EXISTS. `meteor build .build --directory` produces a bundle nobody
// downloads. What a release publishes is that bundle plus the server's npm
// modules, three prunes, the sockjs / legacy-client / source-map trim, a
// verified Node.js, FerretDB, the MongoDB Database Tools and a launcher — and
// three releases running broke in exactly that difference:
//
//   v10.96  boot.js read a source map the trim had deleted and left NAMED
//   v10.97  the prune's graph could not see module.link(), so the bundle
//           shipped without nodemailer-openpgp
//   v10.98  meteor-spk rebuilt the bundle, throwing away 405 MiB of trimming
//
// None of it was reproducible locally, because locally there was only `meteor
// build`. releases/build-release-bundle.sh closes that gap by running the
// workflow's OWN steps, and this suite is what stops the two drifting: a step
// added to the workflow and not to the script would put the difference straight
// back, silently, and the symptom would again be a release that does not start.
//
// It reads both files rather than running anything, so it needs no network, no
// Meteor and no bundle.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const script = read('releases/build-release-bundle.sh');
const workflow = read('.github/workflows/release-all.yml');
const buildSh = read('build.sh');
const buildBat = read('build.bat');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseBundleMatchesWorkflow:');

// The base bundle job — every other architecture's bundle is derived from this
// one, so its post-processing is the definition of "what a release bundle is".
// Comment lines are dropped before anything is looked for. A step's YAML
// comments explain what the job does NOT do as often as what it does - the
// bundle-trim call, for one, spells out which flag it deliberately omits and
// which other script repacks its output - and a script named in prose is not
// a script the job runs.
const baseJob = (() => {
  const start = workflow.indexOf('\n  build-amd64:');
  const end = workflow.indexOf('\n  build-arm64:', start);
  assert.ok(start > 0 && end > start, 'release-all.yml must have a build-amd64 job');
  return workflow.slice(start, end)
    .split('\n').filter(line => !/^\s*#/.test(line)).join('\n');
})();

test('every release script the workflow runs, the local build runs too', () => {
  // Found rather than listed: a step added to the workflow is covered here
  // without editing this file, which is the whole point - a list would have to
  // be remembered, and remembering is what failed three times.
  const used = [...new Set([...baseJob.matchAll(/releases\/([\w.-]+\.(?:mjs|sh))/g)]
    .map(m => m[1]))]
    // Not part of making the bundle: these describe or publish the artifact.
    .filter(s => ![
      'apt-install.sh',        // the runner's own OS packages
      'fetch.sh',              // used by both, through the helpers below
      'npm-retry.sh',          // ditto
      'record-provenance.sh',  // release notes, not the bundle
      'ferretdb-latest-tag.sh',// ditto
      'require-binaries.sh',   // preflight for a job that must not start
    ].includes(s));

  assert.ok(used.length >= 5, `expected the workflow to run several release scripts, found ${used.length}`);
  const missing = used.filter(s => !script.includes(`releases/${s}`));
  assert.deepStrictEqual(missing, [],
    'releases/build-release-bundle.sh does not run these, so a local bundle is '
    + `not what a release ships: ${missing.join(', ')}`);
});

test('and with the same arguments, where the arguments are the behaviour', () => {
  // bundle-trim's flags ARE the difference between a bundle that boots and one
  // that does not: --transport sockjs removes uWebSockets.js, and
  // --drop-legacy-client removes the second client build AND its name in the
  // two manifests. A local build that trimmed differently would answer a
  // different question than the one being asked.
  for (const flag of ['--transport sockjs', '--drop-legacy-client']) {
    assert.ok(baseJob.includes(flag), `the workflow should pass ${flag}`);
    assert.ok(script.includes(flag), `build-release-bundle.sh must pass ${flag} too`);
  }
});

test('the boot check is not optional in either', () => {
  // The check that was missing when v10.96 and v10.97 shipped. It is the reason
  // to build a release bundle locally at all, so it must be in the script -
  // and it must be reachable, not commented out.
  assert.ok(baseJob.includes('bundle-smoke-boot.sh'), 'the workflow smoke-boots the bundle');
  const line = script.split('\n').find(l => l.includes('bundle-smoke-boot.sh') && !l.trim().startsWith('#'));
  assert.ok(line, 'build-release-bundle.sh must actually run bundle-smoke-boot.sh');
});

test('the binaries a release embeds are the binaries this embeds', () => {
  // Node.js, FerretDB, the eight MongoDB Database Tools, the launcher, and
  // #6458's cpu-exec + qemu-user. Named one by one because a bundle missing any
  // of them still starts on a developer machine that has its own - and then
  // does not start for anybody who downloads it.
  assert.ok(/embed-verified-node\.sh/.test(script), 'a verified Node.js');
  assert.ok(/FerretDB\/releases\/latest\/download/.test(script), 'FerretDB from wekan/FerretDB');
  assert.ok(/mongo-tools-patches\/releases\/latest\/download/.test(script), 'the MongoDB tools');
  const tools = 'bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop';
  assert.ok(script.includes(tools),
    'all eight MongoDB Database Tools, in the order the workflow lists them');
  assert.ok(script.includes(tools) && baseJob.includes(tools), 'and the same eight as the workflow');
  assert.ok(/releases\/ferretdb\/\$LAUNCHER/.test(script), 'the launcher');
  assert.ok(/sqlite-recovery\.mjs/.test(script), 'verified SQLite snapshot and recovery helper');
  assert.ok(/snap-src\/bin\/cpu-exec/.test(script), 'cpu-exec (#6458)');
  assert.ok(/qemu-x86_64|qemu-aarch64/.test(script), 'and this arch\'s qemu-user');
});

test('it makes no .zip, and claims no release (negative)', () => {
  // A local bundle is a directory to start, not an artifact to publish. A zip,
  // a checksum file or a provenance row here would be a release that nobody
  // released - the exact confusion that makes a "did you test the release
  // build" answer worthless.
  const code = script.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
  for (const forbidden of ['zip -r', 'record-provenance.sh', 'gh release']) {
    assert.ok(!code.includes(forbidden),
      `build-release-bundle.sh must not ${forbidden} - it builds a bundle, it does not publish one`);
  }
});

test('the release menu entry runs it, and the test path does not', () => {
  // Two entries: "Build WeKan release bundle" builds what a release builds, and
  // "Build WeKan development bundle" is the plain `meteor build` that entry used
  // to be. The TEST path deliberately takes the plain one - it runs the bundle
  // under its own node and its own mongod, and downloading a hundred megabytes
  // of binaries it will not use to test WeKan's source is the wrong trade.
  for (const label of ['Build WeKan release bundle', 'Build WeKan development bundle']) {
    assert.ok(buildSh.includes(`"${label}"`), `build.sh must offer ${label}`);
    assert.ok(buildBat.includes(label), `build.bat must offer ${label}`);
  }
  assert.ok(/WEKAN_BUILD_RELEASE_BUNDLE=1 build_wekan/.test(buildSh),
    'the "Build WeKan" menu entry must ask for the release bundle');
  assert.ok(/WEKAN_BUILD_RELEASE_BUNDLE:-0/.test(buildSh),
    'and build_wekan must default it OFF, so the test path is unaffected');

  // The test path calls build_wekan bare. If it ever gained the prefix, a test
  // run would start downloading release binaries.
  const testCalls = buildSh.split('\n')
    .filter(l => /^\s*build_wekan\b/.test(l) || /WEKAN_BUILD_RELEASE_BUNDLE=1 build_wekan/.test(l));
  const withRelease = testCalls.filter(l => l.includes('WEKAN_BUILD_RELEASE_BUNDLE=1'));
  assert.strictEqual(withRelease.length, 1,
    `exactly one caller asks for the release bundle, found ${withRelease.length}`);
});

test('build.bat does the same, through the same script (negative)', () => {
  // Not a batch reimplementation. build.bat says why in its own comment on the
  // git actions: a second copy of the steps is how this file drifted before.
  assert.ok(buildBat.includes('bash releases/build-release-bundle.sh'),
    'build.bat must run the same script rather than reimplementing it');
  assert.ok(!/bundle-trim\.mjs|prune-unreachable-npm\.mjs/.test(buildBat),
    'build.bat must not run the release steps itself');
});

console.log(`\nreleaseBundleMatchesWorkflow: ${passed} tests passed`);
