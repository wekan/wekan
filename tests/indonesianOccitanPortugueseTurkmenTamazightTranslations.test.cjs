const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['id', 'oc', 'pt-BR', 'tk_TM', 'zgh'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
const cards = JSON.parse(locales.id['copyManyCardsPopup-format']);
assert.equal(cards.length, 3);
assert.equal(cards[0].title, 'Judul kartu pertama');
assert.equal(locales.oc['select-none'], 'Seleccionar pas res');
assert.equal(locales['pt-BR'].backup, 'Cópia de segurança');
assert.equal(locales.tk_TM['select-none'], 'Hiç birini saýlama');
assert.match(locales.zgh['globalSearch-instructions-operator-number'], /__operator_number__:<number>.*<number>/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
