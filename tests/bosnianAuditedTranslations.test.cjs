'use strict';
const assert = require('node:assert/strict');
const data = require('../imports/i18n/data/bs.i18n.json');
const corrections = require('../releases/translations/audited-corrections.json').filter(row => row.locale === 'bs');
assert.ok(corrections.length >= 21);
for (const row of corrections) {
  assert.equal(data[row.key], row.after);
  assert.doesNotMatch(row.after, /[А-Яа-яЁё]/, `${row.key}: Serbian seed must be replaced with reviewed Bosnian wording`);
}
assert.equal(data.accessibility, 'Pristupačnost');
assert.match(data['accessibility-page-enabled'], /omogućena/);
assert.match(data['accessibility-info-not-added-yet'], /još nisu dodane/);
assert.match(data['Node_heap_does_zap_garbage'], /uzorkom bitova/);
assert.doesNotMatch(data['Node_heap_does_zap_garbage'], /sakupljanje|skupljanje smeća/);
assert.match(data['Node_memory_usage_rss'], /rezidentna veličina skupa/);
assert.doesNotMatch(data['Node_memory_usage_rss'], /postavljena vrijednost/);
assert.match(data['Node_heap_malloced_memory'], /funkcijom malloc/);
assert.match(data['Node_heap_peak_malloced_memory'], /najveća količina/);
assert.match(data['Node_heap_total_heap_size_executable'], /izvršni kod/);
assert.match(data['Double-Bounce'], /dvostrukim poskakivanjem/);
assert.doesNotMatch(data['Double-Bounce'], /tri tačk|tri točk/);
assert.match(data['Cube-Grid'], /mrežom kockica/);
assert.match(data.Rotateplane, /rotirajućom plohom/);
console.log('bosnianAuditedTranslations: reviewed wording, metric meanings and indicators passed');
assert.match(data['accounts-lockout-known-users'], /ispravno korisničko ime, pogrešna lozinka/);
assert.match(data['accounts-lockout-unknown-users'], /nepostojeće korisničko ime/);
assert.match(data['accounts-lockout-failure-window'], /neuspjelih pokušaja \(sekunde\)/);
assert.match(data['accounts-lockout-period'], /\(sekunde\)/);
assert.match(data['accounts-lockout-show-locked-users'], /samo zaključane/);
assert.match(data['accounts-lockout-confirm-unlock-all'], /sve zaključane korisnike/);
assert.doesNotMatch(data['accounts-lockout-info'], /nasilan upad|mjere zabrane/);
assert.equal(data['accounts-allowUserDelete'], 'Samostalno brisanje korisničkog računa');
console.log('bosnianAuditedTranslations: account scope, credentials and lockout units passed');

(async () => {
  const translator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
  await translator.init({ lng: 'bs', fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { bs: { translation: data } }, postProcess: ['sprintf'] });
  assert.equal(translator.t('act-a-endAt', { timeValue: 'NEW', timeOldValue: 'OLD' }), 'promijenio vrijeme završetka na NEW s (OLD)');
  for (const [key, date] of [['activity-endDate', 'završetka'], ['activity-receivedDate', 'prijema'], ['activity-startDate', 'početka']]) {
    assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `promijenio datum ${date} na DATE za karticu CARD`);
  }
  assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }), 'promijenio rok na DATE za karticu CARD');
  const mention = translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' });
  assert.equal(mention, 'spomenuo vas na kartici CARD: COMMENT u listi LIST u stazi LANE na ploči BOARD');
  assert.match(data['act-newDue'], /prvi podsjetnik/);
  assert.doesNotMatch(data['act-newDue'], /jedan podsjetnik/);
  assert.match(data['act-duenow'], /upravo sada/);
  assert.doesNotMatch(data['act-duenow'], /danas/);
  assert.match(data['activity-unset-customfield'], /uklonio vrijednost/);
  assert.doesNotMatch(data['activity-unset-customfield'], /izbrisao polje/);
  assert.equal(translator.t('activity-set-customfield', { sprintf: ['FIELD', 'VALUE', 'CARD'] }), "postavio prilagođeno polje 'FIELD' na 'VALUE' u CARD");
  console.log('bosnianAuditedTranslations: activity rendering, argument order and reminder meanings passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

assert.match(data['admin-desc'], /uklanjati članove/);
assert.match(data['admin-desc'], /mijenjati postavke ploče/);
assert.doesNotMatch(data['admin-people-filter-inactive'], /platn|plać/);
assert.match(data['admin-people-user-active'], /aktivan.*deaktivirate/);
assert.match(data['admin-people-user-inactive'], /neaktivan.*aktivirate/);
assert.equal(data.allowNonBoardMembers, 'Dopusti sve prijavljene korisnike');
assert.doesNotMatch(data.allowNonBoardMembers, /sve korisnike$/);
assert.ok(data['add-custom-html-after-body-start'].includes('<body>'));
assert.ok(data['add-custom-html-before-body-end'].includes('</body>'));
assert.match(data['allboards.edit-workspace-icon'], /\(markdown\)/);
assert.match(data['app-is-offline'], /Osvježavanje stranice uzrokovat će gubitak podataka/);
assert.match(data['app-is-offline'], /server nije zaustavljen/);
assert.equal(data['app-try-reconnect'], 'Pokušajte se ponovo povezati.');
console.log('bosnianAuditedTranslations: administrator permissions, account status and refresh warning passed');

assert.equal(data['attachment-move-storage-s3'], 'Premjesti prilog u S3');
assert.doesNotMatch(data['attachment-move-storage-s3'], /Amazon|oblak/);
assert.equal(data['attachment-move-storage-gridfs'], 'Premjesti prilog u GridFS');
assert.match(data['attachment-move-storage-fs'], /sistem datoteka/);
assert.match(data['automatic-linked-url-schemes'], /Jedna URL shema po redu/);
assert.doesNotMatch(data['automatic-linked-url-schemes'], /mjesta na Internetu/);
assert.equal(data['automatically-field-on-card'], 'Dodaj polje na nove kartice');
assert.doesNotMatch(data['automatically-field-on-card'], /sve kartice/);
assert.match(data['autoAddUsersWithDomainName'], /Automatski dodaj korisnike/);
assert.equal(data['avatar-too-big'], 'Avatar je prevelik (najviše __size__)');
console.log('bosnianAuditedTranslations: storage destinations, URL schemes and new-card scope passed');
