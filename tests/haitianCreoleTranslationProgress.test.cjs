const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ht'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 67);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const creole = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ht.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(creole)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(creole.accept, 'Aksepte');
assert.match(creole['act-createBoard'], /tablo/i);
assert.match(creole['act-createCard'], /kat/i);
assert.deepEqual(tokens(creole['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(creole['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__', '__swimlane__']);
assert.equal(creole['allboards.workspaces'], 'Espas travay');
assert.equal(creole['home-board-badge'], 'Tablo Akèy (ouvri apre koneksyon)');
assert.equal(creole['set-list-width-value'], 'Lajè lis (piksèl)');
assert.deepEqual(tokens(creole['and-n-other-card']), ['__count__']);
assert.deepEqual(tags(creole['board-private-info']), ['</strong>', '<strong>']);
assert.equal(creole['board-not-found'], 'Tablo pa jwenn');
assert.deepEqual(tags(creole['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(creole['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(creole['card-due'], 'Dat limit');
assert.equal(creole['vote-for-it'], 'pou li');
assert.match(creole['card-edit-planning-poker'], /Planning Poker/);
assert.equal(creole['importSwimlanePopup-title'], 'Enpòte kouloir');
assert.equal(creole['userPopup-title'], 'Manm');
assert.equal(creole['map-to-existing-user-no-results'],
  'Pa jwenn okenn itilizatè ki koresponn.');
assert.equal(creole['changePermissionsPopup-title'], 'Chanje otorizasyon');
assert.equal(creole['auto-list-width'], 'Lajè otomatik lis');
assert.equal(creole['move-card-up'], 'Deplase kat anlè');
assert.equal(creole['color-sky'], 'ble syèl');
assert.equal(creole['comment-only'], 'Kòmantè sèlman');
assert.equal(creole['copy-link-to-clipboard'], 'Kopye lyen nan papye-presse');
assert.equal(creole['custom-field-number'], 'Nimewo');
assert.equal(creole['custom-field-text'], 'Tèks');
assert.deepEqual(tokens(creole['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(creole['error-list-doesNotExist'], 'Lis sa a pa egziste');
assert.equal(creole['export-card'], 'Ekspòte kat');
assert.equal(creole['filter-overdue'], 'Anreta');
assert.equal(creole['filter-no-member'], 'San manm');
assert.equal(creole['filter-assignee-label'], 'Filtre pa moun ki asiyen');
assert.deepEqual(tokens(creole['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(creole['import-trello-zip-too-many-files'],
  '.zip la gen twòp fichye pou enpòte.');
assert.equal(creole['trello-import-progress'], 'Pwogrè enpòtasyon');
assert.equal(creole['invalid-year'],
  'Ane pa valab. Tanpri tape tout kat chif yo, pa egzanp 2026.');
assert.deepEqual(tokens(creole['label-default']), ['%s']);
assert.deepEqual(tokens(creole['leave-board-pop']), ['__boardTitle__']);
assert.equal(creole['multi-selection'], 'Seleksyon miltip');
assert.equal(creole['no-archived-swimlanes'], 'Pa gen kouloir nan Achiv.');
assert.deepEqual(tokens(creole['page-maybe-private']), ['%s']);
assert.deepEqual(tags(creole['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(creole['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(creole['sidebar-close'], 'Fèmen ba lateral');
assert.equal(creole['starred-boards'], 'Tablo favori');
assert.equal(creole['upload-completed'], 'Voye a fini');
assert.equal(creole['wipLimitErrorPopup-title'], 'Limit WIP pa valab');
assert.equal(creole['attachment-limit-mode-unlimited'], 'San limit');
assert.deepEqual(tokens(creole['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(creole.Database, 'Bazdone');
assert.equal(creole.Database_type, 'Tip bazdone');
assert.match(creole.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(creole['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(creole['default-subtasks-board']), ['__board__']);
assert.equal(creole['parent-card'], 'Kat paran');
assert.deepEqual(tokens(creole['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(creole['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(creole['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(creole['r-import-done']), ['__count__']);
assert.deepEqual(tokens(creole['r-import-unmapped']), ['__count__']);
assert.equal(creole['r-schedule-weekday'], 'Chak jou lasemèn (Lendi–Vandredi)');
assert.equal(creole['r-mark-complete'], 'Make kat kòm fini');
assert.equal(creole['r-the-board'], 'tablo a');
assert.equal(creole['r-remove-all'], 'Retire tout manm sou kat la');
assert.equal(creole['r-d-move-to-bottom-gen'], 'Deplase kat anba lis li a');
assert.equal(creole['r-d-archive'], 'Deplase kat nan Achiv');
assert.equal(creole['r-items-list'], 'eleman1,eleman2,eleman3');
assert.equal(creole['authentication-method'], 'Metòd otantifikasyon');
assert.deepEqual(tags(creole['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(creole['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(creole['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(creole['open-many-cards-at-once'], 'Louvri plizyè kat anmenmtan');
assert.equal(creole['roles-status-sees-assigned'], 'Sa ki asiyen sèlman');
assert.equal(creole.sunday, 'Dimanch');
assert.equal(creole['shared-templates'], 'Modèl pataje');
assert.equal(creole['globalSearchViewChange-choice-me'], 'Kat mwen yo');
assert.deepEqual(tokens(creole['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(creole['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(creole['operator-limit'], 'plafon');
assert.equal(creole['predicate-quarter'], 'trimès');
assert.deepEqual(tokens(creole['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(creole['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tags(creole['globalSearch-instructions-operator-board']),
  ['<title>', '<title>']);
assert.equal(creole['card-dependencies'], 'Depandans');
assert.deepEqual(tokens(creole['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(creole['background-too-big']), ['{{size}}']);
assert.equal(creole['location-latitude'], 'Latitid');
assert.deepEqual(tokens(creole['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(creole['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.match(creole['api-no-calls'], /WITH_API=true/);
assert.equal(creole['recovery-db'], 'Bazdone');
assert.equal(creole['cardDetailsPopup-title'], 'Detay kat');
assert.equal(creole['add-teams'], 'Ajoute ekip');
assert.match(creole.Node_heap_total_heap_size, /Node/);
assert.equal(creole['attachment-move-storage-s3'], 'Deplase pyès jwenn nan S3');
assert.equal(creole['move-storage-fs'], 'Sistèm fichye');
assert.equal(creole['attachment-repair-done'], 'Reparasyon fini.');
assert.match(creole['mongodb-compact-warning'], /Meteor/);
assert.equal(creole['board-status'], 'Estati tablo');
assert.deepEqual(tokens(creole['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(creole['accessibility'], 'Aksesibilite');
assert.equal(creole['accounts-lockout-unlock-all'], 'Debloke tout');
assert.equal(creole['attachments-path'], 'Chemen pyès jwenn');
assert.equal(creole['cron-migrations'], 'Migrasyon pwograme');
assert.equal(creole['cron-job-deleted'], 'Travay pwograme a efase avèk siksè');
assert.deepEqual(tokens(creole['database-migration-confirm']), ['__db__']);
assert.match(creole['database-migration-description'], /WEKAN_FERRETDB_URL/);
assert.match(creole['cards-loading-description'], /CARDS_LOADING_LAZY_THRESHOLD/);
assert.deepEqual(tags(creole['render-links-as-plain-text-description']), ['<a href>']);
assert.equal(creole['backup-done'], 'Sovgad fini');
assert.equal(creole['backup-frequency-weekly'], 'Chak semèn');
assert.equal(creole['gcs-bucket'], 'Resipyan GCS');
assert.match(creole['gcs-permissions-note'], /client_email/);
assert.equal(creole['gridfs-enabled'], 'GridFS aktive');
assert.equal(creole['migration-progress'], 'Pwogrè migrasyon');
assert.match(creole['s3-region-description'], /us-east-1/);
assert.equal(creole['lost-cards'], 'Kat pèdi');
assert.match(creole['restore-lost-cards-migration-description'], /swimlaneId/);
assert.equal(creole['step-validate-migration'], 'Valide migrasyon');
assert.equal(creole['step-fix-attachment-urls'], 'Korije URL pyès jwenn');
assert.equal(creole['every-6-hours'], 'Chak 6 èdtan');
assert.equal(creole['job-queue'], 'Fil datant travay');
assert.equal(creole['memory-usage'], 'Itilizasyon memwa');
assert.equal(creole['migration-cpu-threshold'], 'Papòt CPU (%)');
assert.equal(creole['unmigrated-boards'], 'Tablo ki poko migre');
