const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['ace', 'cs-CZ', 'cs']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
const cards = JSON.parse(locales.ace['copyManyCardsPopup-format']);
assert.equal(cards.length, 3);
assert.equal(cards[0].title, 'Nan kartu phon');
for (const language of ['cs-CZ', 'cs']) {
  assert.equal(locales[language].checklist, 'Kontrolní seznam');
  assert.equal(locales[language]['office-logins'], 'Přihlášení');
}
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
