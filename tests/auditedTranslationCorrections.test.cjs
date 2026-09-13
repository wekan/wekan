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
  // Card descriptions use a feminine plural creation form.
  for (const key of ['globalSearch-instructions-operator-creator', 'globalSearch-instructions-operator-created']) {
    assert.match(cache.wa[key], /cåtes askepieyes/);
    assert.doesNotMatch(cache.wa[key], /cåtes askepyîs/);
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
  for (const key of ['clipboard', 'copy-card-link-to-clipboard', 'copy-link-to-clipboard', 'copy-text-to-clipboard', 'copy-to-clipboard']) {
    assert.match(cache.wa[key], /presse-papî/i, 'Walloon clipboard terminology follows the native computing source');
    assert.doesNotMatch(cache.wa[key], /tchapea emacralé/i, 'clipboard must not be translated as a magic hat');
  }
  for (const locale of ['ace', 've-CC']) {
    const filterHelp = cache[locale]['advanced-filter-description'];
    assert.deepEqual(filterHelp.match(/\\+/g), english['advanced-filter-description'].match(/\\+/g), `${locale}: filter examples must not double escape characters`);
    for (const example of ['== != <= >= && || ( )', 'Field1 == Value1', "'Field 1' == 'Value 1'", "Field1 == I\\'m", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
      assert.ok(filterHelp.includes(example), `${locale}: preserve filter example: ${example}`);
    }
  }
  // Veps units differ from Finnish despite closely related vocabulary.
  const veps = cache['ve-PP'];
  assert.equal(veps.language, 'Kelʹ');
  assert.equal(veps.number, 'Lugu');
  assert.equal(veps.title, 'Nimi');
  assert.equal(veps['title-alphabetically'], 'Nimi (kirjamišt)');
  assert.doesNotMatch(veps['title-alphabetically'], /Otsikko|Aakkos/);
  assert.match(veps['set-default-board-title'], /^Paina,/);
  assert.match(veps['unset-default-board-title'], / Paina,/);
  assert.doesNotMatch(veps['set-default-board-title'] + veps['unset-default-board-title'], /Painda/);
  assert.equal(veps.time, 'Aig');
  assert.equal(veps.new, 'Uzʹ');
  assert.equal(veps.today, 'Tämbei');
  assert.doesNotMatch(`${veps.time} ${veps.new} ${veps.today}`, /Aika|Uusi|Tänään/);
  assert.equal(veps.day, 'Päiv');
  assert.equal(veps.days, 'päiväd'); // Also the singular partitive for counted duration.
  assert.equal(veps.week, 'Nedal');
  assert.equal(veps.month, 'Ku');
  assert.equal(veps.calendar, "Kalendar'");
  assert.doesNotMatch(veps.days, /päivää/);
  assert.doesNotMatch(veps.week, /Viikko/);
  assert.doesNotMatch(veps.month, /Kuukausi/);
  for (const [color, expected] of Object.entries({black: 'must', blue: 'sinine', gray: 'hahk', green: 'vihand', orange: 'oranž', red: 'rusked', white: 'vauged', yellow: 'pakuine'})) {
    assert.equal(veps[`color-${color}`], expected, `Veps basic color: ${color}`);
  }
  assert.doesNotMatch(veps['color-green'], /vihreä/);
  assert.doesNotMatch(veps['color-red'], /punainen/);
  assert.doesNotMatch(veps['color-white'], /valkoinen/);
  // Veps action labels use the imperative and passive participle, not Finnish seed text.
  assert.equal(cache['ve-PP'].add, 'Ližada');
  assert.equal(cache['ve-PP'].added, 'Ližatud');
  assert.notEqual(cache['ve-PP'].add, 'Lisää');
  assert.notEqual(cache['ve-PP'].added, 'Lisätty');
  assert.match(veps['accounts-lockout-show-locked-users'], /^Ozuta vaiše saubatud kävutajad$/);
  assert.doesNotMatch(veps['accounts-lockout-show-locked-users'], /Näytä|käyttäjät/);
  assert.match(veps['accounts-lockout-all-users-unlocked'], /oma avaitud$/);
  assert.notEqual(veps['accounts-lockout-show-locked-users'], veps['accounts-lockout-all-users-unlocked']);
  assert.equal(veps['error-user-doesNotExist'], 'Nece kävutai ei ole');
  assert.match(veps['error-user-notCreated'], /ei ole lodud$/);
  assert.notEqual(veps['error-user-doesNotExist'], veps['error-user-notCreated']);
  assert.equal(veps['show-week-of-year'], 'Ozuta voden nedal (ISO 8601)');
  assert.doesNotMatch(veps['show-week-of-year'], /Näytä|vuoden|viikko/);
  assert.equal(veps['calendar-system-chinese'], "Kitain kalendar'");
  assert.equal(veps['calendar-system-japanese'], "Japonijan kalendar'");
  assert.doesNotMatch(veps['calendar-system-japanese'], /Japanese|Japoniin/);
  for (const locale of ['es-CO', 'es_CO']) {
    assert.equal(cache[locale]['calendar-system-iso8601'], 'Calendario gregoriano (semanas ISO 8601)');
    assert.equal(cache[locale]['board-view-time'], 'Tiempo');
    assert.notEqual(cache[locale]['calendar-system-iso8601'], 'ISO 8601');
  }
  assert.equal(veps.board, 'Laud');
  assert.equal(veps['board-title'], 'Laudan nimi');
  assert.equal(veps.username, 'Kävutajan nimi');
  assert.doesNotMatch(veps.username, /Käyttäjätunnus/);
  assert.match(veps['accounts-lockout-click-to-unlock'], /avaida nece kävutai$/);
  assert.equal(veps.name, 'Nimi', 'valid shared vocabulary is preserved');
  for (const key of ['gcs-credentials', 'gcs-credentials-description', 'gcs-credentials-menu-path']) {
    assert.match(cache.ace[key], /akun peulayanan/);
    assert.doesNotMatch(cache.ace[key], /akun layanan/);
  }
  assert.ok(cache.ace['gcs-credentials-menu-path'].includes('Service accounts'));
  assert.equal(cache.sah['calendar-system-coptic'], 'Коптик халандаара');
  assert.equal(cache.sah['calendar-system-jalali'], 'Jalali халандаара (Перс)');
  assert.equal(cache['ve-PP']['calendar-system-jalali'], "Jalali (Persijan kalendar')");
  assert.doesNotMatch(cache.sah['calendar-system-jalali'] + cache['ve-PP']['calendar-system-jalali'], /Fars/);
  assert.equal(cache.ks['calendar-system-islamic-civil'], 'اِسلٲمی اِجتمٲیی کیلنڑَر');
  assert.notEqual(cache.ks['calendar-system-islamic-civil'], cache.ks['calendar-system-islamic']);
  assert.doesNotMatch(cache.ks['calendar-system-islamic-civil'], /Islamic civil/);
  const tibetanCalendar = cache.bo;
  for (const suffix of ['gregorian','jalali','coptic','hebrew','islamic-civil','islamic-rgsa','islamic-tbla','iso8601']) {
    assert.match(tibetanCalendar[`calendar-system-${suffix}`], /ལོ་ཐོ/);
    assert.doesNotMatch(tibetanCalendar[`calendar-system-${suffix}`], /Gregoriana|Fars|Islamic civil|Islamic tabular|Saudi Arabia|^Coptic$|^Hebrew$/);
  }
  assert.match(tibetanCalendar['calendar-system-islamic-civil'], /རེའུ་མིག.*སྤྱི་སྤྱོད/);
  assert.match(tibetanCalendar['calendar-system-islamic-tbla'], /རེའུ་མིག.*སྐར་དཔྱད/);
  assert.notEqual(tibetanCalendar['calendar-system-islamic-civil'], tibetanCalendar['calendar-system-islamic-tbla']);
  assert.match(tibetanCalendar['calendar-system-islamic-rgsa'], /སཽ་དྷི་ཨ་རཱ་བི་ཡ.*ཟླ་བ་མཐོང/);
  assert.match(tibetanCalendar['calendar-system-iso8601'], /ISO 8601.*བདུན་ཕྲག/);
  console.log(`auditedTranslationCorrections: ${corrections.length} corrections verified; tokens, JSON examples, key order, idempotency and newer translations preserved`);
})().catch(error => { console.error(error); process.exitCode = 1; });
