'use strict';

// Admin Panel / Settings / Version says HOW WeKan was installed - bundle.zip,
// Snap, Docker or Sandstorm - and that answer is the first thing a support reply
// turns on: the same version keeps its data somewhere else, carries a different
// database and gives the admin different reach in each of the four.
//
// The detection is a pure function precisely so it can be checked here, without
// a snap, a container or a Sandstorm grain - none of which this sandbox has. The
// negative tests are the point of the file: a guess that answers "Docker" for a
// snap, or "bundle.zip" for a grain, is worse than no field at all, because it
// is read as fact.
//
// Run: node tests/platformPackaging.test.cjs

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const { detectPackaging, PACKAGINGS, CONTAINER_MARKERS } =
  require(path.join(repoRoot, 'models/lib/platformPackaging.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A fake filesystem: only the paths listed exist.
const exists = (...paths) => p => paths.includes(p);

console.log('platformPackaging:');

test('a plain install is the bundle .zip', () => {
  assert.strictEqual(detectPackaging({ env: {}, fileExists: exists() }), 'bundle.zip');
  // And with nothing passed at all, rather than throwing: the pane must render.
  assert.strictEqual(detectPackaging(), 'bundle.zip');
  assert.strictEqual(detectPackaging({}), 'bundle.zip');
});

test('snapd\'s own variables mean Snap, either one of them', () => {
  assert.strictEqual(detectPackaging({ env: { SNAP: '/snap/wekan/3609' } }), 'Snap');
  assert.strictEqual(detectPackaging({ env: { SNAP_NAME: 'wekan' } }), 'Snap');
  // An empty value is not a snap - an exported-but-empty variable says nothing.
  assert.strictEqual(detectPackaging({ env: { SNAP: '', SNAP_NAME: '  ' } }), 'bundle.zip');
});

test('a container runtime\'s marker file means Docker', () => {
  for (const marker of CONTAINER_MARKERS) {
    assert.strictEqual(detectPackaging({ env: {}, fileExists: exists(marker) }), 'Docker',
      `${marker} is a container marker`);
  }
  // Podman writes /run/.containerenv rather than /.dockerenv, and both answer
  // the question the pane is asking ("is this an image, not an unpacked zip").
  assert.ok(CONTAINER_MARKERS.includes('/.dockerenv'));
  assert.ok(CONTAINER_MARKERS.includes('/run/.containerenv'));
});

test('the Sandstorm flag wins over the container markers', () => {
  // A grain IS a container, so asking the container question first would answer
  // "Docker" for every Sandstorm install - the exact wrong answer, since a grain
  // is the one packaging where the admin has no machine to log in to.
  assert.strictEqual(
    detectPackaging({ env: {}, isSandstorm: true, fileExists: exists('/.dockerenv') }),
    'Sandstorm');
});

test('Snap wins over the container markers too', () => {
  // Some systems make a confined snap look like a container to those markers.
  assert.strictEqual(
    detectPackaging({ env: { SNAP_NAME: 'wekan' }, fileExists: exists('/.dockerenv') }),
    'Snap');
});

test('WEKAN_PACKAGING is the answer when it is set (negative: whitespace is not)', () => {
  assert.strictEqual(detectPackaging({ env: { WEKAN_PACKAGING: 'Kubernetes' } }), 'Kubernetes');
  // Even against every other signal: a packaging that names itself is not guessed at.
  assert.strictEqual(
    detectPackaging({
      env: { WEKAN_PACKAGING: 'Debian package', SNAP_NAME: 'wekan' },
      isSandstorm: true,
      fileExists: exists('/.dockerenv'),
    }),
    'Debian package');
  // Set but empty is NOT an answer - it must fall through, or an empty variable
  // in a start script would blank the field.
  assert.strictEqual(detectPackaging({ env: { WEKAN_PACKAGING: '   ' } }), 'bundle.zip');
  assert.strictEqual(detectPackaging({ env: { WEKAN_PACKAGING: 42 } }), 'bundle.zip');
});

test('an unreadable filesystem root answers bundle.zip instead of throwing', () => {
  // fs.existsSync does not throw, but the pane must not depend on that: a
  // statistics method that throws leaves the admin with an empty Version page.
  const boom = () => { throw new Error('EACCES'); };
  assert.strictEqual(detectPackaging({ env: {}, fileExists: boom }), 'bundle.zip');
});

test('the four the Version pane names are the four this returns', () => {
  assert.deepStrictEqual(PACKAGINGS, ['bundle.zip', 'Snap', 'Docker', 'Sandstorm']);
  const answers = new Set([
    detectPackaging({ env: {} }),
    detectPackaging({ env: { SNAP_NAME: 'wekan' } }),
    detectPackaging({ env: {}, fileExists: exists('/.dockerenv') }),
    detectPackaging({ env: {}, isSandstorm: true }),
  ]);
  assert.deepStrictEqual([...answers].sort(), [...PACKAGINGS].sort());
});

test('the server asks it with the real environment, and the pane shows the answer', () => {
  // The wiring, not the guess: a perfect detector nothing calls is not a feature.
  const server = fs.readFileSync(path.join(repoRoot, 'server/statistics.js'), 'utf8');
  assert.ok(/detectPackaging\(\{/.test(server), 'server/statistics.js calls detectPackaging');
  assert.ok(/env: process\.env/.test(server), 'with the real environment');
  assert.ok(/isSandstorm/.test(server), 'and the real Sandstorm flag');
  assert.ok(/fileExists: p => fs\.existsSync\(p\)/.test(server), 'and the real filesystem');
  assert.ok(/statistics\.platform = \{/.test(server), 'and puts it on statistics.platform');

  const jade = fs.readFileSync(
    path.join(repoRoot, 'client/components/settings/informationBody.jade'), 'utf8');
  assert.ok(/statistics\.platform\.packaging/.test(jade),
    'the Version pane shows statistics.platform.packaging');
});

console.log(`\nplatformPackaging: ${passed} tests passed`);
