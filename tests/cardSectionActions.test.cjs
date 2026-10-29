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
//
// Also 2026-10-28: the opened card draws Card Settings' sections, so Vote and
// Poker are a template each (cardFieldSectionVote/Poker), Spent time is under
// Time, the Scrum fields are ONE section template; and a Card Settings
// hamburger opens its content in a panel under its line (sidebar.jade
// cardSettingsInlinePanel) - the Subtask settings themselves, drawn there -
// instead of a popup layer.
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
  const vote = template('cardFieldSectionVote');
  const poker = template('cardFieldSectionPoker');
  // Voting and Planning Poker have the card's shared section heading now, its
  // hamburger the heading's menu - one heading, with or without a question (a
  // deliberate change: they had a heading of their own, written twice).
  assert.strictEqual((vote.match(/menuClass="js-section-edit-voting" menuTitle="card-edit-voting"/g) || []).length, 1, 'Voting, with or without a question');
  assert.strictEqual((poker.match(/menuClass="js-section-edit-poker" menuTitle="card-edit-planning-poker"/g) || []).length, 1, 'Planning Poker, with or without a question');
  assert.ok(!/a\.card-details-section-menu\.js-section-edit-(voting|poker)/.test(vote + poker), 'negative: no second, hand-written hamburger');
  assert.match(js, /'click \.js-section-edit-voting': Popup\.open\('cardStartVoting'\),/);
  assert.match(js, /'click \.js-section-edit-poker': Popup\.open\('cardStartPlanningPoker'\),/);
  assert.strictEqual((template('cardFieldSectionTime').match(/\+cardSpentTimeMenu/g) || []).length, 2, 'Spent time, overtime or not');
  assert.match(template('cardSpentTimeMenu'), /a\.card-details-section-menu\.js-section-spent-time/);
  assert.match(js, /'click \.js-section-spent-time': Popup\.open\('editCardSpentTime'\),/);
  assert.match(template('cardFieldSectionScrum'), /\+cardSectionHeader\(section="scrum" icon="fa-repeat" label="scrum-settings" menuClass="js-section-card-kind" menuTitle="cardKindPopup-title"\)/);
  assert.match(js, /'click \.js-section-card-kind'\(event\) \{[\s\S]{0,120}Popup\.open\('cardKind'\)\.call\(Utils\.getCurrentCard\(\), event\);/);
  // Only who may change the card gets the editing hamburgers.
  assert.match(vote, /if canModifyCard\n\s+\+cardSectionHeader\(section="vote" icon="fa-thumbs-up" label="vote-question" menuClass="js-section-edit-voting"/);
  assert.match(poker, /if canModifyCard\n\s+\+cardSectionHeader\(section="poker" icon="fa-check-square" label="poker-question" menuClass="js-section-edit-poker"/);
  assert.match(template('cardSpentTimeMenu'), /if canModifyCard\n\s+a\.card-details-section-menu\.js-section-spent-time/);
});

test('the Scrum fields are one section under one heading, its fields without the prefix', () => {
  // One template, the fields the board shows in their row order (#6830).
  const scrum = template('cardFieldSectionScrum');
  assert.match(scrum, /if isSectionOpen "scrum"\n\s+each field in orderedScrumFields\n\s+if \$eq field "scrumSprint"\n\s+\+scrumMetadata\(kind="card" record=this field="Sprint"\)/);
  assert.match(js, /Template\.registerHelper\('orderedScrumFields', function orderedScrumFields\(\) \{[\s\S]{0,160}\.filter\(key => boardAllows\(board, key\)\)/);
  assert.ok(!js.includes('firstScrumSection'), 'negative: no heading placed by the first Scrum field any more');
});

test('Card Settings: only the board\'s actions, in the hamburger of their section', () => {
  assert.deepStrictEqual(Object.keys(CARD_ACTIONS), ['subtasks']);
  // The settings themselves, drawn in the hamburger's panel (2026-10-28).
  assert.deepStrictEqual(cardActionsOf('subtasks').map(a => [a.id, a.template, a.board]), [['subtaskSettings', 'boardSubtaskSettingsBody', true]]);
  for (const id of Object.keys(CARD_ACTIONS)) assert.ok(SECTIONS.some(s => s.id === id), id);
  for (const action of Object.values(CARD_ACTIONS).flat()) {
    assert.strictEqual(action.board, true, `${action.id} is a board action`);
    for (const k of action.label) assert.ok(en[k], k);
  }
  for (const id of ['date', 'vote', 'poker', 'time', 'scrum', 'customFields']) {
    assert.deepStrictEqual(cardActionsOf(id), [], `negative: ${id} has no action in Card Settings`);
  }
  const tplOf = name => sidebarJade.slice(sidebarJade.indexOf(`template(name="${name}")`)).split('\ntemplate(')[0];
  const sectionMenu = tplOf('cardSettingsInlinePanel');
  assert.match(sectionMenu, /each action in sectionActions\n\s+\.card-settings-section-action\.js-card-settings-panel-own-handlers\(data-action="\{\{action\.id\}\}"\)[\s\S]{0,240}\+Template\.dynamic\(template=action\.template\)/);
  assert.match(sidebarJs, /sectionActions\(\) \{ return sectionCardActionsOf\(this\.sectionId\); \},/);
  // For a board admin only.
  assert.match(sidebarJs, /\.filter\(action => action\.board && mayBoard\)/);
  // Negative: no popup of an action, layer or not.
  assert.ok(!sidebarJs.includes("'click .js-card-settings-action'"), 'no action link opening a popup');
  assert.ok(!/layer: true/.test(sidebarJs));
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
  // The board's Subtask settings: the same template from the card (its
  // popup, boardSubtaskSettingsPopup draws the body) and in Card Settings.
  assert.strictEqual(cardActionsOf('subtasks')[0].template, 'boardSubtaskSettingsBody');
  assert.match(sidebarJade, /template\(name="boardSubtaskSettingsPopup"\)\n\s+\+boardSubtaskSettingsBody/);
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
