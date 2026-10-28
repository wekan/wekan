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

test('the opened card: "Card Settings" under the cover, the per-card currentBoard, the Scrum sections', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const cover = jade.indexOf('img.card-details-cover-image');
  const add = jade.indexOf('a.card-details-add-fields-button.js-open-card-add-fields');
  const left = jade.indexOf('.card-details-left', cover);
  assert.ok(cover !== -1 && cover < add && add < left, 'Card Settings is under the cover, above the fields');
  assert.match(jade.slice(add - 300, add), /if canModifyCard\n\s+\.card-details-add-fields\n/, 'only for who may change the card');
  const js = read('client/components/cards/cardAddFields.js');
  for (const name of ['cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDates', 'cardFieldSectionMembers',
    'cardFieldSectionDependencies', 'cardFieldSectionSort', 'cardFieldSectionCustomFields',
    'cardFieldSectionVoteAndPoker', 'cardFieldSectionDescription', 'cardCommentsSection']) {
    assert.ok(js.includes(`'${name}'`), name);
  }
  assert.match(js, /Template\[name\]\.helpers\(\{\n\s+currentBoard\(\)/);
  // "Card Settings" (it was "+ Add") opens Card Settings ON the card, in
  // place of the button and everything below it - no longer the popup
  // (docs/Features/Cards/Card-Settings-On-Card.md).
  assert.match(js, /'click \.js-open-card-add-fields'\(event\) \{[\s\S]*?cardSettingsOpenOn\.set\(card\._id\);/);
  assert.ok(!/Popup\.open\('boardCardSettings'\)/.test(js), 'negative: the card no longer opens the popup');
  assert.match(jade, /if cardSettingsOpen\n\s+\+cardSettingsInline\(card=this\)\n\s+else\n\s+if canModifyCard\n\s+\.card-details-add-fields\n/);
  assert.match(jade.slice(add, left), /\{\{_ 'card-settings'\}\}/, 'the button is named Card Settings');
  // A Scrum section is still decided by the card, but the board has to allow
  // it first (#6830: Show empty fields showed Scrum on boards with it off) -
  // tests/scrumSectionsShowEmpty6830.test.cjs.
  assert.match(read('client/components/cards/cardDetails.js'), /sections\.filter\(s => !\/\^scrum\[A-Z\]\/\.test\(s\) \|\|\n\s+\(boardAllows\(board, s\) && cardShowsField\(card, s\)\)\)/);
  // Negative: every section template of the opened card that reads a board
  // flag is in the list - a new one left out would show empty fields again.
  const sectionTemplates = [...jade.matchAll(/^template\(name="(cardFieldSection\w+)"\)/gm)].map(m => m[1]);
  for (const name of sectionTemplates) {
    const body = jade.slice(jade.indexOf(`template(name="${name}")`)).split(/\ntemplate\(/)[0];
    if (/currentBoard\.allows/.test(body)) assert.ok(js.includes(`'${name}'`), `${name} reads currentBoard but is not given the card's view`);
  }
});

test('the popup is Board Settings / Card: the opened card\'s Card Settings - Show on Minicard, Show on Card, On this card', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const tplOf = name => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
  // Deliberate change: Board Settings / Card is now the SAME template as the
  // opened card's Card Settings (`+cardSettingsInline(inPopup=true)`), not
  // the Admin Panel's menu and pane. Show on Minicard / Show on Card are the
  // Show radios; On this card is in a row's hamburger, only with a card.
  assert.match(tplOf('boardCardSettingsPopup'), /\+cardSettingsInline\(inPopup=true\)/);
  assert.ok(!jade.includes('+leftMenu(settingsMenuItems)'), 'negative: the left menu is gone');
  const inline = tplOf('cardSettingsInline');
  assert.ok(inline.includes("span {{_ 'show-on-minicard'}}") && inline.includes("span {{_ 'show-on-card'}}"));
  assert.match(tplOf('cardSettingsItemPopup'), /if menu\.thisCard\n\s+div\.check-div\.card-settings-board-option\n\s+a\.flex\.card-add-field\.js-card-add-field\(data-key="\{\{key\}\}" role="checkbox"/);
  const js = read('client/components/sidebar/sidebar.js');
  // On this card only with a card that may be changed (none in Board Settings).
  assert.match(js, /perCard: side === 'card' && Boolean\(thisCard\) && cardShownFields\.FIELD_KEYS\.includes\(built\.key\),/);
  assert.match(js, /thisCard: Boolean\(row\.perCard\),/);
  // #6806: with the card's board, for its Show empty fields; the data from
  // shownFieldsOf, a linked card's being its source's.
  assert.match(js, /const next = cardShownFields\.cardFieldsAfter\(view, key, !cardShownFields\.isShown\(key, view, counts, board\), counts, board\);\n\s+await Cards\.updateAsync\(card\._id, \{ \$set: next \}\);/);
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

test('the popup: high enough, moved and maximized, no tick animates on opening it', () => {
  const popupCss = read('client/components/main/popup.css');
  assert.match(popupCss, /\.pop-over\[data-popup='boardCardSettingsPopup'\] \.content-wrapper,\n\s+\.pop-over\[data-popup='boardCardSettingsPopup'\] \.content-container \{\n\s+max-height: none;/, 'room for every section');
  // Deliberate change: Board Settings / Card is now cardSettingsInline, so
  // the rule is the inline's (cardAddFields.css), not the old pane's
  // `.card-settings-sections`: only a clicked checkbox animates, none by
  // default. Its other checkboxes (On this card, Show empty, Show empty
  // fields, Ask for a reason) are in the hamburger popups, drawn when one
  // opens rather than re-drawn under the list.
  const css = read('client/components/cards/cardAddFields.css');
  assert.match(css, /\.card-settings-inline \.materialCheckBox \{ transition: none; \}/);
  assert.match(css, /\.card-settings-inline \.card-field-order-toggle\.is-animating \.materialCheckBox \{ transition: 0\.2s; \}/);
  assert.ok(!read('client/components/sidebar/sidebar.css').includes('.card-settings-sections'), 'negative: the pane\'s rules are gone');
  // A board-wide checkbox animates when clicked too, and only that one.
  assert.match(read('client/components/sidebar/sidebar.js'), /'click \.card-field-order-toggle'\(evt, tpl\) \{\n\s+const cell = evt\.currentTarget\.closest\('\.js-card-field-order-row'\);\n\s+if \(cell\) tpl\.animating\.set\(`\$\{cell\.dataset\.key\}:\$\{cell\.dataset\.side\}`\);/);
  const js = read('client/components/sidebar/sidebar.js');
  // Switching Show (what replaced opening a pane) animates nothing.
  assert.match(js, /'change \.js-card-settings-show-side'\(evt, tpl\) \{\n\s+tpl\.animating\.set\(null\);/, 'switching the side animates nothing');
  assert.ok(!/tpl\.settingsSection\.set/.test(js), 'negative: no pane to open any more');
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

test('a row lines up: its checkbox, its name, its hamburger', () => {
  // Deliberate change: the pane's fixed side columns (7em/9em/8em grids, the
  // has-card and minicard list variants) went with the pane - Board Settings
  // / Card is cardSettingsInline now. Each row is one grid of three tracks,
  // the name taking the rest, in both places.
  const css = read('client/components/sidebar/sidebar.css');
  const inlineCss = read('client/components/cards/cardAddFields.css');
  assert.match(inlineCss, /\.card-settings-inline \.card-settings-line \{\n\s+grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.match(css, /\n\.card-settings-line \{\n\s+display: grid;/);
  assert.doesNotMatch(css, /\.card-settings-line \{[^}]*max-content/, 'negative: no content-sized side column');
  assert.ok(!/has-card|card-settings-list-(card|minicard)|grid-template-columns: 9em/.test(css), 'negative: the pane columns are gone');
  // Negative: no in-place action form is left whose floats would need keeping.
  assert.ok(!css.includes('.card-settings-inline-action'));
});

test('Select all / Unselect all are centred under Draggable', () => {
  assert.match(read('client/components/main/boardDragSettings.css'), /\.board-drag-settings th \.board-settings-column-actions \{ justify-content: center; \}/);
});

console.log(`cardShownFields: ${passed} passed`);
