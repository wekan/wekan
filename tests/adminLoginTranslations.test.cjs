// Every locale has login-setting text; grammar review remains separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`), 'utf8'));
const english = read('en');
const keys = ['header-login', 'login-setting-clear-secret', 'login-setting-after-restart'];
const locales = fs.readdirSync(path.join(root, 'imports/i18n/data'))
  .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file))
  .map(file => file.replace('.i18n.json', '')).sort();
assert.equal(locales.length, 234, 'every registered non-English locale is covered');
const pending = JSON.parse(fs.readFileSync(path.join(root,
  'releases/translations/pending-transifex.json'), 'utf8'));
for (const key of keys) assert.ok(!pending.keys.some(row => row.key === key),
  `${key}: filled in every locale, no longer pending`);
for (const code of locales) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: translation exists`);
    assert.notEqual(locale[key], english[key], `${code}:${key}: no English fallback`);
  }
  assert.match(locale['header-login'], /HTTP/, `${code}: header means HTTP authentication`);
  assert.match(locale['login-setting-after-restart'], /WeKan/, `${code}: retain product name`);
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: exact placeholders`);
  }
}
// Shared scripts do not establish language correctness, but script regressions
// and accidental copying from related locales must still be rejected.
for (const [code, script] of Object.entries({
  chr: /[\u13A0-\u13FF]/, iu: /[\u1400-\u167F]/,
  zgh: /[\u2D30-\u2D7F]/, bo: /[\u0F00-\u0FFF]/,
  dz: /[\u0F00-\u0FFF]/, 'uz-AR': /[\u0600-\u06FF]/,
})) {
  for (const key of keys) assert.match(read(code)[key], script, `${code}:${key}: native script`);
}
for (const key of keys) {
  assert.notEqual(read('tig')[key], read('ti')[key], `${key}: Tigre is not a Tigrinya copy`);
  assert.notEqual(read('ve')[key], read('zu')[key], `${key}: Venda is not a Zulu copy`);
}
assert.match(read('tig')['login-setting-clear-secret'], /እት/);
assert.match(read('wal')['login-setting-after-restart'], /doomm/);
assert.match(read('fi')['login-setting-clear-secret'], /hallintapaneeliin/);
assert.match(read('ar')['login-setting-clear-secret'], /لوحة التحكم/);
assert.match(read('ja')['login-setting-after-restart'], /再起動後/);
const menu = fs.readFileSync(path.join(root, 'client/components/settings/peopleBody.js'), 'utf8');
assert.match(menu, /id: 'header-login-setting'[^}]*labelKey: 'header-login'/);
const form = fs.readFileSync(path.join(root, 'client/components/settings/authProviderSettings.jade'), 'utf8');
for (const key of keys.slice(1)) assert.ok(form.includes(`{{_ '${key}'}}`), `${key}: rendered by the provider form`);
console.log(`adminLoginTranslations: ${locales.length} locales passed`);

// Environment-only controls are displayed read-only; translating this notice
// must not suggest that an administrator can edit them through the UI.
const environmentNoticeLocales = ["ar-DZ","ar-EG","ar","bi","cmn","cs-CZ","cs","da","de-AT","de-CH","de","de_DE","el-GR","el","es-AR","es-CL","es-CO","es-LA","es-MX","es-PE","es-PY","es","es_CO","fi","fr-BE","fr-CA","fr-CH","fr-FR","fr","he-IL","he","it","ja-HI","ja-JP","ja","ko-KR","ko","nb","nl-NL","nl","pl-PL","pl","pt-BR","pt-PT","pt","pt_PT","ru-RU","ru-UA","ru","ru_RU","sk","sv","tr","uk-UA","uk","zh-CN","zh-GB","zh-HK","zh-Hans","zh-Hant","zh-TW","zh","zh_SG"];
for (const code of environmentNoticeLocales) {
  const value = read(code)['login-setting-env-only'];
  assert.ok(value?.trim(), code);
  assert.notEqual(value, english['login-setting-env-only'], code);
  assert.deepEqual(translationTokens(value), translationTokens(english['login-setting-env-only']), code);
}
for (const [code, environment, readOnly] of [
  ['fi', /palvelimen ympäristö/, /vain luettavina/],
  ['de', /Serverumgebung/, /schreibgeschützt/],
  ['fr', /environnement du serveur/, /lecture seule/],
  ['ru', /окружением сервера/, /только для чтения/],
  ['ja', /サーバー環境/, /読み取り専用/],
  ['ar', /بيئة الخادم/, /للقراءة فقط/],
  ['bi', /Envaeromen blong seva nomo/, /no save jenisim/],
]) {
  assert.match(read(code)['login-setting-env-only'], environment, code);
  assert.match(read(code)['login-setting-env-only'], readOnly, code);
}
