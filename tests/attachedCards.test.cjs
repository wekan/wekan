'use strict';

// #3257: a card attached to another card (Trello's card attachments).
// models/lib/attachedCards.js, server/models/attachedCards.js, the Trello and
// WeKan importers and the attachments UI. Server test:
// server/lib/tests/attachedCards.tests.js; browser test:
// tests/playwright/specs/attached-cards.e2e.js.
// Run: node tests/attachedCards.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lib = require('../models/lib/attachedCards');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

console.log('attachedCards:');

test('the stored list holds ids once, never the card itself, and is capped', () => {
  assert.deepEqual(lib.normalizeAttachedCardIds(['a1', 'b2', 'a1', 'self', '', null, 'bad id', '$where'], 'self'), ['a1', 'b2']);
  const many = Array.from({ length: lib.MAX_ATTACHED_CARDS + 20 }, (_, i) => `c${i}`);
  assert.equal(lib.normalizeAttachedCardIds(many).length, lib.MAX_ATTACHED_CARDS);
  assert.deepEqual(lib.normalizeAttachedCardIds(undefined), []);
});

test('a pasted WeKan card link or a card id names the card; anything else does not', () => {
  assert.equal(lib.attachedCardIdFrom('https://wekan.example/b/BOARD1/my-board/CARD123'), 'CARD123');
  assert.equal(lib.attachedCardIdFrom('/b/BOARD1/my-board/CARD123#comment-xyz'), 'CARD123');
  assert.equal(lib.attachedCardIdFrom('  CARD123  '), 'CARD123');
  // Negative: prose, another site's link, a selector.
  assert.equal(lib.attachedCardIdFrom('fix the pump'), null);
  assert.equal(lib.attachedCardIdFrom('https://example.com/some/page'), null);
  assert.equal(lib.attachedCardIdFrom('{"$ne":1}'), null);
  assert.equal(lib.attachedCardIdFrom(''), null);
});

test('a Trello card link gives its short link; other links and Trello boards do not', () => {
  assert.equal(lib.trelloCardShortLink('https://trello.com/c/AbC12345/12-order-pump'), 'AbC12345');
  assert.equal(lib.trelloCardShortLink('https://trello.com/c/AbC12345'), 'AbC12345');
  assert.equal(lib.trelloCardShortLink('https://trello.com/b/AbC12345/board'), null, 'a board, not a card');
  assert.equal(lib.trelloCardShortLink('https://evil.example/trello.com/c/AbC12345'), null);
  assert.equal(lib.trelloCardShortLink('https://trello.com.evil.example/c/AbC12345'), null);
});

test('Trello card attachments resolve to the cards of the same export; the rest stay links', () => {
  const trelloCards = [{ id: 't1', shortLink: 'Short001' }, { id: 't2', shortLink: 'Short002' }];
  const cardIds = { t1: 'w1', t2: 'w2' };
  const { attach, unresolved } = lib.resolveTrelloCardAttachments(trelloCards, cardIds, [
    { cardId: 'w1', shortLink: 'Short002', url: 'https://trello.com/c/Short002' },
    { cardId: 'w1', shortLink: 'Short002', url: 'https://trello.com/c/Short002/again' },
    { cardId: 'w1', shortLink: 'Elsewhere', url: 'https://trello.com/c/Elsewhere' },
    { cardId: 'w2', shortLink: 'Short002', url: 'https://trello.com/c/Short002' },
  ]);
  assert.deepEqual(attach, { w1: ['w2'] }, 'once each, and never a card to itself');
  assert.deepEqual(unresolved.map(u => [u.cardId, u.url]), [
    ['w1', 'https://trello.com/c/Elsewhere'], ['w2', 'https://trello.com/c/Short002'],
  ]);
});

test('a WeKan import keeps the attached cards that came with it, under their new ids', () => {
  assert.deepEqual(lib.remapAttachedCardIds(['old1', 'old2', 'gone'], { old1: 'new1', old2: 'new2' }, 'new9'), ['new1', 'new2']);
  assert.deepEqual(lib.remapAttachedCardIds(['old1'], { old1: 'new1' }, 'new1'), [], 'negative: not itself');
});

test('attaching needs edit rights on the card and read rights on the attached one', () => {
  const server = read('server/models/attachedCards.js');
  assert.match(server, /async attachCardToCard\(cardId, target\) \{[\s\S]*?const card = await editableCard\(this\.userId, cardId\);[\s\S]*?if \(!\(await readableCard\(this\.userId, targetId\)\)\) throw new Meteor\.Error\('attach-card-not-found'/);
  assert.match(server, /async detachCardFromCard\(cardId, targetId\) \{[\s\S]*?await editableCard\(this\.userId, cardId\);/);
  assert.match(server, /canEditCardOrLinkedCard\(userId, card, board\)/);
  // Reading: the board's read rule and the assigned-only narrowing.
  assert.match(server, /canReadBoard\(userId, board\)/);
  assert.match(server, /assignedOnlyCardScope\(board, userId\)/);
  // Negative: an attached card the viewer cannot read shows no title.
  assert.match(server, /if \(!found\) \{ out\.push\(\{ cardId: id, unavailable: true \}\); continue; \}/);
  assert.match(server, /const source = await readableCard\(this\.userId, cardId\);\s*if \(!source\) throw notAuthorized\(\);/);
  assert.match(read('server/imports.js'), /import '\/server\/models\/attachedCards';/);
  assert.match(read('models/cards.js'), /attachedCardIds: \{[\s\S]*?type: Array,[\s\S]*?'attachedCardIds\.\$': \{\s*type: String,/);
});

test('the importers carry attached cards: Trello resolves its card links, WeKan remaps ids', () => {
  const trello = read('models/trelloCreator.js');
  assert.match(trello, /const shortLink = !att\.file && !att\.zipEntryKey \? trelloCardShortLink\(att\.url\) : null;/);
  assert.match(trello, /await this\.attachImportedCards\(trelloCards\);\s*return result;/);
  assert.match(trello, /resolveTrelloCardAttachments\(trelloCards, this\.cards, this\.pendingCardAttachments\)/);
  const wekan = read('models/wekanCreator.js');
  assert.match(wekan, /\{ method: 'createAttachedCards', source: 'cards' \},/);
  assert.match(wekan, /remapAttachedCardIds\(card\.attachedCardIds, this\.cards, newCardId\)/);
});

test('the attachments show attached cards, add them from the popup and remove them', () => {
  const jade = read('client/components/cards/attachments.jade');
  assert.match(jade, /a\.js-attach-card \{\{_ 'attach-card'\}\}/);
  assert.match(jade, /template\(name="attachCardPopup"\)/);
  assert.match(jade, /each attachedCards/);
  assert.match(jade, /if canModifyCard\s*\n\s*a\.js-detach-card/);
  const js = read('client/components/cards/attachments.js');
  assert.match(js, /Meteor\.call\('attachedCardsInfo', cardId,/);
  assert.match(js, /Meteor\.call\('attachCardToCard', cardId, String\(target \|\| ''\),/);
  assert.match(js, /Meteor\.call\('detachCardFromCard', cardId,/);
  // The title search is matched as text (tests/incompleteEscaping.test.cjs).
  assert.match(js, /title: \{ \$regex: escapeForRegExp\(query\), \$options: 'i' \}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['attach-card', 'attach-card-hint', 'attached-card-unavailable', 'detach-card',
    'attach-card-self', 'attach-card-limit', 'attach-card-not-found']) assert.ok(en[key], key);
});

console.log(`\nattachedCards: ${passed} tests passed`);
