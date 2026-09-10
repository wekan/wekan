'use strict';

// Regression guard: clicking a minicard could throw "No such function:
// isDateFormat" (or any of the eleven other helpers fixed alongside it) and
// leave the card popup half-rendered - or not open at all - because a
// TEMPLATE-LOCAL Blaze helper (Template.cardDetails.helpers) was used from a
// DIFFERENT template. cardDetails.jade was split into cardFieldSectionLabels/
// Dates/Members/DependenciesAndSort/CustomFields/VoteAndPoker - each its own
// `template(name=...)` block - and cardDetailsActionsPopup and
// activities.jade are separate templates entirely; a helper only registered
// on Template.cardDetails is invisible there. Blaze only surfaces this at
// the moment that piece of UI actually renders, so it compiled fine, passed
// every existing test, and only broke in the browser.
//
// This is a source-read test (no Meteor/Blaze runtime available under plain
// Node): it checks the SHAPE directly - each of these names must be
// registered with Template.registerHelper (global, visible everywhere), not
// buried inside a single template's own .helpers({...}) call.
//
// Run: node tests/cardFieldSectionHelperScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardFieldSectionHelperScope:');

test('every helper used by a cardFieldSection*/cardDetailsActionsPopup template is registered globally', () => {
  const src = fs.readFileSync(
    path.join(ROOT, 'client', 'components', 'cards', 'cardDetails.js'), 'utf8');
  const names = [
    'isDateFormat', 'canShowCustomFieldsOnCard', 'stickers', 'isWatching',
    'dueDateChangeCount', 'getLocations', 'getDependencyCards',
    'customFieldsGrid', 'showActivities', 'showVotingButtons',
    'showPlanningPokerButtons', 'currentSwimlaneListsSorted', 'isCurrentListId',
  ];
  const missing = names.filter(name =>
    !new RegExp(`Template\\.registerHelper\\(['"]${name}['"]`).test(src));
  assert.deepStrictEqual(missing, [],
    `these helpers are used outside Template.cardDetails but are not registered globally: ${missing.join(', ')}`);
});

test('none of those globally-registered names are ALSO duplicated inside Template.cardDetails.helpers '
  + '(negative - a stale local copy would shadow the global one with different behavior)', () => {
  const src = fs.readFileSync(
    path.join(ROOT, 'client', 'components', 'cards', 'cardDetails.js'), 'utf8');
  const localBlockStart = src.indexOf('Template.cardDetails.helpers({');
  assert.ok(localBlockStart !== -1, 'Template.cardDetails.helpers({...}) must still exist');
  // The local block is the LAST top-level construct of its kind in this
  // file; slice to the matching close by counting braces from its opening.
  let depth = 0;
  let end = localBlockStart;
  for (let i = src.indexOf('{', localBlockStart); i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  const localBlock = src.slice(localBlockStart, end);
  const globalNames = [
    'isDateFormat', 'canShowCustomFieldsOnCard', 'stickers', 'isWatching',
    'dueDateChangeCount', 'getLocations', 'getDependencyCards',
    'customFieldsGrid', 'showActivities', 'showVotingButtons',
    'showPlanningPokerButtons', 'currentSwimlaneListsSorted', 'isCurrentListId',
  ];
  const shadowed = globalNames.filter(name =>
    new RegExp(`^\\s*${name}\\s*\\(`, 'm').test(localBlock));
  assert.deepStrictEqual(shadowed, [],
    `these globally-registered helpers are ALSO defined inside Template.cardDetails.helpers, `
    + `shadowing the global one for cardDetails itself: ${shadowed.join(', ')}`);
});

test('cardFieldSectionDates.jade\'s date-format selector still calls isDateFormat', () => {
  const jade = fs.readFileSync(
    path.join(ROOT, 'client', 'components', 'cards', 'cardDetails.jade'), 'utf8');
  assert.ok(/isDateFormat 'YYYY-MM-DD'/.test(jade));
});

console.log(`\ncardFieldSectionHelperScope: ${passed} tests passed`);
