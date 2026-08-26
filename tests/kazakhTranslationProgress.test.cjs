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
assert.equal(Object.keys(remaining).length, 1367);

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
