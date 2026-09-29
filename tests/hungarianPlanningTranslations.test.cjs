'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), hu = read('hu');
  // Remaining planning/recovery sections are filled in subsequent increments.
  assert.deepEqual(Object.keys(hu), Object.keys(en).filter(key => key in hu));
  for (const key of Object.keys(en)) {
    if (key in hu) assert.deepEqual(translationTokens(hu[key]), translationTokens(en[key]), key);
    if (/^(filter-recency-|filter-date-range-|filter-column-age|filter-preset|notification-activity-|auto-archive-|due-reminder-)/.test(key)) {
      assert.ok(hu[key]?.trim(), key);
      assert.notEqual(hu[key], en[key], key);
    }
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.notEqual(hu[key], en[key], key);
    assert.deepEqual(hu[key].match(/\{[^{}]+\}/g), en[key].match(/\{[^{}]+\}/g), key);
  }
  assert.deepEqual(hu['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g),
    en['advanced-filter-card-dates-hint'].match(/@[A-Za-z]+/g));
  assert.match(hu['advanced-filter-card-dates-hint'], /@endAt = none/);
  assert.match(hu['filter-column-age-hint'], /nem nullázza/);
  assert.match(hu['instance-desc'], /be nem jelentkezett személyeknek soha/);
  assert.match(hu['instance-desc'], /Csak a táblához hozzáadott személyek/);
  assert.match(hu['board-instance-info'], /<strong>minden bejelentkezett felhasználó<\/strong>/);
  assert.match(hu['notification-activity-description'], /@említések mindig megérkeznek/);
  assert.match(hu['auto-archive-hint'], /óránként.*sablonok soha.*hagyja üresen/);
  assert.notEqual(hu['dependency-type-duplicates'], hu['dependency-type-is-duplicated-by']);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) {
    assert.equal(hu['automatic-linked-url-schemes-hint'].split(scheme).length - 1, 1, scheme);
  }
  for (const key of Object.keys(en).filter(key => key.startsWith('scrum-'))) {
    if (['scrum-master', 'scrum-sprint'].includes(key)) continue;
    assert.ok(hu[key]?.trim(), key);
    assert.notEqual(hu[key], en[key], key);
  }
  assert.match(hu['scrum-report-help'], /nem nulla értékű becslések/);
  assert.match(hu['scrum-daily-observations-help'], /nem rögzítenek minden változást/);
  assert.match(hu['scrum-confirm-cancel'], /hozzárendelve maradnak/);
  assert.match(hu['scrum-added'], /sprint feladataihoz/);
  assert.match(hu['scrum-removed'], /sprint feladatai közül/);
  assert.notEqual(hu['scrum-category-todo'], hu['scrum-category-done']);
  console.log('Hungarian filters, rules, Scrum and preferences preserve tokens and restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
