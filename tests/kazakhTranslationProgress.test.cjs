const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kk'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 67);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kazakh = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kk.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kazakh)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kazakh.accept, 'Қабылдау');
assert.deepEqual(tokens(kazakh['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kazakh['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kazakh['act-createBoard'], /тақтасын/);
assert.match(kazakh['act-addBoardMember'], /мүшесін/);
assert.deepEqual(tokens(kazakh['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(kazakh['allboards.workspaces'], 'Жұмыс кеңістіктері');
assert.equal(kazakh['workspace-settings'], 'Жұмыс кеңістігінің параметрлері');
assert.equal(kazakh['home-board-badge'],
  'Басты тақта (кіргеннен кейін ашылады)');
assert.match(kazakh['list-width-error-message'], /270/);
assert.equal(kazakh['add-checklist'], 'Тексеру тізімін қосу');
assert.deepEqual(tokens(kazakh['avatar-too-big']), ['__size__']);
assert.equal(kazakh['board-not-found'], 'Тақта табылмады');
assert.deepEqual(tags(kazakh['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(kazakh['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kazakh['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.equal(kazakh['card-due'], 'Мерзімі');
assert.match(kazakh['card-edit-planning-poker'], /Planning Poker/);
assert.equal(kazakh['addBoardOrgPopup-title'], 'Ұйым қосу');
assert.equal(kazakh['importSwimlanePopup-title'], 'Swimlane импорттау');
assert.equal(kazakh['userPopup-title'], 'Мүше');
assert.equal(kazakh['map-to-existing-user-no-results'],
  'Сәйкес пайдаланушылар табылмады.');
assert.match(kazakh['font-preview-text'], /0123456789/);
assert.equal(kazakh['auto-list-width'], 'Тізімнің автоматты ені');
assert.equal(kazakh['move-card-up'], 'Карточканы жоғары жылжыту');
assert.equal(kazakh['color-red'], 'қызыл');
assert.equal(kazakh['read-only'], 'Тек оқу');
assert.equal(kazakh.worker, 'Жұмысшы');
assert.equal(kazakh['custom-field-number'], 'Сан');
assert.equal(kazakh['date-format'], 'Күн пішімі');
assert.deepEqual(tokens(kazakh['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(kazakh['error-list-doesNotExist'], 'Бұл тізім жоқ');
assert.equal(kazakh['export-card-pdf'],
  'Карточканы PDF файлына экспорттау');
assert.equal(kazakh['filter-due-tomorrow'], 'Мерзімі ертең');
assert.equal(kazakh['filter-no-member'], 'Мүше жоқ');
assert.equal(kazakh['advanced-filter-label'], 'Кеңейтілген сүзгі');
assert.deepEqual(tokens(kazakh['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(kazakh['import-trello-failed'],
  'Trello-дан импорттау сәтсіз аяқталды.');
assert.match(kazakh['trello-api-key'], /https:\/\/trello.com\/app-key/);
assert.equal(kazakh['importMapMembersAddPopup-title'], 'Мүшені таңдау');
assert.deepEqual(tokens(kazakh['label-default']), ['%s']);
assert.deepEqual(tokens(kazakh['leave-board-pop']), ['__boardTitle__']);
assert.equal(kazakh.calendar, 'Күнтізбе');
assert.equal(kazakh['multi-selection'], 'Көптік таңдау');
assert.deepEqual(tokens(kazakh['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kazakh['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(kazakh['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(kazakh.tracking, 'Қадағалау');
assert.match(kazakh['custom-top-left-corner-logo-height'], /27/);
assert.equal(kazakh['upload-completed'], 'Жүктеу аяқталды');
assert.deepEqual(tokens(kazakh['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(kazakh.Database, 'Дерекқор');
assert.equal(kazakh['attachment-limit-mode-unlimited'], 'Шектеусіз');
assert.equal(kazakh.Database_type, 'Дерекқор түрі');
assert.match(kazakh.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.equal(kazakh['org-admin'], 'Ұйым әкімшісі');
assert.deepEqual(tokens(kazakh['default-subtasks-board']), ['__board__']);
assert.equal(kazakh['parent-card'], 'Негізгі карточка');
assert.deepEqual(tokens(kazakh['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(kazakh['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kazakh['r-import-done']), ['__count__']);
assert.equal(kazakh['r-all-boards'], 'Барлық тақталар');
assert.deepEqual(tokens(kazakh['r-import-unmapped']), ['__count__']);
assert.equal(kazakh['r-schedule-weekday'], 'Әр жұмыс күні (Дс–Жм)');
assert.equal(kazakh['r-mark-complete'],
  'Карточканы аяқталған деп белгілеу');
assert.equal(kazakh['r-remove-all'],
  'Карточкадан барлық мүшелерді алып тастау');
assert.equal(kazakh['r-d-move-to-top-gen'],
  'Карточканы өз тізімінің басына жылжыту');
assert.equal(kazakh['r-send-email'], 'Электрондық хат жіберу');
assert.equal(kazakh['r-d-remove-all-member'],
  'Барлық мүшелерді алып тастау');
assert.equal(kazakh['custom-product-name'], 'Арнайы өнім атауы');
assert.equal(kazakh.layout, 'Орналасу');
assert.deepEqual(tags(kazakh['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(kazakh['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(kazakh['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(kazakh['roles-status-role'], 'Рөл');
assert.equal(kazakh.status, 'Күй');
assert.equal(kazakh.monday, 'Дүйсенбі');
assert.equal(kazakh['shared-templates'], 'Ортақ үлгілер');
assert.equal(kazakh['globalSearchViewChange-choice-me'],
  'Менің карточкаларым');
assert.deepEqual(tokens(kazakh['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(kazakh['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(kazakh['operator-board'], 'тақта');
assert.equal(kazakh['operator-swimlane'], 'жол');
assert.deepEqual(tokens(kazakh['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(kazakh['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.equal(kazakh['link-to-search'], 'Осы іздеуге сілтеме');
assert.equal(kazakh.number, 'Нөмір');
assert.deepEqual(tokens(kazakh['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(kazakh['background-too-big']), ['{{size}}']);
assert.equal(kazakh['location-latitude'], 'Ендік');
assert.deepEqual(tokens(kazakh['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.equal(kazakh['cardsReportTitle'], 'Карточкалар есебі');
assert.match(kazakh['api-no-calls'], /WITH_API=true/);
assert.equal(kazakh['recovery-db'], 'Дерекқор');
assert.equal(kazakh['ticket-number'], 'Тикет нөмірі');
assert.equal(kazakh['confirm-btn'], 'Растау');
assert.match(kazakh.Node_heap_total_heap_size, /үйме/);
assert.equal(kazakh['attachment-move-storage-fs'],
  'Тіркемені файлдық жүйеге жылжыту');
assert.equal(kazakh['attachment-repair-done'], 'Жөндеу аяқталды.');
assert.equal(kazakh['default-save-storage'], 'Әдепкі сақтау қоймасы');
assert.match(kazakh['mongodb-compact-warning'], /Meteor/);
assert.equal(kazakh['board-status'], 'Тақта күйі');
assert.deepEqual(tokens(kazakh['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(kazakh.accessibility, 'Қолжетімділік');
assert.equal(kazakh['accounts-lockout-status'], 'Күй');
assert.equal(kazakh['attachments-path'], 'Тіркемелер жолы');
assert.match(kazakh['board-backup-scheduled'], /сәтті/);
assert.equal(kazakh['filesystem-enabled'],
  'Файлдық жүйе қоймасы қосылған');
assert.deepEqual(tokens(kazakh['database-migration-confirm']), ['__db__']);
assert.equal(kazakh['sandstorm-migration-pending'], 'Әлі көшірілмеген');
assert.equal(kazakh['sandstorm-storage-item'], 'Қойма');
assert.match(kazakh['render-links-as-plain-text-description'], /<a href>/);
assert.equal(kazakh['backup-done'], 'Сақтық көшірме аяқталды');
assert.equal(kazakh['backup-schedule'], 'Жоспарланған сақтық көшірмелер');
assert.equal(kazakh['gcs-bucket'], 'Шелек');
assert.match(kazakh['cloud-connection-success'], /сәтті/);
assert.equal(kazakh['all-migrations'], 'Барлық көшірулер');
assert.match(kazakh['migration-stopped'], /сәтті/);
assert.equal(kazakh['board-migrations'], 'Тақта көшірулері');
assert.equal(kazakh['lost-cards'], 'Жоғалған карточкалар');
assert.equal(kazakh['migration-progress-status'], 'Күй');
assert.match(kazakh['migrations-admin-only'], /тақта әкімшілері/);
assert.equal(kazakh['step-fix-attachment-urls'],
  'Тіркеме URL мекенжайларын түзету');
assert.equal(kazakh['cpu-usage'], 'CPU пайдаланылуы');
assert.equal(kazakh['job-queue'], 'Тапсырмалар кезегі');
assert.equal(kazakh['memory-usage'], 'Жады пайдаланылуы');
assert.match(kazakh['migration-batch-size-description'], /1-100/);
assert.equal(kazakh['unmigrated-boards'], 'Көшірілмеген тақталар');
