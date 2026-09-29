'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), sk = read('sk');
  // Synchronization and recovery entries are still pending in this locale.
  assert.deepEqual(Object.keys(sk), Object.keys(en).filter(key => key in sk));
  for (const key of Object.keys(en)) {
    if (key in sk) assert.deepEqual(translationTokens(sk[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|scrum-)/.test(key)
      && key !== 'scrum-master') {
      assert.ok(sk[key]?.trim(), key);
      assert.notEqual(sk[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(sk[key], en[key], key);
    assert.deepEqual(sk[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(sk['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(sk['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(sk['scrum-report-help'], /nie sú to nulové odhady/);
  assert.match(sk['scrum-daily-observations-help'], /nezaznamenávajú každú zmenu/);
  assert.match(sk['filter-column-age-hint'], /Úprava karty nevynuluje/);
  assert.match(sk['instance-desc'], /Neprihláseným sa nikdy nezobrazuje/);
  assert.match(sk['instance-desc'], /iba ľudia pridaní na nástenku/);
  assert.match(sk['board-instance-info'], /<strong>všetkých prihlásených používateľov<\/strong>/);
  assert.equal(sk['scrum-sprint'], 'Šprint');
  assert.notEqual(sk['scrum-category-todo'], sk['scrum-category-done']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(sk['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  console.log('Slovak planning, filter and visibility prose preserves source tokens and restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
