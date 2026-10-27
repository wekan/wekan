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

test('the popup passes a BOUND translator (TAPi18n.__ reads this)', () => {
  // boardHeader.js handed TAPi18n.__ over bare; it reads this.current, so it
  // threw inside the helper and the Private/Public descriptions rendered as an
  // empty span in every language (Playwright azerbaijani-board-terminology).
  const fs = require('fs');
  const source = fs.readFileSync(path.join(__dirname, '..', 'client/components/boards/boardHeader.js'), 'utf8');
  assert.match(source, /visibilityDesc\(setting\?\.customPrivateBoardDesc, key => TAPi18n\.__\(key\), 'private-desc'\)/);
  assert.match(source, /visibilityDesc\(setting\?\.customPublicBoardDesc, key => TAPi18n\.__\(key\), 'public-desc'\)/);
});

test('negative: no app file passes TAPi18n.__ unbound as a value', () => {
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.meteor', '_build', '.build', '.tools'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) {
        fs.readFileSync(full, 'utf8').split('\n').forEach((line, index) => {
          if (/^\s*\/\//.test(line)) return;
          if (/TAPi18n\.__\s*[,)\]};]/.test(line) || /[=:]\s*TAPi18n\.__\s*$/.test(line)) {
            offenders.push(`${path.relative(root, full)}:${index + 1}`);
          }
        });
      }
    }
  };
  ['client', 'models', 'imports', 'server', 'config'].forEach(dir => {
    if (fs.existsSync(path.join(root, dir))) walk(path.join(root, dir));
  });
  assert.deepStrictEqual(offenders, []);
});

console.log(`\nvisibilityDesc: ${passed} tests passed`);
