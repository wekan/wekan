'use strict';

// docs/Features/Cards/Card-Fields.md: an opened card shows EVERY field its
// board shows on cards (Board Settings / Card's Show on Card), empty or not.
//
// Deliberate change (2026-10-28): this suite used to pin the per-card rule -
// a card showed only the fields it had data in, plus "Show empty" / "Show
// empty fields", plus what it ticked "On this card" (card.shownFields /
// hiddenFields). The maintainer removed all of that: empty fields are always
// shown. So it now pins the new rule - the card's view of the board does not
// depend on the card at all - plus negatives that the per-card rule, its
// exports and its UI are gone. What a board can still take away besides a row
// is a whole Card Settings section (tests/cardSettingsSectionShown.test.cjs).
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

test('an empty card shows every field its board allows - no per-card rule', () => {
  const board = fullBoard();
  // The view does not depend on the card: an empty card and a full one see
  // the same board, and with no section hidden that is the board itself.
  assert.strictEqual(f.boardForCard(board), board);
  assert.strictEqual(f.boardForCard(board, { _id: 'empty' }, {}), board, 'extra arguments change nothing');
  for (const key of f.FIELD_KEYS) assert.ok(f.boardAllows(f.boardForCard(board), key), key);
  // Negative: the per-card rule and its helpers are gone.
  for (const gone of ['isShown', 'cardFieldsAfter', 'hasData', 'ALWAYS', 'alwaysShownOf', 'boardAlwaysShows',
    'alwaysShownAfter', 'boardShowsEmptyFields']) {
    assert.strictEqual(f[gone], undefined, gone);
  }
  // Negative: a card's legacy shownFields / hiddenFields are not read anywhere
  // in the client or the models' rules.
  for (const file of ['client/components/cards/cardAddFields.js', 'client/components/cards/cardDetails.js',
    'client/components/sidebar/sidebar.js', 'client/components/cards/minicard.js', 'models/lib/cardShownFields.js']) {
    const code = read(file).replace(/\/\/[^\n]*/g, '');
    assert.ok(!/\.(shownFields|hiddenFields)\b/.test(code), `${file} reads a card's shownFields/hiddenFields`);
  }
});

test('Board Settings / Card still decides what a card CAN show', () => {
  const board = fullBoard();
  board.allowsDueDate = false;
  board.scrum.visibility.cardSprint = false;
  const view = f.boardForCard(board);
  assert.strictEqual(view.allowsDueDate, false, 'never turned back on');
  assert.strictEqual(f.boardAllows(board, 'dueDate'), false);
  assert.strictEqual(f.boardAllows({ _id: 'b' }, 'scrumSprint'), false, 'Scrum fields are off until turned on');
  // A plain flag the board never set reads its row's default.
  assert.strictEqual(f.boardAllows({}, 'cardNumber'), false);
  assert.strictEqual(f.boardAllows({ allowsCardNumber: true }, 'cardNumber'), true);
});

test('the opened card: no Card Settings button, the card\'s currentBoard, the Scrum sections', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  // Deliberate change (2026-10-28): the "Card Settings" button under the
  // cover (it was "+ Add") is gone - Card Settings is only Board Settings /
  // Card (docs/Features/Cards/Card-Settings.md).
  assert.ok(!/js-open-card-add-fields|card-details-add-fields|cardSettingsInline|cardSettingsOpen/.test(jade), 'negative: no Card Settings on the card');
  const js = read('client/components/cards/cardAddFields.js');
  // 2026-10-28: one template per Card Settings section.
  for (const name of ['cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDate', 'cardFieldSectionMembers',
    'cardFieldSectionCard', 'cardFieldSectionTime', 'cardFieldSectionCustomFields', 'cardFieldSectionVote',
    'cardFieldSectionPoker', 'cardFieldSectionDescription', 'cardFieldSectionScrum', 'cardFieldSectionChecklists',
    'cardFieldSectionSubtasks', 'cardFieldSectionAttachments', 'cardCommentsSection']) {
    assert.ok(js.includes(`'${name}'`), name);
  }
  assert.match(js, /Template\[name\]\.helpers\(\{\n\s+currentBoard\(\)/);
  assert.ok(!/js-open-card-add-fields|cardSettingsOpenOn|Popup\.open\('boardCardSettings'\)/.test(js), 'negative: nothing opens Card Settings from the card');
  // A Scrum section only when the board allows it (#6830) -
  // tests/scrumSectionsShowEmpty6830.test.cjs - read through the card's view.
  // (2026-10-28: Scrum is one section; its fields are the allowed ones.)
  assert.match(read('client/components/cards/cardDetails.js'), /case 'scrum': return cardSectionFields\(card, 'scrum'\)\.some\(key => boardAllows\(board, key\)\);/);
  // Negative: every section template of the opened card that reads a board
  // flag is in the list - a new one left out would show empty fields again.
  const sectionTemplates = [...jade.matchAll(/^template\(name="(cardFieldSection\w+)"\)/gm)].map(m => m[1]);
  for (const name of sectionTemplates) {
    const body = jade.slice(jade.indexOf(`template(name="${name}")`)).split(/\ntemplate\(/)[0];
    if (/currentBoard\.allows/.test(body)) assert.ok(js.includes(`'${name}'`), `${name} reads currentBoard but is not given the card's view`);
  }
});

test('the popup is Board Settings / Card: the opened card\'s Card Settings - Show on Minicard, Show on Card', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const js0 = read('client/components/sidebar/sidebar.js');
  const tplOf = name => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
  // Deliberate change: Board Settings / Card is cardSettingsInline, not the
  // Admin Panel's menu and pane - and since 2026-10-28 the only Card
  // Settings (not also on the card). Show on Minicard / Show on Card were the
  // Show radios; since 2026-10-28 they are two panes, each titled with them.
  assert.match(tplOf('boardCardSettingsPopup'), /\+cardSettingsInline\(side="minicard"\)[\s\S]*\+cardSettingsInline\(side="card"\)/);
  assert.ok(!jade.includes('+leftMenu(settingsMenuItems)'), 'negative: the left menu is gone');
  assert.match(js0, /TAPi18n\.__\(Template\.instance\(\)\.showSide\.get\(\) === 'minicard' \? 'show-on-minicard' : 'show-on-card'\)/);
  // Deliberate change (2026-10-28): "On this card" is gone from the row's
  // hamburger - no per-card choice any more. Negative: neither its UI nor its
  // handler nor its row state is left.
  assert.ok(!/js-card-add-field|card-add-field|menu\.thisCard|menu\.always/.test(tplOf('cardSettingsInlinePanel')));
  const js = read('client/components/sidebar/sidebar.js');
  for (const gone of ["'click .js-card-add-field'", 'perCard:', 'shownOnThisCard', 'alwaysShowable', 'thisCard: Boolean']) {
    assert.ok(!js.includes(gone), gone);
  }
  // The old "+ Add" popup is gone; one popup, one set of handlers.
  assert.ok(!fs.existsSync(path.join(root, 'client/components/cards/cardAddFields.jade')));
  assert.doesNotMatch(read('client/features/cards.js'), /cardAddFields\.jade/);
  // The section titles are words WeKan already has; "On this card" is in every language.
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const { SECTIONS } = require('../models/lib/cardSettingsSections.js');
  for (const sec of SECTIONS) assert.ok(en[sec.labelKey], sec.labelKey);
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

test('the card\'s legacy lists stay in the schema, so old cards validate, and nothing writes them', () => {
  const cards = read('models/cards.js');
  for (const field of ['shownFields', 'hiddenFields']) {
    assert.match(cards, new RegExp(`'${field}\\.\\$': \\{\\s*type: String,\\s*allowedValues: CARD_SHOWN_FIELD_KEYS,`));
  }
  assert.match(cards, /const \{ FIELD_KEYS: CARD_SHOWN_FIELD_KEYS \} = require\('\/models\/lib\/cardShownFields'\);/);
  // Negative: no client code writes them.
  assert.ok(!/\$set: \{ (shownFields|hiddenFields)|\$set: next \}/.test(read('client/components/sidebar/sidebar.js')));
});

test('one rule under "+ Add": no section draws its rule for fields the card does not show', () => {
  const js = read('client/components/cards/cardDetails.js');
  // Every section's gate reads the card's view, as its fields do; reading the
  // board itself drew an empty group's rule - the second line under "+ Add".
  // (2026-10-28: one gate for all sections, cardSectionHasContent, given the
  // view by orderedSectionsOf; the Sort group's own gate is gone with it.)
  const list = js.slice(js.indexOf('function orderedSectionsOf('), js.indexOf('function orderedSectionsOf(') + 700);
  assert.match(list, /const board = boardForCard\(raw\);/);
  assert.match(list, /\.filter\(id => cardSectionHasContent\(card, board, id\)\)/);
  assert.doesNotMatch(list, /cardSectionHasContent\(card, raw/, 'negative');
  // Custom Fields: on every card the reader may change whose board shows them,
  // empty or not, read through the card's view (a hidden section hides it).
  assert.match(js, /const board = boardForCard\(this\?\.board\?\.\(\)\);\n\s+return Utils\.canModifyCard\(this\) && board\?\.allowsCustomFields !== false;/);
  assert.ok(!js.includes('cardShowsField'), 'negative: the per-card gate is gone');
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
  // default. Its other checkbox (Ask for a reason) is in Card's hamburger,
  // drawn when it opens rather than re-drawn under the list.
  const css = read('client/components/cards/cardAddFields.css');
  assert.match(css, /\.card-settings-inline \.materialCheckBox \{ transition: none; \}/);
  assert.match(css, /\.card-settings-inline \.card-field-order-toggle\.is-animating \.materialCheckBox \{ transition: 0\.2s; \}/);
  assert.ok(!read('client/components/sidebar/sidebar.css').includes('.card-settings-sections'), 'negative: the pane\'s rules are gone');
  // A board-wide checkbox animates when clicked too, and only that one.
  assert.match(read('client/components/sidebar/sidebar.js'), /'click \.card-field-order-toggle'\(evt, tpl\) \{\n\s+const cell = evt\.currentTarget\.closest\('\.js-card-field-order-row'\);\n\s+if \(cell\) tpl\.animating\.set\(`\$\{cell\.dataset\.key\}:\$\{cell\.dataset\.side\}`\);/);
  const js = read('client/components/sidebar/sidebar.js');
  // Opening or closing a hamburger's panel animates nothing (2026-10-28:
  // there is no Show switch any more - both sides are panes).
  assert.match(js, /function togglePanel\(tpl, key\) \{\n\s+tpl\.animating\.set\(null\);/, 'opening a panel animates nothing');
  assert.ok(!js.includes('js-card-settings-show-side'), 'negative: no Show switch');
  assert.ok(!/tpl\.settingsSection\.set/.test(js), 'negative: no pane to open any more');
  assert.match(js, /tpl\.animating\.set\(`section:\$\{id\}:\$\{side\}`\);/, 'the clicked section checkbox does');
  const popup = read('client/components/main/popup.js');
  assert.match(popup, /MOVABLE_POPUPS = new Set\(\[[^\]]*'boardCardSettingsPopup'/);
  assert.match(popup, /MAXIMIZABLE_POPUPS = new Set\(\[[^\]]*'boardCardSettingsPopup'/);
});

test('a maximized card has its comments section in the right column', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  // 2026-10-28: in the left column the comments are a section of the loop,
  // which leaves them out on a maximized card (orderedSectionsOf).
  assert.match(jade, /if \$eq section "comments"\n\s+\+cardCommentsSection/);
  assert.match(read('client/components/cards/cardDetails.js'), /\.filter\(id => !\(maximized && id === 'comments'\)\)/);
  assert.match(read('client/components/cards/cardDetails.js'), /orderedSectionsOf\(this, \{ maximized: isCardMaximized\(\) \}\)/);
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
