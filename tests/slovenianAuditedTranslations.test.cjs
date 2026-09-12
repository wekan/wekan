'use strict';
const assert = require('node:assert/strict');
for (const locale of ['sl', 'sl_SI']) {
  const data = require(`../imports/i18n/data/${locale}.i18n.json`);
  for (const key of ['Cube-Grid', 'Double-Bounce', 'MongoDB_storage_engine', 'Node_heap_does_zap_garbage', 'Node_heap_heap_size_limit', 'Node_heap_malloced_memory', 'Node_heap_number_of_detached_contexts', 'Node_heap_number_of_native_contexts']) assert.doesNotMatch(data[key], /[А-Яа-яЁё]/);
  assert.match(data['Double-Bounce'], /dvojnim odskakovanjem/);
  assert.doesNotMatch(data['Double-Bounce'], /tri pike/);
  assert.match(data['Node_heap_does_zap_garbage'], /bitnim vzorcem/);
  assert.doesNotMatch(data['Node_heap_does_zap_garbage'], /zbiranje smeti/);
  assert.match(data['Node_heap_malloced_memory'], /funkcijo malloc/);
  assert.match(data['Node_heap_number_of_detached_contexts'], /ločenih kontekstov/);
  assert.match(data['Node_heap_number_of_native_contexts'], /izvornih kontekstov/);
  assert.match(data.Node_memory_usage_rss, /rezidentnega nabora/);
  assert.doesNotMatch(data.Node_memory_usage_rss, /nastavljena vrednost/);
  assert.match(data.Node_heap_total_heap_size_executable, /izvršljivo kodo/);
  assert.match(data.Node_heap_peak_malloced_memory, /največja količina.*malloc/);
  assert.equal(data.Reactivity_mode, 'Način reaktivnosti (changeStreams / oplog / polling)');
  assert.match(data['accessibility-info-not-added-yet'], /dostopnosti še niso dodane/);
  assert.match(data['accessibility-page-enabled'], /je omogočena/);
  assert.match(data['accounts-lockout-confirm-unlock-all'], /vse zaklenjene uporabnike/);
  assert.match(data['accounts-lockout-failure-window'], /neuspelih poskusov \(sekunde\)/);
  assert.match(data['accounts-lockout-failures-before'], /pred zaklepanjem/);
  assert.match(data['accounts-lockout-info'], /napadi z grobo silo/);
  assert.doesNotMatch(data['accounts-lockout-info'], /lozinkef/);
  assert.equal(data.MongoDB_storage_engine, 'Shranjevalni pogon MongoDB');
  assert.match(data['conversion-info-text'], /enkrat na tablo.*izboljša zmogljivost.*še naprej uporabljate/);
  assert.match(data['created-at-newest-first'], /ustvarjanja.*najnovejše/);
  assert.match(data['created-at-oldest-first'], /ustvarjanja.*najstarejše/);
  assert.match(data['cron-no-errors'], /za prikaz/);
  assert.doesNotMatch(data['cron-no-errors'], /nikoli|zgodile/);
  assert.match(data['cron-no-failed-migrations'], /neuspelih selitev.*ponovni poskus/);
  assert.match(data['cron-no-paused-migrations'], /začasno ustavljenih selitev.*nadaljevanje/);
  assert.match(data['custom-field-stringtemplate-format'], /%\{value\}/);
  assert.doesNotMatch(data['custom-field-stringtemplate-format'], /%\{вредност\}/);

  for (const action of ['archive', 'backup', 'cleanup']) {
    assert.match(data[`board-${action}-failed`], /Načrtovanje.*ni uspelo/);
    assert.match(data[`board-${action}-scheduled`], /uspešno načrtovano/);
  }
  assert.match(data['comment-assigned-only-desc'], /samo dodeljene kartice.*samo komentira/);
  assert.match(data['comment-not-found'], /Kartica s komentarjem/);
  assert.match(data['card-sorting-by-number-on-minicard'], /mini kartici/);
  assert.notEqual(data['checklistDeletePopup-title'], data['checklistItemDeletePopup-title']);
  assert.match(data['checklistItemDeletePopup-title'], /postavko/);
  assert.doesNotMatch(data['bucket-example'], /2025|delovod/);
  for (const key of ['azure-account-key-menu-path', 'azure-connection-string-menu-path']) assert.match(data[key], /vaš račun.*key1/);

  assert.match(data['admin-desc'], /odstranjuje člane.*nastavitve table.*dejavnosti/);
  for (const key of ['admin-people-filter-inactive', 'admin-people-user-active', 'admin-people-user-inactive']) assert.doesNotMatch(data[key], /плат|plač|sodelovan/);
  assert.match(data['admin-people-user-active'], /aktiven.*deaktivacijo/);
  assert.match(data['admin-people-user-inactive'], /neaktiven.*aktivacijo/);
  assert.match(data.allowNonBoardMembers, /vsem prijavljenim uporabnikom/);
  assert.doesNotMatch(data.allowNonBoardMembers, /glas|član/);
  assert.match(data['automatic-linked-url-schemes'], /Sheme URL.*Ena shema URL na vrstico/);
  assert.doesNotMatch(data['attachment-move-storage-s3'], /Amazon|oblak/);
  assert.match(data['always-field-on-card'], /vse kartice/);
  assert.match(data['automatically-field-on-card'], /nove kartice/);

}
console.log('slovenianAuditedTranslations: both locales, spinner and memory meanings passed');

(async () => {
  for (const locale of ['sl', 'sl_SI']) {
    const data = require(`../imports/i18n/data/${locale}.i18n.json`);
    assert.match(data['accounts-lockout-known-users'], /pravilno uporabniško ime, napačno geslo/);
    assert.match(data['accounts-lockout-unknown-users'], /neobstoječe uporabniško ime/);
    assert.match(data['accounts-lockout-period'], /\(sekunde\)/);
    assert.match(data['accounts-lockout-show-locked-users'], /samo zaklenjene uporabnike/);
    assert.match(data['accounts-lockout-user-unlocked'], /uspešno odklenjen/);
    const translator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
    await translator.init({ lng: locale, fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { [locale]: { translation: data } }, postProcess: ['sprintf'] });
    for (const [key, date] of [['activity-endDate', 'konca'], ['activity-receivedDate', 'prejema'], ['activity-startDate', 'začetka']]) assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `je spremenil datum ${date} na DATE za kartico CARD`);
    assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }), 'je spremenil rok na DATE za kartico CARD');
    assert.equal(data['act-completeChecklist'], data['activity-checklist-completed-card']);
    assert.match(data['act-completeChecklist'], /dokončal kontrolni seznam/);
    assert.doesNotMatch(data['act-completeChecklist'], /završio|provjere/);
    assert.equal(translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'vas je omenil na kartici CARD: COMMENT na seznamu LIST v stezi LANE na tabli BOARD');
  }
  console.log('slovenianAuditedTranslations: credential distinctions, seconds and real mention rendering passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
