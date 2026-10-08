'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'login-origin-mismatch';
const source = read('en')[key];
const codes = ['de', 'de-AT', 'de-CH', 'fr', 'fr-CA', 'es', 'es-AR', 'it', 'pt', 'pt-BR', 'nl', 'sv', 'da', 'nb', 'pl', 'cs', 'sk', 'ro', 'hu', 'id', 'ms', 'vi', 'ja', 'ko', 'zh-CN', 'zh-TW'];
for (const code of codes) {
  const value = read(code)[key];
  assert.notEqual(value, source, code);
  assert.deepEqual(translationTokens(value), translationTokens(source), code);
  assert.equal((value.match(/ROOT_URL/g) || []).length, 1, code);
  // Configured address, opened address, corrective link, then configuration fix.
  // Repeated variables must survive rendering without exchanging these roles.
  assert.deepEqual(value.match(/__(?:expected|actual)__/g), ['__expected__', '__actual__', '__expected__', '__actual__'], code);
  const rendered = value.replaceAll('__expected__', 'https://configured.example').replaceAll('__actual__', 'https://opened.example');
  assert.equal((rendered.match(/https:\/\/configured\.example/g) || []).length, 2, code);
  assert.equal((rendered.match(/https:\/\/opened\.example/g) || []).length, 2, code);
  assert.doesNotMatch(rendered, /__[^\s]+?__/, code);
}
assert.match(read('de')[key], /nicht abgeschlossen werden/);
assert.match(read('fr')[key], /ne peut pas aboutir/);
assert.match(read('es')[key], /No se puede completar/);
assert.match(read('ja')[key], /ログインを完了できません/);
assert.match(read('zh-CN')[key], /无法在此地址完成/);
assert.match(read('zh-TW')[key], /無法在此位址完成/);
console.log('Sign-in origin warning: 26 translations, repeated address roles and literal configuration key pass');
