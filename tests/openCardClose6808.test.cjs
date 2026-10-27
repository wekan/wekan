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
const created = details.slice(details.indexOf('Template.cardDetails.onCreated('), details.indexOf('// #6686: a sub-popup opened from this card'));

test('the window asks the server and closes only on its no, if Minimongo still agrees', () => {
  assert.match(created, /connected: Meteor\.status\(\)\.connected,\n\s+loggingIn: Meteor\.loggingIn\(\),/);
  assert.match(created, /if \(decision !== 'confirm' \|\| confirming\) return;/);
  assert.match(created, /Meteor\.callAsync\('cards\.openCardAvailable', openedCardId, openedBoardId\)/);
  const then = created.slice(created.indexOf('.then(available => {'), created.indexOf('.catch('));
  assert.match(then, /if \(available \|\| this\.view\.isDestroyed\) return;/);
  assert.match(then, /if \(!openCardIsUnavailable\(ReactiveCache\.getCard\(openedCardId\), openedBoardId\)\) return;\n\s+closeOpenedCard\(\);/);
  // No answer (dropped again): keep the card and ask again later.
  assert.match(created, /\.catch\(\(\) => \{[\s\S]{0,200}confirming = false;\n\s+\}\);/);
  const catchBlock = created.slice(created.indexOf('.catch('), created.indexOf('});', created.indexOf('.catch(')));
  assert.ok(!/closeOpenedCard/.test(catchBlock), 'negative: an error never closes the card');
});

test('negative: nothing closes the opened card on Minimongo\'s word alone', () => {
  // The one closer is closeOpenedCard, and only the server's answer calls it.
  assert.strictEqual((created.match(/closeOpenedCard\(\)/g) || []).length, 1);
  const decisionAt = created.indexOf('openCardCloseDecision({');
  const closeAt = created.indexOf('closeOpenedCard();');
  const askAt = created.indexOf("Meteor.callAsync('cards.openCardAvailable'");
  assert.ok(decisionAt !== -1 && decisionAt < askAt && askAt < closeAt);
  // And no other autorun in the client closes a card because it is missing.
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of walk('client')) {
    const src = read(file);
    for (const m of src.matchAll(/openCardIsUnavailable\(/g)) {
      const before = src.slice(Math.max(0, m.index - 400), m.index);
      assert.ok(file.endsWith('cardDetails.js') && /\.then\(available => \{/.test(before) || /require\(/.test(src.slice(m.index - 60, m.index)) || /const \{ openCardIsUnavailable/.test(src.slice(m.index - 20, m.index)),
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
