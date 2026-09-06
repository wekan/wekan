const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const tajik = readLocale('tg');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'tg',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 424,
  'the first thirty-five Tajik batches stay resolved');

for (const [key, value] of Object.entries(tajik)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tajik.accept, 'Қабул кардан');
assert.deepEqual(tokens(tajik['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tajik['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(tajik['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tajik['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(tajik['board-members-same-org-only'], /Ташкилот/);
assert.match(tajik['board-members-same-team-only'], /Даста/);
assert.equal(tajik['act-importBoard'], 'тахтаи __board__-ро ворид кард');
assert.deepEqual(tokens(tajik['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__',
    '__swimlane__']);
assert.deepEqual(tokens(tajik['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tajik['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tajik['allboards.workspaces'], 'Фазоҳои корӣ');
assert.match(tajik['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(tajik['activity-dueDate']), ['%s', '%s']);
assert.match(tajik['list-width-error-message'], /270/);
assert.equal(tajik['fixed-list-width'],
  'Паҳноии яксон барои ҳамаи рӯйхатҳо');
assert.match(tajik['set-swimlane-height-value'], /пиксел/);
assert.equal(tajik['convertChecklistItemToCardPopup-title'],
  'Ба корт табдил додан');
assert.deepEqual(tokens(tajik['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(tajik['avatar-too-big']), ['__size__']);
assert.match(tajik['board-background-image-url'], /URL/);
assert.deepEqual(tokens(tajik['board-nb-stars']), ['%s']);
assert.deepEqual(tags(tajik['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(tajik['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tajik['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tajik['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tajik['card-comments-title']), ['%s']);
assert.equal(tajik['mobile-mode'], 'Ҳолати мобилӣ');
assert.equal(tajik['positiveVoteMembersPopup-title'], 'Тарафдорон');
assert.equal(tajik['negativeVoteMembersPopup-title'], 'Мухолифон');
assert.match(tajik['poker-delete-pop'], /Planning Poker/);
assert.equal(tajik['cardDependenciesPopup-title'],
  'Илова кардани вобастагӣ');
assert.equal(tajik['exportChecklistPopup-title'],
  'Содир кардани рӯйхати санҷиш');
assert.match(tajik.casSignIn, /CAS/);
assert.equal(tajik['cardType-linkedCard'], 'Корти пайвастшуда');
assert.match(tajik['map-to-existing-user-desc'], /иҷозати бештар/);
assert.match(tajik['font-preview-text'], /0123456789/);
assert.equal(tajik['changeLanguagePopup-title'], 'Тағйир додани забон');
assert.equal(tajik['auto-list-width'], 'Паҳноии худкори рӯйхат');
assert.match(tajik['card-aging-days'], /3/);
assert.match(tajik['card-aging-tier3'], /Дараҷаи 3/);
assert.equal(tajik['color-darkgreen'], 'сабзи торик');
assert.equal(tajik['color-sky'], 'осмонӣ');
assert.equal(tajik['read-only'], 'Танҳо хондан');
assert.equal(tajik['confirm-move-list-to-swimlane'],
  'Ин рӯйхат ва ҳамаи кортҳои онро ба хати дигар кӯчонед?');
assert.equal(JSON.parse(tajik['copyManyCardsPopup-format']).length, 3);
assert.match(tajik['copyManyCardsPopup-instructions'], /JSON/);
assert.equal(tajik['custom-field-currency'], 'Асъор');
assert.deepEqual(tokens(tajik['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(tajik['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.match(tajik['error-json-schema'], /JSON/);
assert.match(tajik['error-csv-schema'], /CSV.*TSV/);
assert.match(tajik['error-import-empty-board'], /WeKan/);
assert.equal(tajik['error-user-notAllowSelf'],
  'Шумо худро даъват карда наметавонед');
assert.match(tajik['export-card-excel-no-disk-space'], /Excel.*диск/);
assert.match(tajik['export-card-pdf'], /PDF/);
assert.equal(tajik['filter-overdue'], 'Муҳлат гузаштааст');
assert.equal(tajik['filter-no-member'], 'Бе аъзо');
assert.match(tajik['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(tajik['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(tajik['import-board-instruction-jira'], /automationRules/);
assert.match(tajik['import-board-instruction-excel'], /\.xlsx.*WeKan.*Excel/);
assert.match(tajik['import-trello-json-file-hint'], /Trello API/);
assert.match(tajik['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(tajik['trello-api-import-desc'], /Trello API/);
assert.equal(tajik['import-members-map-note'],
  'Эзоҳ: Аъзоёни мутобиқнашуда ба корбари ҷорӣ таъин мешаванд.');
assert.equal(tajik['invalid-year'],
  'Соли нодуруст. Лутфан ҳамаи чор рақамро ворид кунед, масалан 2026.');
assert.equal(tajik['label-create'], 'Сохтани барчасп');
assert.deepEqual(tokens(tajik['label-default']), ['%s']);
assert.deepEqual(tokens(tajik['leave-board-pop']), ['__boardTitle__']);
assert.match(tajik['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(tajik.menu, 'Меню');
assert.equal(tajik.normal, 'Одатӣ');
assert.deepEqual(tokens(tajik['page-maybe-private']), ['%s']);
assert.deepEqual(tags(tajik['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(tajik['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(tajik['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.equal(tajik['sidebar-close'], 'Пӯшидани навори канорӣ');
assert.match(tajik['toggle-assignees'], /1-9/);
assert.equal(tajik['upload-completed'], 'Воридкунӣ анҷом ёфт');
assert.match(tajik['custom-top-left-corner-logo-height'], /27/);
assert.match(tajik['automatic-linked-url-schemes'], /URL/);
assert.equal(tajik['welcome-list2'], 'Пешрафта');
assert.match(tajik['attachment-transfer-limits-description'], /API/);
assert.match(tajik['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(tajik['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(tajik.Database, 'Пойгоҳи додаҳо');
assert.equal(tajik['bidirectional-webhooks'], 'Вебҳукҳои дуҷониба');
assert.equal(tajik.Node_version, 'Версияи Node');
assert.match(tajik.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.equal(tajik.OS_Uptime, 'Муддати кори низоми амалкунанда');
assert.equal(tajik['show-field-on-card'],
  'Нишон додани ин майдон дар корт');
assert.equal(tajik['active-org'], 'Ташкилоти фаъол');
assert.match(tajik['org-domains-description'], /MULTITENANCY=true/);
assert.equal(tajik['org-admin'], 'Маъмури ташкилот');
assert.equal(tajik['active-person'], 'Шахси фаъол');
assert.equal(tajik['boardDeletePopup-title'], 'Тахта нест карда шавад?');
assert.deepEqual(tokens(tajik['default-subtasks-board']), ['__board__']);
assert.equal(tajik['subtask-settings'], 'Танзимоти зервазифаҳо');
assert.match(tajik['checklist-count-on-minicard'], /\(0\/0\)/);
assert.equal(tajik['parent-card'], 'Волид-корт');
assert.deepEqual(tokens(tajik['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.equal(tajik['r-rule'], 'Қоида');
assert.equal(tajik['r-workflow-view'], 'Намуди ҷараёни кор');
assert.deepEqual(tokens(tajik['r-w-every-day-at']), ['__time__']);
assert.match(tajik['r-import-trello'], /Trello Butler/);
assert.deepEqual(tokens(tajik['r-import-done']), ['__count__']);
assert.equal(tajik['r-workspace'], 'Фазои корӣ');
assert.match(tajik['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(tajik['r-import-unmapped']), ['__count__']);
assert.match(tajik['r-schedule-weekday'], /душанбе–ҷумъа/);
assert.equal(tajik['r-mark-complete'],
  'Кортро анҷомшуда қайд кардан');
assert.equal(tajik['r-trigger'], 'Ангезанда');
assert.equal(tajik['set-filter'], 'Таъин кардани полоиш');
assert.equal(tajik['r-unarchived'], 'Аз бойгонӣ барқарор шуд');
assert.equal(tajik['r-remove-all'],
  'Хориҷ кардани ҳамаи аъзоён аз корт');
assert.equal(tajik['r-rule-details'], 'Тафсилоти қоида');
assert.equal(tajik['r-d-move-to-bottom-gen'],
  'Кӯчонидани корт ба поёни рӯйхати он');
assert.equal(tajik['r-d-unarchive'],
  'Барқарор кардани корт аз бойгонӣ');
assert.match(tajik['r-items-list'], /банди1,банди2,банди3/);
assert.match(tajik['r-checklist-note'], /вергул/);
assert.equal(tajik['authentication-method'], 'Усули аутентификатсия');
assert.match(tajik['custom-head-meta-tags'], /HTML/);
assert.match(tajik['custom-head-manifest-content'], /JSON/);
assert.deepEqual(tags(tajik['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(tajik['add-custom-html-before-body-end']), ['</body>']);
assert.match(tajik['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(tajik['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(tajik['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(tajik['show-desktop-drag-handles'],
  'Нишон додани дастакҳои кашиши мизи корӣ');
assert.match(tajik['submit-on-enter-description'], /Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(tajik['newOrgPopup-title'], 'Ташкилоти нав');
assert.match(tajik['roles-info'], /Панели маъмурӣ/);
assert.equal(tajik['roles-status-sees-assigned'], 'Танҳо таъиншудаҳо');
assert.equal(tajik.monday, 'Душанбе');
assert.equal(tajik.sunday, 'Якшанбе');
assert.match(tajik['invalid-domain'], /example\.com.*@/);
assert.equal(tajik['shared-templates'], 'Қолабҳои муштарак');
assert.match(tajik['dueCardsViewChange-choice-all-description'], /\*Муҳлат\*/);
assert.match(tajik['globalSearchViewChange-choice-all-description'],
  /\*Кортҳои ман\*/);
assert.deepEqual(tokens(tajik['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(tajik['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(tajik['list-title-not-found']), ['%s']);
assert.deepEqual(tokens(tajik['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.deepEqual(tokens(tajik['comment-not-found']), ['%s']);
assert.equal(tajik['operator-board'], 'тахта');
assert.doesNotMatch(tajik['operator-customfield'], /\s/);
assert.doesNotMatch(tajik['operator-checklist-text'], /\s/);
assert.equal(tajik['predicate-overdue'], 'муҳлатгузашта');
assert.deepEqual(tokens(tajik['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(tajik['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tags(tajik['globalSearch-instructions-operator-board']),
  ['<title>', '<title>']);
assert.deepEqual(tokens(tajik['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']));
assert.deepEqual(tokens(tajik['globalSearch-instructions-notes-3-2']),
  tokens(english['globalSearch-instructions-notes-3-2']));
assert.equal(tajik['sort-boards-title-asc'], 'Унвон (A → Z)');
assert.equal(tajik['dependency-type-is-blocked-by'], 'Бо ин монеъ шудааст');
assert.match(tajik['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(tajik['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(tajik['background-too-big']), ['{{size}}']);
assert.equal(tajik.location, 'Ҷойгоҳ');
assert.match(tajik['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(tajik['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(tajik['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.equal(tajik.securityReportTitle, 'Гузориши амният');
assert.match(tajik['office-report-desc'], /IPv4.*IPv6/);
assert.equal(tajik.officeReportTitle, 'Дафтарҳо');
assert.match(tajik['api-report-desc'], /REST API/);
assert.match(tajik['api-no-calls'], /WITH_API=true/);
assert.match(tajik['recovery-report-desc'], /MongoDB/);
assert.equal(tajik['recovery-severity'], 'Шиддат');
assert.match(tajik.Bounce, /Bounce/);
assert.equal(tajik['ticket-number'], 'Рақами дархост');
assert.equal(tajik['help-request'], 'Дархости кумак');
assert.match(tajik.Node_heap_malloced_memory, /Node.*malloc/);
assert.match(tajik.Node_memory_usage_rss, /Node/);
assert.match(tajik['custom-legal-notice-link-url'], /URL/);
assert.equal(tajik.moveChecklist, 'Кӯчонидани рӯйхати санҷиш');
assert.match(tajik.newLineNewItem, /=/);
assert.equal(tajik['attachment-move-storage-gridfs'],
  'Кӯчонидани замима ба GridFS');
assert.match(tajik['attachment-repair-locations-description'], /GridFS/);
assert.equal(tajik['move-progress-resume'], 'Идома додан');
assert.equal(tajik['gridfs-file-id'], 'ID-и файли GridFS');
assert.match(tajik['mongodb-compact-warning'], /oplog.*Meteor/);
assert.equal(tajik['mongodb-compact-run'], 'Иҷрои MongoDB Compact');
assert.equal(tajik['board-status-time-spent-total'],
  'Вақти умумии сарфшуда');
assert.match(tajik['preview-pdf-not-supported'], /PDF/);
assert.deepEqual(tokens(tajik['drag-board-to-workspace']), ['__workspaces__']);
assert.match(tajik['show-week-of-year'], /ISO 8601/);
assert.match(tajik['import-board-zip'], /\.zip.*JSON/);
assert.equal(tajik['support-page-enabled'], 'Саҳифаи дастгирӣ фаъол аст');
assert.equal(tajik.accessibility, 'Дастрасӣ');
assert.match(tajik['accounts-lockout-info'], /ҷустуҷӯи фарогир/);
assert.equal(tajik['accounts-lockout-user-locked'], 'Корбар қулф шудааст');
assert.equal(tajik['admin-people-filter-inactive'], 'Ғайрифаъол');
assert.equal(tajik['attachment-storage-configuration'],
  'Танзимоти анбори замимаҳо');
assert.match(tajik['board-archive-scheduled'], /бомуваффақият/);

console.log('tajikTranslationProgress: first thirty-five batches passed');
