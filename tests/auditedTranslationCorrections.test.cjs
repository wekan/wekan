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
  for (const key of ['password-again', 'forgot-password', 'username-password-required']) {
    assert.doesNotMatch(cache.zgh[key], /Mot de passe|Nom d.utilisateur|requis/);
    assert.match(cache.zgh[key], /ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ/);
  }
  assert.equal(cache.zgh.labels, 'ⵉⵔⵛⵓⵎⵏ');
  assert.equal(cache.zgh['no-results'], 'ⵓⵔ ⵍⵍⵉⵏⵜ ⵜⵢⴰⴼⵓⵜⵉⵏ');
  for (const key of ['user-username-not-found', 'label-not-found', 'label-color-not-found']) {
    assert.doesNotMatch(cache.zgh[key], /Utilisateur|Étiquette|non trouv/);
    assert.match(cache.zgh[key], /%s/);
    assert.match(cache.zgh[key], /ⵓⵔ ⵉⵍⵍⴰ/);
  }
  assert.doesNotMatch(cache.zgh['label-create'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['export-card-attachment-filename'], 'ⵉⵙⵎ ⵏ ⵓⴼⴰⵢⵍⵓ');
  assert.match(cache.zgh['activity-added-label'], /'%s' ⵉ %s$/);
  assert.match(cache.zgh['activity-removed-label'], /'%s' ⵙⴳ %s$/);
  for (const key of ['activity-added-label', 'activity-added-label-card', 'activity-removed-label', 'activity-removed-label-card']) {
    assert.doesNotMatch(cache.zgh[key], /ajouté|supprimé|étiquette/);
    assert.match(cache.zgh[key], /ⴰⵔⵛⵓⵎ '%s'/);
  }
  // Exact native UI references replace French without normalizing valid Latin-script Tamazight.
  assert.equal(cache.zgh.help, 'ⵜⵉⵡⵉⵙⵉ');
  assert.equal(cache.zgh.next, 'ⵉⵏⴹⴼⵔ');
  assert.notEqual(cache.zgh.help, 'Aide');
  assert.notEqual(cache.zgh.next, 'Suivant');
  assert.equal(cache.zgh.cancel, 'Sefsex');
  assert.equal(cache.zgh.upload, 'ⵙⴽⵜⵔ ⴰⴼⴰⵢⵍⵓ');
  assert.notEqual(cache.zgh.upload, cache.zgh.download);
  assert.notEqual(cache.zgh.upload, 'Télécharger');
  assert.equal(cache.zgh['settingsUserPopup-title'], 'ⵉⵙⵎⵏⵢⵉⴼⵏ ⵏ ⵓⵏⵙⵙⵎⵔⵙ');
  assert.doesNotMatch(cache.zgh['settingsUserPopup-title'], /Paramètres|utilisateur/);
  assert.equal(cache.zgh['accounts-allowUserNameChange'], 'ⵙⵏⴼⵍ ⵉⵙⵎ ⵏ ⵓⵏⵙⵙⵎⵔⵙ');
  assert.doesNotMatch(cache.zgh['accounts-allowUserNameChange'], /Autoriser|identifiant/);
  assert.equal(cache.zgh['deleteCommentPopup-title'], 'ⴽⴽⵙ ⴰⵖⴼⴰⵡⴰⵍ?');
  assert.doesNotMatch(cache.zgh['deleteCommentPopup-title'], /Supprimer|commentaire/);
  assert.ok(cache.zgh['deleteCommentPopup-title'].endsWith('?'));
  assert.equal(cache.zgh['remove-btn'], 'ⵙⵉⵜⵜⵢ');
  assert.doesNotMatch(cache.zgh['remove-btn'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['r-remove'], 'ⵙⵉⵜⵜⵢ');
  assert.doesNotMatch(cache.zgh['r-remove'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['shortcut-clear-filters'], 'ⵚⵚⴼⴹ ⴰⴽⴽⵯ ⵜⵉⵎⵣⵉⵣⴷⴳⵉⵜⵉⵏ');
  assert.doesNotMatch(cache.zgh['shortcut-clear-filters'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['anonymized-user'], 'ⴰⵏⵙⵙⵎⵔⵙ');
  assert.doesNotMatch(cache.zgh['anonymized-user'], /[\u0600-\u06ff]/);

  assert.equal(cache.zgh['board-view-collapse'], 'ⵙⵎⵓⵏ');
  assert.doesNotMatch(cache.zgh['board-view-collapse'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['collapse'], 'ⵙⵎⵓⵏ');
  assert.doesNotMatch(cache.zgh['collapse'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['card-comments-more'], 'ⵓⴳⴳⴰⵔ');
  assert.doesNotMatch(cache.zgh['card-comments-more'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['cardMorePopup-title'], 'ⵓⴳⴳⴰⵔ');
  assert.doesNotMatch(cache.zgh['cardMorePopup-title'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['listMorePopup-title'], 'ⵓⴳⴳⴰⵔ');
  assert.doesNotMatch(cache.zgh['listMorePopup-title'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['comment'], 'ⴰⵖⴼⴰⵡⴰⵍ');
  assert.doesNotMatch(cache.zgh['comment'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['rename'], 'ⴰⵍⵙ ⵉ ⵉⵙⵎ');
  assert.doesNotMatch(cache.zgh['rename'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['attachmentRenamePopup-title'], 'ⴰⵍⵙ ⵉ ⵉⵙⵎ');
  assert.doesNotMatch(cache.zgh['attachmentRenamePopup-title'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['current'], 'ⴰⵎⵉⵔⴰⵏ');
  assert.doesNotMatch(cache.zgh['current'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['r-add'], 'ⵔⵏⵓ');
  assert.doesNotMatch(cache.zgh['r-add'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['delete-all'], 'ⴽⴽⵙ ⵎⴰⵕⵕⴰ');
  assert.doesNotMatch(cache.zgh['delete-all'], /[\u0600-\u06ff]/);

  assert.equal(cache.zgh['change-password'], 'ⵙⵏⴼⵍ ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ');
  assert.doesNotMatch(cache.zgh['change-password'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['changePasswordPopup-title'], 'ⵙⵏⴼⵍ ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ');
  assert.doesNotMatch(cache.zgh['changePasswordPopup-title'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['date'], 'ⴰⵙⴰⴽⵓⴷ');
  assert.doesNotMatch(cache.zgh['date'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['custom-field-date'], 'ⴰⵙⴰⴽⵓⴷ');
  assert.doesNotMatch(cache.zgh['custom-field-date'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['history'], 'ⴰⵎⵣⵔⵓⵢ');
  assert.doesNotMatch(cache.zgh['history'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['log-in'], 'ⴽⵛⵎ');
  assert.doesNotMatch(cache.zgh['log-in'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['loginPopup-title'], 'ⴽⵛⵎ');
  assert.doesNotMatch(cache.zgh['loginPopup-title'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['log-out'], 'ⴼⴼⵖ');
  assert.doesNotMatch(cache.zgh['log-out'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['smtp-username'], 'ⵉⵙⵎ ⵏ ⵓⵏⵙⵙⵎⵔⵙ');
  assert.doesNotMatch(cache.zgh['smtp-username'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['smtp-password'], 'ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ');
  assert.doesNotMatch(cache.zgh['smtp-password'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['move-progress-cancel'], 'ⵙⵙⵔ');
  assert.doesNotMatch(cache.zgh['move-progress-cancel'], /[\u0600-\u06ff]/);
  assert.equal(cache.zgh['searchElementPopup-title'], 'ⴰⵔⵣⵣⵓ');
  assert.doesNotMatch(cache.zgh['searchElementPopup-title'], /[\u0600-\u06ff]/);
  assert.notEqual(cache.zgh.date, cache.zgh.history);
  assert.notEqual(cache.zgh['log-in'], cache.zgh['log-out']);

  assert.equal(cache.zgh.actions, 'ⵜⵉⴳⴰⵡⵉⵏ');
  assert.doesNotMatch(cache.zgh.actions, /[\u0600-\u06ffA-Za-z]/);
  assert.equal(cache.zgh.create, 'ⵙⵏⵓⵍⴼⵓ');
  assert.doesNotMatch(cache.zgh.create, /[\u0600-\u06ffA-Za-z]/);
  assert.equal(cache.zgh.download, 'ⴰⴳⵎ');
  assert.doesNotMatch(cache.zgh.download, /[\u0600-\u06ffA-Za-z]/);
  assert.equal(cache.zgh.error, 'ⵜⴰⵣⴳⵍⵜ');
  assert.doesNotMatch(cache.zgh.error, /[\u0600-\u06ffA-Za-z]/);

  assert.equal(cache.qu['color-orange'], 'killmu');
  assert.doesNotMatch(cache.qu['color-orange'], /Kay willaymi|orange/);
  assert.notEqual(cache.qu['color-orange'], cache.qu['color-yellow']);
  assert.equal(cache.qu['color-sky'], 'qhusi');
  assert.doesNotMatch(cache.qu['color-sky'], /Kay willaymi|sky/);
  assert.notEqual(cache.qu['color-sky'], cache.qu['color-blue']);
  assert.equal(cache.qu['color-crimson'], 'sañi');
  assert.doesNotMatch(cache.qu['color-crimson'], /Kay willaymi|crimson/);
  assert.notEqual(cache.qu['color-crimson'], cache.qu['color-red']);
  assert.notEqual(cache.qu['color-crimson'], cache.qu['color-purple']);
  assert.equal(cache.kl['calendar-system-jalali'], 'Jalali (persiskisut)');
  assert.doesNotMatch(cache.kl['calendar-system-jalali'], /Fars/);
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
  assert.equal(veps['user-username-not-found'], "Kävutajan nimi '%s' ei ole löutud.");
  assert.equal(veps['board-title-not-found'], "Laud '%s' ei ole löutud.");
  assert.doesNotMatch(veps['user-username-not-found'] + veps['board-title-not-found'], /Käyttäjänimeä|Taulua|löytynyt/);
  assert.equal(veps.organizations, 'Sebrad');
  assert.equal(veps['org-number'], 'Sebroiden lugu om: ');
  assert.equal(veps['org-name-not-found'], "Sebr '%s' ei ole löutud.");
  assert.doesNotMatch(veps.organizations + veps['org-number'] + veps['org-name-not-found'], /Organisaatio|määrä|löydy/);
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
  for (const [key, value] of Object.entries({calendar:'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ',time:'ⴰⴽⵓⴷ',today:'ⴰⵙⵙⴰ',day:'ⴰⵙⵙ',week:'ⵉⵎⴰⵍⴰⵙⵙ',month:'ⴰⵢⵢⵓⵔ'})) {
    assert.equal(cache.zgh[key], value);
    assert.match(cache.zgh[key], /^[\u2d30-\u2d7f]+$/);
  }
  assert.equal(cache.zgh['calendar-system-islamic'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⵏ ⵍⵉⵙⵍⴰⵎ');
  assert.equal(cache.zgh['calendar-system-chinese'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⵏ ⵛⵛⵉⵏⵡⴰ');
  assert.equal(cache.zgh['calendar-system-japanese'], 'ⴰⵙⵎⵍⵓⵙⵙⴰⵏ ⵏ ⵍⵢⴰⴱⴰⵏ');
  assert.notEqual(cache.zgh['calendar-system-chinese'], cache.zgh['calendar-system-japanese']);
  assert.equal(cache.zgh.title, 'ⴰⵣⵡⵍ');
  assert.equal(cache.zgh.language, 'ⵜⵓⵜⵍⴰⵢⵜ');
  assert.doesNotMatch(cache.zgh.title + cache.zgh.language, /[\u0600-\u06ff]/);
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
  for (const key of ['allboards.workspace-color', 'dependency-color']) {
    assert.equal(cache['ve-PP'][key], 'Muja');
    assert.doesNotMatch(cache['ve-PP'][key], /Väri/);
  }
  assert.equal(cache['ve-PP']['predicate-year'], 'vozʹ');
  assert.notEqual(cache['ve-PP']['predicate-year'], 'vuosi');
  assert.equal(cache['ve-PP']['event-bleed'], 'Nimi');
  assert.notEqual(cache['ve-PP']['event-bleed'], 'Dzina');
  assert.equal(cache['ve-PP']['calendar-system-ethiopic'], "Efiopijan kalendar'");
  assert.equal(cache['ve-PP']['calendar-system-dangi'], "Dangi (Korejan kalendar')");
  assert.doesNotMatch(cache['ve-PP']['calendar-system-dangi'], /Korean/);
  assert.notEqual(cache['ve-PP']['calendar-system-ethiopic'], 'Ethiopic');
  assert.equal(cache['ve-PP'].search, 'Eci');
  assert.equal(cache['ve-PP']['searchElementPopup-title'], cache['ve-PP'].search);
  assert.equal(cache['ve-PP'].edit, 'Vajehta');
  assert.doesNotMatch(cache['ve-PP'].search + cache['ve-PP'].edit, /Etsi|Muokkaa/);
  assert.equal(cache['ve-PP']['calendar-system-ethioaa'], "Efiopijan kalendar' (Amete Alem)");
  assert.notEqual(cache['ve-PP']['calendar-system-ethioaa'], cache['ve-PP']['calendar-system-ethiopic']);
  assert.equal(cache['ve-PP']['calendar-system-hebrew'], "Evrejalaižiden kalendar'");
  assert.doesNotMatch(cache['ve-PP']['calendar-system-hebrew'], /Hebrew|Izraili/);
  assert.equal(cache['ve-PP']['calendar-system-buddhist'], "Buddizman kalendar'");
  assert.equal(cache['ve-PP']['calendar-system-islamic'], "Islaman kalendar' (Hijri)");
  assert.equal(cache['ve-PP']['calendar-system-islamic-umalqura'], "Islaman kalendar' (Hijri, Umm al-Qura)");
  assert.notEqual(cache['ve-PP']['calendar-system-islamic'], cache['ve-PP']['calendar-system-islamic-umalqura']);
  assert.doesNotMatch(cache['ve-PP']['calendar-system-buddhist'] + cache['ve-PP']['calendar-system-islamic'], /Buddhist|Islamic/);
  assert.equal(cache['ve-PP']['calendar-system-indian'], "Indijan nacionaline kalendar'");
  assert.equal(cache['ve-PP']['calendar-system-roc'], "Minguo (Kitain Tazovaldkundan kalendar')");
  assert.notEqual(cache['ve-PP']['calendar-system-roc'], cache['ve-PP']['calendar-system-chinese']);
  assert.doesNotMatch(cache['ve-PP']['calendar-system-indian'] + cache['ve-PP']['calendar-system-roc'], /Indian national|Republic of China/);
  for (const [key, value] of Object.entries({
    'date-format-yyyy-mm-dd': 'YYYY-MM-DD',
    'date-format-dd-mm-yyyy': 'DD-MM-YYYY',
    'date-format-mm-dd-yyyy': 'MM-DD-YYYY',
  })) {
    assert.equal(cache['ve-PP'][key], value);
    assert.doesNotMatch(cache['ve-PP'][key], /VVVV|KK|PP/);
  }
  assert.equal(cache['ve-PP']['invalid-time'], 'Vär aig');
  assert.doesNotMatch(cache['ve-PP']['invalid-time'], /Virheellinen|aika/);
  assert.equal(cache['ve-PP']['invalid-year'], 'Vär vozʹ. Kirjuta kaik nelʹlʹ cifrad, ozutesikš 2026.');
  assert.match(cache['ve-PP']['invalid-year'], /Kirjuta kaik nelʹlʹ.*2026/);
  assert.doesNotMatch(cache['ve-PP']['invalid-year'], /Unyaka|Thayipha|izinombolo/);
  for (const [key, value] of Object.entries({
    password: 'Peitsana', 'smtp-password': 'Peitsana',
    settings: 'Valičused', 'allBoardsMenuPopup-title': 'Valičused',
    save: 'Kaiče', delete: 'Heitä', cancel: 'Heitä',
    'move-progress-cancel': 'Heitä', help: 'Abu',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Salasana|Asetukset|Tallenna|Poista|Peruuta|Ohje/, key);
  }
  for (const [key, value] of Object.entries({
    'change-password': 'Vajehta peitsana', 'smtp-username': 'Kävutajan nimi',
    'password-again': 'Peitsana (völ kerdan)',
    'forgot-password': 'Unohtid ičeiž peitsanan?',
    'password-mismatch': 'Kirjutadud peitsanad ei olgoi ühtejiččed.',
    'username-password-required': 'Kävutajan nimi da peitsana oma tarbiž.',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /salasana|Salasana|Salasanat|Käyttäjätunnus|uudelleen|Vaihda/, key);
  }
  for (const [key, value] of Object.entries({
    'accounts-lockout-known-users': 'Tetud kävutajiden valičused (oiged kävutajan nimi, vär peitsana)',
    'accounts-lockout-unknown-users': 'Tundmatomiden kävutajiden valičused (kävutajan nimed ei ole)',
    'accounts-lockout-locked-users': 'Saubatud kävutajad',
    'accounts-lockout-user-locked': 'Nece kävutai om saubatud.',
    'accounts-lockout-no-locked-users': "Nügüd' ei ole saubatud kävutajid.",
    'accounts-lockout-user-unlocked': 'Kävutajan saubatuz om heittud hüvin.',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /käyttäj|Käyttäj|salasana|asetukset|lukit|Lukit/i, key);
  }
  assert.match(cache['ve-PP']['accounts-lockout-known-users'], /oiged.*nimi, vär peitsana/);
  assert.match(cache['ve-PP']['accounts-lockout-unknown-users'], /nimed ei ole/);
  assert.match(cache['ve-PP']['accounts-lockout-user-unlocked'], /heittud hüvin/);
  assert.equal(cache['ve-PP']['accounts-lockout-confirm-unlock'], 'Tozi-ik sinä tahtoid heitta necen kävutajan saubatust?');
  assert.equal(cache['ve-PP']['accounts-lockout-confirm-unlock-all'], 'Tozi-ik sinä tahtoid heitta kaikiden saubatud kävutajiden saubatusid?');
  assert.equal(cache['ve-PP']['accounts-lockout-unlock-all'], 'Heitä kaik saubatused');
  assert.notEqual(cache['ve-PP']['accounts-lockout-confirm-unlock'], cache['ve-PP']['accounts-lockout-confirm-unlock-all']);
  assert.doesNotMatch(cache['ve-PP']['accounts-lockout-confirm-unlock-all'], /Haluatko|käyttäj|lukit/i);
  for (const [key, value] of Object.entries({
    email: 'Email-počt', logout: 'Lähte', 'log-out': 'Lähte',
    login: 'Tule', 'log-in': 'Tule', yes: 'Ka', ok: 'KA', confirm: 'Vahvištoita',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Sähköposti|Kirjaudu|Kyllä|KULUNGILE|Varmista/, key);
  }
  assert.equal(cache['ve-PP'].no, 'Ei');
  for (const [key, value] of Object.entries({
    file: 'Fail', next: "Uz'", previous: 'Edeline', refresh: 'Udišta',
    download: 'Pane muštho kut fail', upload: 'Sa', size: "Suruz'", type: 'Tip',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Tiedosto|Seuraava|Edellinen|Päivitä|Lataa|Lähetä|Koko|Tyyppi/, key);
  }
  assert.notEqual(cache['ve-PP'].download, cache['ve-PP'].upload);
  assert.equal(cache['ve-PP'].notifications, 'Tedotuzed');
  assert.equal(cache['ve-PP']['delete-all-notifications'], 'Heitä kaik tedotuzed');
  assert.equal(cache['ve-PP'].description, 'Kirjutuz');
  assert.doesNotMatch(cache['ve-PP'].notifications + cache['ve-PP']['delete-all-notifications'] + cache['ve-PP'].description, /Ilmoitukset|ilmoitukset|Poista|Kuvaus/);
  assert.equal(cache['ve-PP'].hours, 'časud');
  assert.equal(cache['ve-PP'].minutes, 'minutad');
  assert.equal(cache['ve-PP'].seconds, 'sekundad');
  assert.equal(cache['ve-PP']['accounts-lockout-period'], "Saubatusen piduz' (sekundad)");
  assert.doesNotMatch(cache['ve-PP'].hours + cache['ve-PP'].minutes + cache['ve-PP'].seconds + cache['ve-PP']['accounts-lockout-period'], /tuntia|minuuttia|sekuntia|Lukituksen/);
  for (const [key, unit] of Object.entries({
    'every-1-day': 'päiväs', 'every-1-hour': 'časus', 'every-1-minute': 'minutas',
    'every-10-minutes': 'minutas', 'every-30-minutes': 'minutas',
    'every-5-minutes': 'minutas', 'every-6-hours': 'časus',
  })) {
    const interval = key.split('-')[1];
    assert.equal(cache['ve-PP'][key], `Kaikuččes ${interval} ${unit}`, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Kerran|päivässä|tunnissa|minuut|tunnin|välein/, key);
  }
  for (const [key, value] of Object.entries({
    back: 'Tagaze', done: 'Vaumiž', error: 'Viga', errors: 'Vigad',
    info: 'Versii', create: 'Tege',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Takaisin|Valmis|Virhe|Versio|Luo/, key);
  }
  assert.notEqual(cache['ve-PP'].error, cache['ve-PP'].errors);
  for (const [key, value] of Object.entries({
    change: 'Vajehta', close: 'Saubata', export: 'Ve', import: 'To',
    rename: "Anda uz' nimi",
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Muokkaa|Sulje|Thumela ngaphandle|Tuo|Nimeä uudelleen/, key);
  }
  assert.notEqual(cache['ve-PP'].export, cache['ve-PP'].import);
  assert.notEqual(cache['ve-PP'].close, cache['ve-PP'].delete);
  assert.equal(cache['ve-PP']['allow-rename'], "Laske anda uz' nimi");
  assert.equal(cache['ve-PP']['allowRenamePopup-title'], cache['ve-PP']['allow-rename']);
  assert.equal(cache['ve-PP']['accounts-allowUserNameChange'], 'Kävutajan nimen vajehtamine');
  assert.equal(cache['ve-PP']['accounts-allowEmailChange'], 'Laske vajehtada email-počtan adresad');
  assert.equal(cache['ve-PP']['shortcut-clear-filters'], 'Heitä kaik puhtastimed');
  assert.equal(cache['ve-PP'].filter, 'Puhtastim');
  assert.equal(cache['ve-PP']['cron-no-errors'], 'Ei ole vigoid ozutamižen täht');
  for (const key of ['allow-rename', 'allowRenamePopup-title', 'accounts-allowUserNameChange',
    'accounts-allowEmailChange', 'shortcut-clear-filters', 'filter', 'cron-no-errors']) {
    assert.doesNotMatch(cache['ve-PP'][key], /Salli|uudelleennimeä|käyttäjätunn|sähköposti|suodatt|Suodata|virheitä|näyttää/, key);
  }
  for (const [key, value] of Object.entries({
    uploading: 'Samine', 'uploading-files': 'Failoiden samine',
    'upload-failed': 'Samižen viga', 'upload-completed': 'Samine om vaumiž',
    'allowed-upload-filetypes': 'Lasktud sadud failoiden tipad:',
    'max-upload-filesize': 'Maksimaline sadud failan suruz’ baitoiš:',
    'email-fail': 'Email-kirjeižen oigendamižen viga',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Upataan|Tiedostojen|lisäys|epäonnistui|valmis|Sallitut|tiedostotyy|Maksimi|tiedostokoko|Sähköpostin|lähettäminen/, key);
  }
  assert.notEqual(cache['ve-PP']['upload-failed'], cache['ve-PP']['upload-completed']);
  assert.match(cache['ve-PP']['max-upload-filesize'], /baitoiš/);
  for (const [key, value] of Object.entries({
    'email-address': 'Email-počtan adres', 'email-addresses': 'Email-počtan adresad',
    'email-sent': 'Email-kirjeine om oigetud', 'email-fail-text': 'Email-kirjeižen oigendamižen viga',
    'email-invalid': 'Vär email-počt', 'r-send-email': 'Oigenda email-kirjeine',
    'r-d-send-email': 'Oigenda email-kirjeine', 'email-smtp-test-subject': 'SMTP email-počtan test',
    active: 'Aktivine', 'admin-people-filter-active': 'Aktivine',
    'admin-people-filter-inactive': 'Ei-aktivine',
  })) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Sähköposti|sähköposti|lähetetty|Virhe|yrittäessä|lähettää|Lähetä|Aktiivinen|aktiivinen/, key);
  }
  assert.notEqual(cache['ve-PP']['email-address'], cache['ve-PP']['email-addresses']);
  assert.notEqual(cache['ve-PP']['admin-people-filter-active'], cache['ve-PP']['admin-people-filter-inactive']);
  for (const key of ['change-avatar', 'delete-avatar-confirm', 'upload-avatar',
    'uploaded-avatar', 'avatar-too-big', 'max-avatar-filesize', 'allowed-avatar-filetypes']) {
    assert.match(cache['ve-PP'][key], /kävutajan|Kävutajan/, key);
    assert.match(cache['ve-PP'][key], /kuva|kuvan|kuvad/, key);
    assert.doesNotMatch(cache['ve-PP'][key], /profiilikuva|Profiilikuva|Haluatko|varmasti|Muokkaa|Lähetä|lähetetty|enintään|Maksimi|tiedostokoko|Sallitut|tiedostotyypit/, key);
  }
  assert.match(cache['ve-PP']['delete-avatar-confirm'], /^Tozi-ik.*heitta.*\?$/);
  assert.match(cache['ve-PP']['avatar-too-big'], /maksimaline __size__/);
  assert.match(cache['ve-PP']['max-avatar-filesize'], /baitoiš/);
  assert.notEqual(cache['ve-PP']['upload-avatar'], cache['ve-PP']['uploaded-avatar']);
  for (const key of ['email-enrollAccount-subject', 'email-resetPassword-subject', 'email-verifyEmail-subject']) {
    assert.match(cache['ve-PP'][key], /saital __siteName__$/, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Sinulle|luotu|palveluun|Nollaa|salasanasi|palvelussa|Khwathisedzani|ḓiresi|imeiḽi/, key);
  }
  assert.match(cache['ve-PP']['email-resetPassword-subject'], /^Tege ičeleiž uz' peitsana/);
  assert.match(cache['ve-PP']['email-verifyEmail-subject'], /^Vahvištoita/);
  assert.equal(cache['ve-PP']['email-invite'], 'Kucu email-počtan abul');
  assert.equal(cache['ve-PP']['email-smtp-test-text'], 'Sinä oled oigenu email-kirjeižen hüvin');
  assert.doesNotMatch(cache['ve-PP']['email-invite'] + cache['ve-PP']['email-smtp-test-text'], /Kutsu|sähköpost|Olet|onnistuneesti|lähettänyt/);
  assert.equal(cache['ve-PP']['username-too-short'], "Pidab, miše kävutajan nimen piduz' oliži hot' 3 simvolad.");
  assert.match(cache['ve-PP']['username-too-short'], /hot' 3 simvolad/);
  assert.doesNotMatch(cache['ve-PP']['username-too-short'], /Käyttäjätunnuksen|vähintään|merkkiä|enamba 3/);
  assert.equal(cache['ve-PP']['send-smtp-test'], 'Oigenda ičeleiž test-email-kirjeine');
  assert.doesNotMatch(cache['ve-PP']['send-smtp-test'], /Lähetä|sähköposti|itsellesi/);
  assert.equal(cache['ve-PP'].text, 'Tekst');
  assert.notEqual(cache['ve-PP'].text, 'Teksti');
  const vepsCalendars = cache['ve-PP'];
  assert.equal(vepsCalendars['calendar-system-coptic'], "Koptan kalendar'");
  for (const [key, epoch] of [['calendar-system-islamic-civil', 'rahvahaline aiganlugun augotiž'], ['calendar-system-islamic-tbla', 'tähtaztedoline aiganlugun augotiž']]) {
    assert.match(vepsCalendars[key], /Islaman kalendar'.*Hijri.*tablican abul/);
    assert.ok(vepsCalendars[key].includes(epoch), `Veps epoch distinction: ${key}`);
    assert.doesNotMatch(vepsCalendars[key], /Islamic|civil|tabular|astronomical/);
  }
  assert.notEqual(vepsCalendars['calendar-system-islamic-civil'], vepsCalendars['calendar-system-islamic-tbla']);
  assert.match(vepsCalendars['calendar-system-islamic-rgsa'], /Saudan Arabii, kudmaižen tarkištelend/);
  assert.doesNotMatch(vepsCalendars['calendar-system-islamic-rgsa'], /Saudi Arabia|Islamic/);
  // Related Veps activity labels preserve object/source/destination positions.
  for (const [key, value] of Object.entries({
    "activity-added": "Ližatud %s azjale %s",
    "activity-archived": "%s om sirttud arhivaha",
    "activity-attached": "Tartutadud %s azjale %s",
    "activity-created": "Tehtud %s",
    "activity-changedListTitle": "Lugetišen nimi om vajehtadud: %s",
    "activity-excluded": "Heittud %s azjaspäi %s",
    "activity-imported": "Importiruitud %s azjaha %s azjaspäi %s",
    "activity-imported-board": "Importiruitud %s azjaspäi %s",
    "activity-joined": "Ühtni azjaha %s",
    "activity-moved": "Sirttud %s azjaspäi %s azjaha %s",
    "activity-on": "azjal %s",
    "activity-removed": "Heittud %s azjaspäi %s",
    "activity-sent": "Oigetud %s azjale %s",
    "activity-unjoined": "Läksi azjaspäi %s",
    "list": "Lugetiž",
    "lists": "Lugetišed",
    "labels": "Znamad",
    "label-not-found": "Znam '%s' ei ole löutud.",
    "label-color-not-found": "Znaman muja %s ei ole löutud.",
    "activity-added-label": "Ližatud znam '%s' azjale %s",
    "activity-removed-label": "Heittud znam '%s' azjaspäi %s",
    "activity-added-label-card": "Ližatud znam '%s'",
    "activity-removed-label-card": "Heittud znam '%s'",
    "activity-delete-attach": "Heittud tartutadud fail azjaspäi %s",
    "activity-delete-attach-card": "Heittud tartutadud fail",
    "attachment": "Tartutadud fail",
    "attachments": "Tartutadud failad"
})) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /lisätty|siirretty|liitetty|luotu|kohtee|lähteestä|liitytty|peruttu|poistettu|lähetetty|listan nimeksi|Nimilap|Nimilapp|Liitetiedosto|Liitteet/i, key);
  }
  // Veps list controls distinguish directions and empty-only cleanup.
  for (const [key, value] of Object.entries({
    "left-of-list": "Valitud lugetišen huralpäi",
    "right-of-list": "Valitud lugetišen oiktalpäi",
    "auto-list-width": "Lugetišen avtomatine leveduz’",
    "sort": "Sortirui",
    "sort-desc": "Paina, miše sortiruida lugetišt",
    "list-label-sort": "Sinun käzil tehtud järgestuz",
    "delete-duplicate-lists": "Heitä lugetišiden dublikatad",
    "deleteDuplicateListsPopup-title": "Heitä lugetišiden dublikatad",
    "delete-duplicate-empty-lists-migration": "Heitä tühjiden lugetišiden dublikatad",
    "step-delete-duplicate-empty-lists": "Heitä tühjiden lugetišiden dublikatad",
    "error-list-doesNotExist": "Necidä lugetišt ei ole.",
    "no-results": "Ei ole satusid"
})) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Valitun|vasemmalle|oikealle|Automaattinen|leveys|Lajittele|Klikkaa|lajitellaksesi|manuaalinen|järjestys|Poista|kaksoiskappale|tyhjistä|kopiot|ei ole olemassa|Ei tuloksia/, key);
  }
  assert.notEqual(cache['ve-PP']['left-of-list'], cache['ve-PP']['right-of-list']);
  assert.ok(cache['ve-PP']['left-of-list'].endsWith('huralpäi'));
  assert.ok(cache['ve-PP']['right-of-list'].endsWith('oiktalpäi'));
  assert.equal(cache['ve-PP']['delete-duplicate-lists'], cache['ve-PP']['deleteDuplicateListsPopup-title']);
  assert.equal(cache['ve-PP']['delete-duplicate-empty-lists-migration'], cache['ve-PP']['step-delete-duplicate-empty-lists']);
  assert.match(cache['ve-PP']['delete-duplicate-empty-lists-migration'], /tühjiden/);
  assert.doesNotMatch(cache['ve-PP']['delete-duplicate-lists'], /tühjiden/);
  // Veps storage labels retain destination, all-file scope and destructive warning.
  for (const [key, value] of Object.entries({
    "attachment-move-storage-fs": "Sirdä tartutadud fail failoiden sistemaha",
    "attachment-move-storage-gridfs": "Sirdä tartutadud fail MongoDB GridFS -kaičusehe",
    "attachment-delete-pop": "Tartutadud failan heitämine om pördutamatoi. Ei sa pördutada.",
    "attachment-storage-configuration": "Tartutadud failoiden kaičusen valičused",
    "attachments-path": "Tartutadud failoiden te",
    "attachments-path-description": "Te tartutadud failoiden kaičusen täht",
    "filesystem-attachments": "Failoiden sisteman tartutadud failad",
    "filesystem-path-description": "Failoiden kaičusen päte",
    "filesystem-size": "Failoiden sisteman suruz’",
    "gridfs-enabled-description": "Kävuta MongoDB GridFS failoiden kaičusen täht",
    "migrate-all-to-filesystem": "Sirdä kaik failoiden sistemaha",
    "move-all-attachments-to-fs": "Sirdä kaik tartutadud failad failoiden sistemaha",
    "move-all-attachments-to-gridfs": "Sirdä kaik tartutadud failad MongoDB GridFS -kaičusehe",
    "move-all-attachments-to-s3": "Sirdä kaik tartutadud failad S3 -kaičusehe",
    "s3-enabled-description": "Kävuta AWS S3 libo MinIO failoiden kaičusen täht",
    "s3-secret-key-required": "S3 -peituzavadim om tarbhai.",
    "s3-settings-saved": "S3 -valičused oma hüvin kaitud.",
    "s3-settings-save-failed": "Ei voind kaita S3 -valičusid.",
    "step-fix-attachment-urls": "Oigenda tartutadud failoiden URL-adresad",
    "storage-distribution": "Kaičusen jago"
})) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(cache['ve-PP'][key], /Siirrä|Liitetiedoston|lopullista|peruuttamaan|tallennus|tiedostojärjestelm|Liitteiden|Tiedostojärjestelmän|Peruspolku|Käytä|salainen|vaaditaan|onnistuneesti|epäonnistui|Korjaa|jakautuminen/, key);
  }
  assert.match(cache['ve-PP']['attachment-delete-pop'], /pördutamatoi\. Ei sa pördutada\./);
  assert.match(cache['ve-PP']['move-all-attachments-to-fs'], /kaik.*failoiden sistemaha/);
  assert.match(cache['ve-PP']['move-all-attachments-to-gridfs'], /kaik.*MongoDB GridFS/);
  assert.match(cache['ve-PP']['move-all-attachments-to-s3'], /kaik.*S3/);
  assert.doesNotMatch(cache['ve-PP']['attachment-move-storage-fs'], /kaik/);
  assert.notEqual(cache['ve-PP']['s3-settings-saved'], cache['ve-PP']['s3-settings-save-failed']);
  assert.match(cache['ve-PP']['s3-enabled-description'], /AWS S3 libo MinIO/);
  const vepsTranslator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
  await vepsTranslator.init({ lng: 've-PP', fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { 've-PP': { translation: cache['ve-PP'] } }, postProcess: ['sprintf'] });
  assert.equal(vepsTranslator.t('activity-moved', { sprintf: ['ITEM', 'SOURCE', 'DESTINATION'] }), 'Sirttud ITEM azjaspäi SOURCE azjaha DESTINATION');
  assert.equal(vepsTranslator.t('activity-imported', { sprintf: ['ITEM', 'DESTINATION', 'SOURCE'] }), 'Importiruitud ITEM azjaha DESTINATION azjaspäi SOURCE');
  assert.equal(vepsTranslator.t('activity-removed-label', { sprintf: ['LABEL', 'CARD'] }), "Heittud znam 'LABEL' azjaspäi CARD");
  assert.equal(vepsTranslator.t('attachment-delete-pop'), 'Tartutadud failan heitämine om pördutamatoi. Ei sa pördutada.');
  assert.equal(vepsTranslator.t('move-all-attachments-to-gridfs'), 'Sirdä kaik tartutadud failad MongoDB GridFS -kaičusehe');
  assert.equal(vepsTranslator.t('s3-settings-save-failed'), 'Ei voind kaita S3 -valičusid.');
  assert.equal(vepsTranslator.t('left-of-list'), 'Valitud lugetišen huralpäi');
  assert.equal(vepsTranslator.t('delete-duplicate-empty-lists-migration'), 'Heitä tühjiden lugetišiden dublikatad');
  assert.equal(vepsTranslator.t('error-list-doesNotExist'), 'Necidä lugetišt ei ole.');
  assert.notEqual(cache['ve-PP']['activity-joined'], cache['ve-PP']['activity-unjoined']);
  assert.notEqual(cache['ve-PP']['activity-attached'], cache['ve-PP']['activity-added']);
  const vepsNetworkRepairs = {
  "smtp-host": "SMTP -server",
  "smtp-host-description": "SMTP -serveran adres, kudamb oigendab sinun email-kirjeižid.",
  "smtp-port": "SMTP -port",
  "smtp-port-description": "Port, kudambad sinun SMTP -server kävutab oigendatuid email-kirjeižiden täht.",
  "smtp-tls": "TLS -tugi",
  "smtp-tls-description": "Kävuta TLS -tugi SMTP -serveran täht",
  "s3-minio-storage": "S3/MinIO -kaičuz",
  "s3-port": "S3 -port",
  "s3-port-description": "S3 -endpointan portan nomer",
  "s3-region": "S3 -aloveh",
  "s3-region-description": "AWS S3 -aloveh (nä., us-east-1)",
  "s3-secret-key": "S3 -peituzavadim",
  "s3-secret-key-description": "AWS S3 -peituzavadim ičen tundištamižen täht",
  "s3-secret-key-placeholder": "Vede S3 -peituzavadim",
  "s3-ssl-enabled": "S3 SSL kävutuses",
  "s3-ssl-enabled-description": "Kävuta SSL/TLS S3 -ühtenzoitusten täht",
  "save-s3-settings": "Kaita S3 -valičused",
  "test-s3-connection": "Testirui S3 -ühtenzoitust"
};
  for (const [key,value] of Object.entries(vepsNetworkRepairs)) {
    assert.equal(cache['ve-PP'][key],value);
    assert.equal(vepsTranslator.t(key),value);
    assert.doesNotMatch(value,/palvelim|käyttöavain|salainen|portti|Tallenna|Testaa|STMP/);
  }
  assert.match(cache['ve-PP']['s3-region-description'],/us-east-1/);
  assert.match(cache['ve-PP']['s3-ssl-enabled-description'],/SSL\/TLS/);
  const vepsS3Repairs = {
  "s3-access-key": "S3 -päzundavadim",
  "s3-access-key-description": "AWS S3 -päzundavadim ičen tundištamižen täht",
  "s3-access-key-placeholder": "Vede S3 -päzundavadim",
  "s3-bucket": "S3 -bucket",
  "s3-bucket-description": "S3 -bucketan nimi failoiden kaičusen täht",
  "s3-connection-failed": "S3 -ühtenzoituz ei ole satusekaz",
  "s3-connection-success": "S3 -ühtenzoituz om satusekaz",
  "s3-enabled": "S3 kävutuses",
  "s3-endpoint": "S3 -endpoint",
  "s3-endpoint-description": "S3 -endpointan URL (nä., s3.amazonaws.com libo minio.example.com)",
  "mongodb-gridfs-storage": "MongoDB GridFS -kaičuz"
};
  for (const [key, value] of Object.entries(vepsS3Repairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /käyttöavain|tunnistautumiseen|Syötä|kauha|tiedostojen|tallennukseen|yhteys|epäonnistui|onnistui|käytössä|päätepiste|esim\./, key);
  }
  assert.notEqual(cache['ve-PP']['s3-access-key'], cache['ve-PP']['s3-secret-key']);
  assert.match(cache['ve-PP']['s3-access-key'], /päzundavadim/);
  assert.match(cache['ve-PP']['s3-secret-key'], /peituzavadim/);
  assert.match(cache['ve-PP']['s3-connection-failed'], /ei ole satusekaz/);
  assert.match(cache['ve-PP']['s3-connection-success'], /om satusekaz/);
  assert.match(cache['ve-PP']['s3-endpoint-description'], /s3\.amazonaws\.com libo minio\.example\.com/);
  assert.match(cache['ve-PP']['mongodb-gridfs-storage'], /MongoDB GridFS/);
  const vepsMigrationRepairs = {
  "migration-failed": "Migracii ei ole satusekaz",
  "migration-paused": "Migracijad oma hüvin azotadud.",
  "migration-running": "Radab...",
  "migration-stopped": "Migracijad oma hüvin seižutadud.",
  "pause-all-migrations": "Azota kaik migracijad",
  "start-all-migrations": "Augota kaik migracijad",
  "stop-all-migrations": "Seižuta kaik migracijad",
  "migration-pause-failed": "Ei voind azotada migracijoid.",
  "migration-stop-failed": "Ei voind seižutada migracijoid.",
  "migration-stop-confirm": "Tahtoid-ik sinä tozi seižutada kaik migracijad?",
  "migration-status": "Migracijan status",
  "migration-complete": "Vaumiž",
  "migration-successful": "Migracii om hüvin loptud.",
  "migration-resume-failed": "Ei voind jatkata migracijad.",
  "migration-resumed": "Migracii om jatktud."
};
  for (const [key, value] of Object.entries(vepsMigrationRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Siirto|Siirron|Siirtojen|siirrot|epäonnistui|onnistuneesti|Suoritetaan|Keskeytä|Aloita|Pysäytä|Valmis|Haluatko/, key);
  }
  assert.match(cache['ve-PP']['pause-all-migrations'], /^Azota kaik migracijad$/);
  assert.match(cache['ve-PP']['start-all-migrations'], /^Augota kaik migracijad$/);
  assert.match(cache['ve-PP']['stop-all-migrations'], /^Seižuta kaik migracijad$/);
  assert.match(cache['ve-PP']['migration-stop-confirm'], /seižutada kaik migracijad\?$/);
  assert.notEqual(cache['ve-PP']['migration-paused'], cache['ve-PP']['migration-stopped']);
  assert.notEqual(cache['ve-PP']['migration-stopped'], cache['ve-PP']['migration-successful']);
  assert.match(cache['ve-PP']['migration-resumed'], /jatktud/);
  assert.match(cache['ve-PP']['migration-resume-failed'], /^Ei voind jatkata/);
  const vepsMigrationSettingsRepairs = {
  "migration-batch-size": "Paketan suruz’",
  "migration-batch-size-description": "Tartutadud failoiden lugumär kätandan täht joga paketas (1-100)",
  "migration-cpu-threshold": "CPU -ülimär (%)",
  "migration-cpu-threshold-description": "Azota migracii, konz CPU -kävutuz ülitab necen procentan (10-90)",
  "migration-delay-ms": "Pidätand (ms)",
  "migration-delay-ms-description": "Pidätand paketoiden keskes millisekundoiš (100-10000)",
  "migration-log": "Migracijan aigkirj",
  "migration-markers": "Migracijan znamad",
  "migration-steps": "Migracijan etapad",
  "migration-needed": "Migracii om tarbiž"
};
  for (const [key, value] of Object.entries(vepsMigrationSettingsRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Erän|koko|Liitteiden|käsiteltäväksi|kussakin|Suorittimen|kynnys|Keskeytä|ylittää|prosenttiosuuden|Viive|millisekunteina|Siirron|tarvitaan/, key);
  }
  for (const [key, range] of [
    ['migration-batch-size-description', '1-100'],
    ['migration-cpu-threshold-description', '10-90'],
    ['migration-delay-ms-description', '100-10000']
  ]) {
    assert.equal(cache['ve-PP'][key].match(/\(\d+-\d+\)/g).join(''), `(${range})`);
  }
  assert.match(cache['ve-PP']['migration-batch-size-description'], /failoiden lugumär.*joga paketas/);
  assert.match(cache['ve-PP']['migration-cpu-threshold'], /CPU.*\(%\)/);
  assert.match(cache['ve-PP']['migration-cpu-threshold-description'], /^Azota migracii, konz CPU -kävutuz ülitab/);
  assert.match(cache['ve-PP']['migration-delay-ms'], /\(ms\)/);
  assert.match(cache['ve-PP']['migration-delay-ms-description'], /paketoiden keskes millisekundoiš/);
  const vepsActivityMessageRepairs = {
  "card": "Kart",
  "swimlane": "Ujundšoid",
  "comment": "Sel’genzoituz",
  "act-addAttachment": "Ližatud tartutadud fail __attachment__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-deleteAttachment": "Heittud tartutadud fail __attachment__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addLabel": "Ližatud znam __label__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addedLabel": "Ližatud znam __label__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removeLabel": "Heittud znam __label__ kartaspäi __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removedLabel": "Heittud znam __label__ kartaspäi __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addComment": "Sel’genzoittud kartal __card__: __comment__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-editComment": "Vajehtadud sel’genzoituz kartal __card__: __comment__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-deleteComment": "Heittud sel’genzoituz kartal __card__: __comment__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-createBoard": "Tehtud laud __board__",
  "act-createSwimlane": "Tehtud ujundšoid __swimlane__ laudale __board__",
  "act-createCard": "Tehtud kart __card__ lugetišehe __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-createList": "Ližatud lugetiž __list__ laudale __board__",
  "act-addBoardMember": "Ližatud ühtnik __member__ laudale __board__",
  "act-archivedBoard": "Laud __board__ om sirttud arhivaha",
  "act-archivedCard": "Kart __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__ om sirttud arhivaha",
  "act-archivedList": "Lugetiž __list__ ujundšoidul __swimlane__ laudal __board__ om sirttud arhivaha",
  "act-archivedSwimlane": "Ujundšoid __swimlane__ laudal __board__ om sirttud arhivaha",
  "act-importBoard": "Importiruitud laud __board__",
  "act-importCard": "Importiruitud kart __card__ lugetišehe __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-importList": "Importiruitud lugetiž __list__ ujundšoidule __swimlane__ laudal __board__",
  "act-joinMember": "Ližatud ühtnik __member__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-unjoinMember": "Heittud ühtnik __member__ kartaspäi __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removeBoardMember": "Heittud ühtnik __member__ laudaspäi __board__",
  "act-moveCard": "Sirttud kart __card__ laudal __board__ lugetišespäi __oldList__ ujundšoidul __oldSwimlane__ lugetišehe __list__ ujundšoidule __swimlane__",
  "act-moveCardToOtherBoard": "Sirttud kart __card__ lugetišespäi __oldList__ ujundšoidul __oldSwimlane__ laudaspäi __oldBoard__ lugetišehe __list__ ujundšoidul __swimlane__ laudale __board__",
  "act-restoredCard": "Udištadud kart __card__ lugetišehe __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-deleteCard": "häviti kartan __card__ listaspäi __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removeSwimlane": "häviti ujundšoidun __swimlane__ laudal __board__"
};
  const activitySlots = {
    card: 'CARD', list: 'LIST', swimlane: 'SWIMLANE', board: 'BOARD',
    oldList: 'SOURCE_LIST', oldSwimlane: 'SOURCE_SWIMLANE', oldBoard: 'SOURCE_BOARD',
    attachment: 'ATTACHMENT', label: 'LABEL', member: 'MEMBER', comment: 'COMMENT'
  };
  for (const [key, value] of Object.entries(vepsActivityMessageRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, activitySlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => activitySlots[name]), key);
    assert.doesNotMatch(value, /lisätty|poistettu|nimilappu|kortill|kortilt|kortti|listall|listalle|uimarad|taulull|taululle|muokkasi|kommenttia|palautettu|siirretty|siirsi|luotu|jäsen|Arkistoon|uindrad/, key);
  }
  assert.equal(cache['ve-PP']['act-addLabel'], cache['ve-PP']['act-addedLabel']);
  assert.equal(cache['ve-PP']['act-removeLabel'], cache['ve-PP']['act-removedLabel']);
  assert.match(vepsTranslator.t('act-moveCard', activitySlots), /lugetišespäi SOURCE_LIST ujundšoidul SOURCE_SWIMLANE lugetišehe LIST ujundšoidule SWIMLANE/);
  assert.match(vepsTranslator.t('act-moveCardToOtherBoard', activitySlots), /laudaspäi SOURCE_BOARD.*laudale BOARD$/);
  assert.match(vepsTranslator.t('act-addAttachment', activitySlots), /ATTACHMENT kartale CARD/);
  assert.match(vepsTranslator.t('act-joinMember', activitySlots), /^Ližatud ühtnik MEMBER kartale CARD/);
  assert.match(vepsTranslator.t('act-unjoinMember', activitySlots), /^Heittud ühtnik MEMBER kartaspäi CARD/);
  assert.match(vepsTranslator.t('act-archivedCard', activitySlots), /om sirttud arhivaha$/);
  assert.doesNotMatch(vepsTranslator.t('act-restoredCard', activitySlots), /arhivaha/);
  const vepsChecklistRepairs = {
  "checklist": "Kodvindlugetiž",
  "checklists": "Kodvindlugetišed",
  "subtasks": "Alategendad",
  "add-checklist": "Ližada kodvindlugetiž",
  "add-checklist-item": "Ližada koht kodvindlugetišehe",
  "add-subtask": "Ližada alategend",
  "checklistActionsPopup-title": "Kodvindlugetišen tegendad",
  "checklistDeletePopup-title": "Heitä kodvindlugetiž?",
  "checklistItemDeletePopup-title": "Heitä kodvindlugetišen koht?",
  "hide-checked-items": "Peitä znamoitud kohtad",
  "checklist-count": "Kodvindlugetišen kohtiden lugu (0/0)",
  "checklist-count-on-minicard": "Kodvindlugetišen kohtiden lugu (0/0) minikartal",
  "act-addSubtask": "Ližatud alategend __subtask__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addChecklist": "Ližatud kodvindlugetiž __checklist__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addChecklistItem": "Ližatud koht __checklistItem__ kodvindlugetišehe __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removeChecklist": "Heittud kodvindlugetiž __checklist__ kartaspäi __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-removeChecklistItem": "Heittud koht __checklistItem__ kodvindlugetišespäi __checkList__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-checkedItem": "Znamoitud koht __checklistItem__ kodvindlugetišes __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-uncheckedItem": "Heittud znam kohtaspäi __checklistItem__ kodvindlugetišes __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-completeChecklist": "Loptud kodvindlugetiž __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-uncompleteChecklist": "Kodvindlugetiž __checklist__ om märitud kut lopmatoi kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__"
};
  const checklistSlots = { ...activitySlots, checklist: 'CHECKLIST', checkList: 'SOURCE_CHECKLIST', checklistItem: 'ITEM', subtask: 'SUBTASK' };
  for (const [key, value] of Object.entries(vepsChecklistRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, checklistSlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => checklistSlots[name]), key);
    assert.doesNotMatch(value, /Tarkistuslista|tarkistuslist|lisätty|poistettu|Lisää|Alitehtävät|Poista|Piilota|ruksattu|ruksi|kortill|uimarad|taulull|Kontroll-listan|elementoiden|o bvisa|tshiteṅwa|mutevhe|garaṱa|nḓila/, key);
  }
  assert.match(vepsTranslator.t('act-addChecklistItem', checklistSlots), /ITEM kodvindlugetišehe CHECKLIST kartal CARD/);
  assert.match(vepsTranslator.t('act-removeChecklistItem', checklistSlots), /ITEM kodvindlugetišespäi SOURCE_CHECKLIST kartal CARD/);
  assert.match(vepsTranslator.t('act-uncheckedItem', checklistSlots), /^Heittud znam kohtaspäi ITEM/);
  assert.doesNotMatch(vepsTranslator.t('act-checkedItem', checklistSlots), /Heittud znam/);
  assert.match(vepsTranslator.t('act-uncompleteChecklist', checklistSlots), /CHECKLIST om märitud kut lopmatoi/);
  assert.match(vepsTranslator.t('act-completeChecklist', checklistSlots), /^Loptud kodvindlugetiž CHECKLIST/);
  assert.match(vepsTranslator.t('act-addSubtask', checklistSlots), /SUBTASK kartale CARD/);
  assert.match(cache['ve-PP']['checklist-count'], /\(0\/0\)$/);
  assert.equal(cache['ve-PP']['checklist-count-on-minicard'], cache['ve-PP']['checklist-count'] + ' minikartal');
  const vepsCustomFieldRepairs = {
  "act-createCustomField": "Tehtud kävutajan märitud pöud __customField__ laudal __board__",
  "act-deleteCustomField": "Heittud kävutajan märitud pöud __customField__ laudal __board__",
  "act-setCustomField": "Vajehtadud kävutajan märitud pöud __customField__: __customFieldValue__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "card-edit-custom-fields": "Vajehta kävutajan märitud pöudoid",
  "custom-field-delete-pop": "Ei sa pördutada. Nece heitäb necen kävutajan märitud pöudon kaikiš kartoišpäi da heitäb sen istorijan.",
  "custom-field-checkbox": "Valičuznellik",
  "custom-field-date": "Päivmär",
  "date": "Päivmär",
  "custom-field-dropdown": "Valičuzlugetiž",
  "custom-field-dropdown-none": "(ei nimidä)",
  "custom-field-dropdown-options": "Lugetišen valičused",
  "custom-field-dropdown-options-placeholder": "Paina Enter, miše ližata enamba valičusid",
  "custom-field-dropdown-unknown": "(tundmatoi)",
  "custom-field-dropdownMultiSelect": "Valičuzlugetiž (äjiden valičuz)",
  "custom-field-number": "Lugu",
  "custom-field-text": "Tekst",
  "custom-fields": "Kävutajan märitud pöudod",
  "filter-custom-fields-label": "Puhtasta kävutajan märitud pöudoiden mödhe",
  "filter-no-custom-fields": "Ei ole kävutajan märitud pöudoid",
  "custom-field-stringtemplate": "Simvolrivin šablon",
  "custom-field-stringtemplate-format": "Format (kävuta %{value} sijaznamaks)",
  "custom-field-stringtemplate-separator": "Jagoznam (kävuta &#32; libo &nbsp; keskustan täht)",
  "custom-field-stringtemplate-item-placeholder": "Paina Enter, miše ližata enamba kohtid"
};
  const customFieldSlots = { ...activitySlots, customField: 'FIELD', customFieldValue: 'VALUE' };
  for (const [key, value] of Object.entries(vepsCustomFieldRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, customFieldSlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => customFieldSlots[name]), key);
    assert.doesNotMatch(value, /mukautet|kentän|kenttää|kenttiä|Muokkaa|poisti|muokkasi|kortill|uimarad|taulull|Päivämäärä|Pudotusvalikko|lisätäksesi|vaihtoehtoja|tuntematon|Merkkijono|Muoto|Erotin|välilyöntinä|u nanga|%\{arvo\}/, key);
  }
  assert.match(vepsTranslator.t('act-setCustomField', customFieldSlots), /FIELD: VALUE kartal CARD lugetišes LIST ujundšoidul SWIMLANE laudal BOARD$/);
  assert.match(cache['ve-PP']['custom-field-delete-pop'], /^Ei sa pördutada\..*kaikiš kartoišpäi.*heitäb sen istorijan\.$/);
  assert.match(cache['ve-PP']['custom-field-dropdownMultiSelect'], /äjiden valičuz/);
  assert.notEqual(cache['ve-PP']['custom-field-dropdown-none'], cache['ve-PP']['custom-field-dropdown-unknown']);
  assert.equal(cache['ve-PP']['custom-field-date'], cache['ve-PP'].date);
  assert.equal(cache['ve-PP']['custom-field-number'], cache['ve-PP'].number);
  assert.equal(cache['ve-PP']['custom-field-text'], cache['ve-PP'].text);
  assert.match(vepsTranslator.t('custom-field-stringtemplate-format'), /%\{value\}/);
  assert.deepEqual(entities(cache['ve-PP']['custom-field-stringtemplate-separator']), entities(english['custom-field-stringtemplate-separator']));
  const vepsChecklistActivityRepairs = {
  "activity-customfield-created": "Tehtud kävutajan märitud pöud %s",
  "activity-subtask-added": "Ližatud alategend azjale %s",
  "activity-checked-item": "Znamoitud koht %s kodvindlugetišes %s azjal %s",
  "activity-unchecked-item": "Heittud znam kohtaspäi %s kodvindlugetišes %s azjal %s",
  "activity-checklist-added": "Ližatud kodvindlugetiž azjale %s",
  "activity-checklist-removed": "Heittud kodvindlugetiž azjaspäi %s",
  "activity-checklist-completed": "Loptud kodvindlugetiž %s azjal %s",
  "activity-checklist-uncompleted": "Kodvindlugetiž %s om märitud kut lopmatoi azjal %s",
  "activity-checklist-item-added": "Ližatud koht kodvindlugetišehe '%s' azjal %s",
  "activity-checklist-item-removed": "Heittud koht kodvindlugetišespäi '%s' azjal %s",
  "activity-checked-item-card": "Znamoitud koht %s kodvindlugetišes %s",
  "activity-unchecked-item-card": "Heittud znam kohtaspäi %s kodvindlugetišes %s",
  "activity-checklist-completed-card": "Loptud kodvindlugetiž __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "activity-checklist-uncompleted-card": "Kodvindlugetiž %s om märitud kut lopmatoi",
  "activity-editComment": "Vajehtadud sel’genzoituz %s",
  "activity-deleteComment": "Heittud sel’genzoituz %s",
  "activity-set-customfield": "Kävutajan märitud pöud '%s' om pandud kut '%s' azjal %s",
  "activity-unset-customfield": "Heittud kävutajan märitud pöudon '%s' znamoičend azjal %s",
  "r-w-label-added": "Mitte taht znam om ližatud",
  "r-w-member-added": "Ühtnik om ližatud",
  "r-w-assignee-added": "Märitud kävutai om ližatud",
  "r-w-checklist-added": "Kodvindlugetiž om ližatud",
  "r-w-attachment-added": "Tartutadud fail om ližatud",
  "act-addAttachment": "Ližatud tartutadud fail __attachment__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addSubtask": "Ližatud alategend __subtask__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addLabel": "Ližatud znam __label__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addedLabel": "Ližatud znam __label__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addChecklist": "Ližatud kodvindlugetiž __checklist__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-addChecklistItem": "Ližatud koht __checklistItem__ kodvindlugetišehe __checklist__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-createList": "Ližatud lugetiž __list__ laudale __board__",
  "act-addBoardMember": "Ližatud ühtnik __member__ laudale __board__",
  "act-joinMember": "Ližatud ühtnik __member__ kartale __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__"
};
  for (const [key, value] of Object.entries(vepsChecklistActivityRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, checklistSlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => checklistSlots[name]), key);
    assert.doesNotMatch(value, /luotu|mukautettu|lisätty|alitehtävä|ruksattu|poistettu|tarkistuslist|saatiin|valmiiksi|keskeneräinen|lisäsi|kortilla|uimarad|taulull|muokkasi|kommenttia|poisti|asetettu|sisällöksi|Käsittelijä|ližadud/i, key);
  }
  assert.equal(vepsTranslator.t('activity-checked-item', { sprintf: ['ITEM', 'CHECKLIST', 'CARD'] }), 'Znamoitud koht ITEM kodvindlugetišes CHECKLIST azjal CARD');
  assert.equal(vepsTranslator.t('activity-checklist-item-added', { sprintf: ['CHECKLIST', 'CARD'] }), "Ližatud koht kodvindlugetišehe 'CHECKLIST' azjal CARD");
  assert.equal(vepsTranslator.t('activity-checklist-item-removed', { sprintf: ['CHECKLIST', 'CARD'] }), "Heittud koht kodvindlugetišespäi 'CHECKLIST' azjal CARD");
  assert.equal(vepsTranslator.t('activity-set-customfield', { sprintf: ['FIELD', 'VALUE', 'CARD'] }), "Kävutajan märitud pöud 'FIELD' om pandud kut 'VALUE' azjal CARD");
  assert.equal(vepsTranslator.t('activity-unset-customfield', { sprintf: ['FIELD', 'CARD'] }), "Heittud kävutajan märitud pöudon 'FIELD' znamoičend azjal CARD");
  assert.equal(cache['ve-PP']['activity-checklist-completed-card'], cache['ve-PP']['act-completeChecklist']);
  assert.match(vepsTranslator.t('activity-checklist-uncompleted', { sprintf: ['CHECKLIST', 'CARD'] }), /CHECKLIST om märitud kut lopmatoi azjal CARD/);
  assert.match(cache['ve-PP']['r-w-label-added'], /^Mitte taht znam/);
  const vepsDateActivityRepairs = {
  "activity-receivedDate": "Vajehtadud sadud päivmär: %s azjal %s",
  "activity-startDate": "Vajehtadud augotišen päivmär: %s azjal %s",
  "activity-dueDate": "Vajehtadud märaigan päivmär: %s azjal %s",
  "activity-endDate": "Vajehtadud lopun päivmär: %s azjal %s",
  "card-received": "Sadud",
  "card-received-on": "Sadud",
  "card-start": "Augotiž",
  "card-start-on": "Augotiž",
  "card-due": "Märaig",
  "card-due-on": "Märaig",
  "card-end": "Lop",
  "card-end-on": "Lop",
  "due-date": "Märaigan päivmär",
  "editCardReceivedDatePopup-title": "Vajehta sadud päivmär",
  "editCardStartDatePopup-title": "Vajehta augotišen päivmär",
  "editCardDueDatePopup-title": "Vajehta märaigan päivmär",
  "editCardEndDatePopup-title": "Vajehta lopun päivmär",
  "r-when-a-due-date-changed": "Konz märaigan päivmär om pandud libo vajehtadud",
  "r-when-a-start-date-changed": "Konz augotišen päivmär om pandud libo vajehtadud",
  "r-when-a-end-date-changed": "Konz lopun päivmär om pandud libo vajehtadud",
  "r-when-a-received-date-changed": "Konz sadud päivmär om pandud libo vajehtadud",
  "r-df-due-at": "märaig",
  "r-df-received-at": "sadud",
  "act-a-dueAt": "Vajehtadud märaig\nKonz: __timeValue__\nKus: __card__\nEdeline märaig: __timeOldValue__",
  "act-a-endAt": "Vajehtadud lopun aig: __timeValue__ (ende: __timeOldValue__)",
  "act-a-receivedAt": "Vajehtadud sadud aig: __timeValue__ (ende: __timeOldValue__)",
  "act-a-startAt": "Vajehtadud augotišen aig: __timeValue__ (ende: __timeOldValue__)",
  "a-dueAt": "vajehtadud märaig:",
  "a-endAt": "vajehtadud lopun aig:",
  "a-receivedAt": "vajehtadud sadud aig:",
  "a-startAt": "vajehtadud augotišen aig:",
  "almostdue": "nügüdläine märaig %s läheneb",
  "pastdue": "nügüdläine märaig %s om männu",
  "duenow": "nügüdläine märaig %s om tämbei",
  "act-newDue": "__list__/__card__: ezmäine märaigan johtutez [__board__]",
  "act-withDue": "__list__/__card__: märaigan johtutesed [__board__]",
  "act-almostdue": "Johtuti: kartan __card__ nügüdläine märaig (__timeValue__) läheneb",
  "act-pastdue": "Johtuti: kartan __card__ nügüdläine märaig (__timeValue__) om männu",
  "act-duenow": "Johtuti: kartan __card__ nügüdläine märaig (__timeValue__) om nügüd'"
};
  const dateSlots = { ...activitySlots, timeValue: 'NEW_TIME', timeOldValue: 'OLD_TIME' };
  for (const [key, value] of Object.entries(vepsDateActivityRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, dateSlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => dateSlots[name]), key);
    assert.doesNotMatch(value, /muokkasi|vastaanott|aloitus|loppumis|eräpäiv|eräänt|Alkaa|Loppuu|Päättyy|muokattu|muutettu|alkuperäisestä|Milloin|Missä|edellinen|nykyinen|lähestyy|on mennyt|on tänään|muistutt|ḽo|ḓuvha|shanduka/i, key);
  }
  for (const [kind, noun] of [['received', 'sadud'], ['start', 'augotišen'], ['due', 'märaigan'], ['end', 'lopun']]) {
    assert.equal(vepsTranslator.t(`activity-${kind}Date`, { sprintf: ['DATE', 'CARD'] }), `Vajehtadud ${noun} päivmär: DATE azjal CARD`);
    assert.match(cache['ve-PP'][`r-when-a-${kind}-date-changed`], /om pandud libo vajehtadud$/);
  }
  assert.equal(vepsTranslator.t('act-a-dueAt', dateSlots), 'Vajehtadud märaig\nKonz: NEW_TIME\nKus: CARD\nEdeline märaig: OLD_TIME');
  assert.match(vepsTranslator.t('act-a-startAt', dateSlots), /augotišen aig: NEW_TIME \(ende: OLD_TIME\)$/);
  assert.match(vepsTranslator.t('act-a-endAt', dateSlots), /lopun aig: NEW_TIME \(ende: OLD_TIME\)$/);
  assert.match(vepsTranslator.t('act-a-receivedAt', dateSlots), /sadud aig: NEW_TIME \(ende: OLD_TIME\)$/);
  assert.match(vepsTranslator.t('act-almostdue', dateSlots), /läheneb$/);
  assert.match(vepsTranslator.t('act-pastdue', dateSlots), /om männu$/);
  assert.match(vepsTranslator.t('act-duenow', dateSlots), /om nügüd'$/);
  assert.match(vepsTranslator.t('duenow', { sprintf: ['TIME'] }), /TIME om tämbei$/);
  assert.match(vepsTranslator.t('act-newDue', dateSlots), /ezmäine märaigan johtutez/);
  assert.notEqual(cache['ve-PP']['a-dueAt'], cache['ve-PP']['a-receivedAt']);
  const vepsDateFilterRepairs = {
  "due-today": "Märaig tämbei",
  "due-days-left": "%s päiväd oma jänuded",
  "due-days-overdue": "%s päiväd märaigan jäl'ghe",
  "export-card-field-dates": "Päivmärad (Tehtud, Sadud, Augotiž, Märaig, Lop)",
  "filter-no-due-date": "Ei ole märaigan päivmärad",
  "filter-overdue": "Märaig om männu",
  "filter-due-today": "Märaig tämbei",
  "filter-due-this-week": "Märaig täl nedalil",
  "filter-due-next-week": "Märaig tulijal nedalil",
  "filter-due-tomorrow": "Märaig homen",
  "r-w-set-received-now": "Pane sadud päivmär nügüd'",
  "r-due-overdue": "om männu",
  "start-day-of-week": "Pane nedalin augotišen päiv",
  "myCardsSortChange-choice-dueat": "Märaigan päivmäran mödhe",
  "dueCards-title": "Märaiganke kartad",
  "dueCardsViewChange-title": "Märaiganke kartoiden kacund",
  "dueCardsViewChangePopup-title": "Märaiganke kartoiden kacund",
  "dueCardsViewChange-choice-all": "Kaik kävutajad",
  "dueCardsViewChange-choice-all-description": "Ozutab kaik kartad, miččid ei ole loptud da kudambil om *märaigan päivmär*, laudoilpäi, kudambiden täht kävutajale om laskend.",
  "dueCards-noResults-title": "Ei ole märaiganke kartoid",
  "dueCards-noResults-description": "Sinai ei ole nügüd' märaiganke kartoid."
};
  for (const [key, value] of Object.entries(vepsDateFilterRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Eräänt|eräpäiv|tänään|huomenna|tällä viikolla|ensi viikolla|Myöhässä|Aseta|alkamispäiv|vastaanotettu|sanundan|mänenu|Kaikki käyttäjät|Näyttää|keskeneräiset|oikeudet|kortteja|maḓuvha|o sala|o fhira/i, key);
  }
  assert.equal(vepsTranslator.t('due-days-left', { sprintf: [3] }), '3 päiväd oma jänuded');
  assert.equal(vepsTranslator.t('due-days-overdue', { sprintf: [2] }), "2 päiväd märaigan jäl'ghe");
  assert.equal(cache['ve-PP']['due-today'], cache['ve-PP']['filter-due-today']);
  assert.match(cache['ve-PP']['filter-due-this-week'], /täl nedalil$/);
  assert.match(cache['ve-PP']['filter-due-next-week'], /tulijal nedalil$/);
  assert.match(cache['ve-PP']['filter-due-tomorrow'], /homen$/);
  assert.match(cache['ve-PP']['dueCardsViewChange-choice-all-description'], /kaik kartad.*ei ole loptud.*\*märaigan päivmär\*.*laudoilpäi.*kävutajale om laskend/);
  assert.equal(cache['ve-PP']['dueCardsViewChange-title'], cache['ve-PP']['dueCardsViewChangePopup-title']);
  assert.match(cache['ve-PP']['export-card-field-dates'], /Tehtud, Sadud, Augotiž, Märaig, Lop/);
  const vepsListControlRepairs = {
  "add-card-to-bottom-of-list": "Ližada kart lugetišen lophu",
  "add-card-to-top-of-list": "Ližada kart lugetišen augotišehe",
  "always-field-on-card": "Ližada pöud kaikihe kartoihe",
  "automatically-field-on-card": "Ližada pöud uzihe kartoihe",
  "card-archived": "Nece kart om sirttud arhivaha.",
  "card-labels-title": "Vajehta kartan znamad.",
  "cardCustomFieldsPopup-title": "Vajehta kävutajan märitud pöudoid",
  "close-add-checklist-item": "Saubata kodvindlugetišen kohtan ližadusen form",
  "close-edit-checklist-item": "Saubata kodvindlugetišen kohtan vajehtusen form",
  "deleteCustomFieldPopup-title": "Heitä kävutajan märitud pöud?",
  "list-archive-pop": "Lugetiž ei nägu laudal arhivaha sirdändan jäl'ghe.",
  "r-d-move-to-bottom-gen": "Sirdä kart sen lugetišen lophu",
  "r-d-move-to-bottom-spec": "Sirdä kart lugetišen lophu",
  "r-d-move-to-top-gen": "Sirdä kart sen lugetišen augotišehe",
  "r-d-move-to-top-spec": "Sirdä kart lugetišen augotišehe",
  "r-when-a-card-is-moved": "Konz kart om sirttud toižehe lugetišehe",
  "hide-finished-checklist": "Peitä loptud kodvindlugetiž",
  "hide-list-on-minicard": "Peitä lugetiž minikartal",
  "hide-minicard-label-text": "Peitä minikartan znaman tekst",
  "hideAllChecklistItems": "Peitä kaik kodvindlugetišen kohtad",
  "hideCheckedChecklistItems": "Peitä kaik znamoitud kodvindlugetišen kohtad",
  "list-archive-cards": "Sirdä kaik kartad neciš lugetišes arhivaha",
  "list-archive-cards-pop": "Nece heitäb kaik necen lugetišen kartad laudaspäi. Miše kacta kartoid arhivas da tuoda niid tagaze laudale, paina “Menülist” > “Arhiv”.",
  "list-archive-suggest": "Sinä void möhemba endištada lugetiž arhivaspäi laudan sändoiš.",
  "list-delete-pop": "Nece heitäb kaik tegendad tegendoiden lugetišespäi. Ei sa endištada lugetiž. Ei sa pördutada.",
  "list-delete-suggest-archive": "Sinä void sirdä lugetiž arhivaha, miše heitä sidä laudaspäi da kaita tegendad.",
  "list-move-cards": "Sirdä kaik kartad neciš lugetišes",
  "list-select-cards": "Valiče kaik kartad neciš lugetišes",
  "show-field-on-card": "Ozuta nece pöud kartal",
  "showChecklistAtMinicard": "Ozuta kodvindlugetiž minikartal",
  "cards": "Kartad",
  "archive": "Sirdä arhivaha",
  "restore": "Endišta",
  "menu": "Menülist",
  "checklist-count": "Kodvindlugetišen kohtiden lugu (0/0)",
  "checklist-count-on-minicard": "Kodvindlugetišen kohtiden lugu (0/0) minikartal",
  "custom-field-stringtemplate-item-placeholder": "Paina Enter, miše ližata enamba kohtid"
};
  for (const [key, value] of Object.entries(vepsListControlRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Lisää|kenttä|korteille|Muokkaa|mukautettu|Sulje|tarkistuslist|lomakke|Poista|Siirrä|listansa|listan alkuun|listan loppuun|Kun kortti|Piilota|nimilappu|Valitse|Nähdäksesi|palauttaa|toimintasyöt|lopullista|peruuttamaan|Korttia|Palauta|Valikko|kohtoiden|kohtoid/i, key);
  }
  for (const key of ['add-card-to-top-of-list', 'r-d-move-to-top-gen', 'r-d-move-to-top-spec']) assert.match(cache['ve-PP'][key], /augotišehe$/);
  for (const key of ['add-card-to-bottom-of-list', 'r-d-move-to-bottom-gen', 'r-d-move-to-bottom-spec']) assert.match(cache['ve-PP'][key], /lophu$/);
  for (const place of ['top', 'bottom']) {
    assert.match(cache['ve-PP'][`r-d-move-to-${place}-gen`], /sen lugetišen/);
    assert.doesNotMatch(cache['ve-PP'][`r-d-move-to-${place}-spec`], /sen lugetišen/);
  }
  assert.match(cache['ve-PP']['hideCheckedChecklistItems'], /kaik znamoitud/);
  assert.doesNotMatch(cache['ve-PP']['hideAllChecklistItems'], /znamoitud/);
  assert.match(cache['ve-PP']['list-delete-pop'], /heitäb kaik tegendad.*Ei sa endištada lugetiž\. Ei sa pördutada\.$/);
  assert.match(cache['ve-PP']['list-delete-suggest-archive'], /arhivaha.*kaita tegendad/);
  assert.match(cache['ve-PP']['list-archive-suggest'], /endištada lugetiž arhivaspäi laudan sändoiš/);
  assert.match(cache['ve-PP']['list-archive-cards-pop'], /tagaze laudale.*“Menülist” > “Arhiv”/);
  assert.equal(cache['ve-PP']['archives'], 'Arhiv');
  assert.equal(cache['ve-PP']['archived-items'], cache['ve-PP']['archives']);
  assert.match(cache['ve-PP']['list-archive-cards-pop'], new RegExp(`“${cache['ve-PP'].menu}” > “${cache['ve-PP'].archives}”`));
  assert.match(cache['ve-PP']['always-field-on-card'], /kaikihe kartoihe$/);
  assert.match(cache['ve-PP']['automatically-field-on-card'], /uzihe kartoihe$/);
  const vepsMemberControlRepairs = {
  "normal": "Veronmugaine",
  "comment-only": "Vaiše sel’genzoitused",
  "read-only": "Vaiše kacund",
  "read-assigned-only": "Vaiše märitud, kacund",
  "comment-assigned-only": "Vaiše märitud, sel’genzoitused",
  "normal-assigned-only": "Vaiše märitud, veronmugaine",
  "normal-assigned-only-desc": "Vaiše sinei märitud kartad näguba. Vajehta kut veronmugaine kävutai.",
  "comment-assigned-only-desc": "Vaiše sinei märitud kartad näguba. Voib vaiše kirjutada sel’genzoitusid kartoil.",
  "read-assigned-only-desc": "Vaiše sinei märitud kartad näguba. Ei sa vajehtada.",
  "comment-only-desc": "Voib vaiše kirjutada sel’genzoitusid kartoil.",
  "read-only-desc": "Voib vaiše kacta kartoid. Ei sa vajehtada.",
  "assignee": "Märitud kävutai",
  "assignees": "Märitud kävutajad",
  "assign-member": "Märiče ühtnik",
  "members": "Ühtnikad",
  "board_assignees": "Kaik märitud kävutajad kaikiš necen laudan kartoiš",
  "card_assignees": "Kaik märitud kävutajad necen laudan nügüdläižel kartal",
  "card_members": "Kaik ühtnikad necen laudan nügüdläižel kartal",
  "card-members-title": "Ližada kartale libo heitä kartaspäi laudan ühtnikoid.",
  "remove-member-pop": "Heitä __name__ (__username__) laudaspäi __boardTitle__? Ühtnik linneb heittud kaikiš necen laudan kartoišpäi. Hän sab tedotuz.",
  "shortcut-add-self": "Ližada ičtaze nügüdläižele kartale",
  "shortcut-assign-self": "Märiče ičtaze nügüdläižele kartale",
  "shortcut-filter-my-assigned-cards": "Puhtasta minei märitud kartad",
  "multi-selection-active": "Paina valičuznellikid, miše valita laudoid",
  "multi-selection-label": "Pane znam valičusele",
  "remove-labels-multiselect": "Äjiden valičuz heitäb znamad 1-9",
  "act-uncompleteChecklist": "Kodvindlugetiž __checklist__ om märitud kut lopmatoi kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "act-createCustomField": "Tehtud kävutajan märitud pöud __customField__ laudal __board__",
  "act-deleteCustomField": "Heittud kävutajan märitud pöud __customField__ laudal __board__",
  "act-setCustomField": "Vajehtadud kävutajan märitud pöud __customField__: __customFieldValue__ kartal __card__ lugetišes __list__ ujundšoidul __swimlane__ laudal __board__",
  "activity-customfield-created": "Tehtud kävutajan märitud pöud %s",
  "activity-checklist-uncompleted": "Kodvindlugetiž %s om märitud kut lopmatoi azjal %s",
  "activity-checklist-uncompleted-card": "Kodvindlugetiž %s om märitud kut lopmatoi",
  "card-edit-custom-fields": "Vajehta kävutajan märitud pöudoid",
  "cardCustomFieldsPopup-title": "Vajehta kävutajan märitud pöudoid",
  "custom-field-delete-pop": "Ei sa pördutada. Nece heitäb necen kävutajan märitud pöudon kaikiš kartoišpäi da heitäb sen istorijan.",
  "custom-fields": "Kävutajan märitud pöudod",
  "deleteCustomFieldPopup-title": "Heitä kävutajan märitud pöud?",
  "filter-custom-fields-label": "Puhtasta kävutajan märitud pöudoiden mödhe",
  "filter-no-custom-fields": "Ei ole kävutajan märitud pöudoid",
  "activity-set-customfield": "Kävutajan märitud pöud '%s' om pandud kut '%s' azjal %s",
  "activity-unset-customfield": "Heittud kävutajan märitud pöudon '%s' znamoičend azjal %s",
  "r-w-assignee-added": "Märitud kävutai om ližatud"
};
  const memberSlots = { ...customFieldSlots, ...checklistSlots, name: 'NAME', username: 'USERNAME', boardTitle: 'BOARD' };
  for (const [key, value] of Object.entries(vepsMemberControlRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, memberSlots), value.replace(/__([A-Za-z]+)__/g, (_, name) => memberSlots[name]), key);
    assert.doesNotMatch(value, /Normaali|Vain|käsittelij|kommentointi|luku|käyttäjänä|näkyvissä|Muokkaa|kortteja|Lisää|itsesi|nykyiselle|Kaikki|korteilla|Kakki|taululla|jäseniä|Poista|poistetaan|lähetetään|ilmoitus|Valitse|napsauttamalla|nimilappu|Monivalinta|märitadud/i, key);
  }
  for (const role of ['normal', 'read', 'comment']) assert.match(cache['ve-PP'][`${role}-assigned-only-desc`], /^Vaiše sinei märitud kartad näguba\./);
  assert.match(cache['ve-PP']['read-assigned-only-desc'], /Ei sa vajehtada\.$/);
  assert.match(cache['ve-PP']['read-only-desc'], /vaiše kacta kartoid\. Ei sa vajehtada\.$/);
  assert.match(cache['ve-PP']['comment-assigned-only-desc'], /vaiše kirjutada sel’genzoitusid kartoil\.$/);
  assert.match(cache['ve-PP']['normal-assigned-only-desc'], /Vajehta kut veronmugaine kävutai\.$/);
  assert.doesNotMatch(cache['ve-PP']['normal-assigned-only-desc'], /Ei sa vajehtada/);
  assert.match(vepsTranslator.t('remove-member-pop', memberSlots), /^Heitä NAME \(USERNAME\) laudaspäi BOARD\?.*kaikiš necen laudan kartoišpäi.*Hän sab tedotuz\.$/);
  assert.notEqual(cache['ve-PP']['shortcut-add-self'], cache['ve-PP']['shortcut-assign-self']);
  assert.match(cache['ve-PP']['shortcut-add-self'], /^Ližada/);
  assert.match(cache['ve-PP']['shortcut-assign-self'], /^Märiče/);
  assert.match(cache['ve-PP']['remove-labels-multiselect'], /1-9$/);
  for (const value of Object.values(cache['ve-PP'])) assert.doesNotMatch(value, /märitadud/i);
  const vepsImportControlRepairs = {
  "admin-people-user-active": "Kävutai om aktivine – paina, miše vajehtada ei-aktivižeks",
  "admin-people-user-inactive": "Kävutai ei ole aktivine – paina, miše vajehtada aktivižeks",
  "allowNonBoardMembers": "Laske kaik sistemaha tulnuded kävutajile",
  "import-board-zip": "Ližada .zip fail, miččes oma laudoiden JSON-failad da laudoiden nimiden alahodrad tartutadud failoidenke",
  "import-members-map": "Sinun todud laudal oma erased ühtnikad. Ole hüvä, valiče ičeze kävutajad ühtnikoiden täht, kudambid tahtoid toda.",
  "import-members-map-note": "Homaičuz: ühtnikad, kudambihe ei ole valitud kävutajad, linneba märitud nügüdläižele kävutajale.",
  "import-user-select": "Valiče kävutajan, kudamb jo om, necen ühtnikan täht",
  "toggle-assignees": "Ližada kartale libo heitä kartaspäi märitud kävutajad 1-9 (Laudale ližadusen jäl'gendusen mödhe).",
  "import-board-instruction-about-errors": "Ku laudan tomižen aigan oma vigad, tomine konz-se radab völ, da laud om “Kaik laudad” -lehtpolel.",
  "import-board-instruction-csv": "Pane CSV (katkimel erigoittud znamoičendad) libo TSV (Tab-znamal erigoittud znamoičendad).",
  "import-board-instruction-trello": "Ičeze Trello-laudal mäne 'Menu', siš 'More', 'Print and Export', 'Export JSON', da kopirui sadud tekst.",
  "import-board-instruction-wekan": "Ičeze laudal mäne “Menülist”, siš “Vedä laud”, da kopirui sadud failan tekst.",
  "import-csv-placeholder": "Pane tänna oiged CSV/TSV tedod",
  "import-json-placeholder": "Pane tänna oiged JSON tedod",
  "import-show-user-mapping": "Tarkišta ühtnikoiden da kävutajiden vastatesid",
  "invite-people-error": "Viga registriruindan kucundan oigendamižen aigan",
  "invite-people-success": "Registriruindan kucund om oigetud.",
  "just-invited": "Sinei om ani nügüd' antud kucund necile laudale",
  "not-accepted-yet": "Kucund ei ole völ ottud",
  "shortcut-autocomplete-emoji": "Täuta emoji avtomatižesti",
  "shortcut-autocomplete-members": "Täuta ühtnikoiden nimed avtomatižesti",
  "show-board_members-avatar": "Ozuta laudan ühtnikoiden avatarad",
  "export-board": "Vedä laud",
  "all-boards": "Kaik laudad",
  "boardMenuPopup-title": "Laudan sändod"
};
  for (const [key, value] of Object.entries(vepsImportControlRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Käyttäjä|napsauta|aktiivinen|kirjautuneet|Lisää|tiedosto jossa|alihakemistot|Tuomallasi|muutamia|vastaavat käyttäjäsi|Valitsemattomille|nykyinen käyttäjä|olemassaoleva|käsittelij|näkyvyyttä|Taululle lisäys|Jos virheitä|tuotaessa|Liitä|erotellut|erotetut|Mene|Taulullasi|ladatusta|kelvollinen|Tarkasta|Virhe lähetettäessä|onnistuneesti|Sinut|kutsuttu|hyväksytty|Automaattinen|profiilikuvat|Vie taulu|Kaikki taulut|Tauluasetukset/i, key);
  }
  assert.match(cache['ve-PP']['import-members-map-note'], /ei ole valitud kävutajad.*linneba märitud nügüdläižele kävutajale/);
  assert.match(cache['ve-PP']['import-user-select'], /kävutajan, kudamb jo om.*ühtnikan täht/);
  assert.match(cache['ve-PP']['toggle-assignees'], /Ližada kartale libo heitä kartaspäi.*1-9.*Laudale ližadusen jäl'gendusen mödhe/);
  assert.doesNotMatch(cache['ve-PP']['toggle-assignees'], /Ozuta|Peitä|nägu/);
  assert.match(cache['ve-PP']['import-board-zip'], /\.zip.*JSON-failad.*laudoiden nimiden alahodrad.*tartutadud failoidenke/);
  assert.match(cache['ve-PP']['import-board-instruction-csv'], /CSV.*katkimel.*TSV.*Tab-znamal/);
  assert.match(cache['ve-PP']['import-board-instruction-about-errors'], /Ku.*vigad.*konz-se.*radab völ/);
  assert.match(cache['ve-PP']['import-board-instruction-about-errors'], new RegExp(`“${cache['ve-PP']['all-boards']}”`));
  assert.match(cache['ve-PP']['import-board-instruction-wekan'], new RegExp(`“${cache['ve-PP'].menu}”, siš “${cache['ve-PP']['export-board']}”`));
  for (const label of ['Menu', 'More', 'Print and Export', 'Export JSON']) assert.ok(cache['ve-PP']['import-board-instruction-trello'].includes(`'${label}'`));
  assert.match(cache['ve-PP']['invite-people-error'], /^Viga/);
  assert.match(cache['ve-PP']['invite-people-success'], /om oigetud/);
  assert.match(cache['ve-PP']['not-accepted-yet'], /ei ole völ ottud$/);
  assert.match(cache['ve-PP']['just-invited'], /ani nügüd'/);
  assert.match(cache['ve-PP']['admin-people-user-active'], /om aktivine.*ei-aktivižeks$/);
  assert.match(cache['ve-PP']['admin-people-user-inactive'], /ei ole aktivine.*vajehtada aktivižeks$/);
  assert.match(cache['ve-PP']['allowNonBoardMembers'], /kaik sistemaha tulnuded kävutajile$/);
  assert.equal(vepsTranslator.t('activity'), 'Tegendad');
  assert.equal(vepsTranslator.t('act-activity-notify'), 'Tegendoiden tedotuz');
  for (const key of ['activity', 'act-activity-notify']) {
    assert.doesNotMatch(cache['ve-PP'][key], /Toiminta|ilmoitus/i, key);
  }
  for (const value of Object.values(cache['ve-PP'])) assert.doesNotMatch(value, /ližadud/i);
  const vepsDisplayRepairs = {
  "badge-attachment-on-minicard": "Tartutadud failoiden lugumär minikartal",
  "newLineNewItem": "Üks’ tekstin rivi = üks’ kodvindlugetišen koht",
  "now-activities-of-all-boards-are-hidden": "Nügüd’ kaik tegendad kaikil laudoil oma peittud",
  "open-many-cards-at-once": "Avaida äi kartoid ühten aigan",
  "set-swimlane-height-value": "Ujundšoidun korktuz’ (pikselid)",
  "show-at-all-boards-page": "Ozuta “Kaik laudad” -lehtpolel",
  "show-card-counter-per-list": "Ozuta kartoiden lugumär kaikes lugetišes",
  "show-cards-minimum-count": "Ozuta kartoiden lugumär, ku lugetišes om enamba ku",
  "swimlane-height-error-message": "Ujundšoidun korktuz’ pidab olda pozitivine täuz’ lugu"
};
  for (const [key, value] of Object.entries(vepsDisplayRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Liitteiden|määrä|Yksi|tekstiä|tarkistuslistan|Nyt kaikki|toimet|piilotettu|Avaa monta|kerralla|Uimaradan|korkeus|Näytä|Kaikki taulut|korttien|lukumäärä|sisältää|enemmän kuin|täytyy|positiivinen|kokonaisluku/i, key);
  }
  assert.match(cache['ve-PP']['show-cards-minimum-count'], /ku lugetišes om enamba ku$/);
  assert.match(cache['ve-PP']['swimlane-height-error-message'], /pozitivine täuz’ lugu$/);
  assert.match(cache['ve-PP']['set-swimlane-height-value'], /\(pikselid\)$/);
  assert.match(cache['ve-PP']['newLineNewItem'], /^Üks’.*rivi = üks’.*koht$/);
  assert.match(cache['ve-PP']['now-activities-of-all-boards-are-hidden'], /kaik tegendad kaikil laudoil oma peittud$/);
  assert.ok(cache['ve-PP']['show-at-all-boards-page'].includes(`“${cache['ve-PP']['all-boards']}”`));
  assert.match(cache['ve-PP']['open-many-cards-at-once'], /äi kartoid ühten aigan$/);
  const vepsSelectionRepairs = {
  "above-selected-card": "Valitud kartan päl",
  "below-selected-card": "Valitud kartan al",
  "above-selected-swimlane": "Valitud ujundšoidun päl",
  "below-selected-swimlane": "Valitud ujundšoidun al",
  "filter-cards": "Puhtasta kartoid libo lugetižid",
  "filter-dates-label": "Puhtasta päivmäran mödhe",
  "list-filter-label": "Puhtasta lugetiž nimen mödhe",
  "filter-labels-label": "Puhtasta znaman mödhe",
  "filter-no-label": "Ei ole znamad",
  "filter-member-label": "Puhtasta ühtnikan mödhe",
  "filter-no-member": "Ei ole ühtnikad",
  "filter-assignee-label": "Puhtasta märitud kävutajan mödhe",
  "filter-creator-label": "Puhtasta tegijan mödhe",
  "filter-no-assignee": "Ei ole märitud kävutajad",
  "filter-label-excluded": "Nece znam om heittud",
  "showLabel-field-on-card": "Ozuta pöudon nimi minikartal",
  "shortcut-toggle-filterbar": "Ozuta libo peitä puhtastusen čuramenülist",
  "shortcut-toggle-searchbar": "Ozuta libo peitä ecindan čuramenülist",
  "shortcut-toggle-sidebar": "Ozuta libo peitä laudan čuramenülist",
  "search-cards": "Eci necen laudan kartoiden/lugetižiden nimid, kirjutusid da kävutajan märitud pöudoid",
  "label-names": "Znamoiden nimed",
  "add-label": "Ližada znam",
  "remove-label": "Heitä znam"
};
  for (const [key, value] of Object.entries(vepsSelectionRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Valitun|kortin|uimaradan|yläpuolelle|alapuolelle|Suodata|kortit tai listat|päivämäärä|otsikko|nimilappu|jäseniä|käsittelij|Luoja|Näytä kentän|Muokkaa|sivupalkin|näkyvyyttä|Etsi kortin|kuvauksista|mukautetuista|tällä taululla|Lisää|Poista|U bviswa/i, key);
  }
  assert.equal(cache['ve-PP']['above-selected-card'], 'Valitud kartan päl');
  assert.equal(cache['ve-PP']['below-selected-card'], 'Valitud kartan al');
  assert.equal(cache['ve-PP']['above-selected-swimlane'], 'Valitud ujundšoidun päl');
  assert.equal(cache['ve-PP']['below-selected-swimlane'], 'Valitud ujundšoidun al');
  assert.match(cache['ve-PP']['filter-cards'], /kartoid libo lugetižid$/);
  for (const key of ['shortcut-toggle-filterbar', 'shortcut-toggle-searchbar', 'shortcut-toggle-sidebar']) {
    assert.match(cache['ve-PP'][key], /^Ozuta libo peitä /);
  }
  assert.match(cache['ve-PP']['shortcut-toggle-filterbar'], /puhtastusen/);
  assert.match(cache['ve-PP']['shortcut-toggle-searchbar'], /ecindan/);
  assert.match(cache['ve-PP']['shortcut-toggle-sidebar'], /laudan/);
  assert.match(cache['ve-PP']['showLabel-field-on-card'], /pöudon nimi minikartal$/);
  assert.doesNotMatch(cache['ve-PP']['showLabel-field-on-card'], /Ližada/);
  assert.match(cache['ve-PP']['filter-assignee-label'], /märitud kävutajan/);
  assert.doesNotMatch(cache['ve-PP']['filter-member-label'], /märitud/);
  assert.match(cache['ve-PP']['filter-creator-label'], /tegijan/);
  assert.match(cache['ve-PP']['search-cards'], /necen laudan.*kartoiden\/lugetižiden nimid.*kirjutusid.*kävutajan märitud pöudoid$/);
  assert.equal(cache['ve-PP'].labels, 'Znamad');
  assert.equal(cache['ve-PP'].filter, 'Puhtastim');
  assert.equal(cache['ve-PP'].search, 'Eci');
  assert.equal(cache['ve-PP'].title, 'Nimi');
  const vepsArchiveRuleRepairs = {
  "board-delete-notice": "Heitämine om igäks. Kaik necen laudan lugetišed, kartad da tegendad linneba heittud.",
  "card-archive-pop": "Kart ei nägu neciš lugetišes arhivaha sirdändan jäl'ghe.",
  "swimlane-archive-pop": "Ujundšoid ei nägu laudal arhivaha sirdändan jäl'ghe.",
  "warn-list-archived": "Varutuz: nece kart om arhivas olijas lugetišes",
  "filter-on-desc": "Sinä puhtastad kartoid necil laudal. Paina tänna, miše vajehtada puhtastim.",
  "support-info-not-added-yet": "Tugen tedod ei ole völ ližatud",
  "user-can-not-export-card-to-excel": "Kävutai ei voi vedäda kartad Excel-failaha",
  "user-can-not-export-card-to-pdf": "Kävutai ei voi vedäda kartad PDF-failaha",
  "user-can-not-export-excel": "Kävutai ei voi vedäda Excel-failaha",
  "r-remove-all": "Heitä kaik ühtnikad kartaspäi",
  "r-remove-all-labels": "Heitä kaik znamad kartaspäi",
  "r-unchecked": "Heittud znam",
  "r-checked": "Znamoitud",
  "r-check-all": "Znamoita kaik",
  "r-uncheck-all": "Heitä znam kaikispäi",
  "r-check": "Znamoita",
  "r-uncheck": "Heitä znam",
  "r-d-check-all": "Znamoita kaik lugetišen kohtid",
  "r-d-uncheck-all": "Heitä znam kaikispäi lugetišen kohtispäi",
  "r-d-check-one": "Znamoita koht",
  "r-d-uncheck-one": "Heitä znam kohtaspäi",
  "uncheckAllItems": "Heitä znam kaikispäi kohtispäi",
  "r-checklist": "kodvindlugetiž",
  "r-of-checklist": "kodvindlugetišespäi",
  "r-d-check-of-list": "kodvindlugetišespäi",
  "r-d-add-checklist": "Ližada kodvindlugetiž",
  "r-d-remove-checklist": "Heitä kodvindlugetiž",
  "r-add-checklist": "Ližada kodvindlugetiž",
  "r-items-check": "kohtid kodvindlugetišes",
  "toggle-labels": "Ližada kartale libo heitä kartaspäi znamad 1-9. Äi valičuz ližab znamad 1-9",
  "multi-selection": "Äi valičuz",
  "multi-selection-member": "Märiče ühtnik valičusele",
  "multi-selection-on": "Äi valičuz om aktivine",
  "multi-selection-off": "Saubata äi valičuz"
};
  for (const [key, value] of Object.entries(vepsArchiveRuleRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Poistaminen|lopullista|Menetät|listat|kortit|toimet|Kortti ei|enää näy|arkistoinnin|Uimarata|varoitus|tämä kortti|olevassa listassa|Suodatat|Klikkaa|muokataksesi|Tuki tietoja|lisätty|Käyttäjä|ei voi viedä|korttia|Poista|jäsenet|nimilappu|Poistettu ruksi|Ruksattu|Ruksaa|tarkistuslista|kaikista listan|kohdasta|Bvisa luswayo|Lisää|näkyvyyttä|Monivalinta/i, key);
  }
  assert.match(cache['ve-PP']['board-delete-notice'], /igäks.*Kaik.*lugetišed, kartad da tegendad.*heittud/);
  assert.match(cache['ve-PP']['card-archive-pop'], /ei nägu neciš lugetišes.*arhivaha/);
  assert.match(cache['ve-PP']['swimlane-archive-pop'], /ei nägu laudal.*arhivaha/);
  assert.match(cache['ve-PP']['warn-list-archived'], /kart.*arhivas.*lugetišes/);
  for (const key of ['user-can-not-export-card-to-excel', 'user-can-not-export-card-to-pdf', 'user-can-not-export-excel']) assert.match(cache['ve-PP'][key], /ei voi vedäda/);
  assert.match(cache['ve-PP']['user-can-not-export-card-to-pdf'], /kartad PDF-failaha$/);
  assert.match(cache['ve-PP']['user-can-not-export-card-to-excel'], /kartad Excel-failaha$/);
  assert.match(cache['ve-PP']['toggle-labels'], /^Ližada kartale libo heitä kartaspäi znamad 1-9\. Äi valičuz ližab znamad 1-9$/);
  assert.doesNotMatch(cache['ve-PP']['toggle-labels'], /Ozuta|Peitä|nägu/);
  assert.match(cache['ve-PP']['r-d-uncheck-all'], /kaikispäi lugetišen kohtispäi$/);
  assert.match(cache['ve-PP']['r-d-uncheck-one'], /znam kohtaspäi$/);
  assert.doesNotMatch(cache['ve-PP']['r-d-uncheck-one'], /kaik/);
  assert.match(cache['ve-PP']['r-remove-all'], /kaik ühtnikad kartaspäi$/);
  assert.match(cache['ve-PP']['r-remove-all-labels'], /kaik znamad kartaspäi$/);
  assert.ok(cache['ve-PP']['toggle-labels'].includes(`${cache['ve-PP']['multi-selection']} ližab znamad 1-9`));
  assert.match(cache['ve-PP']['multi-selection-on'], /om aktivine$/);
  assert.match(cache['ve-PP']['multi-selection-off'], /^Saubata/);
  const vepsRuleFragmentRepairs = {
  "r-rule": "Sänd",
  "r-add-action": "Ližada tegend",
  "r-add-rule": "Ližada sänd",
  "r-delete-rule": "Heitä sänd",
  "r-action": "Tegend",
  "r-when-a-card": "Konz kart",
  "r-is": "om",
  "r-is-moved": "om sirttud",
  "r-added-to": "Ližatud sijaha",
  "r-removed-from": "Heittud sijašpäi",
  "r-the-board": "laud",
  "r-list": "lugetiž",
  "r-moved-to": "Sirttud sijaha",
  "r-moved-from": "Sirttud sijašpäi",
  "r-archived": "Sirttud arhivaha",
  "r-unarchived": "Endištadud arhivaspäi",
  "r-a-card": "kart",
  "r-when-a-label-is": "Konz znam om",
  "r-when-the-label": "Konz znam",
  "r-list-name": "lugetišen nimi",
  "r-when-a-member": "Konz ühtnik om",
  "r-when-the-member": "Konz ühtnik",
  "r-when-a-assignee": "Konz märitud kävutai om",
  "r-when-the-assignee": "Konz märitud kävutai",
  "r-when-a-attach": "Konz tartutadud fail",
  "r-when-a-checklist": "Konz kodvindlugetiž om",
  "r-when-the-checklist": "Konz kodvindlugetiž",
  "r-completed": "Loptud",
  "r-made-incomplete": "Tehtud kut lopmatoi",
  "r-when-a-item": "Konz kodvindlugetišen koht om",
  "r-when-the-item": "Konz kodvindlugetišen koht",
  "r-move-card-to": "Sirdä kart sijaha",
  "r-its-list": "sen lugetiž",
  "r-archive": "Sirdä arhivaha",
  "r-unarchive": "Endišta arhivaspäi",
  "r-card": "kart",
  "r-add": "Ližada",
  "r-remove": "Heitä",
  "r-label": "znam",
  "r-member": "ühtnik",
  "r-item": "koht",
  "r-d-archive": "Sirdä kart arhivaha",
  "r-d-unarchive": "Endišta kart arhivaspäi",
  "r-d-add-label": "Ližada znam",
  "r-d-remove-label": "Heitä znam",
  "r-create-card": "Tege uz’ kart",
  "r-in-list": "lugetišes",
  "r-d-add-member": "Ližada ühtnik",
  "r-d-remove-member": "Heitä ühtnik",
  "r-d-remove-all-member": "Heitä kaik ühtnikad",
  "r-with-items": "kohtidenke",
  "r-items-list": "koht1,koht2,koht3",
  "r-add-swimlane": "Ližada ujundšoid",
  "r-checklist-note": "Homaičuz: kodvindlugetišen kohtid pidab kirjutada katkimel erigoittud znamoičendoine."
};
  for (const [key, value] of Object.entries(vepsRuleFragmentRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Sääntö|Lisää|Poista|toimi|Kun kortti|on siirretty|Lisätty kohteeseen|Poistettu kohteesta|Siirretty|Palautettu|kortti|nimilappu|listan nimi|Kun jäsen|Kun käyttäjä|Käsittelijä|liitetiedosto|tarkistuslista|Valmistunut|Tehty ei|Siirrä|sen lista|Palauta|Luo uusi|kohteiden kanssa|kohde1|pilkulla eroteltuina/i, key);
  }
  const joinRule = (...keys) => keys.map(key => vepsTranslator.t(key)).join(' ');
  assert.equal(joinRule('r-when-a-member', 'r-added-to', 'r-a-card'), 'Konz ühtnik om Ližatud sijaha kart');
  assert.equal(joinRule('r-when-a-assignee', 'r-removed-from', 'r-a-card'), 'Konz märitud kävutai om Heittud sijašpäi kart');
  assert.equal(joinRule('r-when-a-item', 'r-checked'), 'Konz kodvindlugetišen koht om Znamoitud');
  assert.equal(joinRule('r-when-a-checklist', 'r-completed'), 'Konz kodvindlugetiž om Loptud');
  assert.equal(joinRule('r-when-a-checklist', 'r-made-incomplete'), 'Konz kodvindlugetiž om Tehtud kut lopmatoi');
  assert.match(cache['ve-PP']['r-moved-to'], /sijaha$/);
  assert.match(cache['ve-PP']['r-moved-from'], /sijašpäi$/);
  assert.match(cache['ve-PP']['r-d-archive'], /arhivaha$/);
  assert.match(cache['ve-PP']['r-d-unarchive'], /arhivaspäi$/);
  assert.doesNotMatch(cache['ve-PP']['r-completed'], /lopmatoi/);
  assert.match(cache['ve-PP']['r-d-remove-all-member'], /kaik ühtnikad$/);
  assert.equal(cache['ve-PP']['r-items-list'].split(',').length, 3);
  assert.equal(cache['ve-PP']['r-items-list'], 'koht1,koht2,koht3');
  assert.match(cache['ve-PP']['r-checklist-note'], /katkimel erigoittud/);
  const vepsAccountMailRepairs = {
  "email-enrollAccount-text": "Tervhen __user__,\n\nMiše zavodita kävutada holitest, paina alemba anttud tarkendust.\n\n__url__\n\nSpasib.",
  "email-invite-text": "Tervhen __user__,\n\n__inviter__ kucub sindai ühteta laudale \"__board__\" ühthižtön täht.\n\nOle hüvä, paina alemba anttud tarkendust:\n\n__url__\n\nSpasib.",
  "push-invite-text": "Tervhen __user__,\n\n__inviter__ kucub sindai ühteta laudale \"__board__\" ühthižtön täht.\n\nOle hüvä, paina alemba anttud tarkendust:\n\n__url__\n\nSpasib.",
  "email-invite-register-text": "Tervhen __user__,\n\n__inviter__ kucub sindai kanban-laudale ühthižtön täht.\n\nOle hüvä, paina alemba anttud tarkendust:\n__url__\n\nSinun kucundan kod om: __icode__\n\nSpasib.",
  "email-resetPassword-text": "Tervhen __user__,\n\nPeitsanan heitändan täht paina alemba anttud tarkendust.\n\n__url__\n\nSpasib.",
  "email-verifyEmail-text": "Tervhen __user__,\n\nMiše vahvištoitta sinun akkauntan email-počtan adresad, paina alemba anttud tarkendust.\n\n__url__\n\nSpasib.",
  "email-templates-activity-body": "Tegendoiden tedotusen email-kirjeižen tekst",
  "error-email-taken": "Email-počtan adres om jo kävutuses",
  "account-creation-failed": "Akkauntan tegemižen viga",
  "account-created": "Akkaunt om tehtud! Nügüd’ sinä void tulda sistemaha.",
  "accounts": "Akkauntad",
  "create-account": "Tege akkaunt",
  "already-account": "Sinul om jo akkaunt? Tule sistemaha",
  "accounts-allowUserDelete": "Laske kävutajile heitta ičeze akkauntad",
  "delete-all-notifications-confirm": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta kaik tedotuzed? Necidä tegendad ei sa pördutada."
};
  const mailSlots = { user: 'USER', inviter: 'INVITER', board: 'BOARD', url: 'https://on-premise.example/invite?token=TOKEN', icode: 'CODE' };
  for (const [key, value] of Object.entries(vepsAccountMailRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    const rendered = vepsTranslator.t(key, mailSlots);
    assert.equal(rendered, value.replace(/__([A-Za-z]+)__/g, (_, name) => mailSlots[name]), key);
    assert.doesNotMatch(rendered, /__user__|__url__|__icode__|__board__|__inviter__/, key);
    assert.doesNotMatch(value, /Hei |Hyvä |Klikkaa|aloittaaksesi|palvelun käytön|Kiitos|kutsuu sinut|liittymään taululle|yhteistyötä varten|seuraa alla|Kutsukoodisi|Nollataksesi|salasanasi|vahvistaaksesi|sähköpostiosoite|Tilin luominen|epäonnistui|Onko sinulla|Kirjaudu|Salli käyttäjien|Oletko varma|ilmoitukset|toimintoa ei voi perua|luodud|voit kirjutadas/i, key);
  }
  assert.match(vepsTranslator.t('email-invite-text', mailSlots), /INVITER.*laudale "BOARD".*ühthižtön/);
  assert.match(vepsTranslator.t('email-invite-register-text', mailSlots), /kucundan kod om: CODE/);
  assert.match(vepsTranslator.t('email-resetPassword-text', mailSlots), /Peitsanan heitändan täht/);
  assert.doesNotMatch(cache['ve-PP']['email-resetPassword-text'], /vahvištoitta/);
  assert.match(vepsTranslator.t('email-verifyEmail-text', mailSlots), /vahvištoitta.*email-počtan adresad/);
  for (const key of ['email-enrollAccount-text', 'email-invite-text', 'push-invite-text', 'email-invite-register-text', 'email-resetPassword-text', 'email-verifyEmail-text']) {
    assert.ok(vepsTranslator.t(key, mailSlots).includes(mailSlots.url), key);
    assert.match(cache['ve-PP'][key], /Spasib\.$/);
  }
  assert.match(cache['ve-PP']['delete-all-notifications-confirm'], /kaik tedotuzed.*ei sa pördutada/);
  assert.match(cache['ve-PP']['accounts-allowUserDelete'], /ičeze akkauntad$/);
  assert.match(cache['ve-PP']['account-created'], /tehtud!.*tulda sistemaha/);
  assert.match(cache['ve-PP']['error-email-taken'], /jo kävutuses$/);
  const vepsLoginProtectionRepairs = {
  "accounts-lockout-settings": "Kaičusen sändod peitsanavariantoiden kodvindan tacmusišpäi",
  "accounts-lockout-info": "Neced sändod ohjandaba sistemaha tulendan rohkaidusiden kaičust peitsanavariantoiden kodvindan tacmusišpäi.",
  "accounts-lockout-settings-updated": "Kaičusen sändod peitsanavariantoiden kodvindan tacmusišpäi oma udištadud",
  "accounts-lockout-failures-before": "Rohkaidused vigoidenke edel saubatust",
  "accounts-lockout-failure-window": "Vigoiden lugendan aig (sekundad)",
  "accounts-lockout-failed-attempts": "Rohkaidused vigoidenke",
  "accounts-lockout-remaining-time": "Jänu aig",
  "accounts-lockout-locked-users-info": "Kävutajad, kudambad oma nügüd’ saubatud, sikš miše oma olnuded lujas äi vigoidenke sistemaha tulendan rohkaidusid",
  "account-locked": "Akkauntal om keskaigaine saubatuz, sikš miše oma olnuded lujas äi vigoidenke sistemaha tulendan rohkaidusid. Ole hüvä, ladi möst möhemba.",
  "accounts-lockout-status": "Olo",
  "admin-people-filter-show": "Ozuta:",
  "admin-people-filter-all": "Kaik kävutajad",
  "admin-people-filter-locked": "Vaiše saubatud kävutajad",
  "admin-people-active-status": "Aktivine olo"
};
  for (const [key, value] of Object.entries(vepsLoginProtectionRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Raaka voima|suojausasetukset|Nämä asetukset|kirjautumisyritykset|hyökkäyksiltä|Epäonnistumiset|ennen lukitusta|Virheikkuna|sekuntia|Epäonnistuneet yritykset|Jäljellä oleva|Käyttäjät jotka|lukittuina ulos|epäonnistuneen|Tili on tilapäisesti|Yritä myöhemmin|Tilanne|Näytä|Kaikki käyttäjät|Vain lukitut|Aktiivisuus tila/i, key);
  }
  for (const key of ['accounts-lockout-settings', 'accounts-lockout-info', 'accounts-lockout-settings-updated']) assert.match(cache['ve-PP'][key], /peitsanavariantoiden kodvindan tacmusišpäi/);
  assert.match(cache['ve-PP']['accounts-lockout-settings-updated'], /oma udištadud$/);
  assert.match(cache['ve-PP']['account-locked'], /keskaigaine saubatuz.*lujas äi vigoidenke.*tulendan rohkaidusid.*ladi möst möhemba/);
  assert.match(cache['ve-PP']['accounts-lockout-locked-users-info'], /nügüd’ saubatud.*lujas äi vigoidenke.*tulendan rohkaidusid/);
  assert.match(cache['ve-PP']['accounts-lockout-failure-window'], /lugendan aig \(sekundad\)$/);
  assert.match(cache['ve-PP']['accounts-lockout-failures-before'], /edel saubatust$/);
  assert.match(cache['ve-PP']['admin-people-filter-locked'], /^Vaiše saubatud/);
  assert.match(cache['ve-PP']['admin-people-filter-all'], /^Kaik kävutajad$/);
  assert.doesNotMatch(cache['ve-PP']['admin-people-filter-all'], /Vaiše|saubatud/);
  const vepsVotingTranslationRepairs = {
  "add-cover": "Ližada koren kuva minikartale",
  "remove-cover": "Heitä koren kuva minikartaspäi",
  "cover-attachment-on-minicard": "Koren kuva minikartal",
  "cover-image": "Koren kuva",
  "oidc-button-text": "Vajehta OIDC sistemaha tulendan painimen tekst",
  "editTranslationPopup-title": "Vajehta kävutajan märitud kändandan simvolrivi",
  "newTranslationPopup-title": "Uz’ kävutajan märitud kändandan simvolrivi",
  "settingsTranslationPopup-title": "Heitä nece kävutajan märitud kändandan simvolrivi?",
  "delete-translation-confirm-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen kävutajan märitud kändandan simvolrivin? Necidä ei sa pördutada.",
  "translation-number": "Kävutajan märitud kändandan simvolrivoiden lugumär om:",
  "cardStartVotingPopup-title": "Zavodi änestamine",
  "card-edit-voting": "Vajehta änestamine",
  "editVoteEndDatePopup-title": "Vajehta änestamižen lopun päivmär",
  "vote-question": "Änestamižen küzund",
  "vote-public": "Ozuta, ken änesti da midä",
  "deleteVotePopup-title": "Heitä änestamine?",
  "vote-delete-pop": "Heitämine om igäks. Kaik necen änestamižen tegendad linneba heittud.",
  "cardStartPlanningPokerPopup-title": "Zavodi planan poker",
  "card-edit-planning-poker": "Vajehta planan poker",
  "editPokerEndDatePopup-title": "Vajehta planan pokeran änestamižen lopun päivmär",
  "poker-question": "Planan poker",
  "poker-finish": "Lopta",
  "poker-result-votes": "Äned",
  "poker-result-who": "Ken",
  "poker-replay": "Tošta",
  "deletePokerPopup-title": "Heitä planan poker?",
  "poker-delete-pop": "Heitämine om igäks. Kaik necen planan pokeran tegendad linneba heittud."
};
  for (const [key, value] of Object.entries(vepsVotingTranslationRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Lisää|Poista|kansikuva|Kanzikuva|Muokkaa|mukautettu|käännös|Haluatko varmasti|peruuttaa|Mukautettujen|Aloita|äänestys|äänestyksen|Näytä kuka|äänesti mitäkin|Poistaminen|lopullista|Menetät|suunnittelupoker|Muuta|loppumispäiv|Lopeta|Äänet|Kuka|Toista|kirjautumispainikkeen/i, key);
  }
  assert.match(cache['ve-PP']['add-cover'], /minikartale$/);
  assert.match(cache['ve-PP']['remove-cover'], /minikartaspäi$/);
  assert.match(cache['ve-PP']['oidc-button-text'], /OIDC.*tulendan painimen tekst$/);
  assert.match(cache['ve-PP']['delete-translation-confirm-popup'], /kändandan simvolrivin.*ei sa pördutada/);
  assert.match(cache['ve-PP']['translation-number'], /simvolrivoiden lugumär om:$/);
  assert.match(cache['ve-PP']['editVoteEndDatePopup-title'], /änestamižen lopun päivmär$/);
  assert.match(cache['ve-PP']['editPokerEndDatePopup-title'], /pokeran änestamižen lopun päivmär$/);
  assert.match(cache['ve-PP']['vote-public'], /ken änesti da midä$/);
  assert.match(cache['ve-PP']['vote-delete-pop'], /igäks.*Kaik.*änestamižen tegendad.*heittud/);
  assert.match(cache['ve-PP']['poker-delete-pop'], /igäks.*Kaik.*pokeran tegendad.*heittud/);
  assert.notEqual(cache['ve-PP']['vote-delete-pop'], cache['ve-PP']['poker-delete-pop']);
  for (const key of ['poker-one', 'poker-two', 'poker-three', 'poker-five', 'poker-eight', 'poker-thirteen', 'poker-twenty', 'poker-forty', 'poker-oneHundred', 'poker-unsure']) assert.equal(cache['ve-PP'][key], english[key], key);
  const vepsWindowTemplateRepairs = {
  "open-many-cards-at-once-description": "Jäta kaikuččen kartan, mittušt sinä painad, avoimeks ičeze iknas. Ku nece ei ole aktivine, kartan painand sauptab aigemba avaitud kartan.",
  "admin-desc": "Voib kacta da vajehtada kartoid, heitta ühtnikoid da vajehtada laudan sändoid. Voib kacta tegendoid.",
  "app-is-offline": "Tedod tuluba, ole hüvä, varasta. Lehtpolen udištamine sündutab tedoiden kadotusen. Ku tedod ei tule, kodvi, miše server völ radab.",
  "copyManyCardsPopup-title": "Kopirui vilitez äjile kartoile",
  "allboards.templates": "Vilitesed",
  "add-template": "Ližada vilitez",
  "template": "Vilitez",
  "templates": "Vilitesed",
  "template-container": "Vilitez-konteiner",
  "add-template-container": "Ližada vilitez-konteiner",
  "save-card-as-template": "Kaiče kut vilitez",
  "card-templates-swimlane": "Kartoiden vilitesed",
  "list-templates-swimlane": "Lugetižiden vilitesed",
  "board-templates-swimlane": "Laudoiden vilitesed",
  "server": "Server"
};
  for (const [key, value] of Object.entries(vepsWindowTemplateRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Jokainen klikkaamasi|kortti jää|ikkunaansa|Kun tämä|klikkaaminen sulkee|aiemmin avatun|Voi nähdä|muokata kortteja|poistaa jäseniä|muuttaa taulun|Ladataan|Sivun uudelleenlataus|tietojen menettämisen|lataaminen ei toimi|palvelin ei ole|Kopioi malli|monelle kortille|Mallit|Malli|Lisää malli|Mallikontti|Bulukanya|Korttimallit|Listamallit|Taulumallit|Palvelin/i, key);
  }
  assert.match(cache['ve-PP']['open-many-cards-at-once-description'], /kaikuččen kartan.*avoimeks ičeze iknas/);
  assert.match(cache['ve-PP']['open-many-cards-at-once-description'], /Ku nece ei ole aktivine.*sauptab aigemba avaitud kartan/);
  assert.match(cache['ve-PP']['admin-desc'], /kacta da vajehtada kartoid.*heitta ühtnikoid.*vajehtada laudan sändoid.*kacta tegendoid/);
  assert.match(cache['ve-PP']['app-is-offline'], /varasta.*udištamine sündutab tedoiden kadotusen.*Ku tedod ei tule.*server völ radab/);
  assert.match(cache['ve-PP']['copyManyCardsPopup-title'], /vilitez äjile kartoile$/);
  assert.equal(cache['ve-PP']['allboards.templates'], cache['ve-PP'].templates);
  assert.match(cache['ve-PP']['save-card-as-template'], /^Kaiče/);
  assert.doesNotMatch(cache['ve-PP']['save-card-as-template'], /^Ližada/);
  assert.match(cache['ve-PP']['card-templates-swimlane'], /^Kartoiden/);
  assert.match(cache['ve-PP']['list-templates-swimlane'], /^Lugetižiden/);
  assert.match(cache['ve-PP']['board-templates-swimlane'], /^Laudoiden/);
  const vepsOrganizationRepairs = {
  "autoAddUsersWithDomainName": "Ližada kävutajid avtomatižesti domenan nimen mödhe",
  "delete-org-warning-message": "Ei sa heitta necidä sebrad: hot’ üks’ kävutai om sen ühtnik.",
  "delete-team-warning-message": "Ei sa heitta necidä joukud: hot’ üks’ kävutai om sen ühtnik.",
  "add-organizations-label": "Ližatud sebrad oma ozutadud alemba:",
  "add-teams-label": "Ližatud joukud oma ozutadud alemba:",
  "delete-org-confirm-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necidä sebrad? Necidä ei sa pördutada.",
  "delete-team-confirm-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necidä joukud? Necidä ei sa pördutada.",
  "error-orgname-taken": "Necen sebran nimi om jo kävutuses",
  "error-teamname-taken": "Necen joukun nimi om jo kävutuses",
  "remove-organization-from-board": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen sebran necile laudale panendad?",
  "remove-team-from-table": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen joukun necile laudale panendad?",
  "globalSearch-instructions-operator-org": "`__operator_org__:<display name|short name>` - kartad laudal, kudamb om märitud sebrale *<name>*",
  "globalSearch-instructions-operator-team": "`__operator_team__:<display name|short name>` - kartad laudal, kudamb om märitud joukule *<name>*",
  "team-number": "Joukuiden lugumär om: ",
  "newOrgPopup-title": "Uz’ sebr",
  "newTeamPopup-title": "Uz’ jouk",
  "add-organizations": "Ližada sebroid",
  "add-teams": "Ližada joukuid",
  "team": "Jouk",
  "teams": "Joukud",
  "admin-people-filter-team": "Jouk:",
  "admin-people-filter-all-teams": "Kaik joukud",
  "admin": "Administrator"
};
  const organizationSlots = { operator_org: 'org', operator_team: 'team' };
  for (const [key, value] of Object.entries(vepsOrganizationRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, organizationSlots), value.replace(/__([A-Za-z_]+)__/g, (_, name) => organizationSlots[name]), key);
    assert.doesNotMatch(value, /Lisää automaattisesti|verkkotunnuksen|Ei voi poistaa|organisaatio|tiimi|käyttäjä kuuluu|Lisätyt|tässä alla|Haluatko varmasti|peruuttaa|on jo käytössä|kortit jotka|kuuluvat taululle|valittu tiimille|määrä on|Uusi organisaatio|Uusi tiimi|Tiimit|Tshigwada|Zwigwada|Ylläpitäjä/i, key);
  }
  for (const key of ['delete-org-warning-message', 'delete-team-warning-message']) assert.match(cache['ve-PP'][key], /Ei sa heitta.*hot’ üks’ kävutai om sen ühtnik/);
  for (const key of ['delete-org-confirm-popup', 'delete-team-confirm-popup']) assert.match(cache['ve-PP'][key], /ei sa pördutada/);
  for (const key of ['remove-organization-from-board', 'remove-team-from-table']) {
    assert.match(cache['ve-PP'][key], /necile laudale panendad/);
    assert.doesNotMatch(cache['ve-PP'][key], /ei sa pördutada/);
  }
  assert.match(cache['ve-PP']['globalSearch-instructions-operator-org'], /laudal, kudamb om märitud sebrale/);
  assert.match(cache['ve-PP']['globalSearch-instructions-operator-team'], /laudal, kudamb om märitud joukule/);
  for (const key of ['globalSearch-instructions-operator-org', 'globalSearch-instructions-operator-team']) {
    assert.ok(cache['ve-PP'][key].includes('<display name|short name>'));
    assert.ok(cache['ve-PP'][key].includes('*<name>*'));
  }
  assert.equal(cache['ve-PP'].organizations, 'Sebrad');
  assert.equal(cache['ve-PP']['org-number'], 'Sebroiden lugu om: ');
  assert.match(cache['ve-PP']['autoAddUsersWithDomainName'], /avtomatižesti domenan nimen mödhe$/);
  assert.match(cache['ve-PP']['team-number'], /Joukuiden lugumär/);
  const vepsStorageMigrationRepairs = {
  "move-all-attachments-of-board-to-fs": "Sirdä kaik laudan tartutadud failad failoiden sistemaha",
  "move-all-attachments-of-board-to-gridfs": "Sirdä kaik laudan tartutadud failad MongoDB GridFS -kaičusehe",
  "move-all-attachments-of-board-to-s3": "Sirdä kaik laudan tartutadud failad S3 -kaičusehe",
  "fix-all-file-urls-migration": "Kohenda kaik failoiden URL-adresad",
  "fix-all-file-urls-migration-description": "Udištab kaik necen laudan tartutadud failoiden URL-adresad oiktan kaičusen sisteman kävutamižen täht da kohendab radmatomad failoiden tarkendused.",
  "run-fix-all-file-urls-migration-confirm": "Nece udištab kaik necen laudan tartutadud failoiden URL-adresad oiktan kaičusen sisteman kävutamižen täht. Jatkta?",
  "fix-avatar-urls-migration": "Kohenda avataroiden URL-adresad",
  "fix-avatar-urls-migration-description": "Udištab laudan ühtnikoiden avataroiden URL-adresad oiktan kaičusen sisteman kävutamižen täht da kohendab radmatomad avataroiden tarkendused.",
  "run-fix-avatar-urls-migration-confirm": "Nece udištab laudan ühtnikoiden avataroiden URL-adresad oiktan kaičusen sisteman kävutamižen täht. Jatkta?",
  "step-scan-files": "Kodvidas laudan tartutadud failoid",
  "step-scan-users": "Kodvidas laudan ühtnikoiden avataroid",
  "migration-starting": "Zavoditas migracijad...",
  "migration-pausing": "Azotadas migracijad...",
  "migration-stopping": "Seižutadas migracijad...",
  "migration-start-failed": "Migracijoiden zavodamižen viga",
  "migration-started": "Migracijad oma zavoditud",
  "migration-not-needed": "Migracijad ei ole tarbhad",
  "migrations": "Migracijad",
  "migrations-admin-only": "Vaiše laudan administratorad voiba tehta migracijad",
  "restore-all-archived-migration": "Endišta kaik arhivaha sirttud azjad"
};
  for (const [key, value] of Object.entries(vepsStorageMigrationRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Siirrä kaikki|taulun liitteet|tiedostojärjestelmään|Korjaa kaikki|tiedostojen URL|Päivittää|tiedostoliitteiden|tallennuspalvelinta|rikkinäiset|Jatketaanko|Tarkistetaan|Aloita siirrot|Keskeytetään|Pysäytetään|Siirtojen aloittaminen|Siirrot aloitettu|Ei tarvitse siirtää|Vain taulu|ylläpitäjät|Odota hetki|siirrämme|Palauta kaikki|arkistoidut/i, key);
  }
  for (const key of ['move-all-attachments-of-board-to-fs', 'move-all-attachments-of-board-to-gridfs', 'move-all-attachments-of-board-to-s3']) assert.match(cache['ve-PP'][key], /kaik laudan tartutadud failad/);
  assert.match(cache['ve-PP']['move-all-attachments-of-board-to-fs'], /failoiden sistemaha$/);
  assert.match(cache['ve-PP']['move-all-attachments-of-board-to-gridfs'], /MongoDB GridFS -kaičusehe$/);
  assert.match(cache['ve-PP']['move-all-attachments-of-board-to-s3'], /S3 -kaičusehe$/);
  assert.match(cache['ve-PP']['fix-all-file-urls-migration-description'], /kaik necen laudan.*URL-adresad.*oiktan kaičusen sisteman.*kohendab radmatomad failoiden tarkendused/);
  assert.match(cache['ve-PP']['fix-avatar-urls-migration-description'], /ühtnikoiden avataroiden.*URL-adresad.*kohendab radmatomad avataroiden tarkendused/);
  for (const key of ['run-fix-all-file-urls-migration-confirm', 'run-fix-avatar-urls-migration-confirm']) assert.match(cache['ve-PP'][key], /Jatkta\?$/);
  assert.match(cache['ve-PP']['migrations-admin-only'], /^Vaiše laudan administratorad/);
  assert.match(cache['ve-PP']['migration-starting'], /^Zavoditas/);
  assert.match(cache['ve-PP']['migration-pausing'], /^Azotadas/);
  assert.match(cache['ve-PP']['migration-stopping'], /^Seižutadas/);
  const vepsNotificationHelpRepairs = {
  "support-info-only-for-logged-in-users": "Tugen tedod oma vaiše sistemaha tulnuded kävutajile.",
  "watching-info": "Sinä sad tedotuzid kaikiš necen laudan vajehtusišpäi.",
  "tracking-info": "Sinä sad tedotuzid kaikiš nende kartaden vajehtusišpäi, kus sinä oled tegija libo ühtnik.",
  "swimlane-archive-suggest": "Sinä void möhemba endištada ujundšoidun Arhivaspäi Laudan sändoiš.",
  "step-fix-avatar-urls": "Kohenda avataroiden URL-adresad",
  "swimlane-title-not-found": "Ujundšoid '%s' ei ole löutud."
};
  for (const [key, value] of Object.entries(vepsNotificationHelpRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /Tuki tiedot|kirjautuneille|Sinulle ilmoitetaan|muutoksista|korteissa|Voit myöhemmin|palauttaa uimaradan|Korjaa avatar|Uimarataa|ei löytynyt/i, key);
    if (key !== 'swimlane-title-not-found') assert.equal(vepsTranslator.t(key), value, key);
  }
  assert.equal(vepsTranslator.t('swimlane-title-not-found', { sprintf: ['SWIMLANE'] }), "Ujundšoid 'SWIMLANE' ei ole löutud.");
  assert.match(cache['ve-PP']['watching-info'], /kaikiš necen laudan vajehtusišpäi/);
  assert.match(cache['ve-PP']['tracking-info'], /kartaden vajehtusišpäi.*tegija libo ühtnik/);
  assert.doesNotMatch(cache['ve-PP']['tracking-info'], /tegija da ühtnik/);
  assert.match(cache['ve-PP']['support-info-only-for-logged-in-users'], /vaiše sistemaha tulnuded kävutajile/);
  assert.match(cache['ve-PP']['swimlane-archive-suggest'], /möhemba.*Arhivaspäi Laudan sändoiš/);
  const vepsPermissionWarningRepairs = {
  "search-example": "Kirjuta tekst, midä sinä ecid, da paina Enter",
  "worker-desc": "Voib vaiše sirtta kartoid, märita ičtaze kartale da kirjutada sel’genzoitusid.",
  "unsaved-description": "Sinun kuvadand ei ole kaitud.",
  "swimlane-delete-pop": "Kaik tegendad linneba heittud tegendoiden lugetišespäi, da sinä ed voi endištada ujundšoidud. Necidä tegendad ei sa pördutada."
};
  for (const [key, value] of Object.entries(vepsPermissionWarningRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Kirjoita teksti|jota etsit|Voi vain siirtää|kortteja|ilmoittautua|kommentoida|Sinulla on|tallentamaton|Kaikki toimet|toimintasyötteestä|uimaradan|lopullista|peruuttamaan/i, key);
  }
  assert.match(cache['ve-PP']['search-example'], /Kirjuta tekst.*ecid.*paina Enter$/);
  assert.match(cache['ve-PP']['worker-desc'], /^Voib vaiše sirtta kartoid, märita ičtaze kartale da kirjutada sel’genzoitusid/);
  assert.doesNotMatch(cache['ve-PP']['worker-desc'], /märita toišt|vajehtada kartoid/);
  assert.match(cache['ve-PP']['unsaved-description'], /ei ole kaitud/);
  assert.match(cache['ve-PP']['swimlane-delete-pop'], /^Kaik tegendad.*heittud tegendoiden lugetišespäi.*ed voi endištada ujundšoidud/);
  assert.match(cache['ve-PP']['swimlane-delete-pop'], /ei sa pördutada\.$/);
  const vepsWebhookShortcutRepairs = {
  "webhook-title": "Webhookan nimi",
  "webhook-token": "Token (ei ole tarbhine autentifikacijan täht)",
  "outgoing-webhooks": "Oigendamižen Webhookad",
  "bidirectional-webhooks": "Kaks’poližed Webhookad",
  "disable-webhook": "Saupta nece Webhook",
  "global-webhook": "Üleižed Webhookad",
  "new-outgoing-webhook": "Uz’ oigendamižen Webhook",
  "to-create-organizations-contact-admin": "Sebroiden tegemižen täht ole kosketusiš administratoranke, ole hüvä.",
  "to-create-teams-contact-admin": "Joukuiden tegemižen täht ole kosketusiš administratoranke, ole hüvä.",
  "shortcut-close-dialog": "Saubata nece dialogikun",
  "shortcut-filter-my-cards": "Puhtasta minun kartad"
};
  for (const [key, value] of Object.entries(vepsWebhookShortcutRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Webkouk|Valinnainen|autentikoinnissa|Lähtevät|Kaksisuuntaiset|Poista käytöstä|Kaikenkattavat|Uusi lähtevä|Luodaksesi|ota yhteyttä|ylläpitäjään|Sulje valintaikkuna|Suodata korttini/i, key);
  }
  assert.match(cache['ve-PP']['webhook-token'], /ei ole tarbhine autentifikacijan täht/);
  assert.match(cache['ve-PP']['bidirectional-webhooks'], /^Kaks’poližed/);
  assert.match(cache['ve-PP']['outgoing-webhooks'], /^Oigendamižen/);
  assert.match(cache['ve-PP']['new-outgoing-webhook'], /^Uz’ oigendamižen/);
  assert.match(cache['ve-PP']['global-webhook'], /^Üleižed/);
  assert.match(cache['ve-PP']['disable-webhook'], /^Saupta nece/);
  assert.doesNotMatch(cache['ve-PP']['disable-webhook'], /Heitä/);
  assert.match(cache['ve-PP']['to-create-organizations-contact-admin'], /^Sebroiden.*kosketusiš administratoranke/);
  assert.match(cache['ve-PP']['to-create-teams-contact-admin'], /^Joukuiden.*kosketusiš administratoranke/);
  assert.equal(cache['ve-PP']['shortcut-filter-my-cards'], 'Puhtasta minun kartad');
  assert.doesNotMatch(cache['ve-PP']['shortcut-filter-my-cards'], /märitud/);
  assert.equal(cache['ve-PP']['shortcut-filter-my-assigned-cards'], 'Puhtasta minei märitud kartad');
  const vepsArchiveRecoveryRepairs = {
  "archive-board-confirm": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid sirtta necen laudan Arhivaha?",
  "archive-swimlane": "Sirdä ujundšoid Arhivaha",
  "board-archived": "Nece laud om sirttud Arhivaha.",
  "card-archive-suggest-cancel": "Sinä void möhemba endištada kartan Arhivaspäi.",
  "card-delete-suggest-archive": "Sinä void sirtta kartan Arhivaha, miše heitta sen laudaspäi da kaita tegendad.",
  "no-archived-swimlanes": "Arhivas ei ole ujundšoiduid.",
  "restore-all-archived-migration-description": "Endištab kaik arhivaha sirttud ujundšoidud, lugetišed da kartad. Kohendab avtomatižesti swimlaneId libo listId, ku niid ei ole, miše ozutada azjad.",
  "run-restore-all-archived-migration-confirm": "Nece endištab KAIK arhivaha sirttud ujundšoidud, lugetišed da kartad, miše möst ozutada niid. Azjad ilma ID-ta kohendadas avtomatižesti. Necidä tegendad ei sa kebnašti pördutada. Jatkta?",
  "restore-lost-cards-migration-description": "Ecib da endištab kartad da lugetišed, kudambil ei ole swimlaneId libo listId. Tegeb 'Lost Cards' ujundšoidun, miše möst ozutada kaik kadonu azjad.",
  "run-restore-lost-cards-migration-confirm": "Nece tegeb 'Lost Cards' ujundšoidun da endištab kaik kartad da lugetišed, kudambil ei ole swimlaneId libo listId. Nece vajehtab vaiše azjad, miččed ei ole sirttud arhivaha. Jatkta?",
  "restore-lost-cards-nothing-to-restore": "Ei ole kadonuid ujundšoiduid, lugetižid libo kartoid endištamižen täht.",
  "restore-lost-cards-migration": "Endišta kadonu kartad"
};
  for (const [key, value] of Object.entries(vepsArchiveRecoveryRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Oletko varma|haluat arkistoida|Siirrä uimarata|Tämä taulu|Voit myöhemmin|palauttaa kortin|Voit siirtää|säilyttääksesi|Ei uimaratoja|Palauttaa kaikki|arkistoidut|Korjaa automaattisesti|Etsii ja palauttaa|Kadonneet kortit|kadonneita uintikaistoja|Palauta kadonneet|Tämä luo|Tämä palauttaa|Jatketaanko/i, key);
  }
  assert.match(cache['ve-PP']['archive-swimlane'], /ujundšoid Arhivaha$/);
  assert.match(cache['ve-PP']['board-archived'], /laud om sirttud Arhivaha/);
  assert.match(cache['ve-PP']['card-archive-suggest-cancel'], /möhemba.*kartan Arhivaspäi/);
  assert.match(cache['ve-PP']['card-delete-suggest-archive'], /kartan Arhivaha.*laudaspäi da kaita tegendad/);
  assert.match(cache['ve-PP']['no-archived-swimlanes'], /Arhivas ei ole/);
  for (const key of ['restore-all-archived-migration-description', 'run-restore-all-archived-migration-confirm']) {
    assert.match(cache['ve-PP'][key], /arhivaha sirttud ujundšoidud, lugetišed da kartad/);
    assert.match(cache['ve-PP'][key], /avtomatižesti/);
  }
  for (const key of ['restore-lost-cards-migration-description', 'run-restore-lost-cards-migration-confirm']) {
    assert.ok(cache['ve-PP'][key].includes("'Lost Cards'"));
    assert.ok(cache['ve-PP'][key].includes('swimlaneId libo listId'));
    assert.doesNotMatch(cache['ve-PP'][key], /swimlaneId da listId/);
  }
  assert.match(cache['ve-PP']['run-restore-lost-cards-migration-confirm'], /vaiše azjad, miččed ei ole sirttud arhivaha/);
  assert.match(cache['ve-PP']['run-restore-all-archived-migration-confirm'], /KAIK arhivaha/);
  assert.match(cache['ve-PP']['run-restore-all-archived-migration-confirm'], /ei sa kebnašti pördutada/);
  assert.doesNotMatch(cache['ve-PP']['run-restore-all-archived-migration-confirm'], /ei sa pördutada/);
  for (const key of ['run-restore-lost-cards-migration-confirm', 'run-restore-all-archived-migration-confirm']) assert.match(cache['ve-PP'][key], /Jatkta[?]$/);
  const vepsMigrationStatusRepairs = {
  "cron-retry-failed": "Tošta migracijad, miččed ei olgoi satusekhad",
  "cron-resume-paused": "Jatkta azotadud migracijad",
  "cron-no-failed-migrations": "Ei ole toštamižen täht migracijoid, miččed ei olgoi satusekhad",
  "cron-no-paused-migrations": "Ei ole azotadud migracijoid jatktamižen täht",
  "cron-migrations-resumed": "Migracijad oma hüvin jatktud",
  "cron-migrations-retried": "Migracijad, miččed ei olgoi satusekhad, oma hüvin tošttud",
  "cron-migration-errors": "Migracijoiden vigad",
  "cron-migration-warnings": "Migracijoiden varutused",
  "cron-errors-cleared": "Kaik vigad oma hüvin heittud"
};
  for (const [key, value] of Object.entries(vepsMigrationStatusRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Yritä uudelleen|epäonnistuneita|keskeytettyjä|Siirrot jatkuu|onnistuneesti|Epäonnistuneet siirrot|Siirto virheet|Siirto varoitukset|Kaikki virheet|tyhjennetty/i, key);
  }
  for (const key of ['cron-retry-failed', 'cron-no-failed-migrations', 'cron-migrations-retried']) {
    assert.match(cache['ve-PP'][key], /miččed ei olgoi satusekhad/);
    assert.doesNotMatch(cache['ve-PP'][key], /azotadud/);
  }
  for (const key of ['cron-resume-paused', 'cron-no-paused-migrations']) {
    assert.match(cache['ve-PP'][key], /azotadud/);
    assert.doesNotMatch(cache['ve-PP'][key], /satusekhad/);
  }
  assert.match(cache['ve-PP']['cron-no-failed-migrations'], /^Ei ole/);
  assert.match(cache['ve-PP']['cron-no-paused-migrations'], /^Ei ole/);
  assert.match(cache['ve-PP']['cron-migrations-resumed'], /hüvin jatktud$/);
  assert.match(cache['ve-PP']['cron-migrations-retried'], /hüvin tošttud$/);
  assert.doesNotMatch(cache['ve-PP']['cron-migrations-retried'], /toštud/);
  assert.equal(cache['ve-PP']['cron-migration-errors'], 'Migracijoiden vigad');
  assert.equal(cache['ve-PP']['cron-migration-warnings'], 'Migracijoiden varutused');
  assert.match(cache['ve-PP']['cron-errors-cleared'], /^Kaik vigad.*hüvin heittud$/);
  assert.equal(cache['ve-PP']['migration-paused'], 'Migracijad oma hüvin azotadud.');
  assert.equal(cache['ve-PP']['migration-successful'], 'Migracii om hüvin loptud.');
  assert.equal(cache['ve-PP']['migration-resumed'], 'Migracii om jatktud.');
  const vepsWipLimitRepairs = {
  "edit-wip-limit": "Vajehta WIP-röunad",
  "soft-wip-limit": "Pehmed WIP-röun",
  "enable-wip-limit": "Avaida WIP-röun",
  "set-wip-limit-value": "Pane röun, ku äi tegendoid voib olda neciš lugetišes.",
  "setWipLimitPopup-title": "Pane WIP-röun",
  "wipLimitErrorPopup-title": "Vär WIP-röun",
  "wipLimitErrorPopup-dialog-pt1": "Necen lugetišen tegendoiden lugumär om enamba ku sinun märitud WIP-röun.",
  "wipLimitErrorPopup-dialog-pt2": "Sirdä vähä tegendoid neciš lugetišespäi libo pane suremb WIP-röun, ole hüvä.",
  "wip-limit-groups": "WIP-röuniden joukud",
  "wip-limit-group-name-placeholder": "Joukun nimi (ei ole tarbhine)",
  "wip-limit-group-add": "Ližata WIP-röunan jouk",
  "wip-limit-group-select-swimlane": "Valiče ujundšoid",
  "wip-limit-group-apply-swimlane": "Kävuta ujundšoidule"
};
  for (const [key, value] of Object.entries(vepsWipLimitRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Muokkaa|Pehmeä WIP|Ota käyttöön|WIP-raja|Aseta|Virheellinen|Tässä listassa|tehtävien määrä|korkeampi kuin|Siirrä joitain|määritä korkeampi|valinnainen|Lisää|Valitse taulu|Uimarata|Käytä/i, key);
  }
  assert.match(cache['ve-PP']['set-wip-limit-value'], /röun.*ku äi tegendoid voib olda neciš lugetišes/);
  assert.match(cache['ve-PP']['wipLimitErrorPopup-dialog-pt1'], /lugumär om enamba ku sinun märitud WIP-röun/);
  assert.doesNotMatch(cache['ve-PP']['wipLimitErrorPopup-dialog-pt1'], /vähemba|libo ühtenmüine/);
  assert.match(cache['ve-PP']['wipLimitErrorPopup-dialog-pt2'], /lugetišespäi libo pane suremb WIP-röun/);
  assert.doesNotMatch(cache['ve-PP']['wipLimitErrorPopup-dialog-pt2'], /lugetišehe|pane vähämb/);
  assert.equal(cache['ve-PP']['soft-wip-limit'], 'Pehmed WIP-röun');
  assert.equal(cache['ve-PP']['wip-limit-groups'], 'WIP-röuniden joukud');
  assert.match(cache['ve-PP']['wip-limit-group-name-placeholder'], /Joukun nimi.*ei ole tarbhine/);
  assert.match(cache['ve-PP']['wip-limit-group-select-swimlane'], /^Valiče ujundšoid$/);
  assert.match(cache['ve-PP']['wip-limit-group-apply-swimlane'], /^Kävuta ujundšoidule$/);
  const vepsVisibilityRepairs = {
  "private": "Personaline",
  "predicate-private": "personaline",
  "public": "Üleine",
  "predicate-public": "üleine",
  "operator-status": "olo",
  "public-boards": "Üleižed laudad",
  "board-private-info": "Nece laud linneb <strong>personaline</strong>.",
  "board-public-info": "Nece laud linneb <strong>üleine</strong>.",
  "page-maybe-private": "Nece lehtpol’ voib olda personaline. Sinä, voib olda, void kacta sidä, <a href='%s'>tuldes sistemaha</a>.",
  "private-desc": "Nece laud om personaline. Vaiše laudale ližatud ristitud voiba kacta da vajehtada sidä.",
  "public-desc": "Nece laud om üleine. Sidä voib kacta jogahine tarkendusenke, da se linneb ozutadud ecindmašinoiš, kut Google. Vaiše laudale ližatud ristitud voiba vajehtada sidä.",
  "custom-private-desc": "Kävutajan märitud personaližen laudan kuvadand",
  "custom-public-desc": "Kävutajan märitud üleižen laudan kuvadand",
  "custom-private-desc-placeholder": "Jäta tühjaks, miše kävutada personaližen laudan kuvadandan sanumata",
  "custom-public-desc-placeholder": "Jäta tühjaks, miše kävutada üleižen laudan kuvadandan sanumata",
  "default-on-private-board": "Sanumata personaližel laudal",
  "default-on-public-board": "Sanumata üleižel laudal",
  "show-on-private-board": "Ozuta personaližel laudal",
  "show-on-public-board": "Ozuta üleižel laudal",
  "globalSearch-instructions-status-private": "`__predicate_private__` - kartad vaiše personaližiš laudoiš",
  "globalSearch-instructions-status-public": "`__predicate_public__` - kartad vaiše üleižiš laudoiš",
  "tableVisibilityMode-allowPrivateOnly": "Laudaden nägubuz’: laske vaiše personaližed laudad"
};
  for (const [key, value] of Object.entries(vepsVisibilityRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /Yksityinen|Julkinen|Tämä taulu|Tämä sivu|kirjautumalla|kortit vain|yksityisillä|julkisilla|Taulujen näkyvyys|Salli vain|Mabodo a|Yo dinaho|ṱhalutshedzo|Litshani hu|Zwo ḓoweleaho|Sumbedzani|tshitshavha|tshiphiri/i, key);
    if (key !== 'page-maybe-private') assert.equal(vepsTranslator.t(key), value, key);
  }
  for (const key of ['board-private-info', 'board-public-info', 'page-maybe-private']) {
    assert.deepEqual(htmlTags(cache['ve-PP'][key]), htmlTags(english[key]), key);
  }
  assert.equal(vepsTranslator.t('page-maybe-private', { sprintf: ['https://on-premise.example/sign-in'] }), "Nece lehtpol’ voib olda personaline. Sinä, voib olda, void kacta sidä, <a href='https://on-premise.example/sign-in'>tuldes sistemaha</a>.");
  assert.match(cache['ve-PP']['private-desc'], /Vaiše laudale ližatud ristitud voiba kacta da vajehtada/);
  assert.match(cache['ve-PP']['public-desc'], /jogahine tarkendusenke.*ecindmašinoiš, kut Google.*Vaiše laudale ližatud ristitud voiba vajehtada/);
  assert.doesNotMatch(cache['ve-PP']['private-desc'], /jogahine tarkendusenke/);
  assert.match(cache['ve-PP']['globalSearch-instructions-status-private'], /vaiše personaližiš laudoiš/);
  assert.match(cache['ve-PP']['globalSearch-instructions-status-public'], /vaiše üleižiš laudoiš/);
  for (const key of ['custom-private-desc-placeholder', 'custom-public-desc-placeholder']) assert.match(cache['ve-PP'][key], /Jäta tühjaks.*kuvadandan sanumata/);
  assert.notEqual(cache['ve-PP']['predicate-private'], cache['ve-PP']['predicate-public']);
  // Exercise production Query with the actual repaired locale, rather than a
  // synthetic predicate map: translated status values must still resolve.
  const visibilityVm = require('node:vm');
  const visibilityContext = { TAPi18n: { __: key => cache['ve-PP'][key] || key }, Boards: { colorMap: () => ({}) }, console };
  visibilityVm.createContext(visibilityContext);
  visibilityVm.runInContext(fs.readFileSync(path.join(root, 'config/search-const.js'), 'utf8').replace(/export /g, '') + '\n' +
    fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') + '\nthis.Query = Query;', visibilityContext);
  for (const [key, expected] of [['predicate-private', 'private'], ['predicate-public', 'public']]) {
    const parsed = new visibilityContext.Query();
    parsed.buildParams(`${cache['ve-PP']['operator-status']}:${cache['ve-PP'][key]}`);
    assert.equal(parsed.hasErrors(), false, key);
    assert.equal(parsed.getQueryParams().getPredicate('status'), expected, key);
  }
  const invalidVisibility = new visibilityContext.Query();
  invalidVisibility.buildParams(`${cache['ve-PP']['operator-status']}:nonexistent-visibility`);
  assert.equal(invalidVisibility.hasErrors(), true);
  const vepsDeletionRepairs = {
  "card-delete-notice": "Heitämine om igäks. Kaik necen kartan tegendad linneba heittud.",
  "card-delete-pop": "Kaik tegendad linneba heittud tegendoiden lugetišespäi, da sinä ed voi möst avaita kartad. Necidä tegendad ei sa pördutada.",
  "label-delete-pop": "Ei sa pördutada. Nece heitäb necen znaman kaikiš kartoišpäi da heitäb sen istorijan.",
  "delete-board-confirm-popup": "Kaik lugetišed, kartad, znamad da tegendad linneba heittud, da sinä ed voi endištada laudan kontentad. Necidä tegendad ei sa pördutada.",
  "delete-user-confirm-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen akkauntan? Necidä ei sa pördutada.",
  "comment-delete": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen sel’genzoitusen?",
  "confirm-checklist-delete-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen kodvindlugetišen?",
  "confirm-checklist-item-delete-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen kodvindlugetišen kohtan?",
  "confirm-subtask-delete-popup": "Oled-ik sinä tozi mugošt mel’t, miše tahtoid heitta necen alategendan?"
};
  for (const [key, value] of Object.entries(vepsDeletionRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Haluatko|varmasti|poistaa|Poistaminen|lopullista|Menetät|toimintasyötteestä|pysty|peruuttaa|Tämä poistaa|tuhoaa|käyttäjätilin|tarkistuslistan|alitehtävän/, key);
  }
  for (const key of ['card-delete-pop', 'label-delete-pop', 'delete-board-confirm-popup', 'delete-user-confirm-popup']) assert.match(cache['ve-PP'][key], /ei sa pördutada/i, key);
  assert.match(cache['ve-PP']['card-delete-notice'], /igäks.*Kaik necen kartan tegendad linneba heittud/);
  assert.match(cache['ve-PP']['card-delete-pop'], /tegendoiden lugetišespäi.*ed voi möst avaita kartad/);
  assert.match(cache['ve-PP']['label-delete-pop'], /kaikiš kartoišpäi.*sen istorijan/);
  assert.match(cache['ve-PP']['delete-board-confirm-popup'], /Kaik lugetišed, kartad, znamad da tegendad.*ed voi endištada laudan kontentad/);
  assert.match(cache['ve-PP']['confirm-checklist-item-delete-popup'], /kodvindlugetišen kohtan/);
  assert.doesNotMatch(cache['ve-PP']['confirm-checklist-delete-popup'], /kohtan/);
  assert.match(cache['ve-PP']['confirm-subtask-delete-popup'], /alategendan/);
  assert.doesNotMatch(cache['ve-PP']['confirm-subtask-delete-popup'], /kodvindlugetišen/);
  assert.match(cache['ve-PP']['comment-delete'], /sel’genzoitusen/);
  assert.notEqual(cache['ve-PP']['card-delete-pop'], cache['ve-PP']['card-archive-pop']);
  const vepsValidationRepairs = {
  "error-board-notAdmin": "Sinun pidab olda necen laudan administrator, miše tehta necidä.",
  "error-board-notAMember": "Sinun pidab olda necen laudan ühtnik, miše tehta necidä.",
  "error-notAuthorized": "Sinai ei ole oiktusid kacta necidä lehtpol’t.",
  "error-json-malformed": "Sinun tekst ei ole JSON oiktas formatas.",
  "error-json-schema": "Sinun JSON-tedoiš ei ole tarbhaižid tedoid oiktas formatas.",
  "error-csv-schema": "Sinun CSV (katkimel erigoittud znamoičendad)/TSV (Tab-simvolanke erigoittud znamoičendad) -tedoiš ei ole tarbhaižid tedoid oiktas formatas ",
  "invalid-credentials": "Vär kävutajan nimi libo peitsana",
  "invalid-date": "Vär päivmär",
  "invalid-user": "Vär kävutai",
  "error-invitation-code-not-exist": "Kucundan kod ei ole",
  "invitation-code": "Kucundan kod",
  "error-user-notAllowSelf": "Sinä ed voi kucta ičtaiž",
  "error-username-taken": "Nece kävutajan nimi om jo kävutuses",
  "error-ldap-login": "Tegihe viga sistemaha tulendan aigan",
  "error-undefined": "Tegihe viga",
  "error-org-domain-taken": "Nece domen om jo toižen sebran oma:"
};
  for (const [key, value] of Object.entries(vepsValidationRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Tehdäksesi|täytyy|ylläpitäjä|jäsen|Tekstisi|kelvollisessa|JSON-tietosi|sisällä oikeaa|Sinulla|tarkastella|Virheellinen|Kutsukood|Et voi kutsua|käyttäjätunnus|kirjautua|Jotain meni|Yeneyo|tshiimiswa/, key);
  }
  assert.match(cache['ve-PP']['error-board-notAdmin'], /laudan administrator/);
  assert.doesNotMatch(cache['ve-PP']['error-board-notAdmin'], /ühtnik/);
  assert.match(cache['ve-PP']['error-board-notAMember'], /laudan ühtnik/);
  assert.doesNotMatch(cache['ve-PP']['error-board-notAMember'], /administrator/);
  assert.match(cache['ve-PP']['invalid-credentials'], /kävutajan nimi libo peitsana/);
  assert.match(cache['ve-PP']['error-notAuthorized'], /ei ole oiktusid kacta/);
  assert.match(cache['ve-PP']['error-json-malformed'], /tekst ei ole JSON oiktas formatas/);
  assert.match(cache['ve-PP']['error-json-schema'], /JSON-tedoiš.*tarbhaižid tedoid oiktas formatas/);
  assert.notEqual(cache['ve-PP']['error-json-malformed'], cache['ve-PP']['error-json-schema']);
  assert.match(cache['ve-PP']['error-csv-schema'], /CSV \(katkimel erigoittud znamoičendad\)\/TSV \(Tab-simvolanke erigoittud znamoičendad\)/);
  assert.match(cache['ve-PP']['error-csv-schema'], /tarbhaižid tedoid oiktas formatas/);
  assert.equal(cache['ve-PP']['invitation-code'], 'Kucundan kod');
  assert.match(cache['ve-PP']['error-invitation-code-not-exist'], /^Kucundan kod ei ole$/);
  assert.match(cache['ve-PP']['email-invite-register-text'], /kucundan kod om: __icode__/);
  assert.match(cache['ve-PP']['error-user-notAllowSelf'], /ed voi kucta ičtaiž/);
  assert.match(cache['ve-PP']['error-org-domain-taken'], /jo toižen sebran oma:$/);
  assert.match(cache['ve-PP']['error-ldap-login'], /sistemaha tulendan aigan/);
  assert.doesNotMatch(cache['ve-PP']['error-undefined'], /sistemaha/);
  const vepsCommentRepairs = {
  "card-comments-title": "Necil kartal om %s sel’genzoituz.",
  "card-comments-on-minicard": "Sel’genzoitused minikartal",
  "card-comments-more": "Enamba",
  "card-has-unread-comments": "Om sel’genzoitusid, miččid ei ole lugedud",
  "comments": "Sel’genzoitused",
  "no-comments": "Ei ole sel’genzoitusid",
  "no-comments-desc": "Ei voi nähta sel’genzoitusid",
  "roles-status-comment": "Sel’genzoituz",
  "operator-comment": "sel’genzoituz",
  "comment-not-found": "Ei ole löutud kartad, miččen sel’genzoituses om tekst '%s'.",
  "globalSearch-instructions-operator-comment": "`__operator_comment__:<text>` - kartad, miččen sel’genzoituses om *<text>*."
};
  for (const [key, value] of Object.entries(vepsCommentRepairs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /Tässä kortissa|Kommentit|Kommentti|kommentti|kommentteja|nähdä|Lisää|Nyambedzano|Nzhamusi|Ei löytynyt|kortit joilla/, key);
    if (!['card-comments-title', 'comment-not-found', 'globalSearch-instructions-operator-comment'].includes(key)) assert.equal(vepsTranslator.t(key), value, key);
  }
  assert.equal(vepsTranslator.t('card-comments-title', { sprintf: [1] }), 'Necil kartal om 1 sel’genzoituz.');
  assert.equal(vepsTranslator.t('comment-not-found', { sprintf: ['SEARCH_TEXT'] }), "Ei ole löutud kartad, miččen sel’genzoituses om tekst 'SEARCH_TEXT'.");
  assert.equal(vepsTranslator.t('globalSearch-instructions-operator-comment', { operator_comment: cache['ve-PP']['operator-comment'] }), '`sel’genzoituz:<text>` - kartad, miččen sel’genzoituses om *<text>*.');
  assert.match(cache['ve-PP']['card-has-unread-comments'], /miččid ei ole lugedud/);
  assert.doesNotMatch(cache['ve-PP']['no-comments'], /lugedud/);
  assert.match(cache['ve-PP']['card-comments-on-minicard'], /minikartal/);
  assert.equal(cache['ve-PP']['roles-status-comment'], cache['ve-PP']['comment']);
  assert.equal(cache['ve-PP']['operator-comment'], cache['ve-PP']['comment'].toLowerCase());
  // Existing context reads the live repaired cache, including its apostrophe.
  const commentQuery = new visibilityContext.Query();
  commentQuery.buildParams(`${cache['ve-PP']['operator-comment']}:SEARCH_TEXT`);
  assert.equal(commentQuery.hasErrors(), false);
  assert.equal(commentQuery.getQueryParams().getPredicate('comment'), 'SEARCH_TEXT');
  const quotedCommentQuery = new visibilityContext.Query();
  quotedCommentQuery.buildParams(`${cache['ve-PP']['operator-comment']}:"two words"`);
  assert.equal(quotedCommentQuery.hasErrors(), false);
  assert.equal(quotedCommentQuery.getQueryParams().getPredicate('comment'), 'two words');
  const unknownCommentQuery = new visibilityContext.Query();
  unknownCommentQuery.buildParams('nonexistentcommentoperator:SEARCH_TEXT');
  assert.equal(unknownCommentQuery.hasErrors(), true);
  const vepsMigrationControls = {
  "run-migration": "Tehta migracii",
  "pause-migration": "Azota migracii",
  "resume-migration": "Jatkta migracii",
  "stop-migration": "Seižuta migracii",
  "database-migrations": "Andmbazan migracijad",
  "status": "Olo",
  "migration-progress-status": "Olo",
  "details": "Tarkkohtad",
  "migration-progress-details": "Tarkkohtad",
  "steps": "etapad",
  "stop": "Seižuta"
};
  for (const [key, value] of Object.entries(vepsMigrationControls)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Suorita|Keskeytä|Jatka siirtoa|Pysäytä|Tietokannan|Tilanne|Yksityiskohdat|askelta/, key);
  }
  assert.equal(cache['ve-PP']['pause-migration'], cache['ve-PP']['pause-all-migrations'].replace('kaik migracijad', 'migracii'));
  assert.equal(cache['ve-PP']['stop-migration'], cache['ve-PP']['stop-all-migrations'].replace('kaik migracijad', 'migracii'));
  assert.notEqual(cache['ve-PP']['pause-migration'], cache['ve-PP']['stop-migration']);
  assert.notEqual(cache['ve-PP']['resume-migration'], cache['ve-PP']['stop-migration']);
  assert.equal(cache['ve-PP']['migration-progress-status'], cache['ve-PP']['status']);
  assert.equal(cache['ve-PP']['migration-progress-details'], cache['ve-PP']['details']);
  const vepsMigrationSteps = {
  "step-restore-lists": "Endišta lugetišed",
  "step-restore-cards": "Endišta kartad",
  "step-restore-swimlanes": "Endišta ujundšoidud",
  "step-update-cards": "Udišta kartad",
  "step-finalize": "Lopta",
  "step-analyze-lists": "Tarkištele lugetišid",
  "step-fix-file-urls": "Kohenda failoiden URL-adresad",
  "step-validate-migration": "Kodvi migracii",
  "no-issues-found": "Ei ole löutud problemoid"
};
  for (const [key, value] of Object.entries(vepsMigrationSteps)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Palauta|Päivitä|Viimeistellään|Analysoidaan|Korjataan|Varmistetaan|Ei löytynyt|ongelmia/, key);
  }
  assert.equal(cache['ve-PP']['step-restore-cards'], cache['ve-PP']['restore'] + ' kartad');
  assert.notEqual(cache['ve-PP']['step-restore-cards'], cache['ve-PP']['step-restore-lists']);
  assert.notEqual(cache['ve-PP']['step-restore-swimlanes'], cache['ve-PP']['step-restore-lists']);
  assert.match(cache['ve-PP']['step-fix-file-urls'], /failoiden URL-adresad/);
  assert.doesNotMatch(cache['ve-PP']['no-issues-found'], /on löutud/);
  assert.equal(vepsTranslator.t('migration-warning-text'), "Ala saupta brauzerad migracijan aigan. Process jatkub tagamal, no loptamižen täht voib olda tarbiž enamba aigad.");
  assert.match(cache['ve-PP']['migration-warning-text'], /^Ala saupta/);
  assert.match(cache['ve-PP']['migration-warning-text'], /jatkub tagamal/);
  assert.match(cache['ve-PP']['migration-warning-text'], /voib olda tarbiž enamba aigad/);
  assert.doesNotMatch(cache['ve-PP']['migration-warning-text'], /Älä sulje|Prosessi jatkuu|kestää kauemmin/);
  const vepsScheduledJobs = {
  "cron-jobs": "Märitud aiganke radod",
  "active-cron-jobs": "Aktivižed märitud aiganke radod",
  "cron-job-delete-confirm": "Tahod-ik heitta necen märitud aiganke radon?",
  "cron-job-delete-failed": "Ei voind heitta märitud aiganke radod",
  "cron-job-deleted": "Märitud aiganke rad om hüvin heittud",
  "cron-job-pause-failed": "Ei voind azotada märitud aiganke radod",
  "cron-job-paused": "Märitud aiganke rad om hüvin azotadud",
  "cron-job-resume-failed": "Ei voind jatkata märitud aiganke radod",
  "cron-job-resumed": "Märitud aiganke rad om hüvin jatktud",
  "cron-job-start-failed": "Ei voind zavodida märitud aiganke radod",
  "cron-job-started": "Märitud aiganke rad om hüvin zavoditud"
};
  for (const [key, value] of Object.entries(vepsScheduledJobs)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Ajastettu|Ajastetun|Ajastetut|Aikataulu|Haluatko|onnistuneesti|epäonnistui|Aktiiviset/, key);
  }
  for (const [action, success] of [['delete', 'deleted'], ['pause', 'paused'], ['resume', 'resumed'], ['start', 'started']]) {
    assert.match(cache['ve-PP'][`cron-job-${action}-failed`], /^Ei voind/);
    assert.match(cache['ve-PP'][`cron-job-${success}`], /om hüvin/);
    assert.doesNotMatch(cache['ve-PP'][`cron-job-${success}`], /^Ei/);
    assert.notEqual(cache['ve-PP'][`cron-job-${action}-failed`], cache['ve-PP'][`cron-job-${success}`]);
  }
  assert.match(cache['ve-PP']['cron-job-paused'], /azotadud$/);
  assert.match(cache['ve-PP']['cron-job-resumed'], /jatktud$/);
  assert.match(cache['ve-PP']['cron-job-started'], /zavoditud$/);
  assert.match(cache['ve-PP']['cron-job-deleted'], /heittud$/);
  assert.match(cache['ve-PP']['cron-job-delete-confirm'], /\?$/);
  assert.doesNotMatch(Object.values(vepsScheduledJobs).join(' '), /radan|radad/);
  assert.match(cache['ve-PP']['cron-job-delete-confirm'], /radon/);
  const vepsSearchEntities = {
  "operator-board": "laud",
  "operator-list": "lugetiž",
  "operator-swimlane": "ujundšoid",
  "operator-member": "ühtnik",
  "operator-assignee": "märitud",
  "globalSearch-instructions-operator-board": "`__operator_board__:<title>` - kartad laudoil, miččiden nimes om *<title>*",
  "globalSearch-instructions-operator-list": "`__operator_list__:<title>` - kartad lugetišil, miččiden nimes om *<title>*",
  "globalSearch-instructions-operator-swimlane": "`__operator_swimlane__:<title>` - kartad ujundšoiduil, miččiden nimes om *<title>*",
  "globalSearch-instructions-operator-member": "`__operator_member__:<username>` - kartad, miččil *<username>* om *ühtnik*",
  "globalSearch-instructions-operator-assignee": "`__operator_assignee__:<username>` - kartad, miččil *<username>* om *märitud kävutai*",
  "globalSearch-instructions-status-all": "`__predicate_all__` - kaik arhivaha sirttud kartad da kaik toižed kartad"
};
  for (const [key, value] of Object.entries(vepsSearchEntities)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /kortit|tauluilla|listoilla|uimaradoilla|joilla|joissa|jäsen|käsittelijä|kaikki arkistoidut|taulu|uimarata/, key);
  }
  for (const [operator, token] of [['board', 'laud'], ['list', 'lugetiž'], ['swimlane', 'ujundšoid'], ['member', 'ühtnik'], ['assignee', 'märitud']]) {
    assert.equal(cache['ve-PP'][`operator-${operator}`], token);
    const parsed = new visibilityContext.Query();
    parsed.buildParams(`${token}:"SEARCH TEXT"`);
    assert.equal(parsed.hasErrors(), false, operator);
    assert.equal(parsed.getQueryParams().getPredicate({ member: 'members', assignee: 'assignees' }[operator] || operator), 'SEARCH TEXT', operator);
    const key = `globalSearch-instructions-operator-${operator}`;
    assert.equal(vepsTranslator.t(key, { [`operator_${operator}`]: token }), cache['ve-PP'][key].replace(`__operator_${operator}__`, token));
  }
  assert.notEqual(cache['ve-PP']['operator-member'], cache['ve-PP']['operator-assignee']);
  assert.match(cache['ve-PP']['globalSearch-instructions-status-all'], /kaik arhivaha sirttud kartad da kaik toižed kartad/);
  const invalidSpacedOperator = new visibilityContext.Query();
  invalidSpacedOperator.buildParams('märitud nonexistentoperator:SEARCH_TEXT');
  assert.equal(invalidSpacedOperator.hasErrors(), true);
  const vepsSearchRoles = {
  "operator-user": "kävutai",
  "operator-creator": "tegii",
  "creator": "Tegii",
  "creator-on-minicard": "Tegii minikartal",
  "predicate-ended": "loptud",
  "globalSearch-instructions-operator-user": "`__operator_user__:<username>` - kartad, miččil *<username>* om *ühtnik* libo *märitud kävutai*",
  "globalSearch-instructions-operator-creator": "`__operator_creator__:<username>` - kartad, miččil *<username>* om kartan tegii",
  "globalSearch-instructions-status-ended": "`__predicate_ended__` - kartad lopun päivmäranke",
  "globalSearch-instructions-notes-1": "Voib märita äi operatoroid.",
  "globalSearch-instructions-notes-5": "Sanumata ecind om ilma arhivaha sirttud kartoid."
};
  for (const [key, value] of Object.entries(vepsSearchRoles)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /käyttäjä|luoja|Luoja|minikortilla|päättyi|kortit joilla|kortit joissa|jäsen|käsittelijä|On mahdollista|Oletuksena/, key);
  }
  for (const [key, predicate] of [['operator-user', 'user'], ['operator-creator', 'userId']]) {
    const parsed = new visibilityContext.Query();
    parsed.buildParams(`${cache['ve-PP'][key]}:SEARCH_USER`);
    assert.equal(parsed.hasErrors(), false, key);
    assert.equal(parsed.getQueryParams().getPredicate(predicate), 'SEARCH_USER', key);
    const instruction = `globalSearch-instructions-${key}`;
    assert.equal(vepsTranslator.t(instruction, { [key.replace('-', '_')]: cache['ve-PP'][key] }), cache['ve-PP'][instruction].replace(`__${key.replace('-', '_')}__`, cache['ve-PP'][key]));
  }
  const endedSearch = new visibilityContext.Query();
  endedSearch.buildParams(`${cache['ve-PP']['operator-status']}:${cache['ve-PP']['predicate-ended']}`);
  assert.equal(endedSearch.hasErrors(), false);
  assert.equal(endedSearch.getQueryParams().getPredicate('status'), 'ended');
  assert.match(cache['ve-PP']['globalSearch-instructions-operator-user'], /ühtnik.*libo.*märitud kävutai/);
  assert.match(cache['ve-PP']['globalSearch-instructions-notes-5'], /Sanumata.*ilma arhivaha sirttud kartoid/);
  assert.notEqual(cache['ve-PP']['operator-creator'], cache['ve-PP']['operator-assignee']);
  const vepsSearchErrors = {
  "operator-unknown-error": "%s ei ole operator",
  "operator-number-expected": "Operatoran __operator__ täht om tarbiž lugu, no om sadud '__value__'",
  "operator-sort-invalid": "Järgenduz '%s' om vär",
  "operator-status-invalid": "'%s' om vär olo",
  "operator-has-invalid": "%s om vär olendan kodvind",
  "operator-limit-invalid": "%s om vär ülimär. Ülimär pidab olda kogonaine lugu, mi om suremb 0.",
  "operator-debug-invalid": "%s om vär debug-predikat",
  "operator-limit": "ülimär"
};
  for (const [key, value] of Object.entries(vepsSearchErrors)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /operaattori|odotettiin|saatiin|lajittelutapa|virheellinen|kelvollinen|Rajan pitäisi|kokonaisluku|debuggaus/, key);
    if (value.includes('%s')) assert.equal(vepsTranslator.t(key, { sprintf: ['BAD_VALUE'] }), value.replace('%s', 'BAD_VALUE'));
  }
  assert.equal(vepsTranslator.t('operator-number-expected', { operator: 'TEST_OPERATOR', value: 'BAD_VALUE' }), "Operatoran TEST_OPERATOR täht om tarbiž lugu, no om sadud 'BAD_VALUE'");
  for (const value of ['BAD_VALUE', '-1']) {
    const invalid = new visibilityContext.Query();
    invalid.buildParams(`${cache['ve-PP']['operator-limit']}:${value}`);
    assert.equal(invalid.hasErrors(), true, value);
  }
  const validLimit = new visibilityContext.Query();
  validLimit.buildParams(`${cache['ve-PP']['operator-limit']}:10`);
  assert.equal(validLimit.hasErrors(), false);
  assert.equal(validLimit.getQueryParams().getPredicate('limit'), 10);
  assert.match(cache['ve-PP']['operator-limit-invalid'], /kogonaine/);
  assert.match(cache['ve-PP']['operator-limit-invalid'], /suremb 0/);
  const vepsCardCopyPermissions = {
  "card-show-lists-on-minicard": "Ozuta lugetišed minikartal",
  "card-sorting-by-number": "Kartoiden järgenduz nomeran mödhe",
  "card-sorting-by-number-on-minicard": "Kartoiden järgenduz nomeran mödhe minikartal",
  "copyChecklistFromTemplate": "Kopirui kodvindlugetiž vilitesespäi",
  "copyChecklistFromTemplatePopup-title": "Kopirui kodvindlugetiž vilitesespäi",
  "copyManyCardsPopup-format": "[{\"title\":\"Ezmäižen kartan pälkirjutez\",\"description\":\"Ezmäižen kartan kuvadand\"},{\"title\":\"Toižen kartan pälkirjutez\",\"description\":\"Toižen kartan kuvadand\"},{\"title\":\"Jäl’gmäižen kartan pälkirjutez\",\"description\":\"Jäl’gmäižen kartan kuvadand\"}]",
  "copyManyCardsPopup-instructions": "Tähtkartoiden pälkirjutesed da kuvadandad neces JSON-formatas",
  "normal-desc": "Voib nähta da vajehtada kartoid. Ei voi vajehtada sändoid.",
  "last-admin-desc": "Sinä ed voi vajehtada roloid: pidab olda üks administrator libo enamba."
};
  for (const [key, value] of Object.entries(vepsCardCopyPermissions)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Näytä listat|Korttien|Kopioi tarkistuslista|Ensimmäisen|Toisen kortin|Viimeisen|Kohde korttien|Voi nähdä|Ei voi muokata|Et voi vaihtaa/, key);
  }
  assert.equal(cache['ve-PP']['copyChecklistFromTemplate'], cache['ve-PP']['copyChecklistFromTemplatePopup-title']);
  const vepsBulkExample = JSON.parse(cache['ve-PP']['copyManyCardsPopup-format']);
  assert.equal(vepsBulkExample.length, 3);
  for (const item of vepsBulkExample) assert.deepEqual(Object.keys(item), ['title', 'description']);
  assert.match(vepsBulkExample[0].title, /^Ezmäižen/);
  assert.match(vepsBulkExample[1].title, /^Toižen/);
  assert.match(vepsBulkExample[2].title, /^Jäl’gmäižen/);
  assert.match(cache['ve-PP']['normal-desc'], /Ei voi vajehtada sändoid/);
  assert.match(cache['ve-PP']['last-admin-desc'], /üks administrator libo enamba/);
  assert.match(cache['ve-PP']['card-sorting-by-number-on-minicard'], /minikartal$/);
  const vepsExportChecklist = {
  "export-card-excel-fields": "Valiče pöudod Excel-irdalevendan täht:",
  "export-card-field-board-info": "Laudan tedod (Laud, Lugetiž, Ujundšoid)",
  "export-card-field-people": "Ristitud (Tegii, Ižand, Ühtnikad, Märitud kävutajad)",
  "owner": "Ižand",
  "newlineBecomesNewChecklistItem": "Joga tekstan rivi linneb ühteks kodvindlugetišen kohtaks",
  "newlineBecomesNewChecklistItemOriginOrder": "Joga tekstan rivi linneb ühteks kodvindlugetišen kohtaks, ezmäižes järgenduses"
};
  for (const [key, value] of Object.entries(vepsExportChecklist)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Valitse|Taulu tiedot|Ihmiset|Luoja|Omistaja|Jäsenet|Käsittelijät|Joka rivistä|tarkistuslistan|alkuperäinen/, key);
  }
  assert.match(cache['ve-PP']['export-card-field-people'], /Tegii, Ižand, Ühtnikad, Märitud kävutajad/);
  assert.match(cache['ve-PP']['export-card-field-board-info'], /Laud, Lugetiž, Ujundšoid/);
  assert.equal(cache['ve-PP']['newlineBecomesNewChecklistItemOriginOrder'], cache['ve-PP']['newlineBecomesNewChecklistItem'] + ', ezmäižes järgenduses');
  assert.match(cache['ve-PP']['newlineBecomesNewChecklistItem'], /Joga tekstan rivi.*ühteks.*kohtaks/);
  const vepsBoardConfirmations = {
  "allboards.delete-workspace-confirm": "Tahod-ik heitta necen tötilan?",
  "duplicate-board": "Kopirui laud",
  "duplicate-board-confirm": "Tahod-ik kopiruida necen laudan?",
  "leave-board": "Lähte laudaspäi",
  "leaveBoardPopup-title": "Lähtta laudaspäi?",
  "leave-board-pop": "Tahod-ik lähtta laudaspäi __boardTitle__? Sinä linned heittud kaikiš necen laudan kartoišpäi.",
  "export-card-excel-no-disk-space": "Ei voi tehta Excel-irdalevendad: diskal ei ole külläks joudajad tilad"
};
  for (const [key, value] of Object.entries(vepsBoardConfirmations)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /Haluatko|Tee kaksoiskappale|Oletko varma|Jää pois|Poistu taululta|Sinut poistetaan|Vienti Exceliin|levytilaa/, key);
    if (key !== 'leave-board-pop') assert.equal(vepsTranslator.t(key), value, key);
  }
  assert.equal(vepsTranslator.t('leave-board-pop', { boardTitle: 'BOARD_TITLE' }), 'Tahod-ik lähtta laudaspäi BOARD_TITLE? Sinä linned heittud kaikiš necen laudan kartoišpäi.');
  assert.match(cache['ve-PP']['leave-board-pop'], /kaikiš necen laudan kartoišpäi/);
  assert.match(cache['ve-PP']['export-card-excel-no-disk-space'], /^Ei voi.*diskal ei ole külläks/);
  assert.match(cache['ve-PP']['duplicate-board-confirm'], /kopiruida.*laudan/);
  const vepsCustomizationLabels = {
  "custom-top-left-corner-logo-image-url": "Kävutajan märitud ülähäižen huran čogan logokuvan URL",
  "custom-top-left-corner-logo-link-url": "Kävutajan märitud ülähäižen huran čogan logon linkan URL",
  "custom-top-left-corner-logo-height": "Kävutajan märitud ülähäižen huran čogan logon korktuz’. Sanumata: 27",
  "custom-login-logo-image-url": "Kävutajan märitud sistemaha tulendan logokuvan URL",
  "custom-login-logo-link-url": "Kävutajan märitud sistemaha tulendan logon linkan URL",
  "custom-help-link-url": "Kävutajan märitud abun linkan URL",
  "text-below-custom-login-logo": "Tekst kävutajan märitud sistemaha tulendan logon al",
  "custom-head-tags-enabled": "Pane päle kävutajan märitud head-tagad",
  "custom-head-meta-tags": "Kävutajan märitud meta-tagad (HTML)",
  "custom-head-link-tags": "Kävutajan märitud link-tagad (HTML)",
  "custom-manifest-enabled": "Pane päle kävutajan märitud web-manifest",
  "custom-head-manifest-content": "Kävutajan märitud web-manifestan südäimuz (JSON)",
  "custom-assetlinks-enabled": "Pane päle kävutajan märitud assetlinks.json",
  "custom-assetlinks-content": "Kävutajan märitud assetlinks.json südäimuz (JSON)",
  "custom-legal-notice-link-url": "Kävutajan märitud juridižen homaičusen lehtpolen URL"
};
  for (const [key, value] of Object.entries(vepsCustomizationLabels)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Mukautettu|mukautetun|Muokatun|oikean yläkulman|Ota käyttöön|Ota käytöön|sisältö|kirjautumis/, key);
  }
  for (const key of ['custom-top-left-corner-logo-image-url', 'custom-top-left-corner-logo-link-url', 'custom-top-left-corner-logo-height']) assert.match(cache['ve-PP'][key], /ülähäižen huran čogan/);
  assert.match(cache['ve-PP']['custom-top-left-corner-logo-height'], /Sanumata: 27$/);
  assert.match(cache['ve-PP']['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
  assert.match(cache['ve-PP']['custom-head-link-tags'], /link-tagad.*HTML/);
  assert.match(cache['ve-PP']['custom-head-meta-tags'], /meta-tagad.*HTML/);
  assert.match(cache['ve-PP']['text-below-custom-login-logo'], /logon al$/);
  assert.notEqual(cache['ve-PP']['custom-login-logo-image-url'], cache['ve-PP']['custom-login-logo-link-url']);
  const vepsSystemMetrics = {
  "OS_Arch": "OS: arhitektur",
  "OS_Cpus": "OS: CPU lugumär",
  "OS_Freemem": "OS: joudai mušt",
  "OS_Loadavg": "OS: keskmäine radmär",
  "OS_Platform": "OS: platform",
  "OS_Release": "OS: versii",
  "OS_Totalmem": "OS: kaik mušt",
  "OS_Type": "OS: tip",
  "OS_Uptime": "OS: radon aig",
  "memory-usage": "Mušton kävutand"
};
  for (const [key, value] of Object.entries(vepsSystemMetrics)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Käyttöjärjestelmä|vapaa muisti|kuorman keskiarvo|julkaisu|kokonaismäärä|ollut käynnissä|Muistin käyttö/, key);
  }
  assert.notEqual(cache['ve-PP']['OS_Freemem'], cache['ve-PP']['OS_Totalmem']);
  assert.match(cache['ve-PP']['OS_Freemem'], /joudai mušt/);
  assert.match(cache['ve-PP']['OS_Totalmem'], /kaik mušt/);
  assert.match(cache['ve-PP']['OS_Cpus'], /CPU lugumär/);
  assert.match(cache['ve-PP']['OS_Loadavg'], /keskmäine radmär/);
  assert.match(cache['ve-PP']['OS_Uptime'], /radon aig/);
  const vepsDateSearch = {
  "operator-created": "tehtud",
  "operator-modified": "vajehtadud",
  "predicate-created": "tehtud",
  "predicate-modified": "vajehtadud",
  "operator-sort": "järgenduz",
  "predicate-week": "nedal’",
  "predicate-month": "ku",
  "predicate-quarter": "voz’nelländez",
  "globalSearch-instructions-operator-created": "`__operator_created__:<n>` - kartad, miččed oma tehtud *<n>* päiväd tagaze libo vähemba",
  "globalSearch-instructions-operator-modified": "`__operator_modified__:<n>` - kartad, miččed oma vajehtadud *<n>* päiväd tagaze libo vähemba",
  "globalSearch-instructions-notes-3-2": "Päividen lugun voi märita pozitivine libo negativine kogonaine lugu, libo kävutada `__predicate_week__`, `__predicate_month__`, `__predicate_quarter__` libo `__predicate_year__` nügüdläižen aigkeskustan täht.",
  "globalSearch-instructions-notes-4": "Tekstan ecind ei erištele surid da penid kirjamid."
};
  for (const [key, value] of Object.entries(vepsDateSearch)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /luotu|muokattu|lajittele|viikko|kuukausi|kvartaali|kortit jotka|kortit joita|Päivät voidaan|Tekstihaut ovat/, key);
  }
  for (const [key, name] of [['predicate-created', 'createdAt'], ['predicate-modified', 'modifiedAt']]) {
    const sorted = new visibilityContext.Query();
    sorted.buildParams(`${cache['ve-PP']['operator-sort']}:${cache['ve-PP'][key]}`);
    assert.equal(sorted.hasErrors(), false, key);
    assert.equal(sorted.getQueryParams().getPredicate('sort').name, name, key);
  }
  for (const operator of ['created', 'modified']) {
    const invalidDate = new visibilityContext.Query();
    invalidDate.buildParams(`${cache['ve-PP'][`operator-${operator}`]}:NONNUMERIC`);
    assert.equal(invalidDate.hasErrors(), true, operator);
    const key = `globalSearch-instructions-operator-${operator}`;
    assert.match(vepsTranslator.t(key, { [`operator_${operator}`]: cache['ve-PP'][`operator-${operator}`] }), /päiväd tagaze libo vähemba/);
  }
  const periods = Object.fromEntries(['week', 'month', 'quarter', 'year'].map(period => [`predicate_${period}`, cache['ve-PP'][`predicate-${period}`]]));
  const periodText = vepsTranslator.t('globalSearch-instructions-notes-3-2', periods);
  for (const value of Object.values(periods)) assert.ok(periodText.includes(value));
  assert.match(periodText, /pozitivine libo negativine kogonaine lugu/);
  assert.match(cache['ve-PP']['globalSearch-instructions-notes-4'], /ei erištele surid da penid kirjamid/);
  const vepsOperatorInstructions = {
  "operator-label": "znam",
  "operator-due": "märaig",
  "predicate-due": "märaig",
  "globalSearch-instructions-operator-label": "`__operator_label__:<color>` `__operator_label__:<name>` - kartad, miččil om znam, miččen muju om *<color>* libo nimi om *<name>*",
  "globalSearch-instructions-operator-at": "`__operator_user_abbrev__username` - lühetud `kävutai:<username>`",
  "globalSearch-instructions-operator-status": "`__operator_status__:<status>` - *<status>* om üks neciš:",
  "globalSearch-instructions-operator-sort": "`__operator_sort__:<sort-name>` - *<sort-name>* om üks neciš: `__predicate_due__`, `__predicate_created__` libo `__predicate_modified__`. Vastkarižen järgendusen täht pane `-` nimen edele.",
  "globalSearch-instructions-operator-limit": "`__operator_limit__:<n>` - *<n>* om kogonaine lugu, mi om suremb 0: kartoiden lugumär joga lehtpolel."
};
  for (const [key, value] of Object.entries(vepsOperatorInstructions)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.doesNotMatch(value, /nimilappu|erääntyy|kortit joilla|lyhenne|jossa|Laskevaa|positiivinen kokonaisluku/, key);
  }
  const descendingDate = new visibilityContext.Query();
  descendingDate.buildParams(`${cache['ve-PP']['operator-sort']}:-${cache['ve-PP']['predicate-due']}`);
  assert.equal(descendingDate.hasErrors(), false);
  assert.equal(descendingDate.getQueryParams().getPredicate('sort').name, 'dueAt');
  assert.equal(descendingDate.getQueryParams().getPredicate('sort').order, 'des');
  for (const value of ['LABEL_VALUE', 'COLOR_VALUE']) {
    const labelQuery = new visibilityContext.Query();
    labelQuery.buildParams(`${cache['ve-PP']['operator-label']}:${value}`);
    assert.equal(labelQuery.hasErrors(), false);
    assert.equal(labelQuery.getQueryParams().getPredicate('label'), value);
  }
  assert.match(cache['ve-PP']['globalSearch-instructions-operator-label'], /\*<color>\* libo nimi om \*<name>\*/);
  assert.match(cache['ve-PP']['globalSearch-instructions-operator-sort'], /pane `-` nimen edele/);
  assert.match(vepsTranslator.t('globalSearch-instructions-operator-at', { operator_user_abbrev: '@' }), /`@username`.*`kävutai:<username>`/);
  assert.match(vepsTranslator.t('globalSearch-instructions-operator-limit', { operator_limit: cache['ve-PP']['operator-limit'] }), /suremb 0.*joga lehtpolel/);
  const vepsMonitoring = {
  "app-try-reconnect": "Ladi ühtenzoitta udes.",
  "monitoring-export-failed": "Ei voind tehta tarkištelendan tedoiden irdalevendad",
  "monitoring-refresh-failed": "Ei voind udištada tarkištelendan tedoid",
  "attachment-monitoring": "Tartutadud failoiden tarkištelend",
  "export-monitoring": "Tehta tarkištelendan irdalevend",
  "refresh-monitoring": "Udišta tarkištelendan tedod",
  "server-error-troubleshooting": "Oigenda serveran sündutadud viga.\nSnap-panendal kävuta: `sudo snap logs wekan.wekan`\nDocker-panendal kävuta: `sudo docker logs wekan-app`"
};
  for (const [key, value] of Object.entries(vepsMonitoring)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Yritä muodostaa|Seurannan|Liitteiden seuranta|Vie seuranta|Päivitä seuranta|Ole hyvä ja lähetä|asennuksessa/, key);
  }
  for (const key of ['monitoring-export-failed', 'monitoring-refresh-failed']) assert.match(cache['ve-PP'][key], /^Ei voind/);
  assert.notEqual(cache['ve-PP']['monitoring-export-failed'], cache['ve-PP']['monitoring-refresh-failed']);
  assert.match(cache['ve-PP']['app-try-reconnect'], /Ladi.*udes/);
  assert.deepEqual([...cache['ve-PP']['server-error-troubleshooting'].matchAll(/`([^`]+)`/g)].map(match => match[1]), ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']);
  assert.match(cache['ve-PP']['server-error-troubleshooting'], /serveran sündutadud viga/);
  const vepsStarWidth = {
  "click-to-star": "Painda, miše znamoita nece laud tähthanke.",
  "click-to-unstar": "Painda, miše heitta necen laudan tähthan znam.",
  "star-board-title": "Painda, miše znamoita nece laud tähthanke. Nece laud nägub sinun laudoiden lugetišen ülähän.",
  "starred-boards-description": "Tähthanke znamoitud laudad näguba sinun laudoiden lugetišen ülähän.",
  "click-to-enable-auto-width": "Lugetišen avtomatine leveduz’ om sammutadud. Painda pälepanendaks.",
  "click-to-disable-auto-width": "Lugetišen avtomatine leveduz’ om päl. Painda sammutandaks."
};
  for (const [key, value] of Object.entries(vepsStarWidth)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Klikkaa|Tähdellä merkatut|taululistallasi|Automaattinen listan|käytössä|ottaa.*käyttöön/, key);
  }
  assert.match(cache['ve-PP']['click-to-enable-auto-width'], /om sammutadud.*pälepanendaks/);
  assert.match(cache['ve-PP']['click-to-disable-auto-width'], /om päl.*sammutandaks/);
  assert.notEqual(cache['ve-PP']['click-to-star'], cache['ve-PP']['click-to-unstar']);
  for (const key of ['star-board-title', 'starred-boards-description']) assert.match(cache['ve-PP'][key], /lugetišen ülähän/);
  const vepsConsentNotifications = {
  "acceptance_of_our_legalNotice": "Jatkmal sinä hökkähtad meiden",
  "legalNotice": "juridižehe homaičusehe",
  "muted-info": "Sinä ed sa nikonz tedotusid necen laudan vajehtusiš.",
  "notify-participate": "Sada tedotusid kaikiš kartoiš, miččil sinä oled tegii libo ühtnik",
  "notify-watch": "Sada tedotusid kaikiš laudoiš, lugetišiš libo kartoiš, miččiden täht sinä oled pandud kacelusen päle.",
  "auto-watch": "Pane kaceluz päle avtomatižesti laudoiden tegendan aigan",
  "watch": "Pane kaceluz päle",
  "watching": "Kaceluz om päl"
};
  for (const [key, value] of Object.entries(vepsConsentNotifications)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Jatkamalla|hyväksyt|oikeudellisen|Et saa koskaan|Vastaanota päivityksiä|Automaattisesti seuraa|Seuraa|Seurataan/, key);
  }
  assert.equal(vepsTranslator.t('acceptance_of_our_legalNotice') + ' ' + vepsTranslator.t('legalNotice'), 'Jatkmal sinä hökkähtad meiden juridižehe homaičusehe');
  assert.match(cache['ve-PP']['muted-info'], /ed sa nikonz tedotusid/);
  assert.match(cache['ve-PP']['notify-participate'], /tegii libo ühtnik/);
  assert.match(cache['ve-PP']['notify-watch'], /laudoiš, lugetišiš libo kartoiš.*kacelusen päle/);
  assert.match(cache['ve-PP']['auto-watch'], /avtomatižesti.*tegendan aigan/);
  assert.notEqual(cache['ve-PP']['watch'], cache['ve-PP']['watching']);
  const vepsHeapMetrics = {
  "Node_heap_total_heap_size": "Node mušton kogo: kogon kaik suruz’",
  "Node_heap_total_heap_size_executable": "Node mušton kogo: kodan täht erigoittud kogon suruz’",
  "Node_heap_total_physical_size": "Node mušton kogo: kaik fizikaline suruz’",
  "Node_heap_total_available_size": "Node mušton kogo: kävutandaha joudai suruz’",
  "Node_heap_used_heap_size": "Node mušton kogo: kävutadud kogon suruz’",
  "Node_heap_heap_size_limit": "Node mušton kogo: kogon suruden röun",
  "Node_heap_malloced_memory": "Node mušton kogo: malloc-jagatud mušt",
  "Node_heap_peak_malloced_memory": "Node mušton kogo: malloc-mušton maksimaline mär",
  "Node_heap_does_zap_garbage": "Node mušton kogo: --zap_code_space om päl (0/1)",
  "Node_heap_number_of_native_contexts": "Node mušton kogo: nativkontekstoiden lugumär",
  "Node_heap_number_of_detached_contexts": "Node mušton kogo: erigoittud kontekstoiden lugumär"
};
  for (const [key, value] of Object.entries(vepsHeapMetrics)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /keko|keon|kokonaiskoko|käytettävissä|käytetty|kokorajoitus|virheellisen|kerää roskat|lukumäärä|irrotettujen/, key);
  }
  assert.match(vepsTranslator.t('Node_heap_peak_malloced_memory'), /malloc-mušton maksimaline mär/);
  assert.notEqual(vepsTranslator.t('Node_heap_peak_malloced_memory'), vepsTranslator.t('Node_heap_malloced_memory'));
  assert.equal(vepsTranslator.t('Node_heap_does_zap_garbage'), 'Node mušton kogo: --zap_code_space om päl (0/1)');
  assert.notEqual(vepsTranslator.t('Node_heap_total_heap_size'), vepsTranslator.t('Node_heap_total_heap_size_executable'));
  assert.notEqual(vepsTranslator.t('Node_heap_total_available_size'), vepsTranslator.t('Node_heap_used_heap_size'));
  assert.match(vepsTranslator.t('Node_heap_number_of_detached_contexts'), /erigoittud kontekstoiden lugumär/);
  const vepsBoardScheduling = {
  "add-cron-job": "Liža märitud aiganke radod",
  "add-cron-job-placeholder": "Märitud aiganke radon ližandan funkcii tuleb pigai",
  "schedule-board-archive": "Märita laudan arhivaha sirttandan aig",
  "schedule-board-backup": "Märita laudan varmkopijan tegendan aig",
  "schedule-board-cleanup": "Märita laudan puhtastandan aig",
  "board-archive-failed": "Ei voind märita laudan arhivaha sirttandan aigad",
  "board-archive-scheduled": "Laudan arhivaha sirttandan aig om hüvin märitud",
  "board-backup-failed": "Ei voind märita laudan varmkopijan tegendan aigad",
  "board-backup-scheduled": "Laudan varmkopijan tegendan aig om hüvin märitud",
  "board-cleanup-failed": "Ei voind märita laudan puhtastandan aigad",
  "board-cleanup-scheduled": "Laudan puhtastandan aig om hüvin märitud",
  "scheduled-board-operations": "Märitud aiganke laudan radod",
  "search-boards-or-operations": "Eci laudoid libo radoid...",
  "cleanup": "Puhtastand",
  "cleanup-old-jobs": "Puhtasta vanhad radod",
  "operation-type": "Radon tip"
};
  for (const [key, value] of Object.entries(vepsBoardScheduling)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Ajastetun|ajastettu|Aikatauluta|Taulun|epäonnistui|onnistuneesti|Siivous|Siivoa|Toiminnon|Etsi tauluja|Lisää ajastettu/, key);
  }
  for (const operation of ['archive', 'backup', 'cleanup']) {
    assert.match(vepsTranslator.t('board-' + operation + '-failed'), /^Ei voind märita .* aigad$/);
    assert.match(vepsTranslator.t('board-' + operation + '-scheduled'), /aig om hüvin märitud$/);
    assert.notEqual(vepsTranslator.t('board-' + operation + '-failed'), vepsTranslator.t('board-' + operation + '-scheduled'));
  }
  assert.match(vepsTranslator.t('add-cron-job-placeholder'), /funkcii tuleb pigai$/);
  assert.match(vepsTranslator.t('search-boards-or-operations'), /laudoid libo radoid/);
  assert.notEqual(vepsTranslator.t('schedule-board-backup'), vepsTranslator.t('schedule-board-cleanup'));
  const vepsPresenceSearch = {
  "operator-has": "om",
  "predicate-attachment": "tartutadud",
  "predicate-description": "kirjutuz",
  "predicate-checklist": "kodvindlugetiž",
  "predicate-start": "augotiž",
  "predicate-end": "lop",
  "predicate-assignee": "märitud",
  "predicate-member": "ühtnik",
  "globalSearch-instructions-operators": "Kävutandaha joudajad operatorad:",
  "globalSearch-instructions-operator-has": "`__operator_has__:<field>` - *<field>* om üks neciš: `__predicate_attachment__`, `__predicate_checklist__`, `__predicate_description__`, `__predicate_start__`, `__predicate_due__`, `__predicate_end__`, `__predicate_assignee__` libo `__predicate_member__`. Pane `-` *<field>* edele, miše ecta kartoid, miččil ei ole necen pöudon znamoičendad (näute: `om:-märaig` ecib kartoid ilma märaigata)."
};
  for (const [key, value] of Object.entries(vepsPresenceSearch)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /sisältää|liitetiedosto|kuvaus|tarkistuslista|alkaa|loppuu|käsittelijä|jäsen|Saatavilla olevat|jossa|Laittamalla/, key);
  }
  for (const [key, field] of [['predicate-attachment', 'attachment'], ['predicate-description', 'description'], ['predicate-checklist', 'checklist'], ['predicate-start', 'startAt'], ['predicate-due', 'dueAt'], ['predicate-end', 'endAt'], ['predicate-assignee', 'assignees'], ['predicate-member', 'members']]) {
    for (const absent of [false, true]) {
      const parsed = new visibilityContext.Query();
      parsed.buildParams(`${cache['ve-PP']['operator-has']}:${absent ? '-' : ''}${cache['ve-PP'][key]}`);
      assert.equal(parsed.hasErrors(), false, key);
      assert.deepEqual(JSON.parse(JSON.stringify(parsed.getQueryParams().getPredicate('has'))), { field, exists: !absent }, key);
    }
  }
  const invalidPresence = new visibilityContext.Query();
  invalidPresence.buildParams('om:nonexistent-field');
  assert.equal(invalidPresence.hasErrors(), true);
  assert.match(vepsTranslator.t('globalSearch-instructions-operator-has'), /`om:-märaig`.*ilma märaigata/);
  const vepsBooleanNotes = {
  "globalSearch-instructions-notes-2": "Ühtejiččed operatorad ühtenzoitadas *LIBO*-kodvindanke. Näguba kartad, miččil om hot' üks neciš kodvindiš.\n`__operator_list__:Joudai __operator_list__:Seižutadud` ozutab kartoid lugetišiš *Joudai* libo *Seižutadud*.",
  "globalSearch-instructions-notes-3": "Erazvuiččed operatorad ühtenzoitadas *DA*-kodvindanke. Näguba vaiše kartad, miččil oma kaik neced kodvindad. `__operator_list__:Joudai __operator_label__:rusked` ozutab vaiše kartoid lugetišes *Joudai* *rusked*-znamanke."
};
  for (const [key, value] of Object.entries(vepsBooleanNotes)) {
    assert.equal(vepsTranslator.t(key), value);
    assert.doesNotMatch(value, /Samankaltaiset|operaattorit|TAI|Kortit|Eri operaattorit|Saatavilla|Blokattu|punainen/);
  }
  assert.match(vepsTranslator.t('globalSearch-instructions-notes-2'), /LIBO.*hot' üks/s);
  assert.match(vepsTranslator.t('globalSearch-instructions-notes-3'), /DA.*vaiše.*kaik/s);
  const sameOperatorExample = new visibilityContext.Query();
  sameOperatorExample.buildParams(`${cache['ve-PP']['operator-list']}:Joudai ${cache['ve-PP']['operator-list']}:Seižutadud`);
  assert.equal(sameOperatorExample.hasErrors(), false);
  assert.deepEqual(Array.from(sameOperatorExample.getQueryParams().getPredicates('list')), ['Joudai', 'Seižutadud']);
  const mixedOperatorExample = new visibilityContext.Query();
  mixedOperatorExample.buildParams(`${cache['ve-PP']['operator-list']}:Joudai ${cache['ve-PP']['operator-label']}:rusked`);
  assert.equal(mixedOperatorExample.hasErrors(), false);
  assert.equal(mixedOperatorExample.getQueryParams().getPredicate('list'), 'Joudai');
  assert.equal(mixedOperatorExample.getQueryParams().getPredicate('label'), 'rusked');
  const vepsClipboardDescriptions = {
  "clipboard": "Tedokaičuz libo vedä da pästa",
  "copy-card-link-to-clipboard": "Kopirui kartan link tedokaičusehe",
  "copy-link-to-clipboard": "Kopirui link tedokaičusehe",
  "copy-text-to-clipboard": "Kopirui tekst tedokaičusehe",
  "paste-or-dragdrop": "miše panda, libo vedä da pästa kuvafail sihe (vaiše kuva)",
  "rescue-card-description": "Ozuta dialog edel sidä, ku sinä sauptad kartan, ku kartan kuvadand ei ole kaitud",
  "rescue-card-description-dialogue": "Vajehtada kartan nügüdläine kuvadand sinun vajehtusil?"
};
  for (const [key, value] of Object.entries(vepsClipboardDescriptions)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Leikepöytä|Kopioi|leikepöydälle|liittääksesi|pudota|Näytä|tallentamattomien|Korvataanko|muutoksillasi/, key);
  }
  assert.match(vepsTranslator.t('copy-card-link-to-clipboard'), /kartan link/);
  assert.match(vepsTranslator.t('copy-text-to-clipboard'), /tekst tedokaičusehe/);
  assert.notEqual(vepsTranslator.t('copy-text-to-clipboard'), vepsTranslator.t('copy-link-to-clipboard'));
  assert.equal(cache['ve-PP']['copy-to-clipboard'], 'Kopirui buferha', 'preserve the existing correct Veps translation');
  assert.match(vepsTranslator.t('paste-or-dragdrop'), /panda.*vedä da pästa.*\(vaiše kuva\)/);
  assert.match(vepsTranslator.t('rescue-card-description'), /edel sidä.*sauptad kartan.*kuvadand ei ole kaitud/);
  assert.match(vepsTranslator.t('rescue-card-description-dialogue'), /^Vajehtada.*nügüdläine.*sinun vajehtusil\?$/);
  const vepsArchiveDeletion = {
  "archive-all": "Sirdä kaik arhivaha",
  "archive-board": "Sirdä laud arhivaha",
  "archive-card": "Sirdä kart arhivaha",
  "archive-list": "Sirdä lugetiž arhivaha",
  "archive-selection": "Sirdä valičuz arhivaha",
  "archiveBoardPopup-title": "Sirtta laud arhivaha?",
  "archived-boards": "Laudad arhivas",
  "close-board": "Saupta laud",
  "archived": "Arhivaha sirttud",
  "archived-at": "arhivaha sirttud",
  "close-board-pop": "Sinä void endištada laudan, ku paindad “Arhiv”-knopkad kodilehtpolen ülähäižes osas.",
  "delete-linked-card-before-this-card": "Sinä ed voi heitta necen kartan edel sidä, ku heitad ühtenzoittud kartan, kudambal om",
  "delete-linked-cards-before-this-list": "Sinä ed voi heitta necen lugetišen edel sidä, ku heitad ühtenzoittud kartad, miččed ozutaba kartoihe neces lugetišes"
};
  for (const [key, value] of Object.entries(vepsArchiveDeletion)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Siirrä|Arkistoon|Taulut|Arkistossa|Sulje taulu|Arkistoitu|arkistoitu|Voit palauttaa|Et voi poistaa|ennenkuin|linkitetyn|linkitetyt/, key);
  }
  assert.equal(cache['ve-PP'].archive, 'Sirdä arhivaha', 'preserve existing correct archive label');
  assert.match(vepsTranslator.t('close-board-pop'), /endištada.*“Arhiv”.*kodilehtpolen/);
  assert.match(vepsTranslator.t('delete-linked-card-before-this-card'), /ed voi heitta.*edel sidä.*ühtenzoittud kartan.*kudambal om$/);
  assert.match(vepsTranslator.t('delete-linked-cards-before-this-list'), /ed voi heitta.*edel sidä.*ühtenzoittud kartad.*ozutaba kartoihe neces lugetišes/);
  assert.ok((vepsTranslator.t('delete-linked-card-before-this-card') + ' linkedId: CARD_ID').endsWith('kudambal om linkedId: CARD_ID'));
  assert.notEqual(vepsTranslator.t('archive-card'), vepsTranslator.t('archive-list'));
  assert.ok(vepsTranslator.t('archiveBoardPopup-title').endsWith('?'));
  const vepsMemoryUsage = {
  "Node_memory_usage_rss": "Node mušton kävutand: RAM-as kävutadud mušton suruz’ (RSS)",
  "Node_memory_usage_heap_total": "Node mušton kävutand: jagatud mušton kogon kaik suruz’",
  "Node_memory_usage_heap_used": "Node mušton kävutand: todesine kävutadud mušt",
  "Node_memory_usage_external": "Node mušton kävutand: irdpoline mušt"
};
  for (const [key, value] of Object.entries(vepsMemoryUsage)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /muistin käyttö|pysyväksi asetettu|varattu keon|kokonaiskoko|todellinen käytetty|ulkoinen/, key);
  }
  assert.match(vepsTranslator.t('Node_memory_usage_rss'), /RAM-as.*\(RSS\)/);
  assert.match(vepsTranslator.t('Node_memory_usage_heap_total'), /jagatud.*kogon kaik suruz’/);
  assert.match(vepsTranslator.t('Node_memory_usage_heap_used'), /todesine kävutadud mušt/);
  assert.match(vepsTranslator.t('Node_memory_usage_external'), /irdpoline mušt/);
  assert.equal(new Set(Object.values(vepsMemoryUsage)).size, 4, 'all four metrics remain distinct');
  const vepsNotificationReadState = {
  "filter-by-unread": "Puhtasta tedotuzed, miččid ei ole lugedud",
  "mark-all-as-read": "Znamoiče kaik kut lugedud",
  "mark-all-as-unread": "Znamoiče kaik kut lugematomad",
  "remove-all-read": "Heitä kaik lugedud tedotuzed"
};
  for (const [key, value] of Object.entries(vepsNotificationReadState)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Suodata|lukemattomat|Merkkaa|kaikki|luetuksi|lukemattomaksi|Poista|luetut/, key);
  }
  assert.match(vepsTranslator.t('filter-by-unread'), /Puhtasta.*ei ole lugedud/);
  assert.match(vepsTranslator.t('mark-all-as-read'), /^Znamoiče kaik kut lugedud$/);
  assert.match(vepsTranslator.t('mark-all-as-unread'), /^Znamoiče kaik kut lugematomad$/);
  assert.match(vepsTranslator.t('remove-all-read'), /^Heitä kaik lugedud tedotuzed$/);
  assert.equal(new Set(Object.values(vepsNotificationReadState)).size, 4);
  assert.equal(cache['ve-PP']['card-has-unread-comments'], 'Om sel’genzoitusid, miččid ei ole lugedud', 'retain the existing correct unread-comment phrase');
  const vepsFileStorageGuidance = {
  "avatars-path": "Kävutajan kuvan failoiden te",
  "avatars-path-description": "Te kävutajan kuvan failoiden kaičusen täht",
  "writable-path": "Te, kudambale voib kirjutada",
  "writable-path-description": "Pähodran te failoiden kaičusen täht",
  "invalid-file": "Ku failan nimi ei ole lasktud, samine libo nimenvajehtuz heittas."
};
  for (const [key, value] of Object.entries(vepsFileStorageGuidance)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Profiilikuvien|polku|Polku jossa|tallennetaan|Kirjoitettava|Perushakemisto|tallennukseen|Jos tiedostonimi|liittäminen|uudelleennimeäminen|perutaan/, key);
  }
  assert.match(vepsTranslator.t('avatars-path-description'), /kävutajan kuvan failoiden kaičusen/);
  assert.match(vepsTranslator.t('writable-path'), /voib kirjutada/);
  assert.match(vepsTranslator.t('writable-path-description'), /^Pähodran te/);
  assert.match(vepsTranslator.t('invalid-file'), /^Ku failan nimi ei ole lasktud, samine libo nimenvajehtuz heittas\.$/);
  assert.equal(cache['ve-PP']['attachments-path'], 'Tartutadud failoiden te', 'retain the correct existing attachment path');
  const vepsBoardViewLabels = {
  "board-view": "Laudan nägo",
  "board-view-cal": "Kalendar'",
  "board-view-multiboard-cal": "Äjiden laudoiden kalendar'",
  "board-view-swimlanes": "Ujundšoidud",
  "board-view-lists": "Lugetišed",
  "board-view-table": "Tablic",
  "board-view-time": "Aig",
  "board-view-collapse": "Penenda",
  "board-view-timeline-now": "Nügüd’"
};
  for (const [key, value] of Object.entries(vepsBoardViewLabels)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Taulunäkymä|Kalenteri|Kaikki taulut|Uimaradat|Listat|Taulukko|Pienennä|Zwino/, key);
  }
  assert.equal(vepsTranslator.t('board-view-cal'), cache['ve-PP'].calendar);
  assert.equal(vepsTranslator.t('board-view-lists'), cache['ve-PP'].lists);
  assert.equal(vepsTranslator.t('board-view-time'), cache['ve-PP'].time);
  assert.notEqual(vepsTranslator.t('board-view-cal'), vepsTranslator.t('board-view-multiboard-cal'));
  assert.match(vepsTranslator.t('board-view-multiboard-cal'), /Äjiden laudoiden/);
  assert.equal(cache['ve-PP']['board-view-gantt'], 'Gantt', 'retain the chart proper name');
  const neapolitanItems = require('i18next').createInstance();
  await neapolitanItems.init({ lng: 'nap', fallbackLng: false, keySeparator: false, resources: { nap: { translation: cache.nap } } });
  assert.equal(neapolitanItems.t('r-item'), 'alimento');
  assert.equal(neapolitanItems.t('r-items-list'), 'alimento1,alimento2,alimento3');
  assert.deepEqual(neapolitanItems.t('r-items-list').split(','), [1, 2, 3].map(n => neapolitanItems.t('r-item') + n));
  assert.doesNotMatch(neapolitanItems.t('r-items-list'), /elemento/);
  const vepsActionChoice = {
  "disambiguateMultiLabelPopup-title": "Valiče znaman tegend",
  "disambiguateMultiMemberPopup-title": "Valiče ühtnikan tegend",
  "what-to-do": "Midä sinä tahtoid tehta?",
  "unassign-member": "Heitä ühtnik kartaspäi"
};
  for (const [key, value] of Object.entries(vepsActionChoice)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Yksikäsitteistä|nimilapputoiminta|jäsentoiminta|Mitä haluat|Peru jäsenvalinta/, key);
  }
  assert.notEqual(vepsTranslator.t('disambiguateMultiLabelPopup-title'), vepsTranslator.t('disambiguateMultiMemberPopup-title'));
  assert.match(vepsTranslator.t('unassign-member'), /^Heitä ühtnik kartaspäi$/);
  assert.equal(cache['ve-PP']['assign-member'], 'Märiče ühtnik', 'retain existing correct assignment wording');
  assert.equal(cache['ve-PP']['remove-label'], 'Heitä znam', 'retain existing correct label-removal wording');
  const localizedPersianCalendars = {
  "ff": "Haatumeere Jalali (Perseere)",
  "bm": "Jalali kalandiriye (perisanikan)"
};
  for (const [locale, value] of Object.entries(localizedPersianCalendars)) {
    const translator = require('i18next').createInstance();
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false, resources: { [locale]: { translation: cache[locale] } } });
    assert.equal(translator.t('calendar-system-jalali'), value);
    assert.match(value, /Jalali/);
    assert.doesNotMatch(value, /Fars|Persian/);
    assert.notEqual(translator.t('calendar-system-jalali'), translator.t('calendar-system-islamic'));
  }
  const eweCalendar = require('i18next').createInstance();
  await eweCalendar.init({ lng: 'ee', fallbackLng: false, keySeparator: false, resources: { ee: { translation: cache.ee } } });
  assert.equal(eweCalendar.t('calendar-system-islamic-civil'), 'islam subɔlawo ƒe sivil kalenda');
  assert.doesNotMatch(eweCalendar.t('calendar-system-islamic-civil'), /Islamic civil/);
  assert.notEqual(eweCalendar.t('calendar-system-islamic-civil'), eweCalendar.t('calendar-system-islamic'));
  const vepsWildcardAndShortcut = {
  "r-board-note": "Homaiče: jäta pöud tühjaks. Tühj pöud sättub jogaha voimusižehe znamoičendaha.",
  "quick-access-description": "Znamoiče laud tähthanke, miše ližata laudan link necile šoidule."
};
  for (const [key, value] of Object.entries(vepsWildcardAndShortcut)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Huom:|jätä kenttä|tyhjäksi|täsmätäksesi|mahdolliseen arvoon|Merkkaa taulu|tähdellä|pikavalinta|palkkiin/, key);
  }
  assert.match(vepsTranslator.t('r-board-note'), /jäta pöud tühjaks.*jogaha voimusižehe znamoičendaha/);
  assert.match(vepsTranslator.t('quick-access-description'), /Znamoiče laud tähthanke.*ližata laudan link necile šoidule/);
  assert.equal(cache['ve-PP']['click-to-star'], 'Painda, miše znamoita nece laud tähthanke.', 'preserve the existing star hint');
  assert.equal(vepsTranslator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'SWIMLANE', board: 'BOARD' }),
    'Nimiti sinud kartal CARD: COMMENT lugetišes LIST ujundšoidul SWIMLANE laudal BOARD');
  assert.doesNotMatch(cache['ve-PP']['act-atUserComment'], /mainitsi sinut|kortilla|listalla|uimaradalla|taululla/);
  const vepsSubtaskControls = {
  "default-subtasks-board": "Alategendad laudale __board__",
  "subtask-settings": "Alategendoiden sändod",
  "deposit-subtasks-board": "Pane alategendad necile laudale:",
  "deposit-subtasks-list": "Lugetiž sihe pandud alategendoiden täht:",
  "subtaskDeletePopup-title": "Heitta alategend?",
  "export-card-subtasks": "Alategendad",
  "subtaskActionsPopup-title": "Alategendan tegendad",
  "show-subtasks-field": "Ozuta alategendoiden pöud",
  "add-existing-card-as-subtask-empty": "Kartoid, miččed sättuba kodvindoihe, ei ole löutud."
};
  for (const [key, value] of Object.entries(vepsSubtaskControls)) {
    assert.equal(cache['ve-PP'][key], value, key);
    const rendered = vepsTranslator.t(key, { board: 'BOARD' });
    assert.equal(rendered, value.replace('__board__', 'BOARD'), key);
    assert.doesNotMatch(rendered, /Alitehtäv|Talleta|Laskeutumislista|alatehtäville|Poista alitehtävä|Näytä alitehtävät|Kortteja ei löytynyt/, key);
  }
  assert.match(vepsTranslator.t('deposit-subtasks-board'), /laudale:$/);
  assert.match(vepsTranslator.t('deposit-subtasks-list'), /^Lugetiž.*alategendoiden/);
  assert.match(vepsTranslator.t('add-existing-card-as-subtask-empty'), /sättuba kodvindoihe.*ei ole löutud/);
  assert.ok(vepsTranslator.t('subtaskDeletePopup-title').endsWith('?'));
  assert.equal(cache['ve-PP'].subtasks, 'Alategendad', 'retain the existing correct subtask heading');
  const vepsWorkspaceControls = {
  "allboards.workspaces": "Tötilad",
  "allboards.add-workspace": "Ližada tötila",
  "allboards.add-workspace-prompt": "Tötilan nimi",
  "allboards.add-subworkspace": "Ližada alatötila",
  "allboards.add-subworkspace-prompt": "Alatötilan nimi",
  "allboards.edit-workspace": "Vajehta tötila",
  "allboards.edit-workspace-name": "Tötilan nimi",
  "allboards.edit-workspace-icon": "Tötilan ikon (markdown)",
  "allboards.workspace-menu": "Tötilan menülist",
  "workspace-settings": "Tötilan valičused",
  "workspaceActionsPopup-title": "Tötilan valičused",
  "addWorkspacePopup-title": "Ližada tötila",
  "allboards.delete-workspace-confirm-check": "Vahvištoita tötilan heittand"
};
  for (const [key, value] of Object.entries(vepsWorkspaceControls)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Työtila|työtila|Alityötila|alityötila|Lisää|Muokkaa|Varmista|asetukset|valikko/, key);
  }
  assert.notEqual(vepsTranslator.t('allboards.add-workspace-prompt'), vepsTranslator.t('allboards.add-subworkspace-prompt'));
  assert.match(vepsTranslator.t('allboards.edit-workspace-icon'), /\(markdown\)$/);
  assert.equal(cache['ve-PP']['allboards.delete-workspace-confirm'], 'Tahod-ik heitta necen tötilan?', 'preserve existing Veps confirmation');
  const vepsDragControls = {
  "board-drag-drop-reorder-or-click-open": "Vajehta laudoiden ikonoiden jäl’genduz: vedä da pästa. Painda laudan ikon, miše avaita laud.",
  "board-open-and-move-between-remaining-and-workspaces": "Painda, miše avaita laud. Vedä pidim, miše panda laud __workspaces__ (pästa tötilaha čuramenülistas).",
  "drag-board-to-workspace": "Vedä laud, miše panda se __workspaces__ (pästa tötilaha čuramenülistas)",
  "drag-board": "Vedä laud",
  "show-desktop-drag-handles": "Ozuta radpöudon vedändan pidimed",
  "sidebar-open": "Avaida čuramenülist",
  "sidebar-close": "Saupta čuramenülist",
  "drag-to-resize-sidebar": "Vedä, miše vajehtada čuramenülistan suruz’"
};
  for (const [key, value] of Object.entries(vepsDragControls)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, { workspaces: 'WORKSPACES' }), value.replace('__workspaces__', 'WORKSPACES'), key);
    assert.doesNotMatch(value, /Järjestele|taulu|Klikkaa|Avaa|kahvaa|pudota|työtila|sivupalk|Sulje|Näytä|Kokodza|shandukisa/, key);
  }
  assert.match(vepsTranslator.t('board-drag-drop-reorder-or-click-open'), /vedä da pästa.*Painda/);
  assert.match(vepsTranslator.t('board-open-and-move-between-remaining-and-workspaces', { workspaces: 'WORKSPACES' }), /Painda.*Vedä pidim.*WORKSPACES.*pästa tötilaha/);
  assert.notEqual(vepsTranslator.t('sidebar-open'), vepsTranslator.t('sidebar-close'));
  assert.match(vepsTranslator.t('drag-to-resize-sidebar'), /^Vedä.*suruz’$/);
  assert.equal(cache['ve-PP']['shortcut-toggle-sidebar'], 'Ozuta libo peitä laudan čuramenülist', 'retain existing sidebar terminology');
  assert.equal(vepsTranslator.t('estimated-time-remaining'), 'Arvosteldud jänu aig');
  assert.doesNotMatch(vepsTranslator.t('estimated-time-remaining'), /Arvioitu|jäljellä oleva aika/);
  assert.equal(vepsTranslator.t('shortcut-filter-my-assigned-cards'), 'Puhtasta minei märitud kartad');
  assert.doesNotMatch(vepsTranslator.t('shortcut-filter-my-assigned-cards'), /sinei/);
  assert.equal(cache['ve-PP']['shortcut-filter-my-cards'], 'Puhtasta minun kartad', 'retain distinct own-card filter');
  assert.equal(cache['ve-PP']['shortcut-assign-self'], 'Märiče ičtaze nügüdläižele kartale', 'retain distinct self-assignment action');
  const vepsAnnouncementsAndRepositories = {
  "admin-announcement": "Tedotuz",
  "admin-announcement-active": "Aktivine tedotuz kaiken sisteman täht",
  "admin-announcement-title": "Administratoran tedotuz",
  "available-repositories": "Kävutandaha joudai repod",
  "repositories": "Repod",
  "repository-name": "Repon nimi",
  "no-repositories": "Repoid ei ole löutud",
  "create-repository": "Tege repo",
  "upload-repository": "Sa/Udišta repo",
  "sign-in-to-upload": "Tule sistemaha, miše sada repoid"
};
  for (const [key, value] of Object.entries(vepsAnnouncementsAndRepositories)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Ilmoitus|ilmoitus|Aktiivinen|järjestelmänlaajuinen|ylläpitäjältä|Käytettävissä|Repot|Repoja|Luo|Uppaa|Päivitä|Kirjaudu|upataksesi/, key);
  }
  assert.match(vepsTranslator.t('admin-announcement-active'), /Aktivine.*kaiken sisteman/);
  assert.match(vepsTranslator.t('upload-repository'), /^Sa\/Udišta/);
  assert.match(vepsTranslator.t('sign-in-to-upload'), /^Tule sistemaha.*sada repoid$/);
  assert.equal(cache['ve-PP'].repository, 'Repo', 'retain the existing technical repository noun');
  const vepsDeviceControls = {
  "desktop-mode": "Radpöudon režim",
  "mobile-mode": "Matkladehen režim",
  "mobile-desktop-toggle": "Vajehta matkladehen režiman da radpöudon režiman keskes",
  "preview-pdf-not-supported": "Sinun ladeh ei voi ozutada PDF-ezikacundad. Ladi sen sijas panda fail muštho."
};
  for (const [key, value] of Object.entries(vepsDeviceControls)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Työpöytätila|Mobiilitila|Vaihda|mobiili-|työpöytätilan|Laitteesi|esikatselua|Yritä|ladata/, key);
  }
  assert.notEqual(vepsTranslator.t('desktop-mode'), vepsTranslator.t('mobile-mode'));
  assert.match(vepsTranslator.t('mobile-desktop-toggle'), /matkladehen režiman.*radpöudon režiman/);
  assert.match(vepsTranslator.t('preview-pdf-not-supported'), /ei voi ozutada PDF-ezikacundad.*sen sijas panda fail muštho/);
  assert.equal(cache['ve-PP'].download, 'Pane muštho kut fail', 'retain existing download action');
  assert.equal(vepsTranslator.t('has-spenttime-cards'), 'Om kartoid kävutadud aiganke');
  assert.doesNotMatch(vepsTranslator.t('has-spenttime-cards'), /Sisältää|käytetty aika|kortteja/);
  assert.equal(vepsTranslator.t('spent-time-hours'), 'Kävutadud aig (časud)');
  assert.doesNotMatch(vepsTranslator.t('spent-time-hours'), /Käytetty|tuntia/);
  assert.notEqual(vepsTranslator.t('has-spenttime-cards'), vepsTranslator.t('has-overtime-cards'));
  assert.equal(cache['ve-PP'].hours, 'časud', 'retain existing hours terminology');
  const vepsWaitIndicators = {
  "wait-spinner": "Varastusen znam",
  "Bounce": "Hüpke – varastusen znam",
  "Cube": "Kub – varastusen znam",
  "Cube-Grid": "Kuboiden verk – varastusen znam",
  "Dot": "Čokim – varastusen znam",
  "Double-Bounce": "Kaks’kerdaine hüpke – varastusen znam",
  "Rotateplane": "Tazan punond – varastusen znam",
  "Scaleout": "Kazvand – varastusen znam",
  "Wave": "Laineh – varastusen znam"
};
  for (const [key, value] of Object.entries(vepsWaitIndicators)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /odotus|Odotus|pyörijä|Kuutio|ristikko|Tupla|pomppu|Pomppu|Pyöritä|Skaalaus|Aalto|Piste/, key);
  }
  assert.equal(new Set(Object.values(vepsWaitIndicators)).size, 9, 'preserve all wait-indicator distinctions');
  assert.notEqual(vepsTranslator.t('Bounce'), vepsTranslator.t('Double-Bounce'));
  assert.notEqual(vepsTranslator.t('Cube'), vepsTranslator.t('Cube-Grid'));
  const vepsStructureMigration = {
  "comprehensive-board-migration": "Kaikenpoline laudan migracii",
  "step-analyze-board-structure": "Tarkištele laudan struktur",
  "fix-missing-lists-migration": "Kohenda lugetišed, miččid ei ole",
  "fix-missing-lists-migration-description": "Löudab da kohendab laudan strukturas lugetišid, miččid ei ole libo oma travitud.",
  "run-fix-missing-lists-migration-confirm": "Nece löudab da kohendab laudan strukturas lugetišid, miččid ei ole libo oma travitud. Jatkta?"
};
  for (const [key, value] of Object.entries(vepsStructureMigration)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Perusteellinen|taulu|Analysoi|rakennetta|Korjaa|puuttuvat|Havaitsee|korjaa|vioittuneet|Jatketaanko/, key);
  }
  assert.match(vepsTranslator.t('fix-missing-lists-migration-description'), /ei ole libo oma travitud/);
  assert.equal(vepsTranslator.t('run-fix-missing-lists-migration-confirm'), 'Nece '+vepsTranslator.t('fix-missing-lists-migration-description').replace(/^L/, 'l')+' Jatkta?');
  assert.equal(cache['ve-PP']['step-analyze-lists'], 'Tarkištele lugetišid', 'retain existing analysis terminology');
  const vepsMigrationIntegrity = {
  "back-to-settings": "Pörte valičusihe",
  "board-migration": "Laudan migracii",
  "board-migrations": "Laudan migracijad",
  "comprehensive-board-migration-description": "Kaikenpoližešti kodvib da kohendab laudan andmusid, mugažo lugetišiden jäl’gendust, kartoiden sijoid da ujundšoidoiden strukturad, miše niil ei oliži vigoid.",
  "migrations-description": "Kodvi da kohenda necen laudan andmused, miše niil ei oliži vigoid. Kaikuččen migracijan voib tehta eriži.",
  "run-comprehensive-migration-confirm": "Nece tegeb kaikenpoline migracii, miše kodvda da kohendada laudan andmusid, miše niil ei oliži vigoid. Nece voib otta vähän aigad. Jatkta?"
};
  for (const [key, value] of Object.entries(vepsMigrationIntegrity)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Takaisin|asetuksiin|Taulun siirto|Taulu siirrot|Suorittaa|tarkistuksia|eheyden|varmistamiseksi|Jokainen|erikseen|kestää hetken|Jatketaanko/, key);
  }
  assert.match(vepsTranslator.t('comprehensive-board-migration-description'), /lugetišiden jäl’gendust.*kartoiden sijoid.*ujundšoidoiden strukturad/);
  assert.match(vepsTranslator.t('migrations-description'), /Kaikuččen migracijan voib tehta eriži/);
  assert.match(vepsTranslator.t('run-comprehensive-migration-confirm'), /voib otta vähän aigad.*Jatkta\?$/);
  assert.notEqual(vepsTranslator.t('board-migration'), vepsTranslator.t('board-migrations'));
  const vepsDuplicateWarnings = {
  "delete-duplicate-lists-confirm": "Oled-ik tozi mugošt mel’t? Nece heittäb kaik lugetišiden dublikatad, kudambil om ühtejiččen nimi da kudambiš ei ole kartoid.",
  "delete-duplicate-empty-lists-migration-description": "Heittäb tühjiden lugetišiden dublikatad ilman varuta. Heittäb vaiše lugetišed, kudambiš ei ole kartoid DA kudambil om toine ühtejiččen nimenke lugetiž, kudambas om kartoid.",
  "run-delete-duplicate-empty-lists-migration-confirm": "Nece vajehtab ezmäi kaik ühthižed lugetišed eriližihe lugetišihe kaikuččen ujundšoidun täht, sid’ heittäb tühjad lugetišed, kudambil om toine ühtejiččen nimenke lugetiž kartoidenke. Heittas vaiše todesižešti tarbhatomad tühjad lugetišed. Jatkta?"
};
  for (const [key, value] of Object.entries(vepsDuplicateWarnings)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Oletko varma|poistaa|kaksoiskappale|turvallisesti|sisältää kortteja|muuntaa ensin|uimaratakohtaisiksi|tarpeettomat|Jatketaanko/, key);
  }
  assert.match(vepsTranslator.t('delete-duplicate-empty-lists-migration-description'), /ei ole kartoid DA.*ühtejiččen nimenke.*om kartoid/);
  assert.match(vepsTranslator.t('run-delete-duplicate-empty-lists-migration-confirm'), /ezmäi.*ühthižed lugetišed.*kaikuččen ujundšoidun.*sid’ heittäb.*kartoidenke.*vaiše.*tarbhatomad.*Jatkta\?$/);
  assert.match(vepsTranslator.t('delete-duplicate-lists-confirm'), /ühtejiččen nimi.*ei ole kartoid/);
  const vepsConversionProgress = {
  "migration-progress-note": "Ole hüvä, varasta, kuni mö vajehtam sinun laudan strukturan jäl’gmäižele strukturale...",
  "conversion-info-text": "Nece vajehtab kaikuččen laudan vaiše ühten kerdan da paremboičeb radon tulotuzmärad. Sinä void jatkata laudan kävutandad kut aigemba.",
  "converting-board-description": "Vajehtadas laudan strukturan, miše paremboita sen funkcijoid. Nece voib otta vähän aigad.",
  "migration-info-text": "Sistem tegeb kaikuččen andmbazan migracijan vaiše ühten kerdan. Nece paremboičeb sisteman radon tulotuzmärad. Process jatktase tagamal, eskai ku sinä sauptad brauzeran."
};
  for (const [key, value] of Object.entries(vepsConversionProgress)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Odota hetki|siirrämme|uusimpaan rakenteeseen|muunnos suoritetaan|parantaa suorituskykyä|normaalisti|Muunnetaan|Tietokannan|Prosessi jatkuu|suljet selaimen/, key);
  }
  assert.match(vepsTranslator.t('conversion-info-text'), /kaikuččen laudan vaiše ühten kerdan.*void jatkata/);
  assert.match(vepsTranslator.t('migration-info-text'), /kaikuččen andmbazan migracijan vaiše ühten kerdan.*jatktase tagamal.*sauptad brauzeran/);
  assert.match(vepsTranslator.t('converting-board-description'), /paremboita sen funkcijoid.*voib otta vähän aigad/);
  const vepsRecoverySteps = {
  "step-ensure-per-swimlane-lists": "Kodvi da tege lugetišed kaikuččen ujundšoidun täht, ku niid ei ole",
  "step-ensure-lost-cards-swimlane": "Kodvi da tege kadonu kartoiden ujundšoid, ku sidä ei ole",
  "lost-cards": "Kadonu kartad",
  "lost-cards-list": "Endištadud azjad"
};
  for (const [key, value] of Object.entries(vepsRecoverySteps)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key), value, key);
    assert.doesNotMatch(value, /Varmista|uimaratakohtaiset|hävinneiden|Kadonneet|Palautetut kohteet/, key);
  }
  assert.match(vepsTranslator.t('step-ensure-per-swimlane-lists'), /kaikuččen ujundšoidun.*ku niid ei ole/);
  assert.match(vepsTranslator.t('step-ensure-lost-cards-swimlane'), /kadonu kartoiden ujundšoid.*ku sidä ei ole/);
  assert.notEqual(vepsTranslator.t('lost-cards'), vepsTranslator.t('lost-cards-list'));
  assert.equal(cache['ve-PP']['restore-lost-cards-migration'], 'Endišta kadonu kartad', 'retain existing recovery action');
  const vepsSearchHelp = {
  "globalSearch-instructions-description": "Ecindas voib kävutada operatoroid, miše röunatada ecindad. Operatoran nimi da znamoičend kirjutadas erigoittud \":\"-znamal. Ozutesikš operator `lugetiž:Blocked` ecib vaiše kartoid lugetišespäi nimenke *Blocked*. Ku znamoičendas om keskustoid libo eriližid simvoloid, pane se velgznamoihe (ozutesikš `__operator_list__:\"Kodvi\"`).",
  "globalSearch-instructions-operator-due": "`__operator_due__:<n>` – kartad, miččiden märaig tuleb nügüdläižen aigan jäl’ghe *<n>* päivässai. `__operator_due__:__predicate_overdue__` ozutab kaik kartad, miččiden märaig om männu."
};
  for (const [key, value] of Object.entries(vepsSearchHelp)) {
    assert.equal(cache['ve-PP'][key], value, key);
    assert.equal(vepsTranslator.t(key, { operator_list: 'lugetiž', operator_due: 'märaig', predicate_overdue: cache['ve-PP']['predicate-overdue'] }), value.replace('__operator_list__', 'lugetiž').replaceAll('__operator_due__', 'märaig').replace('__predicate_overdue__', cache['ve-PP']['predicate-overdue']), key);
    assert.doesNotMatch(value, /Etsinnät|määritellään|kirjoittamalla|lainausmerkeissä|kortit joilla|eräpäivä|korkeitaan/, key);
    assert.equal((value.match(/`/g) || []).length % 2, 0, 'balanced code spans');
  }
  assert.match(vepsTranslator.t('globalSearch-instructions-description', { operator_list: 'lugetiž' }), /`lugetiž:Blocked`.*keskustoid libo eriližid simvoloid.*`lugetiž:"Kodvi"`/);
  assert.match(vepsTranslator.t('globalSearch-instructions-operator-due', { operator_due: 'märaig', predicate_overdue: cache['ve-PP']['predicate-overdue'] }), /`märaig:<n>`.*\*<n>\* päivässai.*`märaig:möhäline`.*märaig om männu/);
  assert.equal(vepsTranslator.t('MongoDB_storage_engine'), 'MongoDB kaičusen motor');
  assert.doesNotMatch(vepsTranslator.t('MongoDB_storage_engine'), /tallennusmoottori/);
  assert.equal(vepsTranslator.t('zoom-in'), 'Surenda');
  assert.equal(vepsTranslator.t('zoom-out'), 'Penenda');
  assert.notEqual(vepsTranslator.t('zoom-in'), vepsTranslator.t('zoom-out'));
  assert.doesNotMatch(vepsTranslator.t('zoom-in') + vepsTranslator.t('zoom-out'), /Lähennä|Loitonna/);
  assert.equal(vepsTranslator.t('zoom-level'), 'Kartmär');
  assert.equal(vepsTranslator.t('enter-zoom-level'), 'Kirjuta kartmär (50-300%):');
  assert.match(vepsTranslator.t('enter-zoom-level'), /\(50-300%\):$/);
  assert.doesNotMatch(vepsTranslator.t('zoom-level') + vepsTranslator.t('enter-zoom-level'), /Zoomaus|Kirjoita|taso/);
  assert.equal(cache.to['calendar-system-islamic-tbla'], 'tohi māhina fakamohameti (fakatēpile, ʻepoki fakaʻasitalōnoma)');
  assert.match(cache.to['calendar-system-islamic-tbla'], /fakatēpile, ʻepoki fakaʻasitalōnoma/);
  assert.doesNotMatch(cache.to['calendar-system-islamic-tbla'], /Islamic tabular/);
  assert.notEqual(cache.to['calendar-system-islamic-tbla'], cache.to['calendar-system-islamic-civil']);
  assert.notEqual(cache.to['calendar-system-islamic-tbla'], cache.to['calendar-system-islamic-rgsa']);
  assert.equal(cache.sah['calendar-system-islamic-civil'], 'Ислаам халандаара (табылыысса, гражданскай ээрэ)');
  assert.doesNotMatch(cache.sah['calendar-system-islamic-civil'], /Islamic civil/);
  assert.notEqual(cache.sah['calendar-system-islamic-civil'], cache.sah['calendar-system-islamic']);
  assert.equal(cache.sah['calendar-system-islamic-tbla'], 'Ислаам халандаара (табылыысса, астрономия ээрэтэ)');
  assert.match(cache.sah['calendar-system-islamic-tbla'], /табылыысса, астрономия ээрэтэ/);
  assert.doesNotMatch(cache.sah['calendar-system-islamic-tbla'], /Islamic tabular/);
  assert.notEqual(cache.sah['calendar-system-islamic-tbla'], cache.sah['calendar-system-islamic-civil']);
  assert.equal(cache.sah['calendar-system-islamic-rgsa'], 'Ислаам халандаара (Сауд Арабията, ыйы кэтээн көрүү)');
  assert.doesNotMatch(cache.sah['calendar-system-islamic-rgsa'], /Islamic|Saudi Arabia/);
  for (const variant of ['civil', 'tbla', 'umalqura']) assert.notEqual(cache.sah['calendar-system-islamic-rgsa'], cache.sah[`calendar-system-islamic-${variant}`]);
  assert.equal(cache.bm['calendar-system-hebrew'], 'Yahudiya ka kalandiriye');
  assert.doesNotMatch(cache.bm['calendar-system-hebrew'], /Hebrew/);
  assert.notEqual(cache.bm['calendar-system-hebrew'], cache.bm['calendar-system-islamic']);
  assert.equal(cache.rup['color-indigo'], 'lulachi');
  assert.notEqual(cache.rup['color-indigo'], 'indigo');
  assert.notEqual(cache.rup['color-indigo'], cache.rup['color-blue']);
  const tamazightAccountLabels = {
  "username": "ⵉⵙⵎ ⵏ ⵓⵏⵙⵙⵎⵔⵙ",
  "password": "ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ",
  "edit": "ⵙⵏⴼⵍ",
  "email": "ⵉⵎⴰⵢⵍ",
  "login": "ⴽⵛⵎ",
  "logout": "ⴼⴼⵖ",
  "password-mismatch": "ⵜⴰⴳⵓⵔⵉ ⵏ ⵓⵣⵔⴰⵢ ⵏⵏⴰ ⵜⵙⴽⵛⵎⴷ ⵓⵔ ⵜⵎⵙⴰⵙⴰ"
};
  for (const [key, value] of Object.entries(tamazightAccountLabels)) {
    assert.equal(cache.zgh[key], value, key);
    assert.match(value, /[\u2D30-\u2D7F]/, key);
    assert.doesNotMatch(value, /[\u0600-\u06FF]|Connexion|Déconnexion|Les mots/, key);
  }
  assert.notEqual(cache.zgh.login, cache.zgh.logout);
  assert.equal(cache.zgh['delete-all-notifications'], 'ⴽⴽⵙ ⵉⵍⵖⴰ ⴰⴽⴽ');
  assert.match(cache.zgh['delete-all-notifications'], /ⵉⵍⵖⴰ ⴰⴽⴽ$/);
  assert.doesNotMatch(cache.zgh['delete-all-notifications'], /Supprimer|notifications/);
  const quechuaBasicColors = {"color-black": "yana", "color-red": "puka", "color-white": "yuraq"};
  for (const [key, value] of Object.entries(quechuaBasicColors)) {
    assert.equal(cache.qu[key], value, key);
    assert.doesNotMatch(cache.qu[key], /Kay willaymi|black|red|white/, key);
  }
  assert.equal(new Set(Object.values(quechuaBasicColors)).size, 3);
  const quechuaAdditionalColors = {"color-blue": "anqas", "color-green": "q'umir", "color-yellow": "q'illu"};
  for (const [key, value] of Object.entries(quechuaAdditionalColors)) {
    assert.equal(cache.qu[key], value, key);
    assert.doesNotMatch(cache.qu[key], /Kay willaymi|blue|green|yellow/, key);
  }
  assert.equal(new Set([...Object.values(quechuaBasicColors), ...Object.values(quechuaAdditionalColors)]).size, 6);
  const quechuaGrayPurple = {"color-gray": "uqi", "color-purple": "kulli"};
  for (const [key, value] of Object.entries(quechuaGrayPurple)) {
    assert.equal(cache.qu[key], value, key);
    assert.doesNotMatch(cache.qu[key], /Kay willaymi|gray|purple/, key);
    assert.notEqual(value, cache.qu['color-blue']);
  }
  const quechuaMetalColors = {"color-gold": "quri llimpi", "color-silver": "qullqi llimpi"};
  for (const [key, value] of Object.entries(quechuaMetalColors)) {
    assert.equal(cache.qu[key], value, key);
    assert.match(value, / llimpi$/);
    assert.doesNotMatch(value, /Kay willaymi|gold|silver/);
  }
  assert.notEqual(cache.qu['color-gold'], cache.qu['color-silver']);
  const cherokeeHijriVariants = {"calendar-system-islamic-rgsa": "ᎢᏌᎳᎻᎩ, ᏌᏗ ᎠᎳᏈᎠ ᎠᎪᏩᏘᎭ", "calendar-system-islamic-tbla": "ᎢᏌᎳᎻᎩ (ᏅᏯ, ᏃᏈᏏ ᎢᏳᏍᏗ)"};
  for (const [key, value] of Object.entries(cherokeeHijriVariants)) {
    assert.equal(cache.chr[key], value, key);
    assert.doesNotMatch(value, /Islamic|Saudi|tabular/);
    assert.match(value, /[\u13A0-\u13FF]/);
    assert.notEqual(value, cache.chr['calendar-system-islamic-civil']);
  }
  assert.notEqual(cache.chr['calendar-system-islamic-rgsa'], cache.chr['calendar-system-islamic-tbla']);
  console.log(`auditedTranslationCorrections: ${corrections.length} corrections verified; tokens, JSON examples, key order, idempotency and newer translations preserved`);
})().catch(error => { console.error(error); process.exitCode = 1; });
