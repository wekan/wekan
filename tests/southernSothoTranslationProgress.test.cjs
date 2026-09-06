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
const sesotho = readLocale('st');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'st',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 874,
  'the first twenty-five Southern Sotho batches stay resolved');

for (const [key, value] of Object.entries(sesotho)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.deepEqual(tokens(sesotho['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__',
    '__swimlane__']);
assert.deepEqual(tokens(sesotho['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(sesotho['allboards.workspaces'], 'Dibaka tsa mosebetsi');
assert.equal(sesotho.actions, 'Diketso');
assert.equal(sesotho['allboards.workspace-color'], 'Mmala');
assert.deepEqual(tokens(sesotho['activity-dueDate']), ['%s', '%s']);
assert.equal(sesotho['fixed-list-width'],
  'Bophara bo tshwanang bakeng sa manane ohle');
assert.equal(sesotho['add-members'], 'Eketsa ditho');
assert.deepEqual(tokens(sesotho['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(sesotho['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(sesotho['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(sesotho['board-not-found'], 'Boto ha e a fumanwa');
assert.deepEqual(tags(sesotho['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  sesotho['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.deepEqual(tokens(sesotho['card-comments-title']), ['%s']);
assert.equal(sesotho['mobile-mode'], 'Mokgwa wa selefouno');
assert.equal(sesotho['positiveVoteMembersPopup-title'], 'Batsehetsi');
assert.equal(sesotho['vote-question'], 'Potso ya kgetho');
assert.match(sesotho['poker-delete-pop'], /Planning Poker/);
assert.equal(sesotho['exportChecklistPopup-title'],
  'Ntsha lenane la tlhahlobo');
assert.equal(sesotho['cardType-linkedCard'], 'Karete e hoketsweng');
assert.match(sesotho['map-to-existing-user-desc'], /ditumello/);
assert.match(sesotho['font-preview-text'], /0123456789/);
assert.equal(sesotho['changeLanguagePopup-title'], 'Fetola puo');
assert.equal(sesotho['auto-list-width'], 'Bophara bo iketsang ba lenane');
assert.match(sesotho['card-aging-tier3'], /Mokgahlelo wa 3/);
assert.equal(sesotho['color-darkgreen'], 'botala bo lefifi');
assert.equal(sesotho['color-sky'], 'bolou ba lehodimo');
assert.equal(sesotho['read-only'], 'Ho bala feela');
assert.equal(sesotho['confirm-move-list-to-swimlane'],
  'Fallisetsa lenane lena le dikarete tsohle tsa lona tseleng e nngwe?');
assert.equal(JSON.parse(sesotho['copyManyCardsPopup-format']).length, 3);
assert.equal(sesotho['custom-field-currency'], 'Tjhelete');
assert.deepEqual(tokens(sesotho['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(sesotho['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.match(sesotho['error-json-schema'], /JSON/);
assert.match(sesotho['error-import-empty-board'], /WeKan/);
assert.equal(sesotho['error-user-notAllowSelf'], 'O ke ke wa imema ka bowena');
assert.match(sesotho['export-card-excel-no-disk-space'], /Excel/);
assert.equal(sesotho['filter-overdue'], 'E fetilwe ke nako');
assert.equal(sesotho['filter-no-member'], 'Ha ho setho');
assert.match(sesotho['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(sesotho['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(sesotho['import-board-instruction-jira'], /automationRules/);
assert.match(sesotho['import-trello-json-file-hint'], /Trello API/);
assert.match(sesotho['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(sesotho['trello-api-import-desc'], /Trello API/);
assert.equal(sesotho['invalid-year'],
  'Selemo ha se sebetse. Ka kopo ngola dipalo tsohle tse nne, mohlala 2026.');
assert.equal(sesotho['label-create'], 'Theha leibole');
assert.deepEqual(tokens(sesotho['label-default']), ['%s']);
assert.deepEqual(tokens(sesotho['leave-board-pop']), ['__boardTitle__']);
assert.equal(sesotho.menu, 'Lenane la dikgetho');
assert.equal(sesotho.normal, 'Tlwaelehileng');
assert.deepEqual(tokens(sesotho['page-maybe-private']), ['%s']);
assert.deepEqual(tags(sesotho['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(sesotho['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(sesotho['sidebar-close'], 'Kwala bara e ka thoko');
assert.match(sesotho['toggle-assignees'], /1-9/);
assert.equal(sesotho['upload-completed'], 'Ho kenya ho phethilwe');
assert.match(sesotho['custom-top-left-corner-logo-height'], /27/);
assert.equal(sesotho['welcome-list2'], 'Tse tswetseng pele');
assert.deepEqual(tokens(sesotho['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(sesotho['attachment-transfer-limits-description'], /API/);
assert.match(sesotho['smtp-tls-description'], /TLS.*SMTP/);
assert.equal(sesotho.Database, 'Polokelo ya data');
assert.match(sesotho.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(sesotho.DDP_transport, /DDP_TRANSPORT/);
assert.match(sesotho['org-domains-description'], /MULTITENANCY=true/);
assert.equal(sesotho['org-admin'], 'Molaodi wa Mokgatlo');
assert.deepEqual(tokens(sesotho['default-subtasks-board']), ['__board__']);
assert.equal(sesotho['delete-board'], 'Hlakola boto');
assert.equal(sesotho['checklist-count-on-minicard'],
  'Palo ya dintho tsa lenane la tlhahlobo (0/0) kareteng e nyenyane');
assert.equal(sesotho['parent-card'], 'Karete ya motswadi');
assert.deepEqual(tokens(sesotho['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(sesotho['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(sesotho['r-import-done']), ['__count__']);
assert.match(sesotho['r-import-trello-note'], /Trello.*Butler/);
assert.match(sesotho['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(sesotho['r-import-unmapped']), ['__count__']);
assert.equal(sesotho['r-schedule-daily'], 'Letsatsi le leng le le leng');
assert.equal(sesotho['r-mark-complete'], 'Tshwaya karete e phethilwe');
assert.equal(sesotho['r-unarchived'], 'E buseditswe ho tswa Polokelong');
assert.equal(sesotho['r-remove-all'], 'Tlosa ditho tsohle kareteng');
assert.equal(sesotho['r-send-email'], 'Romela imeile');
assert.equal(sesotho['r-d-move-to-top-gen'],
  'Fallisetsa karete hodimo lenaneng la yona');
assert.equal(sesotho['r-items-list'], 'ntho1,ntho2,ntho3');
assert.match(sesotho['r-checklist-note'], /dikoma/);
assert.match(sesotho['custom-head-manifest-content'], /JSON/);
assert.match(sesotho['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(sesotho['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(sesotho['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(sesotho['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(sesotho['drag-to-resize-sidebar'],
  'Hula ho fetola boholo ba bara e ka thoko');
assert.match(sesotho['submit-on-enter-description'], /Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(sesotho['roles-status-sees-assigned'], 'Tse abetsweng feela');
assert.equal(sesotho.monday, 'Mantaha');
assert.equal(sesotho.sunday, 'Sontaha');
assert.match(sesotho['invalid-domain'], /example\.com.*@/);
assert.equal(sesotho['globalSearchViewChange-choice-me'], 'Dikarete tsa ka');
assert.deepEqual(tokens(sesotho['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(sesotho['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(sesotho['list-title-not-found']), ['%s']);

console.log('southernSothoTranslationProgress: first twenty-five batches passed');
