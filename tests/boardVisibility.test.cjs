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

// The instance choice grants viewing to signed-in users, not editing to everyone.
test('instance visibility translations retain source tokens and confirmation emphasis', () => {
  const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
  const { JSDOM } = require('jsdom');
  const readLocale = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
  const en = readLocale('en');
  const keys = ['instance', 'instance-desc', 'board-instance-info'];
  const codes = fs.readdirSync(path.join(root, 'imports/i18n/data'))
    .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file))
    .map(file => file.replace('.i18n.json', ''));
  const pending = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/pending-transifex.json'), 'utf8'));
  for (const key of keys) assert.ok(!pending.keys.some(entry => entry.key === key), key + ': filled group leaves pending inventory');
  for (const code of codes) {
    const locale = readLocale(code);
    assert.deepStrictEqual(Object.keys(locale), Object.keys(en), `${code}: source order`);
    for (const key of keys) {
      assert.ok(locale[key].trim(), `${code}: ${key} nonempty`);
      assert.notStrictEqual(locale[key], en[key], `${code}: ${key} filled`);
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}: ${key} tokens`);
      assert.deepStrictEqual(locale[key].match(/<[^>]*>/g), en[key].match(/<[^>]*>/g), `${code}: ${key} markup`);
    }
    const fragment = JSDOM.fragment(locale['board-instance-info']);
    assert.strictEqual(fragment.querySelectorAll('strong').length, 1, `${code}: one emphasis`);
    assert.ok(fragment.querySelector('strong').textContent.trim(), `${code}: emphasized audience`);
  }
  assert.notDeepStrictEqual('<strong>audience'.match(/<[^>]*>/g), en['board-instance-info'].match(/<[^>]*>/g), 'missing closing emphasis is detected');
});

console.log(`\nboardVisibility: ${passed} tests passed`);
