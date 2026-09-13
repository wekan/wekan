'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const english = read('imports/i18n/data/en.i18n.json');
const tokens = value => [...value.matchAll(/__[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*__|%(?:\d+\$)?[A-Za-z]|%\{[^}]+\}/g)].map(x => x[0]).sort();
(async () => {
  const { corrections, repairLocale } = await import('../releases/translations/repair-audited-translations.mjs');
  const seen = new Set();
  const cache = {};
  for (const row of corrections) {
    const identity = `${row.locale}:${row.key}`;
    assert.ok(!seen.has(identity), identity);
    seen.add(identity);
    const data = cache[row.locale] ||= read(`imports/i18n/data/${row.locale}.i18n.json`);
    assert.equal(data[row.key], row.after, identity);
    assert.deepEqual(tokens(row.after), tokens(english[row.key]), identity);
    assert.ok(row.after.trim(), identity);
    assert.notEqual(row.before, row.after, identity);
    assert.equal(repairLocale(row.locale, { [row.key]: row.before }).data[row.key], row.after);
    assert.equal(repairLocale(row.locale, { [row.key]: 'NEW REVIEWED TRANSLATION' }).data[row.key], 'NEW REVIEWED TRANSLATION', 'preserve newer wording');
    if (row.key === 'copyManyCardsPopup-format') {
      const example = JSON.parse(row.after);
      assert.ok(Array.isArray(example));
      for (const card of example) assert.deepEqual(Object.keys(card), ['title', 'description']);
    }
  }
  for (const [locale, data] of Object.entries(cache)) {
    assert.deepEqual(Object.keys(data), Object.keys(english), locale);
    assert.equal(repairLocale(locale, data).changed, 0, 'idempotent after correction');
  }
  assert.match(cache.as['ldap-test-connection-error'], /বিফল/);
  assert.doesNotMatch(cache.as['ldap-test-connection-error'], /[\u0c00-\u0c7f]/);
  assert.doesNotMatch(cache.mk['text-contains-trigger-description'], /创/);
  // These messages render as HTML; a second opening tag leaves following UI bold.
  const htmlTags = value => value.match(/<\/?[A-Za-z][^>]*>/g) || [];
  for (const key of ['board-private-info', 'board-public-info', 'add-custom-html-after-body-start', 'add-custom-html-before-body-end']) {
    assert.deepEqual(htmlTags(cache.ace[key]), htmlTags(english[key]), `Acehnese HTML: ${key}`);
  }
  assert.notDeepEqual(htmlTags('<strong>publik<strong'), htmlTags(english['board-public-info']));
  const entities = value => value.match(/&(?:#[0-9]+|[A-Za-z]+);/g) || [];
  assert.deepEqual(entities(cache.ace['custom-field-stringtemplate-separator']), entities(english['custom-field-stringtemplate-separator']));
  assert.notDeepEqual(entities('&#32 atawa &nbsp'), entities(english['custom-field-stringtemplate-separator']));
  assert.match(cache.ace['enable-vertical-scrollbars'], /ateueh.*miyup/, 'scroll vertically, up and down');
  assert.doesNotMatch(cache.ace['enable-vertical-scrollbars'], /melintang/, 'do not describe horizontal scrolling');
  assert.match(cache.ace['enter-zoom-level'], /50-300%/, 'preserve supported zoom range');
  assert.match(cache.ace['globalSearch-instructions-notes-4'], /hana beda huruf rayek.*huruf ubit/, 'text search ignores letter case');
  assert.match(cache.ace['filter-creator-label'], /nyang peugot/, 'filter by the creator');
  assert.doesNotMatch(cache.ace['filter-creator-label'], /geubri tugas/, 'creator is distinct from assignee');
  assert.match(cache.ace['home-board-empty'], /saboh papan mantong/, 'home accepts only one board');
  for (const label of ['Menu', 'More', 'Print and Export', 'Export JSON']) {
    assert.ok(cache.ace['import-board-instruction-trello'].includes(`'${label}'`), `preserve Trello menu label: ${label}`);
  }
  assert.match(cache.ace['import-members-map-note'], /ureueng ngui jinoe/, 'unmapped members go to the current user');
  console.log(`auditedTranslationCorrections: ${corrections.length} corrections verified; tokens, JSON examples, key order, idempotency and newer translations preserved`);
})().catch(error => { console.error(error); process.exitCode = 1; });
