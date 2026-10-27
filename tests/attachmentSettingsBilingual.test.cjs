'use strict';

// Admin Panel / Attachments shows each storage setting's description and menu
// path in English AND in the user's language. The English line was typed into
// the template a second time beside the {{_ key}} line, so in English - or in
// any language without that translation yet - the same sentence was shown
// twice, and Playwright's strict getByText found two (storage-settings-
// translations.e2e.js). The English now comes from en.i18n.json by englishText,
// and the translated line is shown only when translatedDiffers.
// Run: node tests/attachmentSettingsBilingual.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jade = fs.readFileSync(path.join(root, 'client/components/settings/attachments.jade'), 'utf8').split('\n');
const blaze = fs.readFileSync(path.join(root, 'imports/i18n/blaze.js'), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
const CLASSES = 'cloud-input-desc|cloud-input-path|cloud-input-example';

test('no translated line has a hand-typed English twin above it', () => {
  const twins = [];
  for (let i = 0; i < jade.length - 1; i++) {
    const typed = jade[i].match(new RegExp(`^\\s*small\\.form-text\\.(${CLASSES})\\s+([^{].*)$`));
    const keyed = jade[i + 1].match(new RegExp(`^\\s*small\\.form-text\\.(${CLASSES})\\s+\\{\\{_ '`));
    if (typed && keyed && typed[1] === keyed[1]) twins.push(`line ${i + 1}: ${typed[2]}`);
  }
  assert.deepStrictEqual(twins, []);
});

test('each English line is followed by its translation, only when it differs', () => {
  let pairs = 0;
  for (let i = 0; i < jade.length - 2; i++) {
    const english = jade[i].match(/^(\s*)small\.form-text\.(\S+) \{\{englishText '([^']+)'\}\}$/);
    if (!english) continue;
    pairs += 1;
    assert.strictEqual(jade[i + 1], `${english[1]}if translatedDiffers '${english[3]}'`, `line ${i + 2}`);
    assert.strictEqual(jade[i + 2], `${english[1]}  small.form-text.${english[2]} {{_ '${english[3]}'}}`, `line ${i + 3}`);
  }
  assert.ok(pairs >= 26, `the storage settings' descriptions and menu paths, ${pairs} found`);
});

test('the helpers read English from en.i18n.json and follow the language', () => {
  assert.match(blaze, /Blaze\.registerHelper\('englishText', key => \{[\s\S]*?TAPi18n\.__\(key, \{\}, 'en'\)/);
  assert.match(blaze, /Blaze\.registerHelper\('translatedDiffers', key => \{\s*TAPi18n\.current\.get\(\);/);
  assert.match(blaze, /return TAPi18n\.__\(key\) !== TAPi18n\.__\(key, \{\}, 'en'\);/);
});

console.log(`\nattachmentSettingsBilingual: ${passed} passed`);
