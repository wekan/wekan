const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['ast-ES', 'cy', 'cy-GB', 'uz-AR', 'uz-LA', 'uz-UZ', 'uz'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(
    path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8',
  ));
}
assert.equal(locales['ast-ES']['select-none'], 'Nun seleicionar nengún');
for (const language of ['cy', 'cy-GB']) {
  assert.equal(locales[language]['select-none'], 'Dewis dim');
}
for (const language of ['uz-AR', 'uz-LA', 'uz-UZ', 'uz']) {
  assert.equal(locales[language]['select-none'], 'Hech birini tanlamaslik');
}
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

assert.equal(locales['uz-AR']['twoFactorCode-cancel'], 'بیکار قیلیش');
assert.notEqual(locales['uz-AR']['twoFactorCode-cancel'], 'بیکر قیلیش');
assert.notEqual(locales['uz-AR']['twoFactorCode-cancel'], 'Bekor qilish');

const sourceLocale = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json')));
for (const code of ['uz','uz-LA','uz-UZ']) {
 const d = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${code}.i18n.json`)));
 assert.match(d['cards-loading-description'], /avtomatik.*o‘lcham chegarasi.*jonli hisob/);
 assert.match(d['cards-loading-description'], /Kichik taxtalarda.*barcha kartalar/);
 assert.match(d['cards-loading-description'], /Hech narsani sozlash shart emas/);
 assert.deepStrictEqual(d['cards-loading-description'].match(/CARDS_LOADING(?:_LAZY_THRESHOLD)?/g), sourceLocale['cards-loading-description'].match(/CARDS_LOADING(?:_LAZY_THRESHOLD)?/g));
 assert.match(d['cards-loading-description'], /CARDS_LOADING \(all\/lazy\/auto\)/);
 assert.doesNotMatch(d['cards-loading-description'] + d['cards-loading-lazy-note'], /Yalqov/);
 assert.match(d['cards-loading-lazy-note'], /WIP.*Kalendar\/Jadval\/Gantt.*faqat hozirgacha.*qayta yuklang/);
}
for (const code of ['uz-LA','uz-UZ']) {
 for (const [key,value] of Object.entries(locales[code]))
  assert.doesNotMatch(value, /kengash|taxtai|taxtasingiz/i, `${code}:${key}`);
 assert.strictEqual(locales[code].linkCardToNewBoard, 'Ushbu kartadan taxta yaratish');
 assert.match(locales[code]['roadmap-empty-no-custom-fields'], /"Version".*"Release"/);
}
console.log('Latin Uzbek regional board forms and automatic card-loading guidance verified');
