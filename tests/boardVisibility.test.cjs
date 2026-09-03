'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/boardVisibility.js'), 'utf8');
const policy = {};
new Function('exports', source.replace(/export \{ canReadBoard \};/,
  'exports.canReadBoard = canReadBoard;'))(policy);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function board(visibility) {
  return { isVisibleBy: user => visibility(user) };
}

console.log('boardVisibility:');

test('anonymous and authenticated readers may read a public board', () => {
  const publicBoard = board(() => true);
  assert.strictEqual(policy.canReadBoard(null, publicBoard), true);
  assert.strictEqual(policy.canReadBoard('member', publicBoard), true);
});

test('an active member may read a private board', () => {
  const privateBoard = board(user => user && user._id === 'member');
  assert.strictEqual(policy.canReadBoard('member', privateBoard), true);
});

test('anonymous and non-member readers are denied a private board', () => {
  const privateBoard = board(user => user && user._id === 'member');
  assert.strictEqual(policy.canReadBoard(null, privateBoard), false);
  assert.strictEqual(policy.canReadBoard('outsider', privateBoard), false);
});

test('a missing or malformed board is denied', () => {
  assert.strictEqual(policy.canReadBoard('member', null), false);
  assert.strictEqual(policy.canReadBoard('member', {}), false);
});

test('DDP publications and HTTP routes use the same policy', () => {
  for (const file of [
    'server/publications/cardsWindow.js',
    'server/publications/legacyAttachments.js',
    'server/methods/positionHistory.js',
    'server/routes/legacyAttachments.js',
    'server/routes/universalFileServer.js',
  ]) {
    const contents = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(contents.includes('canReadBoard'), `${file} must use canReadBoard`);
  }
});

test('position history has one transport error edge around the shared policy', () => {
  const contents = fs.readFileSync(
    path.join(root, 'server/methods/positionHistory.js'), 'utf8');
  assert.strictEqual((contents.match(/board\.isVisibleBy/g) || []).length, 0);
  assert.strictEqual((contents.match(/async function assertCanReadBoard/g) || []).length, 1);
  assert.strictEqual((contents.match(/await assertCanReadBoard/g) || []).length, 14);
});

console.log(`\nboardVisibility: ${passed} tests passed`);
