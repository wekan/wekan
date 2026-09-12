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
  assert.match(data['restore-all-archived-migration-description'], /vse arhivirane steze, sezname in kartice.*swimlaneId ali listId.*vidne/);
  assert.match(data['restore-lost-cards-migration-description'], /kartice in sezname.*swimlaneId ali listId.*Ustvari stezo »Lost Cards«.*znova vidne/);
  assert.match(data['restore-lost-cards-nothing-to-restore'], /stez, seznamov ali kartic/);
  assert.match(data['rescue-card-description-dialogue'], /Prepišem trenutni opis.*vašimi spremembami/);
  assert.match(data['run-comprehensive-migration-confirm'], /celovitosti podatkov table.*nekaj trenutkov.*nadaljevati/);

  for (const key of ['read-assigned-only-desc', 'read-only-desc']) assert.match(data[key], /Ne more urejati/);
  assert.match(data['read-assigned-only-desc'], /samo dodeljene kartice/);
  assert.match(data['poker-delete-pop'], /Brisanje je trajno.*vsa dejanja/);
  assert.match(data['remove-labels-multiselect'], /odstrani oznake 1-9/);
  assert.match(data['r-board-note'], /polje prazno.*vsako možno vrednostjo/);
  assert.match(data['preview-pdf-not-supported'], /predogleda PDF.*prenesti/);

  assert.equal(data['no-comments-desc'], 'Ne more videti komentarjev.');
  assert.match(data['normal-assigned-only-desc'], /samo dodeljene kartice.*običajni uporabnik/);
  assert.match(data['notify-participate'], /ustvarjalec ali član/);
  assert.match(data['operator-debug-invalid'], /predikat za razhroščevanje/);
  assert.match(data['operator-limit-invalid'], /pozitivno celo število/);

  assert.match(data['multi-selection-active'], /potrditvena polja.*izbiro tabel/);
  assert.equal(data['myCardsSortChange-choice-board'], 'Po tabli');
  assert.equal(data['myCardsSortChange-title'], data['myCardsSortChangePopup-title']);
  assert.notEqual(data['myCardsViewChangePopup-title'], data['myCardsSortChangePopup-title']);
  assert.match(data.newlineBecomesNewChecklistItemOriginOrder, /Vsaka vrstica.*kontrolnega seznama.*izvirnem vrstnem redu/);
  assert.equal(data['no-assignee'], data['filter-no-assignee']);

  assert.match(data['migrations-admin-only'], /samo skrbniki table/);
  assert.match(data['migrations-description'], /celovitosti podatkov te table.*Vsako selitev.*posebej/);
  for (const backend of ['fs', 'gridfs', 's3']) {
    assert.match(data[`move-all-attachments-of-board-to-${backend}`], /vse priponke table/);
    assert.match(data[`move-all-attachments-to-${backend}`], /vse priponke v/);
    assert.doesNotMatch(data[`move-all-attachments-to-${backend}`], /table/);
  }
  for (const key of ['move-all-attachments-of-board-to-s3', 'move-all-attachments-to-s3']) assert.doesNotMatch(data[key], /Amazon|oblak/);

  assert.match(data['migration-info-text'], /enkrat.*zmogljivost sistema.*ozadju.*zaprete brskalnik/);
  assert.match(data['migration-warning-text'], /ne zapirajte brskalnika.*ozadju.*traja dlje/);
  assert.match(data['migration-progress-note'], /tablo na najnovejšo strukturo/);
  assert.match(data['migration-stop-confirm'], /vse selitve/);
  assert.match(data['migration-paused'], /začasno ustavljene/);
  assert.doesNotMatch(data['migration-stopped'], /začasno/);
  for (const key of ['migration-pause-failed', 'migration-resume-failed', 'migration-start-failed', 'migration-stop-failed']) assert.match(data[key], /ni uspe/);

  assert.match(data['migration-cpu-threshold-description'], /Začasno ustavi.*preseže.*\(10-90\)/);
  assert.doesNotMatch(data['migration-cpu-threshold-description'], /doseže/);
  assert.match(data['migration-batch-size-description'], /priponk.*vsakem paketu.*\(1-100\)/);
  assert.match(data['migration-delay-ms-description'], /med paketi v milisekundah.*\(100-10000\)/);
  for (const key of ['max-avatar-filesize', 'max-upload-filesize']) assert.match(data[key], /v bajtih/);
  assert.doesNotMatch(data['migrate-all-to-s3'], /Amazon|oblak/);

  assert.match(data['import-board-zip'], /\.zip.*JSON tabel.*podmapami.*priponke/);
  assert.match(data['import-members-map-note'], /Nepreslikani člani.*trenutnemu uporabniku/);
  assert.match(data['keyboard-shortcuts-disabled'], /onemogočene.*Kliknite.*omogočite/);
  assert.match(data['keyboard-shortcuts-enabled'], /so omogočene.*Kliknite.*onemogočite/);
  for (const key of ['invite-people-error', 'invite-people-success']) assert.match(data[key], /registracijo/);
  assert.match(data['label-color-not-found'], /Barva oznake %s/);

  assert.match(data['globalSearch-instructions-status-ended'], /z datumom konca/);
  assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /dokončane/);
  assert.match(data['globalSearch-instructions-status-private'], /samo na zasebnih tablah/);
  assert.match(data['globalSearch-instructions-status-public'], /samo na javnih tablah/);
  assert.doesNotMatch(data['globalSearch-instructions-status-public'], /internet/);
  assert.match(data['globalSearch-instructions-status-all'], /arhivirane in nearhivirane/);
  assert.match(data['globalSearch-instructions-operator-user'], /član ali zadolženi uporabnik/);
  assert.notEqual(data.hideAllChecklistItems, data.hideCheckedChecklistItems);
  assert.match(data.hideCheckedChecklistItems, /označene postavke/);

  assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`.*brez roka/);
  assert.match(data['globalSearch-instructions-operator-label'], /\*<color>\* ali \*<name>\*/);
  assert.match(data['globalSearch-instructions-operator-due'], /največ.*pretečenim rokom/);
  for (const key of ['globalSearch-instructions-operator-created', 'globalSearch-instructions-operator-modified']) assert.match(data[key], /največ/);
  for (const key of ['globalSearch-instructions-operator-org', 'globalSearch-instructions-operator-team']) assert.match(data[key], /kartice na tabli, dodeljeni/);
  assert.match(data['globalSearch-instructions-operator-limit'], /pozitivno celo število.*na stran/);
  assert.match(data['globalSearch-instructions-operator-sort'], /padajoče.*`-`/);

  assert.match(data['fix-all-file-urls-migration-description'], /vseh datotečnih priponk.*pravilno zaledje.*poškodovane sklice/);
  assert.match(data['fix-avatar-urls-migration-description'], /članov table.*pravilno zaledje.*poškodovane sklice/);
  assert.match(data['globalSearch-instructions-notes-2'], /logičnim \*ALI\*.*katerega koli/);
  assert.match(data['globalSearch-instructions-notes-3'], /logičnim \*IN\*.*vse različne/);
  assert.match(data['globalSearch-instructions-notes-5'], /Privzeto.*ne preiskujejo/);
  assert.match(data['globalSearch-instructions-description'], /`list:Blocked`.*`__operator_list__:"To Review"`/);

  assert.match(data['dueCardsViewChange-choice-all-description'], /vse nedokončane kartice.*\*roka\*.*uporabnik dovoljenje/);
  assert.match(data['editVoteEndDatePopup-title'], /datum konca glasovanja/);
  assert.match(data['editPokerEndDatePopup-title'], /datum konca glasovanja.*pokru načrtovanja/);
  assert.match(data['filter-due-next-week'], /naslednji teden/);
  assert.match(data['filter-due-this-week'], /ta teden/);
  assert.notEqual(data['filter-due-next-week'], data['filter-due-this-week']);
  assert.match(data['error-csv-schema'], /CSV.*vejicami.*TSV.*tabulatorji.*pravilni obliki/);

  assert.match(data['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
  assert.match(data['custom-top-left-corner-logo-height'], /Privzeto: 27/);
  assert.match(data['delete-duplicate-empty-lists-migration-description'], /nimajo kartic IN.*enakim naslovom.*vsebuje kartice/);
  for (const key of ['delete-all-notifications-confirm', 'delete-org-confirm-popup', 'delete-team-confirm-popup', 'delete-translation-confirm-popup']) assert.match(data[key], /ni mogoče razveljaviti/);
  for (const key of ['delete-org-warning-message', 'delete-team-warning-message']) assert.match(data[key], /ni mogoče izbrisati.*vsaj en uporabnik/);
  assert.match(data['delete-linked-cards-before-this-list'], /najprej.*povezanih kartic.*kažejo na kartice na tem seznamu/);

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
    assert.equal(translator.t('operator-number-expected', { operator: 'OP', value: 'TEXT' }), "Operator OP je pričakoval število, prejel pa 'TEXT'");
    assert.equal(data['act-completeChecklist'], data['activity-checklist-completed-card']);
    assert.match(data['act-completeChecklist'], /dokončal kontrolni seznam/);
    assert.doesNotMatch(data['act-completeChecklist'], /završio|provjere/);
    assert.equal(translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'vas je omenil na kartici CARD: COMMENT na seznamu LIST v stezi LANE na tabli BOARD');
  }
  console.log('slovenianAuditedTranslations: credential distinctions, seconds and real mention rendering passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
