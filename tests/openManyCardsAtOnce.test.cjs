'use strict';

// #6531: "click on another card doesn't close last opened card".
//
// Clicking a card APPENDED it to the open-cards list, so the card that was already
// open stayed open behind the new one - and dragging the new one revealed it. That
// is not what clicking another card means.
//
// A click now opens THAT card and closes the previous one, and keeping several open
// is a per-user setting - Member Settings / "Open many cards at once" - which is off
// by default.
//
// The behaviour itself is a two-line decision, so it is tested as behaviour (a
// replay of the helper) plus source guards that the setting is wired end to end:
// schema, helper, server method, menu entry and translation.
//
// Run: node tests/openManyCardsAtOnce.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('openManyCardsAtOnce:');

// A replay of openCardWindow() from client/components/lists/listBody.js.
function openCardWindow(openCards, cardId, many) {
  if (!many) return [cardId];
  return openCards.includes(cardId) ? openCards : [...openCards, cardId];
}

test('by default, opening a card closes the one that was open', () => {
  assert.deepStrictEqual(openCardWindow([], 'a', false), ['a']);
  assert.deepStrictEqual(openCardWindow(['a'], 'b', false), ['b'], 'a closes when b opens');
  // …including when the same card is clicked again: still exactly one open.
  assert.deepStrictEqual(openCardWindow(['b'], 'b', false), ['b']);
  assert.deepStrictEqual(openCardWindow(['a', 'b', 'c'], 'd', false), ['d'],
    'whatever was left open from an earlier session of the setting is closed too');
});

test('with the setting on, every clicked card stays open', () => {
  assert.deepStrictEqual(openCardWindow([], 'a', true), ['a']);
  assert.deepStrictEqual(openCardWindow(['a'], 'b', true), ['a', 'b']);
  // A card that is already open is not opened twice - two windows of one card.
  assert.deepStrictEqual(openCardWindow(['a', 'b'], 'b', true), ['a', 'b']);
});

test('the board uses that one helper for every way of opening a card', () => {
  // The title click and the minicard click each had their own copy of the append;
  // one of them alone would have left the bug in place on the other path.
  const src = read('client/components/lists/listBody.js');
  assert.ok(/function openCardWindow\(cardId\)/.test(src), 'the decision lives in one place');
  assert.strictEqual((src.match(/openCardWindow\(card\._id\)/g) || []).length, 2,
    'both card-opening paths go through it');
  assert.ok(!/Session\.set\('openCards', \[\.\.\.openCards, card\._id\]\)/.test(src),
    'no path appends behind the setting\'s back any more');
});

test('the default is OFF - the setting only ever adds the old behaviour back', () => {
  const src = read('client/components/lists/listBody.js');
  const fn = src.slice(src.indexOf('function openCardWindow('));
  assert.ok(/hasOpenManyCardsAtOnce/.test(fn), 'it reads the user preference');
  assert.ok(/if \(!many\) \{\s*\n\s*Session\.set\('openCards', \[cardId\]\);/.test(fn),
    'and without it, the list holds exactly the clicked card');
  // A missing user (not logged in) must behave as the default, not throw.
  assert.ok(/!!\(user && user\.hasOpenManyCardsAtOnce/.test(fn),
    'a logged-out reader gets the default rather than an error');
});

test('the preference is stored on the user, with a server method to flip it', () => {
  const model = read('models/users.js');
  assert.ok(/'profile\.openManyCardsAtOnce': \{/.test(model), 'schema field');
  assert.ok(/hasOpenManyCardsAtOnce\(\) \{[\s\S]*?profile\.openManyCardsAtOnce \|\| false;/.test(model),
    'helper, defaulting to false');
  const server = read('server/models/users.js');
  const method = server.slice(server.indexOf('async toggleOpenManyCardsAtOnce'));
  assert.ok(/not-logged-in/.test(method.slice(0, 400)), 'the method requires a user');
  assert.ok(/\$set: \{ 'profile\.openManyCardsAtOnce': !current \}/.test(method),
    'and toggles the stored value');
});

test('Member Settings offers it, next to the other per-user toggles', () => {
  const jade = read('client/components/users/userHeader.jade');
  const menu = jade.slice(jade.indexOf('template(name="changeSettingsPopup")'));
  assert.ok(/a\.js-toggle-open-many-cards-at-once/.test(menu), 'the entry is there');
  assert.ok(/if isOpenManyCardsAtOnce\s*\n\s*i\.fa\.fa-check/.test(menu),
    'with a check mark when it is on');
  const js = read('client/components/users/userHeader.js');
  assert.ok(/isOpenManyCardsAtOnce\(\) \{[\s\S]*?hasOpenManyCardsAtOnce\(\)/.test(js),
    'the helper behind that check mark');
  assert.ok(/'click \.js-toggle-open-many-cards-at-once'\(\) \{[\s\S]*?Meteor\.call\('toggleOpenManyCardsAtOnce'\)/.test(js),
    'and the click calls the method');
});

test('it is translated, label and explanation', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(typeof en['open-many-cards-at-once'], 'string');
  assert.ok(en['open-many-cards-at-once-description'].includes('closes the one that was open'),
    'the description says what OFF does, which is the default');
});

console.log(`\n${passed} tests passed`);
