'use strict';

// #6808: a card opened from its link vanished as the page finished loading -
// behind a reverse proxy, where the DDP connection drops and comes back while
// the page loads. Every subscription re-runs on the way back, one answers
// before the resumed login with nothing, and the card leaves Minimongo for a
// moment; #3114's close-on-removal took that moment for a deletion, closed the
// card and went to the board's address. The window now closes only when
// everything has settled AND the server confirms the card is gone.
// Run: node tests/openCardClose6808.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { openCardCloseDecision, openCardIsUnavailable } = require('../models/lib/openCardPresence');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('openCardClose6808:');

const settled = { subReady: true, connected: true, loggingIn: false, openedBoardId: 'b1' };
const here = { _id: 'c1', boardId: 'b1' };

test('the reporter\'s load: while the connection or the login is settling, the card is kept', () => {
  // The moment the card is missing because a re-run answered before the login.
  assert.strictEqual(openCardCloseDecision({ ...settled, card: undefined, loggingIn: true }), 'wait');
  assert.strictEqual(openCardCloseDecision({ ...settled, card: undefined, connected: false }), 'wait');
  assert.strictEqual(openCardCloseDecision({ ...settled, card: undefined, subReady: false }), 'wait');
  // And when it is back, it stays.
  assert.strictEqual(openCardCloseDecision({ ...settled, card: here }), 'keep');
  assert.strictEqual(openCardCloseDecision({ ...settled, card: here, loggingIn: true }), 'keep');
});

test('#3114 still closes a card that is gone, after the server confirms', () => {
  assert.strictEqual(openCardCloseDecision({ ...settled, card: undefined }), 'confirm', 'deleted or archived elsewhere');
  assert.strictEqual(openCardCloseDecision({ ...settled, card: { _id: 'c1', boardId: 'b2' } }), 'confirm', 'moved to another board');
  assert.strictEqual(openCardCloseDecision({ ...settled, card: here, openedBoardId: null }), 'confirm');
  assert.strictEqual(openCardIsUnavailable(undefined, 'b1'), true);
});

const details = read('client/components/cards/cardDetails.js');
const confirm = details.slice(details.indexOf('function confirmGoneCard('), details.indexOf('Template.cardDetails.onCreated('));
const created = details.slice(details.indexOf('Template.cardDetails.onCreated('), details.indexOf('// #6686: a sub-popup opened from this card'));
const destroyed = details.slice(details.indexOf('Template.cardDetails.onDestroyed('), details.indexOf('const boardBody = getBoardBodyInstance();', details.indexOf('Template.cardDetails.onDestroyed(')));

test('the window asks the server once settled, and closes only on its no, if Minimongo still agrees', () => {
  assert.match(created, /connected: Meteor\.status\(\)\.connected,\n\s+loggingIn: Meteor\.loggingIn\(\),/);
  assert.match(created, /if \(decision === 'confirm'\) confirmGoneCard\(openedCardId, openedBoardId\);/);
  // The question waits for a settled connection and login, then is asked once.
  assert.match(confirm, /if \(!Meteor\.status\(\)\.connected \|\| Meteor\.loggingIn\(\)\) return;\n\s+computation\.stop\(\);\n\s+Meteor\.callAsync\('cards\.openCardAvailable', cardId, boardId\)/);
  const then = confirm.slice(confirm.indexOf('.then(available => {'), confirm.indexOf('.catch('));
  assert.match(then, /if \(available\) return;/);
  assert.match(then, /if \(!openCardIsUnavailable\(ReactiveCache\.getCard\(cardId\), boardId\)\) return;\n\s+closeGoneCard\(cardId, boardId\);/);
  const catchBlock = confirm.slice(confirm.indexOf('.catch('));
  assert.ok(!/closeGoneCard/.test(catchBlock), 'negative: an error never closes the card');
});

test('a deleted card is still closed - and its address left - when its window is already gone', () => {
  // Found by the browser test: the window is destroyed with its data, before
  // the answer; the close and the step back from the card's address must
  // still happen. So the question lives outside the window, and the window's
  // end asks it too.
  assert.match(confirm, /Tracker\.nonreactive\(\(\) => Tracker\.autorun\(computation => \{/);
  assert.ok(!/isDestroyed/.test(confirm + created), 'negative: no answer is dropped because the window is gone');
  assert.match(destroyed, /openCardIsUnavailable\(ReactiveCache\.getCard\(this\.openedCardId\), this\.openedBoardId\)\) \{\n\s+confirmGoneCard\(this\.openedCardId, this\.openedBoardId\);/);
  assert.match(details, /const routeCardId = FlowRouter\.current\(\)\?\.params\?\.cardId;\n\s+if \(routeCardId === cardId\) \{\n\s+Utils\.goBoardId\(boardId\);/);
});

test('negative: nothing closes the opened card on Minimongo\'s word alone', () => {
  // The one closer is closeGoneCard, and only the server's answer calls it.
  assert.strictEqual((details.match(/closeGoneCard\(cardId, boardId\);/g) || []).length, 1);
  assert.strictEqual((details.match(/closeGoneCard\(/g) || []).length, 2, 'its definition and that one call');
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of walk('client')) {
    const src = read(file);
    for (const m of src.matchAll(/openCardIsUnavailable\(/g)) {
      const before = src.slice(Math.max(0, m.index - 300), m.index);
      const ok = file.endsWith('cardDetails.js')
        && (/\.then\(available => \{/.test(before) || /onDestroyed\(function/.test(before) || /\n\s+if \(this\.openedCardId && this\.openedBoardId\n\s+&& $/.test(before));
      assert.ok(ok || /require\(/.test(src.slice(m.index - 60, m.index)) || /const \{ openCardIsUnavailable/.test(src.slice(m.index - 20, m.index)),
        `${file}: openCardIsUnavailable used outside the server-confirmed close`);
    }
  }
});

test('the server answers with the \'card\' publication\'s own rule - one function for both', () => {
  const access = read('server/lib/openCardAccess.js');
  assert.match(access, /export async function readableCard\(userId, cardId\)/);
  assert.match(access, /if \(!board \|\| !board\.isVisibleBy\(\{ _id: userId \}\)\) return null;/);
  assert.match(access, /member\.isNormalAssignedOnly \|\| member\.isCommentAssignedOnly \|\| member\.isReadAssignedOnly/);
  const pub = read('server/publications/cards.js');
  const cardPub = pub.slice(pub.indexOf("Meteor.publish('card',"), pub.indexOf('// Live children'));
  assert.match(cardPub, /const card = await readableCard\(this\.userId, cardId\);\n\s+if \(!card\) return \[\];/);
  assert.ok(!/isVisibleBy|isNormalAssignedOnly/.test(cardPub), 'negative: no second copy of the rule in the publication');
  const method = read('server/methods/openCardAvailability.js');
  assert.match(method, /async 'cards\.openCardAvailable'\(cardId, boardId\) \{\n\s+check\(cardId, String\);\n\s+check\(boardId, String\);/);
  assert.match(method, /return Boolean\(card && card\.boardId === boardId\);/);
  assert.ok(!/return card\b|return \{/.test(method), 'negative: a yes or a no, nothing of the card');
  assert.match(method, /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'cards\.openCardAvailable'/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/openCardAvailability';/);
});

console.log(`openCardClose6808: ${passed} passed`);
