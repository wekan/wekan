const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'iu'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 717);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const inuktitut = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/iu.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(inuktitut)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(inuktitut.accept, 'ᐊᖏᖅᐸᕋ');
assert.equal(inuktitut.board, 'ᐊᓪᓚᕕᒃ');
assert.equal(inuktitut.card, 'ᐊᓪᓚᖅᓯᒪᔪᖅ');
assert.equal(inuktitut.list, 'ᑎᑎᖅᑲᓕᐊᖅ');
assert.equal(inuktitut.swimlane, 'ᐊᖅᑯᑎ');
assert.deepEqual(tokens(inuktitut['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(inuktitut['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(inuktitut['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(inuktitut['allboards.workspaces'], 'ᐱᓕᕆᕖᑦ');
assert.equal(inuktitut['workspace-settings'], 'ᐱᓕᕆᕕᐅᑉ ᐋᖅᑭᒃᓯᒪᓂᖏᑦ');
assert.equal(inuktitut['home-board-badge'],
  'ᐊᖏᕐᕋᒥ ᐊᓪᓚᕕᒃ (ᐃᓯᕐᓂᐅᑉ ᑭᖑᓂᐊᒍᑦ ᒪᑐᐃᖅᑐᖅ)');
assert.equal(inuktitut['set-list-width-value'],
  'ᑎᑎᖅᑲᓕᐊᑉ ᓴᓂᒧᑦ ᐊᖏᓂᖓ (pixels)');
assert.equal(inuktitut['add-checklist'], 'ᓇᓗᓇᐃᖅᓯᕕᒻᒥᒃ ᐃᓚᓯᓗᑎᑦ');
assert.deepEqual(tokens(inuktitut['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(inuktitut['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(inuktitut['board-private-info']), ['</strong>', '<strong>']);
assert.equal(inuktitut['board-not-found'], 'ᐊᓪᓚᕕᒃ ᓇᓂᔭᐅᖏᑦᑐᖅ');
assert.deepEqual(tags(inuktitut['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(inuktitut['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(inuktitut['card-due'], 'ᐱᔭᕇᕐᕕᐅᔪᒃᓴᖅ');
assert.match(inuktitut['card-edit-planning-poker'], /Planning Poker/);
assert.equal(inuktitut['addBoardOrgPopup-title'], 'ᑎᒥᖁᑎᒥᒃ ᐃᓚᓯᓗᑎᑦ');
assert.equal(inuktitut['importSwimlanePopup-title'], 'ᐊᖅᑯᑎ ᐃᓯᖅᑎᓪᓗᒍ');
assert.equal(inuktitut['userPopup-title'], 'ᐃᓚᐅᔪᖅ');
assert.equal(inuktitut['map-to-existing-user-no-results'],
  'ᐊᔾᔨᖃᖅᑐᒥᒃ ᐊᑐᖅᑎᒥᒃ ᓇᓂᓯᖏᑦᑐᖅ.');
assert.equal(inuktitut['changePermissionsPopup-title'],
  'ᐊᔪᙱᔾᔪᑏᑦ ᐊᓯᔾᔨᕐᓗᒋᑦ');
assert.equal(inuktitut['auto-list-width'],
  'ᑎᑎᖅᑲᓕᐊᑉ ᓴᓂᒧᑦ ᐊᖏᓂᖓ ᐃᒻᒥᓂᒃ');
assert.equal(inuktitut['move-card-up'], 'ᐊᓪᓚᖅᓯᒪᔪᖅ ᖁᒻᒧᑦ ᓅᓪᓗᒍ');
assert.equal(inuktitut['color-red'], 'ᐊᐅᐸᖅᑐᖅ');
assert.equal(inuktitut['read-only'], 'ᐅᖃᓕᒫᑐᐃᓐᓇᕐᓂᖅ');
assert.equal(inuktitut['worker'], 'ᓴᓇᔨ');
assert.equal(inuktitut['custom-field-number'], 'ᓈᓴᐅᑎ');
assert.equal(inuktitut['date-format'], 'ᐅᓪᓗᖅ ᓴᓇᓯᒪᓂᖓ');
assert.deepEqual(tokens(inuktitut['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(inuktitut['error-list-doesNotExist'],
  'ᐅᓇ ᑎᑎᖅᑲᓕᐊᖅ ᐱᑕᖃᙱᑦᑐᖅ');
assert.equal(inuktitut['export-card-pdf'],
  'ᐊᓪᓚᖅᓯᒪᔪᖅ PDF-ᒧᑦ ᐊᓂᑎᓪᓗᒍ');
assert.equal(inuktitut['filter-due-tomorrow'],
  'ᖃᐅᑉᐸᑦ ᐱᔭᕇᖅᑕᐅᔪᒃᓴᖅ');
assert.equal(inuktitut['advanced-filter-label'],
  'ᓱᖑᐃᔾᔪᑎ ᖁᕝᕙᓯᓐᓂᖅᓴᖅ');
assert.deepEqual(tokens(inuktitut['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(inuktitut['import-trello-failed'],
  'Trello-ᒥᑦ ᐃᓯᖅᑎᑦᓯᓂᖅ ᐊᔪᖅᐳᖅ.');
assert.equal(inuktitut['trello-import-progress'],
  'ᐃᓯᖅᑎᑦᓯᓂᐅᑉ ᐱᕙᓪᓕᐊᓂᖓ');
assert.deepEqual(tokens(inuktitut['label-default']), ['%s']);
assert.deepEqual(tokens(inuktitut['leave-board-pop']), ['__boardTitle__']);
assert.equal(inuktitut['calendar'], 'ᐅᓪᓗᖅᓯᐅᑎ');
assert.equal(inuktitut['multi-selection'], 'ᐊᒥᓱᓂᒃ ᓂᕈᐊᕐᓂᖅ');
assert.deepEqual(tokens(inuktitut['page-maybe-private']), ['%s']);
assert.deepEqual(tags(inuktitut['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(inuktitut['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(inuktitut.team, 'ᐱᓕᕆᖃᑎᒌᑦ');
assert.equal(inuktitut['upload-completed'],
  'ᖃᕆᑕᐅᔭᒧᑦ ᐃᓕᓂᖅ ᐱᔭᕇᖅᐳᖅ');
assert.equal(inuktitut['welcome-board'], 'ᑐᙵᓱᒋᑦ ᐊᓪᓚᕕᒃ');
assert.equal(inuktitut['attachment-limit-mode-unlimited'],
  'ᑭᒡᓕᖃᙱᑦᑐᖅ');
assert.deepEqual(tokens(inuktitut['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(inuktitut.Database, 'ᑐᖅᑯᖅᓯᕕᒃ');
assert.equal(inuktitut.days, 'ᐅᓪᓗᑦ');
assert.equal(inuktitut['org-admin'], 'ᑎᒥᖁᑎᐅᑉ ᐊᐅᓚᑦᓯᔨᖓ');
assert.match(inuktitut['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(inuktitut['default-subtasks-board']), ['__board__']);
assert.deepEqual(tokens(inuktitut['activity-added-label']), ['%s', '%s']);
assert.equal(inuktitut['parent-card'], 'ᕿᑐᙵᖅᓯᐅᑎ ᐊᓪᓚᖅᓯᒪᔪᖅ');
assert.deepEqual(tokens(inuktitut['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(inuktitut['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(inuktitut['r-import-done']), ['__count__']);
assert.deepEqual(tokens(inuktitut['r-import-unmapped']), ['__count__']);
assert.equal(inuktitut['r-schedule-daily'], 'ᐅᓪᓗᖅ ᑕᒫᑦ');
assert.equal(inuktitut['r-trigger'], 'ᐱᒋᐊᖅᑎᑦᓯᔾᔪᑎ');
assert.equal(inuktitut['r-the-board'], 'ᐊᓪᓚᕕᒃ');
assert.equal(inuktitut['r-checklist'], 'ᓇᓗᓇᐃᖅᓯᕕᒃ');
assert.equal(inuktitut['r-d-move-to-top-gen'],
  'ᐊᓪᓚᖅᓯᒪᔪᖅ ᑎᑎᖅᑲᓕᐊᖓᑕ ᖁᓛᓄᑦ ᓅᓪᓗᒍ');
assert.equal(inuktitut['r-d-add-checklist'],
  'ᓇᓗᓇᐃᖅᓯᕕᒻᒥᒃ ᐃᓚᓯᓗᑎᑦ');
assert.equal(inuktitut['authentication-method'],
  'ᑭᓇᐅᓂᕐᒥᒃ ᓇᓗᓇᐃᕐᓂᐅᑉ ᐱᓕᕆᔾᔪᓯᖓ');
assert.deepEqual(tags(inuktitut['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(inuktitut['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(inuktitut['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(inuktitut['roles-status-sees-assigned'],
  'ᑎᓕᔭᐅᓯᒪᔪᑐᐊᑦ');
assert.equal(inuktitut.monday, 'ᓇᒡᒐᔾᔭᐅ');
assert.equal(inuktitut.sunday, 'ᓴᓇᑕᐃᓕ');
assert.equal(inuktitut.domain, 'ᐃᑭᐊᖅᑭᕕᐅᑉ ᐊᑎᖓ');
assert.equal(inuktitut['dueCards-noResults-title'],
  'ᐱᔭᕇᖅᑕᐅᔪᒃᓴᒥᒃ ᐊᓪᓚᖅᓯᒪᔪᒥᒃ ᓇᓂᓯᙱᑦᑐᖅ');
assert.deepEqual(tokens(inuktitut['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(inuktitut['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(inuktitut['operator-board'], 'ᐊᓪᓚᕕᒃ');
assert.equal(inuktitut['predicate-quarter'], 'ᑕᖅᑮᑦ ᐱᖓᓱᑦ');
assert.deepEqual(tokens(inuktitut['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(inuktitut['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.equal(inuktitut.number, 'ᓈᓴᐅᑎ');
assert.deepEqual(tokens(inuktitut['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(inuktitut['background-too-big']), ['{{size}}']);
