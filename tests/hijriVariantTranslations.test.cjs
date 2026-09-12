'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = locale => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`), 'utf8'));
const languages = ['cs', 'cs-CZ', 'de', 'de-AT', 'de-CH', 'de_DE', 'el', 'el-GR', 'es', 'es-LA', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'hu', 'it', 'pt', 'pt-PT', 'pt_PT', 'pt-BR'];
for (const locale of languages) {
  const data = read(locale);
  const sighting = data['calendar-system-islamic-rgsa'];
  const tabular = data['calendar-system-islamic-tbla'];
  assert.ok(sighting.trim() && tabular.trim(), locale);
  assert.notEqual(sighting, tabular, `${locale}: distinguish the calendar variants`);
  assert.notEqual(sighting, 'Islamic (Saudi Arabia)', `${locale}: foreign label removed`);
  assert.notEqual(tabular, 'Islamic tabular', `${locale}: foreign label removed`);
}
assert.match(read('pt-BR')['calendar-system-islamic-tbla'], /astronômica/);
for (const locale of ['pt', 'pt-PT', 'pt_PT']) assert.match(read(locale)['calendar-system-islamic-tbla'], /astronómica/);
assert.match(read('de')['calendar-system-islamic-rgsa'], /Mondsichtung/);
assert.match(read('de')['calendar-system-islamic-tbla'], /tabellarisch, astronomische Epoche/);
assert.match(read('fr')['calendar-system-islamic-rgsa'], /observation de la lune/);
console.log('hijriVariantTranslations: 21 locale files distinguish the variants with regional terminology');
