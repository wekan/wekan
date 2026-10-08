'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'login-origin-mismatch';
const source = read('en')[key];
const codes = ['de', 'de-AT', 'de-CH', 'fr', 'fr-CA', 'es', 'es-AR', 'it', 'pt', 'pt-BR', 'nl', 'sv', 'da', 'nb', 'pl', 'cs', 'sk', 'ro', 'hu', 'id', 'ms', 'vi', 'ja', 'ko', 'zh-CN', 'zh-TW'];
codes.push('de_DE', 'fr-BE', 'fr-CH', 'fr-FR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'cs-CZ', 'ja-JP', 'ko-KR', 'ms-MY', 'nl-NL', 'pl-PL', 'pt-PT', 'pt_PT', 'ro-RO', 'vi-VN', 'zh-Hans', 'zh-Hant', 'zh_SG');
codes.push('ar', 'fa', 'he', 'uk-UA', 'ar-DZ', 'ar-EG', 'fa-IR', 'he-IL');
codes.push('hi', 'bn', 'ta', 'te-IN', 'mr', 'gu-IN', 'kn', 'ml', 'ne', 'ur', 'pa', 'si', 'hi-IN');
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
console.log('Sign-in origin warning: 71 translations, repeated address roles and literal configuration key pass');

assert.match(read('ar')[key], /لا يمكن إكمال تسجيل الدخول/);
assert.match(read('fa')[key], /تکمیل نمی‌شود/);
assert.match(read('he')[key], /לא ניתן להשלים כניסה/);
assert.match(read('uk-UA')[key], /Неможливо завершити вхід/);

assert.match(read('hi')[key], /पूरा नहीं किया जा सकता/);
assert.match(read('bn')[key], /সম্পূর্ণ করা যাচ্ছে না/);
assert.match(read('ta')[key], /முடிக்க முடியாது/);
assert.match(read('ur')[key], /مکمل نہیں کیا جا سکتا/);
