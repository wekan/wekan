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
const tigre = readLocale('tig');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'tig',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 624,
  'the first thirty-one 50-value Tigre batches stay resolved');

for (const [key, value] of Object.entries(tigre)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tigre.accept, 'ተቐበል');
assert.deepEqual(tokens(tigre['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tigre['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(tigre['act-deleteCard'], /መገዲ/);
assert.match(tigre['board-members-same-org-only'], /ውድብ/);
assert.match(tigre['board-members-same-team-only'], /ጉጅለ/);
assert.deepEqual(tokens(tigre['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigre['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigre['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.equal(tigre['act-importBoard'], 'ሰሌዳ __board__ ኣእተወ');
assert.match(tigre['act-addAttachment'], /ተለጣፊ/);
assert.match(tigre['act-addChecklist'], /ናይ ምርመራ ዝርዝር/);
assert.deepEqual(tokens(tigre['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tigre['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigre['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tigre['allboards.workspaces'], 'ቦታታት ዕዮ');
assert.match(tigre['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(tigre['activity-dueDate']), ['%s', '%s']);
assert.match(tigre['archive-permanent-delete-disabled-hint'], /ፓነል/);
assert.match(tigre['list-width-error-message'], /270/);
assert.equal(tigre['fixed-list-width'], 'ንኩሎም ዝርዝራት ሓደ ግፍሒ');
assert.match(tigre['set-swimlane-height-value'], /ፒክሰል/);
assert.equal(tigre['convertChecklistItemToCardPopup-title'],
  'ናብ ካርድ ቀይር');
assert.deepEqual(tokens(tigre['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(tigre['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(tigre['avatar-too-big']), ['__size__']);
assert.match(tigre['board-background-image-url'], /URL/);
assert.deepEqual(tokens(tigre['board-nb-stars']), ['%s']);
assert.deepEqual(tags(tigre['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(tigre['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tigre['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tigre['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tigre['card-comments-title']), ['%s']);
assert.match(tigre['mobile-desktop-toggle'], /ሞባይል.*ዴስክቶፕ/);
assert.match(tigre['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(tigre['editPokerEndDatePopup-title'], /Planning Poker/);
assert.match(tigre['poker-delete-pop'], /Planning Poker/);
assert.equal(tigre['importSwimlanePopup-title'], 'መገዲ ኣእቱ');
assert.match(tigre['addBoardOrgPopup-title'], /ውድብ/);
assert.match(tigre['addBoardTeamPopup-title'], /ጉጅለ/);
assert.match(tigre.casSignIn, /CAS/);
assert.match(tigre['font-preview-text'], /0123456789/);
assert.equal(tigre['restoreArchivedListToSwimlanePopup-title'],
  'ዝርዝር ናብ መገዲ መልስ');
assert.match(tigre['map-to-existing-user-search'], /ኢመይል/);
assert.equal(tigre['changeLanguagePopup-title'], 'ልሳን ቀይር');
assert.match(tigre['card-aging-days'], /3/);
assert.match(tigre['card-aging-tier1'], /1/);
assert.match(tigre['card-aging-tier2'], /2/);
assert.match(tigre['card-aging-tier3'], /3/);
assert.equal(tigre['color-black'], 'ጸሊም');
assert.equal(tigre['color-red'], 'ቀይሕ');
assert.equal(tigre['color-white'], 'ጻዕዳ');
assert.equal(tigre['color-yellow'], 'ብጫ');
assert.match(tigre['copyManyCardsPopup-instructions'], /JSON/);
const copiedCards = JSON.parse(tigre['copyManyCardsPopup-format']);
assert.equal(copiedCards.length, 3);
assert.deepEqual(Object.keys(copiedCards[0]), ['title', 'description']);
assert.match(tigre['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(tigre['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(tigre['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(tigre['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(tigre['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(tigre['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(tigre['error-json-malformed'], /JSON/);
assert.match(tigre['error-csv-schema'], /CSV.*TSV/);
assert.match(tigre['error-import-empty-board'], /WeKan/);
assert.match(tigre['export-card-pdf'], /PDF/);
assert.match(tigre['export-card-excel'], /Excel/);
assert.match(tigre['export-card-excel-no-disk-space'], /Excel/);
assert.match(tigre['export-card-field-board-info'], /መገዲ/);
assert.equal(tigre['filter-due-today'], 'ሎሚ ዝውዳእ');
assert.equal(tigre['filter-due-tomorrow'], 'ጽባሕ ዝውዳእ');
assert.match(tigre['advanced-filter-description'],
  /==.*!=.*<=.*>=.*&&.*\|\|.*Field1 == I\\'m.*\/Tes\.\*\/i/s);
assert.deepEqual(tokens(tigre['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(tigre['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(tigre['import-board-instruction-jira'],
  /Jira Cloud REST API.*GET \/rest\/api\/2\/search.*automationRules/s);
assert.match(tigre['import-board-instruction-excel'], /WeKan.*\.xlsx.*Excel/s);
assert.match(tigre['import-trello-json-file-hint'], /Trello API/);
assert.match(tigre['trello-api-key'], /Trello API.*https:\/\/trello\.com\/app-key/);
assert.match(tigre['trello-api-import-desc'], /token.*Trello API/);
assert.match(tigre['trello-cancel-delete-confirm'], /ክምለስ ኣይክእልን/);
assert.match(tigre['invalid-year'], /2026/);
assert.equal(tigre.info, 'ስሪት');
assert.deepEqual(tokens(tigre['label-default']), ['%s']);
assert.deepEqual(tokens(tigre['leave-board-pop']), ['__boardTitle__']);
assert.match(tigre['list-archive-cards-pop'], /“Menu” > “Archive”/);
assert.match(tigre['listImportCardsTsvPopup-title'], /Excel.*CSV\/TSV/);
assert.equal(tigre['no-archived-swimlanes'],
  'ኣብ መዕቀቢ መገድታት የለዉን።');
assert.deepEqual(tokens(tigre['page-maybe-private']), ['%s']);
assert.deepEqual(tags(tigre['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(tigre['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(tigre['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(tigre['public-desc'], /Google/);
assert.match(tigre['search-example'], /Enter/);
assert.match(tigre['setWipLimitPopup-title'], /WIP/);
assert.match(tigre['toggle-assignees'], /1-9/);
assert.match(tigre['toggle-labels'], /1-9/);
assert.match(tigre['custom-top-left-corner-logo-height'], /27/);
assert.match(tigre['custom-top-left-corner-logo-image-url'], /URL/);
assert.match(tigre['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(tigre['wipLimitErrorPopup-title'], /WIP/);
assert.match(tigre['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(tigre['attachment-transfer-limits-title'], /API/);
assert.match(tigre['smtp-host'], /SMTP/);
assert.match(tigre['smtp-port'], /SMTP/);
assert.match(tigre['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(tigre['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(tigre['email-smtp-test-subject'], /SMTP/);
assert.match(tigre.Node_version, /Node/);
assert.match(tigre.Meteor_version, /Meteor/);
assert.match(tigre.FerretDB_version, /FerretDB/);
assert.match(tigre.FerretDB_commit, /FerretDB/);
assert.match(tigre.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(tigre.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(tigre.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(tigre['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/s);
assert.deepEqual(tokens(tigre['default-subtasks-board']), ['__board__']);
assert.match(tigre['checklist-count-on-minicard'], /0\/0/);
assert.match(tigre['checklist-count'], /0\/0/);
assert.equal(tigre['delete-all-notifications-confirm'],
  'ኩሎም ምልክታታት ክትድምስስ ርግጸኛ ዲኻ? እዚ ትግባር ክምለስ ኣይክእልን።');
assert.equal(tigre['parent-card'], 'ወላዲ ካርድ');
assert.deepEqual(tokens(tigre['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigre['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(tigre['r-import-done']), ['__count__']);
assert.match(tigre['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.match(tigre['r-import-trello-note'], /Trello.*Butler/);
assert.deepEqual(tokens(tigre['r-import-unmapped']), ['__count__']);
assert.match(tigre['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.match(tigre['r-schedule-weekday'], /ሰኑይ–ዓርቢ/);
assert.match(tigre['r-for-n-days'], /N/);
assert.equal(tigre['r-trigger'], 'መበገሲ');
assert.equal(tigre['r-action'], 'ትግባር');

assert.equal(tigre['r-archived'], 'ናብ መዕቀቢ ተዛወረ');
assert.equal(tigre['r-remove-all'], 'ኵሎም ኣባላት ካብ ካርድ ኣልይ');
assert.equal(tigre['r-d-move-to-bottom-gen'],
  'ካርድ ናብ ታሕቲ ዝርዝራ ኣዛውር');

assert.equal(tigre['r-items-list'], 'ንጥል1,ንጥል2,ንጥል3');
assert.match(tigre['custom-head-meta-tags'], /HTML/);
assert.match(tigre['custom-head-manifest-content'], /JSON/);

assert.match(tigre['add-custom-html-after-body-start'], /<body>/);
assert.deepEqual(tokens(tigre['act-a-dueAt']), tokens(english['act-a-dueAt']));
assert.deepEqual(tokens(tigre['act-atUserComment']),
  tokens(english['act-atUserComment']));

assert.match(tigre['submit-on-enter-description'], /Shift\+Enter/);
assert.match(tigre['submit-on-enter-description'], /Ctrl\/Cmd\+Enter/);
assert.deepEqual([
  tigre.monday, tigre.tuesday, tigre.wednesday, tigre.thursday,
  tigre.friday, tigre.saturday, tigre.sunday,
], ['ሰኑይ', 'ሰሉስ', 'ረቡዕ', 'ሓሙስ', 'ዓርቢ', 'ቀዳም', 'ሰንበት']);

assert.match(tigre['invalid-domain'], /example\.com/);
assert.deepEqual(tokens(tigre['board-title-not-found']),
  tokens(english['board-title-not-found']));
assert.match(tigre['globalSearchViewChange-choice-all-description'],
  /\*ካርድታተይ\*/);

assert.deepEqual(tokens(tigre['n-n-of-n-cards-found']),
  tokens(english['n-n-of-n-cards-found']));
assert.equal(tigre['operator-customfield'].includes(' '), false);
assert.equal(tigre['operator-checklist-text'].includes(' '), false);

assert.deepEqual(tokens(tigre['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']));
assert.match(tigre['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(tigre['globalSearch-instructions-notes-3'], /\*AND\*/);

assert.deepEqual(tokens(tigre['import-dependencies-done']),
  tokens(english['import-dependencies-done']));
assert.deepEqual(tokens(tigre['background-too-big']),
  tokens(english['background-too-big']));
assert.match(tigre['import-dependencies-file'], /JSON.*SVG/);

assert.deepEqual(tokens(tigre['custom-field-stringtemplate-format']),
  tokens(english['custom-field-stringtemplate-format']));
assert.match(tigre['server-error-troubleshooting'], /sudo snap logs wekan\.wekan/);
assert.match(tigre['office-report-desc'], /IPv4.*IPv6/);

assert.match(tigre['api-report-desc'], /REST API/);
assert.match(tigre['api-no-calls'], /WITH_API=true/);
assert.match(tigre['recovery-report-desc'], /MongoDB/);

console.log('tigreTranslationProgress: first thirty-one batches passed');
