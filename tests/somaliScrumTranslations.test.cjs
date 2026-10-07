'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const english = require('../imports/i18n/data/en.i18n.json');
const data = require('../imports/i18n/data/so.i18n.json');
const {translationTokens} = require('../releases/translations/placeholder-tokens.mjs');
const keys = Object.keys(english).filter(key => key.startsWith('scrum-') || [
  'board-view-product-backlog', 'board-view-sprints', 'board-view-sprint-report', 'board-view-velocity',
].includes(key));

test('Somali Scrum messages cover planning and reports without losing interpolation tokens', () => {
  assert.equal(keys.length, 102);
  for (const key of keys) {
    assert.ok(data[key].trim(), key);
    assert.notEqual(data[key], english[key], key);
    assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
  }
  assert.equal(data['board-view-product-backlog'], data['scrum-product-backlog']);
  assert.equal(data['board-view-sprints'], data['scrum-sprints']);
  assert.equal(data['scrum-category-backlog'], data['scrum-backlog']);
  assert.equal(data['scrum-category-done'], data['scrum-completed']);
});

test('Somali sprint lifecycle distinguishes cancellation, closure and unfinished work', () => {
  assert.equal(new Set(['planned','active','closed','cancelled','released'].map(s => data['scrum-state-'+s])).size, 5);
  assert.equal(new Set(['start','close','cancel'].map(s => data['scrum-'+s+'-sprint'])).size, 3);
  assert.notEqual(data['scrum-category-todo'], data['scrum-category-doing']);
  assert.notEqual(data['scrum-incomplete'], data['scrum-completed']);
  assert.match(data['scrum-confirm-close'], /aan dhammaan.*meesha la doortay/);
  assert.match(data['scrum-confirm-cancel'], /ku sii jirayaan.*ilaa meel kale loo qoondeeyo/);
  assert.match(data['scrum-import-pending'], /ma dhammaystirna.*lama heli karo/);
  assert.match(data['scrum-partial-report'], /keliya.*hadda laguu qoondeeyey/);
});

test('Somali daily reports preserve observation limits and distinguish unknown from zero', () => {
  for (const key of ['scrum-report-help','scrum-daily-observations-help','scrum-daily-observations-export-help']) {
    assert.match(data[key], /aan la garanayn.*ma aha.*eber/);
  }
  for (const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']) {
    assert.match(data[key], /ugu horraysay/);
    assert.match(data[key], /UTC/);
    assert.match(data[key], /[Mm]aalmaha maqan.*laga tagaa/);
    assert.match(data[key], /ma diiwaangeliso isbeddel kasta/);
    assert.match(data[key], /dhammaadka maalinta/);
  }
  assert.match(data['scrum-daily-truncated'], /366/);
  assert.match(data['scrum-timebox'], /daqiiqado/);
  assert.ok(data['scrum-daily-observations-help'].includes('amarka '+data.export));
  assert.match(data['scrum-daily-observations-help'], /qaybtan.*qaybta qalabku/);
});
