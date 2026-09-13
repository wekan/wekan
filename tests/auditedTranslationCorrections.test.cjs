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
  // Oromo Hijri labels must distinguish the two epochs and moon sighting.
  for (const [key, epoch] of [['calendar-system-islamic-civil', 'sivilii'], ['calendar-system-islamic-tbla', 'astronomii']]) {
    assert.match(cache.om[key], /gabatee irratti hundaa’e/, 'preserve table-based computation');
    assert.ok(cache.om[key].includes(`guyyaa jalqabaa ${epoch}`), 'preserve the starting-date distinction');
  }
  assert.notEqual(cache.om['calendar-system-islamic-civil'], cache.om['calendar-system-islamic-tbla']);
  assert.match(cache.om['calendar-system-islamic-rgsa'], /Saawudii Arabiyaa, addeessa arguu/, 'preserve Saudi moon sighting');
  assert.match(cache.as['ldap-test-connection-error'], /বিফল/);
  assert.doesNotMatch(cache.as['ldap-test-connection-error'], /[\u0c00-\u0c7f]/);
  assert.doesNotMatch(cache.mk['text-contains-trigger-description'], /创/);
  // These messages render as HTML; a second opening tag leaves following UI bold.
  const htmlTags = value => value.match(/<\/?[A-Za-z][^>]*>/g) || [];
  for (const key of ['board-private-info', 'board-public-info', 'page-maybe-private', 'add-custom-html-after-body-start', 'add-custom-html-before-body-end']) {
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
  assert.match(cache.ace['keyboard-shortcuts-disabled'], /hana aktif.*peuhidop/, 'disabled shortcuts offer enabling');
  assert.match(cache.ace['keyboard-shortcuts-enabled'], /ka aktif.*peumate/, 'enabled shortcuts offer disabling');
  assert.notEqual(cache.ace['keyboard-shortcuts-disabled'], cache.ace['keyboard-shortcuts-enabled']);
  assert.match(cache.ace['last-admin-desc'], /ubah peran/, 'last-admin restriction concerns roles, not rules');
  for (const suffix of ['gen', 'spec']) {
    assert.match(cache.ace[`r-d-move-to-top-${suffix}`], /u ateueh/, 'move to top');
    assert.doesNotMatch(cache.ace[`r-d-move-to-top-${suffix}`], /miyup/, 'top must not mean bottom');
    assert.match(cache.ace[`r-d-move-to-bottom-${suffix}`], /u miyup/, 'move to bottom');
  }
  for (const command of ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']) {
    assert.ok(cache.ace['server-error-troubleshooting'].includes(`\`${command}\``), `preserve diagnostic command: ${command}`);
  }
  assert.match(cache.ace['shortcut-assign-self'], /Bri tugas/, 'assigning oneself is distinct from joining');
  assert.doesNotMatch(cache.ace['shortcut-add-self'], /Bri tugas/);
  assert.match(cache.ace['wipLimitErrorPopup-dialog-pt2'], /u luwa senarai/, 'move excess tasks out of the list');
  assert.match(cache.ace['user-can-not-export-excel'], /Excel$/, 'preserve the export format name');
  const filterHelp = cache.ace['advanced-filter-description'];
  assert.deepEqual(filterHelp.match(/\\+/g), english['advanced-filter-description'].match(/\\+/g), 'filter examples must not double escape characters');
  for (const example of ['== != <= >= && || ( )', 'Field1 == Value1', "'Field 1' == 'Value 1'", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
    assert.ok(filterHelp.includes(example), `preserve filter example: ${example}`);
  }
  console.log(`auditedTranslationCorrections: ${corrections.length} corrections verified; tokens, JSON examples, key order, idempotency and newer translations preserved`);
})().catch(error => { console.error(error); process.exitCode = 1; });
