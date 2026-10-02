// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), cs = read('cs');
  assert.deepEqual(Object.keys(cs), Object.keys(en));
  for (const key of Object.keys(en)) {
    assert.deepEqual(translationTokens(cs[key]), translationTokens(en[key]), key);
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
  for (const key of Object.keys(en).filter(key => /^(sync-|email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-)/.test(key))) {
    assert.ok(cs[key]?.trim(), key);
    assert.notEqual(cs[key], en[key], key);
  }
  assert.match(cs['sync-conflict-hint'], /Do zdrojového systému se nic neposílá/);
  assert.match(cs['activity-recovery-cancel-confirm'], /Nelze je znovu obnovit/);
  assert.match(cs['email-recovery-confirm-cancel'], /Nové zprávy.*zůstanou zachovány/);
  assert.notEqual(cs['move-selection-before'], cs['move-selection-after']);
  assert.equal(cs['blockly-SPACE_KEY'], 'Mezerník');
  assert.equal(cs['blockly-LOGIC_TERNARY_CONDITION'], 'podmínka');
  const inventory = spawnSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--completed-catalog', '--list', 'cs'],
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  assert.equal(inventory.status, 0, inventory.stderr);
  assert.deepEqual(JSON.parse(inventory.stdout), {});
  console.log('Czech source keys, tokens, planning and recovery warning meanings verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
