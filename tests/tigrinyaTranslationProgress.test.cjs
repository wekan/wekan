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
const tigrinya = readLocale('ti');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'ti',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1174,
  'the first twenty Tigrinya batches stay resolved');

for (const [key, value] of Object.entries(tigrinya)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tigrinya.accept, 'ተቐበል');
assert.deepEqual(tokens(tigrinya['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tigrinya['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(tigrinya['board-members-same-org-only'], /ውድብ/);
assert.match(tigrinya['board-members-same-team-only'], /ጉጅለ/);
assert.deepEqual(tokens(tigrinya['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigrinya['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigrinya['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.equal(tigrinya['act-importBoard'], 'ሰሌዳ __board__ ኣእትዩ');
assert.deepEqual(tokens(tigrinya['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tigrinya['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigrinya['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tigrinya['allboards.workspaces'], 'ቦታታት ስራሕ');
assert.match(tigrinya['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(tigrinya['activity-dueDate']), ['%s', '%s']);
assert.match(tigrinya['archive-permanent-delete-disabled-hint'], /ፓነል/);
assert.match(tigrinya['list-width-error-message'], /270/);
assert.equal(tigrinya['fixed-list-width'], 'ንኹሎም ዝርዝራት ሓደ ግፍሒ');
assert.match(tigrinya['set-swimlane-height-value'], /ፒክሰል/);
assert.equal(tigrinya['convertChecklistItemToCardPopup-title'], 'ናብ ካርድ ቀይር');
assert.deepEqual(tokens(tigrinya['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(tigrinya['avatar-too-big']), ['__size__']);
assert.match(tigrinya['board-background-image-url'], /URL/);
assert.deepEqual(tokens(tigrinya['board-nb-stars']), ['%s']);
assert.deepEqual(tags(tigrinya['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(tigrinya.archives, 'መዝገብ');
assert.deepEqual(tags(tigrinya['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tigrinya['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tigrinya['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tigrinya['card-comments-title']), ['%s']);
assert.equal(tigrinya['mobile-mode'], 'ሁነታ ሞባይል');
assert.equal(tigrinya['card-due'], 'ዕለት ገደብ');
assert.equal(tigrinya['positiveVoteMembersPopup-title'], 'ደገፍቲ');
assert.equal(tigrinya['negativeVoteMembersPopup-title'], 'ተቓወምቲ');
assert.match(tigrinya['poker-delete-pop'], /Planning Poker/);
assert.equal(tigrinya['cardDependenciesPopup-title'], 'ጽግዕተኛነት ወስኽ');
assert.equal(tigrinya['exportChecklistPopup-title'],
  'ዝርዝር መረጋገጺ ልኣኽ');
assert.equal(tigrinya['importBoardIntoPopup-title'], 'ናብ ሰሌዳ ኣእቱ');
assert.match(tigrinya.casSignIn, /CAS/);
assert.equal(tigrinya['cardType-linkedCard'], 'ዝተኣሳሰረ ካርድ');
assert.match(tigrinya['map-to-existing-user-desc'], /ፍቓድ/);
assert.match(tigrinya['font-preview-text'], /0123456789/);
assert.equal(tigrinya['changeLanguagePopup-title'], 'ቋንቋ ቀይር');
assert.equal(tigrinya['auto-list-width'], 'ራስ-ሰር ግፍሒ ዝርዝር');
assert.match(tigrinya['card-aging-days'], /3/);
assert.match(tigrinya['card-aging-tier3'], /ደረጃ 3/);
assert.equal(tigrinya['color-darkgreen'], 'ጸሊም ቀጠልያ');
assert.equal(tigrinya['color-sky'], 'ሰማያዊ ሰማይ');
assert.equal(tigrinya['read-only'], 'ንባብ ጥራይ');
assert.equal(tigrinya['confirm-move-list-to-swimlane'],
  'ነዚ ዝርዝርን ኩሎም ካርድታቱን ናብቲ ካልእ መስመር ኣዛውሮ?');
assert.equal(JSON.parse(tigrinya['copyManyCardsPopup-format']).length, 3);
assert.match(tigrinya['copyManyCardsPopup-instructions'], /JSON/);
assert.equal(tigrinya['custom-field-currency'], 'ባጤራ');
assert.equal(tigrinya['custom-field-text'], 'ጽሑፍ');
assert.deepEqual(tokens(tigrinya['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(tigrinya['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(tigrinya['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(tigrinya['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(tigrinya['error-json-malformed'], /JSON/);
assert.match(tigrinya['error-csv-schema'], /CSV.*TSV/);
assert.match(tigrinya['error-import-empty-board'], /WeKan/);
assert.equal(tigrinya['export-card'], 'ካርድ ልኣኽ');
assert.match(tigrinya['export-card-pdf'], /PDF/);
assert.match(tigrinya['export-card-excel'], /Excel/);
assert.match(tigrinya['export-card-field-board-info'], /ሰሌዳ.*ዝርዝር.*መስመር/);
assert.equal(tigrinya['filter-no-member'], 'ኣባል የለን');
assert.match(tigrinya['advanced-filter-description'], /== != <= >= && \|\|/);
assert.deepEqual(tokens(tigrinya['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(tigrinya['import-board-instruction-jira'], /automationRules/);
assert.match(tigrinya['import-board-instruction-excel'], /\.xlsx/);
assert.match(tigrinya['import-trello-zip-file-hint'], /\.json.*\.zip/);
assert.equal(tigrinya['filter-no-assignee'], 'ተመዳቢ የለን');
assert.match(tigrinya['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(tigrinya['trello-api-import-desc'], /API/);
assert.match(tigrinya['trello-cancel-delete-confirm'], /ክምለስ ኣይከኣልን/);
assert.match(tigrinya['import-members-map-note'], /ተጠቃሚ/);
assert.match(tigrinya['invalid-year'], /2026/);
assert.equal(tigrinya['label-create'], 'ምልክት ፍጠር');
assert.deepEqual(tokens(tigrinya['label-default']), ['%s']);
assert.deepEqual(tokens(tigrinya['leave-board-pop']), ['__boardTitle__']);
assert.match(tigrinya['list-archive-cards-pop'], /“Menu” > “Archive”/);
assert.match(tigrinya['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(tigrinya['multi-selection'], 'ብዙሕ ምርጫ');
assert.match(tigrinya['normal-assigned-only-desc'], /ተጠቃሚ/);
assert.deepEqual(tokens(tigrinya['page-maybe-private']), ['%s']);
assert.deepEqual(tags(tigrinya['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(tigrinya['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(tigrinya['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.equal(tigrinya['signupPopup-title'], 'መለያ ፍጠር');
assert.equal(tigrinya.team, 'ጉጅለ');
assert.match(tigrinya['toggle-assignees'], /1-9/);
assert.match(tigrinya['custom-top-left-corner-logo-height'], /27/);
assert.match(tigrinya['automatic-linked-url-schemes'], /URL Schemes.*URL Scheme/);
assert.equal(tigrinya['wipLimitErrorPopup-title'], 'ዘይቅቡል ደረት WIP');
assert.match(tigrinya['attachment-transfer-limits-title'], /API/);
assert.match(tigrinya['smtp-tls-description'], /SMTP.*TLS/);
assert.equal(tigrinya['smtp-port'], 'ወደብ SMTP');
assert.deepEqual(tokens(tigrinya['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(tigrinya.Database, 'ዳታቤዝ');
assert.match(tigrinya['bidirectional-webhooks'], /Webhooks/);
assert.match(tigrinya.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.equal(tigrinya.FerretDB_commit, 'ለውጢ FerretDB');
assert.match(tigrinya.DDP_transport, /DDP_TRANSPORT/);
assert.match(tigrinya['org-domains-description'],
  /a\.example\.com, kanban\.example\.org.*MULTITENANCY=true/);
assert.match(tigrinya['org-admins-description'], /Admin/);
assert.equal(tigrinya['team-propagate-members-to-boards'],
  'ኣባላት ናብ ሰሌዳታት ኣስፋሕፍሕ');
assert.deepEqual(tokens(tigrinya['default-subtasks-board']), ['__board__']);
assert.match(tigrinya['delete-all-notifications-confirm'], /ክምለስ ኣይከኣልን/);
assert.match(tigrinya['checklist-count-on-minicard'], /\(0\/0\)/);
assert.equal(tigrinya['parent-card'], 'ወላዲ ካርድ');
assert.equal(tigrinya['source-board'], 'ምንጪ ሰሌዳ');
assert.deepEqual(tokens(tigrinya['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigrinya['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(tigrinya['r-import-done']), ['__count__']);
assert.match(tigrinya['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.equal(tigrinya['r-board-rules'], 'ሕግታት ሰሌዳ');

console.log('tigrinyaTranslationProgress: first twenty batches passed');
