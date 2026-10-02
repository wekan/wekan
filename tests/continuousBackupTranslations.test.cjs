'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = Object.keys(en).filter(key => key.startsWith('continuous-backup'));
for (const code of ['fi', 'sv', 'da', 'nb']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${code}: source key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${code}:${key}: missing`);
    assert.notEqual(locale[key], en[key], `${code}:${key}: English placeholder`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${code}:${key}: tokens`);
  }
  assert.notEqual(locale['continuous-backup-running'], locale['continuous-backup-stopped']);
  for (const brand of ['SQLite', 'Litestream', 'Oplog']) {
    assert.match(locale[`continuous-backup-engine-${brand.toLowerCase()}`], new RegExp(brand));
  }
}
assert.match(read('fi')['continuous-backup-restore-sqlite'], /ei koskaan käytössä olevan tiedoston päälle/);
assert.match(read('sv')['continuous-backup-restore-sqlite'], /aldrig över den aktiva filen/);
assert.match(read('fi')['continuous-backup-restore-confirm'], /valittu sukupolvi valittuun ajankohtaan.*keskeytetään palautuksen ajaksi/);
assert.match(read('sv')['continuous-backup-restore-confirm'], /valda generationen till den valda tidpunkten.*pausas under återställningen/);
for (const [code, units] of Object.entries({fi: ['sekuntia', 'tuntia', 'päivää'], sv: ['sekunder', 'timmar', 'dagar'], da: ['sekunder', 'timer', 'dage'], nb: ['sekunder', 'timer', 'dager']})) {
  for (const [i, suffix] of ['sqlite-interval', 'base-every', 'keep-days'].entries()) {
    assert.ok(read(code)[`continuous-backup-${suffix}`].includes(units[i]), `${code}:${suffix}: unit preserved`);
  }
}
assert.match(read('da')['continuous-backup-restore-sqlite'], /overskriver aldrig den aktive fil/);
assert.match(read('nb')['continuous-backup-restore-sqlite'], /overskriver aldri den aktive filen/);
assert.match(read('da')['continuous-backup-restore-confirm'], /valgte generation til det valgte tidspunkt.*pause under gendannelsen/);
assert.match(read('nb')['continuous-backup-restore-confirm'], /valgte generasjonen til det valgte tidspunktet.*pause under gjenopprettingen/);
console.log(`Continuous backup: ${keys.length} translations in four locales passed`);
