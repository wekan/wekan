const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kl'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 367);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const greenlandic = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kl.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(greenlandic)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(greenlandic.accept, 'Akueri');
assert.deepEqual(tokens(greenlandic['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(greenlandic['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(greenlandic['act-createBoard'], /ilisarnaat/);
assert.equal(greenlandic.actions, 'Iliuutsit');
assert.deepEqual(tokens(greenlandic['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(greenlandic['workspace-settings'],
  'Suliffiup aaqqissugaanera');
assert.equal(greenlandic['allboards.workspace-color'], 'Qalipaat');
assert.match(greenlandic['list-width-error-message'], /270/);
assert.equal(greenlandic['add-checklist'],
  'Misissuiffiusumik allattorsimaffik ilannguguk');
assert.deepEqual(tokens(greenlandic['avatar-too-big']), ['__size__']);
assert.equal(greenlandic['board-not-found'],
  'Ilisarnaat nassaarineqanngilaq');
assert.deepEqual(tags(greenlandic['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(greenlandic['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  greenlandic['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.equal(greenlandic['card-due'], 'Killigititaq');
assert.match(greenlandic['card-edit-planning-poker'], /Planning Poker/);
assert.equal(greenlandic['addBoardOrgPopup-title'],
  'Peqatigiiffik ilannguguk');
assert.equal(greenlandic['importSwimlanePopup-title'], 'Aqqut eqquguk');
assert.equal(greenlandic['userPopup-title'], 'Ilaasortaq');
assert.equal(greenlandic['map-to-existing-user-no-results'],
  'Atuisunik naleqquttunik nassaartoqanngilaq.');
assert.match(greenlandic['font-preview-text'], /0123456789/);
assert.equal(greenlandic['auto-list-width'],
  'Allattorsimaffiup nammineerluni silissusia');
assert.equal(greenlandic['move-card-up'], 'Kortsi qummut nuuguk');
assert.equal(greenlandic['color-red'], 'aappalaartoq');
assert.equal(greenlandic['read-only'], 'Atuinnarneq');
assert.equal(greenlandic.worker, 'Sulisartoq');
assert.equal(greenlandic['custom-field-number'], 'Kisitsineq');
assert.equal(greenlandic['date-format'], 'Ullup ilusaa');
assert.deepEqual(tokens(greenlandic['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(greenlandic['error-list-doesNotExist'],
  'Allattorsimaffik taanna piunngilaq');
assert.equal(greenlandic['export-card-pdf'], 'Kortsi PDF-imut anniguk');
assert.equal(greenlandic['filter-due-tomorrow'],
  'Aqagu killigititaq');
assert.equal(greenlandic['filter-no-member'], 'Ilaasortaqanngilaq');
assert.equal(greenlandic['advanced-filter-label'],
  'Immikkoortiterineq annertusisaq');
assert.deepEqual(tokens(greenlandic['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(greenlandic['import-trello-failed'],
  'Trello-mit eqqussineq iluatsinngilaq.');
assert.match(greenlandic['trello-api-key'],
  /https:\/\/trello.com\/app-key/);
assert.equal(greenlandic['importMapMembersAddPopup-title'],
  'Ilaasortaq toqqaruk');
assert.deepEqual(tokens(greenlandic['label-default']), ['%s']);
assert.deepEqual(tokens(greenlandic['leave-board-pop']), ['__boardTitle__']);
assert.equal(greenlandic.calendar, 'Ullorsiut');
assert.equal(greenlandic['multi-selection'], 'Toqqakkat arlallit');
assert.deepEqual(tokens(greenlandic['page-maybe-private']), ['%s']);
assert.deepEqual(tags(greenlandic['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(greenlandic['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(greenlandic.tracking, 'Malinnaaneq');
assert.match(greenlandic['custom-top-left-corner-logo-height'], /27/);
assert.equal(greenlandic['upload-completed'], 'Upload naammassivoq');
assert.deepEqual(tokens(greenlandic['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(greenlandic.Database, 'Paasissutissanik toqqorsivik');
assert.equal(greenlandic['attachment-limit-mode-unlimited'],
  'Killilersugaanngitsoq');
assert.equal(greenlandic.Database_type,
  'Paasissutissanik toqqorsiviup suussusia');
assert.match(greenlandic.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.equal(greenlandic['org-admin'], 'Peqatigiiffiup aqutsisua');
assert.deepEqual(tokens(greenlandic['default-subtasks-board']), ['__board__']);
assert.equal(greenlandic['parent-card'], 'Kortsi pingaarneq');
assert.deepEqual(tokens(greenlandic['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(greenlandic['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(greenlandic['r-import-done']), ['__count__']);
assert.equal(greenlandic['r-all-boards'], 'Ilisarnaatit tamarmik');
assert.deepEqual(tokens(greenlandic['r-import-unmapped']), ['__count__']);
assert.equal(greenlandic['r-schedule-weekday'],
  'Ullut suliffiusut tamaasa (Ata–Tall)');
assert.equal(greenlandic['r-mark-complete'],
  'Kortsi naammassineqartutut nalunaaqutseruk');
assert.equal(greenlandic['r-remove-all'],
  'Kortsimit ilaasortat tamarmik piikkit');
assert.equal(greenlandic['r-d-move-to-top-gen'],
  'Kortsi nammineq allattorsimaffiata qulaanut nuuguk');
assert.equal(greenlandic['r-send-email'], 'Emailimik nassiussigit');
assert.equal(greenlandic['r-d-remove-all-member'],
  'Ilaasortat tamarmik piikkit');
assert.equal(greenlandic['custom-product-name'],
  'Produktip aqqa nammineq toqqagaq');
assert.equal(greenlandic.layout, 'Inissititerineq');
assert.deepEqual(tags(greenlandic['add-custom-html-after-body-start']),
  ['<body>']);
assert.deepEqual(tags(greenlandic['add-custom-html-before-body-end']),
  ['</body>']);
assert.deepEqual(tokens(greenlandic['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(greenlandic['roles-status-role'], 'Inissisimaffik');
assert.equal(greenlandic.status, 'Killiffik');
assert.equal(greenlandic.monday, 'Ataasinngorneq');
assert.equal(greenlandic['shared-templates'],
  'Ilaarutit ataatsimoorussat');
assert.equal(greenlandic['globalSearchViewChange-choice-me'], 'Kortsikka');
assert.deepEqual(tokens(greenlandic['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(greenlandic['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(greenlandic['operator-board'], 'ilisarnaat');
assert.equal(greenlandic['operator-swimlane'], 'aqqut');
assert.deepEqual(tokens(greenlandic['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(greenlandic['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.equal(greenlandic['link-to-search'],
  'Ujaasinermut matumunnga linki');
assert.equal(greenlandic.number, 'Normu');
assert.deepEqual(tokens(greenlandic['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(greenlandic['background-too-big']), ['{{size}}']);
assert.equal(greenlandic['location-latitude'],
  'Avannamut kujammulluunniit inissisimaffik');
assert.deepEqual(tokens(greenlandic['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.equal(greenlandic['cardsReportTitle'], 'Kortsit nalunaarusiaat');
assert.match(greenlandic['api-no-calls'], /WITH_API=true/);
assert.equal(greenlandic['recovery-db'], 'Paasissutissanik toqqorsivik');
assert.equal(greenlandic['ticket-number'], 'Tikitip normua');
assert.equal(greenlandic['confirm-btn'], 'Uppernarsaruk');
assert.match(greenlandic.Node_heap_total_heap_size, /heap/);
assert.equal(greenlandic['attachment-move-storage-fs'],
  'Ilanngussaq filsystemimut nuuguk');
assert.equal(greenlandic['default-save-storage'],
  'Toqqorsivik nalinginnaasumik toqqorsiffiusoq');
assert.equal(greenlandic['move-progress-pause'], 'Unitsiguk');
assert.equal(greenlandic['board-title'], 'Ilisarnaatip qulequtaa');
assert.equal(greenlandic['board-status'], 'Ilisarnaatip killiffia');
assert.deepEqual(tokens(greenlandic['drag-board-to-workspace']),
  ['__workspaces__']);
assert.equal(greenlandic.accessibility, 'Tikinneqarsinnaaneq');
assert.equal(greenlandic['accounts-lockout-status'], 'Killiffik');
assert.equal(greenlandic['active-cron-jobs'],
  'Suliassat piffissalersukkat atuuttut');
assert.equal(greenlandic['attachments-path'], 'Ilanngussat aqqutaat');
assert.equal(greenlandic['filesystem-enabled'],
  'Filsystemimi toqqorsivik atulersinneqarpoq');
assert.deepEqual(tokens(greenlandic['database-migration-confirm']), ['__db__']);
assert.equal(greenlandic['sandstorm-migration-success'], 'Iluatsippoq');
