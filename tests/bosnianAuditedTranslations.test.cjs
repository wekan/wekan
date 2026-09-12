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
  const invitation = translator.t('email-invite-text', { user: 'USER', inviter: 'INVITER', board: 'BOARD', url: 'LOCAL_URL' });
  for (const token of ['USER', 'INVITER', 'BOARD', 'LOCAL_URL']) assert.ok(invitation.includes(token));
  assert.match(invitation, /vas poziva da se pridružite/);
  assert.doesNotMatch(invitation, /pun uvid|potpun pristup/);
  assert.equal(translator.t('email-resetPassword-subject', { siteName: 'SITE' }), 'Ponovo postavite lozinku na SITE');
  assert.equal(translator.t('email-verifyEmail-subject', { siteName: 'SITE' }), 'Potvrdite adresu e-pošte na SITE');
  assert.match(data['dueCardsViewChange-choice-all-description'], /sve nedovršene kartice/);
  assert.match(data['dueCardsViewChange-choice-all-description'], /korisnik ima dozvolu/);
  assert.match(data['editPokerEndDatePopup-title'], /završetka glasanja/);
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

for (const operation of ['archive', 'backup', 'cleanup']) {
  assert.match(data[`board-${operation}-failed`], /Zakazivanje.*nije uspjelo/);
  assert.match(data[`board-${operation}-scheduled`], /uspješno je zakazan/);
}
for (const key of ['board-info-on-my-boards', 'boardInfoOnMyBoards-title', 'boardInfoOnMyBoardsPopup-title']) assert.equal(data[key], 'Postavke svih ploča');
assert.match(data['board-drag-drop-reorder-or-click-open'], /Kliknite ikonu ploče/);
assert.doesNotMatch(data['board-drag-drop-reorder-or-click-open'], /delovodni|djelovodni/);
assert.equal(data['board-migrations'], 'Migracije ploča');
assert.match(data.board_assignees, /svih kartica na ovoj ploči/);
assert.match(data['bucket-example'], /Lista životnih želja/);
assert.doesNotMatch(data['bucket-example'], /4\/2025/);
assert.match(data['card-archive-pop'], /više neće biti vidljiva u ovoj listi/);
console.log('bosnianAuditedTranslations: scheduling results, board scope and archive visibility passed');

assert.equal(data['checklistDeletePopup-title'], 'Izbrisati kontrolnu listu?');
assert.equal(data['checklistItemDeletePopup-title'], 'Izbrisati stavku kontrolne liste?');
assert.notEqual(data['checklistDeletePopup-title'], data['checklistItemDeletePopup-title']);
assert.match(data['comment-assigned-only-desc'], /samo dodijeljene kartice/);
assert.match(data['comment-assigned-only-desc'], /samo komentarisati/);
assert.doesNotMatch(data['comment-assigned-only-desc'], /uređivati|sve kartice/);
assert.match(data['comment-not-found'], /^Kartica s komentarom/);
assert.match(data['card-sorting-by-number-on-minicard'], /na minikartici/);
assert.match(data.card_members, /Svi članovi trenutne kartice/);
assert.match(data.card_assignees, /Svi zaduženi korisnici trenutne kartice/);
assert.match(data['conversion-info-text'], /jednom po ploči/);
assert.match(data['conversion-info-text'], /nastaviti normalno koristiti/);
assert.match(data['comprehensive-board-migration-description'], /redoslijed lista, položaje kartica i strukturu staza/);
console.log('bosnianAuditedTranslations: checklist entities, comment-only restrictions and conversion scope passed');

assert.equal(data['convert-to-markdown'], 'Pretvori u markdown');
assert.match(data['copyManyCardsPopup-instructions'], /odredišnih kartica.*JSON/);
assert.equal(data['createTemplateContainerPopup-title'], data['add-template-container']);
assert.equal(data['created-at-newest-first'], 'Datum kreiranja (najnovije prvo)');
assert.equal(data['created-at-oldest-first'], 'Datum kreiranja (najstarije prvo)');
assert.doesNotMatch(data['created-at-newest-first'], /prijem|zaprim/);
assert.match(data['cron-job-delete-confirm'], /ovaj zakazani posao/);
assert.match(data['cron-job-delete-failed'], /nije uspjelo/);
assert.match(data['cron-job-deleted'], /uspješno izbrisan/);
assert.match(data['cron-job-pause-failed'], /nije uspjelo/);
assert.match(data['cron-job-paused'], /uspješno pauziran/);
assert.match(data['cron-migrations-retried'], /^Neuspjele migracije.*ponovo pokrenute/);
assert.doesNotMatch(data['cron-migrations-retried'], /obnov.*spis/);
console.log('bosnianAuditedTranslations: creation-date ordering, template identity and scheduled-job results passed');

assert.match(data['custom-field-delete-pop'], /Poništavanje nije moguće/);
assert.match(data['custom-field-delete-pop'], /sa svih kartica.*uništiti njegovu historiju/);
assert.ok(data['custom-field-stringtemplate-separator'].includes('&#32;'));
assert.ok(data['custom-field-stringtemplate-separator'].includes('&nbsp;'));
assert.match(data['custom-field-stringtemplate-item-placeholder'], /Enter/);
assert.match(data['custom-top-left-corner-logo-height'], /Zadano: 27$/);
assert.match(data['custom-login-logo-image-url'], /URL slike/);
assert.match(data['custom-login-logo-link-url'], /URL poveznice/);
assert.match(data['delete-all-notifications-confirm'], /sva obavještenja/);
assert.match(data['delete-all-notifications-confirm'], /ne može poništiti/);
assert.equal(data['delete-duplicate-empty-lists-migration'], 'Izbriši prazne duplikate lista');
assert.doesNotMatch(data['delete-duplicate-empty-lists-migration'], /istoimen/);
assert.equal(data['cron-no-errors'], 'Nema grešaka za prikaz');
console.log('bosnianAuditedTranslations: deletion scope, HTML entities and URL distinctions passed');

assert.match(data['delete-duplicate-empty-lists-migration-description'], /nemaju kartice I.*druga lista istog naziva.*sadrži kartice/);
assert.match(data['delete-duplicate-lists-confirm'], /isti naziv i ne sadrže kartice/);
assert.equal(data['deleteDuplicateListsPopup-title'], data['delete-duplicate-lists']);
for (const entity of ['org', 'team']) {
  assert.match(data[`delete-${entity}-confirm-popup`], /Poništavanje nije moguće/);
  assert.match(data[`delete-${entity}-warning-message`], /barem jedan korisnik/);
}
assert.doesNotMatch(data['delete-team-confirm-popup'], /pravni/);
assert.match(data['delete-linked-cards-before-this-list'], /povezane kartice koje upućuju na kartice u ovoj listi/);
assert.match(data['delete-linked-card-before-this-card'], /povezanu karticu koja ima$/);
assert.match(data['delete-user-confirm-popup'], /ovaj račun.*Poništavanje nije moguće/);
assert.match(data['deposit-subtasks-list'], /lista za podzadatke/);
console.log('bosnianAuditedTranslations: duplicate-list conditions, membership blockers and linked-card direction passed');

assert.match(data['error-csv-schema'], /CSV.*zarezima.*TSV.*tabulatorima/);
assert.doesNotMatch(data['error-teamname-taken'], /pravni/);
assert.match(data['export-card-pdf'], /Izvezi karticu u PDF/);
assert.equal(data['filter-due-next-week'], 'Rok sljedeće sedmice');
assert.equal(data['filter-due-this-week'], 'Rok ove sedmice');
assert.equal(data['filter-member-label'], 'Filtriraj po članu');
assert.equal(data['filter-show-archive'], 'Prikaži arhivirane liste');
assert.match(data['fix-all-file-urls-migration-description'], /svih datotečnih priloga na ovoj ploči/);
assert.match(data['fix-all-file-urls-migration-description'], /odgovarajući sistem pohrane/);
assert.match(data['fix-all-file-urls-migration-description'], /popravlja neispravne reference/);
console.log('bosnianAuditedTranslations: file URL repair scope, CSV separators and week filters passed');

assert.match(data['fix-avatar-urls-migration-description'], /članova ploče.*odgovarajući sistem pohrane.*neispravne reference/);
assert.match(data['fix-missing-lists-migration-description'], /nedostajuće ili oštećene liste/);
assert.match(data['globalSearch-instructions-notes-2'], /logičkim \*ILI\*/);
assert.match(data['globalSearch-instructions-notes-3'], /logičkim \*I\*/);
assert.ok(data['globalSearch-instructions-description'].includes('`list:Blocked`'));
assert.ok(data['globalSearch-instructions-description'].includes('`__operator_list__:"To Review"`'));
assert.ok(data['globalSearch-instructions-notes-2'].includes('`__operator_list__:Available __operator_list__:Blocked`'));
assert.ok(data['globalSearch-instructions-notes-3'].includes('`__operator_list__:Available __operator_label__:red`'));
assert.match(data['globalSearch-instructions-notes-4'], /ne razlikuju velika i mala slova/);
assert.match(data['globalSearch-instructions-notes-5'], /ne pretražuju/);
console.log('bosnianAuditedTranslations: migration repair scope, Boolean search and literal examples passed');

assert.ok(data['globalSearch-instructions-operator-at'].includes('`user:<username>`'));
assert.ok(data['globalSearch-instructions-operator-has'].includes('`has:-due`'));
assert.match(data['globalSearch-instructions-operator-has'], /odsustvo vrijednosti/);
assert.match(data['globalSearch-instructions-operator-label'], /\*<color>\* ili \*<name>\*/);
assert.doesNotMatch(data['globalSearch-instructions-operator-label'], / i \*<name>/);
assert.match(data['globalSearch-instructions-operator-limit'], /pozitivan cijeli broj/);
assert.match(data['globalSearch-instructions-operator-limit'], /po stranici/);
assert.match(data['globalSearch-instructions-operator-created'], /dana ili manje/);
assert.match(data['globalSearch-instructions-operator-due'], /rok prošao/);
assert.match(data['globalSearch-instructions-operator-assignee'], /zaduženi korisnik/);
assert.match(data['globalSearch-instructions-operator-creator'], /autor/);
console.log('bosnianAuditedTranslations: search operator syntax, negation, label OR and integer limits passed');

assert.match(data['globalSearch-instructions-status-ended'], /s datumom završetka/);
assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /dovršene|okončane/);
assert.match(data['globalSearch-instructions-status-private'], /samo na privatnim pločama/);
assert.match(data['globalSearch-instructions-operator-org'], /ploči dodijeljenoj organizaciji/);
assert.match(data['globalSearch-instructions-operator-team'], /ploči dodijeljenoj timu/);
assert.match(data['globalSearch-instructions-operator-user'], /član ili zaduženi korisnik/);
assert.match(data['globalSearch-instructions-operator-sort'], /opadajuće.*`-`/);
assert.match(data['globalSearch-instructions-operator-modified'], /dana ili manje/);
assert.match(data['globalSearch-instructions-status-all'], /arhivirane i nearhivirane/);
console.log('bosnianAuditedTranslations: end-date status, private-board scope, assignment and descending sort passed');

assert.match(data['globalSearch-instructions-status-public'], /samo na javnim pločama/);
assert.doesNotMatch(data['globalSearch-instructions-status-public'], /Internet|internet/);
assert.equal(data['gridfs-enabled-description'], 'Koristi MongoDB GridFS za pohranu datoteka');
assert.equal(data['hide-finished-checklist'], 'Sakrij dovršenu kontrolnu listu');
assert.equal(data.hideCheckedChecklistItems, 'Sakrij označene stavke kontrolne liste');
assert.notEqual(data['hide-finished-checklist'], data.hideCheckedChecklistItems);
assert.match(data['hide-list-on-minicard'], /listu na minikartici/);
assert.match(data['hide-minicard-label-text'], /tekst oznake na minikartici/);
assert.equal(data['if-you-already-have-an-account'], 'Ako već imate račun');
assert.equal(data['impersonate-user'], 'Preuzmi identitet korisnika');
console.log('bosnianAuditedTranslations: public-board scope, GridFS and checklist visibility passed');

for (const menu of ['Menu', 'More', 'Print and Export', 'Export JSON']) assert.ok(data['import-board-instruction-trello'].includes(`'${menu}'`));
assert.match(data['import-board-instruction-wekan'], /Izvezi ploču/);
assert.doesNotMatch(data['import-board-instruction-wekan'], /Uvezi ploču/);
assert.match(data['import-board-instruction-about-errors'], /ponekad ipak uspije/);
assert.match(data['import-board-instruction-about-errors'], /Sve ploče/);
assert.match(data['import-board-zip'], /\.zip.*JSON.*poddirektorijima.*priloge/);
assert.match(data['import-members-map-note'], /nepovezani članovi.*trenutnom korisniku/);
assert.match(data['import-user-select'], /postojećeg korisnika/);
console.log('bosnianAuditedTranslations: export direction, vendor menu names, ZIP scope and member fallback passed');

assert.match(data['keyboard-shortcuts-disabled'], /isključene.*Kliknite da ih uključite/);
assert.match(data['keyboard-shortcuts-enabled'], /uključene.*Kliknite da ih isključite/);
assert.match(data['invite-people-error'], /poziva za registraciju/);
assert.match(data['invite-people-success'], /registraciju.*uspješno poslan/);
assert.match(data['label-delete-pop'], /sa svih kartica.*uništiti njenu historiju/);
assert.match(data['label-delete-pop'], /Poništavanje nije moguće/);
assert.match(data['list-delete-pop'], /nećete moći oporaviti listu/);
assert.match(data['list-delete-pop'], /Poništavanje nije moguće/);
assert.match(data['leave-board-pop'], /sa svih kartica na ovoj ploči/);
assert.equal(data['list-sort-by'], 'Sortiraj listu po:');
assert.match(data['invalid-file'], /učitavanje ili preimenovanje se otkazuje/);
console.log('bosnianAuditedTranslations: keyboard toggles, registration invitations and deletion scope passed');

assert.match(data['max-avatar-filesize'], /avatara u bajtima/);
assert.match(data['max-upload-filesize'], /učitavanje u bajtima/);
assert.equal(data['migrate-all-to-s3'], 'Migriraj sve u S3');
assert.doesNotMatch(data['migrate-all-to-s3'], /Amazon|oblak/);
assert.match(data['migration-batch-size-description'], /\(1-100\)/);
assert.match(data['migration-cpu-threshold-description'], /premaši ovaj procenat \(10-90\)/);
assert.doesNotMatch(data['migration-cpu-threshold-description'], /dosegne|dostigne/);
assert.match(data['migration-delay-ms-description'], /milisekundama \(100-10000\)/);
assert.equal(data['mark-all-as-unread'], 'Označi sve kao nepročitano');
console.log('bosnianAuditedTranslations: byte limits, S3 scope, CPU comparison and delay range passed');

assert.match(data['migration-info-text'], /obavljaju se jednom/);
assert.match(data['migration-info-text'], /nastavlja u pozadini čak i ako zatvorite preglednik/);
assert.match(data['migration-warning-text'], /Nemojte zatvarati preglednik/);
assert.match(data['migration-warning-text'], /nastaviti u pozadini.*potrajati duže/);
assert.match(data['migration-stop-confirm'], /zaustaviti sve migracije/);
assert.match(data['migration-progress-note'], /najnoviju strukturu/);
for (const key of ['migration-pause-failed', 'migration-start-failed', 'migration-stop-failed']) assert.match(data[key], /nije uspjelo/);
for (const key of ['migration-paused', 'migration-started', 'migration-stopped', 'migration-successful']) assert.match(data[key], /uspješno/);
assert.doesNotMatch(data['migration-started'], /oštećen.*spis/);
console.log('bosnianAuditedTranslations: background continuation, browser warning and migration results passed');
