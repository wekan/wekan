'use strict';

// docs/Features/Cards/Card-Fields.md: an opened card shows only the fields it
// has data in - plus its description, attachments and comments, empty or not,
// and its cover when it has one - and "+ Add", under the cover, chooses the
// rest for this card, in the Admin Panel's left menu and right pane.
// Run: node tests/cardShownFields.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardShownFields.js');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardShownFields:');

// A board that allows every per-card field.
const fullBoard = () => {
  const b = { _id: 'b1', scrum: { visibility: {} } };
  for (const key of f.FIELD_KEYS) {
    const spec = CARD_SETTINGS_ROWS.find(r => r.key === key).card;
    if (spec.scrum) b.scrum.visibility[spec.scrum] = true;
    else b[spec.field] = true;
  }
  return b;
};
const flagOf = key => CARD_SETTINGS_ROWS.find(r => r.key === key).card;

test('every section field is a Board Settings / Card row with a card side', () => {
  for (const key of f.FIELD_KEYS) assert.ok(flagOf(key), key);
  assert.strictEqual(new Set(f.FIELD_KEYS).size, f.FIELD_KEYS.length, 'each field once');
  // Every per-card field is in a section of the popup.
  const { SECTIONS } = require('../models/lib/cardSettingsSections.js');
  for (const key of f.FIELD_KEYS) assert.ok(SECTIONS.some(s => s.keys.includes(key)), key);
});

test('an empty card shows only its description, attachments and comments', () => {
  const card = { _id: 'c1' };
  const shown = f.FIELD_KEYS.filter(k => f.isShown(k, card, {}));
  assert.deepStrictEqual(shown.sort(), ['attachments', 'comments', 'descriptionText', 'descriptionTitle']);
  const view = f.boardForCard(fullBoard(), card, {});
  assert.strictEqual(view.allowsDueDate, false);
  assert.strictEqual(view.allowsLabels, false);
  assert.strictEqual(view.allowsCoverAttachmentOnCard, false, 'no cover set');
  assert.strictEqual(view.allowsDescriptionText, true);
  assert.strictEqual(view.allowsAttachments, true);
  assert.strictEqual(view.allowsComments, true);
  assert.strictEqual(view.scrum.visibility.cardSprint, false);
});

test('a field with data is shown: dates, people, labels, checklists, the cover, Scrum...', () => {
  const card = {
    _id: 'c1', dueAt: new Date(), labelIds: ['l1'], members: ['u1'], coverId: 'a1',
    customFields: [{ _id: 'f1', value: 'x' }], vote: { question: 'Q?' }, scrum: { sprintId: 's1' },
  };
  const counts = { checklists: 2, subtasks: 0, textNotes: 1 };
  for (const k of ['dueDate', 'labels', 'members', 'cover', 'customFields', 'vote', 'scrumSprint', 'checklists', 'textNotes']) {
    assert.ok(f.isShown(k, card, counts), k);
  }
  for (const k of ['startDate', 'assignee', 'stickers', 'subtasks', 'poker', 'scrumRelease', 'creator', 'cardNumber', 'activities']) {
    assert.ok(!f.isShown(k, card, counts), `negative: ${k}`);
  }
  const view = f.boardForCard(fullBoard(), card, counts);
  assert.strictEqual(view.allowsDueDate, true);
  assert.strictEqual(view.allowsStartDate, false);
  assert.strictEqual(view.allowsCoverAttachmentOnCard, true);
  assert.strictEqual(view.scrum.visibility.cardSprint, true);
  assert.strictEqual(view.scrum.visibility.cardRelease, false);
  // An empty custom field value, or an empty list, is not data.
  assert.ok(!f.hasData('customFields', { customFields: [{ _id: 'f', value: '' }, { _id: 'g', value: [] }, { _id: 'h', value: null }] }));
});

test('+ Add ticks an empty field onto the card, unticks one with data off it; only what differs is kept', () => {
  let card = { _id: 'c1', dueAt: new Date() };
  card = { ...card, ...f.cardFieldsAfter(card, 'startDate', true, {}) };
  assert.deepStrictEqual(card.shownFields, ['startDate']);
  assert.ok(f.isShown('startDate', card, {}));
  card = { ...card, ...f.cardFieldsAfter(card, 'dueDate', false, {}) };
  assert.deepStrictEqual(card.hiddenFields, ['dueDate']);
  assert.ok(!f.isShown('dueDate', card, {}), 'hidden although it has a date');
  card = { ...card, ...f.cardFieldsAfter(card, 'comments', false, {}) };
  assert.ok(!f.isShown('comments', card, {}), 'even an always-shown one can be unticked');
  // Ticking back what the data would show anyway leaves no entry behind.
  card = { ...card, ...f.cardFieldsAfter(card, 'dueDate', true, {}) };
  card = { ...card, ...f.cardFieldsAfter(card, 'startDate', false, {}) };
  card = { ...card, ...f.cardFieldsAfter(card, 'comments', true, {}) };
  assert.deepStrictEqual([card.shownFields, card.hiddenFields], [[], []]);
  // Negative: a key that is not a per-card field is never stored.
  const junk = f.cardFieldsAfter({ shownFields: ['$where', 'dueDate'] }, 'allowsX', true, {});
  assert.deepStrictEqual(junk, { shownFields: ['dueDate'], hiddenFields: [] });
});

test('Board Settings / Card still decides what a card CAN show', () => {
  const board = fullBoard();
  board.allowsDueDate = false;
  board.scrum.visibility.cardSprint = false;
  const card = { _id: 'c1', dueAt: new Date(), shownFields: ['dueDate'], scrum: { sprintId: 's' } };
  const view = f.boardForCard(board, card, {});
  assert.strictEqual(view.allowsDueDate, false, 'never turned back on by the card');
  assert.strictEqual(f.boardAllows(board, 'dueDate'), false);
  assert.strictEqual(f.boardAllows({ _id: 'b' }, 'scrumSprint'), false, 'Scrum fields are off until turned on');
  // A plain flag the board never set reads its row's default.
  assert.strictEqual(f.boardAllows({}, 'cardNumber'), false);
  assert.strictEqual(f.boardAllows({ allowsCardNumber: true }, 'cardNumber'), true);
});

test('the same board object when the card shows everything; one cached view per set', () => {
  const board = fullBoard();
  const everything = { _id: 'c', shownFields: f.FIELD_KEYS.slice() };
  assert.strictEqual(f.boardForCard(board, everything, {}), board);
  const a = f.boardForCard(board, { _id: 'a' }, {});
  assert.strictEqual(f.boardForCard(board, { _id: 'b' }, {}), a);
  assert.strictEqual(Object.getPrototypeOf(a), Object.getPrototypeOf(board), 'board helpers still work');
  assert.notStrictEqual(board.allowsDueDate, false, 'the board itself is unchanged');
});

test('the opened card: "+ Add" under the cover, the per-card currentBoard, the Scrum sections', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const cover = jade.indexOf('img.card-details-cover-image');
  const add = jade.indexOf('a.card-details-add-fields-button.js-open-card-add-fields');
  const left = jade.indexOf('.card-details-left', cover);
  assert.ok(cover !== -1 && cover < add && add < left, '+ Add is under the cover, above the fields');
  assert.match(jade.slice(add - 300, add), /if canModifyCard\n\s+\.card-details-add-fields\n/, 'only for who may change the card');
  const js = read('client/components/cards/cardAddFields.js');
  for (const name of ['cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDates', 'cardFieldSectionMembers',
    'cardFieldSectionDependencies', 'cardFieldSectionSort', 'cardFieldSectionCustomFields',
    'cardFieldSectionVoteAndPoker', 'cardFieldSectionDescription', 'cardCommentsSection']) {
    assert.ok(js.includes(`'${name}'`), name);
  }
  assert.match(js, /Template\[name\]\.helpers\(\{\n\s+currentBoard\(\)/);
  // "+ Add" opens Board Settings / Card - the same popup - for this card.
  assert.match(js, /const data = \{ card \};\n\s+Popup\.open\('boardCardSettings'\)\.call\(\{ currentData: \(\) => data \}, event\);/);
  assert.match(read('client/components/cards/cardDetails.js'), /sections\.filter\(s => !\/\^scrum\[A-Z\]\/\.test\(s\) \|\| cardShowsField\(card, s\)\)/);
  // Negative: every section template of the opened card that reads a board
  // flag is in the list - a new one left out would show empty fields again.
  const sectionTemplates = [...jade.matchAll(/^template\(name="(cardFieldSection\w+)"\)/gm)].map(m => m[1]);
  for (const name of sectionTemplates) {
    const body = jade.slice(jade.indexOf(`template(name="${name}")`)).split(/\ntemplate\(/)[0];
    if (/currentBoard\.allows/.test(body)) assert.ok(js.includes(`'${name}'`), `${name} reads currentBoard but is not given the card's view`);
  }
});

test('the popup is Board Settings / Card: sections on the left, Show on Minicard, Show on Card and On this card on the right', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const popup = jade.slice(jade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
  assert.match(popup, /\+leftMenu\(settingsMenuItems\)\n\s+\.main-body\n\s+\+paneTitle\(settingsPaneTitle\)/);
  assert.match(popup, /if settingsCardId\n\s+if row\.perCard\n\s+span\.card-settings-side\.card-settings-side-this\n\s+a\.flex\.card-add-field\.js-card-add-field\(data-key="\{\{row\.key\}\}" role="checkbox"/);
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /const next = cardShownFields\.cardFieldsAfter\(card, key, !cardShownFields\.isShown\(key, card, counts\), counts\);\n\s+await Cards\.updateAsync\(card\._id, \{ \$set: next \}\);/);
  assert.match(js, /if \(!card \|\| !cardShownFields\.FIELD_KEYS\.includes\(key\) \|\| !Utils\.canModifyCard\(card\)\) return;/, 'negative: only a field key, only who may change the card');
  // The old "+ Add" popup is gone; one popup, one set of handlers.
  assert.ok(!fs.existsSync(path.join(root, 'client/components/cards/cardAddFields.jade')));
  assert.doesNotMatch(read('client/features/cards.js'), /cardAddFields\.jade/);
  // The section titles are words WeKan already has; "On this card" is in every language.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const { SECTIONS } = require('../models/lib/cardSettingsSections.js');
  for (const sec of SECTIONS) assert.ok(en[sec.labelKey], sec.labelKey);
  assert.strictEqual(en['card-settings-this-card'], 'On this card');
});

test('"Scrum settings" is the section, not repeated before each of its rows', () => {
  const { SECTIONS, labelInSection, rowsOfSection } = require('../models/lib/cardSettingsSections.js');
  const scrum = SECTIONS.find(sec => sec.id === 'scrum');
  for (const row of rowsOfSection('scrum')) {
    assert.ok(!labelInSection(row, scrum).includes('scrum-settings'), row.key);
    assert.strictEqual(labelInSection(row, scrum).length, 1, row.key);
  }
  // Negative: a one-word label is never emptied.
  assert.deepStrictEqual(labelInSection({ label: ['scrum-settings'] }, scrum), ['scrum-settings']);
});

test('the card keeps its choices, and only field keys', () => {
  const cards = read('models/cards.js');
  for (const field of ['shownFields', 'hiddenFields']) {
    assert.match(cards, new RegExp(`'${field}\\.\\$': \\{\\s*type: String,\\s*allowedValues: CARD_SHOWN_FIELD_KEYS,`));
  }
  assert.match(cards, /const \{ FIELD_KEYS: CARD_SHOWN_FIELD_KEYS \} = require\('\/models\/lib\/cardShownFields'\);/);
});

test('one rule under "+ Add": no section draws its rule for fields the card does not show', () => {
  const js = read('client/components/cards/cardDetails.js');
  // The Sort group's gate reads the card's view, as its fields do; reading the
  // board itself drew an empty group's rule - the second line under "+ Add".
  const sort = js.slice(js.indexOf('hasVisibleSortFields()'), js.indexOf('hasVisibleSortFields()') + 400);
  assert.match(sort, /const board = cardBoardView\(this\);/);
  assert.doesNotMatch(sort, /const board = this\.board\(\);/, 'negative');
  // Custom Fields: only on a card that shows them, not as an empty heading.
  assert.match(js, /board\?\.allowsCustomFields !== false && cardShowsField\(this, 'customFields'\)/);
});

test('Similar cards: the section only when there are some', () => {
  const jade = read('client/components/cards/similarCards.jade');
  assert.match(jade, /template\(name="cardSimilarCardsSection"\)\n\s+if results\.length\n\s+\+cardSectionHeader/);
  assert.doesNotMatch(jade, /similar-cards-none/, 'negative: no "No similar cards" section on the opened card');
  assert.match(read('client/components/cards/similarCards.js'), /Template\.cardSimilarCardsSection\.onCreated\(askForSimilarCards\);/);
});

test('the cover is on by default, and a new drawing is the cover', () => {
  const boards = read('models/boards.js');
  assert.match(boards, /allowsCoverAttachmentOnCard: \{[\s\S]{0,500}type: Boolean,\s*defaultValue: true,/);
  const steps = read('server/lib/schemaUpgradeSteps.js');
  assert.match(steps, /name: 'cover-on-card-on'/);
  assert.match(steps, /'allowsCoverAttachmentOnMinicard', 'allowsCoverAttachmentOnCard',/);
  const drawing = read('client/components/cards/cardDrawing.js');
  assert.match(drawing, /\.\.\.coverOf\(svgAttachmentId\)/);
  assert.match(drawing, /\.\.\.\(isNew \? coverOf\(pngAttachmentId\) : \{\}\)/, 'an edit leaves the cover');
});

test('the popup: wide and high enough, moved and maximized, no tick animates on opening a pane', () => {
  const popupCss = read('client/components/main/popup.css');
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \.content-wrapper,\n\s+\.pop-over\[data-popup='boardCardSettingsPopup'\] \.content-container \{\n\s+max-height: none;/, 'room for every menu entry');
  const css = read('client/components/sidebar/sidebar.css');
  assert.match(css, /\.card-settings-sections \.materialCheckBox \{ transition: none; \}\n\.card-settings-sections \.card-add-field\.is-animating \.materialCheckBox,\n\.card-settings-sections \.card-field-order-toggle\.is-animating \.materialCheckBox \{ transition: 0\.2s; \}/);
  // A board-wide checkbox animates when clicked too, and only that one.
  assert.match(read('client/components/sidebar/sidebar.js'), /'click \.card-field-order-toggle'\(evt, tpl\) \{\n\s+const cell = evt\.currentTarget\.closest\('\.js-card-field-order-row'\);\n\s+if \(cell\) tpl\.animating\.set\(`\$\{cell\.dataset\.key\}:\$\{cell\.dataset\.side\}`\);/);
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /tpl\.animating\.set\(null\);\n\s+tpl\.settingsSection\.set\(evt\.currentTarget\.dataset\.id\);/, 'opening a pane animates nothing');
  assert.match(js, /tpl\.animating\.set\(key\);/, 'the clicked one does');
  const popup = read('client/components/main/popup.js');
  assert.match(popup, /MOVABLE_POPUPS = new Set\(\[[^\]]*'boardCardSettingsPopup'/);
  assert.match(popup, /MAXIMIZABLE_POPUPS = new Set\(\[[^\]]*'boardCardSettingsPopup'/);
});

test('a maximized card has its comments section in the right column', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /unless cardMaximized\n\s+\+cardCommentsSection/);
  assert.match(jade, /\.card-details-right\n\n\s+\/\/-[^\n]*\n\s+if cardMaximized\n\s+\+cardCommentsSection/);
  assert.strictEqual((jade.match(/\+commentForm/g) || []).length, 1, 'negative: one comments section, not two copies');
  assert.ok(read('client/components/cards/cardAddFields.js').includes("'cardCommentsSection'"), 'with the card\'s own view of the board');
  // At the top of the right column there is nothing to separate it from: no rule.
  assert.match(read('client/components/cards/cardDetails.css'), /\.card-details-right \.card-details-comments \.card-details-section-rule \{\n\s+display: none;/);
});

test('the pane lines up: fixed side columns on every line, and an inline form keeps its floats', () => {
  const css = read('client/components/sidebar/sidebar.css');
  // Each line is its own grid: sized by content, no two lines would agree.
  assert.match(css, /grid-template-columns: 9em 9em minmax\(10em, 1fr\);/);
  assert.match(css, /\.board-card-settings\.has-card \.card-settings-line \{\n\s+grid-template-columns: 7em 9em 9em minmax\(10em, 1fr\);/);
  assert.doesNotMatch(css, /\.card-settings-line \{[^}]*max-content/, 'negative: no content-sized side column');
  // Save floats left and Delete right in Change spent time and the others.
  assert.match(css, /\.card-settings-inline-action \{[^}]*display: flow-root;/);
});

test('Select all / Unselect all are centred under Draggable', () => {
  assert.match(read('client/components/main/boardDragSettings.css'), /\.board-drag-settings th \.board-settings-column-actions \{ justify-content: center; \}/);
});

console.log(`cardShownFields: ${passed} passed`);
