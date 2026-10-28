'use strict';

// docs/Features/Cards/Card-Fields.md: five actions of the opened card's actions
// menu are in the section they act on - in the hamburger of that section on the
// opened card:
//   Filter: Subtasks      - Subtasks hamburger
//   Edit voting           - Voting hamburger
//   Edit Planning Poker   - Planning Poker hamburger
//   Change spent time     - Spent time hamburger
//   Card kind             - Scrum settings hamburger
//
// Deliberate change (2026-10-28): this suite used to require every item of
// those card hamburgers to be in Card Settings' matching section hamburger
// too, because Card Settings was also drawn ON the card, for that card. It is
// now only Board Settings / Card - about every card of the board, with no card
// - so a card's own actions live on the card alone, and Card Settings' section
// hamburgers hold only the BOARD's settings (Subtask settings; Create Field is
// the "+" under Custom Fields). The rule pinned below is that split.
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

test('Card Settings: only the board\'s actions, in the hamburger of their section', () => {
  assert.deepStrictEqual(Object.keys(CARD_ACTIONS), ['subtasks']);
  assert.deepStrictEqual(cardActionsOf('subtasks').map(a => [a.id, a.popup, a.board]), [['subtaskSettings', 'boardSubtaskSettings', true]]);
  for (const id of Object.keys(CARD_ACTIONS)) assert.ok(SECTIONS.some(s => s.id === id), id);
  for (const action of Object.values(CARD_ACTIONS).flat()) {
    assert.strictEqual(action.board, true, `${action.id} is a board action`);
    for (const k of action.label) assert.ok(en[k], k);
  }
  for (const id of ['date', 'vote', 'poker', 'time', 'scrum', 'customFields']) {
    assert.deepStrictEqual(cardActionsOf(id), [], `negative: ${id} has no action in Card Settings`);
  }
  const tplOf = name => sidebarJade.slice(sidebarJade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
  const sectionMenu = tplOf('cardSettingsSectionPopup');
  assert.match(sectionMenu, /each action in sectionActions\n\s+li\n\s+a\.js-card-settings-action\(data-action="\{\{action\.id\}\}"\)/);
  assert.match(sidebarJs, /sectionActions\(\) \{ return sectionCardActionsOf\(this\.sectionId\); \},/);
  // For a board admin only, and nothing card-only is left in the handler.
  assert.match(sidebarJs, /\.filter\(action => action\.board && mayBoard\)/);
  const click = sidebarJs.slice(sidebarJs.indexOf("'click .js-card-settings-action'(evt) {"));
  const handler = click.slice(0, click.indexOf('\n  },\n'));
  // Opened as a layer on top of Card Settings, which stays visible under it
  // (client/lib/popup.js `layer`), not in its place - a deliberate change.
  assert.match(handler, /if \(!action \|\| !action\.board \|\| !\(Utils\.canModifyBoard && Utils\.canModifyBoard\(\)\)\) return;\n\s+Popup\.open\(action\.popup, \{ layer: true \}\)\(evt\);/);
  assert.ok(!/filterSubtasksOf|settingsCard|dataContext: card/.test(sidebarJs), 'negative: Card Settings has no card path left');
});

test('the opened card\'s hamburgers keep the card\'s own actions (negative: a new one fails here)', () => {
  const HAMBURGERS = ['js-open-subtasks-menu', 'js-open-custom-fields-settings', 'js-section-edit-voting',
    'js-section-edit-poker', 'js-section-spent-time', 'js-section-card-kind'];
  const found = new Set([
    ...[...jade.matchAll(/menuClass="([\w-]+)"/g)].map(m => m[1]),
    ...[...jade.matchAll(/a\.card-details-section-menu\.([\w-]+)/g)].map(m => m[1]),
  ]);
  assert.deepStrictEqual([...found].sort(), HAMBURGERS.sort(), 'a new card hamburger: decide whether a board setting of it belongs in Card Settings');
  assert.match(js, /'click \.js-open-custom-fields-settings'\(event\) \{[\s\S]{0,120}Popup\.open\('cardCustomFields'\)/);
  assert.match(js, /'click \.js-open-subtask-settings'\(event\) \{\n\s+event\.preventDefault\(\);\n\s+Popup\.open\('boardSubtaskSettings'\)/);
  // The board's Subtask settings: the same popup from the card and from Card Settings.
  assert.strictEqual(cardActionsOf('subtasks')[0].popup, 'boardSubtaskSettings');
  // Saved in their own popup, it steps back.
  assert.match(read('client/lib/popupBack.js'), /export function backIfOwnPopup\(evt, popupName\)/);
  assert.match(js, /backIfOwnPopup\(evt, 'cardStartVotingPopup'\);/);
  assert.match(js, /backIfOwnPopup\(event, 'cardKindPopup'\);/);
});

test('Filter: Subtasks is one function, wherever it is clicked', () => {
  const lib = read('client/lib/filterSubtasks.js');
  assert.match(lib, /export function filterSubtasksOf\(card\)/);
  assert.match(lib, /if \(!card \|\| !card\._id \|\| card\.boardId !== Session\.get\('currentBoard'\)\) return;/, 'negative: not for a card of another board');
  assert.match(lib, /Filter\.parentId\.add\(card\._id\);/);
});

console.log(`cardSectionActions: ${passed} passed`);
