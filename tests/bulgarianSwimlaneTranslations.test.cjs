'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), bg = read('bg');
  const keys = ['act-createSwimlane', 'act-archivedSwimlane', 'setSwimlaneHeightPopup-title',
    'set-swimlane-height', 'set-swimlane-height-value', 'swimlane-height-error-message',
    'swimlaneActionPopup-title', 'swimlaneAddPopup-title', 'welcome-swimlane',
    'r-in-swimlane', 'swimlaneDeletePopup-title', 'swimlane-delete-pop', 'swimlane',
    'swimlane-title-not-found', 'operator-swimlane', 'globalSearch-instructions-operator-swimlane',
    'move-swimlane', 'moveSwimlanePopup-title', 'copy-swimlane', 'copySwimlanePopup-title',
    'has-swimlanes', 'step-ensure-per-swimlane-lists', 'step-ensure-lost-cards-swimlane',
    'step-restore-swimlanes', 'wip-limit-group-select-swimlane', 'wip-limit-group-apply-swimlane'];
  for (const key of keys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЏ]|поступ|врста|списи|опорав/i, key);
    if (key !== 'welcome-swimlane') assert.match(bg[key], /коридор/i, key);
  }
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian swimlane corrections preserve tokens and replace Serbian vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
