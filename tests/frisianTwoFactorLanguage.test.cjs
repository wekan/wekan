'use strict';

// fy and fy-NL are West Frisian, but their two-factor authentication strings
// were Dutch ("Tweestapsverificatie ... inschakelen", "Voer uw ... in"). The
// locale tag is authoritative (CLAUDE.md, Translations), so they are Frisian
// now - written with low confidence, for a speaker to improve on Transifex.
// Shares one vocabulary with the REQUIRE_2FA strings beside them.
//
// Run: node tests/frisianTwoFactorLanguage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const data = loc => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data', `${loc}.i18n.json`), 'utf8'));
const en = data('en');
// Dutch words that Frisian spells differently.
const DUTCH = /\b(verificatie\w*|ingeschakeld|inschakelen|uitschakelen|uw|voer|bevestigen|ongeldige|opnieuw|eenmaal|elke aanmelding|handmatig|verifiëren)\b/i;

let passed = 0;
for (const loc of ['fy', 'fy-NL']) {
  const d = data(loc);
  const keys = Object.keys(d).filter(k => /^(twoFactorAuth|twoFactorCode|two-factor-required)/.test(k));
  assert.ok(keys.length >= 13, `${loc}: ${keys.length} two-factor keys`);
  for (const key of keys) {
    assert.doesNotMatch(d[key], DUTCH, `${loc} ${key} is Dutch: ${d[key]}`);
  }
  assert.match(d['twoFactorAuthPopup-title'], /^Tweestapsferifikaasje$/);
  assert.match(d['two-factor-required-title'], /Tweestapsferifikaasje/, 'one word for it in both places');
  // Negative: the manual-entry text keeps its trailing space before the code.
  assert.ok(d['twoFactorAuth-manual-entry'].endsWith(': ') && en['twoFactorAuth-manual-entry'].endsWith(': '));
  passed += 1;
  console.log(`  ok - ${loc}: two-factor strings are Frisian`);
}
console.log(`frisianTwoFactorLanguage: ${passed} tests passed`);
