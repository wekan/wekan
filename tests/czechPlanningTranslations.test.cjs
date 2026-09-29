'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), cs = read('cs');
  // This increment covers planning; synchronization/recovery keys remain pending.
  assert.deepEqual(Object.keys(cs), Object.keys(en).filter(key => key in cs));
  for (const key of Object.keys(en)) {
    if (key in cs) assert.deepEqual(translationTokens(cs[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|scrum-)/.test(key)
      && !['scrum-master', 'scrum-sprint'].includes(key)) {
      assert.ok(cs[key]?.trim(), key);
      assert.notEqual(cs[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(cs[key], en[key], key);
    assert.deepEqual(cs[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(cs['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(cs['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(cs['scrum-report-help'], /nejsou to nulové odhady/);
  assert.match(cs['scrum-daily-observations-help'], /nezaznamenávají každou změnu/);
  assert.match(cs['filter-column-age-hint'], /Úprava karty nevynuluje/);
  assert.match(cs['instance-desc'], /Nepřihlášeným se nikdy nezobrazuje/);
  assert.match(cs['instance-desc'], /pouze lidé přidaní k tablu/);
  assert.match(cs['board-instance-info'], /<strong>všechny přihlášené uživatele<\/strong>/);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(cs['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  console.log('Czech planning, filter and visibility prose preserves source tokens and restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
