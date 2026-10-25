'use strict';

// docs/Features/Cards/Card-Fields.md: five actions of the opened card's actions
// menu are in the section they act on - in the hamburger of that section on the
// opened card, and in that section's pane of Card Settings when it is opened
// from a card:
//   Filter: Subtasks      - Subtasks hamburger;  Card Settings / Subtasks
//   Edit voting           - Voting hamburger;    Card Settings / Voting
//   Edit Planning Poker   - Planning Poker hamburger; Card Settings / Planning Poker
//   Change spent time     - Spent time hamburger; Card Settings / Time
//   Card kind             - Scrum settings hamburger; Card Settings / Scrum settings
// Run: node tests/cardSectionActions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const jade = read('client/components/cards/cardDetails.jade');
const js = read('client/components/cards/cardDetails.js');
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const { CARD_ACTIONS, cardActionsOf, SECTIONS } = require('../models/lib/cardSettingsSections.js');
const template = name => jade.slice(jade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('cardSectionActions:');

test('negative: none of the five is in the card\'s actions menu any more', () => {
  const menu = template('cardDetailsActionsPopup');
  for (const cls of ['js-filter-subtasks', 'js-start-voting', 'js-start-planning-poker', 'js-spent-time', 'js-set-card-kind']) {
    assert.ok(!menu.includes(cls), cls);
    assert.ok(!js.includes(`'click .${cls}'`) || cls === 'js-filter-subtasks', `no handler left for ${cls}`);
  }
});

test('the opened card: each in the hamburger of its section', () => {
  assert.match(jade, /menuClass="js-open-subtasks-menu" menuTitle="subtasks"/);
  const subtasksMenu = template('cardSubtasksMenuPopup');
  assert.ok(subtasksMenu.includes('a.js-filter-subtasks') && subtasksMenu.includes('a.js-open-subtask-settings'));
  assert.match(js, /'click \.js-filter-subtasks'\(event\) \{\n\s+event\.preventDefault\(\);\n\s+filterSubtasksOf\(this\.card \|\| this\);/);
  const vote = template('cardFieldSectionVoteAndPoker');
  assert.strictEqual((vote.match(/a\.card-details-section-menu\.js-section-edit-voting/g) || []).length, 2, 'Voting, with or without a question');
  assert.strictEqual((vote.match(/a\.card-details-section-menu\.js-section-edit-poker/g) || []).length, 2, 'Planning Poker, with or without a question');
  assert.match(js, /'click \.js-section-edit-voting': Popup\.open\('cardStartVoting'\),/);
  assert.match(js, /'click \.js-section-edit-poker': Popup\.open\('cardStartPlanningPoker'\),/);
  assert.strictEqual((template('cardFieldSectionSort').match(/\+cardSpentTimeMenu/g) || []).length, 2, 'Spent time, overtime or not');
  assert.match(template('cardSpentTimeMenu'), /a\.card-details-section-menu\.js-section-spent-time/);
  assert.match(js, /'click \.js-section-spent-time': Popup\.open\('editCardSpentTime'\),/);
  assert.match(jade, /if \$eq section firstScrumSection\n\s+\+cardSectionHeader\(section="scrum" icon="fa-repeat" label="scrum-settings" menuClass="js-section-card-kind" menuTitle="cardKindPopup-title"\)/);
  assert.match(js, /'click \.js-section-card-kind'\(event\) \{[\s\S]{0,120}Popup\.open\('cardKind'\)\.call\(Utils\.getCurrentCard\(\), event\);/);
  // Only who may change the card gets the editing hamburgers.
  assert.match(vote, /if canModifyCard\n\s+a\.card-details-section-menu\.js-section-edit-voting/);
  assert.match(template('cardSpentTimeMenu'), /if canModifyCard\n\s+a\.card-details-section-menu\.js-section-spent-time/);
});

test('the Scrum fields are one section under one heading, its fields without the prefix', () => {
  assert.match(js, /firstScrumSection\(\) \{\n\s+return orderedSectionsOf\(this\)\.find\(s => \/\^scrum\[A-Z\]\/\.test\(s\)\) \|\| null;/);
  assert.match(jade, /if isSectionOpen "scrum"\n\s+if \$eq section "scrumSprint"\n\s+\+cardFieldSectionScrumSprint/);
});

test('Card Settings, opened from a card: the actions in the pane of their section', () => {
  assert.deepStrictEqual(Object.keys(CARD_ACTIONS).sort(), ['customFields', 'poker', 'scrum', 'subtasks', 'time', 'vote']);
  for (const id of Object.keys(CARD_ACTIONS)) assert.ok(SECTIONS.some(s => s.id === id), id);
  assert.deepStrictEqual(cardActionsOf('vote').map(a => a.popup), ['cardStartVoting']);
  assert.deepStrictEqual(cardActionsOf('poker').map(a => a.popup), ['cardStartPlanningPoker']);
  assert.deepStrictEqual(cardActionsOf('date'), [], 'negative: a section without one has none');
  for (const action of Object.values(CARD_ACTIONS).flat()) for (const k of action.label) assert.ok(en[k], k);
  const popup = sidebarJade.slice(sidebarJade.indexOf('template(name="boardCardSettingsPopup")')).split('\ntemplate(')[0];
  assert.match(popup, /if sectionCardActions\.length\n\s+ul\.pop-over-list\.card-settings-card-actions/);
  // Under the title, above the column heads.
  assert.ok(popup.indexOf('card-settings-card-actions') < popup.indexOf('.card-settings-pane-head'));
  assert.match(sidebarJs, /if \(id === 'filterSubtasks'\) \{\n\s+filterSubtasksOf\(card\);/);
  assert.match(sidebarJs, /if \(action\.board\) \{\n\s+Popup\.open\(action\.popup\)\(evt\);/, 'a board action works from Board Settings too');
  // In the pane each is the form itself, not a link to a popup - all but
  // Filter: Subtasks, which is an action, not a form.
  for (const action of Object.values(CARD_ACTIONS).flat()) {
    if (action.id === 'filterSubtasks') assert.ok(!action.inline);
    else assert.ok(action.inline, `${action.id} is inline`);
  }
  assert.deepStrictEqual(cardActionsOf('time').map(a => a.inline), ['editCardSpentTimePopup']);
  // Edit custom fields, then Create Field and Link fields to another card -
  // the two its buttons opened - as forms of their own under it.
  assert.deepStrictEqual(cardActionsOf('customFields').map(a => a.inline), ['cardCustomFieldsPopup', 'createCustomFieldPopup', 'cardCustomFieldLinksPopup']);
  assert.strictEqual(cardActionsOf('customFields').find(a => a.id === 'createCustomField').board, true, 'creating a field is the board\'s, also from Board Settings');
  // In the pane the list's own two buttons are not repeated.
  assert.match(read('client/components/cards/cardCustomFields.jade'), /\.card-custom-fields-more\n[\s\S]{0,400}a\.quiet-button\.full\.js-open-create-custom-field[\s\S]{0,200}a\.quiet-button\.full\.js-open-custom-field-links/);
  assert.match(read('client/components/sidebar/sidebar.css'), /\.card-settings-inline-action \.card-custom-fields-more \{ display: none; \}/);
  // Saved in the pane the create form stays, emptied; in its own popup it steps back.
  assert.match(read('client/components/sidebar/sidebarCustomFields.js'), /if \(!backIfOwnPopup\(evt, \['createCustomFieldPopup', 'editCustomFieldPopup'\]\) && !editing\) \{/);
  assert.deepStrictEqual(cardActionsOf('scrum').map(a => a.inline), ['cardKindPopup']);
  assert.deepStrictEqual(cardActionsOf('subtasks').map(a => a.inline), [undefined, 'boardSubtaskSettingsBody']);
  assert.match(popup, /if action\.inline\n\s+.card-settings-inline-action\n[\s\S]{0,400}\+Template\.dynamic\(template=action\.inline data=action\.inlineData\)/);
  // Saved in the pane, Card Settings stays open; saved in their own popup, it steps back.
  assert.match(read('client/lib/popupBack.js'), /if \(popup && names\.includes\(popup\.dataset\.popup\)\) \{\n\s+Popup\.back\(\);\n\s+return true;/);
  assert.match(read('client/lib/popupBack.js'), /export function backIfOwnPopup\(evt, popupName\)/);
  assert.match(js, /backIfOwnPopup\(evt, 'cardStartVotingPopup'\);/);
  assert.match(js, /backIfOwnPopup\(event, 'cardKindPopup'\);/);
  assert.strictEqual((read('client/components/cards/cardTime.js').match(/backIfOwnPopup\(evt, 'editCardSpentTimePopup'\);/g) || []).length, 2);
  assert.match(js, /backIfOwnPopup\(evt, 'cardStartPlanningPokerPopup'\);/);
  assert.match(sidebarJs, /if \(!Utils\.canModifyCard\(card\)\) return;\n\s+Popup\.open\(action\.popup, \{ dataContext: card \}\)\(evt\);/, 'an edit only for who may change the card');
});

test('every hamburger of the opened card\'s sections has its items in Card Settings (negative: a new one fails here)', () => {
  // What each hamburger opens -> the section of Card Settings where it is too.
  const HAMBURGERS = {
    'js-open-subtasks-menu': { section: 'subtasks', items: ['filterSubtasks', 'subtaskSettings'] },
    'js-open-custom-fields-settings': { section: 'customFields', items: ['customFields'] },
    'js-section-edit-voting': { section: 'vote', items: ['editVoting'] },
    'js-section-edit-poker': { section: 'poker', items: ['editPoker'] },
    'js-section-spent-time': { section: 'time', items: ['spentTime'] },
    'js-section-card-kind': { section: 'scrum', items: ['cardKind'] },
  };
  const found = new Set([
    ...[...jade.matchAll(/menuClass="([\w-]+)"/g)].map(m => m[1]),
    ...[...jade.matchAll(/a\.card-details-section-menu\.([\w-]+)/g)].map(m => m[1]),
  ]);
  assert.deepStrictEqual([...found].sort(), Object.keys(HAMBURGERS).sort(), 'a hamburger not listed here has nothing in Card Settings');
  for (const [cls, { section, items }] of Object.entries(HAMBURGERS)) {
    const ids = cardActionsOf(section).map(a => a.id);
    for (const item of items) assert.ok(ids.includes(item), `${cls}: ${item} in Card Settings / ${section}`);
  }
  // The popups match: the hamburger and the pane open the same thing.
  assert.match(js, /'click \.js-open-custom-fields-settings'\(event\) \{[\s\S]{0,120}Popup\.open\('cardCustomFields'\)/);
  assert.strictEqual(cardActionsOf('customFields')[0].popup, 'cardCustomFields');
  assert.match(js, /'click \.js-open-subtask-settings'\(event\) \{\n\s+event\.preventDefault\(\);\n\s+Popup\.open\('boardSubtaskSettings'\)/);
  assert.strictEqual(cardActionsOf('subtasks').find(a => a.id === 'subtaskSettings').popup, 'boardSubtaskSettings');
});

test('Filter: Subtasks is one function, wherever it is clicked', () => {
  const lib = read('client/lib/filterSubtasks.js');
  assert.match(lib, /export function filterSubtasksOf\(card\)/);
  assert.match(lib, /if \(!card \|\| !card\._id \|\| card\.boardId !== Session\.get\('currentBoard'\)\) return;/, 'negative: not for a card of another board');
  assert.match(lib, /Filter\.parentId\.add\(card\._id\);/);
});

console.log(`cardSectionActions: ${passed} passed`);
