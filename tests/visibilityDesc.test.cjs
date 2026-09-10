'use strict';

// imports/i18n/lib/visibilityDesc.js - the board visibility popup's Private/
// Public sub-name text (client/components/boards/boardHeader.jade,
// template boardVisibilityList). An admin can override it with
// Settings.customPrivateBoardDesc / customPublicBoardDesc (Admin Panel /
// Settings / Visibility), e.g. because their org uses "Public" to mean
// "public within our organization" rather than public on the internet
// (issue #4421). Empty/unset must fall back to the existing i18n text,
// byte-identical to before this setting existed.
// Run: node tests/visibilityDesc.test.cjs

const assert = require('assert');
const path = require('path');

const visibilityDesc = require(path.join(__dirname, '..', 'imports/i18n/lib/visibilityDesc.js'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('visibilityDesc:');

test('an unset custom text falls back to the i18n default', () => {
  const translate = key => `translated:${key}`;
  assert.strictEqual(visibilityDesc(undefined, translate, 'private-desc'), 'translated:private-desc');
  assert.strictEqual(visibilityDesc(null, translate, 'public-desc'), 'translated:public-desc');
});

test('an empty or whitespace-only custom text also falls back', () => {
  const translate = key => `translated:${key}`;
  assert.strictEqual(visibilityDesc('', translate, 'private-desc'), 'translated:private-desc');
  assert.strictEqual(visibilityDesc('   ', translate, 'public-desc'), 'translated:public-desc');
});

test('a real custom text is used instead of the i18n default', () => {
  const translate = () => { throw new Error('translate must not be called when custom text is set'); };
  assert.strictEqual(
    visibilityDesc('Public boards are only public within our organization.', translate, 'public-desc'),
    'Public boards are only public within our organization.',
  );
});

test('a custom text is trimmed', () => {
  const translate = () => 'default';
  assert.strictEqual(visibilityDesc('  Custom text  ', translate, 'private-desc'), 'Custom text');
});

test('an existing user/org that never touched the setting sees byte-identical behavior', () => {
  // Settings.customPrivateBoardDesc/customPublicBoardDesc default to '',
  // the same shape TAPi18n's own key lookup returns for an unset value -
  // so the very first render after this feature ships shows exactly what
  // it showed before the feature existed.
  const settingsDoc = { customPrivateBoardDesc: '', customPublicBoardDesc: '' };
  const translate = key => ({ 'private-desc': 'Default private description.', 'public-desc': 'Default public description.' })[key];
  assert.strictEqual(visibilityDesc(settingsDoc.customPrivateBoardDesc, translate, 'private-desc'), 'Default private description.');
  assert.strictEqual(visibilityDesc(settingsDoc.customPublicBoardDesc, translate, 'public-desc'), 'Default public description.');
});

console.log(`\nvisibilityDesc: ${passed} tests passed`);
